import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("PWA configuration", () => {
  it("declares an installable manifest and never caches authenticated API responses", () => {
    const manifest = JSON.parse(readFileSync(resolve(process.cwd(), "client/public/manifest.webmanifest"), "utf8"));
    const serviceWorker = readFileSync(resolve(process.cwd(), "client/public/service-worker.js"), "utf8");

    expect(manifest.name).toContain("SalonFlow");
    expect(manifest.display).toBe("standalone");
    expect(manifest.icons[0].src).toContain("/manus-storage/");
    expect(serviceWorker).toContain('url.pathname.startsWith("/api/")');
    expect(serviceWorker).not.toContain("caches.match(request)");
  });
});
