import "@/components/catalog/discovery.css";
import { cssVars, type CatalogCategory as Category } from "@/components/catalog/Tickets";
import { type PublicLocale, usePublicLocale } from "@/contexts/PublicLocaleContext";
import { trpc } from "@/lib/trpc";
import { VERTICALS, verticalForCategory, verticalLabel, type Vertical } from "@/lib/verticals";
import { Check, MapPin, Search, X } from "lucide-react";
import { type FormEvent, type ReactNode, useMemo } from "react";

export const DISCOVERY_CITIES = ["თბილისი", "ბათუმი", "ქუთაისი", "რუსთავი", "ზუგდიდი", "თელავი", "გორი", "ფოთი"];

export const ui = {
  ka: { searchAndFilters: "ძებნა და ფილტრები", chooseField: "სფეროს არჩევა", all: "ყველა", searchPlaces: "ადგილების ძებნა", what: "რა?", whatSr: " — სერვისი ან ადგილის სახელი", whatPlaceholder: "მანიკიური, სალონის სახელი…", where: "სად?", whereSr: " — ქალაქი ან უბანი", wherePlaceholder: "ქალაქი ან უბანი", categories: "კატეგორიები", areaTag: "ადგილი: ", removeFilter: "ფილტრის მოხსნა", clearFilters: "ფილტრების გასუფთავება", vipAd: "VIP / რეკლამა", recommended: "რეკომენდებული" },
  en: { searchAndFilters: "Search and filters", chooseField: "Choose a field", all: "All", searchPlaces: "Search places", what: "What?", whatSr: " — service or place name", whatPlaceholder: "Manicure, salon name…", where: "Where?", whereSr: " — city or area", wherePlaceholder: "City or area", categories: "Categories", areaTag: "Area: ", removeFilter: "Remove filter", clearFilters: "Clear filters", vipAd: "VIP / Ad", recommended: "Recommended" },
  ru: { searchAndFilters: "Поиск и фильтры", chooseField: "Выбор сферы", all: "Все", searchPlaces: "Поиск мест", what: "Что?", whatSr: " — услуга или название места", whatPlaceholder: "Маникюр, название салона…", where: "Где?", whereSr: " — город или район", wherePlaceholder: "Город или район", categories: "Категории", areaTag: "Место: ", removeFilter: "Убрать фильтр", clearFilters: "Сбросить фильтры", vipAd: "VIP / Реклама", recommended: "Рекомендуем" },
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

/** Plum title band with filters hanging below. Still used by /products and /vacancies (Commerce pages); /salons and /salons/map use DiscoveryHead. */
export function DiscoveryHero({ title, lede, action, children }: { title: string; lede: string; action?: ReactNode; children: ReactNode }) {
  const text = ui[usePublicLocale().locale];
  return <section className="cw-desk cw-disc-hero pb-10 pt-8 sm:pb-14 sm:pt-12" aria-label={text.searchAndFilters}>
    <div className="cw-container">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="cw-display text-[clamp(1.75rem,4vw,2.5rem)]">{title}</h1>
          <p className="cw-lede mt-3">{lede}</p>
        </div>
        {action}
      </div>
      {children}
    </div>
  </section>;
}

/** Page title row: H1, an optional count line and one action (map / list link). */
export function DiscoveryHead({ title, note, action }: { title: string; note?: ReactNode; action?: ReactNode }) {
  return <div className="cw-container pg-head">
    <div className="pg-head-title">
      <h1>{title}</h1>
      {note}
    </div>
    {action}
  </div>;
}

type DiscoveryFiltersProps = {
  idPrefix: string;
  vertical: Vertical | null;
  onVertical: (next: Vertical | null) => void;
  what: string;
  onWhat: (value: string) => void;
  where: string;
  onWhere: (value: string) => void;
  /** Runs when the form is submitted (Enter). */
  onSubmit: () => void;
  categorySlug?: string;
  onCategory: (slug?: string) => void;
  /** The committed area filter (URL value); drives the removable chip. */
  area: string;
  onClearArea: () => void;
  hasFilters: boolean;
  onClear: () => void;
};

/** Sticky filter bar: what / where fields and one scrolling chip row (verticals, then their categories). */
export function DiscoveryFilters(props: DiscoveryFiltersProps) {
  const { idPrefix, vertical, onVertical, what, onWhat, where, onWhere, onSubmit, categorySlug, onCategory, area, onClearArea, hasFilters, onClear } = props;
  const { locale } = usePublicLocale();
  const text = ui[locale];
  const categories = trpc.marketplace.categories.useQuery();
  const list = useMemo(() => ((categories.data ?? []) as Category[]).filter(category => !vertical || verticalForCategory(category.slug) === vertical), [categories.data, vertical]);
  const submit = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); onSubmit(); };
  const noneChosen = !vertical && !categorySlug;
  const chooseAll = () => { onVertical(null); if (categorySlug) onCategory(undefined); };

  return <>
    <div className="df-bar">
      <div className="cw-container df-inner">
        <form onSubmit={submit} role="search" aria-label={text.searchPlaces} className="df-row">
          <label className="df-field">
            <span className="sr-only">{text.what}{text.whatSr}</span>
            <Search className="size-5" aria-hidden="true" />
            <input value={what} onChange={event => onWhat(event.target.value)} maxLength={120} placeholder={text.whatPlaceholder} autoComplete="off" enterKeyHint="search" />
          </label>
          <label className="df-field">
            <span className="sr-only">{text.where}{text.whereSr}</span>
            <MapPin className="size-5" aria-hidden="true" />
            <input value={where} onChange={event => onWhere(event.target.value)} maxLength={120} placeholder={text.wherePlaceholder} list={`${idPrefix}-cities`} autoComplete="off" enterKeyHint="search" />
          </label>
          <datalist id={`${idPrefix}-cities`}>{DISCOVERY_CITIES.map(city => <option key={city} value={city} />)}</datalist>
        </form>
        <div className="df-chips">
          <div className="df-group" role="group" aria-label={text.chooseField}>
            <button type="button" className="cw-chip" aria-pressed={noneChosen} onClick={chooseAll}>{noneChosen ? <Check className="size-4" aria-hidden="true" /> : null}{text.all}</button>
            {VERTICALS.map(item => {
              const on = vertical === item.id;
              return <button key={item.id} type="button" className="cw-chip" data-vertical="true" style={cssVars({ "--chip-bg": item.bg, "--chip-ink": item.ink })} aria-pressed={on} onClick={() => onVertical(on ? null : item.id)}>
                {on ? <Check className="size-4" aria-hidden="true" /> : <span className="cw-chip-dot" aria-hidden="true" />}{verticalLabel(item.id, locale)}
              </button>;
            })}
          </div>
          {list.length ? <>
            <span className="df-sep" aria-hidden="true" />
            <div className="df-group" role="group" aria-label={text.categories}>
              {list.map(category => {
                const on = categorySlug === category.slug;
                return <button key={category.id} type="button" className="cw-chip" aria-pressed={on} onClick={() => onCategory(on ? undefined : category.slug)}>{on ? <Check className="size-4" aria-hidden="true" /> : null}{category.nameKa}</button>;
              })}
            </div>
          </> : null}
        </div>
      </div>
    </div>
    {hasFilters || area.trim() ? <div className="cw-container cw-active" aria-live="polite">
      {area.trim() ? <span className="cw-tag">{text.areaTag}{area.trim()}<button type="button" onClick={onClearArea} aria-label={text.removeFilter}><X className="size-4" aria-hidden="true" /></button></span> : null}
      {hasFilters ? <button type="button" className="cw-linkbtn" onClick={onClear}><X className="size-4" aria-hidden="true" />{text.clearFilters}</button> : null}
    </div> : null}
  </>;
}
