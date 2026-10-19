import { verticalsForListing, verticalStyle, type Vertical } from "@/lib/verticals";
import { ArrowRight, MapPin } from "lucide-react";
import type { CSSProperties } from "react";
import { Link } from "wouter";

export type CatalogCategory = { id: string; slug: string; nameKa: string; iconKey: string };
export type CatalogListing = {
  publicSlug: string;
  name: string;
  areaLabelKa: string | null;
  publicDescription: string | null;
  coverImageUrl: string | null;
  coverImageAltKa: string | null;
  categories: CatalogCategory[];
  promotion: { tier: string; disclosure: string | null } | null;
  approvedAt?: string | Date | null;
};

export const NEW_LISTING_DAYS = 30;

export function cssVars(vars: Record<string, string>) {
  return vars as CSSProperties;
}

export function listingMatchesVertical(listing: Pick<CatalogListing, "categories">, vertical: Vertical | null) {
  if (!vertical) return true;
  return verticalsForListing(listing.categories).includes(vertical);
}

export function isNewListing(listing: Pick<CatalogListing, "approvedAt">, now = new Date()) {
  if (!listing.approvedAt) return false;
  const approved = new Date(listing.approvedAt).getTime();
  return Number.isFinite(approved) && now.getTime() - approved <= NEW_LISTING_DAYS * 86_400_000;
}

export function newestListings<T extends Pick<CatalogListing, "approvedAt">>(items: T[], now = new Date()) {
  return items.filter(item => isNewListing(item, now)).sort((a, b) => new Date(b.approvedAt!).getTime() - new Date(a.approvedAt!).getTime());
}

export function Ticket({ item, number }: { item: CatalogListing; number: number }) {
  const verticals = verticalsForListing(item.categories);
  const lead = verticalStyle(verticals[0] ?? "beauty");
  const promoted = item.promotion?.tier === "VIP" ? "VIP" : item.promotion?.tier === "RECOMMENDED" ? "რჩეული" : null;
  const fresh = !promoted && isNewListing(item);
  return <Link href={`/salon/${item.publicSlug}`} className="cw-ticket group" style={cssVars({ "--stub-bg": lead.bg, "--stub-ink": lead.ink })}>
    <div className="cw-ticket-stub" aria-hidden="true">
      <span className="cw-num">№ {String(number).padStart(3, "0")}</span>
      <span className="text-[0.72rem] font-extrabold [writing-mode:vertical-rl] rotate-180">{lead.label}</span>
    </div>
    <div className="flex min-w-0 gap-4 p-4">
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="truncate text-lg font-extrabold [font-stretch:85%]">{item.name}</h3>
          {promoted ? <span className="cw-stamp-mark shrink-0" title={item.promotion?.disclosure ?? "რეკლამა"}>{promoted}<span className="sr-only"> — რეკლამა</span></span>
            : fresh ? <span className="cw-stamp-mark shrink-0">ახალი</span> : null}
        </div>
        {item.areaLabelKa ? <p className="mt-1 flex items-center gap-1 text-sm text-[var(--cw-ink-soft)]"><MapPin className="size-3.5 shrink-0" aria-hidden="true" />{item.areaLabelKa}</p> : null}
        {item.categories.length ? <p className="mt-2 line-clamp-1 text-sm text-[var(--cw-ink-soft)]">{item.categories.map(category => category.nameKa).join(" · ")}</p> : null}
        <span className="mt-3 inline-flex items-center gap-1 text-sm font-extrabold text-[var(--cw-stamp)]">ჩაწერა <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-1" aria-hidden="true" /></span>
      </div>
      {item.coverImageUrl ? <img src={item.coverImageUrl} alt={item.coverImageAltKa ?? ""} loading="lazy" className="hidden size-24 shrink-0 rounded-[3px] object-cover sm:block" /> : null}
    </div>
  </Link>;
}

// Unfilled tickets: the live state until the first businesses are approved.
export function EmptyTickets({ message, vertical }: { message: string; vertical: Vertical | null }) {
  const tone = verticalStyle(vertical ?? "beauty");
  return <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
    {[1, 2, 3].map(number => <div key={number} className={`cw-ticket ${number > 1 ? "cw-ticket-extra" : ""}`} style={cssVars({ "--stub-bg": tone.bg, "--stub-ink": tone.ink })}>
      <div className="cw-ticket-stub" aria-hidden="true"><span className="cw-num">№ {String(number).padStart(3, "0")}</span></div>
      {number === 1
        ? <div className="flex flex-col justify-between gap-3 p-4">
          <p className="font-extrabold leading-6">{message}</p>
          <p className="text-sm text-[var(--cw-ink-soft)]">ბიზნესი გაქვს? <Link href="/partner" className="font-extrabold text-[var(--cw-stamp)] underline">დაამატე შენი ადგილი</Link></p>
        </div>
        : <div className="cw-ticket-blank m-4" aria-hidden="true" />}
    </div>)}
  </div>;
}

export function TicketShelf({ title, note, items, startAt, action }: { title: string; note?: string; items: CatalogListing[]; startAt: number; action?: React.ReactNode }) {
  if (!items.length) return null;
  return <div className="mt-12 first:mt-0">
    <div className="flex flex-wrap items-baseline justify-between gap-2 border-b-[1.5px] border-[var(--cw-ink)] pb-3">
      <h3 className="text-xl font-extrabold [font-stretch:85%]">{title}</h3>
      {note || action ? <div className="flex items-baseline gap-4 text-sm text-[var(--cw-ink-soft)]">{note ? <p>{note}</p> : null}{action}</div> : null}
    </div>
    <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">{items.map((item, index) => <Ticket key={item.publicSlug} item={item} number={startAt + index} />)}</div>
  </div>;
}
