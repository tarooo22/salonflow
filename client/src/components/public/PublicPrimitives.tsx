import { PwaInstallButton } from "@/components/pwa/PwaInstallButton";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { usePublicLocale, type PublicLocale } from "@/contexts/PublicLocaleContext";
import { ChevronDown, Menu, Sparkles, X } from "lucide-react";
import React, { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { CatalogFooter, CatalogHeader } from "@/components/catalog/CatalogChrome";

const bookingHref = "/book";
const localeOptions: Array<{ value: PublicLocale; label: string }> = [{ value: "ka", label: "ქართული" }, { value: "en", label: "English" }, { value: "ru", label: "Русский" }];

export function SalonFlowMark({ inverted = false, compact = false }: { inverted?: boolean; compact?: boolean }) {
  return <Link href="/" className={`sf-public-brand inline-flex shrink-0 items-center gap-2 rounded-xl font-semibold tracking-tight focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--sf-focus)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--sf-bg)] ${compact ? "sf-public-brand--compact" : ""}`}><span className={`sf-brand-mark ${inverted ? "sf-brand-mark--inverted" : ""}`} aria-hidden="true"><i /><i /><i /></span><span className="text-lg">SalonFlow</span></Link>;
}

export function PublicLanguageSelector({ className = "" }: { className?: string }) {
  const { locale, setLocale } = usePublicLocale();
  const [open, setOpen] = useState(false);
  const selected = localeOptions.find(option => option.value === locale) ?? localeOptions[0];
  return <DropdownMenu open={open} onOpenChange={setOpen}><DropdownMenuTrigger asChild><button type="button" className={`sf-language-trigger sf-interactive inline-flex min-h-10 items-center gap-2 rounded-xl px-3 text-xs font-semibold text-[var(--sf-ink)] focus-visible:outline-none ${className}`} aria-label="Language"><span>{selected.label}</span><ChevronDown className="size-3.5" aria-hidden="true" /></button></DropdownMenuTrigger><DropdownMenuContent align="end" sideOffset={8} className="sf-language-menu min-w-40 p-1.5"><DropdownMenuRadioGroup value={locale} onValueChange={value => { setLocale(value as PublicLocale); setOpen(false); }}>{localeOptions.map(option => <DropdownMenuRadioItem key={option.value} value={option.value} className="sf-language-option py-2.5 pr-3 text-sm font-semibold">{option.label}</DropdownMenuRadioItem>)}</DropdownMenuRadioGroup></DropdownMenuContent></DropdownMenu>;
}

// The public chrome is the catalog chrome (see DESIGN.md); these wrappers keep older pages on it.
export function PublicHeader() {
  const { t } = usePublicLocale();
  const skipToContent = (event: React.MouseEvent<HTMLAnchorElement>) => {
    const main = document.querySelector("main");
    if (!main) return;
    event.preventDefault();
    if (!main.hasAttribute("tabindex")) main.setAttribute("tabindex", "-1");
    main.focus();
    main.scrollIntoView({ block: "start" });
  };
  return <><a className="sf-skip-link" href="#main-content" onClick={skipToContent}>{t("skip")}</a><div className="cw"><CatalogHeader withSkipLink={false} /></div></>;
}

export function PublicFooter() {
  return <div className="cw"><CatalogFooter /></div>;
}

export function PublicEyebrow({ children }: { children: React.ReactNode }) { return <p className="sf-kicker inline-flex items-center gap-2"><Sparkles className="size-3.5" aria-hidden="true" />{children}</p>; }
