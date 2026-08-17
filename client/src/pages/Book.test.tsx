import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { DiscoveryResults, filterLocationsByCategory, workingHoursSummary } from "./Book";

vi.mock("wouter", () => ({ Link: ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a> }));

describe("public discovery category filtering", () => {
  const locations = [
    { publicSlug: "gldani-beauty", name: "გლდანი", address: null, phone: "+995555111222", email: "hello@gldani.example", categories: ["თმის მოვლა", "მანიკიური"], workingHours: [{ weekday: 0, startLocalTime: "10:00", endLocalTime: "19:00" }, { weekday: 1, startLocalTime: "10:00", endLocalTime: "19:00" }] },
    { publicSlug: "vake-beauty", name: "ვაკე", address: null, phone: null, email: null, categories: ["კოსმეტოლოგია"], workingHours: [] },
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
    expect(markup).toContain("ორშ–სამ · 10:00–19:00");
    expect(markup).toContain("დარეკვა");
    expect(markup).toContain("ელფოსტა");
    expect(markup).not.toContain("ვაკე");
  });

  it("summarizes the public working-hours context without inventing unavailable hours", () => {
    expect(workingHoursSummary(locations[0].workingHours)).toBe("ორშ–სამ · 10:00–19:00");
    expect(workingHoursSummary(locations[1].workingHours)).toBeNull();
  });

  it("renders a clear empty filtered-results state", () => {
    const markup = renderToStaticMarkup(<DiscoveryResults locations={locations} category="მასაჟი" onCategoryChange={vi.fn()} />);
    expect(markup).toContain("ამ კატეგორიის ონლაინ სერვისი ამჟამად არცერთ აქტიურ ფილიალს არ აქვს");
  });
});
