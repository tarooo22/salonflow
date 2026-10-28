import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const projectRoot = resolve(import.meta.dirname, "..");
const railwayConfig = readFileSync(resolve(projectRoot, ".railway/railway.ts"), "utf8");
const entrypoint = readFileSync(resolve(projectRoot, "server/_core/index.ts"), "utf8");
const packageJson = JSON.parse(readFileSync(resolve(projectRoot, "package.json"), "utf8")) as {
  scripts: Record<string, string>;
};

describe("Railway deployment readiness", () => {
  it("keeps Railway config aligned with the production build and start scripts", () => {
    expect(railwayConfig).toContain('builder: "RAILPACK"');
    expect(railwayConfig).toContain('buildCommand: "pnpm run build"');
    expect(railwayConfig).toContain('start: "pnpm run start"');
    expect(railwayConfig).toContain('healthcheck: "/health"');
    expect(packageJson.scripts.build).toContain("vite build");
    expect(packageJson.scripts.start).toContain("node dist/index.js");
  });

  it("exposes a platform health endpoint and binds production to the assigned port", () => {
    expect(entrypoint).toContain('app.get("/health"');
    expect(entrypoint).toContain('server.listen(port, "0.0.0.0"');
    expect(entrypoint).toContain('process.env.PORT || "3000"');
    expect(entrypoint).toContain("isDevelopment ? await findAvailablePort(preferredPort) : preferredPort");
    expect(entrypoint).toContain('app.set("trust proxy", 1)');
  });
});
