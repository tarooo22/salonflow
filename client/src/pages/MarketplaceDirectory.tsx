import { CatalogFooter, CatalogHeader } from "@/components/catalog/CatalogChrome";
import { EmptyTickets, listingMatchesVertical, NEW_LISTING_DAYS, newestListings, TicketShelf, type CatalogListing as Listing } from "@/components/catalog/Tickets";
import { DiscoveryFilters, DiscoveryHero, marketplaceDiscoveryFilters, marketplaceDiscoveryHref } from "@/components/public/MarketplaceDiscovery";
import { usePublicMeta } from "@/components/public/PublicMeta";
import { trpc } from "@/lib/trpc";
import { verticalForCategory, verticalStyle, type Vertical } from "@/lib/verticals";
import { BRAND } from "@shared/brand";
import { Map } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useSearch } from "wouter";

export default function MarketplaceDirectory() {
  usePublicMeta({ title: `კატალოგი | ${BRAND.name}`, description: "იპოვეთ მხოლოდ დამტკიცებული სალონები, ესთეტიკის ცენტრები და კლინიკები კატეგორიის, სახელის ან უბნის მიხედვით და გადადით მათ რეალურ საჯარო პროფილზე.", canonicalPath: "/salons" });
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
  const verticalLabel = vertical ? verticalStyle(vertical).label : null;
  const featured = vipItems.length || recommendedItems.length || freshItems.length;

  return <div className="cw min-h-screen">
    <CatalogHeader />
    <main id="main-content">
      <DiscoveryHero
        title="კატალოგი"
        lede="მხოლოდ დამტკიცებული ადგილები მთელი საქართველოდან. მოძებნე სახელით, სერვისით ან უბნით და გახსენი მათი რეალური პროფილი."
        action={<Link href={mapHref} data-conversion-event="DIRECTORY_MAP_OPENED" className="cw-btn cw-btn-line min-h-11 text-white"><Map className="size-5" aria-hidden="true" />რუკაზე ნახვა</Link>}
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
              <h2 id="dir-results-title" className="cw-h2">{verticalLabel ? `${verticalLabel} — გადამოწმებული ადგილები` : "გადამოწმებული ადგილები"}</h2>
              <p className="cw-lede mt-2">კატალოგში ჩანს მხოლოდ დამტკიცებული პროფილი. „VIP“ და „რეკომენდებული“ ფასიანი განთავსებაა და არა მომხმარებლის შეფასება; თავისუფალი დრო საბოლოოდ ჩაწერისას მოწმდება.</p>
            </div>
            {!directory.isLoading && !directory.isError ? <p role="status" aria-live="polite" className="text-sm text-[var(--cw-ink-soft)]"><span className="cw-num font-semibold text-[var(--cw-ink)]">{items.length}</span> ადგილი</p> : null}
          </div>

          <div className="mt-10">
            {directory.isLoading ? <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3" aria-busy="true" aria-label="იტვირთება">{[0, 1, 2].map(key => <div key={key} className="h-[8.5rem] animate-pulse rounded-[4px] border-[1.5px] border-[var(--cw-rule)] bg-white" />)}</div>
              : directory.isError ? <p role="alert" className="cw-notice cw-notice-error">კატალოგის ჩატვირთვა ვერ მოხერხდა. სცადეთ რამდენიმე წუთში ან <button type="button" className="cw-linkbtn" onClick={() => directory.refetch()}>განაახლეთ</button>.</p>
              : items.length ? <>
                <TicketShelf title="VIP" note="ფასიანი განთავსება" items={vipItems} startAt={1} />
                <TicketShelf title="რეკომენდებული" note="ფასიანი განთავსება" items={recommendedItems} startAt={vipItems.length + 1} />
                <TicketShelf title={`სიახლე ${BRAND.nameKa}-ზე`} note={`ბოლო ${NEW_LISTING_DAYS} დღეში დამატებული`} items={freshItems} startAt={vipItems.length + recommendedItems.length + 1} />
                <TicketShelf title={featured ? "ყველა ადგილი" : "ახლა კატალოგში"} items={restItems} startAt={vipItems.length + recommendedItems.length + freshItems.length + 1} />
              </>
              : queryFilters ? <div className="cw-notice" role="status">
                <h3 className="text-xl font-extrabold [font-stretch:85%]">ამ ფილტრში ადგილი ვერ მოიძებნა.</h3>
                <p className="mt-2 max-w-xl text-[var(--cw-ink-soft)]">სცადეთ სხვა კატეგორია, უბანი ან ძიების სიტყვა. გამოგონილ ან დაუმტკიცებელ ადგილებს არ ვაჩვენებთ.</p>
                <button type="button" className="cw-btn cw-btn-line mt-4 min-h-11" onClick={clearFilters}>ფილტრის გასუფთავება</button>
              </div>
              : <EmptyTickets message={vertical === "dental" ? "სტომატოლოგიური კლინიკები მალე დაემატება." : verticalLabel ? `${verticalLabel} — პირველი ადგილები მალე გამოჩნდება.` : "პირველი გადამოწმებული ადგილები მალე გამოჩნდება."} vertical={vertical} />}
          </div>
        </div>
      </section>
    </main>
    <CatalogFooter />
  </div>;
}
