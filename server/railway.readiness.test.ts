import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const projectRoot = resolve(import.meta.dirname, "..");
const railwayConfig = JSON.parse(readFileSync(resolve(projectRoot, "railway.json"), "utf8")) as {
  build: { builder: string; buildCommand: string };
  deploy: { startCommand: string; healthcheckPath: string };
};
const entrypoint = readFileSync(resolve(projectRoot, "server/_core/index.ts"), "utf8");
const packageJson = JSON.parse(readFileSync(resolve(projectRoot, "package.json"), "utf8")) as {
  scripts: Record<string, string>;
};

describe("Railway deployment readiness", () => {
  it("keeps Railway config aligned with the production build and start scripts", () => {
    expect(railwayConfig.build.builder).toBe("RAILPACK");
    expect(railwayConfig.build.buildCommand).toBe("pnpm run build");
    expect(railwayConfig.deploy.startCommand).toBe("pnpm run start");
    expect(railwayConfig.deploy.healthcheckPath).toBe("/health");
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
