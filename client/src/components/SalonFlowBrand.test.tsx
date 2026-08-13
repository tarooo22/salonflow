import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { SalonFlowBrand } from "./SalonFlowBrand";

describe("SalonFlowBrand", () => {
  it("renders the calendar-care brand mark and wordmark", () => {
    const markup = renderToStaticMarkup(<SalonFlowBrand />);
    expect(markup).toContain("Salon");
    expect(markup).toContain("Flow");
    expect(markup).toContain("aria-hidden=\"true\"");
  });

  it("supports a compact mark for collapsed navigation", () => {
    const markup = renderToStaticMarkup(<SalonFlowBrand compact />);
    expect(markup).not.toContain("Salon</span>");
  });
});
