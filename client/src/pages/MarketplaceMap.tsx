import { CatalogFooter, CatalogHeader } from "@/components/catalog/CatalogChrome";
import { listingMatchesVertical, Ticket, type CatalogListing } from "@/components/catalog/Tickets";
import { DiscoveryFilters, DiscoveryHero, marketplaceDiscoveryFilters, marketplaceDiscoveryHref } from "@/components/public/MarketplaceDiscovery";
import { usePublicMeta } from "@/components/public/PublicMeta";
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

const ticketNumber = (index: number) => String(index + 1).padStart(3, "0");

function MarketplaceMapCanvas({ listings }: { listings: MapListing[] }) {
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
      <h2 id="market-canvas-title" className="text-lg font-extrabold [font-stretch:85%]">ადგილები რუკაზე</h2>
      <span className="cw-num text-xs text-[var(--cw-ink-soft)]">{listings.length} ადგილი · {clusters.length} მონიშვნა</span>
    </div>
    <p className="px-4 pt-3 text-sm leading-6 text-[var(--cw-ink-soft)]">ეს არის გაზიარებული მდებარეობების ვიზუალური განლაგება. ერთ წერტილში რამდენიმე ადგილი ერთ მონიშვნაში ჯგუფდება; ზუსტი მიმართულება იხსნება Google Maps-ში, ხოლო სრული ტექსტური სია გვერდითაა.</p>
    <div className="mt-3 border-t-[1.5px] border-[var(--cw-ink)]">
      <div className="cw-map-plane" role="group" aria-label="რუკის მონიშვნები">
        {clusters.map(cluster => {
          const position = marketplaceMapMarkerPosition(cluster.point, points);
          const isActive = activeCluster === cluster.key;
          const count = cluster.listings.length;
          const first = cluster.listings[0]!;
          return <button key={cluster.key} type="button" onClick={() => setActiveCluster(cluster.key)} style={position} className="cw-map-marker" aria-pressed={isActive}
            aria-label={count > 1 ? `${count} ადგილი ერთ მონიშვნაში` : `${first.name} — რუკის მონიშვნა, № ${ticketNumber(listings.indexOf(first))}`}>
            <MapPin className="size-4" aria-hidden="true" />
            <span aria-hidden="true">{count > 1 ? `×${count}` : ticketNumber(listings.indexOf(first))}</span>
          </button>;
        })}
      </div>
    </div>
    <div className="cw-map-foot" aria-live="polite">
      {active ? <>
        <p className="cw-caption">არჩეული მონიშვნა</p>
        <ul className="mt-2 grid gap-1">{active.listings.map(item => <li key={item.locationId} className="flex flex-wrap items-baseline gap-x-3 text-sm">
          <span className="cw-num text-xs text-[var(--cw-ink-soft)]">№ {ticketNumber(listings.indexOf(item))}</span>
          <Link href={`/salon/${item.publicSlug}`} className="font-extrabold text-[var(--cw-stamp)] underline">{item.name}</Link>
        </li>)}</ul>
      </> : <p className="text-sm text-[var(--cw-ink-soft)]">აირჩიეთ მონიშვნა რუკაზე.</p>}
    </div>
  </section>;
}

export default function MarketplaceMap() {
  usePublicMeta({ title: `ადგილები რუკაზე | ${BRAND.name}`, description: "იხილეთ მხოლოდ იმ დამტკიცებული ადგილების რუკა, რომლებმაც საჯარო მდებარეობის გაზიარებაზე დამოუკიდებლად განაცხადეს თანხმობა.", canonicalPath: "/salons/map" });
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

  return <div className="cw min-h-screen">
    <CatalogHeader />
    <main id="main-content">
      <DiscoveryHero
        title="ადგილები რუკაზე"
        lede="აქ ჩანს მხოლოდ დამტკიცებული ადგილები, რომელთა მფლობელმაც დამოუკიდებლად დაადასტურა მდებარეობის წერტილი და რუკაზე გამოჩენას დაეთანხმა."
        action={<Link href={listHref} className="cw-btn cw-btn-line min-h-11 text-white"><List className="size-5" aria-hidden="true" />სიის ნახვა</Link>}
      >
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
      </DiscoveryHero>

      <section className="cw-section" aria-label="რუკა და სია">
        <div className="cw-container">
          <p className="text-sm text-[var(--cw-ink-soft)]">რუკის წერტილი მხოლოდ მფლობელის აშკარა თანხმობის შემდეგ ჩანს; ჩვეულებრივი კატალოგი კოორდინატებს არ აბრუნებს.</p>
          <div className="mt-6">
            {result.isLoading ? <div className="grid gap-5 lg:grid-cols-[minmax(0,1.05fr)_minmax(20rem,0.95fr)]" aria-busy="true" aria-label="იტვირთება"><div className="h-96 animate-pulse rounded-[4px] border-[1.5px] border-[var(--cw-rule)] bg-white" /><div className="h-96 animate-pulse rounded-[4px] border-[1.5px] border-[var(--cw-rule)] bg-white" /></div> : null}
            {result.isError ? <div className="cw-notice cw-notice-error" role="alert">
              <h2 className="text-xl font-extrabold [font-stretch:85%]">რუკა ახლა მიუწვდომელია</h2>
              <p className="mt-2">ტექსტური სიისთვის დაბრუნდით კატალოგში და სცადეთ მოგვიანებით.</p>
              <Link href={listHref} className="cw-linkbtn mt-3">კატალოგში დაბრუნება</Link>
            </div> : null}
            {!result.isLoading && !result.isError && !listings.length ? <div className="cw-notice" role="status">
              <h2 className="text-xl font-extrabold [font-stretch:85%]">ამ ფილტრში რუკაზე გამოჩენილი ადგილი ჯერ არ არის.</h2>
              <p className="mt-2 max-w-xl text-[var(--cw-ink-soft)]">ეს შეიძლება ნიშნავდეს, რომ ჯერ არცერთმა დამტკიცებულმა ადგილმა არ დაადასტურა წერტილი და არ მისცა რუკაზე გამოჩენის თანხმობა. გამოგონილ ან თანხმობის გარეშე მონაცემებს არ ვაჩვენებთ.</p>
              <div className="mt-4 flex flex-wrap gap-3">
                {hasFilters ? <button type="button" className="cw-btn cw-btn-line min-h-11" onClick={clearFilters}>ფილტრის გასუფთავება</button> : null}
                <Link href={listHref} className="cw-btn cw-btn-stamp min-h-11">კატალოგის სია</Link>
              </div>
            </div> : null}
            {listings.length ? <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(20rem,0.95fr)]">
              <div className="lg:sticky lg:top-4"><MarketplaceMapCanvas listings={listings} /></div>
              <section aria-labelledby="map-list-title">
                <h2 id="map-list-title" className="text-xl font-extrabold [font-stretch:85%]">სია და მიმართულება</h2>
                <p className="mt-1 text-sm text-[var(--cw-ink-soft)]">თითოეული ბილეთი მიუთითებს ადგილის საჯარო გვერდზე; მიმართულება იხსნება ცალკე რუკის სერვისში.</p>
                <div className="mt-4 grid gap-5">{listings.map((item, index) => <div key={item.locationId}>
                  <Ticket item={item as unknown as CatalogListing} number={index + 1} />
                  <a href={`https://www.google.com/maps/search/?api=1&query=${item.mapPoint.latitudeE6 / 1_000_000},${item.mapPoint.longitudeE6 / 1_000_000}`} target="_blank" rel="noreferrer" className="cw-loc-link mt-1">Google Maps-ში მიმართულება<span className="sr-only"> (ახალ ჩანართში)</span> <ExternalLink className="size-3.5" aria-hidden="true" /></a>
                </div>)}</div>
              </section>
            </div> : null}
          </div>
        </div>
      </section>
    </main>
    <CatalogFooter />
  </div>;
}
