import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const styles = readFileSync(new URL("../../index.css", import.meta.url), "utf8");
const primitives = readFileSync(new URL("./PublicPrimitives.tsx", import.meta.url), "utf8");
const chrome = readFileSync(new URL("../catalog/CatalogChrome.tsx", import.meta.url), "utf8");

describe("Salon House public foundation", () => {
  it("defines semantic salon primitives without replacing the shared theme system", () => {
    expect(styles).toContain("--sf-salon-warm");
    expect(styles).toContain(".sf-salon-panel");
    expect(styles).toContain(".sf-salon-flowline");
    expect(styles).toContain(".sf-salon-note");
    expect(styles).toContain("@media (prefers-reduced-motion: reduce)");
  });

  it("uses the Salon House header styles while retaining accessible public navigation", () => {
    // The public header now delegates to the catalog chrome (DESIGN.md).
    expect(primitives).toContain("<CatalogHeader withSkipLink={false} />");
    expect(primitives).toContain("sf-skip-link");
    expect(chrome).toContain('aria-controls="cw-mobile-nav"');
    expect(chrome).toContain("aria-expanded={open}");
    expect(chrome).toContain("<PublicLanguageSelector />");
    expect(primitives).toContain("DropdownMenuRadioGroup");
    expect(primitives).not.toContain("<select value={locale}");
    expect(styles).toContain(".sf-public-nav-link--active");
    expect(styles).toContain(".sf-public-brand");
    expect(styles).toContain(".sf-public-header--scrolled");
    expect(styles).toContain(".sf-public-compact-booking");
    expect(styles).toContain(".sf-public-brand--compact");
    expect(styles).toContain(".sf-public-discovery-shortcut");
    expect(styles).toContain(".sf-language-trigger");
    expect(styles).toContain(".sf-language-menu");
  });
});
