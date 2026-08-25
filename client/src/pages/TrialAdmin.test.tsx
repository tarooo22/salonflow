import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(new URL("./TrialAdmin.tsx", import.meta.url), "utf8");

describe("trial admin review controls", () => {
  it("retains visible approval confirmation and searchable/filterable queue controls", () => {
    expect(source).toContain("7-დღიანი საცდელი წვდომა წარმატებით გააქტიურდა.");
    expect(source).toContain("aria-live=\"polite\"");
    expect(source).toContain("trial-request-search");
    expect(source).toContain("ფილტრების გასუფთავება");
    expect(source).toContain("search: deferredSearch || undefined");
  });

  it("redirects non-admin users before rendering any platform-admin content", () => {
    expect(source).toContain('user.role !== "admin") setLocation("/app/today")');
    expect(source).toContain('if (loading || !user || user.role !== "admin") return');
    expect(source).toContain("თქვენს სამუშაო სივრცეში გადამისამართება…");
  });
});
