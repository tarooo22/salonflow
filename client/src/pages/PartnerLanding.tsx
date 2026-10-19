import { CatalogFooter, CatalogHeader } from "@/components/catalog/CatalogChrome";
import "@/components/catalog/marketing.css";
import { usePublicMeta } from "@/components/public/PublicMeta";
import { cssVars } from "@/components/catalog/Tickets";
import { VERTICALS } from "@/lib/verticals";
import { BRAND } from "@shared/brand";
import { ArrowRight, CalendarCheck, CalendarDays, Check, ChevronRight, Globe, LayoutDashboard, UsersRound, Wallet } from "lucide-react";
import { Link } from "wouter";

const FACEBOOK_URL = "https://www.facebook.com/profile.php?id=61576174343901";

const START_STEPS = [
  { title: "რეგისტრაცია", text: "ქმნით ანგარიშს ელფოსტით და პაროლით, შემდეგ აგზავნით სალონის ან ბიზნესის სახელს და კოდს." },
  { title: "ხელით განხილვა", text: "განაცხადს ხელით ვამოწმებთ. საცდელი წვდომა ავტომატურად არ აქტიურდება." },
  { title: "7-დღიანი საცდელი წვდომა", text: "დამტკიცების შემდეგ ამატებთ ფილიალს, გუნდს და სერვისებს და აზიარებთ ჯავშნის ბმულს." },
];

const FEATURES = [
  { icon: CalendarCheck, title: "ონლაინ ჯავშნები", text: "კლიენტი თავად ირჩევს სერვისს, სპეციალისტს და თავისუფალ დროს — ზარების გარეშე." },
  { icon: LayoutDashboard, title: "დღე ერთი ეკრანიდან", text: "Today და კალენდარი აერთიანებს ჩაწერებს, სტატუსებს, სპეციალისტებსა და შემდეგ მოქმედებას." },
  { icon: UsersRound, title: "კლიენტები და გუნდი", text: "კლიენტების ბაზა ისტორიით, თანამშრომლების გრაფიკები, სამუშაო საათები და როლები." },
  { icon: Wallet, title: "გადახდები და ანგარიშები", text: "POS გადახდები, შემოსავლები, ხარჯები და საკომისიოები ერთ ადგილას — თქვენი ორგანიზაციის ფარგლებში." },
  { icon: Globe, title: "საკუთარი საჯარო გვერდი", text: "პროფილი ფასებით, გუნდით და სამუშაო საათებით, ჯავშნის ბმულით. კატალოგში ჩანხართ პროფილის დამტკიცების შემდეგ." },
  { icon: CalendarDays, title: "რამდენიმე ფილიალი", text: "სამუშაო სივრცე ორგანიზაციას და რამდენიმე ფილიალს აერთიანებს — თითოეულს თავისი დროის სარტყლით და საჯარო ბმულით." },
];

const PAIN_POINTS = [
  { title: "ჩაწერები", before: "დაკარგული ზარები და ხელით გადამოწმებული დრო", after: "ონლაინ მოთხოვნა და სერვერზე გადამოწმებული ხელმისაწვდომობა" },
  { title: "გუნდი", before: "ცალკე გრაფიკები, გამონაკლისები და გაუგებარი პასუხისმგებლობა", after: "ფილიალზე მიბმული სპეციალისტები, საათები და ერთიანი კალენდარი" },
  { title: "კონტროლი", before: "დღის სურათის მოსაძებნად რამდენიმე ფაილი და ჩათი", after: "ოპერაციები, გადახდები და ანგარიშები ერთ სამუშაო სივრცეში" },
];

const JOURNEY = [
  { title: "კლიენტი ირჩევს სერვისს", text: "საჯარო ჯავშნის გვერდზე ჩანს მხოლოდ აქტიური სერვისები და მათი რეალური ხანგრძლივობა და ფასი." },
  { title: "სისტემა ამოწმებს დროს", text: "სპეციალისტი და თავისუფალი დრო მოწმდება არჩეული სერვისისა და მიმდინარე განრიგის მიხედვით. დადასტურებისას სერვერი ხელახლა ამოწმებს კონფლიქტს." },
  { title: "თქვენ მართავთ დღეს", text: "Today და კალენდარი აჩვენებს მოთხოვნას, სტატუსს და შემდეგ ოპერაციულ მოქმედებას." },
];

const ROLES = [
  { title: "მფლობელი", text: "ხედავს მთლიან სურათს, ფილიალებს, ფინანსურ ანგარიშებსა და გუნდის წესებს თავისი წვდომის ფარგლებში." },
  { title: "მენეჯერი / რეცეფცია", text: "მუშაობს დღესთან, კალენდართან, კლიენტებთან და იმ მოქმედებებთან, რომელთა უფლება აქვს." },
  { title: "სპეციალისტი", text: "იღებს სამუშაოს მისი როლისა და ფილიალის მიხედვით ნებადართული ხედვით." },
];

const FAQ = [
  { q: `მჭირდება თუ არა სპეციალური ტექნიკური ცოდნა ${BRAND.name}-ის გამოსაყენებლად?`, a: `არა. ${BRAND.name} შექმნილია ყოველდღიური პროცესებისთვის: იმუშავებთ ქართულ, ნაბიჯ-ნაბიჯ ინტერფეისში. სამუშაო სივრცეში შესასვლელად საჭიროა მხოლოდ ადგილობრივი ელფოსტა და პაროლი.` },
  { q: "რომელ სფეროებს ემსახურება პლატფორმა?", a: "სალონებს და ესთეტიკის ცენტრებს. სტომატოლოგიური კლინიკები მალე დაემატება — კატალოგშიც და მართვის პროგრამაშიც." },
  { q: "შემიძლია რამდენიმე ფილიალის მართვა?", a: "დიახ. სამუშაო სივრცე მხარდაჭერას უწევს ორგანიზაციასა და რამდენიმე ფილიალს, თითოეული ფილიალის დროის სარტყლითა და საჯარო ჯავშნის ბმულით." },
  { q: "როგორ მოწმდება თავისუფალი დრო?", a: "დროის არჩევის შემდეგ ხელმისაწვდომობას სისტემა ამოწმებს, ხოლო ჩაწერის დადასტურებისას სერვერი ხელახლა აკეთებს კონფლიქტის შემოწმებას." },
  { q: "იგზავნება თუ არა ახლა SMS ან ელფოსტა?", a: "ჯერ არა. შეტყობინებების ავტომატური მიწოდება გააქტიურდება მხოლოდ verified sender domain-ისა და შესაბამისი პროვაიდერის კონფიგურაციის შემდეგ." },
];

function Hero() {
  return <section className="cw-desk pb-14 pt-6 sm:pb-20 sm:pt-10" aria-label="მართვის პროგრამა">
    <div className="cw-container">
      <div className="cw-card">
        <div className="cw-card-band" />
        <div className="cw-card-inner">
          <div className="cw-card-head"><span className="cw-caption">ბიზნესისთვის</span><span className="cw-num text-xs">{BRAND.domain}</span></div>
          <div className="mt-6 grid gap-8 lg:grid-cols-[1.15fr_1fr] lg:items-center">
            <div>
              <h1 className="cw-display text-[clamp(1.9rem,4.6vw,3.6rem)]">მართვის პროგრამა სალონისთვის, ესთეტიკის ცენტრისთვის და სტომატოლოგიური კლინიკისთვის.</h1>
              <p className="cw-lede mt-4">ჩაწერები, გუნდი, კლიენტები და გადახდები ერთ ქართულ სამუშაო სივრცეში. დამტკიცების შემდეგ თქვენი პროფილი ჩანს კატალოგში, ხოლო კლიენტები ონლაინ ჯავშნიან.</p>
              <ul className="mt-5 flex flex-wrap gap-2">{VERTICALS.map(item => <li key={item.id} className="rounded-[3px] px-3 py-1 text-sm font-extrabold" style={{ background: item.bg, color: item.ink }}>{item.label}{item.id === "dental" ? " · მალე" : ""}</li>)}</ul>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link href="/register" className="cw-btn cw-btn-stamp">რეგისტრაცია <ArrowRight className="size-5" aria-hidden="true" /></Link>
                <Link href="/contact" className="cw-btn cw-btn-line text-[var(--cw-ink)]">კონტაქტი</Link>
              </div>
            </div>
            <div>
              <p className="cw-caption">როგორ იწყებთ</p>
              <ol className="cw-ledger mt-2">
                {START_STEPS.map((step, index) => <li key={step.title} className="cw-row flex items-start gap-4">
                  <span className="cw-num grid size-9 shrink-0 place-items-center rounded-[3px] border-[1.5px] border-[var(--cw-ink)] text-sm font-semibold">{index + 1}</span>
                  <span><span className="block text-lg font-extrabold [font-stretch:85%]">{step.title}</span><span className="mt-1 block text-sm font-normal leading-6 text-[var(--cw-ink-soft)]">{step.text}</span></span>
                </li>)}
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>;
}

function Verticals() {
  return <section className="cw-section" aria-labelledby="partner-verticals-title">
    <div className="cw-container">
      <h2 id="partner-verticals-title" className="cw-h2 max-w-3xl">ერთი კატალოგი სამი სფეროსთვის.</h2>
      <p className="cw-lede mt-3">კლიენტი ერთ ადგილას პოულობს სალონს, ესთეტიკის ცენტრს და მალე სტომატოლოგსაც. თქვენი ადგილი კატალოგში ჩნდება მხოლოდ მარკეტფლეისის პროფილის დამტკიცების შემდეგ.</p>
      <div className="mt-8 grid gap-5 lg:grid-cols-3">
        {VERTICALS.map(item => item.id === "dental"
          ? <div key={item.id} className="cw-dashed flex flex-col gap-3 p-6">
            <p className="flex items-center gap-3 text-xl font-extrabold [font-stretch:85%]">{item.label}<span className="cw-stamp-mark">მალე</span></p>
            <p className="text-[var(--cw-ink-soft)]">სტომატოლოგიური კლინიკები მალე დაემატება — კატალოგშიც და მართვის პროგრამაშიც.</p>
          </div>
          : <div key={item.id} className="cw-ledger" style={cssVars({ "--ledger-bg": item.bg, "--ledger-ink": item.ink })}>
            <div className="cw-ledger-head"><span className="text-lg font-extrabold [font-stretch:85%]">{item.label}</span></div>
            <p className="cw-row leading-6">{item.id === "beauty" ? "სალონები: ონლაინ ჯავშნები, გუნდი, კლიენტები და გადახდები ერთ სივრცეში." : "ესთეტიკის და კოსმეტოლოგიის ცენტრები: იგივე სამუშაო სივრცე, ჯავშნიდან ანგარიშებამდე."}</p>
          </div>)}
      </div>
    </div>
  </section>;
}

function Features() {
  return <section className="cw-section cw-rule-top" aria-labelledby="partner-features-title">
    <div className="cw-container">
      <h2 id="partner-features-title" className="cw-h2 max-w-3xl">ერთი სამუშაო დღე — ერთ სივრცეში.</h2>
      <p className="cw-lede mt-3">მხოლოდ ის, რაც უკვე მუშაობს პროდუქტში.</p>
      <ul className="cw-ledger cw-ledger-neutral mt-8 grid md:grid-cols-2">
        {FEATURES.map((item, index) => <li key={item.title} className={`flex gap-4 p-5 ${index > 1 ? "border-t border-[var(--cw-rule)]" : index === 1 ? "border-t border-[var(--cw-rule)] md:border-t-0" : ""} ${index % 2 === 1 ? "md:border-l md:border-[var(--cw-rule)]" : ""}`}>
          <item.icon className="mt-1 size-6 shrink-0" aria-hidden="true" />
          <div><h3 className="text-lg font-extrabold [font-stretch:85%]">{item.title}</h3><p className="mt-1 leading-6 text-[var(--cw-ink-soft)]">{item.text}</p></div>
        </li>)}
      </ul>
    </div>
  </section>;
}

function Pains() {
  return <section className="cw-section cw-rule-top" aria-labelledby="partner-pains-title">
    <div className="cw-container">
      <h2 id="partner-pains-title" className="cw-h2 max-w-3xl">დღის მართვა არ უნდა იწყებოდეს ქაოსის დალაგებით.</h2>
      <ul className="cw-ledger cw-ledger-neutral mt-8">
        {PAIN_POINTS.map(item => <li key={item.title} className="cw-row grid items-start gap-2 md:grid-cols-[9rem_1fr_1fr] md:gap-6">
          <span className="text-lg font-extrabold [font-stretch:85%]">{item.title}</span>
          <span className="font-normal leading-6 text-[var(--cw-ink-soft)]"><span className="cw-caption block">ახლა</span>{item.before}</span>
          <span className="flex gap-2 font-normal leading-6"><Check className="mt-1 size-4 shrink-0" aria-hidden="true" /><span><span className="cw-caption block">{BRAND.name}-ით</span>{item.after}</span></span>
        </li>)}
      </ul>
    </div>
  </section>;
}

function Journey() {
  return <section className="cw-section cw-rule-top" aria-labelledby="partner-journey-title">
    <div className="cw-container grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
      <div>
        <h2 id="partner-journey-title" className="cw-h2">კლიენტის ჩაწერა თქვენამდე სამ ნაბიჯში.</h2>
        <p className="cw-lede mt-4">არ ვაჩვენებთ გამოგონილ თავისუფალ დროს: სერვისი, სპეციალისტი და დრო საბოლოოდ მოწმდება მოქმედი განრიგის მიხედვით.</p>
      </div>
      <ol className="cw-ledger">
        {JOURNEY.map((step, index) => <li key={step.title} className="cw-row flex items-start gap-4">
          <span className="cw-num grid size-9 shrink-0 place-items-center rounded-[3px] border-[1.5px] border-[var(--cw-ink)] text-sm font-semibold">{index + 1}</span>
          <span><span className="block text-lg font-extrabold [font-stretch:85%]">{step.title}</span><span className="mt-1 block font-normal leading-6 text-[var(--cw-ink-soft)]">{step.text}</span></span>
        </li>)}
      </ol>
    </div>
  </section>;
}

function Roles() {
  return <section className="cw-section cw-rule-top" aria-labelledby="partner-roles-title">
    <div className="cw-container">
      <h2 id="partner-roles-title" className="cw-h2 max-w-3xl">ერთი სისტემა, განსხვავებული როლებისთვის.</h2>
      <div className="mt-8 grid gap-5 md:grid-cols-3">
        {ROLES.map(role => <div key={role.title} className="cw-ledger cw-ledger-neutral">
          <div className="cw-ledger-head"><span className="text-lg font-extrabold [font-stretch:85%]">{role.title}</span></div>
          <p className="cw-row leading-6">{role.text}</p>
        </div>)}
      </div>
    </div>
  </section>;
}

function Faq() {
  return <section className="cw-section cw-rule-top" aria-labelledby="partner-faq-title">
    <div className="cw-container grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
      <h2 id="partner-faq-title" className="cw-h2">გამჭვირვალე პასუხები, სანამ დაიწყებთ.</h2>
      <div className="cw-ledger cw-faq">
        {FAQ.map(item => <details key={item.q} className="cw-row py-0">
          <summary className="flex min-h-14 items-center justify-between gap-4 py-3 font-extrabold [font-stretch:90%]"><span>{item.q}</span><ChevronRight className="size-4 shrink-0" aria-hidden="true" /></summary>
          <p className="pb-4 font-normal leading-7 text-[var(--cw-ink-soft)]">{item.a}</p>
        </details>)}
      </div>
    </div>
  </section>;
}

function StartCta() {
  return <section className="cw-desk py-14 sm:py-20" aria-labelledby="partner-start-title">
    <div className="cw-container">
      <div className="cw-card">
        <div className="cw-card-band" />
        <div className="cw-card-inner">
          <p className="cw-caption">გადახედეთ სანამ დაიწყებთ</p>
          <h2 id="partner-start-title" className="cw-h2 mt-3 max-w-3xl">დარეგისტრირდით და მოითხოვეთ 7-დღიანი საცდელი წვდომა.</h2>
          <p className="cw-lede mt-4">საცდელი წვდომა ავტომატურად არ აქტიურდება. მოთხოვნის შემდეგ {BRAND.name} ხელით ამოწმებს განაცხადს და დამტკიცებულ ბიზნესს რთავს საცდელ წვდომას.</p>
          <div className="mt-7 flex flex-wrap items-center gap-4">
            <Link href="/register" className="cw-btn cw-btn-stamp">რეგისტრაცია <ArrowRight className="size-5" aria-hidden="true" /></Link>
            <Link href="/contact" className="cw-btn cw-btn-line text-[var(--cw-ink)]">კონტაქტი</Link>
            <a href={FACEBOOK_URL} target="_blank" rel="noreferrer" className="cw-link text-sm">კითხვა გაქვთ? მოგვწერეთ Facebook-ზე</a>
          </div>
        </div>
      </div>
    </div>
  </section>;
}

export default function PartnerLanding() {
  usePublicMeta({ title: `ბიზნესისთვის — მართვის პროგრამა | ${BRAND.name}`, description: "დაარეგისტრირეთ სალონი ან ესთეტიკის ცენტრი, გაიარეთ ხელით განხილვა და დამტკიცების შემდეგ მოამზადეთ სამუშაო სივრცე 7-დღიან საცდელ წვდომაში. სტომატოლოგიური კლინიკები მალე.", canonicalPath: "/partner" });
  return <div className="cw min-h-screen">
    <CatalogHeader />
    <main id="main-content" tabIndex={-1}>
      <Hero />
      <Verticals />
      <Features />
      <Pains />
      <Journey />
      <Roles />
      <Faq />
      <StartCta />
    </main>
    <CatalogFooter />
  </div>;
}
