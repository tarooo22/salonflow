import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ChaweraMark } from "./ChaweraMark";
import { Ring, RING_PATHS } from "./Ring";

function stubMatchMedia(reduced: boolean) {
  vi.stubGlobal("window", { matchMedia: () => ({ matches: reduced }) });
  vi.stubGlobal("document", { documentElement: { getAttribute: () => null } });
}

afterEach(() => vi.unstubAllGlobals());

describe("Ring", () => {
  it("renders an aria-hidden svg with the wide path and pathLength 1", () => {
    const html = renderToStaticMarkup(<Ring />);
    expect(html).toContain('aria-hidden="true"');
    expect(html).toContain('data-ring="wide"');
    expect(html).toContain('viewBox="0 0 120 48"');
    expect(html).toContain('preserveAspectRatio="none"');
    expect(html).toContain(`d="${RING_PATHS.wide.d}"`);
    expect(html).toContain('pathLength="1"');
    expect(html).toContain('stroke-width="2.25"');
    expect(html).toContain('stroke-linecap="round"');
  });

  it("renders the square variant and tone classes", () => {
    const html = renderToStaticMarkup(<Ring variant="square" tone="photo" className="x" />);
    expect(html).toContain('data-ring="square"');
    expect(html).toContain('viewBox="0 0 64 64"');
    expect(html).toContain("cw-ring--photo");
    expect(html).toContain(" x");
  });

  it("adds the draw class only when draw is true", () => {
    stubMatchMedia(false);
    expect(renderToStaticMarkup(<Ring draw />)).toContain("cw-ring--draw");
    expect(renderToStaticMarkup(<Ring draw={false} />)).not.toContain("cw-ring--draw");
    expect(renderToStaticMarkup(<Ring draw={false} />)).toContain('data-state="off"');
    expect(renderToStaticMarkup(<Ring />)).toContain('data-state="static"');
  });

  it("does not animate under prefers-reduced-motion", () => {
    stubMatchMedia(true);
    const html = renderToStaticMarkup(<Ring draw />);
    expect(html).not.toContain("cw-ring--draw");
    expect(html).toContain('data-state="on"');
  });

  it("does not animate when the app's reduce-motion setting is on", () => {
    vi.stubGlobal("window", { matchMedia: () => ({ matches: false }) });
    vi.stubGlobal("document", { documentElement: { getAttribute: () => "true" } });
    expect(renderToStaticMarkup(<Ring draw />)).not.toContain("cw-ring--draw");
  });
});

describe("ChaweraMark", () => {
  it("is a decorative 24px svg", () => {
    const html = renderToStaticMarkup(<ChaweraMark />);
    expect(html).toContain('aria-hidden="true"');
    expect(html).toContain('width="24"');
    expect(html).toContain("<circle");
  });
});
