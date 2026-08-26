import { Button } from "@/components/ui/button";
import { PublicEyebrow, PublicFooter, PublicHeader } from "@/components/public/PublicPrimitives";
import { SalonFlowHeroScene } from "@/components/public/SalonFlowHeroScene";
import { MarketplaceHighlights } from "@/components/public/MarketplaceDiscovery";
import { usePublicMeta } from "@/components/public/PublicMeta";
import { useReveal } from "@/hooks/useReveal";
import { ArrowRight, CalendarCheck2, CheckCircle2, ChevronRight, CreditCard, LockKeyhole, Search, Sparkles, Store, UsersRound } from "lucide-react";
import { Link } from "wouter";

const featureStories = [
  { icon: CalendarCheck2, title: "დღე ერთი ეკრანიდან", text: "Today queue და კალენდარი აერთიანებს ჩაწერებს, სტატუსებს, სპეციალისტებსა და შემდეგ მოქმედებას.", label: "Today + Calendar", tone: "teal" },
  { icon: Sparkles, title: "ონლაინ ჩაწერა თქვენი წესებით", text: "სერვისი, სპეციალისტი ან თავისუფალი არჩევანი, დრო და დაცული დადასტურება — ერთი მკაფიო გზით.", label: "Public booking", tone: "fuchsia" },
  { icon: UsersRound, title: "კლიენტები და გუნდი კონტექსტით", text: "გრაფიკები, სამუშაო საათები, კლიენტის ისტორია და შეთანხმებები საჭირო ადგილზე რჩება.", label: "CRM + Team", tone: "violet" },
  { icon: CreditCard, title: "კონტროლი რეალური მონაცემით", text: "შემოსავალი, ხარჯები, საკომისიოები და გადახდის სტატუსები იკითხება ორგანიზაციის scope-ის დაცვით.", label: "Reports + Finance", tone: "amber" },
];

const toneStyles: Record<string, string> = {
  teal: "bg-gradient-to-br from-[var(--sf-teal)] to-[var(--sf-jade)]",
  fuchsia: "bg-gradient-to-br from-[var(--sf-fuchsia)] to-[var(--sf-magenta)]",
  violet: "bg-gradient-to-br from-[var(--sf-violet)] to-[var(--sf-indigo)]",
  amber: "bg-gradient-to-br from-[var(--sf-amber)] to-[var(--sf-fuchsia)]",
};

const painPoints = [
  { title: "ჩაწერები", before: "დაკარგული ზარები და ხელით გადამოწმებული დრო", after: "ონლაინ მოთხოვნა და სერვერზე გადამოწმებული ხელმისაწვდომობა" },
  { title: "გუნდი", before: "ცალკე გრაფიკები, გამონაკლისები და გაუგებარი პასუხისმგებლობა", after: "ფილიალზე მიბმული სპეციალისტები, საათები და ერთიანი კალენდარი" },
  { title: "კონტროლი", before: "დღის სურათის მოსაძებნად რამდენიმე ფაილი და ჩათი", after: "ოპერაციები, გადახდები და ანგარიშები ერთ მშვიდ სამუშაო სივრცეში" },
];

const bookingJourney = [
  { number: "01", title: "კლიენტი ირჩევს სერვისს", text: "საჯარო booking გვერდზე ჩანს მხოლოდ აქტიური სერვისები და მათი რეალური ხანგრძლივობა/ფასი." },
  { number: "02", title: "სისტემა ამოწმებს დროს", text: "სპეციალისტი და თავისუფალი დრო მოწმდება არჩეული სერვისისა და მიმდინარე განრიგის მიხედვით." },
  { number: "03", title: "სალონი მართავს დღეს", text: "Today და Calendar აჩვენებს მოთხოვნას, სტატუსს და შემდეგ ოპერაციულ მოქმედებას." },
];

const audienceRoutes = [
  { icon: Search, eyebrow: "კლიენტისთვის", title: "იპოვეთ სალონი და დაჯავშნეთ დრო", text: "მოძებნეთ დამტკიცებული სალონები, გახსენით მათი რეალური პროფილი და გადადით online booking-ზე.", cta: "სალონების ძიება", href: "/salons", tone: "teal" },
  { icon: Store, eyebrow: "სალონისთვის", title: "მართეთ დღე ერთი სამუშაო სივრციდან", text: "რეგისტრაციისა და ხელით დამტკიცების შემდეგ მიიღებთ 7-დღიან trial-ს, რათა დაამატოთ გუნდი, სერვისები და booking link.", cta: "სალონის დაწყება", href: "/register", tone: "fuchsia" },
];

const faq = [
  { q: "მჭირდება თუ არა სპეციალური ტექნიკური ცოდნა SalonFlow-ის გამოსაყენებლად?", a: "არა. SalonFlow შექმნილია სალონის ყოველდღიური პროცესებისთვის: იმუშავებთ ქართულ, ნაბიჯ-ნაბიჯ ინტერფეისში. სამუშაო სივრცეში შესასვლელად საჭიროა მხოლოდ ადგილობრივი ელფოსტა და პაროლი." },
  { q: "შემიძლია რამდენიმე ფილიალის მართვა?", a: "დიახ. სამუშაო სივრცე მხარდაჭერას უწევს ორგანიზაციასა და რამდენიმე ფილიალს, თითოეული ფილიალის timezone-ითა და public booking link-ით." },
  { q: "როგორ მოწმდება თავისუფალი დრო?", a: "დროის არჩევის შემდეგ ხელმისაწვდომობას სისტემა ამოწმებს, ხოლო ჩაწერის დადასტურებისას სერვერი ხელახლა აკეთებს conflict check-ს." },
  { q: "იგზავნება თუ არა ახლა SMS ან ელფოსტა?", a: "ჯერ არა. შეტყობინებების ავტომატური მიწოდება გააქტიურდება მხოლოდ verified sender domain-ისა და შესაბამისი provider-ის კონფიგურაციის შემდეგ." },
];

export default function Home() {
  const revealRef = useReveal<HTMLElement>();
  usePublicMeta({ title: "SalonFlow — იპოვეთ სალონი. მართეთ თქვენი დღე.", description: "იპოვეთ დამტკიცებული სალონი და online booking გზა, ან მართეთ თქვენი სალონის ჩაწერები, გუნდი და დღე ერთ ქართულ სამუშაო სივრცეში.", canonicalPath: "/" });
  return <div className="sf-public-page"><PublicHeader />
    <main id="main-content" ref={revealRef} tabIndex={-1}>
      <section className="sf-salon-section"><div className="sf-public-container relative grid gap-12 pb-20 pt-14 lg:grid-cols-[1.03fr_.97fr] lg:items-center lg:pb-28 lg:pt-24">
        <span className="sf-blob hidden lg:block" style={{ width: "26rem", height: "26rem", top: "-6rem", left: "-8rem", background: "var(--sf-gradient-brand-soft)", animation: "sf-blob-morph 16s ease-in-out infinite" }} aria-hidden="true" />
        <div className="relative">
          <p className="sf-salon-eyebrow">სალონის ყოველდღიური რიტმისთვის</p>
          <h1 className="sf-display mt-5 max-w-3xl text-[2.4rem] font-semibold leading-[0.98] sm:text-6xl lg:text-7xl">იპოვეთ თქვენი სალონი. <span className="sf-gradient-text">მართეთ თქვენი დღე</span>.</h1>
          <p className="mt-7 max-w-xl text-lg leading-8 text-[var(--sf-muted)]">კლიენტი სწრაფად პოულობს სალონსა და რეალურ online booking გზას. მფლობელი კი მართავს ჩაწერებს, გუნდს და ყოველდღიურ კონტროლს ერთ ქართულ სამუშაო სივრცეში.</p>
          <div className="sf-salon-cta-row mt-9"><Button asChild variant="public" size="lg"><Link href="/salons">იპოვე სალონი <Search className="size-4" aria-hidden="true" /></Link></Button><Button asChild variant="publicSecondary" size="lg"><Link href="/register">ვმართავ სალონს <ChevronRight className="size-4" aria-hidden="true" /></Link></Button></div>
          <p className="mt-5 inline-flex items-center gap-2 text-sm text-[var(--sf-muted)]"><LockKeyhole className="size-4 text-[var(--sf-jade)]" aria-hidden="true" /> სალონისთვის: რეგისტრაცია → ხელით დამტკიცება → 7-დღიანი საცდელი წვდომა</p>
        </div>
        <div className="sf-reveal"><SalonFlowHeroScene /></div>
      </div></section>

      <section aria-label="აირჩიეთ გზა" className="sf-public-container pb-6"><div className="grid gap-4 lg:grid-cols-2">{audienceRoutes.map(({ icon: Icon, eyebrow, title, text, cta, href, tone }, index) => <article key={eyebrow} className={`sf-salon-panel sf-lift sf-reveal p-6 sm:p-7 sf-motion-delay-${index + 1}`}><span className={`grid size-11 place-items-center rounded-2xl text-white shadow-lg ${toneStyles[tone]}`}><Icon className="size-5" aria-hidden="true" /></span><p className="mt-5 text-xs font-bold uppercase tracking-[0.12em] text-[var(--sf-salon-warm)]">{eyebrow}</p><h2 className="mt-2 text-2xl font-bold tracking-tight">{title}</h2><p className="mt-3 max-w-xl text-sm leading-6 text-[var(--sf-muted)]">{text}</p><Button asChild variant={tone === "teal" ? "publicSecondary" : "public"} className="mt-6"><Link href={href}>{cta}<ArrowRight className="ml-1.5 size-4" aria-hidden="true" /></Link></Button></article>)}</div></section>

      <section className="sf-public-container pb-4"><div className="sf-salon-panel grid gap-3 px-5 py-5 sm:grid-cols-3 sm:px-6"><TrustItem label="მრავალფილიალიანი" text="ფილიალი, timezone და public link" /><TrustItem label="ქართული-first" text="ბუნებრივი UI და ka-GE ფორმატები" /><TrustItem label="სანდო ოპერაციები" text="როლები, ისტორია და server-side checks" /></div></section>

      <MarketplaceHighlights />

      <section className="sf-public-container py-16 lg:py-20"><div className="grid gap-8 lg:grid-cols-[.78fr_1.22fr] lg:items-end"><div className="sf-reveal"><p className="sf-salon-eyebrow">ონლაინ ჩაწერის რეალური გზა</p><h2 className="sf-display mt-4 text-4xl font-semibold leading-tight sm:text-5xl">სტუმრის არჩევანი — თქვენი დღის მშვიდ დასაწყისამდე.</h2><p className="mt-5 max-w-xl text-base leading-7 text-[var(--sf-muted)]">SalonFlow არ აჩვენებს გამოგონილ თავისუფალ დროს: სერვისი, სპეციალისტი და დრო საბოლოოდ მოწმდება მოქმედი განრიგის მიხედვით.</p><Button asChild variant="publicSecondary" className="mt-7"><Link href="/book">საჯარო ჩაწერის გახსნა <ArrowRight className="ml-1.5 size-4" aria-hidden="true" /></Link></Button></div><ol className="grid gap-3 md:grid-cols-3">{bookingJourney.map((item, index) => <li key={item.number} className={`sf-salon-panel sf-lift sf-reveal p-5 sf-motion-delay-${index + 1}`}><span className="sf-gradient-fill grid size-9 place-items-center rounded-xl text-sm font-bold shadow-[var(--sf-glow-brand)]">{item.number}</span><div className="sf-salon-flowline mt-5" aria-hidden="true" /><h3 className="mt-5 text-lg font-bold">{item.title}</h3><p className="mt-2 text-sm leading-6 text-[var(--sf-muted)]">{item.text}</p></li>)}</ol></div></section>

      <section className="sf-salon-section"><div className="sf-public-container py-20 lg:py-28"><div className="sf-reveal max-w-2xl"><p className="sf-salon-eyebrow">პრობლემიდან რიტმამდე</p><h2 className="sf-display mt-4 text-4xl font-semibold leading-tight sm:text-5xl">დღის მართვა არ უნდა იწყებოდეს ქაოსის დალაგებით.</h2></div><div className="mt-10 grid gap-4 lg:grid-cols-3">{painPoints.map((item, i) => <article key={item.title} className={`sf-salon-panel sf-lift sf-reveal p-6 sf-motion-delay-${i + 1}`}><p className="text-lg font-bold">{item.title}</p><p className="mt-5 text-sm leading-6 text-[var(--sf-muted)]">{item.before}</p><div className="my-5 sf-salon-flowline" aria-hidden="true" /><p className="flex gap-2 text-sm leading-6"><CheckCircle2 className="mt-0.5 size-4 shrink-0 text-[var(--sf-jade)]" aria-hidden="true" />{item.after}</p></article>)}</div></div></section>

      <section id="features" className="sf-grain relative overflow-hidden bg-sidebar py-20 text-sidebar-foreground lg:py-28">
        <span className="sf-blob" style={{ width: "32rem", height: "32rem", top: "-10rem", right: "-8rem", background: "var(--sf-gradient-brand)", opacity: 0.35, animation: "sf-blob-morph 18s ease-in-out infinite" }} aria-hidden="true" />
        <span className="sf-blob" style={{ width: "26rem", height: "26rem", bottom: "-8rem", left: "-6rem", background: "linear-gradient(120deg,var(--sf-teal),var(--sf-violet))", opacity: 0.28, animation: "sf-blob-morph 22s ease-in-out infinite reverse" }} aria-hidden="true" />
        <div className="sf-public-container relative"><div className="sf-reveal max-w-2xl"><p className="sf-kicker text-[var(--sf-fuchsia)]">ერთი სამუშაო დღე</p><h2 className="sf-display mt-4 text-4xl font-semibold leading-tight sm:text-5xl">ნახეთ რა ხდება ახლა. შემდეგ იმოქმედეთ.</h2><p className="mt-5 text-base leading-7 text-sidebar-foreground/68">Today გაძლევთ მოკლე სურათს; Calendar, კლიენტები და ანგარიშები კი იმავე, role-safe სამუშაო დღის შემდეგ ნაბიჯებს ხსნის.</p></div><div className="mt-10 grid gap-4 md:grid-cols-2">{featureStories.map(({ icon: Icon, title, text, label, tone }, i) => <article key={title} className={`sf-reveal sf-lift group rounded-[var(--sf-radius-surface)] border border-white/10 bg-white/[0.04] p-6 backdrop-blur-sm sf-motion-delay-${(i % 3) + 1}`}><span className={`grid size-11 place-items-center rounded-2xl text-white shadow-lg ${toneStyles[tone]}`}><Icon className="size-5" aria-hidden="true" /></span><p className="mt-6 text-xs font-bold uppercase tracking-[0.11em] text-sidebar-foreground/45">{label}</p><h3 className="mt-2 text-xl font-bold">{title}</h3><p className="mt-3 text-sm leading-6 text-sidebar-foreground/68">{text}</p></article>)}</div></div>
      </section>

      <section id="how-it-works" className="sf-public-container py-20 lg:py-28"><div className="grid gap-10 lg:grid-cols-[.8fr_1.2fr]"><div className="sf-reveal"><p className="sf-salon-eyebrow">სალონის პირველი სვლა</p><h2 className="sf-display mt-4 text-4xl font-semibold leading-tight">ჯერ ვამოწმებთ მოთხოვნას. შემდეგ იწყებთ საცდელ კვირას.</h2><p className="mt-5 text-base leading-7 text-[var(--sf-muted)]">SalonFlow-ის trial ხელით მტკიცდება, ამიტომ თქვენი workspace იქმნება ზუსტად იმ წესებით, რომლითაც შემდეგ ყოველდღიურად იმუშავებთ.</p><Button asChild variant="public" className="mt-7"><Link href="/register">რეგისტრაციის დაწყება <ArrowRight className="size-4" aria-hidden="true" /></Link></Button></div><ol className="grid gap-3">{["დარეგისტრირდით სალონის სახელით", "მიიღეთ ხელით დადასტურება", "7-დღიან trial-ში დაამატეთ ფილიალი, გუნდი და სერვისები", "გააზიარე booking link და მართეთ დღე Today/Calendar-ით"].map((step, index) => <li key={step} className={`sf-salon-panel sf-lift sf-reveal flex gap-4 p-5 sf-motion-delay-${(index % 3) + 1}`}><span className="sf-gradient-fill grid size-9 shrink-0 place-items-center rounded-xl text-sm font-bold shadow-[var(--sf-glow-brand)]">0{index + 1}</span><p className="self-center font-semibold">{step}</p></li>)}</ol></div></section>

      <section className="sf-salon-section"><div className="sf-public-container py-20"><div className="sf-reveal max-w-2xl"><p className="sf-salon-eyebrow">ვინ იყენებს</p><h2 className="sf-display mt-4 text-4xl font-semibold leading-tight">ერთი სისტემა, განსხვავებული ყოველდღიური როლებისთვის.</h2></div><div className="mt-9 grid gap-4 md:grid-cols-3"><RoleCard title="მფლობელი" text="ხედავს მთლიან სურათს, ფილიალებს, ფინანსურ ანგარიშებსა და გუნდის წესებს თავისი წვდომის ფარგლებში." delay={1} /><RoleCard title="მენეჯერი / რეცეფცია" text="მუშაობს დღესთან, კალენდართან, კლიენტებთან და იმ მოქმედებებთან, რომელთა უფლება აქვს." delay={2} /><RoleCard title="სპეციალისტი" text="იღებს სამუშაოს მის role-სა და ფილიალზე დაფუძნებული ნებადართული ხედვით." delay={3} /></div></div></section>

      <section id="faq" className="sf-public-container py-20 lg:py-28"><div className="grid gap-10 lg:grid-cols-[.75fr_1.25fr]"><div className="sf-reveal"><p className="sf-salon-eyebrow">კითხვები</p><h2 className="sf-display mt-4 text-4xl font-semibold leading-tight">გამჭვირვალე პასუხები, სანამ დაიწყებთ.</h2></div><div className="sf-salon-panel sf-reveal divide-y divide-[var(--sf-line)] px-6">{faq.map(item => <details key={item.q} className="group py-5"><summary className="flex cursor-pointer list-none items-center justify-between gap-5 font-semibold"><span>{item.q}</span><span className="grid size-7 shrink-0 place-items-center rounded-full bg-[var(--sf-surface-hover)] text-[var(--sf-salon-warm)] transition-transform group-open:rotate-90"><ChevronRight className="size-4" aria-hidden="true" /></span></summary><p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--sf-muted)]">{item.a}</p></details>)}</div></div></section>

      <section className="sf-public-container pb-20 lg:pb-28"><div className="sf-reveal sf-grain relative overflow-hidden rounded-[var(--sf-radius-hero)] px-6 py-12 text-white shadow-[var(--sf-glow-brand)] sm:px-10 sm:py-16" style={{ background: "var(--sf-gradient-brand)" }}><span className="sf-blob" style={{ width: "24rem", height: "24rem", top: "-8rem", right: "-4rem", background: "rgba(255,255,255,0.35)", opacity: 0.5, animation: "sf-blob-morph 15s ease-in-out infinite" }} aria-hidden="true" /><div className="relative max-w-2xl"><p className="text-sm font-bold uppercase tracking-[0.13em] text-white/80">თქვენი შემდეგი მშვიდი დღე</p><h2 className="sf-display mt-4 text-4xl font-semibold leading-tight sm:text-5xl">დაიწყეთ რეგისტრაციით და მოამზადეთ პირველი ფილიალი საცდელ კვირაში.</h2><p className="mt-5 text-base leading-7 text-white/85">განაცხადის ხელით დამტკიცების შემდეგ მიიღებთ 7-დღიან საცდელ წვდომას, რათა ყოველდღიური ოპერაციები ერთ ადგილზე მოაწყოთ.</p><div className="mt-8 flex flex-col gap-3 sm:flex-row"><Button asChild variant="publicSecondary" className="border-white/70 !bg-white !text-[#21072d] shadow-[0_14px_30px_-12px_rgb(21_6_37_/_0.58)] hover:!bg-white/92 hover:!text-[#21072d] hover:-translate-y-0.5 focus-visible:ring-white/75" size="lg"><Link href="/register">რეგისტრაციის დაწყება <ArrowRight className="size-4" aria-hidden="true" /></Link></Button><Button asChild variant="outline" className="border-white/40 bg-white/10 text-white hover:bg-white/20 hover:text-white" size="lg"><Link href="/salons">იპოვე სალონი</Link></Button></div></div></div></section>
    </main>
    <PublicFooter />
  </div>;
}

function TrustItem({ label, text }: { label: string; text: string }) { return <div className="flex gap-3 px-1"><span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-[color-mix(in_srgb,var(--sf-jade)_16%,transparent)]"><CheckCircle2 className="size-3.5 text-[var(--sf-jade)]" aria-hidden="true" /></span><div><p className="text-sm font-bold">{label}</p><p className="mt-0.5 text-xs leading-5 text-[var(--sf-muted)]">{text}</p></div></div>; }
function RoleCard({ title, text, delay }: { title: string; text: string; delay: number }) { return <article className={`sf-salon-panel sf-lift sf-reveal p-6 sf-motion-delay-${delay}`}><span className="sf-editorial-rule mb-4 block" aria-hidden="true" /><p className="text-lg font-bold">{title}</p><p className="mt-3 text-sm leading-6 text-[var(--sf-muted)]">{text}</p></article>; }
