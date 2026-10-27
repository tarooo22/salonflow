import { CatalogFooter, CatalogHeader } from "@/components/catalog/CatalogChrome";
import { HeroIn } from "@/components/catalog/HomeMotion";
import { EmptyCatalog, listingMatchesVertical, newestListings, SalonGrid, SalonLoading, type CatalogListing as Listing } from "@/components/catalog/Tickets";
import { DiscoveryFilters, DiscoveryHead, marketplaceCategoryHref, marketplaceDiscoveryFilters, marketplaceDiscoveryHref, NearMe, sortByDistance, useNearMe } from "@/components/public/MarketplaceDiscovery";
import { usePublicMeta } from "@/components/public/PublicMeta";
import { usePublicLocale } from "@/contexts/PublicLocaleContext";
import { trpc } from "@/lib/trpc";
import { verticalForCategory, verticalLabel, type Vertical } from "@/lib/verticals";
import { BRAND } from "@shared/brand";
import { keepPreviousData } from "@tanstack/react-query";
import { Map } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useSearch } from "wouter";

export const ui = {
  ka: {
    metaTitle: "კატალოგი", metaDescription: "იპოვეთ მხოლოდ დამტკიცებული სალონები, ესთეტიკის ცენტრები და კლინიკები კატეგორიის, სახელის ან უბნის მიხედვით და გადადით მათ რეალურ საჯარო პროფილზე.",
    heroTitle: "კატალოგი", viewMap: "რუკაზე ნახვა",
    resultsLede: "კატალოგში ჩანს მხოლოდ დამტკიცებული პროფილი. „VIP“ და „რეკომენდებული“ ფასიანი განთავსებაა და არა მომხმარებლის შეფასება; თავისუფალი დრო საბოლოოდ ჩაწერისას მოწმდება.",
    countBefore: "", countAfter: " ადგილი", loading: "იტვირთება", loadFailed: "კატალოგის ჩატვირთვა ვერ მოხერხდა.", retry: "სცადე თავიდან", showMore: "მეტის ჩვენება",
    noMatchTitle: "ამ ძიებით ადგილი ვერ მოიძებნა.", clear: "ფილტრების გასუფთავება",
    emptyDental: "სტომატოლოგიური კლინიკები მალე დაემატება.", emptyVertical: (label: string) => `${label} — პირველი ადგილები მალე გამოჩნდება.`, emptyDefault: "პირველი გადამოწმებული ადგილები მალე გამოჩნდება.",
  },
  en: {
    metaTitle: "Catalog", metaDescription: "Find only approved salons, aesthetics centres and clinics by category, name or area, and open their real public profile.",
    heroTitle: "Catalog", viewMap: "View on map",
    resultsLede: "Only approved profiles appear in the catalog. “VIP” and “Recommended” are paid placements, not customer ratings; free times are checked again at booking.",
    countBefore: "Places: ", countAfter: "", loading: "Loading", loadFailed: "The catalog could not be loaded.", retry: "Try again", showMore: "Show more",
    noMatchTitle: "No places found for this search.", clear: "Clear filters",
    emptyDental: "Dental clinics will be added soon.", emptyVertical: (label: string) => `${label} — the first places will appear soon.`, emptyDefault: "The first verified places will appear soon.",
  },
  ru: {
    metaTitle: "Каталог", metaDescription: "Находите только одобренные салоны, центры эстетики и клиники по категории, названию или району и открывайте их настоящий публичный профиль.",
    heroTitle: "Каталог", viewMap: "Показать на карте",
    resultsLede: "В каталоге показаны только одобренные профили. «VIP» и «Рекомендуем» — платное размещение, а не оценка клиентов; свободное время окончательно проверяется при записи.",
    countBefore: "Мест: ", countAfter: "", loading: "Загрузка", loadFailed: "Не удалось загрузить каталог.", retry: "Повторить", showMore: "Показать ещё",
    noMatchTitle: "По этому запросу места не найдены.", clear: "Сбросить фильтры",
    emptyDental: "Стоматологические клиники скоро появятся.", emptyVertical: (label: string) => `${label} — первые места скоро появятся.`, emptyDefault: "Первые проверенные места скоро появятся.",
  },
} as const;

// shortcut: "show more" grows the page size up to the API cap (100); add offset paging if the catalog outgrows that.
const PAGE_STEP = 24;
const PAGE_MAX = 100;

export default function MarketplaceDirectory() {
  const { locale } = usePublicLocale();
  const text = ui[locale];
  usePublicMeta({ title: `${text.metaTitle} | ${BRAND.name}`, description: text.metaDescription, canonicalPath: "/salons" });
  const [location, setLocation] = useLocation();
  const urlSearch = useSearch();
  const initial = () => marketplaceDiscoveryFilters(typeof window === "undefined" ? "" : window.location.search);
  const [categorySlug, setCategorySlug] = useState<string | undefined>(() => initial().categorySlug);
  const [search, setSearch] = useState(() => initial().search);
  const [searchDraft, setSearchDraft] = useState(() => initial().search);
  const [area, setArea] = useState(() => initial().area);
  const [areaDraft, setAreaDraft] = useState(() => initial().area);
  const [limit, setLimit] = useState(48);
  const [vertical, setVertical] = useState<Vertical | null>(() => (initial().categorySlug ? verticalForCategory(initial().categorySlug!) : null));
  useEffect(() => {
    const filters = initial();
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
      setLocation(marketplaceDiscoveryHref("/salons", categorySlug, nextSearch, nextArea));
    }, 250);
    return () => window.clearTimeout(timer);
  }, [searchDraft, areaDraft, search, area, categorySlug, setLocation]);

  const near = useNearMe();
  const input = useMemo(() => ({ limit: near.point ? PAGE_MAX : limit, offset: 0, categorySlug, search: search.trim() || undefined, area: area.trim() || undefined }), [limit, near.point, categorySlug, search, area]);
  const directory = trpc.marketplace.directory.useQuery(input, { placeholderData: keepPreviousData });
  const submitNow = () => {
    const nextSearch = searchDraft.trim();
    const nextArea = areaDraft.trim();
    setSearch(nextSearch);
    setArea(nextArea);
    setLocation(marketplaceDiscoveryHref("/salons", categorySlug, nextSearch, nextArea));
  };
  const chooseCategory = (nextCategory?: string) => {
    // A category has its own indexable page; /salons?category= still works for old links.
    if (nextCategory) { setLocation(marketplaceCategoryHref(nextCategory)); return; }
    setCategorySlug(nextCategory);
    if (nextCategory) setVertical(verticalForCategory(nextCategory));
    setLocation(marketplaceDiscoveryHref("/salons", nextCategory, searchDraft, area));
  };
  const chooseVertical = (next: Vertical | null) => {
    setVertical(next);
    if (next && categorySlug && verticalForCategory(categorySlug) !== next) {
      setCategorySlug(undefined);
      setLocation(marketplaceDiscoveryHref("/salons", undefined, searchDraft, area));
    }
  };
  const clearArea = () => { setArea(""); setAreaDraft(""); setLocation(marketplaceDiscoveryHref("/salons", categorySlug, searchDraft)); };
  const clearFilters = () => { setSearchDraft(""); setSearch(""); setCategorySlug(undefined); setVertical(null); setArea(""); setAreaDraft(""); setLocation("/salons"); };

  const allItems = (directory.data?.items ?? []) as Listing[];
  const items = allItems.filter(item => listingMatchesVertical(item, vertical));
  // Paid placements first, then new listings, then the rest; each card discloses its own placement.
  const freshItems = newestListings(items.filter(item => !item.promotion));
  const featured = [
    ...items.filter(item => item.promotion?.tier === "VIP"),
    ...items.filter(item => item.promotion?.tier === "RECOMMENDED"),
    ...freshItems,
    ...items.filter(item => !item.promotion && !freshItems.includes(item)),
  ];
  // "Near me" replaces that order: listings with a consented map point by distance, the rest after them. The position never leaves the browser.
  const ordered: Listing[] = near.point ? sortByDistance(featured, near.point) : featured;
  const placedCount = near.point ? ordered.filter(item => item.distanceKm != null).length : 0;
  const queryFilters = Boolean(categorySlug || search.trim() || area.trim());
  const hasFilters = queryFilters || vertical !== null;
  const mapHref = marketplaceDiscoveryHref("/salons/map", categorySlug, search, area);
  const verticalName = vertical ? verticalLabel(vertical, locale) : null;
  const canShowMore = (directory.data?.total ?? 0) > allItems.length && limit < PAGE_MAX && !near.point;

  return <div className="cw">
    <CatalogHeader />
    <main id="main-content">
      <HeroIn>
        <DiscoveryHead
          title={text.heroTitle}
          note={!directory.isLoading && !directory.isError ? <p role="status" aria-live="polite" className="pg-count">{text.countBefore}<span className="cw-num">{ordered.length}</span>{text.countAfter}</p> : null}
          action={<Link href={mapHref} data-conversion-event="DIRECTORY_MAP_OPENED" className="pg-action"><Map className="size-5" aria-hidden="true" />{text.viewMap}</Link>}
        />
      </HeroIn>
      <DiscoveryFilters
        idPrefix="dir"
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

      <NearMe near={near} placed={placedCount} rest={ordered.length - placedCount} />

      <section className="cw-container pg-results" aria-label={text.heroTitle}>
        {directory.isLoading ? <SalonLoading label={text.loading} count={8} />
          : directory.isError ? <div role="alert" className="cw-notice cw-notice-error">
            <p>{text.loadFailed}</p>
            <button type="button" className="cw-btn cw-btn-line mt-3 min-h-11" onClick={() => directory.refetch()}>{text.retry}</button>
          </div>
          : ordered.length ? <>
            <SalonGrid items={ordered} reveal />
            {canShowMore ? <div className="pg-more"><button type="button" className="cw-btn cw-btn-line" onClick={() => setLimit(current => Math.min(PAGE_MAX, current + PAGE_STEP))}>{text.showMore}</button></div> : null}
            <p className="pg-note">{text.resultsLede}</p>
          </>
          : queryFilters ? <div className="cw-notice" role="status">
            <p className="pg-empty-title">{text.noMatchTitle}</p>
            <button type="button" className="cw-btn cw-btn-line mt-3 min-h-11" onClick={clearFilters}>{text.clear}</button>
          </div>
          : <EmptyCatalog message={vertical === "dental" ? text.emptyDental : verticalName ? text.emptyVertical(verticalName) : text.emptyDefault} />}
      </section>
    </main>
    <CatalogFooter />
  </div>;
}
