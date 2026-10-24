import { CatalogFooter, CatalogHeader } from "@/components/catalog/CatalogChrome";
import { COMMERCE_PAGE_SIZE, CommerceEmpty, CommerceFilters, LoadingGrid, LoadMoreButton, ProductGrid, type ProductItem, useLoadMore } from "@/components/catalog/Commerce";
import { DiscoveryHero } from "@/components/public/MarketplaceDiscovery";
import { usePublicMeta } from "@/components/public/PublicMeta";
import { usePublicLocale } from "@/contexts/PublicLocaleContext";
import { trpc } from "@/lib/trpc";
import type { Vertical } from "@/lib/verticals";
import { BRAND } from "@shared/brand";
import { useState } from "react";
import { Link } from "wouter";

export const ui = {
  ka: {
    metaTitle: "პროდუქტები", metaDescription: "სალონების, ესთეტიკის ცენტრებისა და კლინიკების პროდუქტები ერთ ვიტრინაში. შეძენა ხდება უშუალოდ ბიზნესში.",
    heroTitle: "პროდუქტები", heroLede: "სალონების, ესთეტიკის ცენტრებისა და კლინიკების პროდუქტები ერთ ვიტრინაში.", searchCaption: "პროდუქტების ძებნა",
    shopTitle: "ვიტრინა", shopLede: "ონლაინ შეძენა და კალათა არ არის: პროდუქტს იღებ და იხდი უშუალოდ ბიზნესში. ფასი და მარაგი შეიძლება შეიცვალოს, ამიტომ ვიზიტამდე გადაამოწმე.",
    loadFailedBefore: "პროდუქტების ჩატვირთვა ვერ მოხერხდა. სცადეთ რამდენიმე წუთში ან ", refresh: "განაახლეთ",
    filteredTitle: "ამ ფილტრში პროდუქტი ვერ მოიძებნა.", filteredText: "სცადეთ სხვა სფერო ან უბანი.", clear: "ფილტრის გასუფთავება",
    emptyTitle: "ამჟამად პროდუქტები არ არის დამატებული.", emptyText: "როცა დამტკიცებული ბიზნესი თავის პროდუქტებს დაამატებს, აქ გამოჩნდება.", forBusiness: "ბიზნესისთვის",
    moreFailed: "მეტის ჩატვირთვა ვერ მოხერხდა. სცადეთ ხელახლა.",
  },
  en: {
    metaTitle: "Products", metaDescription: "Products from salons, aesthetics centres and clinics in one showcase. You buy directly at the business.",
    heroTitle: "Products", heroLede: "Products from salons, aesthetics centres and clinics in one showcase.", searchCaption: "Search products",
    shopTitle: "Showcase", shopLede: "There is no online checkout or cart: you pick up and pay for the product directly at the business. Price and stock can change, so check before your visit.",
    loadFailedBefore: "Products could not be loaded. Try again in a few minutes or ", refresh: "refresh",
    filteredTitle: "No products found for this filter.", filteredText: "Try another field or area.", clear: "Clear filters",
    emptyTitle: "No products have been added yet.", emptyText: "When an approved business adds its products, they will appear here.", forBusiness: "For business",
    moreFailed: "Could not load more. Please try again.",
  },
  ru: {
    metaTitle: "Товары", metaDescription: "Товары салонов, центров эстетики и клиник на одной витрине. Покупка происходит прямо в бизнесе.",
    heroTitle: "Товары", heroLede: "Товары салонов, центров эстетики и клиник на одной витрине.", searchCaption: "Поиск товаров",
    shopTitle: "Витрина", shopLede: "Онлайн-покупки и корзины нет: товар вы получаете и оплачиваете прямо в бизнесе. Цена и наличие могут измениться, поэтому проверьте перед визитом.",
    loadFailedBefore: "Не удалось загрузить товары. Повторите через несколько минут или ", refresh: "обновите",
    filteredTitle: "По этому фильтру товаров не найдено.", filteredText: "Попробуйте другую сферу или район.", clear: "Сбросить фильтры",
    emptyTitle: "Товары пока не добавлены.", emptyText: "Когда одобренный бизнес добавит свои товары, они появятся здесь.", forBusiness: "Бизнесу",
    moreFailed: "Не удалось загрузить ещё. Попробуйте снова.",
  },
} as const;

type Filters = { vertical?: Vertical; area?: string };

function ProductResults({ filters, onClear }: { filters: Filters; onClear: () => void }) {
  const text = ui[usePublicLocale().locale];
  const list = useLoadMore<ProductItem>(offset => trpc.products.publicList.useQuery({ ...filters, limit: COMMERCE_PAGE_SIZE, offset }));
  const filtered = Boolean(filters.vertical || filters.area);

  if (list.isLoading) return <LoadingGrid ticket={false} />;
  if (list.isError && !list.items.length) return <p role="alert" className="mkt-alert">{text.loadFailedBefore}<button type="button" className="mkt-linkbtn" onClick={() => list.refetch()}>{text.refresh}</button>.</p>;
  if (!list.items.length) {
    return filtered
      ? <CommerceEmpty title={text.filteredTitle} text={text.filteredText}>
        <button type="button" className="mkt-btn mkt-btn-secondary" onClick={onClear}>{text.clear}</button>
      </CommerceEmpty>
      : <CommerceEmpty title={text.emptyTitle} text={text.emptyText}>
        <Link href="/partner" className="mkt-btn mkt-btn-primary">{text.forBusiness}</Link>
      </CommerceEmpty>;
  }
  return <>
    <ProductGrid items={list.items} />
    {list.isError ? <p role="alert" className="mkt-alert cwx-alert-gap">{text.moreFailed}</p> : null}
    <LoadMoreButton hasMore={list.hasMore || list.isError} loading={list.loadingMore} onClick={list.loadMore} />
  </>;
}

export default function Products() {
  const { locale } = usePublicLocale();
  const text = ui[locale];
  usePublicMeta({ title: `${text.metaTitle} | ${BRAND.name}`, description: text.metaDescription, canonicalPath: "/products" });
  const [vertical, setVertical] = useState<Vertical | null>(null);
  const [area, setArea] = useState("");
  const filters: Filters = { vertical: vertical ?? undefined, area: area || undefined };
  const clear = () => { setVertical(null); setArea(""); };

  return <div className="cw min-h-screen">
    <CatalogHeader />
    <main id="main-content">
      <DiscoveryHero title={text.heroTitle} lede={text.heroLede}>
        <CommerceFilters idPrefix="prod" vertical={vertical} onVertical={setVertical} area={area} onArea={setArea} captionWhere={text.searchCaption} />
      </DiscoveryHero>
      <section className="mkt-section" aria-labelledby="prod-results-title">
        <div className="mkt-container">
          <h2 id="prod-results-title" className="mkt-h2">{text.shopTitle}</h2>
          <p className="mkt-lede cwx-sub">{text.shopLede}</p>
          <div className="cwx-results"><ProductResults key={JSON.stringify(filters)} filters={filters} onClear={clear} /></div>
        </div>
      </section>
    </main>
    <CatalogFooter />
  </div>;
}
