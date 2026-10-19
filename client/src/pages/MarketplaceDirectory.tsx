import { CatalogFooter, CatalogHeader } from "@/components/catalog/CatalogChrome";
import { EmptyTickets, listingMatchesVertical, NEW_LISTING_DAYS, newestListings, TicketShelf, type CatalogListing as Listing } from "@/components/catalog/Tickets";
import { DiscoveryFilters, DiscoveryHero, marketplaceDiscoveryFilters, marketplaceDiscoveryHref } from "@/components/public/MarketplaceDiscovery";
import { usePublicMeta } from "@/components/public/PublicMeta";
import { usePublicLocale } from "@/contexts/PublicLocaleContext";
import { trpc } from "@/lib/trpc";
import { verticalForCategory, verticalLabel, type Vertical } from "@/lib/verticals";
import { BRAND } from "@shared/brand";
import { Map } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useSearch } from "wouter";

export const ui = {
  ka: {
    metaTitle: "კატალოგი", metaDescription: "იპოვეთ მხოლოდ დამტკიცებული სალონები, ესთეტიკის ცენტრები და კლინიკები კატეგორიის, სახელის ან უბნის მიხედვით და გადადით მათ რეალურ საჯარო პროფილზე.",
    heroTitle: "კატალოგი", heroLede: "მხოლოდ დამტკიცებული ადგილები მთელი საქართველოდან. მოძებნე სახელით, სერვისით ან უბნით და გახსენი მათი რეალური პროფილი.", viewMap: "რუკაზე ნახვა",
    verified: "გადამოწმებული ადგილები", verifiedIn: (label: string) => `${label} — გადამოწმებული ადგილები`,
    resultsLede: "კატალოგში ჩანს მხოლოდ დამტკიცებული პროფილი. „VIP“ და „რეკომენდებული“ ფასიანი განთავსებაა და არა მომხმარებლის შეფასება; თავისუფალი დრო საბოლოოდ ჩაწერისას მოწმდება.",
    countBefore: "", countAfter: " ადგილი", loading: "იტვირთება", loadFailedBefore: "კატალოგის ჩატვირთვა ვერ მოხერხდა. სცადეთ რამდენიმე წუთში ან ", refresh: "განაახლეთ",
    vip: "VIP", recommended: "რეკომენდებული", paidNote: "ფასიანი განთავსება", fresh: `სიახლე ${BRAND.nameKa}-ზე`, freshNote: (days: number) => `ბოლო ${days} დღეში დამატებული`, allPlaces: "ყველა ადგილი", nowInCatalog: "ახლა კატალოგში",
    noMatchTitle: "ამ ფილტრში ადგილი ვერ მოიძებნა.", noMatchText: "სცადეთ სხვა კატეგორია, უბანი ან ძიების სიტყვა. გამოგონილ ან დაუმტკიცებელ ადგილებს არ ვაჩვენებთ.", clear: "ფილტრის გასუფთავება",
    emptyDental: "სტომატოლოგიური კლინიკები მალე დაემატება.", emptyVertical: (label: string) => `${label} — პირველი ადგილები მალე გამოჩნდება.`, emptyDefault: "პირველი გადამოწმებული ადგილები მალე გამოჩნდება.",
  },
  en: {
    metaTitle: "Catalog", metaDescription: "Find only approved salons, aesthetics centres and clinics by category, name or area, and open their real public profile.",
    heroTitle: "Catalog", heroLede: "Only approved places from across Georgia. Search by name, service or area and open their real profile.", viewMap: "View on map",
    verified: "Verified places", verifiedIn: (label: string) => `${label} — verified places`,
    resultsLede: "Only approved profiles appear in the catalog. “VIP” and “Recommended” are paid placements, not customer ratings; free times are checked again at booking.",
    countBefore: "Places: ", countAfter: "", loading: "Loading", loadFailedBefore: "The catalog could not be loaded. Try again in a few minutes or ", refresh: "refresh",
    vip: "VIP", recommended: "Recommended", paidNote: "Paid placement", fresh: `New on ${BRAND.name}`, freshNote: (days: number) => `Added in the last ${days} days`, allPlaces: "All places", nowInCatalog: "Now in the catalog",
    noMatchTitle: "No places found for this filter.", noMatchText: "Try another category, area or search term. We do not show invented or unapproved places.", clear: "Clear filters",
    emptyDental: "Dental clinics will be added soon.", emptyVertical: (label: string) => `${label} — the first places will appear soon.`, emptyDefault: "The first verified places will appear soon.",
  },
  ru: {
    metaTitle: "Каталог", metaDescription: "Находите только одобренные салоны, центры эстетики и клиники по категории, названию или району и открывайте их настоящий публичный профиль.",
    heroTitle: "Каталог", heroLede: "Только одобренные места по всей Грузии. Ищите по названию, услуге или району и открывайте их настоящий профиль.", viewMap: "Показать на карте",
    verified: "Проверенные места", verifiedIn: (label: string) => `${label} — проверенные места`,
    resultsLede: "В каталоге показаны только одобренные профили. «VIP» и «Рекомендуем» — платное размещение, а не оценка клиентов; свободное время окончательно проверяется при записи.",
    countBefore: "Мест: ", countAfter: "", loading: "Загрузка", loadFailedBefore: "Не удалось загрузить каталог. Повторите через несколько минут или ", refresh: "обновите",
    vip: "VIP", recommended: "Рекомендуем", paidNote: "Платное размещение", fresh: `Новое на ${BRAND.name}`, freshNote: (days: number) => `Добавлено за последние ${days} дней`, allPlaces: "Все места", nowInCatalog: "Сейчас в каталоге",
    noMatchTitle: "По этому фильтру места не найдены.", noMatchText: "Попробуйте другую категорию, район или слово для поиска. Выдуманные и неодобренные места мы не показываем.", clear: "Сбросить фильтры",
    emptyDental: "Стоматологические клиники скоро появятся.", emptyVertical: (label: string) => `${label} — первые места скоро появятся.`, emptyDefault: "Первые проверенные места скоро появятся.",
  },
} as const;

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

  const input = useMemo(() => ({ limit: 48, offset: 0, categorySlug, search: search.trim() || undefined, area: area.trim() || undefined }), [categorySlug, search, area]);
  const directory = trpc.marketplace.directory.useQuery(input);
  const submitNow = () => {
    const nextSearch = searchDraft.trim();
    const nextArea = areaDraft.trim();
    setSearch(nextSearch);
    setArea(nextArea);
    setLocation(marketplaceDiscoveryHref("/salons", categorySlug, nextSearch, nextArea));
  };
  const chooseCategory = (nextCategory?: string) => {
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
  const vipItems = items.filter(item => item.promotion?.tier === "VIP");
  const recommendedItems = items.filter(item => item.promotion?.tier === "RECOMMENDED");
  const freshItems = newestListings(items.filter(item => !item.promotion));
  const restItems = items.filter(item => !item.promotion && !freshItems.includes(item));
  const queryFilters = Boolean(categorySlug || search.trim() || area.trim());
  const hasFilters = queryFilters || vertical !== null;
  const mapHref = marketplaceDiscoveryHref("/salons/map", categorySlug, search, area);
  const verticalName = vertical ? verticalLabel(vertical, locale) : null;
  const featured = vipItems.length || recommendedItems.length || freshItems.length;

  return <div className="cw min-h-screen">
    <CatalogHeader />
    <main id="main-content">
      <DiscoveryHero
        title={text.heroTitle}
        lede={text.heroLede}
        action={<Link href={mapHref} data-conversion-event="DIRECTORY_MAP_OPENED" className="cw-btn cw-btn-line min-h-11 text-white"><Map className="size-5" aria-hidden="true" />{text.viewMap}</Link>}
      >
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
      </DiscoveryHero>

      <section className="cw-section" aria-labelledby="dir-results-title">
        <div className="cw-container">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 id="dir-results-title" className="cw-h2">{verticalName ? text.verifiedIn(verticalName) : text.verified}</h2>
              <p className="cw-lede mt-2">{text.resultsLede}</p>
            </div>
            {!directory.isLoading && !directory.isError ? <p role="status" aria-live="polite" className="text-sm text-[var(--cw-ink-soft)]">{text.countBefore}<span className="cw-num font-semibold text-[var(--cw-ink)]">{items.length}</span>{text.countAfter}</p> : null}
          </div>

          <div className="mt-10">
            {directory.isLoading ? <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3" aria-busy="true" aria-label={text.loading}>{[0, 1, 2].map(key => <div key={key} className="h-[8.5rem] animate-pulse rounded-[4px] border-[1.5px] border-[var(--cw-rule)] bg-white" />)}</div>
              : directory.isError ? <p role="alert" className="cw-notice cw-notice-error">{text.loadFailedBefore}<button type="button" className="cw-linkbtn" onClick={() => directory.refetch()}>{text.refresh}</button>.</p>
              : items.length ? <>
                <TicketShelf title={text.vip} note={text.paidNote} items={vipItems} startAt={1} />
                <TicketShelf title={text.recommended} note={text.paidNote} items={recommendedItems} startAt={vipItems.length + 1} />
                <TicketShelf title={text.fresh} note={text.freshNote(NEW_LISTING_DAYS)} items={freshItems} startAt={vipItems.length + recommendedItems.length + 1} />
                <TicketShelf title={featured ? text.allPlaces : text.nowInCatalog} items={restItems} startAt={vipItems.length + recommendedItems.length + freshItems.length + 1} />
              </>
              : queryFilters ? <div className="cw-notice" role="status">
                <h3 className="text-xl font-extrabold [font-stretch:85%]">{text.noMatchTitle}</h3>
                <p className="mt-2 max-w-xl text-[var(--cw-ink-soft)]">{text.noMatchText}</p>
                <button type="button" className="cw-btn cw-btn-line mt-4 min-h-11" onClick={clearFilters}>{text.clear}</button>
              </div>
              : <EmptyTickets message={vertical === "dental" ? text.emptyDental : verticalName ? text.emptyVertical(verticalName) : text.emptyDefault} vertical={vertical} />}
          </div>
        </div>
      </section>
    </main>
    <CatalogFooter />
  </div>;
}
