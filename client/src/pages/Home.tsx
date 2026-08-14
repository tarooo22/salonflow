import { Button } from "@/components/ui/button";
import { PublicEyebrow, PublicFooter, PublicHeader } from "@/components/public/PublicPrimitives";
import { ArrowRight, CalendarCheck2, CheckCircle2, ChevronRight, Clock3, CreditCard, LockKeyhole, Sparkles, UsersRound } from "lucide-react";
import { Link } from "wouter";

const featureStories = [
  { icon: CalendarCheck2, title: "დღე ერთი ეკრანიდან", text: "Today queue და კალენდარი აერთიანებს ჩაწერებს, სტატუსებს, სპეციალისტებსა და შემდეგ მოქმედებას.", label: "Today + Calendar", tone: "jade" },
  { icon: Sparkles, title: "ონლაინ ჩაწერა თქვენი წესებით", text: "სერვისი, სპეციალისტი ან თავისუფალი არჩევანი, დრო და დაცული დადასტურება — ერთი მკაფიო გზით.", label: "Public booking", tone: "terracotta" },
  { icon: UsersRound, title: "კლიენტები და გუნდი კონტექსტით", text: "გრაფიკები, სამუშაო საათები, კლიენტის ისტორია და შეთანხმებები საჭირო ადგილზე რჩება.", label: "CRM + Team", tone: "violet" },
  { icon: CreditCard, title: "კონტროლი რეალური მონაცემით", text: "შემოსავალი, ხარჯები, საკომისიოები და გადახდის სტატუსები იკითხება ორგანიზაციის scope-ის დაცვით.", label: "Reports + Finance", tone: "amber" },
];

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

function ProductPreview() {
  return <div className="relative mx-auto max-w-xl lg:ml-auto">
    <div className="absolute inset-0 rounded-[2rem] bg-[color-mix(in_srgb,var(--sf-terracotta)_12%,transparent)] blur-2xl" aria-hidden="true" />
    <div className="relative overflow-hidden rounded-[1.75rem] border border-white/10 bg-[var(--sf-ink)] p-3 shadow-[0_26px_60px_rgb(27_41_35_/_0.24)] sm:p-5">
      <div className="rounded-[1.2rem] bg-[var(--sf-surface)] p-4 text-[var(--sf-ink)] sm:p-5">
        <div className="flex items-center justify-between gap-3"><div><p className="text-xs font-semibold text-[var(--sf-muted)]">დღის ხედვა</p><p className="mt-1 text-lg font-bold">დღეს · მშვიდი კონტროლი</p></div><span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--sf-jade-soft)] px-3 py-1.5 text-xs font-semibold text-[var(--sf-jade)]"><CheckCircle2 className="size-3.5" aria-hidden="true" /> ორგანიზებულია</span></div>
        <div className="mt-5 grid grid-cols-3 gap-2"><PreviewMetric label="ჩაწერები" value="დღის queue" /><PreviewMetric label="შემდეგი" value="16:30" /><PreviewMetric label="ფილიალი" value="აქტიური" /></div>
        <div className="mt-4 rounded-xl border border-[var(--sf-line)] bg-[var(--sf-canvas)] p-3"><div className="flex items-center justify-between gap-3"><div className="flex items-center gap-2"><span className="grid size-8 place-items-center rounded-lg bg-[color-mix(in_srgb,var(--sf-terracotta)_13%,transparent)] text-[var(--sf-terracotta)]"><Clock3 className="size-4" aria-hidden="true" /></span><div><p className="text-sm font-semibold">კალენდარში შემდეგი დრო</p><p className="mt-0.5 text-xs text-[var(--sf-muted)]">სპეციალისტი, სერვისი და სტატუსი ერთ block-ში</p></div></div><ChevronRight className="size-4 text-[var(--sf-muted)]" aria-hidden="true" /></div></div>
      </div>
      <div className="mt-3 grid gap-2 sm:grid-cols-2"><div className="rounded-xl border border-white/10 bg-white/6 p-3 text-white"><p className="text-xs text-white/60">ონლაინ ჩაწერა</p><p className="mt-1 text-sm font-semibold">სერვისი → დრო → დადასტურება</p></div><div className="rounded-xl border border-white/10 bg-white/6 p-3 text-white"><p className="text-xs text-white/60">დაცული მართვა</p><p className="mt-1 text-sm font-semibold">როლები, დრო და სტატუსი ერთ ადგილზე</p></div></div>
    </div>
  </div>;
}

function PreviewMetric({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl border border-[var(--sf-line)] bg-[var(--sf-surface)] p-3"><p className="text-[0.68rem] font-semibold uppercase tracking-[0.08em] text-[var(--sf-muted)]">{label}</p><p className="mt-1 text-sm font-bold">{value}</p></div>;
}

export default function Home() {
  return <div className="sf-public-page">
    <PublicHeader />
    <main>
      <section className="sf-public-container grid gap-12 pb-20 pt-14 lg:grid-cols-[1.03fr_.97fr] lg:items-center lg:pb-28 lg:pt-24">
        <div><PublicEyebrow>სალონის ყოველდღიური რიტმისთვის</PublicEyebrow><h1 className="sf-display mt-5 max-w-3xl text-5xl font-semibold leading-[0.98] sm:text-6xl lg:text-7xl">მეტი დრო სტუმრებისთვის. ნაკლები დრო ქაოსისთვის.</h1><p className="mt-7 max-w-xl text-lg leading-8 text-[var(--sf-muted)]">SalonFlow აერთიანებს ონლაინ ჩაწერას, კალენდარს, გუნდს, კლიენტებსა და ოპერაციულ კონტროლს ერთ მშვიდ, ქართულ სამუშაო სივრცეში.</p><div className="mt-9 flex flex-col gap-3 sm:flex-row"><Button asChild variant="public" size="lg"><Link href="/register">დაიწყე უფასოდ <ArrowRight className="size-4" aria-hidden="true" /></Link></Button><Button asChild variant="publicSecondary" size="lg"><a href="#how-it-works">იხილე როგორ მუშაობს</a></Button></div><p className="mt-5 inline-flex items-center gap-2 text-sm text-[var(--sf-muted)]"><LockKeyhole className="size-4 text-[var(--sf-jade)]" aria-hidden="true" /> ადგილობრივი ანგარიში · role-based წვდომა · რეალურ დროზე დაცული შემოწმება</p></div>
        <ProductPreview />
      </section>

      <section className="border-y border-[var(--sf-line)] bg-[color-mix(in_srgb,var(--sf-surface)_76%,transparent)]"><div className="sf-public-container grid gap-3 py-5 sm:grid-cols-3"><TrustItem label="მრავალფილიალიანი" text="ფილიალი, timezone და public link" /><TrustItem label="ქართული-first" text="ბუნებრივი UI და ka-GE ფორმატები" /><TrustItem label="სანდო ოპერაციები" text="როლები, ისტორია და server-side checks" /></div></section>

      <section className="sf-public-container py-20 lg:py-28"><div className="max-w-2xl"><PublicEyebrow>პრობლემიდან რიტმამდე</PublicEyebrow><h2 className="sf-display mt-4 text-4xl font-semibold leading-tight sm:text-5xl">დღის მართვა არ უნდა იწყებოდეს ქაოსის დალაგებით.</h2></div><div className="mt-10 grid gap-4 lg:grid-cols-3">{painPoints.map(item => <article key={item.title} className="sf-surface p-6"><p className="text-lg font-bold">{item.title}</p><p className="mt-5 text-sm leading-6 text-[var(--sf-muted)]">{item.before}</p><div className="my-5 h-px bg-[var(--sf-line)]" /><p className="flex gap-2 text-sm leading-6"><CheckCircle2 className="mt-0.5 size-4 shrink-0 text-[var(--sf-jade)]" aria-hidden="true" />{item.after}</p></article>)}</div></section>

      <section id="features" className="bg-[var(--sf-ink)] py-20 text-[var(--sf-surface)] lg:py-28"><div className="sf-public-container"><div className="max-w-2xl"><p className="sf-kicker text-[color-mix(in_srgb,var(--sf-terracotta)_80%,white)]">რეალური სამუშაო მოდულები</p><h2 className="sf-display mt-4 text-4xl font-semibold leading-tight sm:text-5xl">პროდუქტი, რომელსაც თქვენი ოპერაციები უკვე იცნობს.</h2><p className="mt-5 text-base leading-7 text-white/68">ყოველი სივრცე მიბმულია მიმდინარე როლზე, ფილიალსა და იმ მონაცემზე, რომელიც რეალურად არსებობს სისტემაში.</p></div><div className="mt-10 grid gap-4 md:grid-cols-2">{featureStories.map(({ icon: Icon, title, text, label, tone }) => <article key={title} className="rounded-[var(--sf-radius-surface)] border border-white/10 bg-white/5 p-6"><span className={`grid size-10 place-items-center rounded-xl ${tone === "jade" ? "bg-[var(--sf-jade-soft)] text-[var(--sf-jade)]" : tone === "terracotta" ? "bg-[color-mix(in_srgb,var(--sf-terracotta)_18%,transparent)] text-[color-mix(in_srgb,var(--sf-terracotta)_72%,white)]" : tone === "violet" ? "bg-[color-mix(in_srgb,var(--sf-violet)_18%,transparent)] text-[color-mix(in_srgb,var(--sf-violet)_60%,white)]" : "bg-[color-mix(in_srgb,var(--sf-amber)_18%,transparent)] text-[color-mix(in_srgb,var(--sf-amber)_72%,white)]"}`}><Icon className="size-5" aria-hidden="true" /></span><p className="mt-6 text-xs font-bold uppercase tracking-[0.11em] text-white/45">{label}</p><h3 className="mt-2 text-xl font-bold">{title}</h3><p className="mt-3 text-sm leading-6 text-white/68">{text}</p></article>)}</div></div></section>

      <section id="how-it-works" className="sf-public-container py-20 lg:py-28"><div className="grid gap-10 lg:grid-cols-[.8fr_1.2fr]"><div><PublicEyebrow>როგორ მუშაობს</PublicEyebrow><h2 className="sf-display mt-4 text-4xl font-semibold leading-tight">ოთხი ნაბიჯი თქვენს მშვიდ სამუშაო დღემდე.</h2><p className="mt-5 text-base leading-7 text-[var(--sf-muted)]">თქვენ იწყებთ პატარა, მაგრამ სწორად მოწყობილი საფუძვლით; შემდეგ SalonFlow ყოველდღიურ პროცესებს ამავე წესით აერთიანებს.</p><Button asChild variant="public" className="mt-7"><Link href="/register">სამუშაო სივრცის გახსნა <ArrowRight className="size-4" aria-hidden="true" /></Link></Button></div><ol className="grid gap-3">{["შექმენი სამუშაო სივრცე", "დაამატე ფილიალი, გუნდი და სერვისები", "გააზიარე შენი booking link", "მართე დღე Today და Calendar-იდან"].map((step, index) => <li key={step} className="sf-surface flex gap-4 p-5"><span className="grid size-9 shrink-0 place-items-center rounded-xl bg-[color-mix(in_srgb,var(--sf-terracotta)_12%,transparent)] text-sm font-bold text-[var(--sf-terracotta)]">0{index + 1}</span><p className="self-center font-semibold">{step}</p></li>)}</ol></div></section>

      <section className="border-y border-[var(--sf-line)] bg-[var(--sf-surface)]"><div className="sf-public-container py-20"><div className="max-w-2xl"><PublicEyebrow>ვინ იყენებს</PublicEyebrow><h2 className="sf-display mt-4 text-4xl font-semibold leading-tight">ერთი სისტემა, განსხვავებული ყოველდღიური როლებისთვის.</h2></div><div className="mt-9 grid gap-4 md:grid-cols-3"><RoleCard title="მფლობელი" text="ხედავს მთლიან სურათს, ფილიალებს, ფინანსურ ანგარიშებსა და გუნდის წესებს თავისი წვდომის ფარგლებში." /><RoleCard title="მენეჯერი / რეცეფცია" text="მუშაობს დღესთან, კალენდართან, კლიენტებთან და იმ მოქმედებებთან, რომელთა უფლება აქვს." /><RoleCard title="სპეციალისტი" text="იღებს სამუშაოს მის role-სა და ფილიალზე დაფუძნებული ნებადართული ხედვით." /></div></div></section>

      <section id="faq" className="sf-public-container py-20 lg:py-28"><div className="grid gap-10 lg:grid-cols-[.75fr_1.25fr]"><div><PublicEyebrow>კითხვები</PublicEyebrow><h2 className="sf-display mt-4 text-4xl font-semibold leading-tight">გამჭვირვალე პასუხები, სანამ დაიწყებთ.</h2></div><div className="divide-y divide-[var(--sf-line)] rounded-[var(--sf-radius-surface)] border border-[var(--sf-line)] bg-[var(--sf-surface)] px-6">{faq.map(item => <details key={item.q} className="group py-5"><summary className="flex cursor-pointer list-none items-center justify-between gap-5 font-semibold"><span>{item.q}</span><ChevronRight className="size-4 shrink-0 transition-transform group-open:rotate-90" aria-hidden="true" /></summary><p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--sf-muted)]">{item.a}</p></details>)}</div></div></section>

      <section className="sf-public-container pb-20 lg:pb-28"><div className="overflow-hidden rounded-[var(--sf-radius-hero)] bg-[var(--sf-terracotta)] px-6 py-10 text-white sm:px-10 sm:py-14"><div className="max-w-2xl"><p className="text-sm font-bold uppercase tracking-[0.13em] text-white/70">თქვენი შემდეგი მშვიდი დღე</p><h2 className="sf-display mt-4 text-4xl font-semibold leading-tight sm:text-5xl">გახსენით სამუშაო სივრცე და მოაწესრიგეთ პირველი ფილიალი დღესვე.</h2><p className="mt-5 text-base leading-7 text-white/82">დაიწყეთ არსებული უსაფრთხო local account-ით და გადაიყვანეთ ყოველდღიური ოპერაციები ერთ ადგილას.</p><div className="mt-8 flex flex-col gap-3 sm:flex-row"><Button asChild className="bg-white text-[var(--sf-terracotta-strong)] hover:bg-white/90" size="lg"><Link href="/register">დაიწყე უფასოდ <ArrowRight className="size-4" aria-hidden="true" /></Link></Button><Button asChild variant="outline" className="border-white/35 text-white hover:bg-white/12 hover:text-white" size="lg"><Link href="/book">იხილე ონლაინ ჩაწერა</Link></Button></div></div></div></section>
    </main>
    <PublicFooter />
  </div>;
}

function TrustItem({ label, text }: { label: string; text: string }) { return <div className="flex gap-3 px-1"><CheckCircle2 className="mt-0.5 size-4 shrink-0 text-[var(--sf-jade)]" aria-hidden="true" /><div><p className="text-sm font-bold">{label}</p><p className="mt-0.5 text-xs leading-5 text-[var(--sf-muted)]">{text}</p></div></div>; }
function RoleCard({ title, text }: { title: string; text: string }) { return <article className="sf-surface p-6"><p className="text-lg font-bold">{title}</p><p className="mt-3 text-sm leading-6 text-[var(--sf-muted)]">{text}</p></article>; }
