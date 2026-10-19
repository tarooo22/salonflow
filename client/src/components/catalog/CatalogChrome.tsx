import { PublicLanguageSelector } from "@/components/public/PublicPrimitives";
import { usePublicLocale } from "@/contexts/PublicLocaleContext";
import { BRAND } from "@shared/brand";
import { LogIn, Menu, X } from "lucide-react";
import React, { useState } from "react";
import { Link } from "wouter";
import "./catalog.css";

export const ui = {
  ka: { home: "მთავარი", tagline: "ონლაინ ჩაწერა სალონებში, ესთეტიკის ცენტრებსა და სტომატოლოგიურ კლინიკებში — მთელ საქართველოში.", forClients: "კლიენტისთვის", faq: "ხშირი კითხვები", forBusiness: "ბიზნესისთვის", becomePartner: "გახდი პარტნიორი", pricing: "ტარიფები", contact: "კონტაქტი", privacy: "კონფიდენციალურობა" },
  en: { home: "Home", tagline: "Online booking at salons, aesthetics centres and dental clinics across Georgia.", forClients: "For clients", faq: "FAQ", forBusiness: "For business", becomePartner: "Become a partner", pricing: "Pricing", contact: "Contact", privacy: "Privacy" },
  ru: { home: "Главная", tagline: "Онлайн-запись в салоны, центры эстетики и стоматологические клиники по всей Грузии.", forClients: "Клиентам", faq: "Частые вопросы", forBusiness: "Бизнесу", becomePartner: "Стать партнёром", pricing: "Тарифы", contact: "Контакты", privacy: "Конфиденциальность" },
} as const;

const navigation: Array<{ href: string; label: "catalog" | "map" | "products" | "vacancies" | "forBusiness" }> = [
  { href: "/salons", label: "catalog" },
  { href: "/salons/map", label: "map" },
  { href: "/products", label: "products" },
  { href: "/vacancies", label: "vacancies" },
  { href: "/partner", label: "forBusiness" },
];

export function CatalogWordmark() {
  return <span className="inline-flex items-baseline gap-2">
    <span className="cw-display text-[1.7rem] leading-none">{BRAND.nameKa}</span>
    <span className="cw-num hidden text-[0.7rem] text-[var(--cw-on-desk-soft)] sm:inline">{BRAND.domain}</span>
  </span>;
}

function NavItem({ item, onNavigate }: { item: (typeof navigation)[number]; onNavigate?: () => void }) {
  const { t } = usePublicLocale();
  return <Link href={item.href} className="cw-navlink" onClick={onNavigate}>{t(item.label)}</Link>;
}

export function CatalogHeader({ withSkipLink = true }: { withSkipLink?: boolean }) {
  const [open, setOpen] = useState(false);
  const { locale, t } = usePublicLocale();
  return <header className="cw-desk relative z-20">
    {withSkipLink ? <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-50 focus:rounded focus:bg-white focus:px-4 focus:py-2 focus:text-[var(--cw-ink)]">{t("skip")}</a> : null}
    <div className="cw-container flex min-h-16 items-center justify-between gap-4 py-3">
      <Link href="/" aria-label={`${BRAND.nameKa} — ${ui[locale].home}`}><CatalogWordmark /></Link>
      <nav aria-label={t("mainNav")} className="hidden items-center gap-1 lg:flex">{navigation.map(item => <NavItem key={item.href} item={item} />)}</nav>
      <div className="flex items-center gap-2">
        <span className="hidden sm:block"><PublicLanguageSelector /></span>
        <Link href="/login" className="cw-btn cw-btn-paper min-h-10 px-3 text-sm sm:px-4"><LogIn className="size-4" aria-hidden="true" /><span className="max-sm:sr-only">{t("signIn")}</span></Link>
        <button type="button" className="cw-navlink lg:hidden" aria-expanded={open} aria-controls="cw-mobile-nav" aria-label={open ? t("closeMenu") : t("openMenu")} onClick={() => setOpen(value => !value)}>
          {open ? <X className="size-5" aria-hidden="true" /> : <Menu className="size-5" aria-hidden="true" />}
        </button>
      </div>
    </div>
    {open ? <nav id="cw-mobile-nav" aria-label={t("mobileNav")} className="cw-container grid gap-1 border-t border-[var(--cw-desk-soft)] pb-4 pt-2 lg:hidden">{navigation.map(item => <NavItem key={item.href} item={item} onNavigate={() => setOpen(false)} />)}</nav> : null}
  </header>;
}

export function CatalogFooter() {
  const { t, locale } = usePublicLocale();
  const text = ui[locale];
  const year = new Date().getFullYear();
  return <footer className="cw-desk">
    <div className="cw-container grid gap-10 py-14 md:grid-cols-[1.4fr_1fr_1fr]">
      <div>
        <CatalogWordmark />
        <p className="mt-4 max-w-sm text-sm leading-6 text-[var(--cw-on-desk-soft)]">{text.tagline}</p>
      </div>
      <div>
        <p className="cw-caption">{text.forClients}</p>
        <ul className="mt-3 grid gap-2 text-sm">
          <li><Link href="/salons" className="hover:underline">{t("catalog")}</Link></li>
          <li><Link href="/salons/map" className="hover:underline">{t("map")}</Link></li>
          <li><Link href="/products" className="hover:underline">{t("products")}</Link></li>
          <li><Link href="/vacancies" className="hover:underline">{t("vacancies")}</Link></li>
          <li><Link href="/faq" className="hover:underline">{text.faq}</Link></li>
        </ul>
      </div>
      <div>
        <p className="cw-caption">{text.forBusiness}</p>
        <ul className="mt-3 grid gap-2 text-sm">
          <li><Link href="/partner" className="hover:underline">{text.becomePartner}</Link></li>
          <li><Link href="/pricing" className="hover:underline">{text.pricing}</Link></li>
          <li><Link href="/contact" className="hover:underline">{text.contact}</Link></li>
          <li><Link href="/privacy" className="hover:underline">{text.privacy}</Link></li>
        </ul>
      </div>
    </div>
    <div className="cw-container border-t border-[var(--cw-desk-soft)] py-5 text-xs text-[var(--cw-on-desk-soft)]"><span className="cw-num">© {year}</span> {BRAND.name}</div>
  </footer>;
}
