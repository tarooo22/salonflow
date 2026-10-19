import { CatalogFooter, CatalogHeader } from "@/components/catalog/CatalogChrome";
import { COMMERCE_PAGE_SIZE, CommerceEmpty, CommerceFilters, LoadingGrid, LoadMoreButton, ProductGrid, type ProductItem, useLoadMore } from "@/components/catalog/Commerce";
import { DiscoveryHero } from "@/components/public/MarketplaceDiscovery";
import { usePublicMeta } from "@/components/public/PublicMeta";
import { trpc } from "@/lib/trpc";
import type { Vertical } from "@/lib/verticals";
import { BRAND } from "@shared/brand";
import { useState } from "react";
import { Link } from "wouter";

type Filters = { vertical?: Vertical; area?: string };

function ProductResults({ filters, onClear }: { filters: Filters; onClear: () => void }) {
  const list = useLoadMore<ProductItem>(offset => trpc.products.publicList.useQuery({ ...filters, limit: COMMERCE_PAGE_SIZE, offset }));
  const filtered = Boolean(filters.vertical || filters.area);

  if (list.isLoading) return <LoadingGrid ticket={false} />;
  if (list.isError && !list.items.length) return <p role="alert" className="cw-notice cw-notice-error">პროდუქტების ჩატვირთვა ვერ მოხერხდა. სცადეთ რამდენიმე წუთში ან <button type="button" className="cw-linkbtn" onClick={() => list.refetch()}>განაახლეთ</button>.</p>;
  if (!list.items.length) {
    return filtered
      ? <CommerceEmpty title="ამ ფილტრში პროდუქტი ვერ მოიძებნა." text="სცადეთ სხვა სფერო ან უბანი.">
        <button type="button" className="cw-btn cw-btn-line min-h-11" onClick={onClear}>ფილტრის გასუფთავება</button>
      </CommerceEmpty>
      : <CommerceEmpty title="ამჟამად პროდუქტები არ არის დამატებული." text="როცა დამტკიცებული ბიზნესი თავის პროდუქტებს დაამატებს, აქ გამოჩნდება.">
        <Link href="/partner" className="cw-btn cw-btn-stamp">ბიზნესისთვის</Link>
      </CommerceEmpty>;
  }
  return <>
    <ProductGrid items={list.items} />
    {list.isError ? <p role="alert" className="cw-notice cw-notice-error mt-6">მეტის ჩატვირთვა ვერ მოხერხდა. სცადეთ ხელახლა.</p> : null}
    <LoadMoreButton hasMore={list.hasMore || list.isError} loading={list.loadingMore} onClick={list.loadMore} />
  </>;
}

export default function Products() {
  usePublicMeta({ title: `პროდუქტები | ${BRAND.name}`, description: "სალონების, ესთეტიკის ცენტრებისა და კლინიკების პროდუქტები ერთ ვიტრინაში. შეძენა ხდება უშუალოდ ბიზნესში.", canonicalPath: "/products" });
  const [vertical, setVertical] = useState<Vertical | null>(null);
  const [area, setArea] = useState("");
  const filters: Filters = { vertical: vertical ?? undefined, area: area || undefined };
  const clear = () => { setVertical(null); setArea(""); };

  return <div className="cw min-h-screen">
    <CatalogHeader />
    <main id="main-content">
      <DiscoveryHero title="პროდუქტები" lede="სალონების, ესთეტიკის ცენტრებისა და კლინიკების პროდუქტები ერთ ვიტრინაში.">
        <CommerceFilters idPrefix="prod" vertical={vertical} onVertical={setVertical} area={area} onArea={setArea} captionWhere="პროდუქტების ძებნა" />
      </DiscoveryHero>
      <section className="cw-section" aria-labelledby="prod-results-title">
        <div className="cw-container">
          <h2 id="prod-results-title" className="cw-h2">ვიტრინა</h2>
          <p className="cw-lede mt-2">ონლაინ შეძენა და კალათა არ არის: პროდუქტს იღებ და იხდი უშუალოდ ბიზნესში. ფასი და მარაგი შეიძლება შეიცვალოს, ამიტომ ვიზიტამდე გადაამოწმე.</p>
          <div className="mt-10"><ProductResults key={JSON.stringify(filters)} filters={filters} onClear={clear} /></div>
        </div>
      </section>
    </main>
    <CatalogFooter />
  </div>;
}
