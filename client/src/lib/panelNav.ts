import { BarChart3, BriefcaseBusiness, CalendarDays, CalendarHeart, Clock3, Images, LayoutDashboard, ListChecks, MessageSquareText, Package, ReceiptText, Scissors, Settings2, Store, UserRound, Users, UsersRound } from "lucide-react";
import type { ComponentType } from "react";
import { clientTerms, type OrganizationVertical } from "@/lib/verticalTerms";

/**
 * The business panel's navigation, as data. Which role may see which link is the same as the old
 * DashboardLayout menuItems filter: a role never gains a link to a page it could not open before
 * (the server still enforces everything).
 */
export type PanelRole = "OWNER" | "MANAGER" | "RECEPTIONIST" | "STAFF";
export type PanelNavIcon = ComponentType<{ className?: string }>;
export type PanelNavItem = { key: string; label: string; href: string; icon?: PanelNavIcon; /** Other routes that belong to this item (it stays highlighted there). */ also?: readonly string[] };
export type PanelNavGroup = {
  key: "main" | "business" | "more" | "billing" | "platform";
  /** Caption above the group; null = no caption. */
  label: string | null;
  /** A collapsible group starts closed (opens by itself when one of its routes is active). */
  collapsible?: boolean;
  items: PanelNavItem[];
};
export type PanelNavOptions = { vertical?: OrganizationVertical | string | null; isPlatformAdmin?: boolean; billingVisible?: boolean };
export type PanelNav = { groups: PanelNavGroup[]; footer: PanelNavItem[] };

const BUSINESS_LABEL: Record<string, string> = { SALON: "ჩემი სალონი", DENTAL: "ჩემი კლინიკა", AESTHETICS: "ჩემი ცენტრი" };
/** Online page: the three pages share one rail item and one tab row (OnlinePageTabs). */
export const ONLINE_PAGE_PATHS = ["/app/marketplace", "/app/media", "/app/feedback"] as const;
const BILLING_WINDOW_MS = 3 * 24 * 60 * 60 * 1000;

const PLATFORM_ITEMS: PanelNavItem[] = [
  { key: "trial-admin", label: "საცდელი მოთხოვნები", href: "/app/trial-admin", icon: ListChecks },
  { key: "organization-governance", label: "სალონების კონტროლი", href: "/app/organization-governance", icon: Store },
  { key: "billing-admin", label: "გადახდები", href: "/app/billing-admin", icon: ReceiptText },
  { key: "feedback-admin", label: "შეფასებების მოდერაცია", href: "/app/feedback-admin", icon: MessageSquareText },
];

/** True when the workspace is locked, or its access ends within 3 days. */
export function isBillingVisible(status: { locked?: boolean; endsAt?: Date | string | null } | null | undefined, now = Date.now()) {
  if (!status) return false;
  if (status.locked === true) return true;
  if (!status.endsAt) return false;
  const endsAt = new Date(status.endsAt).getTime();
  return Number.isFinite(endsAt) && endsAt - now <= BILLING_WINDOW_MS;
}

export function panelNav(role: PanelRole | null | undefined, { vertical, isPlatformAdmin = false, billingVisible = false }: PanelNavOptions = {}): PanelNav {
  const groups: PanelNavGroup[] = [];
  const footer: PanelNavItem[] = [];

  if (role) {
    const clients = clientTerms(vertical as OrganizationVertical | undefined).plural;
    if (role === "STAFF") {
      groups.push({ key: "main", label: null, items: [
        { key: "today", label: "ჩემი დღე", href: "/app/today", icon: LayoutDashboard },
        { key: "calendar", label: "ჩემი კალენდარი", href: "/app/calendar", icon: CalendarDays },
        { key: "staff", label: "ჩემი პროფილი", href: "/app/staff", icon: UserRound },
        { key: "operations", label: "ცვლა და ჩაი", href: "/app/operations", icon: Clock3 },
      ] });
    } else {
      groups.push({ key: "main", label: null, items: [
        { key: "today", label: "დღეს", href: "/app/today", icon: LayoutDashboard },
        { key: "calendar", label: "კალენდარი", href: "/app/calendar", icon: CalendarDays },
        { key: "clients", label: clients, href: "/app/clients", icon: UsersRound },
        { key: "pos", label: "სალარო", href: "/app/pos", icon: ReceiptText },
      ] });
    }

    const business: PanelNavItem[] = [];
    if (role === "OWNER") {
      business.push(
        { key: "services", label: "სერვისები და ფასები", href: "/app/services", icon: Scissors },
        { key: "staff", label: "გუნდი და საათები", href: "/app/staff", icon: Users },
        { key: "marketplace", label: "ონლაინ გვერდი", href: "/app/marketplace", icon: Store, also: ["/app/media", "/app/feedback"] },
        { key: "reports", label: "ანგარიშები", href: "/app/reports", icon: BarChart3 },
      );
    } else if (role === "MANAGER") {
      business.push({ key: "feedback", label: "შეფასებები", href: "/app/feedback", icon: MessageSquareText });
    }
    if (business.length) groups.push({ key: "business", label: BUSINESS_LABEL[vertical ?? "SALON"] ?? BUSINESS_LABEL.SALON, items: business });

    const more: PanelNavItem[] = [];
    if (role !== "STAFF") more.push({ key: "waitlist", label: "მოლოდინის სია", href: "/app/waitlist", icon: CalendarHeart }, { key: "operations", label: "ცვლა და ჩაი", href: "/app/operations", icon: Clock3 });
    if (role === "OWNER") more.push({ key: "client-gallery", label: "ვიზიტის ფოტოები", href: "/app/client-gallery", icon: Images });
    if (role === "OWNER" || role === "MANAGER") more.push({ key: "vacancies", label: "ვაკანსიები", href: "/app/vacancies", icon: BriefcaseBusiness }, { key: "products", label: "პროდუქტები", href: "/app/products", icon: Package });
    if (more.length) groups.push({ key: "more", label: "მეტი", collapsible: true, items: more });

    if (billingVisible && role === "OWNER") groups.push({ key: "billing", label: "პაკეტი", items: [{ key: "billing", label: "პაკეტის გააქტიურება", href: "/app/billing", icon: ReceiptText }] });
    footer.push({ key: "settings", label: "პარამეტრები", href: "/app/settings", icon: Settings2 });
  }

  if (isPlatformAdmin) groups.push({ key: "platform", label: "პლატფორმა", collapsible: true, items: PLATFORM_ITEMS });
  return { groups, footer };
}

/** The four phone tab-bar slots; the layout adds "მეტი" as the fifth. */
export function panelTabBar(role: PanelRole | null | undefined, vertical?: OrganizationVertical | string | null): PanelNavItem[] {
  if (!role) return [];
  const today = { key: "today", label: "დღეს", href: "/app/today", icon: LayoutDashboard };
  const calendar = { key: "calendar", label: "კალენდარი", href: "/app/calendar", icon: CalendarDays };
  if (role === "STAFF") return [today, calendar, { key: "staff", label: "პროფილი", href: "/app/staff", icon: UserRound }, { key: "operations", label: "ცვლა და ჩაი", href: "/app/operations", icon: Clock3 }];
  return [today, calendar, { key: "clients", label: clientTerms(vertical as OrganizationVertical | undefined).plural, href: "/app/clients", icon: UsersRound }, { key: "pos", label: "სალარო", href: "/app/pos", icon: ReceiptText }];
}

/** An item is active on its own route, below it, or on one of its `also` routes. */
export function isPanelNavActive(item: Pick<PanelNavItem, "href" | "also">, location: string) {
  const path = location.split(/[?#]/)[0];
  return [item.href, ...(item.also ?? [])].some(href => path === href || path.startsWith(`${href}/`));
}
