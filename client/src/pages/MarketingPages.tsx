import { CatalogFooter, CatalogHeader } from "@/components/catalog/CatalogChrome";
import "@/components/catalog/marketing.css";
import { usePublicMeta } from "@/components/public/PublicMeta";
import { BRAND } from "@shared/brand";
import { ArrowRight, CalendarDays, CheckCircle2, ChevronRight, CreditCard, KeyRound, LayoutDashboard, ShieldCheck, UsersRound } from "lucide-react";
import React from "react";
import { Link } from "wouter";

const groups = [
  { icon: CalendarDays, title: "ჩაწერები და კალენდარი", text: "დღის queue, day/week კალენდარი, სწრაფი ჩაწერა და conflict-safe დროის გადამოწმება ერთ ოპერაციულ ხედში.", items: ["ფილიალის timezone კონტექსტი", "სპეციალისტების სვეტები", "უსაფრთხო გადატანა და სტატუსები"] },
  { icon: UsersRound, title: "კლიენტები და გუნდი", text: "კლიენტის ისტორია, თანხმობები, თანამშრომლების ხელმისაწვდომობა და სამუშაო საათები რეალური role scope-ით.", items: ["ძიებადი კლიენტების რეესტრი", "ფილიალზე მიბმული სპეციალისტები", "განრიგის წესები და გამონაკლისები"] },
  { icon: CreditCard, title: "ფინანსები და ანგარიშები", text: "GEL/tetri სიზუსტით შემოსავალი, ხარჯები, საკომისიო და გადახდის სტატუსები, არსებული ანგარიშების მონაცემებზე დაფუძნებით.", items: ["დაცული CSV export", "პერიოდის მიხედვით ანალიტიკა", "გადახდის მეთოდების ქართული label-ები"] },
  { icon: ShieldCheck, title: "ონლაინ ჩაწერა", text: "სერვისი, სპეციალისტი ან თავისუფალი არჩევანი, ხელმისაწვდომობის server-side check და საბოლოო დადასტურება.", items: ["მობილურ-first booking flow", "იდემპოტენტური დადასტურება", "როლებისა და scope-ის დაცვა"] },
];

const faq = [
  [`ვისთვის არის ${BRAND.name}?`, `${BRAND.name} შექმნილია სალონების, ესთეტიკის ცენტრების, სპა სივრცეების და მომსახურებაზე დაფუძნებული გუნდების ყოველდღიური ოპერაციების სამართავად. სტომატოლოგიური კლინიკებისთვის — მალე.`],
  ["არის თუ არა მრავალფილიალიანი მხარდაჭერა?", "დიახ. სამუშაო სივრცე ორგანიზაციასა და აქტიურ ფილიალებს აერთიანებს IANA timezone და public booking slug კონტექსტით."],
  ["როგორ მუშაობს ონლაინ ჩაწერა?", "სტუმარი ირჩევს აქტიურ მომსახურებას, სპეციალისტს ან თავისუფალ არჩევანს, დროსა და საჭირო კონტაქტს. საბოლოო ჩაწერამდე სისტემა ხელმისაწვდომობას ხელახლა ამოწმებს."],
  ["იგზავნება თუ არა შეტყობინებები?", "ავტომატური email/SMS მიწოდება ჯერ არ არის ჩართული, რადგან verified sender domain და provider configuration ჯერ არ არის დამატებული."],
];

function MarketingLayout({ eyebrow, title, description, canonicalPath, children }: { eyebrow: string; title: string; description: string; canonicalPath: string; children: React.ReactNode }) {
  usePublicMeta({ title: `${eyebrow} | ${BRAND.name}`, description, canonicalPath });
  return <div className="cw min-h-screen">
    <CatalogHeader />
    <main id="main-content" tabIndex={-1}>
      <section className="cw-desk pb-14 pt-10 sm:pb-20 sm:pt-16" aria-labelledby="marketing-title">
        <div className="cw-container">
          <p className="cw-caption">{eyebrow}</p>
          <div className="mt-3 border-t-[1.5px] border-[var(--cw-on-desk-soft)] pt-6">
            <h1 id="marketing-title" className="cw-display max-w-4xl text-[clamp(1.95rem,4.6vw,3.6rem)]">{title}</h1>
            <p className="cw-lede-desk mt-5">{description}</p>
          </div>
        </div>
      </section>
      {children}
    </main>
    <CatalogFooter />
  </div>;
}

function PageCTA({ title, description, secondary = true }: { title: string; description: string; secondary?: boolean }) {
  return <section className="cw-desk py-14 sm:py-20" aria-labelledby="marketing-cta-title">
    <div className="cw-container">
      <div className="cw-card">
        <div className="cw-card-band" />
        <div className="cw-card-inner">
          <p className="cw-caption">{BRAND.name}</p>
          <h2 id="marketing-cta-title" className="cw-h2 mt-3 max-w-3xl">{title}</h2>
          <p className="cw-lede mt-4">{description}</p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link href="/register" className="cw-btn cw-btn-stamp">სამუშაო სივრცის გახსნა <ArrowRight className="size-5" aria-hidden="true" /></Link>
            {secondary ? <Link href="/book" className="cw-btn cw-btn-line text-[var(--cw-ink)]">ონლაინ ჩაწერის ნახვა</Link> : null}
          </div>
        </div>
      </div>
    </div>
  </section>;
}

function LedgerHead({ icon: Icon, title, index }: { icon: typeof LayoutDashboard; title: string; index?: number }) {
  return <div className="cw-ledger-head">
    <h2 className="flex items-center gap-3 text-lg font-extrabold [font-stretch:85%] sm:text-xl"><Icon className="size-5 shrink-0" aria-hidden="true" />{title}</h2>
    {index ? <span className="cw-num text-xs" aria-hidden="true">{String(index).padStart(2, "0")}</span> : null}
  </div>;
}

export function FeaturesPage() {
  return <MarketingLayout eyebrow="შესაძლებლობები" title="ერთი workflow — ჩაწერებიდან ანგარიშებამდე." description={`${BRAND.name} აერთიანებს მხოლოდ იმ ოპერაციულ მოდულებს, რომლებიც უკვე მხარდაჭერილია პროდუქტში და რეალურ role/organization საზღვრებს იცავს.`} canonicalPath="/features">
    <section className="cw-section" aria-label="მოდულები">
      <div className="cw-container grid gap-5 md:grid-cols-2">
        {groups.map(({ icon, title, text, items }, index) => <article key={title} className="cw-ledger cw-ledger-neutral">
          <LedgerHead icon={icon} title={title} index={index + 1} />
          <p className="cw-row leading-7 text-[var(--cw-ink-soft)]">{text}</p>
          <ul>{items.map(item => <li key={item} className="cw-row flex items-start gap-3 text-sm font-semibold"><CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden="true" />{item}</li>)}</ul>
        </article>)}
      </div>
    </section>
    <PageCTA title="თქვენი ყოველდღიური პროცესები უფრო მშვიდ workflow-ში." description="შექმენით სამუშაო სივრცე, დაამატეთ პირველი ფილიალი და დაიწყეთ არსებული, დაცული ფუნქციებით." />
  </MarketingLayout>;
}

export function PricingPage() {
  return <MarketingLayout eyebrow="ტარიფები" title="ფასები უნდა იყოს ისეთივე მკაფიო, როგორც თქვენი ოპერაციები." description={`${BRAND.name}-ის ამ deployment-ში subscription გეგმები, billing rules და გამოქვეყნებული ფასები ჯერ არ არის კონფიგურირებული. ამიტომ არ ვაჩვენებთ გამოგონილ ტარიფებს ან პირობებს.`} canonicalPath="/pricing">
    <section className="cw-section" aria-labelledby="pricing-note-title">
      <div className="cw-container">
        <div className="cw-dashed max-w-3xl p-6 sm:p-10">
          <CreditCard className="size-7" aria-hidden="true" />
          <h2 id="pricing-note-title" className="cw-h2 mt-5">გამჭვირვალე ინფორმაცია გამოქვეყნდება მხოლოდ რეალური billing configuration-ის შემდეგ.</h2>
          <p className="mt-4 max-w-2xl leading-7 text-[var(--cw-ink-soft)]">მანამდე შეგიძლიათ შექმნათ local ანგარიში და გაეცნოთ არსებულ სამუშაო/booking გამოცდილებას. ეს გვერდი შეგნებულად არ ასახელებს გეგმებს, რეკომენდაციებს, ფასებს ან ვალდებულებებს, რომლებიც სისტემაში ჯერ არ არსებობს.</p>
          <p className="mt-6 flex items-start gap-3 border-t-[1.5px] border-[var(--cw-ink)] pt-4 text-sm font-semibold leading-6"><ShieldCheck className="mt-0.5 size-4 shrink-0" aria-hidden="true" />ამ გვერდზე არ ჩნდება subscription ან გადახდის ვალდებულება, სანამ billing წესები რეალურად არ კონფიგურდება.</p>
          <Link href="/register" className="cw-btn cw-btn-stamp mt-7">ანგარიშის შექმნა <ArrowRight className="size-5" aria-hidden="true" /></Link>
        </div>
      </div>
    </section>
    <PageCTA title="პროდუქტის შემოწმება რეალური workflow-ით დაიწყეთ." description="შექმენით საკუთარი დაცული სამუშაო სივრცე და ნახეთ არსებული ოპერაციული გამოცდილება." secondary={false} />
  </MarketingLayout>;
}

export function DemoPage() {
  return <MarketingLayout eyebrow="პროდუქტის დათვალიერება" title="იხილეთ workflow, არა გამოგონილი dashboard." description={`საჯარო ვიზუალები ასახავს ${BRAND.name}-ის მხარდაჭერილ კალენდრის, კლიენტის, გუნდის, ანგარიშების და ონლაინ ჩაწერის კონცეფტებს; საჯარო shared demo workspace არ არის ჩართული, რათა რეალური მონაცემის კონფიდენციალურობა შენარჩუნდეს.`} canonicalPath="/demo">
    <section className="cw-section" aria-label="დათვალიერება">
      <div className="cw-container grid gap-5 md:grid-cols-3">
        <DemoTile icon={LayoutDashboard} title="ოპერაციები" text="Today queue, სტატუსები და სწრაფი მოქმედებები." index={1} />
        <DemoTile icon={CalendarDays} title="კალენდარი" text="სპეციალისტების დრო, ხელმისაწვდომობა და უსაფრთხო გადატანა." index={2} />
        <DemoTile icon={KeyRound} title="ონლაინ ჩაწერა" text="მომსახურება, სპეციალისტი, დრო და დადასტურება." index={3} />
      </div>
    </section>
    <PageCTA title="თქვენი რეალური მონაცემი თქვენს სივრცეში." description={`რეგისტრაციისა და onboarding-ის შემდეგ ${BRAND.name} ქმნის ორგანიზაციას, პირველ ფილიალსა და დაცულ სამუშაო კონტექსტს.`} />
  </MarketingLayout>;
}

function DemoTile({ icon, title, text, index }: { icon: typeof LayoutDashboard; title: string; text: string; index: number }) {
  return <article className="cw-ledger cw-ledger-neutral">
    <LedgerHead icon={icon} title={title} index={index} />
    <p className="cw-row text-sm leading-6 text-[var(--cw-ink-soft)]">{text}</p>
  </article>;
}

export function FaqPage() {
  return <MarketingLayout eyebrow="ხშირი კითხვები" title="სანამ დაიწყებთ, პასუხები ხელთ გქონდეთ." description={`${BRAND.name}-ის მიმდინარე ხელმისაწვდომი ფუნქციები, უსაფრთხოება და შეგნებულად გადადებული ინტეგრაციები აღწერილია პირდაპირ — ზედმეტი დაპირებების გარეშე.`} canonicalPath="/faq">
    <section className="cw-section" aria-label="კითხვები და პასუხები">
      <div className="cw-container">
        <div className="cw-ledger cw-faq max-w-4xl">
          {faq.map(([question, answer]) => <details key={question} className="cw-row">
            <summary className="flex min-h-14 items-center justify-between gap-4 py-3 font-extrabold [font-stretch:90%]"><span>{question}</span><ChevronRight className="size-4 shrink-0" aria-hidden="true" /></summary>
            <p className="max-w-3xl pb-4 leading-7 text-[var(--cw-ink-soft)]">{answer}</p>
          </details>)}
        </div>
      </div>
    </section>
    <PageCTA title="თუ მზად ხართ, დაიწყეთ პირველი ფილიალით." description={`${BRAND.name}-ის setup flow ნაბიჯ-ნაბიჯ აგროვებს მხოლოდ იმ მონაცემს, რომელიც თქვენს პირველ ოპერაციულ დღეს სჭირდება.`} />
  </MarketingLayout>;
}

export function ContactPage() {
  return <MarketingLayout eyebrow="კონტაქტი" title="კონტაქტის არხი უნდა იყოს რეალური, არა დეკორაცია." description={`ამ ეტაპზე ${BRAND.name}-ში არ არის კონფიგურირებული საჯარო მხარდაჭერის ფორმა, email მისამართი ან ticketing integration. ამიტომ ეს გვერდი არ გვაჩვენებს გამოგონილ საკონტაქტო არხს.`} canonicalPath="/contact">
    <section className="cw-section" aria-labelledby="contact-note-title">
      <div className="cw-container">
        <div className="cw-ledger cw-ledger-neutral max-w-3xl">
          <div className="cw-ledger-head"><h2 id="contact-note-title" className="flex items-center gap-3 text-lg font-extrabold [font-stretch:85%] sm:text-xl"><ShieldCheck className="size-5 shrink-0" aria-hidden="true" />უსაფრთხო ანგარიშის გამოცდილება უკვე ხელმისაწვდომია.</h2></div>
          <div className="p-5 sm:p-8">
            <p className="leading-7 text-[var(--cw-ink-soft)]">შექმენით ან შედით თქვენს ადგილობრივ ანგარიშში, რათა გახსნათ საკუთარი სამუშაო სივრცე. საჯარო საკონტაქტო არხები დაემატება მხოლოდ მაშინ, როდესაც მათი რეალური მომსახურების პროცესი და პასუხის პასუხისმგებელი მხარე განსაზღვრული იქნება.</p>
            <p className="mt-6 flex items-start gap-3 border-t-[1.5px] border-[var(--cw-ink)] pt-4 text-sm font-semibold leading-6"><ShieldCheck className="mt-0.5 size-4 shrink-0" aria-hidden="true" />არასოდეს ვაჩვენებთ email-ს ან ფორმას, რომელსაც რეალური პასუხის პროცესი არ აქვს.</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/register" className="cw-btn cw-btn-stamp">რეგისტრაცია <ArrowRight className="size-5" aria-hidden="true" /></Link>
              <Link href="/login" className="cw-btn cw-btn-line text-[var(--cw-ink)]">არსებულ ანგარიშში შესვლა</Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  </MarketingLayout>;
}
