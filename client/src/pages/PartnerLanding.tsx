import { CatalogFooter, CatalogHeader } from "@/components/catalog/CatalogChrome";
import "@/components/catalog/marketing.css";
import { usePublicMeta } from "@/components/public/PublicMeta";
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
  return <section className="mkt-hero" aria-label="მართვის პროგრამა">
    <div className="mkt-container">
      <div className="mkt-card">
        <div>
          <div className="mkt-head-row"><span className="mkt-caption">ბიზნესისთვის</span><span className="tabular-nums text-xs">{BRAND.domain}</span></div>
          <div className="mt-6 grid gap-8 lg:grid-cols-[1.15fr_1fr] lg:items-center">
            <div>
              <h1 className="mkt-h1">მართვის პროგრამა სალონისთვის, ესთეტიკის ცენტრისთვის და სტომატოლოგიური კლინიკისთვის.</h1>
              <p className="mkt-lede mt-4">ჩაწერები, გუნდი, კლიენტები და გადახდები ერთ ქართულ სამუშაო სივრცეში. დამტკიცების შემდეგ თქვენი პროფილი ჩანს კატალოგში, ხოლო კლიენტები ონლაინ ჯავშნიან.</p>
              <ul className="mt-5 flex flex-wrap gap-2">{VERTICALS.map(item => <li key={item.id} className="mkt-vtag" data-vertical={item.id}>{item.label}{item.id === "dental" ? " · მალე" : ""}</li>)}</ul>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link href="/register" className="mkt-btn mkt-btn-primary">რეგისტრაცია <ArrowRight className="size-5" aria-hidden="true" /></Link>
                <Link href="/contact" className="mkt-btn mkt-btn-secondary">კონტაქტი</Link>
              </div>
            </div>
            <div>
              <p className="mkt-caption">როგორ იწყებთ</p>
              <ol className="mkt-steps mt-2">
                {START_STEPS.map((step, index) => <li key={step.title} className="mkt-step-item">
                  <span className="mkt-step">{index + 1}</span>
                  <span><span className="block mkt-h3">{step.title}</span><span className="mt-1 block text-sm font-normal leading-6 mkt-muted">{step.text}</span></span>
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
  return <section className="mkt-section" aria-labelledby="partner-verticals-title">
    <div className="mkt-container">
      <h2 id="partner-verticals-title" className="mkt-h2 max-w-3xl">ერთი კატალოგი სამი სფეროსთვის.</h2>
      <p className="mkt-lede mt-3">კლიენტი ერთ ადგილას პოულობს სალონს, ესთეტიკის ცენტრს და მალე სტომატოლოგსაც. თქვენი ადგილი კატალოგში ჩნდება მხოლოდ მარკეტფლეისის პროფილის დამტკიცების შემდეგ.</p>
      <div className="mt-8 grid gap-5 lg:grid-cols-3">
        {VERTICALS.map(item => item.id === "dental"
          ? <div key={item.id} className="mkt-card flex flex-col gap-3">
            <p className="flex items-center gap-3 mkt-h3">{item.label}<span className="mkt-pill">მალე</span></p>
            <p className="mkt-muted">სტომატოლოგიური კლინიკები მალე დაემატება — კატალოგშიც და მართვის პროგრამაშიც.</p>
          </div>
          : <div key={item.id} className="mkt-card mkt-vcard" data-vertical={item.id}>
            <div className="mkt-vhead"><span className="mkt-h3">{item.label}</span></div>
            <p className="leading-6 mkt-muted">{item.id === "beauty" ? "სალონები: ონლაინ ჯავშნები, გუნდი, კლიენტები და გადახდები ერთ სივრცეში." : "ესთეტიკის და კოსმეტოლოგიის ცენტრები: იგივე სამუშაო სივრცე, ჯავშნიდან ანგარიშებამდე."}</p>
          </div>)}
      </div>
    </div>
  </section>;
}

function Features() {
  return <section className="mkt-section mkt-section-rule" aria-labelledby="partner-features-title">
    <div className="mkt-container">
      <h2 id="partner-features-title" className="mkt-h2 max-w-3xl">ერთი სამუშაო დღე — ერთ სივრცეში.</h2>
      <p className="mkt-lede mt-3">მხოლოდ ის, რაც უკვე მუშაობს პროდუქტში.</p>
      <ul className="mkt-grid mt-8">
        {FEATURES.map((item, index) => <li key={item.title} className="mkt-card flex gap-4">
          <item.icon className="mt-1 size-6 shrink-0" aria-hidden="true" />
          <div><h3 className="mkt-h3">{item.title}</h3><p className="mt-1 leading-6 mkt-muted">{item.text}</p></div>
        </li>)}
      </ul>
    </div>
  </section>;
}

function Pains() {
  return <section className="mkt-section mkt-section-rule" aria-labelledby="partner-pains-title">
    <div className="mkt-container">
      <h2 id="partner-pains-title" className="mkt-h2 max-w-3xl">დღის მართვა არ უნდა იწყებოდეს ქაოსის დალაგებით.</h2>
      <ul className="mkt-grid mt-8">
        {PAIN_POINTS.map(item => <li key={item.title} className="mkt-card grid items-start gap-2 md:grid-cols-[9rem_1fr_1fr] md:gap-6">
          <span className="mkt-h3">{item.title}</span>
          <span className="font-normal leading-6 mkt-muted"><span className="mkt-caption block">ახლა</span>{item.before}</span>
          <span className="flex gap-2 font-normal leading-6"><Check className="mt-1 size-4 shrink-0" aria-hidden="true" /><span><span className="mkt-caption block">{BRAND.name}-ით</span>{item.after}</span></span>
        </li>)}
      </ul>
    </div>
  </section>;
}

function Journey() {
  return <section className="mkt-section mkt-section-rule" aria-labelledby="partner-journey-title">
    <div className="mkt-container grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
      <div>
        <h2 id="partner-journey-title" className="mkt-h2">კლიენტის ჩაწერა თქვენამდე სამ ნაბიჯში.</h2>
        <p className="mkt-lede mt-4">არ ვაჩვენებთ გამოგონილ თავისუფალ დროს: სერვისი, სპეციალისტი და დრო საბოლოოდ მოწმდება მოქმედი განრიგის მიხედვით.</p>
      </div>
      <ol className="mkt-steps">
        {JOURNEY.map((step, index) => <li key={step.title} className="mkt-step-item">
          <span className="mkt-step">{index + 1}</span>
          <span><span className="block mkt-h3">{step.title}</span><span className="mt-1 block font-normal leading-6 mkt-muted">{step.text}</span></span>
        </li>)}
      </ol>
    </div>
  </section>;
}

function Roles() {
  return <section className="mkt-section mkt-section-rule" aria-labelledby="partner-roles-title">
    <div className="mkt-container">
      <h2 id="partner-roles-title" className="mkt-h2 max-w-3xl">ერთი სისტემა, განსხვავებული როლებისთვის.</h2>
      <div className="mt-8 grid gap-5 md:grid-cols-3">
        {ROLES.map(role => <div key={role.title} className="mkt-card">
          <div className="mkt-card-head"><span className="mkt-h3">{role.title}</span></div>
          <p className="leading-6 mkt-muted">{role.text}</p>
        </div>)}
      </div>
    </div>
  </section>;
}

function Faq() {
  return <section className="mkt-section mkt-section-rule" aria-labelledby="partner-faq-title">
    <div className="mkt-container grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
      <h2 id="partner-faq-title" className="mkt-h2">გამჭვირვალე პასუხები, სანამ დაიწყებთ.</h2>
      <div className="mkt-faq">
        {FAQ.map(item => <details key={item.q} className="mkt-faq-row">
          <summary className="flex min-h-14 items-center justify-between gap-4 py-3 font-bold"><span>{item.q}</span><ChevronRight className="size-4 shrink-0" aria-hidden="true" /></summary>
          <p className="pb-4 font-normal leading-7 mkt-muted">{item.a}</p>
        </details>)}
      </div>
    </div>
  </section>;
}

function StartCta() {
  return <section className="mkt-section" aria-labelledby="partner-start-title">
    <div className="mkt-container">
      <div className="mkt-band">
        <div>
          <p className="mkt-caption">გადახედეთ სანამ დაიწყებთ</p>
          <h2 id="partner-start-title" className="mkt-h2 mt-3 max-w-3xl">დარეგისტრირდით და მოითხოვეთ 7-დღიანი საცდელი წვდომა.</h2>
          <p className="mkt-lede mt-4">საცდელი წვდომა ავტომატურად არ აქტიურდება. მოთხოვნის შემდეგ {BRAND.name} ხელით ამოწმებს განაცხადს და დამტკიცებულ ბიზნესს რთავს საცდელ წვდომას.</p>
          <div className="mt-7 flex flex-wrap items-center gap-4">
            <Link href="/register" className="mkt-btn mkt-btn-primary">რეგისტრაცია <ArrowRight className="size-5" aria-hidden="true" /></Link>
            <Link href="/contact" className="mkt-btn mkt-btn-secondary">კონტაქტი</Link>
            <a href={FACEBOOK_URL} target="_blank" rel="noreferrer" className="mkt-link text-sm">კითხვა გაქვთ? მოგვწერეთ Facebook-ზე</a>
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
