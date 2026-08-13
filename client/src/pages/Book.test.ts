import { describe, expect, it } from "vitest";
import { filterLocationsByCategory } from "./Book";

describe("public discovery category filtering", () => {
  const locations = [
    { publicSlug: "gldani-beauty", name: "გლდანი", address: null, categories: ["თმის მოვლა", "მანიკიური"] },
    { publicSlug: "vake-beauty", name: "ვაკე", address: null, categories: ["კოსმეტოლოგია"] },
  ];

  it("shows all active locations or only locations that truly offer the selected category", () => {
    expect(filterLocationsByCategory(locations, "ALL")).toHaveLength(2);
    expect(filterLocationsByCategory(locations, "თმის მოვლა")).toEqual([locations[0]]);
    expect(filterLocationsByCategory(locations, "მასაჟი")).toEqual([]);
  });
});
