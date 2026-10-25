import { useAuth } from "@/_core/hooks/useAuth";
import { ChaweraMark } from "@/components/brand/ChaweraMark";
import { PublicLanguageSelector } from "@/components/public/PublicPrimitives";
import { usePublicLocale } from "@/contexts/PublicLocaleContext";
import { BRAND } from "@shared/brand";
import { CalendarCheck, Heart, Home, LayoutDashboard, LogIn, Map, Menu, Search, X, type LucideIcon } from "lucide-react";
import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import "./catalog.css";

export const ui = {
  ka: { home: "მთავარი", search: "ძიება", saved: "ჩემი", bookings: "ჯავშნები", panel: "პანელი", tagline: "ონლაინ ჩაწერა სალონებში, ესთეტიკის ცენტრებსა და სტომატოლოგიურ კლინიკებში — მთელ საქართველოში.", forClients: "კლიენტისთვის", faq: "ხშირი კითხვები", forBusiness: "ბიზნესისთვის", becomePartner: "გახდი პარტნიორი", pricing: "ტარიფები", contact: "კონტაქტი", privacy: "კონფიდენციალურობა" },
  en: { home: "Home", search: "Search", saved: "Saved", bookings: "Bookings", panel: "Dashboard", tagline: "Online booking at salons, aesthetics centres and dental clinics across Georgia.", forClients: "For clients", faq: "FAQ", forBusiness: "For business", becomePartner: "Become a partner", pricing: "Pricing", contact: "Contact", privacy: "Privacy" },
  ru: { home: "Главная", search: "Поиск", saved: "Избранное", bookings: "Записи", panel: "Панель", tagline: "Онлайн-запись в салоны, центры эстетики и стоматологические клиники по всей Грузии.", forClients: "Клиентам", faq: "Частые вопросы", forBusiness: "Бизнесу", becomePartner: "Стать партнёром", pricing: "Тарифы", contact: "Контакты", privacy: "Конфиденциальность" },
} as const;

type NavLabel = "home" | "catalog" | "map" | "products" | "vacancies";
const navigation: Array<{ href: string; label: NavLabel }> = [
  { href: "/", label: "home" },
  { href: "/salons", label: "catalog" },
  { href: "/salons/map", label: "map" },
  { href: "/products", label: "products" },
  { href: "/vacancies", label: "vacancies" },
];
// Phone and tablet: the tab bar carries home/search/map, so the menu only holds the rest.
const menuExtras: Array<{ href: string; label: "products" | "vacancies" | "forBusiness" }> = [
  { href: "/products", label: "products" },
  { href: "/vacancies", label: "vacancies" },
  { href: "/partner", label: "forBusiness" },
];

// The chrome also renders in places without a tRPC provider (static markup tests); there the visitor counts as signed out.
// The provider is either always present or always absent for a mounted tree, so the hook order never changes.
function useSignedIn() {
  try { return useAuth().isAuthenticated; } catch { return false; }
}

function isActive(href: string, path: string) {
  if (href === "/") return path === "/";
  if (href === "/salons") return path === "/salons" || path.startsWith("/salon/");
  return path === href || path.startsWith(`${href}/`);
}

/** The bottom tab bar is for browsing; it steps aside on the profile, booking and booking-management pages. */
export function hasTabBar(path: string) {
  return !(path.startsWith("/salon/") || path.startsWith("/book/") || path.startsWith("/manage-booking/"));
}

export function CatalogWordmark() {
  return <span className="cw-wordmark"><ChaweraMark size={24} />{BRAND.nameKa}</span>;
}

function NavItem({ href, label, onNavigate }: { href: string; label: NavLabel | "forBusiness"; onNavigate?: () => void }) {
  const { t, locale } = usePublicLocale();
  const [path] = useLocation();
  return <Link href={href} className="cw-nav-link" aria-current={isActive(href, path) ? "page" : undefined} onClick={onNavigate}>{label === "home" ? ui[locale].home : t(label)}</Link>;
}

export function CatalogHeader({ withSkipLink = true }: { withSkipLink?: boolean }) {
  const [open, setOpen] = useState(false);
  const { locale, t } = usePublicLocale();
  const isAuthenticated = useSignedIn();
  const text = ui[locale];
  return <header className="cw-header">
    {withSkipLink ? <a href="#main-content" className="sf-skip-link">{t("skip")}</a> : null}
    <div className="cw-container cw-header-bar">
      <Link href="/" aria-label={`${BRAND.nameKa} — ${text.home}`}><CatalogWordmark /></Link>
      <nav aria-label={t("mainNav")} className="cw-nav">{navigation.map(item => <NavItem key={item.href} {...item} />)}</nav>
      <div className="cw-header-actions">
        <Link href="/partner" className="cw-pill cw-pill-outline cw-desktop-only">{t("forBusiness")}</Link>
        <PublicLanguageSelector />
        <Link href={isAuthenticated ? "/app/today" : "/login"} className="cw-pill cw-pill-ink cw-desktop-only">{isAuthenticated ? text.panel : t("signIn")}</Link>
        <button type="button" className="cw-menu-button" aria-expanded={open} aria-controls="cw-mobile-nav" aria-label={open ? t("closeMenu") : t("openMenu")} onClick={() => setOpen(value => !value)}>
          {open ? <X className="size-5" aria-hidden="true" /> : <Menu className="size-5" aria-hidden="true" />}
        </button>
      </div>
    </div>
    {open ? <nav id="cw-mobile-nav" aria-label={t("mobileNav")} className="cw-container cw-mobile-nav">{menuExtras.map(item => <NavItem key={item.href} {...item} onNavigate={() => setOpen(false)} />)}</nav> : null}
  </header>;
}

function MobileTabBar() {
  const { locale, t } = usePublicLocale();
  const isAuthenticated = useSignedIn();
  const [path] = useLocation();
  const text = ui[locale];
  if (!hasTabBar(path)) return null;
  const tabs: Array<{ href: string; label: string; Icon: LucideIcon; active: boolean }> = [
    { href: "/", label: text.home, Icon: Home, active: path === "/" },
    { href: "/salons", label: text.search, Icon: Search, active: path === "/salons" },
    { href: "/salons/map", label: t("map"), Icon: Map, active: path === "/salons/map" },
    { href: "/saved", label: text.saved, Icon: Heart, active: path === "/saved" },
    { href: "/my-bookings", label: text.bookings, Icon: CalendarCheck, active: path === "/my-bookings" },
    isAuthenticated
      ? { href: "/app/today", label: text.panel, Icon: LayoutDashboard, active: false }
      : { href: "/login", label: t("signIn"), Icon: LogIn, active: path === "/login" },
  ];
  return <nav className="cw-tabbar" aria-label={t("mobileNav")}>
    <ul>{tabs.map(({ href, label, Icon, active }) => <li key={href}>
      <Link href={href} className="cw-tab-cell" aria-current={active ? "page" : undefined}><Icon className="size-[22px]" aria-hidden="true" /><span>{label}</span></Link>
    </li>)}</ul>
  </nav>;
}

export function CatalogFooter() {
  const { t, locale } = usePublicLocale();
  const [path] = useLocation();
  const text = ui[locale];
  const year = new Date().getFullYear();
  // The booking flow has its own bottom bar.
  if (path.startsWith("/book/")) return null;
  return <footer className="cw-footer" data-tabbar={hasTabBar(path)}>
    <div className="cw-container cw-footer-grid">
      <div>
        <Link href="/" aria-label={`${BRAND.nameKa} — ${text.home}`}><CatalogWordmark /></Link>
        <p className="mt-4 max-w-sm text-sm leading-6 text-[var(--sf-muted)]">{text.tagline}</p>
      </div>
      <div>
        <p className="cw-footer-head">{text.forClients}</p>
        <ul className="cw-footer-list">
          <li><Link href="/salons">{t("catalog")}</Link></li>
          <li><Link href="/salons/map">{t("map")}</Link></li>
          <li><Link href="/products">{t("products")}</Link></li>
          <li><Link href="/vacancies">{t("vacancies")}</Link></li>
        </ul>
      </div>
      <div>
        <p className="cw-footer-head">{text.forBusiness}</p>
        <ul className="cw-footer-list">
          <li><Link href="/partner">{text.becomePartner}</Link></li>
          <li><Link href="/pricing">{text.pricing}</Link></li>
        </ul>
      </div>
      <div>
        <p className="cw-footer-head">{t("information")}</p>
        <ul className="cw-footer-list">
          <li><Link href="/faq">{text.faq}</Link></li>
          <li><Link href="/contact">{text.contact}</Link></li>
          <li><Link href="/privacy">{text.privacy}</Link></li>
        </ul>
      </div>
    </div>
    <div className="cw-footer-bottom"><div className="cw-container"><span className="cw-num">© {year}</span> {BRAND.name}</div></div>
    <MobileTabBar />
  </footer>;
}
