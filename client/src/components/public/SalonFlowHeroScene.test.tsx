import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(new URL("./SalonFlowHeroScene.tsx", import.meta.url), "utf8");

describe("SalonFlowHeroScene", () => {
  it("uses an explicitly illustrative workflow rather than fabricated business proof", () => {
    expect(source).toContain("ილუსტრაციული ხედვა");
    expect(source).toContain("თქვენი მონაცემები");
    expect(source).not.toContain("₾ 1,480");
    expect(source).not.toContain("+21% თვეში");
    expect(source).not.toContain("4 სპეციალისტი");
    expect(source).not.toContain("ნინო ბერიძე");
  });
});
