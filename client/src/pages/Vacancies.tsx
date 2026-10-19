import { CatalogFooter, CatalogHeader } from "@/components/catalog/CatalogChrome";
import { COMMERCE_PAGE_SIZE, CommerceEmpty, CommerceFilters, LoadingGrid, LoadMoreButton, useLoadMore, type VacancyItem, VacancyTicket } from "@/components/catalog/Commerce";
import { DiscoveryHero } from "@/components/public/MarketplaceDiscovery";
import { usePublicMeta } from "@/components/public/PublicMeta";
import { trpc } from "@/lib/trpc";
import type { Vertical } from "@/lib/verticals";
import { BRAND } from "@shared/brand";
import { useState } from "react";
import { Link } from "wouter";

type Filters = { vertical?: Vertical; category?: string; area?: string };

function VacancyResults({ filters, onClear }: { filters: Filters; onClear: () => void }) {
  const list = useLoadMore<VacancyItem>(offset => trpc.vacancies.publicList.useQuery({ ...filters, limit: COMMERCE_PAGE_SIZE, offset }));
  const filtered = Boolean(filters.vertical || filters.category || filters.area);

  if (list.isLoading) return <LoadingGrid />;
  if (list.isError && !list.items.length) return <p role="alert" className="cw-notice cw-notice-error">ვაკანსიების ჩატვირთვა ვერ მოხერხდა. სცადეთ რამდენიმე წუთში ან <button type="button" className="cw-linkbtn" onClick={() => list.refetch()}>განაახლეთ</button>.</p>;
  if (!list.items.length) {
    return filtered
      ? <CommerceEmpty title="ამ ფილტრში ვაკანსია ვერ მოიძებნა." text="სცადეთ სხვა სფერო, კატეგორია ან უბანი.">
        <button type="button" className="cw-btn cw-btn-line min-h-11" onClick={onClear}>ფილტრის გასუფთავება</button>
      </CommerceEmpty>
      : <CommerceEmpty title="ამჟამად გამოქვეყნებული ვაკანსია არ არის." text="როცა დამტკიცებული ბიზნესი ვაკანსიას გამოაქვეყნებს, აქ გამოჩნდება.">
        <Link href="/partner" className="cw-btn cw-btn-stamp">ბიზნესისთვის</Link>
      </CommerceEmpty>;
  }
  return <>
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{list.items.map((item, index) => <VacancyTicket key={item.id} item={item} number={index + 1} />)}</div>
    {list.isError ? <p role="alert" className="cw-notice cw-notice-error mt-6">მეტის ჩატვირთვა ვერ მოხერხდა. სცადეთ ხელახლა.</p> : null}
    <LoadMoreButton hasMore={list.hasMore || list.isError} loading={list.loadingMore} onClick={list.loadMore} />
  </>;
}

export default function Vacancies() {
  usePublicMeta({ title: `ვაკანსიები | ${BRAND.name}`, description: "სამუშაო ადგილები სილამაზის, ესთეტიკის და სტომატოლოგიის სფეროში — მხოლოდ დამტკიცებული ბიზნესებისგან, პირდაპირი კონტაქტით.", canonicalPath: "/vacancies" });
  const [vertical, setVertical] = useState<Vertical | null>(null);
  const [category, setCategory] = useState<string | undefined>();
  const [area, setArea] = useState("");
  const filters: Filters = { vertical: vertical ?? undefined, category, area: area || undefined };
  const clear = () => { setVertical(null); setCategory(undefined); setArea(""); };

  return <div className="cw min-h-screen">
    <CatalogHeader />
    <main id="main-content">
      <DiscoveryHero title="ვაკანსიები" lede="სამუშაო ადგილები ოსტატებისთვის, კოსმეტოლოგებისთვის და ექიმებისთვის. განცხადებას ბიზნესი თავად აქვეყნებს; დაუკავშირდი მას პირდაპირ.">
        <CommerceFilters idPrefix="vac" vertical={vertical} onVertical={next => { setVertical(next); setCategory(undefined); }} area={area} onArea={setArea} category={category} onCategory={setCategory} captionWhere="ვაკანსიების ძებნა" />
      </DiscoveryHero>
      <section className="cw-section" aria-labelledby="vac-results-title">
        <div className="cw-container">
          <h2 id="vac-results-title" className="cw-h2">ღია ვაკანსიები</h2>
          <p className="cw-lede mt-2">„VIP“ ფასიანი განთავსებაა და არა ბიზნესის შეფასება. ვადაგასული განცხადებები აქ აღარ ჩანს.</p>
          <div className="mt-10"><VacancyResults key={JSON.stringify(filters)} filters={filters} onClear={clear} /></div>
        </div>
      </section>
    </main>
    <CatalogFooter />
  </div>;
}
