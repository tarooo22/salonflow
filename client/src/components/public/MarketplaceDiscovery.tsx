import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { ArrowRight, Brush, Eye, Flower2, MapPin, Scissors, Sparkles, Sun, Tag, Zap } from "lucide-react";
import { Link, useLocation } from "wouter";
import { FormEvent, useEffect, useMemo, useState } from "react";

const iconByKey = { scissors: Scissors, sparkles: Sparkles, brush: Brush, eye: Eye, "flower-2": Flower2, sun: Sun, zap: Zap, plus: Tag } as const;

export function marketplacePromotionLabel(tier: string | undefined) {
  return tier === "VIP" ? "VIP / რეკლამა" : tier === "RECOMMENDED" ? "რეკომენდებული" : null;
}

export function marketplaceDiscoveryHref(path: "/salons" | "/salons/map", categorySlug?: string, search?: string) {
  const params = new URLSearchParams();
  if (categorySlug) params.set("category", categorySlug);
  if (search?.trim()) params.set("q", search.trim());
  const query = params.toString();
  return query ? `${path}?${query}` : path;
}

export function marketplaceDiscoveryFilters(queryString: string) {
  const params = new URLSearchParams(queryString.startsWith("?") ? queryString.slice(1) : queryString);
  return { categorySlug: params.get("category") || undefined, search: params.get("q") || "" };
}

export function MarketplaceListingCard({ item }: { item: any }) {
  const label = marketplacePromotionLabel(item.promotion?.tier);
  return <article className="group overflow-hidden rounded-[var(--sf-radius-surface)] border border-[var(--sf-line)] bg-[var(--sf-surface-raised)] shadow-[var(--sf-shadow-soft)] transition duration-200 hover:-translate-y-1 hover:border-[color-mix(in_srgb,var(--sf-salon-warm)_36%,var(--sf-line))] hover:shadow-[var(--sf-shadow-lift)]">
    <Link href={`/salon/${item.publicSlug}`} className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--sf-accent-strong)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--sf-bg)]">
      <div className="relative aspect-[16/10] overflow-hidden bg-[radial-gradient(circle_at_15%_18%,color-mix(in_srgb,var(--sf-salon-warm)_34%,transparent),transparent_35%),linear-gradient(135deg,var(--sf-surface-hover),var(--sf-sidebar))]">
        {item.coverImageUrl ? <img src={item.coverImageUrl} alt={item.coverImageAltKa ?? `${item.name} — სალონის cover`} className="size-full object-cover transition duration-500 group-hover:scale-[1.035]" loading="lazy" /> : <div className="flex size-full flex-col justify-end p-5"><span className="sf-brand-mark sf-brand-mark--inverted" aria-hidden="true"><i /><i /><i /></span><p className="mt-4 text-xl font-semibold text-white">{item.name}</p></div>}
        {label ? <span className={`absolute left-3 top-3 rounded-full px-3 py-1 text-xs font-bold shadow-sm ${item.promotion.tier === "VIP" ? "bg-[var(--sf-fuchsia)] text-white" : "bg-[var(--sf-amber)] text-[#2a1706]"}`}>{label}</span> : null}
      </div>
      <div className="p-5"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><h2 className="truncate text-lg font-bold">{item.name}</h2><p className="mt-1 line-clamp-2 min-h-10 text-sm leading-5 text-[var(--sf-muted)]">{item.publicDescription || "სალონის public პროფილი და online booking მისამართი დამტკიცების შემდეგ აქ გამოჩნდება."}</p></div><ArrowRight className="mt-1 size-4 shrink-0 text-[var(--sf-salon-warm)] transition-transform group-hover:translate-x-1" aria-hidden="true" /></div><div className="mt-4 flex flex-wrap gap-1.5">{item.categories.map((category: any) => <span key={category.id} className="rounded-full bg-[var(--sf-surface-hover)] px-2.5 py-1 text-xs font-medium text-[var(--sf-ink)]">{category.nameKa}</span>)}</div><p className="mt-4 flex items-center gap-1.5 text-xs text-[var(--sf-muted)]"><MapPin className="size-3.5 text-[var(--sf-jade)]" aria-hidden="true" />{item.areaLabelKa || "მდებარეობის დეტალი პროფილში"}</p></div>
    </Link>
  </article>;
}

export function MarketplaceCategoryRail({ selectedSlug, onSelect }: { selectedSlug?: string; onSelect: (slug?: string) => void }) {
  const categories = trpc.marketplace.categories.useQuery();
  const buttonClass = (selected: boolean) => `flex min-h-12 items-center justify-center gap-2 rounded-2xl border px-3 py-3 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--sf-accent-strong)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--sf-bg)] ${selected ? "border-[var(--sf-salon-warm)] bg-[color-mix(in_srgb,var(--sf-salon-warm)_16%,var(--sf-surface))] text-[var(--sf-ink)]" : "border-[var(--sf-line)] bg-[var(--sf-surface-raised)] text-[var(--sf-muted)] hover:border-[var(--sf-salon-warm)] hover:text-[var(--sf-ink)]"}`;
  return <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap" aria-label="სალონის კატეგორიები"><button type="button" onClick={() => onSelect(undefined)} aria-pressed={!selectedSlug} className={buttonClass(!selectedSlug)}>ყველა</button>{categories.data?.map(category => { const Icon = iconByKey[category.iconKey as keyof typeof iconByKey] ?? Tag; return <button key={category.id} type="button" onClick={() => onSelect(category.slug)} aria-pressed={selectedSlug === category.slug} className={buttonClass(selectedSlug === category.slug)}><Icon className="size-4 shrink-0 text-[var(--sf-salon-warm)]" aria-hidden="true" /><span className="truncate">{category.nameKa}</span></button>; })}</div>;
}

export function MarketplaceHighlights() {
  const [location, setLocation] = useLocation();
  const filters = marketplaceDiscoveryFilters(typeof window === "undefined" ? "" : window.location.search);
  const [searchDraft, setSearchDraft] = useState(filters.search);
  const input = useMemo(() => ({ limit: 4, offset: 0, categorySlug: filters.categorySlug }), [filters.categorySlug]);
  const result = trpc.marketplace.directory.useQuery(input);
  const chooseCategory = (categorySlug?: string) => setLocation(marketplaceDiscoveryHref("/salons", categorySlug));
  useEffect(() => setSearchDraft(filters.search), [filters.search]);
  const submitDiscovery = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); setLocation(marketplaceDiscoveryHref("/salons", filters.categorySlug, searchDraft)); };
  return <section className="sf-salon-section border-y border-[var(--sf-line)]"><div className="sf-public-container py-16 lg:py-20"><div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end"><div><p className="sf-salon-eyebrow">SALONFLOW MARKETPLACE</p><h2 className="sf-display mt-4 max-w-2xl text-4xl font-semibold leading-tight sm:text-5xl">იპოვეთ სწორი სალონი — სერვისის, სტილისა და ადგილის მიხედვით.</h2><p className="mt-4 max-w-xl text-base leading-7 text-[var(--sf-muted)]">აირჩიეთ თმა, ფრჩხილები, მაკიაჟი ან სხვა სერვისი. კატეგორიის არჩევა გადაგიყვანთ მის სრულ კატალოგში; აქ ჩანს მხოლოდ review-ით დამტკიცებული სალონები და მათი რეალური online booking გზა.</p></div><Button asChild variant="publicSecondary"><Link href="/salons">ყველა სალონის ნახვა <ArrowRight className="ml-1.5 size-4" aria-hidden="true" /></Link></Button></div><div className="mt-8"><MarketplaceCategoryRail selectedSlug={filters.categorySlug} onSelect={chooseCategory} /></div><form className="mt-5 grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto_auto]" onSubmit={submitDiscovery}><label className="sr-only" htmlFor="home-marketplace-search">სალონის ან სერვისის ძიება</label><Input id="home-marketplace-search" value={searchDraft} onChange={event => setSearchDraft(event.target.value)} maxLength={120} placeholder="მოძებნეთ სალონი, სერვისი ან ადგილი" className="min-h-12 bg-[var(--sf-surface-raised)]" /><Button type="submit" variant="public" className="min-h-12">ძიება</Button><Button asChild type="button" variant="outline" className="min-h-12 bg-[var(--sf-surface-raised)]"><Link href="/salons/map">რუკაზე ნახვა</Link></Button></form>{result.isLoading ? <div className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{Array.from({ length: 4 }).map((_, index) => <div key={index} className="sf-skeleton h-72 rounded-[var(--sf-radius-surface)]" />)}</div> : null}{result.isError ? <p className="mt-8 rounded-2xl border border-dashed p-5 text-sm text-[var(--sf-muted)]">სალონების კატალოგი ახლა მიუწვდომელია. სცადეთ მოგვიანებით.</p> : null}{!result.isLoading && !result.isError && !result.data?.items.length ? <div className="mt-9 overflow-hidden rounded-[var(--sf-radius-surface)] border border-dashed bg-[radial-gradient(circle_at_85%_10%,color-mix(in_srgb,var(--sf-salon-warm)_17%,transparent),transparent_28%),var(--sf-surface-raised)] p-7"><p className="sf-salon-eyebrow">MARKETPLACE იწყება რეალური პროფილებით</p><p className="mt-3 text-xl font-semibold">პირველი დამტკიცებული სალონები მალე გამოჩნდება.</p><p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--sf-muted)]">არ ვაჩვენებთ გამოგონილ listing-ს. სალონი კატალოგში ჩნდება მხოლოდ მაშინ, როცა მფლობელი ამზადებს პროფილს, აკავშირებს რეალურ სერვისებს და იგი გადის platform review-ს.</p><Button asChild variant="outline" className="mt-5 bg-[var(--sf-surface-raised)]"><Link href="/register">სალონის პროფილის დაწყება</Link></Button></div> : null}{result.data?.items.length ? <div className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{result.data.items.map(item => <MarketplaceListingCard key={item.locationId as string} item={item} />)}</div> : null}</div></section>;
}
