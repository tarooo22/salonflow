import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("./Clients.tsx", import.meta.url), "utf8");

describe("Clients productivity filters", () => {
  it("keeps source filtering and saved views free of raw client search payloads", () => {
    expect(source).toContain("sourceFilter");
    expect(source).toContain("PUBLIC_WEB");
    expect(source).toContain("SavedViewMenu");
    expect(source).toContain("clientSource: sourceFilter");
    expect(source).not.toContain("filterPayload={{ search");
  });
});
