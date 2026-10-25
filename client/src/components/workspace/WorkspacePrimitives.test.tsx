import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Router } from "wouter";
import { describe, expect, it } from "vitest";
import { WorkspacePageHeader, WorkspaceState } from "./WorkspacePrimitives";
import { OnlinePageTabs } from "./OnlinePageTabs";

describe("WorkspacePageHeader", () => {
  it("renders the page hint in the DOM (CSS clamps it to two lines on phones, it is not removed)", () => {
    const html = renderToStaticMarkup(<WorkspacePageHeader title="დღეს" description="დღის ჯავშნები, გადასახდელი და ის, რასაც ყურადღება სჭირდება." />);
    expect(html).toContain('class="cwk-desc"');
    expect(html).toContain("დღის ჯავშნები, გადასახდელი");
  });
});

describe("WorkspaceState", () => {
  it("draws the static ring around the empty-state icon only", () => {
    const empty = renderToStaticMarkup(<WorkspaceState kind="empty" title="ცარიელია" />);
    expect(empty).toContain('data-ring="square"');
    expect(empty).toContain('data-state="static"');
    const error = renderToStaticMarkup(<WorkspaceState kind="error" title="შეცდომა" />);
    expect(error).not.toContain("data-ring");
    expect(error).toContain('role="alert"');
  });
});

describe("OnlinePageTabs", () => {
  it("lists the three online-page screens and marks only the current one", () => {
    const html = renderToStaticMarkup(<Router ssrPath="/app/media"><OnlinePageTabs /></Router>);
    expect((html.match(/href="[^"]+"/g) ?? []).map(h => h.slice(6, -1))).toEqual(["/app/marketplace", "/app/media", "/app/feedback"]);
    expect(html.match(/aria-current="page"/g)).toHaveLength(1);
    expect(html).toMatch(/aria-current="page"[^>]*>ფოტოები და აღწერა</);
  });
});
