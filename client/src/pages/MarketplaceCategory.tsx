import { CatalogFooter, CatalogHeader } from "@/components/catalog/CatalogChrome";
import { HeroIn } from "@/components/catalog/HomeMotion";
import { EmptyCatalog, SalonGrid, SalonLoading, type CatalogCategory as Category, type CatalogListing as Listing } from "@/components/catalog/Tickets";
import { marketplaceCategoryHref } from "@/components/public/MarketplaceDiscovery";
import { usePublicMeta } from "@/components/public/PublicMeta";
import { usePublicLocale } from "@/contexts/PublicLocaleContext";
import { trpc } from "@/lib/trpc";
import { BRAND } from "@shared/brand";
import { categoryLandingHeading, categoryLandingLede, categoryLandingPath } from "@shared/categoryLanding";
import { keepPreviousData } from "@tanstack/react-query";
import { useState } from "react";
import { Link, useParams } from "wouter";
import { HowItWorks } from "./Home";

export const ui = {
  ka: {
    home: "მთავარი", catalog: "კატალოგი", breadcrumb: "გვერდის გზა",
    count: (n: number) => `${n} ადგილი`,
    loading: "იტვირთება", loadFailed: "ადგილების ჩატვირთვა ვერ მოხერხდა.", retry: "სცადე თავიდან", showMore: "მეტის ჩვენება",
    emptyTitle: "ამ კატეგორიაში ადგილები ჯერ არ არის. პირველი ადგილები მალე გამოჩნდება.", allPlaces: "ყველა ადგილის ნახვა",
    notFoundTitle: "ასეთი კატეგორია ვერ მოიძებნა.", notFoundMeta: "კატეგორია ვერ მოიძებნა",
    paidNote: "„VIP“ და „რეკომენდებული“ ფასიანი განთავსებაა და არა მომხმარებლის შეფასება; თავისუფალი დრო საბოლოოდ ჩაწერისას მოწმდება.",
    howTitle: "როგორ ჩავეწერო ონლაინ", others: "სხვა კატეგორიები", listings: "ადგილები",
  },
  en: {
    home: "Home", catalog: "Catalog", breadcrumb: "Breadcrumb",
    count: (n: number) => `Places: ${n}`,
    loading: "Loading", loadFailed: "Places could not be loaded.", retry: "Try again", showMore: "Show more",
    emptyTitle: "There are no places in this category yet. The first ones will appear soon.", allPlaces: "See all places",
    notFoundTitle: "This category was not found.", notFoundMeta: "Category not found",
    paidNote: "“VIP” and “Recommended” are paid placements, not customer ratings; free times are checked again at booking.",
    howTitle: "How to book online", others: "Other categories", listings: "Places",
    heading: (name: string) => `${name} — salons and online booking`,
    lede: (name: string) => `Find verified places in the “${name}” category: see services and prices, choose a specialist and book a free time online.`,
  },
  ru: {
    home: "Главная", catalog: "Каталог", breadcrumb: "Навигация",
    count: (n: number) => `Мест: ${n}`,
    loading: "Загрузка", loadFailed: "Не удалось загрузить места.", retry: "Повторить", showMore: "Показать ещё",
    emptyTitle: "В этой категории пока нет мест. Первые места скоро появятся.", allPlaces: "Смотреть все места",
    notFoundTitle: "Такая категория не найдена.", notFoundMeta: "Категория не найдена",
    paidNote: "«VIP» и «Рекомендуем» — платное размещение, а не оценка клиентов; свободное время окончательно проверяется при записи.",
    howTitle: "Как записаться онлайн", others: "Другие категории", listings: "Места",
    heading: (name: string) => `${name} — салоны и онлайн-запись`,
    lede: (name: string) => `Найдите проверенные места в категории «${name}»: посмотрите услуги и цены, выберите специалиста и запишитесь онлайн на свободное время.`,
  },
} as const;

// shortcut: "show more" grows the page size up to the API cap (100), like /salons.
const PAGE_STEP = 24;
const PAGE_MAX = 100;

export default function MarketplaceCategory() {
  const { locale } = usePublicLocale();
  const text = ui[locale];
  const slug = (useParams<{ slug: string }>().slug ?? "").toLowerCase();
  const [limit, setLimit] = useState(48);
  const categories = trpc.marketplace.categories.useQuery();
  const category = ((categories.data ?? []) as Category[]).find(item => item.slug === slug);
  const missing = categories.isSuccess && !category;
  const directory = trpc.marketplace.directory.useQuery({ limit, offset: 0, categorySlug: slug }, { enabled: Boolean(category), placeholderData: keepPreviousData });

  const heading = category ? (locale === "ka" ? categoryLandingHeading(slug, category.nameKa) : ui[locale].heading(category.nameKa)) : text.catalog;
  const lede = category ? (locale === "ka" ? categoryLandingLede(slug, category.nameKa) : ui[locale].lede(category.nameKa)) : "";
  usePublicMeta({
    title: `${missing ? text.notFoundMeta : heading} | ${BRAND.name}`,
    description: lede || ui.ka.paidNote,
    canonicalPath: categoryLandingPath(slug),
    robots: missing ? "noindex,nofollow" : "index,follow",
  });

  const items = (directory.data?.items ?? []) as Listing[];
  const canShowMore = (directory.data?.total ?? 0) > items.length && limit < PAGE_MAX;
  const others = ((categories.data ?? []) as Category[]).filter(item => item.slug !== slug);

  return <div className="cw">
    <CatalogHeader />
    <main id="main-content">
      <nav className="cw-container cp-crumbs" aria-label={text.breadcrumb}>
        <ol>
          <li><Link href="/">{text.home}</Link></li>
          <li><Link href="/salons">{text.catalog}</Link></li>
          {category ? <li aria-current="page">{category.nameKa}</li> : null}
        </ol>
      </nav>

      {missing ? <section className="cw-container cp-intro cp-empty" aria-label={text.catalog}>
        <h1>{text.notFoundTitle}</h1>
        <Link href="/salons" className="cw-btn cw-btn-line min-h-11">{text.allPlaces}</Link>
      </section> : <>
        <HeroIn>
          <div className="cw-container cp-intro">
            <h1>{category ? heading : <span className="sf-skeleton inline-block h-9 w-2/3 rounded-lg align-middle" aria-hidden="true" />}</h1>
            {category ? <p className="cw-lede">{lede}</p> : null}
            {category && directory.isSuccess && items.length ? <p className="cp-count" role="status">{text.count(directory.data?.total ?? items.length)}</p> : null}
          </div>
        </HeroIn>

        <section className="cw-container pg-results" aria-label={text.listings}>
          {categories.isLoading || directory.isLoading ? <SalonLoading label={text.loading} count={8} />
            : categories.isError || directory.isError ? <div role="alert" className="cw-notice cw-notice-error">
              <p>{text.loadFailed}</p>
              <button type="button" className="cw-btn cw-btn-line mt-3 min-h-11" onClick={() => { void categories.refetch(); void directory.refetch(); }}>{text.retry}</button>
            </div>
            : items.length ? <>
              <SalonGrid items={items} reveal />
              {canShowMore ? <div className="pg-more"><button type="button" className="cw-btn cw-btn-line" onClick={() => setLimit(current => Math.min(PAGE_MAX, current + PAGE_STEP))}>{text.showMore}</button></div> : null}
              <p className="pg-note">{text.paidNote}</p>
            </>
            : <div className="cp-empty">
              <EmptyCatalog message={text.emptyTitle} />
              <Link href="/salons" className="cw-btn cw-btn-line min-h-11">{text.allPlaces}</Link>
            </div>}
        </section>

        <HowItWorks title={text.howTitle} />
      </>}

      {others.length ? <section className="cw-container cp-block" aria-labelledby="cp-others-title">
        <h2 id="cp-others-title" className="cw-h2">{text.others}</h2>
        <ul className="cp-chips">
          {others.map(item => <li key={item.id}><Link href={marketplaceCategoryHref(item.slug)} className="cw-chip">{item.nameKa}</Link></li>)}
        </ul>
      </section> : null}
    </main>
    <CatalogFooter />
  </div>;
}
