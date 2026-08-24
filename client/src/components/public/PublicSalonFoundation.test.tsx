import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const styles = readFileSync(new URL("../../index.css", import.meta.url), "utf8");
const primitives = readFileSync(new URL("./PublicPrimitives.tsx", import.meta.url), "utf8");

describe("Salon House public foundation", () => {
  it("defines semantic salon primitives without replacing the shared theme system", () => {
    expect(styles).toContain("--sf-salon-warm");
    expect(styles).toContain(".sf-salon-panel");
    expect(styles).toContain(".sf-salon-flowline");
    expect(styles).toContain(".sf-salon-note");
    expect(styles).toContain("@media (prefers-reduced-motion: reduce)");
  });

  it("uses the Salon House header styles while retaining accessible public navigation", () => {
    expect(primitives).toContain("sf-public-header");
    expect(primitives).toContain("sf-public-nav-link");
    expect(primitives).toContain("sf-public-booking-link");
    expect(primitives).not.toContain('size-3.5" aria-hidden="true" />{t("onlineBooking")}');
    expect(styles).toContain(".sf-public-booking-link:hover");
    expect(styles).toContain(".sf-public-booking-link:focus-visible");
    expect(primitives).toContain("sf-skip-link");
    expect(primitives).toContain("aria-controls=\"public-mobile-menu\"");
    expect(primitives).toContain("aria-current={location === item.href ? \"page\" : undefined}");
    expect(primitives).toContain("min-[1600px]:flex");
    expect(primitives).toContain("min-[1600px]:!hidden");
    expect(primitives).toContain("sf-public-header--scrolled");
    expect(primitives).toContain("sf-public-compact-booking");
    expect(primitives).toContain("sf-public-discovery-shortcut");
    expect(primitives).toContain("compact={isScrolled}");
    expect(styles).toContain(".sf-public-nav-link--active");
    expect(styles).toContain(".sf-public-brand");
    expect(styles).toContain(".sf-public-header--scrolled");
    expect(styles).toContain(".sf-public-compact-booking");
    expect(styles).toContain(".sf-public-brand--compact");
    expect(styles).toContain(".sf-public-discovery-shortcut");
  });
});
