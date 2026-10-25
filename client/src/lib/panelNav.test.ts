import { describe, expect, it } from "vitest";
import { isBillingVisible, isPanelNavActive, panelNav, panelTabBar, type PanelRole } from "./panelNav";

const shape = (role: PanelRole, opts: Parameters<typeof panelNav>[1] = {}) =>
  panelNav(role, opts).groups.map(group => [group.key, group.label, group.items.map(item => `${item.label}|${item.href}`)] as const);

describe("panelNav", () => {
  it("OWNER sees everything, grouped", () => {
    expect(shape("OWNER", { vertical: "SALON" })).toEqual([
      ["main", null, ["დღეს|/app/today", "კალენდარი|/app/calendar", "კლიენტები|/app/clients", "სალარო|/app/pos"]],
      ["business", "ჩემი სალონი", ["სერვისები და ფასები|/app/services", "გუნდი და საათები|/app/staff", "ონლაინ გვერდი|/app/marketplace", "ანგარიშები|/app/reports"]],
      ["more", "მეტი", ["მოლოდინის სია|/app/waitlist", "ცვლა და ჩაი|/app/operations", "ვიზიტის ფოტოები|/app/client-gallery", "ვაკანსიები|/app/vacancies", "პროდუქტები|/app/products"]],
    ]);
    expect(panelNav("OWNER").footer.map(item => item.href)).toEqual(["/app/settings"]);
  });

  it("names the business group and the customers by vertical", () => {
    expect(panelNav("OWNER", { vertical: "DENTAL" }).groups.map(g => g.label)).toContain("ჩემი კლინიკა");
    expect(panelNav("OWNER", { vertical: "AESTHETICS" }).groups.map(g => g.label)).toContain("ჩემი ცენტრი");
    expect(panelNav("OWNER", { vertical: "DENTAL" }).groups[0].items[2].label).toBe("პაციენტები");
    expect(panelTabBar("OWNER", "DENTAL")[2].label).toBe("პაციენტები");
  });

  it("MANAGER gets reviews instead of the online page, and no visit photos", () => {
    expect(shape("MANAGER")).toEqual([
      ["main", null, ["დღეს|/app/today", "კალენდარი|/app/calendar", "კლიენტები|/app/clients", "სალარო|/app/pos"]],
      ["business", "ჩემი სალონი", ["შეფასებები|/app/feedback"]],
      ["more", "მეტი", ["მოლოდინის სია|/app/waitlist", "ცვლა და ჩაი|/app/operations", "ვაკანსიები|/app/vacancies", "პროდუქტები|/app/products"]],
    ]);
  });

  it("RECEPTIONIST has no business group and only waitlist and shift in more", () => {
    expect(shape("RECEPTIONIST")).toEqual([
      ["main", null, ["დღეს|/app/today", "კალენდარი|/app/calendar", "კლიენტები|/app/clients", "სალარო|/app/pos"]],
      ["more", "მეტი", ["მოლოდინის სია|/app/waitlist", "ცვლა და ჩაი|/app/operations"]],
    ]);
  });

  it("STAFF has one personal group and no money or client pages", () => {
    expect(shape("STAFF")).toEqual([
      ["main", null, ["ჩემი დღე|/app/today", "ჩემი კალენდარი|/app/calendar", "ჩემი პროფილი|/app/staff", "ცვლა და ჩაი|/app/operations"]],
    ]);
  });

  it("no role gets a route it could not reach before", () => {
    const hrefs = (role: PanelRole) => new Set(panelNav(role, { billingVisible: true }).groups.flatMap(g => g.items.map(i => i.href)));
    expect(hrefs("STAFF")).toEqual(new Set(["/app/today", "/app/calendar", "/app/staff", "/app/operations"]));
    for (const role of ["MANAGER", "RECEPTIONIST"] as const) {
      for (const owner of ["/app/services", "/app/staff", "/app/reports", "/app/media", "/app/marketplace", "/app/client-gallery", "/app/billing"]) expect(hrefs(role).has(owner)).toBe(false);
    }
    expect(hrefs("RECEPTIONIST").has("/app/vacancies")).toBe(false);
  });

  it("shows billing only to an owner and only when asked", () => {
    expect(panelNav("OWNER").groups.some(g => g.key === "billing")).toBe(false);
    expect(panelNav("OWNER", { billingVisible: true }).groups.find(g => g.key === "billing")?.items[0].href).toBe("/app/billing");
    expect(panelNav("MANAGER", { billingVisible: true }).groups.some(g => g.key === "billing")).toBe(false);
  });

  it("adds a collapsed platform group for admins, even without a workspace role", () => {
    const nav = panelNav(undefined, { isPlatformAdmin: true });
    expect(nav.groups.map(g => [g.key, g.label, g.collapsible])).toEqual([["platform", "პლატფორმა", true]]);
    expect(nav.groups[0].items.map(i => i.href)).toEqual(["/app/trial-admin", "/app/organization-governance", "/app/billing-admin", "/app/feedback-admin"]);
    expect(nav.footer).toEqual([]);
    expect(panelNav("OWNER", { isPlatformAdmin: true }).groups.at(-1)?.key).toBe("platform");
    expect(panelNav("OWNER").groups.some(g => g.key === "platform")).toBe(false);
  });

  it("phone tab bar: four slots per role", () => {
    const line = (role: PanelRole) => panelTabBar(role).map(i => `${i.label}|${i.href}`);
    const common = ["დღეს|/app/today", "კალენდარი|/app/calendar", "კლიენტები|/app/clients", "სალარო|/app/pos"];
    expect(line("OWNER")).toEqual(common);
    expect(line("MANAGER")).toEqual(common);
    expect(line("RECEPTIONIST")).toEqual(common);
    expect(line("STAFF")).toEqual(["დღეს|/app/today", "კალენდარი|/app/calendar", "პროფილი|/app/staff", "ცვლა და ჩაი|/app/operations"]);
    expect(panelTabBar(undefined)).toEqual([]);
  });

  it("keeps the online page lit on its sibling pages", () => {
    const online = panelNav("OWNER").groups[1].items[2];
    expect(isPanelNavActive(online, "/app/media")).toBe(true);
    expect(isPanelNavActive(online, "/app/feedback")).toBe(true);
    expect(isPanelNavActive(online, "/app/reports")).toBe(false);
    expect(isPanelNavActive({ href: "/app/clients" }, "/app/clients/abc?x=1")).toBe(true);
  });

  it("billing is visible when locked or access ends within 3 days", () => {
    const now = Date.parse("2026-10-25T12:00:00Z");
    const day = 24 * 60 * 60 * 1000;
    expect(isBillingVisible(undefined, now)).toBe(false);
    expect(isBillingVisible({ locked: true, endsAt: null }, now)).toBe(true);
    expect(isBillingVisible({ locked: false, endsAt: null }, now)).toBe(false);
    expect(isBillingVisible({ locked: false, endsAt: new Date(now + 2 * day) }, now)).toBe(true);
    expect(isBillingVisible({ locked: false, endsAt: new Date(now + 3 * day) }, now)).toBe(true);
    expect(isBillingVisible({ locked: false, endsAt: new Date(now + 4 * day) }, now)).toBe(false);
  });
});
