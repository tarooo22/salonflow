import { CatalogFooter, CatalogHeader } from "@/components/catalog/CatalogChrome";
import { CommerceEmpty, LoadingGrid, ProductGrid, VacancyTicket } from "@/components/catalog/Commerce";
import { cssVars, EmptyTickets, listingMatchesVertical, NEW_LISTING_DAYS, newestListings, TicketShelf, type CatalogCategory as Category, type CatalogListing as Listing } from "@/components/catalog/Tickets";
import { marketplaceDiscoveryHref } from "@/components/public/MarketplaceDiscovery";
import { usePublicMeta } from "@/components/public/PublicMeta";
import { trpc } from "@/lib/trpc";
import { VERTICALS, verticalForCategory, verticalStyle, type Vertical } from "@/lib/verticals";
import { BRAND } from "@shared/brand";
import { ArrowRight, CalendarCheck, Globe, MapPin, Search, UsersRound, Wallet } from "lucide-react";
import { type FormEvent, useMemo, useState } from "react";
import { Link, useLocation } from "wouter";

const CITIES = ["თბილისი", "ბათუმი", "ქუთაისი", "რუსთავი", "ზუგდიდი", "თელავი", "გორი", "ფოთი"];

function SearchCard({ vertical, onVertical }: { vertical: Vertical | null; onVertical: (next: Vertical | null) => void }) {
  const [, setLocation] = useLocation();
  const [what, setWhat] = useState("");
  const [where, setWhere] = useState("");
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLocation(marketplaceDiscoveryHref("/salons", undefined, what, where));
  };
  // Sheet order: the chosen copy sits right behind the original, the others further back.
  const depth = (id: Vertical) => {
    if (vertical === id) return 1;
    const rest = VERTICALS.filter(item => item.id !== vertical).map(item => item.id);
    return (vertical ? 2 : 1) + rest.indexOf(id);
  };
  const band = vertical ? verticalStyle(vertical).bg : "var(--cw-ink)";
  const now = new Date();
  const today = `${String(now.getDate()).padStart(2, "0")}.${String(now.getMonth() + 1).padStart(2, "0")}.${now.getFullYear()}`;

  return <div className="cw-stack">
    <div className="cw-tabs" role="group" aria-label="სფეროს არჩევა">
      <button type="button" className="cw-tab cw-tab-all" aria-pressed={vertical === null} onClick={() => onVertical(null)}>ყველა</button>
      {VERTICALS.map(item => <button key={item.id} type="button" className="cw-tab" style={cssVars({ "--tab-bg": item.bg, "--tab-ink": item.ink })} aria-pressed={vertical === item.id} onClick={() => onVertical(vertical === item.id ? null : item.id)}>
        {item.label}{item.id === "dental" ? <span className="cw-tab-soon">მალე</span> : null}
      </button>)}
    </div>
    {VERTICALS.map(item => {
      const chosen = vertical === item.id;
      // The chosen copy is pulled out from under the original; the rest stay stacked behind it.
      const transform = chosen
        ? "translate(calc(var(--cw-off) * 3), calc(var(--cw-off) * -1.6)) rotate(1.4deg)"
        : `translate(calc(var(--cw-off) * ${depth(item.id)}), calc(var(--cw-off) * ${depth(item.id)}))`;
      return <div key={item.id} aria-hidden="true" className="cw-sheet" data-chosen={chosen} style={{ background: item.bg, transform, zIndex: 4 - depth(item.id) }} />;
    })}
    <div className="cw-card">
      <div className="cw-card-band" style={cssVars({ "--band": band })} />
      <div className="cw-card-inner" style={cssVars(vertical ? { "--tint": verticalStyle(vertical).bg, "--tint-amount": "16%" } : {})}>
        <div className="cw-card-head">
          <span>თარიღი <span className="cw-num ml-1 text-[var(--cw-ink)]">{today}</span></span>
          <span className="cw-num text-xs">{BRAND.domain}</span>
        </div>
        <div className="mt-6 grid gap-8 lg:grid-cols-[1.15fr_1fr] lg:items-center">
          <div>
            <h1 className="cw-display text-[clamp(1.95rem,5.6vw,4.4rem)]">ჩაეწერე ონლაინ — სალონში, ესთეტიკის ცენტრში და მალე სტომატოლოგთანაც.</h1>
            <p className="cw-lede mt-4">მხოლოდ გადამოწმებული ადგილები მთელი საქართველოდან. დრო, რომელსაც ხედავ, ნამდვილად თავისუფალია.</p>
          </div>
          <form onSubmit={submit} className="grid gap-3" role="search" aria-label="ადგილის ძებნა">
            <label className="cw-field">
              <span className="cw-caption">რა გჭირდება?</span>
              <input value={what} onChange={event => setWhat(event.target.value)} placeholder="მანიკიური, სალონის სახელი…" autoComplete="off" enterKeyHint="search" />
            </label>
            <label className="cw-field">
              <span className="cw-caption">სად?</span>
              <input value={where} onChange={event => setWhere(event.target.value)} placeholder="ქალაქი ან უბანი" list="cw-cities" autoComplete="off" enterKeyHint="search" />
            </label>
            <datalist id="cw-cities">{CITIES.map(city => <option key={city} value={city} />)}</datalist>
            <button type="submit" className="cw-btn cw-btn-stamp mt-1 w-full"><Search className="size-5" aria-hidden="true" />მოძებნე</button>
          </form>
        </div>
      </div>
    </div>
  </div>;
}

function Listings({ vertical }: { vertical: Vertical | null }) {
  const directory = trpc.marketplace.directory.useQuery({ limit: 24, offset: 0 });
  const items = ((directory.data?.items ?? []) as Listing[]).filter(item => listingMatchesVertical(item, vertical));
  const vip = items.filter(item => item.promotion?.tier === "VIP");
  const recommended = items.filter(item => item.promotion?.tier === "RECOMMENDED");
  const fresh = newestListings(items.filter(item => !item.promotion));
  const rest = items.filter(item => !item.promotion && !fresh.includes(item));
  const verticalLabel = vertical ? verticalStyle(vertical).label : null;

  return <section className="cw-section" aria-labelledby="cw-listings-title">
    <div className="cw-container">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 id="cw-listings-title" className="cw-h2">{verticalLabel ? `${verticalLabel} — გადამოწმებული ადგილები` : "გადამოწმებული ადგილები"}</h2>
          <p className="cw-lede mt-2">კატალოგში ჩანს მხოლოდ ის ადგილი, რომლის პროფილიც ჩვენ გადავამოწმეთ და რომელიც ონლაინ ჯავშანს იღებს.</p>
        </div>
        <Link href="/salons" className="cw-btn cw-btn-line min-h-11 text-[var(--cw-ink)]">მთელი კატალოგი <ArrowRight className="size-4" aria-hidden="true" /></Link>
      </div>
      <div className="mt-10">
        {directory.isLoading ? <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3" aria-busy="true" aria-label="იტვირთება">{[0, 1, 2].map(key => <div key={key} className="h-[8.5rem] animate-pulse rounded-[4px] border-[1.5px] border-[var(--cw-rule)] bg-white" />)}</div>
          : directory.isError ? <p role="alert" className="text-[var(--cw-ink-soft)]">ადგილების ჩატვირთვა ვერ მოხერხდა. განაახლეთ გვერდი ან <Link href="/salons" className="font-bold text-[var(--cw-stamp)] underline">გახსენით კატალოგი</Link>.</p>
          : items.length ? <>
            <TicketShelf title="VIP" note="ფასიანი განთავსება" items={vip} startAt={1} />
            <TicketShelf title="რეკომენდებული" note="ფასიანი განთავსება" items={recommended} startAt={vip.length + 1} />
            <TicketShelf title={`სიახლე ${BRAND.nameKa}-ზე`} note={`ბოლო ${NEW_LISTING_DAYS} დღეში დამატებული`} items={fresh} startAt={vip.length + recommended.length + 1} />
            <TicketShelf title={vip.length || recommended.length || fresh.length ? "ყველა ადგილი" : "ახლა კატალოგში"} items={rest} startAt={vip.length + recommended.length + fresh.length + 1} />
          </>
          : <EmptyTickets message={vertical === "dental" ? "სტომატოლოგიური კლინიკები მალე დაემატება." : verticalLabel ? `${verticalLabel} — პირველი ადგილები მალე გამოჩნდება.` : "პირველი გადამოწმებული ადგილები მალე გამოჩნდება."} vertical={vertical} />}
      </div>
    </div>
  </section>;
}

function CategoryLedger({ vertical }: { vertical: Vertical | null }) {
  const categories = trpc.marketplace.categories.useQuery();
  const byVertical = useMemo(() => {
    const grouped: Record<Vertical, Category[]> = { beauty: [], aesthetics: [], dental: [] };
    for (const category of (categories.data ?? []) as Category[]) grouped[verticalForCategory(category.slug)].push(category);
    return grouped;
  }, [categories.data]);
  const shown = vertical ? VERTICALS.filter(item => item.id === vertical) : VERTICALS;

  return <section className="cw-section cw-rule-top" aria-labelledby="cw-categories-title">
    <div className="cw-container">
      <h2 id="cw-categories-title" className="cw-h2">რას ეძებ?</h2>
      <div className={`mt-8 grid gap-5 ${shown.length > 1 ? "lg:grid-cols-3" : "max-w-xl"}`}>
        {shown.map(item => <div key={item.id} className="cw-ledger" style={cssVars({ "--ledger-bg": item.bg, "--ledger-ink": item.ink })}>
          <div className="cw-ledger-head"><span className="text-lg font-extrabold [font-stretch:85%]">{item.label}</span><span className="cw-num text-xs">{byVertical[item.id].length || "—"}</span></div>
          {byVertical[item.id].length ? byVertical[item.id].map(category => <Link key={category.id} href={marketplaceDiscoveryHref("/salons", category.slug)} className="cw-ledger-row">
            <span className="flex-1">{category.nameKa}</span>
            <ArrowRight className="size-4 text-[var(--cw-ink-soft)]" aria-hidden="true" />
          </Link>) : <p className="cw-ledger-row font-normal text-[var(--cw-ink-soft)]">{categories.isLoading ? "იტვირთება…" : item.id === "dental" ? "კლინიკები და სერვისები მალე დაემატება" : "კატეგორიები მალე დაემატება"}</p>}
        </div>)}
      </div>
    </div>
  </section>;
}

function HowItWorks() {
  const steps = [
    { title: "აირჩიე სერვისი", text: "ნახე ფასი და ხანგრძლივობა. შეგიძლია რამდენიმე სერვისი ერთად აირჩიო." },
    { title: "აირჩიე სპეციალისტი და დრო", text: "ჩანს მხოლოდ ის დრო, რომელიც სპეციალისტის განრიგში ნამდვილად თავისუფალია." },
    { title: "დაადასტურე", text: "მიუთითე სახელი და ტელეფონი. ჯავშნის შეცვლა ან გაუქმება შეგიძლია პირადი ბმულით." },
  ];
  return <section className="cw-section cw-rule-top" aria-labelledby="cw-how-title">
    <div className="cw-container grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
      <div>
        <h2 id="cw-how-title" className="cw-h2">ჩაწერა სამ ნაბიჯში, ზარის გარეშე.</h2>
        <p className="cw-lede mt-4">თავისუფალ დროს სისტემა სპეციალისტის რეალური განრიგიდან ითვლის და ჯავშნის მომენტში ხელახლა ამოწმებს — ერთი და იგივე დრო ორ ადამიანს ვერ მიეცემა.</p>
      </div>
      <ol className="cw-ledger">
        {steps.map((step, index) => <li key={step.title} className="cw-ledger-row items-start gap-4 py-5">
          <span className="cw-num grid size-9 shrink-0 place-items-center rounded-[3px] border-[1.5px] border-[var(--cw-ink)] text-sm font-semibold">{index + 1}</span>
          <span><span className="block text-lg font-extrabold [font-stretch:85%]">{step.title}</span><span className="mt-1 block font-normal leading-6 text-[var(--cw-ink-soft)]">{step.text}</span></span>
        </li>)}
      </ol>
    </div>
  </section>;
}

function Cities() {
  return <section className="cw-section cw-rule-top" aria-labelledby="cw-cities-title">
    <div className="cw-container grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
      <div>
        <h2 id="cw-cities-title" className="cw-h2">მთელი საქართველო.</h2>
        <p className="cw-lede mt-3">აირჩიე ქალაქი ან გახსენი რუკა და ნახე, რა არის შენთან ახლოს.</p>
        <ul className="mt-6 flex flex-wrap gap-2">{CITIES.map(city => <li key={city}><Link href={marketplaceDiscoveryHref("/salons", undefined, undefined, city)} className="cw-btn cw-btn-line min-h-10 px-4 text-sm font-bold text-[var(--cw-ink)]">{city}</Link></li>)}</ul>
      </div>
      <Link href="/salons/map" className="cw-btn cw-btn-stamp"><MapPin className="size-5" aria-hidden="true" />რუკის გახსნა</Link>
    </div>
  </section>;
}

function StripHead({ id, title, lede, href, cta }: { id: string; title: string; lede: string; href: string; cta: string }) {
  return <div className="flex flex-wrap items-end justify-between gap-4">
    <div>
      <h2 id={id} className="cw-h2">{title}</h2>
      <p className="cw-lede mt-2">{lede}</p>
    </div>
    <Link href={href} className="cw-btn cw-btn-line min-h-11 text-[var(--cw-ink)]">{cta} <ArrowRight className="size-4" aria-hidden="true" /></Link>
  </div>;
}

function VacancyStrip({ vertical }: { vertical: Vertical | null }) {
  const vip = trpc.vacancies.publicVipList.useQuery({ vertical: vertical ?? undefined, limit: 6 });
  const items = vip.data ?? [];
  return <section className="cw-section cw-rule-top" aria-labelledby="cw-vacancies-title">
    <div className="cw-container">
      <StripHead id="cw-vacancies-title" title="ვაკანსიები" lede="სამუშაო ადგილები ოსტატებისთვის, კოსმეტოლოგებისთვის და ექიმებისთვის. აქ ჩანს VIP განცხადებები (ფასიანი განთავსება)." href="/vacancies" cta="ყველა ვაკანსია" />
      <div className="mt-10">
        {vip.isLoading ? <LoadingGrid />
          : vip.isError ? <p role="alert" className="text-[var(--cw-ink-soft)]">ვაკანსიების ჩატვირთვა ვერ მოხერხდა. <Link href="/vacancies" className="font-bold text-[var(--cw-stamp)] underline">გახსენით ვაკანსიების გვერდი</Link>.</p>
          : items.length ? <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{items.map((item, index) => <VacancyTicket key={item.id} item={item} number={index + 1} />)}</div>
          : <CommerceEmpty title="VIP ვაკანსია ამჟამად არ არის." text="ყველა ღია ვაკანსია ნახე სრულ სიაში.">
            <Link href="/vacancies" className="cw-btn cw-btn-stamp">ყველა ვაკანსია</Link>
          </CommerceEmpty>}
      </div>
    </div>
  </section>;
}

function ProductStrip({ vertical }: { vertical: Vertical | null }) {
  const products = trpc.products.publicList.useQuery({ vertical: vertical ?? undefined, limit: 8, offset: 0 });
  const items = products.data?.items ?? [];
  return <section className="cw-section cw-rule-top" aria-labelledby="cw-products-title">
    <div className="cw-container">
      <StripHead id="cw-products-title" title="პროდუქტები" lede="სალონების და კლინიკების პროდუქტები ერთ ვიტრინაში. შეძენა ხდება უშუალოდ ბიზნესში." href="/products" cta="ყველა პროდუქტი" />
      <div className="mt-10">
        {products.isLoading ? <LoadingGrid ticket={false} />
          : products.isError ? <p role="alert" className="text-[var(--cw-ink-soft)]">პროდუქტების ჩატვირთვა ვერ მოხერხდა. <Link href="/products" className="font-bold text-[var(--cw-stamp)] underline">გახსენით პროდუქტების გვერდი</Link>.</p>
          : items.length ? <ProductGrid items={items} />
          : <CommerceEmpty title="პროდუქტები ჯერ არ არის დამატებული." text="როცა დამტკიცებული ბიზნესი პროდუქტებს დაამატებს, აქ გამოჩნდება.">
            <Link href="/products" className="cw-btn cw-btn-stamp">პროდუქტების გვერდი</Link>
          </CommerceEmpty>}
      </div>
    </div>
  </section>;
}

const BUSINESS_FEATURES = [
  { icon: CalendarCheck, title: "ონლაინ ჯავშნები", text: "კლიენტი თავად ირჩევს სერვისს, სპეციალისტს და თავისუფალ დროს — ზარების გარეშე." },
  { icon: UsersRound, title: "კლიენტები და გუნდი", text: "კლიენტების ბაზა ისტორიით, თანამშრომლების გრაფიკები და როლები." },
  { icon: Wallet, title: "გადახდები და ანგარიშები", text: "POS გადახდები, შემოსავლები, ხარჯები და საკომისიოები ერთ ადგილას." },
  { icon: Globe, title: "საკუთარი საჯარო გვერდი", text: "პროფილი ფასებით, გუნდით და სამუშაო საათებით, ჯავშნის ბმულით." },
];

function BusinessBand() {
  return <section className="cw-desk" aria-labelledby="cw-business-title">
    <div className="cw-container py-16 lg:py-20">
      <div className="grid gap-8 lg:grid-cols-[1.3fr_1fr] lg:items-end">
        <div>
          <h2 id="cw-business-title" className="cw-h2 text-white">ბიზნესის მფლობელი ხარ?</h2>
          <p className="mt-4 max-w-xl leading-7 text-[var(--cw-on-desk-soft)]">მართვის პროგრამა სალონებისთვის, ესთეტიკის ცენტრებისთვის და სტომატოლოგიური კლინიკებისთვის — თითოეულს თავის სფეროზე მორგებული პანელით. დაამატე შენი ადგილი კატალოგში და მიიღე ჯავშნები ონლაინ.</p>
          <ul className="mt-5 flex flex-wrap gap-2">{VERTICALS.map(item => <li key={item.id} className="rounded-[3px] px-3 py-1 text-sm font-extrabold" style={{ background: item.bg, color: item.ink }}>{item.label}{item.id === "dental" ? " · მალე" : ""}</li>)}</ul>
        </div>
        <div className="flex flex-wrap gap-3 lg:justify-end">
          <Link href="/partner" className="cw-btn cw-btn-paper">მართვის პროგრამა <ArrowRight className="size-4" aria-hidden="true" /></Link>
          <Link href="/register" className="cw-btn cw-btn-line text-white">რეგისტრაცია</Link>
        </div>
      </div>
      <ul className="mt-12 grid gap-px overflow-hidden rounded-[4px] border border-[var(--cw-desk-soft)] bg-[var(--cw-desk-soft)] sm:grid-cols-2 lg:grid-cols-4">
        {BUSINESS_FEATURES.map(item => <li key={item.title} className="bg-[var(--cw-desk)] p-5">
          <item.icon className="size-5 text-[var(--cw-aesthetics)]" aria-hidden="true" />
          <p className="mt-3 font-extrabold text-white [font-stretch:85%]">{item.title}</p>
          <p className="mt-1 text-sm leading-6 text-[var(--cw-on-desk-soft)]">{item.text}</p>
        </li>)}
      </ul>
    </div>
  </section>;
}

export default function Home() {
  usePublicMeta({
    title: `${BRAND.name} — ონლაინ ჩაწერა სალონში, ესთეტიკის ცენტრსა და სტომატოლოგთან`,
    description: "იპოვე გადამოწმებული სალონი, ესთეტიკის ცენტრი ან სტომატოლოგიური კლინიკა მთელ საქართველოში და ჩაეწერე ონლაინ — სერვისი, სპეციალისტი და თავისუფალი დრო ერთ ადგილას.",
    canonicalPath: "/",
  });
  const [vertical, setVertical] = useState<Vertical | null>(null);

  return <div className="cw min-h-screen">
    <CatalogHeader />
    <main id="main-content">
      <section className="cw-desk cw-section-hero pb-14 pt-6 sm:pb-20 sm:pt-10" aria-label="ძებნა">
        <div className="cw-container"><SearchCard vertical={vertical} onVertical={setVertical} /></div>
      </section>
      <Listings vertical={vertical} />
      <CategoryLedger vertical={vertical} />
      <HowItWorks />
      <Cities />
      <VacancyStrip vertical={vertical} />
      <ProductStrip vertical={vertical} />
      <BusinessBand />
    </main>
    <CatalogFooter />
  </div>;
}
