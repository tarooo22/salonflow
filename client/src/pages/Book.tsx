import { CatalogFooter, CatalogHeader } from "@/components/catalog/CatalogChrome";
import "@/components/catalog/discovery.css";
import { cssVars } from "@/components/catalog/Tickets";
import { usePublicMeta } from "@/components/public/PublicMeta";
import { publicWeekdayShort, type PublicLocale, usePublicLocale } from "@/contexts/PublicLocaleContext";
import { trpc } from "@/lib/trpc";
import { BRAND } from "@shared/brand";
import { CalendarClock, CalendarDays, ChevronRight, Mail, MapPin, Phone, Search } from "lucide-react";
import React, { useMemo, useState } from "react";
import { Link } from "wouter";

export type PublicDiscoveryLocation = { publicSlug: string; name: string; address: string | null; phone: string | null; email: string | null; categories: string[]; workingHours: Array<{ weekday: number; startLocalTime: string; endLocalTime: string }> };
export function filterLocationsByCategory(locations: PublicDiscoveryLocation[], category: string) { return locations.filter(location => category === "ALL" || location.categories.includes(category)); }
export function workingHoursSummary(hours: PublicDiscoveryLocation["workingHours"], locale: PublicLocale = "ka") {
  if (!hours.length) return null;
  const first = hours[0]!;
  const last = hours[hours.length - 1]!;
  const everyDay = { ka: "ყოველდღე", en: "Daily", ru: "Ежедневно" }[locale];
  const days = hours.length === 7 ? everyDay : hours.length === 1 ? publicWeekdayShort(first.weekday, locale) : `${publicWeekdayShort(first.weekday, locale)}–${publicWeekdayShort(last.weekday, locale)}`;
  return `${days} · ${first.startLocalTime}–${last.endLocalTime}`;
}

export function DiscoveryResults({ locations, category, onCategoryChange, query = "" }: { locations: PublicDiscoveryLocation[]; category: string; onCategoryChange: (category: string) => void; query?: string }) {
  const { locale, t } = usePublicLocale();
  const categories = Array.from(new Set(locations.flatMap(location => location.categories))).sort((a, b) => a.localeCompare(b, locale));
  const visibleLocations = filterLocationsByCategory(locations, category).filter(location => `${location.name} ${location.address ?? ""} ${location.categories.join(" ")}`.toLocaleLowerCase(locale).includes(query.trim().toLocaleLowerCase(locale)));
  return <>
    <div className="mt-6 flex flex-wrap gap-2" role="group" aria-label={t("categoryFilter")}>
      <button type="button" className="cw-chip" aria-pressed={category === "ALL"} onClick={() => onCategoryChange("ALL")}>{t("allServices")}</button>
      {categories.map(value => <button key={value} type="button" className="cw-chip" aria-pressed={category === value} onClick={() => onCategoryChange(value)}>{value}</button>)}
    </div>
    {!visibleLocations.length
      ? <div className="cw-notice mt-6 text-center" role="status">
        <Search className="mx-auto size-5" aria-hidden="true" />
        <p className="mt-3 text-lg font-extrabold [font-stretch:85%]">{t("noResults")}</p>
        <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-[var(--cw-ink-soft)]">{t("noResultsLead")}</p>
        <button type="button" className="cw-btn cw-btn-line mt-4 min-h-11" onClick={() => onCategoryChange("ALL")}>{t("allLocations")}</button>
      </div>
      : <div className="mt-6 grid gap-4">{visibleLocations.map(location => {
        const hours = workingHoursSummary(location.workingHours, locale);
        return <article key={location.publicSlug} className="cw-loc">
          <div className="min-w-0">
            <h2 className="text-xl font-extrabold [font-stretch:85%]">{location.name}</h2>
            {location.address
              ? <p className="mt-2 flex items-start gap-2 text-sm leading-6 text-[var(--cw-ink-soft)]"><MapPin className="mt-1 size-4 shrink-0" aria-hidden="true" />{location.address}</p>
              : <p className="mt-2 text-sm leading-6 text-[var(--cw-ink-soft)]">{t("noAddress")}</p>}
            {hours ? <p className="cw-num mt-2 flex items-center gap-2 text-xs"><CalendarClock className="size-3.5 shrink-0" aria-hidden="true" />{hours}</p> : null}
            {location.categories.length ? <ul className="mt-3 flex flex-wrap gap-1.5">{location.categories.map(item => <li key={item} className="cw-loc-label">{item}</li>)}</ul> : null}
            {location.phone || location.email ? <div className="mt-3 flex flex-wrap gap-1">
              {location.phone ? <a href={`tel:${location.phone}`} className="cw-loc-link"><Phone className="size-3.5" aria-hidden="true" />{t("call")}</a> : null}
              {location.email ? <a href={`mailto:${location.email}`} className="cw-loc-link"><Mail className="size-3.5" aria-hidden="true" />{t("email")}</a> : null}
            </div> : null}
          </div>
          <Link href={`/book/${location.publicSlug}`} className="cw-btn cw-btn-stamp shrink-0">{t("bookNow")} <ChevronRight className="size-4" aria-hidden="true" /></Link>
        </article>;
      })}</div>}
  </>;
}

export default function Book() {
  usePublicMeta({ title: `ონლაინ ჩაწერა | ${BRAND.name}`, description: "აირჩიეთ ფილიალი, სერვისი, სპეციალისტი და თავისუფალი დრო და ჩაეწერეთ ონლაინ ზარის გარეშე.", canonicalPath: "/book" });
  const { t } = usePublicLocale();
  const locations = trpc.public.locations.useQuery();
  const [category, setCategory] = useState("ALL");
  const [query, setQuery] = useState("");
  const activeLocations = useMemo(() => locations.data ?? [], [locations.data]);

  return <div className="cw min-h-screen">
    <CatalogHeader />
    <main id="main-content">
      <section className="cw-desk pb-12 pt-8 sm:pb-16 sm:pt-12" aria-labelledby="book-title">
        <div className="cw-container grid gap-8 lg:grid-cols-[1.25fr_0.75fr] lg:items-end">
          <div>
            <p className="cw-caption">{t("bookEyebrow")}</p>
            <h1 id="book-title" className="cw-display mt-3 text-[clamp(1.95rem,4.6vw,3.4rem)]">{t("bookTitle")}</h1>
            <p className="cw-lede mt-4">{t("bookLead")}</p>
          </div>
          <div className="cw-ledger text-[var(--cw-ink)]">
            <div className="cw-ledger-head" style={cssVars({ "--ledger-bg": "var(--cw-paper)", "--ledger-ink": "var(--cw-ink)" })}>
              <span className="flex items-center gap-2 font-extrabold [font-stretch:85%]"><CalendarDays className="size-4" aria-hidden="true" />{t("checkTitle")}</span>
            </div>
            <p className="px-4 py-3 text-sm leading-6 text-[var(--cw-ink-soft)]">{t("checkLead")}</p>
          </div>
        </div>
      </section>

      <section className="cw-section" aria-label={t("searchLabel")}>
        <div className="cw-container">
          <div className="max-w-xl">
            <label className="cw-field" htmlFor="location-search">
              <span className="cw-caption">{t("searchLabel")}</span>
              <input id="location-search" type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder={t("searchPlaceholder")} autoComplete="off" enterKeyHint="search" />
            </label>
          </div>

          {locations.isLoading ? <div className="mt-6 grid gap-4" role="status" aria-live="polite">{[1, 2, 3].map(item => <div key={item} className="h-32 animate-pulse rounded-[4px] border-[1.5px] border-[var(--cw-rule)] bg-white" />)}<span className="sr-only">{t("loading")}</span></div> : null}
          {locations.isError ? <div className="cw-notice cw-notice-error mt-6" role="alert"><p className="font-extrabold">{t("unavailableTitle")}</p><p className="mt-2 text-sm">{t("retry")}</p></div> : null}
          {locations.data?.length === 0 ? <div className="cw-notice mt-6">
            <CalendarDays className="size-6" aria-hidden="true" />
            <h2 className="mt-3 text-xl font-extrabold [font-stretch:85%]">{t("emptyTitle")}</h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-[var(--cw-ink-soft)]">{t("emptyLead")}</p>
          </div> : null}
          {activeLocations.length ? <DiscoveryResults locations={activeLocations} category={category} query={query} onCategoryChange={setCategory} /> : null}
        </div>
      </section>
    </main>
    <CatalogFooter />
  </div>;
}
