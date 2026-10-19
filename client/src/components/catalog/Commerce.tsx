import "@/components/catalog/commerce.css";
import "@/components/catalog/discovery.css";
import { cssVars } from "@/components/catalog/Tickets";
import { formatGelTetri } from "@/lib/presentation";
import { trpc } from "@/lib/trpc";
import { VERTICALS, verticalForCategory, verticalStyle, type Vertical } from "@/lib/verticals";
import { BRAND } from "@shared/brand";
import type { inferRouterOutputs } from "@trpc/server";
import { ArrowRight, MapPin, Search, ShoppingBag, X } from "lucide-react";
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

export function salaryLabel(from: number | null, to: number | null) {
  if (from != null && to != null) return from === to ? formatGelTetri(from) : `${formatGelTetri(from)} – ${formatGelTetri(to)}`;
  if (from != null) return `${formatGelTetri(from)}-დან`;
  if (to != null) return `${formatGelTetri(to)}-მდე`;
  return "ანაზღაურება შეთანხმებით";
}

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

/** Filter card hung under the vertical tabs, same form as the catalog filters. */
export function CommerceFilters({ idPrefix, vertical, onVertical, area, onArea, category, onCategory, captionWhere }: CommerceFiltersProps) {
  const [draft, setDraft] = useState(area);
  const categories = trpc.marketplace.categories.useQuery(undefined, { enabled: Boolean(onCategory) });
  const shownCategories = (categories.data ?? []).filter(item => !vertical || verticalForCategory(item.slug) === vertical);
  const band = vertical ? verticalStyle(vertical).bg : "var(--cw-ink)";
  const now = new Date();
  const today = `${String(now.getDate()).padStart(2, "0")}.${String(now.getMonth() + 1).padStart(2, "0")}.${now.getFullYear()}`;
  const submit = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); onArea(draft.trim()); };
  const clear = () => { setDraft(""); onArea(""); onCategory?.(undefined); onVertical(null); };
  const hasFilters = Boolean(vertical || area || category);

  return <div>
    <div className="cw-vtabs" role="group" aria-label="სფეროს არჩევა">
      <button type="button" className="cw-tab cw-tab-all" aria-pressed={vertical === null} onClick={() => onVertical(null)}>ყველა</button>
      {VERTICALS.map(item => <button key={item.id} type="button" className="cw-tab" style={cssVars({ "--tab-bg": item.bg, "--tab-ink": item.ink })} aria-pressed={vertical === item.id} onClick={() => onVertical(vertical === item.id ? null : item.id)}>
        {item.label}{item.id === "dental" ? <span className="cw-tab-soon">მალე</span> : null}
      </button>)}
    </div>
    <div className="cw-card cw-disc-card">
      <div className="cw-card-band" style={cssVars({ "--band": band })} />
      <div className="cw-card-inner" style={cssVars(vertical ? { "--tint": verticalStyle(vertical).bg, "--tint-amount": "16%" } : {})}>
        <div className="cw-card-head">
          <span>თარიღი <span className="cw-num ml-1 text-[var(--cw-ink)]">{today}</span></span>
          <span className="cw-num text-xs">{BRAND.domain}</span>
        </div>
        <form onSubmit={submit} role="search" aria-label={captionWhere} className="mt-5 grid gap-4">
          <div className="cwx-filter-row">
            <label className="cw-field">
              <span className="cw-caption">სად?<span className="sr-only"> — ქალაქი ან უბანი</span></span>
              <input id={`${idPrefix}-area`} value={draft} onChange={event => setDraft(event.target.value)} maxLength={120} placeholder="ქალაქი ან უბანი" autoComplete="off" enterKeyHint="search" />
            </label>
            <button type="submit" className="cw-btn cw-btn-stamp"><Search className="size-5" aria-hidden="true" />მოძებნე</button>
          </div>
          {onCategory ? <div role="group" aria-label="კატეგორია" className="cwx-chips flex flex-wrap gap-2">
            <button type="button" className="cw-chip" aria-pressed={!category} onClick={() => onCategory(undefined)}>ყველა კატეგორია</button>
            {shownCategories.map(item => {
              const tone = verticalStyle(verticalForCategory(item.slug));
              return <button key={item.id} type="button" className="cw-chip" style={cssVars({ "--g-bg": tone.bg, "--g-ink": tone.ink })} aria-pressed={category === item.slug} onClick={() => onCategory(category === item.slug ? undefined : item.slug)}>{item.nameKa}</button>;
            })}
          </div> : null}
          {hasFilters ? <div className="cw-active" aria-live="polite">
            {area ? <span className="cw-tag">ადგილი: {area}<button type="button" onClick={() => { setDraft(""); onArea(""); }} aria-label="ფილტრის მოხსნა"><X className="size-4" aria-hidden="true" /></button></span> : null}
            <button type="button" className="cw-linkbtn" onClick={clear}><X className="size-4" aria-hidden="true" />ფილტრის გასუფთავება</button>
          </div> : null}
        </form>
      </div>
    </div>
  </div>;
}

export function VacancyTicket({ item, number }: { item: VacancyItem; number: number }) {
  const lead = verticalStyle(verticalForCategory(item.roleCategory ?? ""));
  const expires = formatUtcDate(item.expiresAt);
  return <Link href={`/vacancies/${item.id}`} className="cw-ticket group" style={cssVars({ "--stub-bg": lead.bg, "--stub-ink": lead.ink })}>
    <div className="cw-ticket-stub" aria-hidden="true">
      <span className="cw-num">№ {String(number).padStart(3, "0")}</span>
      <span className="text-[0.72rem] font-extrabold [writing-mode:vertical-rl] rotate-180">{lead.label}</span>
    </div>
    <div className="min-w-0 p-4">
      <div className="flex items-start justify-between gap-2">
        <h3 className="line-clamp-2 text-lg font-extrabold [font-stretch:85%]">{item.title}</h3>
        {item.isVip ? <span className="cw-stamp-mark shrink-0" title="ფასიანი განთავსება">VIP<span className="sr-only"> — რეკლამა</span></span> : null}
      </div>
      <p className="mt-1 truncate text-sm text-[var(--cw-ink-soft)]">{item.businessName}{item.areaLabelKa ? <> · <MapPin className="inline size-3.5 align-[-2px]" aria-hidden="true" /> {item.areaLabelKa}</> : null}</p>
      <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
        <span className="cwx-tag">{EMPLOYMENT_LABELS[item.employmentType] ?? item.employmentType}</span>
        <span className="cw-num font-semibold">{salaryLabel(item.salaryFromTetri, item.salaryToTetri)}</span>
      </p>
      <p className="mt-3 flex items-center justify-between gap-2 text-sm font-extrabold text-[var(--cw-stamp)]">
        <span className="inline-flex items-center gap-1">დეტალები <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-1" aria-hidden="true" /></span>
        {expires ? <span className="cw-num text-xs font-semibold text-[var(--cw-ink-soft)]">ვადა {expires}</span> : null}
      </p>
    </div>
  </Link>;
}

export function ProductCard({ item }: { item: ProductItem }) {
  return <article className="cwx-product">
    {item.imageUrl
      ? <img src={item.imageUrl} alt={item.imageAltKa ?? item.name} loading="lazy" className="cwx-product-img" />
      : <div className="cwx-product-img cwx-product-blank" aria-hidden="true"><ShoppingBag className="size-8" /></div>}
    <div className="cwx-product-body">
      {item.brand ? <p className="cw-caption">{item.brand}</p> : null}
      <h3 className="mt-1 text-lg font-extrabold leading-snug [font-stretch:85%]">{item.name}</h3>
      {item.description ? <p className="mt-1 line-clamp-2 text-sm leading-6 text-[var(--cw-ink-soft)]">{item.description}</p> : null}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <p className="cw-num text-base font-semibold">{formatGelTetri(item.priceTetri)}</p>
        <span className="cwx-stock" data-in-stock={item.inStock}>{item.inStock ? "მარაგშია" : "ამოიწურა"}</span>
      </div>
      <Link href={`/salon/${item.locationPublicSlug}`} className="cwx-biz">
        <span className="min-w-0 truncate">{item.businessName}{item.areaLabelKa ? ` · ${item.areaLabelKa}` : ""}</span>
        <ArrowRight className="size-4 shrink-0" aria-hidden="true" />
      </Link>
    </div>
  </article>;
}

export function ProductGrid({ items }: { items: ProductItem[] }) {
  return <ul className="cwx-grid">{items.map(item => <li key={item.id}><ProductCard item={item} /></li>)}</ul>;
}

export function LoadingGrid({ ticket = true }: { ticket?: boolean }) {
  return <div className={ticket ? "grid gap-4 md:grid-cols-2 xl:grid-cols-3" : "cwx-grid"} aria-busy="true" aria-label="იტვირთება">
    {[0, 1, 2].map(key => <div key={key} className={`${ticket ? "h-[8.5rem]" : "h-72"} animate-pulse rounded-[4px] border-[1.5px] border-[var(--cw-rule)] bg-white`} />)}
  </div>;
}

/** Honest empty state: a dashed outline, no invented rows. */
export function CommerceEmpty({ title, text, children }: { title: string; text: string; children?: React.ReactNode }) {
  return <div className="cwx-empty" role="status">
    <h3 className="text-xl font-extrabold [font-stretch:85%]">{title}</h3>
    <p className="mt-2 max-w-xl text-[var(--cw-ink-soft)]">{text}</p>
    {children ? <div className="mt-4 flex flex-wrap gap-3">{children}</div> : null}
  </div>;
}

export function LoadMoreButton({ hasMore, loading, onClick }: { hasMore: boolean; loading: boolean; onClick: () => void }) {
  if (!hasMore && !loading) return null;
  return <div className="mt-8 flex justify-center">
    <button type="button" className="cw-btn cw-btn-line min-h-11 text-[var(--cw-ink)]" disabled={loading} onClick={onClick}>{loading ? "იტვირთება…" : "მეტის ჩატვირთვა"}</button>
  </div>;
}
