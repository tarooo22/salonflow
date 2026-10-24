import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(new URL("./NotFound.tsx", import.meta.url), "utf8");

describe("404 page", () => {
  it("says the page was not found in a card and links home and to the catalog", () => {
    expect(source).toContain("ეს გვერდი ვერ მოიძებნა");
    expect(source).toContain("mkt-404-card");
    expect(source).toContain('href="/"');
    expect(source).toContain('href="/salons"');
    expect(source).toContain("window.history.back()");
  });

  it("is a cw page with a main landmark and is not indexed", () => {
    expect(source).toContain('className="cw flex min-h-screen flex-col"');
    expect(source).toContain('id="main-content"');
    expect(source).toContain('robots: "noindex,nofollow"');
    expect(source).not.toContain("sf-");
  });
});
