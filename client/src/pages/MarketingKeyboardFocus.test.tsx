import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const catalogCss = readFileSync(new URL("../components/catalog/catalog.css", import.meta.url), "utf8");
const marketingCss = readFileSync(new URL("../components/catalog/marketing.css", import.meta.url), "utf8");
const chrome = readFileSync(new URL("../components/catalog/CatalogChrome.tsx", import.meta.url), "utf8");
const pages = {
  home: readFileSync(new URL("./Home.tsx", import.meta.url), "utf8"),
  marketing: readFileSync(new URL("./MarketingPages.tsx", import.meta.url), "utf8"),
  partner: readFileSync(new URL("./PartnerLanding.tsx", import.meta.url), "utf8"),
  auth: readFileSync(new URL("./LocalAuth.tsx", import.meta.url), "utf8"),
  notFound: readFileSync(new URL("./NotFound.tsx", import.meta.url), "utf8"),
};

describe("marketing keyboard-focus audit", () => {
  it("offers the first keyboard stop as a skip-to-content link on every public page", () => {
    expect(chrome).toContain('href="#main-content"');
    for (const [name, source] of Object.entries(pages)) {
      expect(source, name).toContain('id="main-content"');
      // The skip link comes from the catalog header (withSkipLink defaults to true).
      expect(source, name).toContain("<CatalogHeader />");
    }
  });

  it("keeps focused public controls visibly distinguishable and unobscured", () => {
    expect(catalogCss).toContain(".cw :focus-visible { outline: 3px solid var(--cw-stamp)");
    expect(catalogCss).toContain(".cw-desk :focus-visible { outline-color: #fff; }");
    // The only outline:none is the login input inside its wrapper; the wrapper's ring carries the focus state.
    expect(marketingCss.replace(/\.mkt-field input:focus-visible\s*\{[^}]*\}/, "")).not.toMatch(/outline:\s*none/);
  });

  it("makes the main landmark focusable so the skip link lands inside it", () => {
    for (const name of ["marketing", "partner", "auth", "notFound"] as const) expect(pages[name], name).toContain('id="main-content" tabIndex={-1}');
  });

  it("uses native details/summary for the FAQ so it is keyboard operable", () => {
    expect(pages.marketing).toContain("<details");
    expect(pages.marketing).toContain("<summary");
    expect(pages.partner).toContain("<summary");
  });
});
