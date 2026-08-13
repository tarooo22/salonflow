import { renderToStaticMarkup } from "react-dom/server";
import React from "react";
import { describe, expect, it } from "vitest";
import { RouteLoadingFallback } from "./App";

describe("RouteLoadingFallback", () => {
  it("announces a Georgian loading state while a route chunk is requested", () => {
    const markup = renderToStaticMarkup(<RouteLoadingFallback />);
    expect(markup).toContain("SalonFlow იტვირთება…");
    expect(markup).toContain('role="status"');
    expect(markup).toContain('aria-busy="true"');
  });
});
