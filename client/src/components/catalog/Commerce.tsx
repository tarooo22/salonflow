import "@/components/catalog/commerce.css";
import "@/components/catalog/discovery.css";
import "@/components/catalog/marketing.css";
import { type PublicLocale, usePublicLocale } from "@/contexts/PublicLocaleContext";
import { formatGelTetri } from "@/lib/presentation";
import { trpc } from "@/lib/trpc";
import { VERTICALS, verticalForCategory, verticalLabel, type Vertical } from "@/lib/verticals";
import { BRAND } from "@shared/brand";
import type { inferRouterOutputs } from "@trpc/server";
import { ArrowRight, MapPin, Package, Search, X } from "lucide-react";
import { type FormEvent, useState } from "react";
import { Link } from "wouter";
import type { AppRouter } from "../../../../server/routers";

type RouterOutputs = inferRouterOutputs<AppRouter>;
export type VacancyItem = RouterOutputs["vacancies"]["publicList"]["items"][number];
export type ProductItem = RouterOutputs["products"]["publicList"]["items"][number];

export const COMMERCE_PAGE_SIZE = 24;

export const EMPLOYMENT_LABELS: Record<string, string> = {
  FULL_TIME: "სრული განაკვეთი",
  PART_TIME: "ნახევარი განაკვეთი",
  CHAIR_RENTAL: "სავარძლის ქირა",
  FREELANCE: "ფრილანსი",
};

const EMPLOYMENT_BY_LOCALE: Record<PublicLocale, Record<string, string>> = {
  ka: EMPLOYMENT_LABELS,
  en: { FULL_TIME: "Full-time", PART_TIME: "Part-time", CHAIR_RENTAL: "Chair rental", FREELANCE: "Freelance" },
  ru: { FULL_TIME: "Полная занятость", PART_TIME: "Частичная занятость", CHAIR_RENTAL: "Аренда кресла", FREELANCE: "Фриланс" },
};

export function employmentLabel(type: string, locale: PublicLocale = "ka") {
  return EMPLOYMENT_BY_LOCALE[locale][type] ?? type;
}

const SALARY_COPY = {
  ka: { from: "-დან", to: "-მდე", agreed: "ანაზღაურება შეთანხმებით" },
  en: { from: "from ", to: "up to ", agreed: "Salary by agreement" },
  ru: { from: "от ", to: "до ", agreed: "Оплата по договорённости" },
} as const;

export function salaryLabel(from: number | null, to: number | null, locale: PublicLocale = "ka") {
  if (from != null && to != null) return from === to ? formatGelTetri(from) : `${formatGelTetri(from)} – ${formatGelTetri(to)}`;
  const copy = SALARY_COPY[locale];
  if (from != null) return locale === "ka" ? `${formatGelTetri(from)}${copy.from}` : `${copy.from}${formatGelTetri(from)}`;
  if (to != null) return locale === "ka" ? `${formatGelTetri(to)}${copy.to}` : `${copy.to}${formatGelTetri(to)}`;
  return copy.agreed;
}

export const ui = {
  ka: { chooseField: "სფეროს არჩევა", all: "ყველა", soon: "მალე", date: "თარიღი", where: "სად?", whereSr: " — ქალაქი ან უბანი", areaPlaceholder: "ქალაქი ან უბანი", search: "მოძებნე", category: "კატეგორია", allCategories: "ყველა კატეგორია", areaTag: "ადგილი: ", removeFilter: "ფილტრის მოხსნა", clearFilters: "ფილტრის გასუფთავება", paid: "ფასიანი განთავსება", adSr: " — რეკლამა", details: "დეტალები", until: "ვადა ", inStock: "მარაგშია", outOfStock: "ამოიწურა", loading: "იტვირთება", loadingMore: "იტვირთება…", loadMore: "მეტის ჩატვირთვა" },
  en: { chooseField: "Choose a field", all: "All", soon: "soon", date: "Date", where: "Where?", whereSr: " — city or area", areaPlaceholder: "City or area", search: "Search", category: "Category", allCategories: "All categories", areaTag: "Area: ", removeFilter: "Remove filter", clearFilters: "Clear filters", paid: "Paid placement", adSr: " — advertisement", details: "Details", until: "Until ", inStock: "In stock", outOfStock: "Out of stock", loading: "Loading", loadingMore: "Loading…", loadMore: "Load more" },
  ru: { chooseField: "Выбор сферы", all: "Все", soon: "скоро", date: "Дата", where: "Где?", whereSr: " — город или район", areaPlaceholder: "Город или район", search: "Найти", category: "Категория", allCategories: "Все категории", areaTag: "Место: ", removeFilter: "Убрать фильтр", clearFilters: "Сбросить фильтры", paid: "Платное размещение", adSr: " — реклама", details: "Подробнее", until: "До ", inStock: "В наличии", outOfStock: "Нет в наличии", loading: "Загрузка", loadingMore: "Загрузка…", loadMore: "Показать ещё" },
} as const;

/** DD.MM.YYYY from the UTC date; a posting's deadline is a calendar day, not a clock time. */
export function formatUtcDate(value: Date | string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return `${String(date.getUTCDate()).padStart(2, "0")}.${String(date.getUTCMonth() + 1).padStart(2, "0")}.${date.getUTCFullYear()}`;
}

/** Offset pagination that keeps earlier pages on screen while the next one loads. Remount (key) to reset. */
export function useLoadMore<T>(useQ: (offset: number) => { data?: { items: T[]; hasMore: boolean }; isLoading: boolean; isError: boolean; refetch: () => unknown }) {
  const [offset, setOffset] = useState(0);
  const [earlier, setEarlier] = useState<T[]>([]);
  const query = useQ(offset);
  const items = [...earlier, ...(query.data?.items ?? [])];
  const loadingMore = offset > 0 && !query.data && !query.isError;
  return {
    items,
    hasMore: Boolean(query.data?.hasMore),
    isLoading: query.isLoading && offset === 0,
    isError: query.isError,
    loadingMore,
    refetch: query.refetch,
    loadMore: () => { setEarlier(items); setOffset(items.length); },
  };
}

type CommerceFiltersProps = {
  idPrefix: string;
  vertical: Vertical | null;
  onVertical: (next: Vertical | null) => void;
  area: string;
  onArea: (value: string) => void;
  /** Vacancies only: role categories as chips. */
  category?: string;
  onCategory?: (slug?: string) => void;
  captionWhere: string;
};


/** Filter card under the vertical tabs, same form as the catalog filters. */
export function CommerceFilters({ idPrefix, vertical, onVertical, area, onArea, category, onCategory, captionWhere }: CommerceFiltersProps) {
  const { locale } = usePublicLocale();
  const text = ui[locale];
  const [draft, setDraft] = useState(area);
  const categories = trpc.marketplace.categories.useQuery(undefined, { enabled: Boolean(onCategory) });
  const shownCategories = (categories.data ?? []).filter(item => !vertical || verticalForCategory(item.slug) === vertical);
  const now = new Date();
  const today = `${String(now.getDate()).padStart(2, "0")}.${String(now.getMonth() + 1).padStart(2, "0")}.${now.getFullYear()}`;
  const submit = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); onArea(draft.trim()); };
  const clear = () => { setDraft(""); onArea(""); onCategory?.(undefined); onVertical(null); };
  const hasFilters = Boolean(vertical || area || category);

  return <div>
    <div className="cwx-vtabs" role="group" aria-label={text.chooseField}>
      <button type="button" className="cwx-vtab" aria-pressed={vertical === null} onClick={() => onVertical(null)}>{text.all}</button>
      {VERTICALS.map(item => <button key={item.id} type="button" className="cwx-vtab" data-vertical={item.id} aria-pressed={vertical === item.id} onClick={() => onVertical(vertical === item.id ? null : item.id)}>
        {verticalLabel(item.id, locale)}{item.id === "dental" ? <span className="cwx-soon">{text.soon}</span> : null}
      </button>)}
    </div>
    <div className="cwx-filters">
      <div className="cwx-filter-meta">
        <span>{text.date} <span>{today}</span></span>
        <span>{BRAND.domain}</span>
      </div>
      <form onSubmit={submit} role="search" aria-label={captionWhere} className="cwx-filter-form">
        <div className="cwx-filter-row">
          <label className="cwx-field">
            <span>{text.where}<span className="sr-only">{text.whereSr}</span></span>
            <input id={`${idPrefix}-area`} value={draft} onChange={event => setDraft(event.target.value)} maxLength={120} placeholder={text.areaPlaceholder} autoComplete="off" enterKeyHint="search" />
          </label>
          <button type="submit" className="mkt-btn mkt-btn-primary"><Search className="size-5" aria-hidden="true" />{text.search}</button>
        </div>
        {onCategory ? <div role="group" aria-label={text.category} className="cwx-chips">
          <button type="button" className="cwx-chip" aria-pressed={!category} onClick={() => onCategory(undefined)}>{text.allCategories}</button>
          {shownCategories.map(item => <button key={item.id} type="button" className="cwx-chip" aria-pressed={category === item.slug} onClick={() => onCategory(category === item.slug ? undefined : item.slug)}>{item.nameKa}</button>)}
        </div> : null}
        {hasFilters ? <div className="cwx-active" aria-live="polite">
          {area ? <span className="cwx-tag">{text.areaTag}{area}<button type="button" onClick={() => { setDraft(""); onArea(""); }} aria-label={text.removeFilter}><X className="size-4" aria-hidden="true" /></button></span> : null}
          <button type="button" className="mkt-linkbtn" onClick={clear}>{text.clearFilters}</button>
        </div> : null}
      </form>
    </div>
  </div>;
}

export function VacancyTicket({ item }: { item: VacancyItem; number: number }) {
  const { locale } = usePublicLocale();
  const text = ui[locale];
  const leadVertical = verticalForCategory(item.roleCategory ?? "");
  const expires = formatUtcDate(item.expiresAt);
  return <Link href={`/vacancies/${item.id}`} className="cwx-vacancy group" data-vertical={leadVertical}>
    <span className="cwx-avatar" aria-hidden="true">{item.businessName.charAt(0)}</span>
    <div className="cwx-vacancy-body">
      <div className="cwx-vacancy-head">
        <h3 className="mkt-h3 cwx-clamp-2">{item.title}</h3>
        {item.isVip ? <span className="cwx-vip" title={text.paid}>VIP<span className="sr-only">{text.adSr}</span></span> : null}
      </div>
      <p className="cwx-muted-line cwx-truncate">{item.businessName}{item.areaLabelKa ? <> · <MapPin className="inline size-3.5 align-[-2px]" aria-hidden="true" /> {item.areaLabelKa}</> : null}</p>
      <p className="cwx-meta-row">
        <span className="cwx-meta-tag">{employmentLabel(item.employmentType, locale)}</span>
        <span className="cwx-salary">{salaryLabel(item.salaryFromTetri, item.salaryToTetri, locale)}</span>
      </p>
      <p className="cwx-foot">
        <span className="inline-flex items-center gap-1">{text.details} <ArrowRight className="size-4 cwx-arrow" aria-hidden="true" /></span>
        {expires ? <span className="cwx-until">{text.until}{expires}</span> : null}
      </p>
    </div>
  </Link>;
}

export function ProductCard({ item }: { item: ProductItem }) {
  const text = ui[usePublicLocale().locale];
  return <article className="cwx-product">
    {item.imageUrl
      ? <img src={item.imageUrl} alt={item.imageAltKa ?? item.name} loading="lazy" className="cwx-product-img" />
      : <div className="cwx-product-img cwx-product-blank" aria-hidden="true"><Package className="size-8" /></div>}
    <div className="cwx-product-body">
      {item.brand ? <p className="cwx-brand">{item.brand}</p> : null}
      <h3 className="cwx-product-name cwx-clamp-2">{item.name}</h3>
      {item.description ? <p className="cwx-desc cwx-clamp-2">{item.description}</p> : null}
      <div className="cwx-price-row">
        <p className="cwx-price">{formatGelTetri(item.priceTetri)}</p>
        <span className="cwx-stock" data-in-stock={item.inStock}>{item.inStock ? text.inStock : text.outOfStock}</span>
      </div>
      <Link href={`/salon/${item.locationPublicSlug}`} className="cwx-salon-link">
        <span className="cwx-truncate">{item.businessName}{item.areaLabelKa ? ` · ${item.areaLabelKa}` : ""}</span>
        <ArrowRight className="size-4 cwx-arrow" aria-hidden="true" />
      </Link>
    </div>
  </article>;
}

export function ProductGrid({ items }: { items: ProductItem[] }) {
  return <ul className="cwx-grid">{items.map(item => <li key={item.id}><ProductCard item={item} /></li>)}</ul>;
}

export function LoadingGrid({ ticket = true }: { ticket?: boolean }) {
  const text = ui[usePublicLocale().locale];
  return <div className="cwx-grid" aria-busy="true" aria-label={text.loading}>
    {[0, 1, 2].map(key => <div key={key} className={ticket ? "cwx-skeleton" : "cwx-skeleton cwx-skeleton-tall"} />)}
  </div>;
}

/** Honest empty state: one muted line and one action, no invented rows and no dashed box. */
export function CommerceEmpty({ title, text, children }: { title: string; text: string; children?: React.ReactNode }) {
  return <div className="cwx-empty" role="status">
    <h3 className="cwx-empty-title">{title}</h3>
    <p className="cwx-empty-text">{text}</p>
    {children ? <div className="cwx-empty-actions">{children}</div> : null}
  </div>;
}

export function LoadMoreButton({ hasMore, loading, onClick }: { hasMore: boolean; loading: boolean; onClick: () => void }) {
  const text = ui[usePublicLocale().locale];
  if (!hasMore && !loading) return null;
  return <div className="cwx-more">
    <button type="button" className="mkt-btn mkt-btn-secondary" disabled={loading} onClick={onClick}>{loading ? text.loadingMore : text.loadMore}</button>
  </div>;
}
