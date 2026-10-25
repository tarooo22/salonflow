import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerStorageProxy } from "./storageProxy";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { registerPublicSeoRoutes } from "../publicSeo";
import { securityHeaders } from "./securityHeaders";
import { AUTH_PROCEDURES, PUBLIC_BOOKING_WRITE_PROCEDURES, rateLimit } from "./rateLimit";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  // Railway terminates TLS at its proxy; trust the first proxy for secure cookie/protocol handling.
  app.set("trust proxy", 1);
  app.disable("x-powered-by");
  app.use(securityHeaders);
  // Lightweight process-readiness endpoint for Railway and external uptime checks.
  app.get("/health", (_req, res) => {
    res.status(200).json({ ok: true, service: "salonflow" });
  });
  // Rate limits run before body parsing so rejected requests never cost a 15mb parse.
  app.use("/api", rateLimit({ windowMs: 60 * 1000, max: 300 }));
  app.use("/api", rateLimit({ windowMs: 15 * 60 * 1000, max: 10, procedures: AUTH_PROCEDURES }));
  app.use("/api", rateLimit({ windowMs: 10 * 60 * 1000, max: 20, procedures: PUBLIC_BOOKING_WRITE_PROCEDURES }));
  // Configure body parser with larger size limit for file uploads
  // Largest real body: two 5MB photos as base64 (~14MB) for a before/after set.
  app.use(express.json({ limit: "15mb" }));
  app.use(express.urlencoded({ limit: "15mb", extended: true }));
  registerStorageProxy(app);
  registerPublicSeoRoutes(app);
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
      // The rate limiter counts one HTTP request; cap how many procedures one batch can carry (client sends ≤20).
      maxBatchSize: 20,
      // Never log params: Drizzle query errors embed bound values (personal data).
      onError: ({ path, error }) => console.error("[trpc]", path, error.code, error.message.startsWith("Failed query") ? "db query failed" : error.message),
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = Number.parseInt(process.env.PORT || "3000", 10);
  const isDevelopment = process.env.NODE_ENV === "development";
  // In production, never move away from the platform-assigned port.
  // The development fallback keeps local HMR resilient when port 3000 is occupied.
  const port = isDevelopment ? await findAvailablePort(preferredPort) : preferredPort;
  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }
  server.listen(port, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${port}/`);
  });
}

startServer().catch(console.error);
