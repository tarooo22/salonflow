import { CatalogFooter, CatalogHeader } from "@/components/catalog/CatalogChrome";
import { usePublicMeta } from "@/components/public/PublicMeta";
import { usePublicAnalyticsConsent } from "@/contexts/PublicAnalyticsConsentContext";
import { BRAND } from "@shared/brand";
import { Link } from "wouter";

const UPDATED = "23.10.2026";

const SECTIONS: Array<{ id: string; title: string; body: React.ReactNode }> = [
  {
    id: "who",
    title: "ვინ ვართ",
    body: <p>{BRAND.name} ({BRAND.domain}) არის ონლაინ ჩაწერის პლატფორმა, რომელიც აერთიანებს სალონებს, ესთეტიკის ცენტრებს და სტომატოლოგიურ კლინიკებს. როცა ჯავშანს აკეთებ, სერვისს გიწევს ის ბიზნესი, რომელიც აირჩიე; ჩვენ ვამუშავებთ მონაცემებს, რომ ჯავშანი შედგეს და ბიზნესმა ის მართოს.</p>,
  },
  {
    id: "collect",
    title: "რა მონაცემებს ვაგროვებთ",
    body: <ul>
      <li><strong>ჯავშნისას:</strong> სახელი, ტელეფონის ნომერი, სურვილისამებრ ელფოსტა და კომენტარი, ასევე ჯავშნის დეტალები — ბიზნესი, სერვისი, სპეციალისტი, თარიღი და დრო.</li>
      <li><strong>ბიზნესის ანგარიშისთვის:</strong> სახელი, ელფოსტა და პაროლი (პაროლს არ ვინახავთ — ვინახავთ მხოლოდ მის ცალმხრივ ჰეშს, საიდანაც პაროლის აღდგენა შეუძლებელია), ბიზნესის პროფილი, სერვისები, ფასები, მისამართი, სამუშაო საათები და ფოტოები.</li>
      <li><strong>ჯანმრთელობის ჩანაწერები — მხოლოდ კლინიკებში:</strong> თუ ბიზნესი სტომატოლოგიური კლინიკა ან ესთეტიკის ცენტრია, მას შეუძლია აწარმოოს შენი მკურნალობის ჩანაწერები: კბილების მდგომარეობა, ჩატარებული პროცედურები, გამოყენებული პრეპარატი, მისი სერია და დოზა. ამ ჩანაწერებს ქმნის და მათზე პასუხისმგებელია კლინიკა; ჩვენ მათ ვინახავთ კლინიკის დავალებით და სხვა მიზნით არ ვიყენებთ.</li>
      <li><strong>ტექნიკური:</strong> სესიის cookie, როცა სისტემაში შესული ხარ.</li>
      <li><strong>ანალიტიკა — მხოლოდ შენი თანხმობით:</strong> მოვლენის ტიპი, გვერდის მისამართი და დრო. სახელს, საკონტაქტო მონაცემს, ძიების ტექსტს, ჯავშნის დეტალებს და მოწყობილობის fingerprint-ს ანალიტიკაში არ ვინახავთ.</li>
    </ul>,
  },
  {
    id: "use",
    title: "რისთვის ვიყენებთ",
    body: <ul>
      <li>ჯავშნის შესაქმნელად, ბიზნესისთვის გადასაცემად და შენთვის ჯავშნის შეცვლის ან გაუქმების ბმულის მისაცემად.</li>
      <li>ბიზნესის ანგარიშის, უსაფრთხოებისა და შესვლის უზრუნველსაყოფად.</li>
      <li>კატალოგში ბიზნესის პროფილის საჩვენებლად.</li>
      <li>თანხმობის შემთხვევაში — საიტის გასაუმჯობესებლად.</li>
    </ul>,
  },
  {
    id: "share",
    title: "ვის ვუზიარებთ",
    body: <>
      <p>შენს მონაცემებს არ ვყიდით და სარეკლამო პროფილებისთვის არ ვიყენებთ. მონაცემებს ვუზიარებთ მხოლოდ:</p>
      <ul>
        <li><strong>ბიზნესს, რომელშიც ჩაეწერე</strong> — სახელს, ტელეფონს და ჯავშნის დეტალებს, რომ მომსახურება შედგეს.</li>
        <li><strong>ინფრასტრუქტურის პროვაიდერებს</strong>, რომლებიც ჩვენი სახელით მუშაობენ: ჰოსტინგი (Railway), ფაილების საცავი ბიზნესის ფოტოებისთვის (Cloudflare R2) და მისამართის რუკაზე განთავსების სერვისი — მხოლოდ ბიზნესის მისამართისთვის.</li>
        <li><strong>სახელმწიფო ორგანოებს</strong>, მხოლოდ მაშინ, როცა ამას კანონი მოითხოვს.</li>
      </ul>
    </>,
  },
  {
    id: "cookies",
    title: "Cookie და ბრაუზერში შენახვა",
    body: <ul>
      <li><strong>სესიის cookie</strong> — საჭიროა მხოლოდ სისტემაში შესვლისთვის.</li>
      <li><strong>ანალიტიკის არჩევანი</strong> ინახება შენს ბრაუზერში (localStorage), რომ ყოველ ჯერზე აღარ გკითხოთ.</li>
      <li>მესამე მხარის სარეკლამო cookie-ებს არ ვიყენებთ.</li>
    </ul>,
  },
  {
    id: "retention",
    title: "შენახვის ვადა",
    body: <p>ჯავშნის ჩანაწერები ინახება მანამ, სანამ ბიზნესის ანგარიში აქტიურია და რამდენადაც ეს საჭიროა მისი აღრიცხვისა და კანონით დადგენილი ვალდებულებებისთვის. ანგარიშის ან მონაცემების წაშლა ნებისმიერ დროს შეგიძლია მოითხოვო. ჯანმრთელობის ჩანაწერების შენახვის ვადას კლინიკა კანონის შესაბამისად განსაზღვრავს — მათი ასლის ან წაშლის მოთხოვნით მიმართე უშუალოდ კლინიკას.</p>,
  },
  {
    id: "security",
    title: "უსაფრთხოება",
    body: <p>მონაცემები გადაიცემა დაშიფრული კავშირით (HTTPS), პაროლები ინახება მხოლოდ ცალმხრივი ჰეშის (scrypt) სახით, ხოლო ბიზნესის თითოეული მომხმარებელი ხედავს მხოლოდ იმას, რასაც მისი როლი უშვებს — ბიზნესი ხედავს მხოლოდ საკუთარ კლიენტებს და ჯავშნებს. ჯანმრთელობის ჩანაწერებს ხედავს მხოლოდ კლინიკის მფლობელი, მენეჯერი და ის სპეციალისტი, რომელთანაც ვიზიტი გაქვს; რეცეფციონისტს მათზე წვდომა არ აქვს. ასეთი ჩანაწერი არც იშლება და არც გადაიწერება — შესწორება ახალ ჩანაწერად ემატება, რომ მკურნალობის ისტორია სრული დარჩეს.</p>,
  },
  {
    id: "rights",
    title: "შენი უფლებები",
    body: <>
      <p>გაქვს უფლება მოითხოვო შენს შესახებ შენახული მონაცემების ნახვა, გასწორება ან წაშლა, და ნებისმიერ დროს გააუქმო ანალიტიკაზე თანხმობა. მოთხოვნისთვის მოგვწერე <Link href="/contact" className="font-bold text-[var(--cw-stamp)] underline">კონტაქტის გვერდიდან</Link>.</p>
      <p>თუ ფიქრობ, რომ შენი მონაცემები არასწორად მუშავდება, შეგიძლია მიმართო პერსონალურ მონაცემთა დაცვის სამსახურს.</p>
    </>,
  },
];

function AnalyticsChoice() {
  const { choice, setChoice } = usePublicAnalyticsConsent();
  const status = choice === "accepted" ? "ანალიტიკა ჩართულია" : choice === "declined" ? "ანალიტიკა გამორთულია" : "არჩევანი ჯერ არ გაგიკეთებია";
  return <div className="cw-ledger mt-4">
    <div className="cw-ledger-head" style={{ ["--ledger-bg" as string]: "var(--cw-aesthetics)", ["--ledger-ink" as string]: "var(--cw-aesthetics-ink)" }}>
      <span className="font-extrabold">შენი არჩევანი</span><span className="text-sm">{status}</span>
    </div>
    <div className="flex flex-wrap gap-3 p-4">
      <button type="button" className="cw-btn cw-btn-stamp min-h-11" aria-pressed={choice === "accepted"} onClick={() => setChoice("accepted")}>ანალიტიკის ჩართვა</button>
      <button type="button" className="cw-btn cw-btn-line min-h-11" aria-pressed={choice === "declined"} onClick={() => setChoice("declined")}>უარის თქმა</button>
    </div>
  </div>;
}

export default function Privacy() {
  usePublicMeta({ title: `კონფიდენციალურობის პოლიტიკა | ${BRAND.name}`, description: `როგორ აგროვებს, იყენებს და იცავს ${BRAND.name} შენს მონაცემებს ჯავშნისას და ბიზნესის ანგარიშში.`, canonicalPath: "/privacy" });
  return <div className="cw min-h-screen">
    <CatalogHeader />
    <main id="main-content" className="cw-section">
      <div className="cw-container grid gap-10 lg:grid-cols-[16rem_1fr]">
        <nav aria-label="სარჩევი" className="lg:sticky lg:top-6 lg:self-start">
          <p className="cw-caption">სარჩევი</p>
          <ol className="mt-3 grid gap-1 text-sm">
            {[...SECTIONS, { id: "analytics", title: "ანალიტიკის არჩევანი" }].map((section, index) => <li key={section.id}>
              <a href={`#${section.id}`} className="flex gap-2 rounded-[3px] px-2 py-1.5 hover:bg-white"><span className="cw-num text-xs text-[var(--cw-ink-soft)]">{index + 1}</span>{section.title}</a>
            </li>)}
          </ol>
        </nav>
        <article className="max-w-[68ch]">
          <h1 className="cw-display text-[clamp(2rem,4.5vw,3.4rem)]">კონფიდენციალურობის პოლიტიკა</h1>
          <p className="mt-3 text-sm text-[var(--cw-ink-soft)]">ბოლო განახლება: <span className="cw-num">{UPDATED}</span></p>
          <div className="cw-legal mt-10">
            {SECTIONS.map((section, index) => <section key={section.id} id={section.id} className="scroll-mt-6 border-t-[1.5px] border-[var(--cw-ink)] py-7">
              <h2 className="flex items-baseline gap-3 text-xl font-extrabold [font-stretch:85%]"><span className="cw-num text-sm text-[var(--cw-ink-soft)]">{index + 1}</span>{section.title}</h2>
              <div className="mt-3 grid gap-3 leading-7 text-[var(--cw-ink)] [&_li]:ml-5 [&_li]:list-disc [&_ul]:grid [&_ul]:gap-2">{section.body}</div>
            </section>)}
            <section id="analytics" className="scroll-mt-6 border-t-[1.5px] border-[var(--cw-ink)] py-7">
              <h2 className="flex items-baseline gap-3 text-xl font-extrabold [font-stretch:85%]"><span className="cw-num text-sm text-[var(--cw-ink-soft)]">{SECTIONS.length + 1}</span>ანალიტიკის არჩევანი</h2>
              <p className="mt-3 leading-7">ანალიტიკა ნაგულისხმევად გამორთულია და ირთვება მხოლოდ შენი თანხმობით. არჩევანი ნებისმიერ დროს შეგიძლია შეცვალო.</p>
              <AnalyticsChoice />
            </section>
          </div>
        </article>
      </div>
    </main>
    <CatalogFooter />
  </div>;
}
