import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

const query = (data: unknown) => ({ data, isLoading: false, isError: false, refetch: vi.fn() });

vi.mock("wouter", () => ({ Link: ({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) => <a href={href} className={className}>{children}</a> }));
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
    useUtils: () => ({ organizations: { listLocations: { invalidate: vi.fn() }, listLocationOpeningHours: { invalidate: vi.fn() } } , productivity: { preferences: { invalidate: vi.fn() } } }),
    organizations: {
      listMine: { useQuery: () => query([{ organization: { id: "organization_001", name: "სილამაზის სივრცე" }, membership: { role: "OWNER" } }]) },
      listLocations: { useQuery: () => query([{ id: "location_001", name: "ვაკე", publicSlug: "vake-beauty", timezone: "Asia/Tbilisi", address: null, phone: null, email: null, bookingEnabled: true, slotIntervalMinutes: 15, minimumNoticeMinutes: 60, maximumAdvanceDays: 60, cancellationCutoffMinutes: 120 }]) },
      updateLocationSettings: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) },
      listLocationOpeningHours: { useQuery: () => query([{ weekday: 0, opensAt: "10:00:00", closesAt: "19:30:00" }, { weekday: 1, opensAt: "10:00:00", closesAt: "19:30:00" }]) },
      setLocationOpeningHours: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) },
    },
    productivity: { preferences: { useQuery: () => query({ settings: { density: "COMFORTABLE", reducedMotion: false, defaultRoute: "/app/today", inAppAlertCategories: ["OPERATIONAL"] } }) }, savePreferences: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) } },
  },
}));

import Settings, { OpeningHoursEditor, branchBookingLink, copyMondayToWeekdays, hoursFromRows, hoursProblem } from "./Settings";

describe("Settings profile and privacy surface", () => {
  it("builds the exact owner-shareable booking URL for a branch", () => {
    expect(branchBookingLink("https://salonflow.example", "gldani-beauty")).toBe("https://salonflow.example/book/gldani-beauty");
  });

  it("renders user-scoped preferences and truthful security/privacy boundaries", () => {
    const markup = renderToStaticMarkup(<Settings />);

    expect(markup).toContain("პირადი გარემო");
    expect(markup).toContain("ინფორმაციის სიმკვრივე");
    expect(markup).toContain("შეტყობინებები აპში");
    expect(markup).toContain("ანგარიში");
    expect(markup).not.toContain("ავტომატური booking confirmation");
  });

  it("names the personal tab \"ჩემი ანგარიში\" and links owners to billing", () => {
    const markup = renderToStaticMarkup(<Settings />);
    expect(markup).toContain("ჩემი ანგარიში");
    expect(markup).not.toContain("ჩემი გარემო");
    expect(markup).toContain("პაკეტი და გადახდა");
    expect(markup).toContain('href="/app/billing"');
  });
});

describe("Settings opening-hours editor", () => {
  const rows = [{ weekday: 0, opensAt: "10:00:00", closesAt: "19:30:00" }, { weekday: 6, opensAt: "11:00:00", closesAt: "16:00:00" }];

  it("maps saved rows to seven days, Monday first, closed where there is no row", () => {
    const days = hoursFromRows(rows);
    expect(days).toHaveLength(7);
    expect(days[0]).toEqual({ weekday: 0, open: true, startLocalTime: "10:00", endLocalTime: "19:30" });
    expect(days[1]!.open).toBe(false);
    expect(days[6]).toEqual({ weekday: 6, open: true, startLocalTime: "11:00", endLocalTime: "16:00" });
  });

  it("proposes Monday–Friday when nothing has been saved yet", () => {
    expect(hoursFromRows([]).map(day => day.open)).toEqual([true, true, true, true, true, false, false]);
  });

  it("copies Monday onto Tuesday–Friday only", () => {
    const days = copyMondayToWeekdays(hoursFromRows(rows));
    expect(days.slice(1, 5).every(day => day.open && day.startLocalTime === "10:00" && day.endLocalTime === "19:30")).toBe(true);
    expect(days[5]!.open).toBe(false);
    expect(days[6]!.startLocalTime).toBe("11:00");
  });

  it("rejects all-closed weeks and end-before-start", () => {
    expect(hoursProblem(hoursFromRows(rows))).toBeNull();
    expect(hoursProblem(hoursFromRows(rows).map(day => ({ ...day, open: false })))).toContain("ერთი სამუშაო დღე");
    expect(hoursProblem(hoursFromRows(rows).map(day => day.weekday === 0 ? { ...day, endLocalTime: "09:00" } : day))).toContain("ორშაბათი");
  });

  it("renders seven Monday-first rows, the open/closed labels, the helper and the hint", () => {
    const markup = renderToStaticMarkup(<OpeningHoursEditor organizationId="organization_001" locations={[{ id: "location_001", name: "ვაკე", timezone: "Asia/Tbilisi" }]} />);
    const order = ["ორშაბათი", "სამშაბათი", "ოთხშაბათი", "ხუთშაბათი", "პარასკევი", "შაბათი", "კვირა"].map(label => markup.indexOf(`aria-label="${label}"`));
    expect(order.every(position => position > -1)).toBe(true);
    expect([...order].sort((a, b) => a - b)).toEqual(order);
    expect(markup).toContain("ღიაა");
    expect(markup).toContain("დაკეტილია");
    expect(markup).toContain("ყველა სამუშაო დღეზე გადატანა");
    expect(markup).toContain("ამ საათების მიღმა ონლაინ ჩაწერა არ იქნება შესაძლებელი.");
    expect(markup).not.toContain('aria-label="ფილიალი"');
  });
});
