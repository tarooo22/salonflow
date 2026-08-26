import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { vi } from "vitest";

vi.mock("@/components/ui/collapsible", () => ({
  Collapsible: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CollapsibleContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CollapsibleTrigger: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

import { SettingsReadinessPanel } from "./SettingsPrimitives";

describe("SettingsReadinessPanel", () => {
  it("keeps unavailable integrations explicitly inactive and describes prerequisites", () => {
    const markup = renderToStaticMarkup(<SettingsReadinessPanel category="Email და SMS" title="ავტომატური შეტყობინებები ჯერ არ არის აქტიური" description="შეტყობინება არ იგზავნება." requirements={["provider", "explicit opt-in", "server-only secret"]} />);
    expect(markup).toContain("ჯერ არ არის აქტიური");
    expect(markup).toContain("შეტყობინება არ იგზავნება.");
    expect(markup).toContain("provider");
  });
});
