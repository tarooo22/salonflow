import { CatalogFooter, CatalogHeader } from "@/components/catalog/CatalogChrome";
import { COMMERCE_PAGE_SIZE, CommerceEmpty, CommerceFilters, LoadingGrid, LoadMoreButton, useLoadMore, type VacancyItem, VacancyTicket } from "@/components/catalog/Commerce";
import { HeroIn } from "@/components/catalog/HomeMotion";
import { usePublicMeta } from "@/components/public/PublicMeta";
import { usePublicLocale } from "@/contexts/PublicLocaleContext";
import { trpc } from "@/lib/trpc";
import type { Vertical } from "@/lib/verticals";
import { BRAND } from "@shared/brand";
import { Briefcase, Search } from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";

export const ui = {
  ka: {
    metaTitle: "ვაკანსიები", metaDescription: "სამუშაო ადგილები სილამაზის, ესთეტიკის და სტომატოლოგიის სფეროში — მხოლოდ დამტკიცებული ბიზნესებისგან, პირდაპირი კონტაქტით.",
    heroTitle: "ვაკანსიები", heroLede: "სამუშაო ადგილები ოსტატებისთვის, კოსმეტოლოგებისთვის და ექიმებისთვის. განცხადებას ბიზნესი თავად აქვეყნებს; დაუკავშირდი მას პირდაპირ.",
    searchCaption: "ვაკანსიების ძებნა", openTitle: "ღია ვაკანსიები", openLede: "„VIP“ ფასიანი განთავსებაა და არა ბიზნესის შეფასება. ვადაგასული განცხადებები აქ აღარ ჩანს.",
    loadFailedBefore: "ვაკანსიების ჩატვირთვა ვერ მოხერხდა. სცადე რამდენიმე წუთში ან ", refresh: "განაახლე",
    filteredTitle: "ამ ფილტრში ვაკანსია ვერ მოიძებნა.", filteredText: "სცადე სხვა სფერო, კატეგორია ან უბანი.", clear: "ფილტრის გასუფთავება",
    emptyTitle: "ამჟამად გამოქვეყნებული ვაკანსია არ არის.", emptyText: "როცა დამტკიცებული ბიზნესი ვაკანსიას გამოაქვეყნებს, აქ გამოჩნდება.", forBusiness: "ბიზნესისთვის",
    moreFailed: "მეტის ჩატვირთვა ვერ მოხერხდა. სცადე ხელახლა.",
  },
  en: {
    metaTitle: "Vacancies", metaDescription: "Jobs in beauty, aesthetics and dentistry — only from approved businesses, with direct contact.",
    heroTitle: "Vacancies", heroLede: "Jobs for stylists, cosmetologists and doctors. Each listing is published by the business itself; contact them directly.",
    searchCaption: "Search vacancies", openTitle: "Open vacancies", openLede: "“VIP” is a paid placement, not a rating of the business. Expired listings are no longer shown.",
    loadFailedBefore: "Vacancies could not be loaded. Try again in a few minutes or ", refresh: "refresh",
    filteredTitle: "No vacancies found for this filter.", filteredText: "Try another field, category or area.", clear: "Clear filters",
    emptyTitle: "There are no published vacancies right now.", emptyText: "When an approved business publishes a vacancy, it will appear here.", forBusiness: "For business",
    moreFailed: "Could not load more. Please try again.",
  },
  ru: {
    metaTitle: "Вакансии", metaDescription: "Работа в сфере красоты, эстетики и стоматологии — только от одобренных бизнесов, с прямым контактом.",
    heroTitle: "Вакансии", heroLede: "Работа для мастеров, косметологов и врачей. Объявление публикует сам бизнес; свяжитесь с ним напрямую.",
    searchCaption: "Поиск вакансий", openTitle: "Открытые вакансии", openLede: "«VIP» — платное размещение, а не оценка бизнеса. Просроченные объявления здесь не показываются.",
    loadFailedBefore: "Не удалось загрузить вакансии. Повторите через несколько минут или ", refresh: "обновите",
    filteredTitle: "По этому фильтру вакансий не найдено.", filteredText: "Попробуйте другую сферу, категорию или район.", clear: "Сбросить фильтры",
    emptyTitle: "Сейчас нет опубликованных вакансий.", emptyText: "Когда одобренный бизнес опубликует вакансию, она появится здесь.", forBusiness: "Бизнесу",
    moreFailed: "Не удалось загрузить ещё. Попробуйте снова.",
  },
} as const;

type Filters = { vertical?: Vertical; category?: string; area?: string };

function VacancyResults({ filters, onClear }: { filters: Filters; onClear: () => void }) {
  const text = ui[usePublicLocale().locale];
  const list = useLoadMore<VacancyItem>(offset => trpc.vacancies.publicList.useQuery({ ...filters, limit: COMMERCE_PAGE_SIZE, offset }));
  const filtered = Boolean(filters.vertical || filters.category || filters.area);

  if (list.isLoading) return <LoadingGrid />;
  if (list.isError && !list.items.length) return <p role="alert" className="mkt-alert">{text.loadFailedBefore}<button type="button" className="mkt-linkbtn" onClick={() => list.refetch()}>{text.refresh}</button>.</p>;
  if (!list.items.length) {
    return filtered
      ? <CommerceEmpty icon={Search} title={text.filteredTitle} text={text.filteredText}>
        <button type="button" className="cw-btn cw-btn-line" onClick={onClear}>{text.clear}</button>
      </CommerceEmpty>
      : <CommerceEmpty icon={Briefcase} title={text.emptyTitle} text={text.emptyText}>
        <Link href="/partner" className="cw-btn cw-btn-stamp">{text.forBusiness}</Link>
      </CommerceEmpty>;
  }
  return <>
    <div className="cwx-grid">{list.items.map((item, index) => <VacancyTicket key={item.id} item={item} number={index + 1} />)}</div>
    {list.isError ? <p role="alert" className="mkt-alert cwx-alert-gap">{text.moreFailed}</p> : null}
    <LoadMoreButton hasMore={list.hasMore || list.isError} loading={list.loadingMore} onClick={list.loadMore} />
  </>;
}

export default function Vacancies() {
  const { locale } = usePublicLocale();
  const text = ui[locale];
  usePublicMeta({ title: `${text.metaTitle} | ${BRAND.name}`, description: text.metaDescription, canonicalPath: "/vacancies" });
  const [vertical, setVertical] = useState<Vertical | null>(null);
  const [category, setCategory] = useState<string | undefined>();
  const [area, setArea] = useState("");
  const filters: Filters = { vertical: vertical ?? undefined, category, area: area || undefined };
  const clear = () => { setVertical(null); setCategory(undefined); setArea(""); };

  return <div className="cw min-h-screen">
    <CatalogHeader />
    <main id="main-content">
      <section className="mkt-hero" aria-labelledby="vac-hero-title">
        <div className="mkt-container">
          <HeroIn>
            <h1 id="vac-hero-title" className="mkt-h1">{text.heroTitle}</h1>
            <p className="mkt-lede mt-3">{text.heroLede}</p>
          </HeroIn>
          <div className="mt-8">
            <CommerceFilters idPrefix="vac" vertical={vertical} onVertical={next => { setVertical(next); setCategory(undefined); }} area={area} onArea={setArea} category={category} onCategory={setCategory} captionWhere={text.searchCaption} />
          </div>
        </div>
      </section>
      <section className="mkt-section" aria-labelledby="vac-results-title">
        <div className="mkt-container">
          <h2 id="vac-results-title" className="mkt-h2">{text.openTitle}</h2>
          <p className="mkt-lede cwx-sub">{text.openLede}</p>
          <div className="cwx-results"><VacancyResults key={JSON.stringify(filters)} filters={filters} onClear={clear} /></div>
        </div>
      </section>
    </main>
    <CatalogFooter />
  </div>;
}
