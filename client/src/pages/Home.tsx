import { Button } from "@/components/ui/button";
import { PublicEyebrow, PublicFooter, PublicHeader } from "@/components/public/PublicPrimitives";
import { SalonFlowHeroScene } from "@/components/public/SalonFlowHeroScene";
import { useReveal } from "@/hooks/useReveal";
import { ArrowRight, CalendarCheck2, CheckCircle2, ChevronRight, CreditCard, LockKeyhole, Sparkles, UsersRound } from "lucide-react";
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

const faq = [
  { q: "არის თუ არა საჭირო Manus ანგარიში?", a: "არა. SalonFlow-ში გამოიყენება ადგილობრივი ელფოსტა და პაროლი. სამუშაო სივრცეში შესვლა სწორედ ამ ანგარიშით ხდება." },
  { q: "შემიძლია რამდენიმე ფილიალის მართვა?", a: "დიახ. სამუშაო სივრცე მხარდაჭერას უწევს ორგანიზაციასა და რამდენიმე ფილიალს, თითოეული ფილიალის timezone-ითა და public booking link-ით." },
  { q: "როგორ მოწმდება თავისუფალი დრო?", a: "დროის არჩევის შემდეგ ხელმისაწვდომობას სისტემა ამოწმებს, ხოლო ჩაწერის დადასტურებისას სერვერი ხელახლა აკეთებს conflict check-ს." },
  { q: "იგზავნება თუ არა ახლა SMS ან ელფოსტა?", a: "ჯერ არა. შეტყობინებების ავტომატური მიწოდება გააქტიურდება მხოლოდ verified sender domain-ისა და შესაბამისი provider-ის კონფიგურაციის შემდეგ." },
];

export default function Home() {
  const revealRef = useReveal<HTMLElement>();
  return <div className="sf-public-page"><PublicHeader />
    <main id="main-content" ref={revealRef} tabIndex={-1}>
      <section className="sf-public-container relative grid gap-12 pb-20 pt-14 lg:grid-cols-[1.03fr_.97fr] lg:items-center lg:pb-28 lg:pt-24">
        <span className="sf-blob hidden lg:block" style={{ width: "26rem", height: "26rem", top: "-6rem", left: "-8rem", background: "var(--sf-gradient-brand-soft)", animation: "sf-blob-morph 16s ease-in-out infinite" }} aria-hidden="true" />
        <div className="relative">
          <PublicEyebrow>სალონის ყოველდღიური რიტმისთვის</PublicEyebrow>
          <h1 className="sf-display mt-5 max-w-3xl text-[2.4rem] font-semibold leading-[0.98] sm:text-6xl lg:text-7xl">მეტი დრო <span className="sf-gradient-text">სტუმრებისთვის</span>. ნაკლები დრო ქაოსისთვის.</h1>
          <p className="mt-7 max-w-xl text-lg leading-8 text-[var(--sf-muted)]">SalonFlow აერთიანებს ონლაინ ჩაწერას, კალენდარს, გუნდს, კლიენტებსა და ოპერაციულ კონტროლს ერთ მშვიდ, ქართულ სამუშაო სივრცეში.</p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row"><Button asChild variant="public" size="lg"><Link href="/register">დაიწყე უფასოდ <ArrowRight className="size-4" aria-hidden="true" /></Link></Button><Button asChild variant="publicSecondary" size="lg"><a href="#how-it-works">იხილე როგორ მუშაობს</a></Button></div>
          <p className="mt-5 inline-flex items-center gap-2 text-sm text-[var(--sf-muted)]"><LockKeyhole className="size-4 text-[var(--sf-jade)]" aria-hidden="true" /> ადგილობრივი ანგარიში · role-based წვდომა · რეალურ დროზე დაცული შემოწმება</p>
        </div>
        <div className="sf-reveal"><SalonFlowHeroScene /></div>
      </section>

      <section className="border-y border-[var(--sf-line)] bg-[color-mix(in_srgb,var(--sf-surface)_82%,transparent)] backdrop-blur-sm"><div className="sf-public-container grid gap-3 py-5 sm:grid-cols-3"><TrustItem label="მრავალფილიალიანი" text="ფილიალი, timezone და public link" /><TrustItem label="ქართული-first" text="ბუნებრივი UI და ka-GE ფორმატები" /><TrustItem label="სანდო ოპერაციები" text="როლები, ისტორია და server-side checks" /></div></section>

      <section className="sf-public-container py-20 lg:py-28"><div className="sf-reveal max-w-2xl"><PublicEyebrow>პრობლემიდან რიტმამდე</PublicEyebrow><h2 className="sf-display mt-4 text-4xl font-semibold leading-tight sm:text-5xl">დღის მართვა არ უნდა იწყებოდეს ქაოსის დალაგებით.</h2></div><div className="mt-10 grid gap-4 lg:grid-cols-3">{painPoints.map((item, i) => <article key={item.title} className={`sf-surface sf-lift sf-reveal p-6 sf-motion-delay-${i + 1}`}><p className="text-lg font-bold">{item.title}</p><p className="mt-5 text-sm leading-6 text-[var(--sf-muted)]">{item.before}</p><div className="my-5 h-px bg-[var(--sf-line)]" /><p className="flex gap-2 text-sm leading-6"><CheckCircle2 className="mt-0.5 size-4 shrink-0 text-[var(--sf-jade)]" aria-hidden="true" />{item.after}</p></article>)}</div></section>

      <section id="features" className="sf-grain relative overflow-hidden bg-sidebar py-20 text-sidebar-foreground lg:py-28">
        <span className="sf-blob" style={{ width: "32rem", height: "32rem", top: "-10rem", right: "-8rem", background: "var(--sf-gradient-brand)", opacity: 0.35, animation: "sf-blob-morph 18s ease-in-out infinite" }} aria-hidden="true" />
        <span className="sf-blob" style={{ width: "26rem", height: "26rem", bottom: "-8rem", left: "-6rem", background: "linear-gradient(120deg,var(--sf-teal),var(--sf-violet))", opacity: 0.28, animation: "sf-blob-morph 22s ease-in-out infinite reverse" }} aria-hidden="true" />
        <div className="sf-public-container relative"><div className="sf-reveal max-w-2xl"><p className="sf-kicker text-[var(--sf-fuchsia)]">რეალური სამუშაო მოდულები</p><h2 className="sf-display mt-4 text-4xl font-semibold leading-tight sm:text-5xl">პროდუქტი, რომელსაც თქვენი ოპერაციები უკვე იცნობს.</h2><p className="mt-5 text-base leading-7 text-sidebar-foreground/68">ყოველი სივრცე მიბმულია მიმდინარე როლზე, ფილიალსა და იმ მონაცემზე, რომელიც რეალურად არსებობს სისტემაში.</p></div><div className="mt-10 grid gap-4 md:grid-cols-2">{featureStories.map(({ icon: Icon, title, text, label, tone }, i) => <article key={title} className={`sf-reveal sf-lift group rounded-[var(--sf-radius-surface)] border border-white/10 bg-white/[0.04] p-6 backdrop-blur-sm sf-motion-delay-${(i % 3) + 1}`}><span className={`grid size-11 place-items-center rounded-2xl text-white shadow-lg ${toneStyles[tone]}`}><Icon className="size-5" aria-hidden="true" /></span><p className="mt-6 text-xs font-bold uppercase tracking-[0.11em] text-sidebar-foreground/45">{label}</p><h3 className="mt-2 text-xl font-bold">{title}</h3><p className="mt-3 text-sm leading-6 text-sidebar-foreground/68">{text}</p></article>)}</div></div>
      </section>

      <section id="how-it-works" className="sf-public-container py-20 lg:py-28"><div className="grid gap-10 lg:grid-cols-[.8fr_1.2fr]"><div className="sf-reveal"><PublicEyebrow>როგორ მუშაობს</PublicEyebrow><h2 className="sf-display mt-4 text-4xl font-semibold leading-tight">ოთხი ნაბიჯი თქვენს მშვიდ სამუშაო დღემდე.</h2><p className="mt-5 text-base leading-7 text-[var(--sf-muted)]">თქვენ იწყებთ პატარა, მაგრამ სწორად მოწყობილი საფუძვლით; შემდეგ SalonFlow ყოველდღიურ პროცესებს ამავე წესით აერთიანებს.</p><Button asChild variant="public" className="mt-7"><Link href="/register">სამუშაო სივრცის გახსნა <ArrowRight className="size-4" aria-hidden="true" /></Link></Button></div><ol className="grid gap-3">{["შექმენი სამუშაო სივრცე", "დაამატე ფილიალი, გუნდი და სერვისები", "გააზიარე შენი booking link", "მართე დღე Today და Calendar-იდან"].map((step, index) => <li key={step} className={`sf-surface sf-lift sf-reveal flex gap-4 p-5 sf-motion-delay-${(index % 3) + 1}`}><span className="sf-gradient-fill grid size-9 shrink-0 place-items-center rounded-xl text-sm font-bold shadow-[var(--sf-glow-brand)]">0{index + 1}</span><p className="self-center font-semibold">{step}</p></li>)}</ol></div></section>

      <section className="border-y border-[var(--sf-line)] bg-[color-mix(in_srgb,var(--sf-surface)_70%,transparent)] backdrop-blur-sm"><div className="sf-public-container py-20"><div className="sf-reveal max-w-2xl"><PublicEyebrow>ვინ იყენებს</PublicEyebrow><h2 className="sf-display mt-4 text-4xl font-semibold leading-tight">ერთი სისტემა, განსხვავებული ყოველდღიური როლებისთვის.</h2></div><div className="mt-9 grid gap-4 md:grid-cols-3"><RoleCard title="მფლობელი" text="ხედავს მთლიან სურათს, ფილიალებს, ფინანსურ ანგარიშებსა და გუნდის წესებს თავისი წვდომის ფარგლებში." delay={1} /><RoleCard title="მენეჯერი / რეცეფცია" text="მუშაობს დღესთან, კალენდართან, კლიენტებთან და იმ მოქმედებებთან, რომელთა უფლება აქვს." delay={2} /><RoleCard title="სპეციალისტი" text="იღებს სამუშაოს მის role-სა და ფილიალზე დაფუძნებული ნებადართული ხედვით." delay={3} /></div></div></section>

      <section id="faq" className="sf-public-container py-20 lg:py-28"><div className="grid gap-10 lg:grid-cols-[.75fr_1.25fr]"><div className="sf-reveal"><PublicEyebrow>კითხვები</PublicEyebrow><h2 className="sf-display mt-4 text-4xl font-semibold leading-tight">გამჭვირვალე პასუხები, სანამ დაიწყებთ.</h2></div><div className="sf-reveal divide-y divide-[var(--sf-line)] rounded-[var(--sf-radius-surface)] border border-[var(--sf-line)] bg-[var(--sf-surface)] px-6 shadow-[var(--sf-shadow-sm)]">{faq.map(item => <details key={item.q} className="group py-5"><summary className="flex cursor-pointer list-none items-center justify-between gap-5 font-semibold"><span>{item.q}</span><span className="grid size-7 shrink-0 place-items-center rounded-full bg-[var(--sf-surface-hover)] text-[var(--sf-accent-strong)] transition-transform group-open:rotate-90"><ChevronRight className="size-4" aria-hidden="true" /></span></summary><p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--sf-muted)]">{item.a}</p></details>)}</div></div></section>

      <section className="sf-public-container pb-20 lg:pb-28"><div className="sf-reveal sf-grain relative overflow-hidden rounded-[var(--sf-radius-hero)] px-6 py-12 text-white shadow-[var(--sf-glow-brand)] sm:px-10 sm:py-16" style={{ background: "var(--sf-gradient-brand)" }}><span className="sf-blob" style={{ width: "24rem", height: "24rem", top: "-8rem", right: "-4rem", background: "rgba(255,255,255,0.35)", opacity: 0.5, animation: "sf-blob-morph 15s ease-in-out infinite" }} aria-hidden="true" /><div className="relative max-w-2xl"><p className="text-sm font-bold uppercase tracking-[0.13em] text-white/80">თქვენი შემდეგი მშვიდი დღე</p><h2 className="sf-display mt-4 text-4xl font-semibold leading-tight sm:text-5xl">გახსენით სამუშაო სივრცე და მოაწესრიგეთ პირველი ფილიალი დღესვე.</h2><p className="mt-5 text-base leading-7 text-white/85">დაიწყეთ არსებული უსაფრთხო local account-ით და გადაიყვანეთ ყოველდღიური ოპერაციები ერთ ადგილას.</p><div className="mt-8 flex flex-col gap-3 sm:flex-row"><Button asChild variant="publicSecondary" className="border-white/70 !bg-white !text-[#21072d] shadow-[0_14px_30px_-12px_rgb(21_6_37_/_0.58)] hover:!bg-white/92 hover:!text-[#21072d] hover:-translate-y-0.5 focus-visible:ring-white/75" size="lg"><Link href="/register">დაიწყე უფასოდ <ArrowRight className="size-4" aria-hidden="true" /></Link></Button><Button asChild variant="outline" className="border-white/40 bg-white/10 text-white hover:bg-white/20 hover:text-white" size="lg"><Link href="/book">იხილე ონლაინ ჩაწერა</Link></Button></div></div></div></section>
    </main>
    <PublicFooter />
  </div>;
}

function TrustItem({ label, text }: { label: string; text: string }) { return <div className="flex gap-3 px-1"><span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-[color-mix(in_srgb,var(--sf-jade)_16%,transparent)]"><CheckCircle2 className="size-3.5 text-[var(--sf-jade)]" aria-hidden="true" /></span><div><p className="text-sm font-bold">{label}</p><p className="mt-0.5 text-xs leading-5 text-[var(--sf-muted)]">{text}</p></div></div>; }
function RoleCard({ title, text, delay }: { title: string; text: string; delay: number }) { return <article className={`sf-surface sf-lift sf-reveal p-6 sf-motion-delay-${delay}`}><span className="sf-editorial-rule mb-4 block" aria-hidden="true" /><p className="text-lg font-bold">{title}</p><p className="mt-3 text-sm leading-6 text-[var(--sf-muted)]">{text}</p></article>; }
