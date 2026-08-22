import { MarketplaceCategoryRail, MarketplaceListingCard } from "@/components/public/MarketplaceDiscovery";
import { PublicFooter, PublicHeader } from "@/components/public/PublicPrimitives";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { Map, Search, ShieldCheck } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "wouter";

export default function MarketplaceDirectory() {
  const [categorySlug, setCategorySlug] = useState<string | undefined>();
  const [search, setSearch] = useState("");
  const input = useMemo(() => ({ limit: 48, offset: 0, categorySlug, search: search.trim() || undefined }), [categorySlug, search]);
  const directory = trpc.marketplace.directory.useQuery(input);

  return <div className="sf-public-page"><PublicHeader /><main id="main-content" className="sf-salon-section min-h-screen"><div className="sf-public-container py-10 sm:py-14"><div className="max-w-3xl"><p className="sf-salon-eyebrow">SALONFLOW MARKETPLACE</p><h1 className="sf-display mt-4 text-4xl font-semibold leading-tight sm:text-6xl">სალონები, რომლებსაც უკვე აქვთ საკუთარი ონლაინ ჩაწერის გზა.</h1><p className="mt-5 max-w-2xl text-base leading-7 text-[var(--sf-muted)]">აირჩიეთ კატეგორია ან მოძებნეთ სახელითა და უბნით. „რეკომენდებული“ და „VIP / რეკლამა“ არის ფასიანი გამორჩეული განთავსების მკაფიო ნიშანი — არა მომხმარებლის რეიტინგი.</p></div>
    <div className="mt-8 grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto]"><label className="relative"><span className="sr-only">სალონის ან უბნის ძიება</span><Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[var(--sf-muted)]" aria-hidden="true" /><Input value={search} onChange={event => setSearch(event.target.value)} placeholder="მოძებნეთ სალონი ან უბანი" className="h-12 rounded-2xl border-[var(--sf-line)] bg-[var(--sf-surface-raised)] pl-11" /></label><Link href="/salons/map" className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-[var(--sf-line)] bg-[var(--sf-surface-raised)] px-5 text-sm font-semibold transition hover:border-[var(--sf-salon-warm)]"><Map className="size-4 text-[var(--sf-salon-warm)]" aria-hidden="true" />რუკაზე ნახვა</Link></div>
    <div className="mt-4"><MarketplaceCategoryRail selectedSlug={categorySlug} onSelect={setCategorySlug} /></div>
    <div className="mt-8 flex items-center gap-2 text-xs text-[var(--sf-muted)]"><ShieldCheck className="size-4 text-[var(--sf-jade)]" aria-hidden="true" />კატალოგში ჩანს მხოლოდ დამტკიცებული listing; availability საბოლოოდ booking flow-ში მოწმდება.</div>
    {directory.isLoading ? <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{Array.from({ length: 6 }).map((_, index) => <div key={index} className="sf-skeleton h-80 rounded-[var(--sf-radius-surface)]" />)}</div> : null}{directory.isError ? <div className="mt-8 rounded-[var(--sf-radius-surface)] border border-dashed p-8"><h2 className="font-semibold">კატალოგი ახლა მიუწვდომელია</h2><p className="mt-2 text-sm text-[var(--sf-muted)]">სცადეთ რამდენიმე წუთში ხელახლა.</p></div> : null}{!directory.isLoading && !directory.isError && !directory.data?.items.length ? <div className="mt-8 rounded-[var(--sf-radius-surface)] border border-dashed bg-[var(--sf-surface-raised)] p-8"><h2 className="text-xl font-semibold">ამ ფილტრში სალონი ჯერ არ არის.</h2><p className="mt-2 max-w-xl text-sm leading-6 text-[var(--sf-muted)]">სცადეთ სხვა კატეგორია ან ძიების სიტყვა. არ ვაჩვენებთ დემო ან გამოგონილ სალონებს.</p></div> : null}{directory.data?.items.length ? <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{directory.data.items.map(item => <MarketplaceListingCard key={item.locationId as string} item={item} />)}</div> : null}
  </div></main><PublicFooter /></div>;
}
