import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const css = readFileSync(new URL("../index.css", import.meta.url), "utf8");
const home = readFileSync(new URL("./Home.tsx", import.meta.url), "utf8");
const marketing = readFileSync(new URL("./MarketingPages.tsx", import.meta.url), "utf8");
const primitives = readFileSync(new URL("../components/public/PublicPrimitives.tsx", import.meta.url), "utf8");
const localeContext = readFileSync(new URL("../contexts/PublicLocaleContext.tsx", import.meta.url), "utf8");

describe("marketing keyboard-focus audit", () => {
  it("offers the first keyboard stop as a Georgian skip-to-content link", () => {
    expect(primitives).toContain('href="#main-content"');
    expect(primitives).toContain('t("skip")');
    expect(localeContext).toContain('skip: "ძირითად შინაარსზე გადასვლა"');
    expect(primitives).toContain('document.querySelector("main")');
    expect(home).toContain('id="main-content"');
    expect(marketing).toContain("id=\"main-content\"");
  });

  it("keeps focused public controls visibly distinguishable and unobscured", () => {
    expect(css).toContain(":focus-visible { outline: 3px solid var(--sf-focus)");
    expect(css).toContain(".sf-skip-link:focus-visible");
    expect(css).toContain("#main-content { scroll-margin-top: 5.75rem; }");
  });
});
