import { Ring } from "@/components/brand/Ring";
import "@/components/catalog/discovery.css";
import { cssVars, type CatalogCategory as Category, type CatalogListing } from "@/components/catalog/Tickets";
import { type PublicLocale, usePublicLocale } from "@/contexts/PublicLocaleContext";
import { trpc } from "@/lib/trpc";
import { VERTICALS, verticalForCategory, verticalLabel, type Vertical } from "@/lib/verticals";
import { Check, LocateFixed, MapPin, Search, X } from "lucide-react";
import { type FormEvent, type ReactNode, useCallback, useMemo, useRef, useState } from "react";
import { categoryLandingPath } from "@shared/categoryLanding";

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

/** Public category landing page (replaces the ?category= query for links). */
export function marketplaceCategoryHref(slug: string) {
  return categoryLandingPath(slug);
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
                {on ? <Check className="size-4" aria-hidden="true" /> : <span className="cw-chip-dot" aria-hidden="true" />}{verticalLabel(item.id, locale)}<Ring variant="wide" draw={on} />
              </button>;
            })}
          </div>
          {list.length ? <>
            <span className="df-sep" aria-hidden="true" />
            <div className="df-group" role="group" aria-label={text.categories}>
              {list.map(category => {
                const on = categorySlug === category.slug;
                return <button key={category.id} type="button" className="cw-chip" aria-pressed={on} onClick={() => onCategory(on ? undefined : category.slug)}>{on ? <Check className="size-4" aria-hidden="true" /> : null}{category.nameKa}<Ring variant="wide" draw={on} /></button>;
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

// ---- "Near me" -------------------------------------------------------------------------------------------------
// The position lives only in this component's memory: it is never sent to the server, stored or logged.

export type NearMePoint = { latitude: number; longitude: number };

/** Great-circle distance in kilometres. */
export function distanceKm(from: NearMePoint, to: { latitudeE6: number; longitudeE6: number }) {
  const rad = Math.PI / 180;
  const dLat = (to.latitudeE6 / 1e6 - from.latitude) * rad;
  const dLng = (to.longitudeE6 / 1e6 - from.longitude) * rad;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(from.latitude * rad) * Math.cos((to.latitudeE6 / 1e6) * rad) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.min(1, Math.sqrt(a)));
}

/** Listings with a map point first, nearest first, each carrying distanceKm; the rest keep their order after them. */
export function sortByDistance<T extends Pick<CatalogListing, "mapPoint">>(items: T[], from: NearMePoint): Array<T & { distanceKm: number | null }> {
  const withDistance = items.map(item => ({ ...item, distanceKm: item.mapPoint ? distanceKm(from, item.mapPoint) : null }));
  return [...withDistance.filter(item => item.distanceKm !== null).sort((a, b) => a.distanceKm! - b.distanceKm!), ...withDistance.filter(item => item.distanceKm === null)];
}

export type NearMeStatus = "idle" | "asking" | "on" | "denied" | "unsupported" | "error";

/** Asks for the browser position only when `request` is called (a click). */
export function useNearMe() {
  const [status, setStatus] = useState<NearMeStatus>("idle");
  const [point, setPoint] = useState<NearMePoint | null>(null);
  const pending = useRef(false);
  const request = useCallback(() => {
    if (pending.current) return;
    if (typeof navigator === "undefined" || !navigator.geolocation) { setStatus("unsupported"); return; }
    pending.current = true;
    setStatus("asking");
    navigator.geolocation.getCurrentPosition(
      position => { pending.current = false; setPoint({ latitude: position.coords.latitude, longitude: position.coords.longitude }); setStatus("on"); },
      error => { pending.current = false; setPoint(null); setStatus(error.code === 1 ? "denied" : "error"); },
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 300_000 },
    );
  }, []);
  const clear = useCallback(() => { setPoint(null); setStatus("idle"); }, []);
  return { status, point, request, clear };
}

const nearMeUi = {
  ka: { button: "ჩემთან ახლოს", asking: "მდებარეობა იძებნება…", off: "ახლო ადგილების გამორთვა", privacy: "მდებარეობა მხოლოდ ამ ძიებისთვის გამოიყენება და არსად ინახება.", denied: "მდებარეობის გამოყენება დაბლოკილია. ბრაუზერის პარამეტრებში ჩართე ან მოძებნე ქალაქის მიხედვით.", unsupported: "ეს ბრაუზერი მდებარეობას ვერ ადგენს. მოძებნე ქალაქის მიხედვით.", error: "მდებარეობა ვერ დადგინდა. სცადე თავიდან.", on: (placed: number, rest: number) => rest ? `ადგილები დალაგებულია შენგან დაშორების მიხედვით. ${rest} ადგილს რუკაზე მდებარეობა არ აქვს და სიის ბოლოშია.` : "ადგილები დალაგებულია შენგან დაშორების მიხედვით.", none: "ამ სიაში რუკაზე მდებარეობის მქონე ადგილი არ არის." },
  en: { button: "Near me", asking: "Finding your location…", off: "Turn off near me", privacy: "Your location is used only for this search and is never stored.", denied: "Location access was not allowed. Turn it on in your browser settings or search by city.", unsupported: "This browser cannot find your location. Search by city instead.", error: "Your location could not be found. Try again.", on: (placed: number, rest: number) => rest ? `Sorted by distance: ${placed}. ${rest} places have no map location and are listed last.` : `Sorted by distance: ${placed}.`, none: "No places with a map location were found nearby." },
  ru: { button: "Рядом со мной", asking: "Определяем местоположение…", off: "Выключить «рядом со мной»", privacy: "Местоположение используется только для этого поиска и нигде не сохраняется.", denied: "Доступ к местоположению не разрешён. Включите его в настройках браузера или ищите по городу.", unsupported: "Этот браузер не определяет местоположение. Ищите по городу.", error: "Не удалось определить местоположение. Попробуйте ещё раз.", on: (placed: number, rest: number) => rest ? `Отсортировано по расстоянию: ${placed}. У мест без точки на карте (${rest}) расстояния нет, они в конце списка.` : `Отсортировано по расстоянию: ${placed}.`, none: "Рядом нет мест с точкой на карте." },
} as const;

/** The "near me" button, its privacy line and the inline result message. `placed`/`rest` count listings with / without coordinates. */
export function NearMe({ near, placed, rest }: { near: ReturnType<typeof useNearMe>; placed: number; rest: number }) {
  const text = nearMeUi[usePublicLocale().locale];
  const on = near.status === "on";
  const message = near.status === "denied" ? text.denied : near.status === "unsupported" ? text.unsupported : near.status === "error" ? text.error : on ? (placed ? text.on(placed, rest) : text.none) : null;
  return <div className="cw-container nm">
    <div className="nm-row">
      <button type="button" className="cw-chip nm-btn" aria-pressed={on} disabled={near.status === "asking"} onClick={on ? near.clear : near.request} data-conversion-event="DIRECTORY_NEAR_ME">
        {on ? <Check className="size-4" aria-hidden="true" /> : <LocateFixed className="size-4" aria-hidden="true" />}
        {near.status === "asking" ? text.asking : text.button}
        {on ? <span className="sr-only"> — {text.off}</span> : null}
      </button>
      <p className="nm-note">{text.privacy}</p>
    </div>
    {message ? <p className={`nm-msg${on ? "" : " nm-msg--warn"}`} role={on ? "status" : "alert"}>{message}</p> : null}
  </div>;
}
