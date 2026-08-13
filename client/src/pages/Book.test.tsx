import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { DiscoveryResults, filterLocationsByCategory } from "./Book";

vi.mock("wouter", () => ({ Link: ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a> }));

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

  it("renders category controls and only the selected-category location card", () => {
    const markup = renderToStaticMarkup(<DiscoveryResults locations={locations} category="თმის მოვლა" onCategoryChange={vi.fn()} />);
    expect(markup).toContain("ყველა სერვისი");
    expect(markup).toContain("თმის მოვლა");
    expect(markup).toContain("გლდანი");
    expect(markup).not.toContain("ვაკე");
  });

  it("renders a clear empty filtered-results state", () => {
    const markup = renderToStaticMarkup(<DiscoveryResults locations={locations} category="მასაჟი" onCategoryChange={vi.fn()} />);
    expect(markup).toContain("ამ კატეგორიის ონლაინ სერვისი ამჟამად არცერთ აქტიურ ფილიალს არ აქვს");
  });
});
