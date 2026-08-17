import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

const query = (data: unknown) => ({ data, isLoading: false, isError: false, refetch: vi.fn() });

vi.mock("@/components/DashboardLayout", () => ({ default: ({ children }: { children: React.ReactNode }) => <>{children}</> }));
vi.mock("@/components/ui/button", () => ({ Button: ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => <button {...props}>{children}</button> }));
vi.mock("@/components/workspace/WorkspacePrimitives", () => ({
  WorkspacePageHeader: ({ title }: { title: string }) => <header>{title}</header>,
  WorkspaceSection: ({ title, children }: { title: string; children: React.ReactNode }) => <section><h2>{title}</h2>{children}</section>,
  WorkspaceState: ({ title }: { title: string }) => <p>{title}</p>,
  WorkspaceStatusPill: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
}));
vi.mock("@/contexts/ThemeContext", () => ({ useTheme: () => ({ preference: "dark", setPreference: vi.fn() }) }));
vi.mock("@/_core/hooks/useAuth", () => ({ useAuth: () => ({ user: { email: "owner@salonflow.test" } }) }));
vi.mock("@/lib/trpc", () => ({
  trpc: {
    organizations: {
      listMine: { useQuery: () => query([{ organization: { id: "organization_001", name: "სილამაზის სივრცე" }, membership: { role: "OWNER" } }]) },
      listLocations: { useQuery: () => query([{ id: "location_001", name: "ვაკე", timezone: "Asia/Tbilisi" }]) },
    },
  },
}));

import Settings from "./Settings";

describe("Settings integration readiness", () => {
  it("truthfully states that notification delivery, web push, and online payment are not configured", () => {
    const markup = renderToStaticMarkup(<Settings />);

    expect(markup).toContain("ავტომატური booking confirmation და 24-საათიანი შეხსენება ამჟამად არ იგზავნება.");
    expect(markup).toContain("Email ან SMS provider");
    expect(markup).toContain("Push notification ჯერ არ არის კონფიგურირებული");
    expect(markup).toContain("არც permission-ს ითხოვს და არც push შეტყობინებას გზავნის");
    expect(markup).toContain("VAPID public/private keys");
    expect(markup).toContain("Checkout და თანხის ჩამოჭრა გამორთულია");
    expect(markup).toContain("signed webhook და server-only payment secrets");
    expect(markup).toContain("არ არის კონფიგურირებული");
  });
});
