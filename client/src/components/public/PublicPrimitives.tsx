import { PwaInstallButton } from "@/components/pwa/PwaInstallButton";
import { Button } from "@/components/ui/button";
import { usePublicLocale, type PublicLocale } from "@/contexts/PublicLocaleContext";
import { Menu, Sparkles, X } from "lucide-react";
import React, { useState } from "react";
import { Link, useLocation } from "wouter";

const bookingHref = "/book";
const localeOptions: Array<{ value: PublicLocale; label: string }> = [{ value: "ka", label: "ქართული" }, { value: "en", label: "English" }, { value: "ru", label: "Русский" }];

export function SalonFlowMark({ inverted = false }: { inverted?: boolean }) {
  return <Link href="/" className="sf-public-brand inline-flex shrink-0 items-center gap-2 rounded-xl font-semibold tracking-tight focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--sf-focus)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--sf-bg)]"><span className={`sf-brand-mark ${inverted ? "sf-brand-mark--inverted" : ""}`} aria-hidden="true"><i /><i /><i /></span><span className="text-lg">SalonFlow</span></Link>;
}

export function PublicLanguageSelector({ className = "" }: { className?: string }) {
  const { locale, setLocale } = usePublicLocale();
  return <label className={`inline-flex items-center ${className}`}><span className="sr-only">Language</span><select value={locale} onChange={event => setLocale(event.target.value as PublicLocale)} className="sf-interactive h-10 rounded-xl border border-[var(--sf-line)] bg-[var(--sf-surface)] px-3 text-xs font-semibold text-[var(--sf-ink)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--sf-accent-strong)]">{localeOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>;
}

export function PublicHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [location] = useLocation();
  const { t } = usePublicLocale();
  const navigation = [{ href: "/salons", label: t("salons") }, { href: "/features", label: t("features") }, { href: "/pricing", label: t("pricing") }, { href: "/demo", label: t("preview") }, { href: "/faq", label: t("faq") }, { href: "/contact", label: t("contact") }];
  const skipToContent = (event: React.MouseEvent<HTMLAnchorElement>) => {
    const main = document.querySelector("main");
    if (!main) return;
    event.preventDefault();
    if (!main.hasAttribute("tabindex")) main.setAttribute("tabindex", "-1");
    main.focus();
    main.scrollIntoView({ block: "start" });
  };
  return <><a className="sf-skip-link" href="#main-content" onClick={skipToContent}>{t("skip")}</a><header className="sf-public-header relative z-30 border-b backdrop-blur-xl"><div className="sf-public-container flex min-h-20 items-center justify-between gap-3 py-3"><SalonFlowMark /><div className="hidden min-w-0 flex-1 items-center justify-between gap-3 min-[1440px]:flex"><nav className="min-w-0 items-center gap-0.5 min-[1440px]:flex" aria-label={t("mainNav")}>{navigation.map(item => <Link key={item.href} className={`sf-public-nav-link sf-interactive rounded-xl px-3 py-2.5 text-sm font-semibold ${location === item.href ? "sf-public-nav-link--active" : ""}`} href={item.href} aria-current={location === item.href ? "page" : undefined}>{item.label}</Link>)}</nav><div className="flex shrink-0 items-center gap-2"><Link href={bookingHref} className="sf-public-booking-link sf-interactive inline-flex min-h-10 items-center whitespace-nowrap px-3.5 py-2 text-sm font-semibold">{t("onlineBooking")}</Link><span className="h-7 w-px bg-[var(--sf-line)]" aria-hidden="true" /><PublicLanguageSelector /><Button asChild variant="publicQuiet" className="h-10 px-3"><Link href="/login">{t("signIn")}</Link></Button><Button asChild variant="public" className="h-10 px-4"><Link href="/register">{t("startFree")}</Link></Button></div></div><Button type="button" variant="publicQuiet" size="icon" className="min-[1440px]:hidden" aria-expanded={menuOpen} aria-controls="public-mobile-menu" aria-label={menuOpen ? t("closeMenu") : t("openMenu")} onClick={() => setMenuOpen(open => !open)}>{menuOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}</Button></div>{menuOpen ? <div id="public-mobile-menu" className="sf-motion-enter border-t border-[var(--sf-salon-hairline)] bg-[var(--sf-surface-raised)] min-[1440px]:hidden"><nav className="sf-public-container grid gap-1 py-3" aria-label={t("mobileNav")}><Link href={bookingHref} onClick={() => setMenuOpen(false)} className="sf-public-booking-link flex min-h-12 items-center px-3 py-3 text-sm font-semibold">{t("onlineBooking")}</Link>{navigation.map(item => <Link key={item.href} href={item.href} onClick={() => setMenuOpen(false)} className={`sf-public-nav-link rounded-xl px-3 py-3 text-sm font-semibold ${location === item.href ? "sf-public-nav-link--active" : ""}`} aria-current={location === item.href ? "page" : undefined}>{item.label}</Link>)}<div className="mt-2 flex items-center justify-between gap-2"><PublicLanguageSelector /><PwaInstallButton /></div><div className="mt-2 grid grid-cols-2 gap-2"><Button asChild variant="publicSecondary"><Link href="/login">{t("signIn")}</Link></Button><Button asChild variant="public"><Link href="/register">{t("start")}</Link></Button></div></nav></div> : null}</header></>;
}

export function PublicFooter() {
  const { t } = usePublicLocale();
  return <footer className="border-t border-[var(--sf-line)] bg-[var(--sf-bg)] text-[var(--sf-ink)]"><div className="sf-public-container grid gap-8 py-10 md:grid-cols-[1.4fr_repeat(2,minmax(0,1fr))]"><div><SalonFlowMark inverted /><p className="mt-4 max-w-sm text-sm leading-6 text-[var(--sf-muted)]">{t("footer")}</p></div><div><h2 className="text-sm font-semibold">{t("product")}</h2><div className="mt-3 grid gap-2 text-sm text-[var(--sf-muted)]"><Link href="/salons">{t("salons")}</Link><Link href="/features">{t("features")}</Link><Link href="/demo">{t("preview")}</Link><Link href="/book">{t("onlineBooking")}</Link><Link href="/register">{t("workspaceCreate")}</Link></div></div><div><h2 className="text-sm font-semibold">{t("information")}</h2><div className="mt-3 grid gap-2 text-sm text-[var(--sf-muted)]"><Link href="/pricing">{t("pricing")}</Link><Link href="/faq">{t("faq")}</Link><Link href="/contact">{t("contact")}</Link><Link href="/login">{t("workspaceLogin")}</Link></div></div></div><div className="border-t border-[var(--sf-line)]"><div className="sf-public-container flex flex-wrap items-center justify-between gap-3 py-4 text-xs text-[var(--sf-muted)]"><span>{t("footer")}</span><span>© {new Date().getFullYear()} SalonFlow</span></div></div></footer>;
}

export function PublicEyebrow({ children }: { children: React.ReactNode }) { return <p className="sf-kicker inline-flex items-center gap-2"><Sparkles className="size-3.5" aria-hidden="true" />{children}</p>; }
