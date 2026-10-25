import { usePublicLocale } from "@/contexts/PublicLocaleContext";
import { useSavedSalons } from "@/lib/deviceSaved";
import { verticalLabel, verticalsForListing, verticalStyle, type Vertical } from "@/lib/verticals";
import { Anchor, Baby, Brush, ChevronLeft, ChevronRight, Droplet, Droplets, Eye, Flower2, Heart, MapPin, Ruler, ScanLine, Scissors, Smile, Sparkles, Stethoscope, Syringe, UserRound, Zap, type LucideIcon } from "lucide-react";
import { type CSSProperties, useEffect, useId, useState } from "react";
import { Link } from "wouter";
import "./discovery.css";
import { RevealGroup, RevealItem } from "./HomeMotion";

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

export const ui = {
  ka: { recommended: "რეკომენდებული", ad: "ფასიანი განთავსება", adSr: " — ფასიანი განთავსება", fresh: "ახალი", haveBusiness: "ბიზნესი გაქვს?", addPlace: "დაამატე შენი ადგილი", scrollPrev: "წინა ადგილები", scrollNext: "შემდეგი ადგილები", save: "შენახვა", unsave: "შენახულიდან ამოშლა" },
  en: { recommended: "Recommended", ad: "Paid placement", adSr: " — paid placement", fresh: "New", haveBusiness: "Own a business?", addPlace: "Add your place", scrollPrev: "Previous places", scrollNext: "Next places", save: "Save", unsave: "Remove from saved" },
  ru: { recommended: "Рекомендуем", ad: "Платное размещение", adSr: " — платное размещение", fresh: "Новое", haveBusiness: "У вас свой бизнес?", addPlace: "Добавьте своё место", scrollPrev: "Предыдущие места", scrollNext: "Следующие места", save: "Сохранить", unsave: "Убрать из сохранённых" },
} as const;

export function cssVars(vars: Record<string, string>) {
  return vars as CSSProperties;
}

// Static map: only the icons the categories use are bundled (marketplace_categories.iconKey).
const CATEGORY_ICONS: Record<string, LucideIcon> = {
  scissors: Scissors, sparkles: Sparkles, brush: Brush, eye: Eye, "flower-2": Flower2, "user-round": UserRound, zap: Zap, droplet: Droplet,
  syringe: Syringe, "scan-line": ScanLine, smile: Smile, droplets: Droplets, anchor: Anchor, ruler: Ruler, stethoscope: Stethoscope, baby: Baby,
};

export function categoryIcon(iconKey: string | null | undefined): LucideIcon {
  return CATEGORY_ICONS[(iconKey ?? "").trim().toLowerCase()] ?? Sparkles;
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

/** The shared listing card: cover (or tinted initial), save heart, disclosed placement chip, name, area, categories. */
export function SalonCard({ item, eager = false }: { item: CatalogListing; eager?: boolean }) {
  const { locale } = usePublicLocale();
  const text = ui[locale];
  const { isSaved, toggle } = useSavedSalons();
  const nameId = useId();
  const [broken, setBroken] = useState(false);
  const saved = isSaved(item.publicSlug);
  const verticals = verticalsForListing(item.categories);
  const lead = verticalStyle(verticals[0] ?? "beauty");
  const promoted = item.promotion?.tier === "VIP" ? "VIP" : item.promotion?.tier === "RECOMMENDED" ? text.recommended : null;
  const fresh = !promoted && isNewListing(item);
  const Icon = categoryIcon(item.categories[0]?.iconKey);
  const showCover = Boolean(item.coverImageUrl) && !broken;
  return <article className="sc">
    <Link href={`/salon/${item.publicSlug}`} className="sc-link">
      <div className="sc-cover" style={cssVars({ "--sc-bg": lead.bg, "--sc-ink": lead.ink })}>
        {showCover
          ? <img src={item.coverImageUrl!} alt={item.coverImageAltKa ?? ""} loading={eager ? "eager" : "lazy"} onError={() => setBroken(true)} />
          : <>
            <span className="sc-initial" aria-hidden="true">{Array.from(item.name.trim())[0] ?? ""}</span>
            <Icon className="sc-icon" aria-hidden="true" />
          </>}
        {promoted ? <span className="sc-chip" data-kind={item.promotion?.tier === "VIP" ? "vip" : "rec"} title={item.promotion?.disclosure ?? text.ad}>{promoted}<span className="sr-only">{text.adSr}</span></span>
          : fresh ? <span className="sc-chip" data-kind="new">{text.fresh}</span> : null}
      </div>
      <div className="sc-body">
        <h3 id={nameId} className="sc-name">{item.name}</h3>
        {item.areaLabelKa ? <p className="sc-area"><MapPin className="size-3.5 shrink-0" aria-hidden="true" />{item.areaLabelKa}</p> : null}
        {item.categories.length ? <p className="sc-cats">{item.categories.map(category => category.nameKa).join(", ")}</p> : null}
        <div className="sc-vchips">{verticals.map(id => <span key={id} className="sc-vchip" style={cssVars({ "--sc-bg": verticalStyle(id).bg, "--sc-ink": verticalStyle(id).ink })}>{verticalLabel(id, locale)}</span>)}</div>
      </div>
    </Link>
    <button type="button" className="sc-heart" aria-pressed={saved} aria-label={saved ? text.unsave : text.save} aria-describedby={nameId} onClick={() => toggle(item.publicSlug)}>
      <Heart className="size-5" fill={saved ? "currentColor" : "none"} aria-hidden="true" />
    </button>
  </article>;
}

/** A snap-scroll row of cards. `setEl` goes on the scroller; `prev`/`next` say whether there is more to scroll to. */
export function useScrollRow() {
  const [el, setEl] = useState<HTMLElement | null>(null);
  const [edge, setEdge] = useState({ prev: false, next: false });
  useEffect(() => {
    if (!el) return;
    const update = () => {
      const next = { prev: el.scrollLeft > 2, next: el.scrollLeft < el.scrollWidth - el.clientWidth - 2 };
      setEdge(current => current.prev === next.prev && current.next === next.next ? current : next);
    };
    update();
    el.addEventListener("scroll", update, { passive: true });
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(update);
    observer?.observe(el);
    if (el.firstElementChild) observer?.observe(el.firstElementChild);
    return () => { el.removeEventListener("scroll", update); observer?.disconnect(); };
  }, [el]);
  // One card (plus the gap) per press.
  const scrollByCard = (direction: 1 | -1) => {
    if (!el) return;
    const card = el.querySelector("li");
    const gap = card?.parentElement ? parseFloat(getComputedStyle(card.parentElement).columnGap) || 0 : 0;
    const step = card ? card.getBoundingClientRect().width + gap : el.clientWidth * 0.8;
    const reduced = typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollBy({ left: direction * step, behavior: reduced ? "auto" : "smooth" });
  };
  return { setEl, ...edge, scrollByCard };
}
export type ScrollRow = ReturnType<typeof useScrollRow>;

/** Two round outline buttons for the section header. Renders nothing while the row fits without scrolling. */
export function CarouselArrows({ row }: { row: ScrollRow }) {
  const text = ui[usePublicLocale().locale];
  if (!row.prev && !row.next) return null;
  return <div className="sc-arrows">
    <button type="button" className="sc-arrow" aria-label={text.scrollPrev} disabled={!row.prev} onClick={() => row.scrollByCard(-1)}><ChevronLeft className="size-4" aria-hidden="true" /></button>
    <button type="button" className="sc-arrow" aria-label={text.scrollNext} disabled={!row.next} onClick={() => row.scrollByCard(1)}><ChevronRight className="size-4" aria-hidden="true" /></button>
  </div>;
}

export function SalonGrid({ items, rail = false, reveal = false, row }: { items: CatalogListing[]; rail?: boolean; reveal?: boolean; row?: ScrollRow }) {
  if (row) {
    const cards = items.map((item, index) => reveal ? <RevealItem as="li" key={item.publicSlug}><SalonCard item={item} eager={index < 4} /></RevealItem> : <li key={item.publicSlug}><SalonCard item={item} eager={index < 4} /></li>);
    return <div className="sc-row" ref={row.setEl}>{reveal ? <RevealGroup as="ul" className="sc-row-list">{cards}</RevealGroup> : <ul className="sc-row-list">{cards}</ul>}</div>;
  }
  const className = `sc-grid ${rail ? "sc-grid--rail" : ""}`;
  if (reveal) return <RevealGroup as="ul" className={className}>{items.map((item, index) => <RevealItem as="li" key={item.publicSlug}><SalonCard item={item} eager={index < 4} /></RevealItem>)}</RevealGroup>;
  return <ul className={className}>{items.map((item, index) => <li key={item.publicSlug}><SalonCard item={item} eager={index < 4} /></li>)}</ul>;
}

/** Loading skeletons only; shown while the request is in flight, never as a stand-in for missing data. */
export function SalonLoading({ label, count = 4 }: { label: string; count?: number }) {
  return <ul className="sc-grid" aria-busy="true" aria-label={label}>{Array.from({ length: count }, (_, key) => <li key={key}><div className="sc sc-skel"><div className="sc-skel-cover sf-skeleton" /><div className="sc-body"><span className="sc-skel-bar sf-skeleton" style={{ width: "60%" }} /><span className="sc-skel-bar sf-skeleton" style={{ width: "40%" }} /><span className="sc-skel-bar sf-skeleton" style={{ width: "30%" }} /></div></div></li>)}</ul>;
}

/** Honest empty state: one line and a way to add a business, no invented rows. */
export function EmptyCatalog({ message }: { message: string }) {
  const text = ui[usePublicLocale().locale];
  return <div className="sc-empty" role="status">
    <p className="sc-empty-title">{message}</p>
    <p className="sc-empty-note">{text.haveBusiness} <Link href="/partner">{text.addPlace}</Link></p>
  </div>;
}
