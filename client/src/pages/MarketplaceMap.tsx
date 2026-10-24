import { CatalogFooter, CatalogHeader } from "@/components/catalog/CatalogChrome";
import { HeroIn } from "@/components/catalog/HomeMotion";
import { listingMatchesVertical, SalonCard, type CatalogListing } from "@/components/catalog/Tickets";
import { DiscoveryFilters, DiscoveryHead, marketplaceDiscoveryFilters, marketplaceDiscoveryHref } from "@/components/public/MarketplaceDiscovery";
import { usePublicMeta } from "@/components/public/PublicMeta";
import { usePublicLocale } from "@/contexts/PublicLocaleContext";
import { trpc } from "@/lib/trpc";
import { verticalForCategory, type Vertical } from "@/lib/verticals";
import { BRAND } from "@shared/brand";
import { ExternalLink, List, MapPin } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useSearch } from "wouter";

type MapPoint = { latitudeE6: number; longitudeE6: number };
type MapListing = { locationId: string; name: string; publicSlug: string; mapPoint: MapPoint; [key: string]: unknown };

export function marketplaceMapMarkerPosition(point: MapPoint, points: MapPoint[]) {
  const latitudes = points.map(item => item.latitudeE6);
  const longitudes = points.map(item => item.longitudeE6);
  const minLat = Math.min(...latitudes);
  const maxLat = Math.max(...latitudes);
  const minLng = Math.min(...longitudes);
  const maxLng = Math.max(...longitudes);
  return {
    left: `${maxLng === minLng ? 50 : 10 + ((point.longitudeE6 - minLng) / (maxLng - minLng)) * 80}%`,
    top: `${maxLat === minLat ? 50 : 10 + ((maxLat - point.latitudeE6) / (maxLat - minLat)) * 80}%`,
  };
}

export const ui = {
  ka: {
    metaTitle: "ადგილები რუკაზე", metaDescription: "ნახე მხოლოდ იმ დამტკიცებული ადგილების რუკა, რომლებმაც საჯარო მდებარეობის გაზიარებაზე დამოუკიდებლად განაცხადეს თანხმობა.",
    heroTitle: "ადგილები რუკაზე", viewList: "სიის ნახვა",
    canvasTitle: "ადგილები რუკაზე", summary: (places: number, markers: number) => `${places} ადგილი · ${markers} მონიშვნა`,
    canvasNote: "ეს არის გაზიარებული მდებარეობების ვიზუალური განლაგება. ერთ წერტილში რამდენიმე ადგილი ერთ მონიშვნაში ჯგუფდება; ზუსტი მიმართულება იხსნება Google Maps-ში, ხოლო სრული ტექსტური სია გვერდითაა.",
    markersGroup: "რუკის მონიშვნები", clusterLabel: (count: number) => `${count} ადგილი ერთ მონიშვნაში`, markerLabel: (name: string, number: string) => `${name} — რუკის მონიშვნა, № ${number}`,
    selectedMarker: "არჩეული მონიშვნა", pickMarker: "აირჩიე მონიშვნა რუკაზე.",
    mapAndList: "რუკა და სია", loading: "იტვირთება",
    unavailableTitle: "რუკა ახლა მიუწვდომელია", unavailableText: "ტექსტური სიისთვის დაბრუნდი კატალოგში და სცადე მოგვიანებით.", backToCatalog: "კატალოგში დაბრუნება",
    emptyTitle: "ამ ფილტრით რუკაზე ადგილი ჯერ არ ჩანს.", emptyText: "ადგილი რუკაზე მხოლოდ მფლობელის თანხმობით ჩნდება.",
    listTitle: "სია და მიმართულება", listNote: "თითოეული ბარათი მიუთითებს ადგილის საჯარო გვერდზე; მიმართულება იხსნება ცალკე რუკის სერვისში.",
    directions: "Google Maps-ში მიმართულება", newTab: " (ახალ ჩანართში)",
  },
  en: {
    metaTitle: "Places on the map", metaDescription: "See the map of approved places that have separately agreed to share their public location.",
    heroTitle: "Places on the map", viewList: "View list",
    canvasTitle: "Places on the map", summary: (places: number, markers: number) => `Places: ${places} · Markers: ${markers}`,
    canvasNote: "This is a visual layout of shared locations. Several places at the same point are grouped into one marker; exact directions open in Google Maps, and the full text list is alongside.",
    markersGroup: "Map markers", clusterLabel: (count: number) => `${count} places in one marker`, markerLabel: (name: string, number: string) => `${name} — map marker, № ${number}`,
    selectedMarker: "Selected marker", pickMarker: "Select a marker on the map.",
    mapAndList: "Map and list", loading: "Loading",
    unavailableTitle: "The map is unavailable right now", unavailableText: "For the text list, go back to the catalog and try again later.", backToCatalog: "Back to the catalog",
    emptyTitle: "No place shows on the map for this filter yet.", emptyText: "A place appears on the map only with the owner's consent.",
    listTitle: "List and directions", listNote: "Each card links to the place's public page; directions open in a separate map service.",
    directions: "Directions in Google Maps", newTab: " (opens in a new tab)",
  },
  ru: {
    metaTitle: "Места на карте", metaDescription: "Карта одобренных мест, которые отдельно согласились показывать своё публичное местоположение.",
    heroTitle: "Места на карте", viewList: "Показать списком",
    canvasTitle: "Места на карте", summary: (places: number, markers: number) => `Мест: ${places} · Меток: ${markers}`,
    canvasNote: "Это визуальное расположение открытых местоположений. Несколько мест в одной точке объединяются в одну метку; точный маршрут открывается в Google Maps, а полный текстовый список находится рядом.",
    markersGroup: "Метки на карте", clusterLabel: (count: number) => `Мест в одной метке: ${count}`, markerLabel: (name: string, number: string) => `${name} — метка на карте, № ${number}`,
    selectedMarker: "Выбранная метка", pickMarker: "Выберите метку на карте.",
    mapAndList: "Карта и список", loading: "Загрузка",
    unavailableTitle: "Карта сейчас недоступна", unavailableText: "Для текстового списка вернитесь в каталог и повторите позже.", backToCatalog: "Вернуться в каталог",
    emptyTitle: "По этому фильтру на карте пока нет мест.", emptyText: "Место появляется на карте только с согласия владельца.",
    listTitle: "Список и маршрут", listNote: "Каждая карточка ведёт на публичную страницу места; маршрут открывается в отдельном картографическом сервисе.",
    directions: "Маршрут в Google Maps", newTab: " (откроется в новой вкладке)",
  },
} as const;

const markerNumber = (index: number) => String(index + 1).padStart(3, "0");

function MarketplaceMapCanvas({ listings }: { listings: MapListing[] }) {
  const text = ui[usePublicLocale().locale];
  const clusters = Array.from(listings.reduce((groups, listing) => {
    const key = `${listing.mapPoint.latitudeE6}:${listing.mapPoint.longitudeE6}`;
    const current = groups.get(key) ?? { key, point: listing.mapPoint, listings: [] as MapListing[] };
    current.listings.push(listing);
    groups.set(key, current);
    return groups;
  }, new Map<string, { key: string; point: MapPoint; listings: MapListing[] }>()).values());
  const [activeCluster, setActiveCluster] = useState<string | null>(clusters[0]?.key ?? null);
  const points = clusters.map(cluster => cluster.point);
  const active = clusters.find(cluster => cluster.key === activeCluster) ?? null;

  return <section className="cw-map-frame" aria-labelledby="market-canvas-title">
    <div className="cw-map-head">
      <h2 id="market-canvas-title" className="text-lg font-bold">{text.canvasTitle}</h2>
      <span className="cw-num text-xs text-[var(--cw-ink-soft)]">{text.summary(listings.length, clusters.length)}</span>
    </div>
    <p className="px-4 pt-3 text-sm leading-6 text-[var(--cw-ink-soft)]">{text.canvasNote}</p>
    <div className="mt-3 border-t-[1.5px] border-[var(--cw-ink)]">
      <div className="cw-map-plane" role="group" aria-label={text.markersGroup}>
        {clusters.map(cluster => {
          const position = marketplaceMapMarkerPosition(cluster.point, points);
          const isActive = activeCluster === cluster.key;
          const count = cluster.listings.length;
          const first = cluster.listings[0]!;
          return <button key={cluster.key} type="button" onClick={() => setActiveCluster(cluster.key)} style={position} className="cw-map-marker" aria-pressed={isActive}
            aria-label={count > 1 ? text.clusterLabel(count) : text.markerLabel(first.name, markerNumber(listings.indexOf(first)))}>
            <MapPin className="size-4" aria-hidden="true" />
            <span aria-hidden="true">{count > 1 ? `×${count}` : markerNumber(listings.indexOf(first))}</span>
          </button>;
        })}
      </div>
    </div>
    <div className="cw-map-foot" aria-live="polite">
      {active ? <>
        <p className="cw-caption">{text.selectedMarker}</p>
        <ul className="mt-2 grid gap-1">{active.listings.map(item => <li key={item.locationId} className="flex flex-wrap items-baseline gap-x-3 text-sm">
          <span className="cw-num text-xs text-[var(--cw-ink-soft)]">№ {markerNumber(listings.indexOf(item))}</span>
          <Link href={`/salon/${item.publicSlug}`} className="font-bold text-[var(--cw-stamp)] underline">{item.name}</Link>
        </li>)}</ul>
      </> : <p className="text-sm text-[var(--cw-ink-soft)]">{text.pickMarker}</p>}
    </div>
  </section>;
}

export default function MarketplaceMap() {
  const text = ui[usePublicLocale().locale];
  usePublicMeta({ title: `${text.metaTitle} | ${BRAND.name}`, description: text.metaDescription, canonicalPath: "/salons/map" });
  const [location, setLocation] = useLocation();
  const urlSearch = useSearch();
  const readFilters = () => marketplaceDiscoveryFilters(typeof window === "undefined" ? "" : window.location.search);
  const [categorySlug, setCategorySlug] = useState<string | undefined>(() => readFilters().categorySlug);
  const [search, setSearch] = useState(() => readFilters().search);
  const [searchDraft, setSearchDraft] = useState(() => readFilters().search);
  const [area, setArea] = useState(() => readFilters().area);
  const [areaDraft, setAreaDraft] = useState(() => readFilters().area);
  const [vertical, setVertical] = useState<Vertical | null>(() => (readFilters().categorySlug ? verticalForCategory(readFilters().categorySlug!) : null));
  useEffect(() => {
    const filters = readFilters();
    setCategorySlug(filters.categorySlug);
    setSearch(filters.search);
    setSearchDraft(filters.search);
    setArea(filters.area);
    setAreaDraft(filters.area);
    if (filters.categorySlug) setVertical(verticalForCategory(filters.categorySlug));
  }, [location, urlSearch]);
  useEffect(() => {
    const timer = window.setTimeout(() => {
      const nextSearch = searchDraft.trim();
      const nextArea = areaDraft.trim();
      if (nextSearch === search.trim() && nextArea === area.trim()) return;
      setSearch(nextSearch);
      setArea(nextArea);
      setLocation(marketplaceDiscoveryHref("/salons/map", categorySlug, nextSearch, nextArea));
    }, 250);
    return () => window.clearTimeout(timer);
  }, [searchDraft, areaDraft, search, area, categorySlug, setLocation]);

  const input = useMemo(() => ({ limit: 48, offset: 0, categorySlug, search: search.trim() || undefined, area: area.trim() || undefined }), [categorySlug, search, area]);
  const result = trpc.marketplace.mapResults.useQuery(input);
  const allListings = (result.data?.items ?? []) as unknown as MapListing[];
  const listings = allListings.filter(item => listingMatchesVertical(item as unknown as CatalogListing, vertical));
  const submitNow = () => {
    const nextSearch = searchDraft.trim();
    const nextArea = areaDraft.trim();
    setSearch(nextSearch);
    setArea(nextArea);
    setLocation(marketplaceDiscoveryHref("/salons/map", categorySlug, nextSearch, nextArea));
  };
  const chooseCategory = (nextCategory?: string) => {
    setCategorySlug(nextCategory);
    if (nextCategory) setVertical(verticalForCategory(nextCategory));
    setLocation(marketplaceDiscoveryHref("/salons/map", nextCategory, searchDraft, area));
  };
  const chooseVertical = (next: Vertical | null) => {
    setVertical(next);
    if (next && categorySlug && verticalForCategory(categorySlug) !== next) {
      setCategorySlug(undefined);
      setLocation(marketplaceDiscoveryHref("/salons/map", undefined, searchDraft, area));
    }
  };
  const clearArea = () => { setArea(""); setAreaDraft(""); setLocation(marketplaceDiscoveryHref("/salons/map", categorySlug, searchDraft)); };
  const clearFilters = () => { setSearchDraft(""); setSearch(""); setAreaDraft(""); setArea(""); setCategorySlug(undefined); setVertical(null); setLocation("/salons/map"); };
  const queryFilters = Boolean(categorySlug || search.trim() || area.trim());
  const hasFilters = queryFilters || vertical !== null;
  const listHref = marketplaceDiscoveryHref("/salons", categorySlug, search, area);

  return <div className="cw">
    <CatalogHeader />
    <main id="main-content">
      <HeroIn>
        <DiscoveryHead
          title={text.heroTitle}
          action={<Link href={listHref} className="pg-action"><List className="size-5" aria-hidden="true" />{text.viewList}</Link>}
        />
      </HeroIn>
      <DiscoveryFilters
          idPrefix="map"
          vertical={vertical}
          onVertical={chooseVertical}
          what={searchDraft}
          onWhat={setSearchDraft}
          where={areaDraft}
          onWhere={setAreaDraft}
          onSubmit={submitNow}
          categorySlug={categorySlug}
          onCategory={chooseCategory}
          area={area}
          onClearArea={clearArea}
          hasFilters={hasFilters}
          onClear={clearFilters}
      />

      <section className="pg-results" aria-label={text.mapAndList}>
        <div className="cw-container">
          <div>
            {result.isLoading ? <div className="grid gap-5 lg:grid-cols-[minmax(0,1.05fr)_minmax(20rem,0.95fr)]" aria-busy="true" aria-label={text.loading}><div className="h-96 animate-pulse rounded-[16px] border border-[var(--cw-rule)] bg-[var(--sf-surface)]" /><div className="h-96 animate-pulse rounded-[16px] border border-[var(--cw-rule)] bg-[var(--sf-surface)]" /></div> : null}
            {result.isError ? <div className="cw-notice cw-notice-error" role="alert">
              <h2 className="text-xl font-bold">{text.unavailableTitle}</h2>
              <p className="mt-2">{text.unavailableText}</p>
              <Link href={listHref} className="cw-linkbtn mt-3">{text.backToCatalog}</Link>
            </div> : null}
            {!result.isLoading && !result.isError && !listings.length ? <div className="cw-empty" role="status">
              <span className="cw-empty-icon"><MapPin aria-hidden="true" /></span>
              <h2>{text.emptyTitle}</h2>
              <p>{text.emptyText}</p>
              <Link href={listHref} className="cw-btn cw-btn-line min-h-11">{text.viewList}</Link>
            </div> : null}
            {listings.length ? <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(20rem,0.95fr)]">
              <div className="lg:sticky lg:top-4"><MarketplaceMapCanvas listings={listings} /></div>
              <section aria-labelledby="map-list-title">
                <h2 id="map-list-title" className="text-xl font-bold">{text.listTitle}</h2>
                <p className="mt-1 text-sm text-[var(--cw-ink-soft)]">{text.listNote}</p>
                <ul className="sc-grid sc-grid--fit mt-4">{listings.map((item, index) => <li key={item.locationId}>
                  <SalonCard item={item as unknown as CatalogListing} eager={index < 4} />
                  <a href={`https://www.google.com/maps/search/?api=1&query=${item.mapPoint.latitudeE6 / 1_000_000},${item.mapPoint.longitudeE6 / 1_000_000}`} target="_blank" rel="noreferrer" className="cw-loc-link mt-1">{text.directions}<span className="sr-only">{text.newTab}</span> <ExternalLink className="size-3.5" aria-hidden="true" /></a>
                </li>)}</ul>
              </section>
            </div> : null}
          </div>
        </div>
      </section>
    </main>
    <CatalogFooter />
  </div>;
}
