import "@/components/catalog/discovery.css";
import { cssVars, type CatalogCategory as Category } from "@/components/catalog/Tickets";
import { type PublicLocale, usePublicLocale } from "@/contexts/PublicLocaleContext";
import { trpc } from "@/lib/trpc";
import { VERTICALS, verticalForCategory, verticalLabel, verticalStyle, type Vertical } from "@/lib/verticals";
import { BRAND } from "@shared/brand";
import { ChevronDown, Search, X } from "lucide-react";
import { type FormEvent, type ReactNode, useMemo, useState } from "react";

export const DISCOVERY_CITIES = ["თბილისი", "ბათუმი", "ქუთაისი", "რუსთავი", "ზუგდიდი", "თელავი", "გორი", "ფოთი"];

export const ui = {
  ka: { searchAndFilters: "ძებნა და ფილტრები", chooseField: "სფეროს არჩევა", all: "ყველა", soon: "მალე", date: "თარიღი", searchPlaces: "ადგილების ძებნა", what: "რა?", whatSr: " — სერვისი ან ადგილის სახელი", whatPlaceholder: "მანიკიური, სალონის სახელი…", where: "სად?", whereSr: " — ქალაქი ან უბანი", wherePlaceholder: "ქალაქი ან უბანი", search: "მოძებნე", categories: "კატეგორიები", allCategories: "ყველა კატეგორია", loading: "იტვირთება…", dentalSoon: "კლინიკები და სერვისები მალე დაემატება", categoriesSoon: "კატეგორიები მალე დაემატება", areaTag: "ადგილი: ", removeFilter: "ფილტრის მოხსნა", clearFilters: "ფილტრის გასუფთავება", vipAd: "VIP / რეკლამა", recommended: "რეკომენდებული" },
  en: { searchAndFilters: "Search and filters", chooseField: "Choose a field", all: "All", soon: "soon", date: "Date", searchPlaces: "Search places", what: "What?", whatSr: " — service or place name", whatPlaceholder: "Manicure, salon name…", where: "Where?", whereSr: " — city or area", wherePlaceholder: "City or area", search: "Search", categories: "Categories", allCategories: "All categories", loading: "Loading…", dentalSoon: "Clinics and services will be added soon", categoriesSoon: "Categories will be added soon", areaTag: "Area: ", removeFilter: "Remove filter", clearFilters: "Clear filters", vipAd: "VIP / Ad", recommended: "Recommended" },
  ru: { searchAndFilters: "Поиск и фильтры", chooseField: "Выбор сферы", all: "Все", soon: "скоро", date: "Дата", searchPlaces: "Поиск мест", what: "Что?", whatSr: " — услуга или название места", whatPlaceholder: "Маникюр, название салона…", where: "Где?", whereSr: " — город или район", wherePlaceholder: "Город или район", search: "Найти", categories: "Категории", allCategories: "Все категории", loading: "Загрузка…", dentalSoon: "Клиники и услуги скоро появятся", categoriesSoon: "Категории скоро появятся", areaTag: "Место: ", removeFilter: "Убрать фильтр", clearFilters: "Сбросить фильтры", vipAd: "VIP / Реклама", recommended: "Рекомендуем" },
} as const;

export function marketplacePromotionLabel(tier: string | undefined, locale: PublicLocale = "ka") {
  return tier === "VIP" ? ui[locale].vipAd : tier === "RECOMMENDED" ? ui[locale].recommended : null;
}

export function marketplaceDiscoveryHref(path: "/salons" | "/salons/map", categorySlug?: string, search?: string, area?: string) {
  const params = new URLSearchParams();
  if (categorySlug) params.set("category", categorySlug);
  if (search?.trim()) params.set("q", search.trim());
  if (area?.trim()) params.set("area", area.trim());
  const query = params.toString();
  return query ? `${path}?${query}` : path;
}

export function marketplaceDiscoveryFilters(queryString: string) {
  const params = new URLSearchParams(queryString.startsWith("?") ? queryString.slice(1) : queryString);
  return { categorySlug: params.get("category") || undefined, search: params.get("q") || "", area: params.get("area") || "" };
}

/** Desk band with the page title and the filter card hanging below it. */
export function DiscoveryHero({ title, lede, action, children }: { title: string; lede: string; action?: ReactNode; children: ReactNode }) {
  const text = ui[usePublicLocale().locale];
  return <section className="cw-desk cw-disc-hero pb-14 pt-8 sm:pb-20 sm:pt-12" aria-label={text.searchAndFilters}>
    <div className="cw-container">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="cw-display text-[clamp(1.95rem,4.6vw,3.4rem)]">{title}</h1>
          <p className="cw-lede mt-3">{lede}</p>
        </div>
        {action}
      </div>
      {children}
    </div>
  </section>;
}

type DiscoveryFiltersProps = {
  idPrefix: string;
  vertical: Vertical | null;
  onVertical: (next: Vertical | null) => void;
  what: string;
  onWhat: (value: string) => void;
  where: string;
  onWhere: (value: string) => void;
  /** Runs when the form is submitted (Enter or the stamp button). */
  onSubmit: () => void;
  categorySlug?: string;
  onCategory: (slug?: string) => void;
  /** The committed area filter (URL value); drives the removable chip. */
  area: string;
  onClearArea: () => void;
  hasFilters: boolean;
  onClear: () => void;
};

/** The form-style filter bar: vertical tabs, what / where fields, categories grouped by vertical. */
export function DiscoveryFilters(props: DiscoveryFiltersProps) {
  const { idPrefix, vertical, onVertical, what, onWhat, where, onWhere, onSubmit, categorySlug, onCategory, area, onClearArea, hasFilters, onClear } = props;
  const { locale } = usePublicLocale();
  const text = ui[locale];
  const categories = trpc.marketplace.categories.useQuery();
  const grouped = useMemo(() => {
    const next: Record<Vertical, Category[]> = { beauty: [], aesthetics: [], dental: [] };
    for (const category of (categories.data ?? []) as Category[]) next[verticalForCategory(category.slug)].push(category);
    return next;
  }, [categories.data]);
  const selectedName = ((categories.data ?? []) as Category[]).find(category => category.slug === categorySlug)?.nameKa;
  const [catsOpen, setCatsOpen] = useState(Boolean(categorySlug));
  const shown = vertical ? VERTICALS.filter(item => item.id === vertical) : VERTICALS;
  const band = vertical ? verticalStyle(vertical).bg : "var(--cw-ink)";
  const now = new Date();
  const today = `${String(now.getDate()).padStart(2, "0")}.${String(now.getMonth() + 1).padStart(2, "0")}.${now.getFullYear()}`;
  const submit = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); onSubmit(); };

  return <div>
    <div className="cw-vtabs" role="group" aria-label={text.chooseField}>
      <button type="button" className="cw-tab cw-tab-all" aria-pressed={vertical === null} onClick={() => onVertical(null)}>{text.all}</button>
      {VERTICALS.map(item => <button key={item.id} type="button" className="cw-tab" style={cssVars({ "--tab-bg": item.bg, "--tab-ink": item.ink })} aria-pressed={vertical === item.id} onClick={() => onVertical(vertical === item.id ? null : item.id)}>
        {verticalLabel(item.id, locale)}{item.id === "dental" ? <span className="cw-tab-soon">{text.soon}</span> : null}
      </button>)}
    </div>
    <div className="cw-card cw-disc-card">
      <div className="cw-card-band" style={cssVars({ "--band": band })} />
      <div className="cw-card-inner" style={cssVars(vertical ? { "--tint": verticalStyle(vertical).bg, "--tint-amount": "16%" } : {})}>
        <div className="cw-card-head">
          <span>{text.date} <span className="cw-num ml-1 text-[var(--cw-ink)]">{today}</span></span>
          <span className="cw-num text-xs">{BRAND.domain}</span>
        </div>
        <form onSubmit={submit} role="search" aria-label={text.searchPlaces} className="mt-5 grid gap-4">
          <div className="cw-disc-fields">
            <label className="cw-field">
              <span className="cw-caption">{text.what}<span className="sr-only">{text.whatSr}</span></span>
              <input value={what} onChange={event => onWhat(event.target.value)} maxLength={120} placeholder={text.whatPlaceholder} autoComplete="off" enterKeyHint="search" />
            </label>
            <label className="cw-field">
              <span className="cw-caption">{text.where}<span className="sr-only">{text.whereSr}</span></span>
              <input value={where} onChange={event => onWhere(event.target.value)} maxLength={120} placeholder={text.wherePlaceholder} list={`${idPrefix}-cities`} autoComplete="off" enterKeyHint="search" />
            </label>
            <datalist id={`${idPrefix}-cities`}>{DISCOVERY_CITIES.map(city => <option key={city} value={city} />)}</datalist>
            <button type="submit" className="cw-btn cw-btn-stamp"><Search className="size-5" aria-hidden="true" />{text.search}</button>
          </div>

          <div>
            <button type="button" className="cw-cats-toggle" aria-expanded={catsOpen} aria-controls={`${idPrefix}-cats`} onClick={() => setCatsOpen(open => !open)}>
              <span>{text.categories}{selectedName ? <span className="font-normal"> · {selectedName}</span> : null}</span>
              <ChevronDown className={`size-4 transition-transform ${catsOpen ? "rotate-180" : ""}`} aria-hidden="true" />
            </button>
            <div id={`${idPrefix}-cats`} className="cw-cats mt-3 md:mt-0" data-collapsed={!catsOpen}>
              <div className="flex"><button type="button" className="cw-chip" aria-pressed={!categorySlug} onClick={() => onCategory(undefined)}>{text.allCategories}</button></div>
              {shown.map(item => {
                const list = grouped[item.id];
                return <div key={item.id} className={`cw-cat-group ${list.length ? "" : "cw-cat-group-soon"}`} style={cssVars({ "--g-bg": item.bg, "--g-ink": item.ink })} role="group" aria-label={verticalLabel(item.id, locale)}>
                  <div className="cw-cat-label"><span>{verticalLabel(item.id, locale)}</span><span className="cw-num text-xs">{list.length || "—"}</span></div>
                  {list.length
                    ? <div className="cw-cat-list">{list.map(category => <button key={category.id} type="button" className="cw-chip" aria-pressed={categorySlug === category.slug} onClick={() => onCategory(categorySlug === category.slug ? undefined : category.slug)}>{category.nameKa}</button>)}</div>
                    : <p className="cw-cat-soon">{categories.isLoading ? text.loading : item.id === "dental" ? text.dentalSoon : text.categoriesSoon}</p>}
                </div>;
              })}
            </div>
          </div>

          {hasFilters || area.trim() ? <div className="cw-active" aria-live="polite">
            {area.trim() ? <span className="cw-tag">{text.areaTag}{area.trim()}<button type="button" onClick={onClearArea} aria-label={text.removeFilter}><X className="size-4" aria-hidden="true" /></button></span> : null}
            {hasFilters ? <button type="button" className="cw-linkbtn" onClick={onClear}><X className="size-4" aria-hidden="true" />{text.clearFilters}</button> : null}
          </div> : null}
        </form>
      </div>
    </div>
  </div>;
}
