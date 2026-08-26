import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

const query = (data: unknown) => ({ data, isLoading: false, isError: false, refetch: vi.fn() });

vi.mock("@/components/DashboardLayout", () => ({ default: ({ children }: { children: React.ReactNode }) => <>{children}</> }));
vi.mock("@/components/ui/button", () => ({ Button: ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => <button {...props}>{children}</button> }));
vi.mock("@/components/ui/input", () => ({ Input: (props: React.InputHTMLAttributes<HTMLInputElement>) => <input {...props} /> }));
vi.mock("@/components/ui/label", () => ({ Label: ({ children }: { children: React.ReactNode }) => <label>{children}</label> }));
vi.mock("@/components/ui/select", () => ({ Select: ({ children }: { children: React.ReactNode }) => <div>{children}</div>, SelectContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>, SelectItem: ({ children }: { children: React.ReactNode }) => <span>{children}</span>, SelectTrigger: ({ children }: { children: React.ReactNode }) => <button>{children}</button>, SelectValue: () => <span /> }));
vi.mock("@/components/workspace/WorkspacePrimitives", () => ({
  WorkspacePageHeader: ({ title }: { title: string }) => <header>{title}</header>,
  WorkspaceSection: ({ title, children }: { title: string; children: React.ReactNode }) => <section><h2>{title}</h2>{children}</section>,
  WorkspaceState: ({ title }: { title: string }) => <p>{title}</p>,
  WorkspaceStatusPill: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
}));
vi.mock("@/contexts/ThemeContext", () => ({ useTheme: () => ({ preference: "dark", setPreference: vi.fn() }) }));
vi.mock("@/_core/hooks/useAuth", () => ({ useAuth: () => ({ user: { email: "owner@salonflow.test", lastSignedIn: new Date("2026-08-01T10:00:00.000Z") } }) }));
vi.mock("@/components/workspace/SettingsPrimitives", () => ({
  SettingsSectionNav: ({ children }: { children: React.ReactNode }) => <nav>{children}</nav>,
  SettingsSection: ({ title, children }: { title: string; children: React.ReactNode }) => <section><h2>{title}</h2>{children}</section>,
  SettingsActionRow: ({ title, description, children }: { title: string; description: string; children?: React.ReactNode }) => <div><strong>{title}</strong><p>{description}</p>{children}</div>,
  SettingsGuard: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  SettingsReadinessPanel: ({ title }: { title: string }) => <div>{title}</div>,
}));
vi.mock("@/lib/trpc", () => ({
  trpc: {
    useUtils: () => ({ organizations: { listLocations: { invalidate: vi.fn() } }, productivity: { preferences: { invalidate: vi.fn() } } }),
    organizations: {
      listMine: { useQuery: () => query([{ organization: { id: "organization_001", name: "სილამაზის სივრცე" }, membership: { role: "OWNER" } }]) },
      listLocations: { useQuery: () => query([{ id: "location_001", name: "ვაკე", publicSlug: "vake-beauty", timezone: "Asia/Tbilisi", address: null, phone: null, email: null, bookingEnabled: true, slotIntervalMinutes: 15, minimumNoticeMinutes: 60, maximumAdvanceDays: 60, cancellationCutoffMinutes: 120 }]) },
      updateLocationSettings: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) },
    },
    productivity: { preferences: { useQuery: () => query({ settings: { density: "COMFORTABLE", reducedMotion: false, defaultRoute: "/app/today", inAppAlertCategories: ["OPERATIONAL"] } }) }, savePreferences: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) } },
  },
}));

import Settings, { branchBookingLink } from "./Settings";

describe("Settings profile and privacy surface", () => {
  it("builds the exact owner-shareable booking URL for a branch", () => {
    expect(branchBookingLink("https://salonflow.example", "gldani-beauty")).toBe("https://salonflow.example/book/gldani-beauty");
  });

  it("renders user-scoped preferences and truthful security/privacy boundaries", () => {
    const markup = renderToStaticMarkup(<Settings />);

    expect(markup).toContain("პირადი გარემო");
    expect(markup).toContain("ინფორმაციის სიმკვრივე");
    expect(markup).toContain("In-app შეტყობინებები");
    expect(markup).toContain("local account");
    expect(markup).not.toContain("ავტომატური booking confirmation");
  });
});
