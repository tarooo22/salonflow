import { CatalogFooter, CatalogHeader } from "@/components/catalog/CatalogChrome";
import { CommerceEmpty, LoadingGrid, ProductGrid, VacancyTicket } from "@/components/catalog/Commerce";
import { cssVars, EmptyTickets, listingMatchesVertical, NEW_LISTING_DAYS, newestListings, TicketShelf, type CatalogCategory as Category, type CatalogListing as Listing } from "@/components/catalog/Tickets";
import { marketplaceDiscoveryHref } from "@/components/public/MarketplaceDiscovery";
import { usePublicMeta } from "@/components/public/PublicMeta";
import { usePublicLocale } from "@/contexts/PublicLocaleContext";
import { trpc } from "@/lib/trpc";
import { VERTICALS, verticalForCategory, verticalLabel, verticalStyle, type Vertical } from "@/lib/verticals";
import { BRAND } from "@shared/brand";
import { ArrowRight, CalendarCheck, Globe, MapPin, Search, UsersRound, Wallet } from "lucide-react";
import { type FormEvent, useMemo, useState } from "react";
import { Link, useLocation } from "wouter";

export const ui = {
  ka: {
    metaTitle: `${BRAND.name} — ონლაინ ჩაწერა სალონში, ესთეტიკის ცენტრსა და სტომატოლოგთან`,
    metaDescription: "იპოვე გადამოწმებული სალონი, ესთეტიკის ცენტრი ან სტომატოლოგიური კლინიკა მთელ საქართველოში და ჩაეწერე ონლაინ — სერვისი, სპეციალისტი და თავისუფალი დრო ერთ ადგილას.",
    searchSection: "ძებნა", chooseField: "სფეროს არჩევა", all: "ყველა", soon: "მალე", date: "თარიღი",
    heroTitle: "ჩაეწერე ონლაინ — სალონში, ესთეტიკის ცენტრში და მალე სტომატოლოგთანაც.", heroLede: "მხოლოდ გადამოწმებული ადგილები მთელი საქართველოდან. დრო, რომელსაც ხედავ, ნამდვილად თავისუფალია.",
    searchForm: "ადგილის ძებნა", what: "რა გჭირდება?", whatPlaceholder: "მანიკიური, სალონის სახელი…", where: "სად?", wherePlaceholder: "ქალაქი ან უბანი", search: "მოძებნე",
    verified: "გადამოწმებული ადგილები", verifiedIn: (label: string) => `${label} — გადამოწმებული ადგილები`,
    listingsLede: "კატალოგში ჩანს მხოლოდ ის ადგილი, რომლის პროფილიც ჩვენ გადავამოწმეთ და რომელიც ონლაინ ჯავშანს იღებს.", wholeCatalog: "მთელი კატალოგი",
    loading: "იტვირთება", placesFailedBefore: "ადგილების ჩატვირთვა ვერ მოხერხდა. განაახლეთ გვერდი ან ", openCatalog: "გახსენით კატალოგი",
    vip: "VIP", recommended: "რეკომენდებული", paidNote: "ფასიანი განთავსება", fresh: `სიახლე ${BRAND.nameKa}-ზე`, freshNote: (days: number) => `ბოლო ${days} დღეში დამატებული`, allPlaces: "ყველა ადგილი", nowInCatalog: "ახლა კატალოგში",
    emptyDental: "სტომატოლოგიური კლინიკები მალე დაემატება.", emptyVertical: (label: string) => `${label} — პირველი ადგილები მალე გამოჩნდება.`, emptyDefault: "პირველი გადამოწმებული ადგილები მალე გამოჩნდება.",
    categoriesTitle: "რას ეძებ?", categoriesLoading: "იტვირთება…", categoriesDentalSoon: "კლინიკები და სერვისები მალე დაემატება", categoriesSoon: "კატეგორიები მალე დაემატება",
    howTitle: "ჩაწერა სამ ნაბიჯში, ზარის გარეშე.", howLede: "თავისუფალ დროს სისტემა სპეციალისტის რეალური განრიგიდან ითვლის და ჯავშნის მომენტში ხელახლა ამოწმებს — ერთი და იგივე დრო ორ ადამიანს ვერ მიეცემა.",
    steps: [
      { title: "აირჩიე სერვისი", text: "ნახე ფასი და ხანგრძლივობა. შეგიძლია რამდენიმე სერვისი ერთად აირჩიო." },
      { title: "აირჩიე სპეციალისტი და დრო", text: "ჩანს მხოლოდ ის დრო, რომელიც სპეციალისტის განრიგში ნამდვილად თავისუფალია." },
      { title: "დაადასტურე", text: "მიუთითე სახელი და ტელეფონი. ჯავშნის შეცვლა ან გაუქმება შეგიძლია პირადი ბმულით." },
    ],
    citiesTitle: "მთელი საქართველო.", citiesLede: "აირჩიე ქალაქი ან გახსენი რუკა და ნახე, რა არის შენთან ახლოს.", openMap: "რუკის გახსნა",
    vacanciesTitle: "ვაკანსიები", vacanciesLede: "სამუშაო ადგილები ოსტატებისთვის, კოსმეტოლოგებისთვის და ექიმებისთვის. აქ ჩანს VIP განცხადებები (ფასიანი განთავსება).", allVacancies: "ყველა ვაკანსია",
    vacanciesFailedBefore: "ვაკანსიების ჩატვირთვა ვერ მოხერხდა. ", openVacancies: "გახსენით ვაკანსიების გვერდი", vacanciesEmptyTitle: "VIP ვაკანსია ამჟამად არ არის.", vacanciesEmptyText: "ყველა ღია ვაკანსია ნახე სრულ სიაში.",
    productsTitle: "პროდუქტები", productsLede: "სალონების და კლინიკების პროდუქტები ერთ ვიტრინაში. შეძენა ხდება უშუალოდ ბიზნესში.", allProducts: "ყველა პროდუქტი",
    productsFailedBefore: "პროდუქტების ჩატვირთვა ვერ მოხერხდა. ", openProducts: "გახსენით პროდუქტების გვერდი", productsEmptyTitle: "პროდუქტები ჯერ არ არის დამატებული.", productsEmptyText: "როცა დამტკიცებული ბიზნესი პროდუქტებს დაამატებს, აქ გამოჩნდება.", productsPage: "პროდუქტების გვერდი",
    businessTitle: "ბიზნესის მფლობელი ხარ?", businessLede: "მართვის პროგრამა სალონებისთვის, ესთეტიკის ცენტრებისთვის და სტომატოლოგიური კლინიკებისთვის — თითოეულს თავის სფეროზე მორგებული პანელით. დაამატე შენი ადგილი კატალოგში და მიიღე ჯავშნები ონლაინ.", management: "მართვის პროგრამა", register: "რეგისტრაცია",
    features: [
      { title: "ონლაინ ჯავშნები", text: "კლიენტი თავად ირჩევს სერვისს, სპეციალისტს და თავისუფალ დროს — ზარების გარეშე." },
      { title: "კლიენტები და გუნდი", text: "კლიენტების ბაზა ისტორიით, თანამშრომლების გრაფიკები და როლები." },
      { title: "გადახდები და ანგარიშები", text: "POS გადახდები, შემოსავლები, ხარჯები და საკომისიოები ერთ ადგილას." },
      { title: "საკუთარი საჯარო გვერდი", text: "პროფილი ფასებით, გუნდით და სამუშაო საათებით, ჯავშნის ბმულით." },
    ],
  },
  en: {
    metaTitle: `${BRAND.name} — online booking at salons, aesthetics centres and dentists`,
    metaDescription: "Find a verified salon, aesthetics centre or dental clinic across Georgia and book online — service, specialist and free time in one place.",
    searchSection: "Search", chooseField: "Choose a field", all: "All", soon: "soon", date: "Date",
    heroTitle: "Book online — at a salon, an aesthetics centre and soon at a dentist too.", heroLede: "Only verified places across Georgia. The times you see are truly free.",
    searchForm: "Search for a place", what: "What do you need?", whatPlaceholder: "Manicure, salon name…", where: "Where?", wherePlaceholder: "City or area", search: "Search",
    verified: "Verified places", verifiedIn: (label: string) => `${label} — verified places`,
    listingsLede: "The catalog shows only places whose profile we have verified and which accept online bookings.", wholeCatalog: "Full catalog",
    loading: "Loading", placesFailedBefore: "Places could not be loaded. Refresh the page or ", openCatalog: "open the catalog",
    vip: "VIP", recommended: "Recommended", paidNote: "Paid placement", fresh: `New on ${BRAND.name}`, freshNote: (days: number) => `Added in the last ${days} days`, allPlaces: "All places", nowInCatalog: "Now in the catalog",
    emptyDental: "Dental clinics will be added soon.", emptyVertical: (label: string) => `${label} — the first places will appear soon.`, emptyDefault: "The first verified places will appear soon.",
    categoriesTitle: "What are you looking for?", categoriesLoading: "Loading…", categoriesDentalSoon: "Clinics and services will be added soon", categoriesSoon: "Categories will be added soon",
    howTitle: "Book in three steps, no phone call.", howLede: "Free time is calculated from the specialist's real schedule and checked again at the moment of booking — the same time can never be given to two people.",
    steps: [
      { title: "Choose a service", text: "See the price and duration. You can pick several services together." },
      { title: "Choose a specialist and time", text: "Only times that are truly free in the specialist's schedule are shown." },
      { title: "Confirm", text: "Enter your name and phone. You can change or cancel the booking with your private link." },
    ],
    citiesTitle: "All of Georgia.", citiesLede: "Choose a city or open the map to see what is near you.", openMap: "Open map",
    vacanciesTitle: "Vacancies", vacanciesLede: "Jobs for stylists, cosmetologists and doctors. VIP listings (paid placement) are shown here.", allVacancies: "All vacancies",
    vacanciesFailedBefore: "Vacancies could not be loaded. ", openVacancies: "Open the vacancies page", vacanciesEmptyTitle: "There are no VIP vacancies right now.", vacanciesEmptyText: "See all open vacancies in the full list.",
    productsTitle: "Products", productsLede: "Products from salons and clinics in one showcase. You buy directly at the business.", allProducts: "All products",
    productsFailedBefore: "Products could not be loaded. ", openProducts: "Open the products page", productsEmptyTitle: "No products have been added yet.", productsEmptyText: "When an approved business adds products, they will appear here.", productsPage: "Products page",
    businessTitle: "Do you own a business?", businessLede: "Management software for salons, aesthetics centres and dental clinics — each with a dashboard tailored to its field. Add your place to the catalog and receive bookings online.", management: "Management software", register: "Register",
    features: [
      { title: "Online bookings", text: "Clients choose the service, specialist and free time themselves — no phone calls." },
      { title: "Clients and team", text: "Client database with history, staff schedules and roles." },
      { title: "Payments and reports", text: "POS payments, revenue, expenses and commissions in one place." },
      { title: "Your own public page", text: "A profile with prices, team and working hours, with a booking link." },
    ],
  },
  ru: {
    metaTitle: `${BRAND.name} — онлайн-запись в салон, центр эстетики и к стоматологу`,
    metaDescription: "Найдите проверенный салон, центр эстетики или стоматологическую клинику по всей Грузии и запишитесь онлайн — услуга, специалист и свободное время в одном месте.",
    searchSection: "Поиск", chooseField: "Выбор сферы", all: "Все", soon: "скоро", date: "Дата",
    heroTitle: "Записывайтесь онлайн — в салон, центр эстетики и скоро к стоматологу.", heroLede: "Только проверенные места по всей Грузии. Время, которое вы видите, действительно свободно.",
    searchForm: "Поиск места", what: "Что вам нужно?", whatPlaceholder: "Маникюр, название салона…", where: "Где?", wherePlaceholder: "Город или район", search: "Найти",
    verified: "Проверенные места", verifiedIn: (label: string) => `${label} — проверенные места`,
    listingsLede: "В каталоге показаны только места, профиль которых мы проверили и которые принимают онлайн-записи.", wholeCatalog: "Весь каталог",
    loading: "Загрузка", placesFailedBefore: "Не удалось загрузить места. Обновите страницу или ", openCatalog: "откройте каталог",
    vip: "VIP", recommended: "Рекомендуем", paidNote: "Платное размещение", fresh: `Новое на ${BRAND.name}`, freshNote: (days: number) => `Добавлено за последние ${days} дней`, allPlaces: "Все места", nowInCatalog: "Сейчас в каталоге",
    emptyDental: "Стоматологические клиники скоро появятся.", emptyVertical: (label: string) => `${label} — первые места скоро появятся.`, emptyDefault: "Первые проверенные места скоро появятся.",
    categoriesTitle: "Что вы ищете?", categoriesLoading: "Загрузка…", categoriesDentalSoon: "Клиники и услуги скоро появятся", categoriesSoon: "Категории скоро появятся",
    howTitle: "Запись в три шага, без звонков.", howLede: "Свободное время рассчитывается по реальному расписанию специалиста и проверяется ещё раз в момент записи — одно и то же время не достанется двум людям.",
    steps: [
      { title: "Выберите услугу", text: "Посмотрите цену и длительность. Можно выбрать сразу несколько услуг." },
      { title: "Выберите специалиста и время", text: "Показывается только то время, которое в расписании специалиста действительно свободно." },
      { title: "Подтвердите", text: "Укажите имя и телефон. Изменить или отменить запись можно по личной ссылке." },
    ],
    citiesTitle: "Вся Грузия.", citiesLede: "Выберите город или откройте карту и посмотрите, что есть рядом.", openMap: "Открыть карту",
    vacanciesTitle: "Вакансии", vacanciesLede: "Работа для мастеров, косметологов и врачей. Здесь показаны VIP-объявления (платное размещение).", allVacancies: "Все вакансии",
    vacanciesFailedBefore: "Не удалось загрузить вакансии. ", openVacancies: "Открыть страницу вакансий", vacanciesEmptyTitle: "Сейчас нет VIP-вакансий.", vacanciesEmptyText: "Все открытые вакансии смотрите в полном списке.",
    productsTitle: "Товары", productsLede: "Товары салонов и клиник на одной витрине. Покупка происходит прямо в бизнесе.", allProducts: "Все товары",
    productsFailedBefore: "Не удалось загрузить товары. ", openProducts: "Открыть страницу товаров", productsEmptyTitle: "Товары пока не добавлены.", productsEmptyText: "Когда одобренный бизнес добавит товары, они появятся здесь.", productsPage: "Страница товаров",
    businessTitle: "Вы владелец бизнеса?", businessLede: "Программа управления для салонов, центров эстетики и стоматологических клиник — у каждого панель под свою сферу. Добавьте своё место в каталог и принимайте записи онлайн.", management: "Программа управления", register: "Регистрация",
    features: [
      { title: "Онлайн-записи", text: "Клиент сам выбирает услугу, специалиста и свободное время — без звонков." },
      { title: "Клиенты и команда", text: "База клиентов с историей, графики сотрудников и роли." },
      { title: "Платежи и отчёты", text: "POS-платежи, доходы, расходы и комиссии в одном месте." },
      { title: "Собственная публичная страница", text: "Профиль с ценами, командой и часами работы, со ссылкой для записи." },
    ],
  },
} as const;

// Georgian names are the search values (the area filter matches Georgian labels); only the shown text is translated.
const CITIES = [
  { value: "თბილისი", en: "Tbilisi", ru: "Тбилиси" },
  { value: "ბათუმი", en: "Batumi", ru: "Батуми" },
  { value: "ქუთაისი", en: "Kutaisi", ru: "Кутаиси" },
  { value: "რუსთავი", en: "Rustavi", ru: "Рустави" },
  { value: "ზუგდიდი", en: "Zugdidi", ru: "Зугдиди" },
  { value: "თელავი", en: "Telavi", ru: "Телави" },
  { value: "გორი", en: "Gori", ru: "Гори" },
  { value: "ფოთი", en: "Poti", ru: "Поти" },
];

function SearchCard({ vertical, onVertical }: { vertical: Vertical | null; onVertical: (next: Vertical | null) => void }) {
  const { locale } = usePublicLocale();
  const text = ui[locale];
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
    <div className="cw-tabs" role="group" aria-label={text.chooseField}>
      <button type="button" className="cw-tab cw-tab-all" aria-pressed={vertical === null} onClick={() => onVertical(null)}>{text.all}</button>
      {VERTICALS.map(item => <button key={item.id} type="button" className="cw-tab" style={cssVars({ "--tab-bg": item.bg, "--tab-ink": item.ink })} aria-pressed={vertical === item.id} onClick={() => onVertical(vertical === item.id ? null : item.id)}>
        {verticalLabel(item.id, locale)}{item.id === "dental" ? <span className="cw-tab-soon">{text.soon}</span> : null}
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
          <span>{text.date} <span className="cw-num ml-1 text-[var(--cw-ink)]">{today}</span></span>
          <span className="cw-num text-xs">{BRAND.domain}</span>
        </div>
        <div className="mt-6 grid gap-8 lg:grid-cols-[1.15fr_1fr] lg:items-center">
          <div>
            <h1 className="cw-display text-[clamp(1.95rem,5.6vw,4.4rem)]">{text.heroTitle}</h1>
            <p className="cw-lede mt-4">{text.heroLede}</p>
          </div>
          <form onSubmit={submit} className="grid gap-3" role="search" aria-label={text.searchForm}>
            <label className="cw-field">
              <span className="cw-caption">{text.what}</span>
              <input value={what} onChange={event => setWhat(event.target.value)} placeholder={text.whatPlaceholder} autoComplete="off" enterKeyHint="search" />
            </label>
            <label className="cw-field">
              <span className="cw-caption">{text.where}</span>
              <input value={where} onChange={event => setWhere(event.target.value)} placeholder={text.wherePlaceholder} list="cw-cities" autoComplete="off" enterKeyHint="search" />
            </label>
            <datalist id="cw-cities">{CITIES.map(city => <option key={city.value} value={city.value} />)}</datalist>
            <button type="submit" className="cw-btn cw-btn-stamp mt-1 w-full"><Search className="size-5" aria-hidden="true" />{text.search}</button>
          </form>
        </div>
      </div>
    </div>
  </div>;
}

function Listings({ vertical }: { vertical: Vertical | null }) {
  const { locale } = usePublicLocale();
  const text = ui[locale];
  const directory = trpc.marketplace.directory.useQuery({ limit: 24, offset: 0 });
  const items = ((directory.data?.items ?? []) as Listing[]).filter(item => listingMatchesVertical(item, vertical));
  const vip = items.filter(item => item.promotion?.tier === "VIP");
  const recommended = items.filter(item => item.promotion?.tier === "RECOMMENDED");
  const fresh = newestListings(items.filter(item => !item.promotion));
  const rest = items.filter(item => !item.promotion && !fresh.includes(item));
  const verticalName = vertical ? verticalLabel(vertical, locale) : null;

  return <section className="cw-section" aria-labelledby="cw-listings-title">
    <div className="cw-container">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 id="cw-listings-title" className="cw-h2">{verticalName ? text.verifiedIn(verticalName) : text.verified}</h2>
          <p className="cw-lede mt-2">{text.listingsLede}</p>
        </div>
        <Link href="/salons" className="cw-btn cw-btn-line min-h-11 text-[var(--cw-ink)]">{text.wholeCatalog} <ArrowRight className="size-4" aria-hidden="true" /></Link>
      </div>
      <div className="mt-10">
        {directory.isLoading ? <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3" aria-busy="true" aria-label={text.loading}>{[0, 1, 2].map(key => <div key={key} className="h-[8.5rem] animate-pulse rounded-[4px] border-[1.5px] border-[var(--cw-rule)] bg-white" />)}</div>
          : directory.isError ? <p role="alert" className="text-[var(--cw-ink-soft)]">{text.placesFailedBefore}<Link href="/salons" className="font-bold text-[var(--cw-stamp)] underline">{text.openCatalog}</Link>.</p>
          : items.length ? <>
            <TicketShelf title={text.vip} note={text.paidNote} items={vip} startAt={1} />
            <TicketShelf title={text.recommended} note={text.paidNote} items={recommended} startAt={vip.length + 1} />
            <TicketShelf title={text.fresh} note={text.freshNote(NEW_LISTING_DAYS)} items={fresh} startAt={vip.length + recommended.length + 1} />
            <TicketShelf title={vip.length || recommended.length || fresh.length ? text.allPlaces : text.nowInCatalog} items={rest} startAt={vip.length + recommended.length + fresh.length + 1} />
          </>
          : <EmptyTickets message={vertical === "dental" ? text.emptyDental : verticalName ? text.emptyVertical(verticalName) : text.emptyDefault} vertical={vertical} />}
      </div>
    </div>
  </section>;
}

function CategoryLedger({ vertical }: { vertical: Vertical | null }) {
  const { locale } = usePublicLocale();
  const text = ui[locale];
  const categories = trpc.marketplace.categories.useQuery();
  const byVertical = useMemo(() => {
    const grouped: Record<Vertical, Category[]> = { beauty: [], aesthetics: [], dental: [] };
    for (const category of (categories.data ?? []) as Category[]) grouped[verticalForCategory(category.slug)].push(category);
    return grouped;
  }, [categories.data]);
  const shown = vertical ? VERTICALS.filter(item => item.id === vertical) : VERTICALS;

  return <section className="cw-section cw-rule-top" aria-labelledby="cw-categories-title">
    <div className="cw-container">
      <h2 id="cw-categories-title" className="cw-h2">{text.categoriesTitle}</h2>
      <div className={`mt-8 grid gap-5 ${shown.length > 1 ? "lg:grid-cols-3" : "max-w-xl"}`}>
        {shown.map(item => <div key={item.id} className="cw-ledger" style={cssVars({ "--ledger-bg": item.bg, "--ledger-ink": item.ink })}>
          <div className="cw-ledger-head"><span className="text-lg font-extrabold [font-stretch:85%]">{verticalLabel(item.id, locale)}</span><span className="cw-num text-xs">{byVertical[item.id].length || "—"}</span></div>
          {byVertical[item.id].length ? byVertical[item.id].map(category => <Link key={category.id} href={marketplaceDiscoveryHref("/salons", category.slug)} className="cw-ledger-row">
            <span className="flex-1">{category.nameKa}</span>
            <ArrowRight className="size-4 text-[var(--cw-ink-soft)]" aria-hidden="true" />
          </Link>) : <p className="cw-ledger-row font-normal text-[var(--cw-ink-soft)]">{categories.isLoading ? text.categoriesLoading : item.id === "dental" ? text.categoriesDentalSoon : text.categoriesSoon}</p>}
        </div>)}
      </div>
    </div>
  </section>;
}

function HowItWorks() {
  const text = ui[usePublicLocale().locale];
  return <section className="cw-section cw-rule-top" aria-labelledby="cw-how-title">
    <div className="cw-container grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
      <div>
        <h2 id="cw-how-title" className="cw-h2">{text.howTitle}</h2>
        <p className="cw-lede mt-4">{text.howLede}</p>
      </div>
      <ol className="cw-ledger">
        {text.steps.map((step, index) => <li key={step.title} className="cw-ledger-row items-start gap-4 py-5">
          <span className="cw-num grid size-9 shrink-0 place-items-center rounded-[3px] border-[1.5px] border-[var(--cw-ink)] text-sm font-semibold">{index + 1}</span>
          <span><span className="block text-lg font-extrabold [font-stretch:85%]">{step.title}</span><span className="mt-1 block font-normal leading-6 text-[var(--cw-ink-soft)]">{step.text}</span></span>
        </li>)}
      </ol>
    </div>
  </section>;
}

function Cities() {
  const { locale } = usePublicLocale();
  const text = ui[locale];
  return <section className="cw-section cw-rule-top" aria-labelledby="cw-cities-title">
    <div className="cw-container grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
      <div>
        <h2 id="cw-cities-title" className="cw-h2">{text.citiesTitle}</h2>
        <p className="cw-lede mt-3">{text.citiesLede}</p>
        <ul className="mt-6 flex flex-wrap gap-2">{CITIES.map(city => <li key={city.value}><Link href={marketplaceDiscoveryHref("/salons", undefined, undefined, city.value)} className="cw-btn cw-btn-line min-h-10 px-4 text-sm font-bold text-[var(--cw-ink)]">{locale === "ka" ? city.value : city[locale]}</Link></li>)}</ul>
      </div>
      <Link href="/salons/map" className="cw-btn cw-btn-stamp"><MapPin className="size-5" aria-hidden="true" />{text.openMap}</Link>
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
  const text = ui[usePublicLocale().locale];
  const vip = trpc.vacancies.publicVipList.useQuery({ vertical: vertical ?? undefined, limit: 6 });
  const items = vip.data ?? [];
  return <section className="cw-section cw-rule-top" aria-labelledby="cw-vacancies-title">
    <div className="cw-container">
      <StripHead id="cw-vacancies-title" title={text.vacanciesTitle} lede={text.vacanciesLede} href="/vacancies" cta={text.allVacancies} />
      <div className="mt-10">
        {vip.isLoading ? <LoadingGrid />
          : vip.isError ? <p role="alert" className="text-[var(--cw-ink-soft)]">{text.vacanciesFailedBefore}<Link href="/vacancies" className="font-bold text-[var(--cw-stamp)] underline">{text.openVacancies}</Link>.</p>
          : items.length ? <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{items.map((item, index) => <VacancyTicket key={item.id} item={item} number={index + 1} />)}</div>
          : <CommerceEmpty title={text.vacanciesEmptyTitle} text={text.vacanciesEmptyText}>
            <Link href="/vacancies" className="cw-btn cw-btn-stamp">{text.allVacancies}</Link>
          </CommerceEmpty>}
      </div>
    </div>
  </section>;
}

function ProductStrip({ vertical }: { vertical: Vertical | null }) {
  const text = ui[usePublicLocale().locale];
  const products = trpc.products.publicList.useQuery({ vertical: vertical ?? undefined, limit: 8, offset: 0 });
  const items = products.data?.items ?? [];
  return <section className="cw-section cw-rule-top" aria-labelledby="cw-products-title">
    <div className="cw-container">
      <StripHead id="cw-products-title" title={text.productsTitle} lede={text.productsLede} href="/products" cta={text.allProducts} />
      <div className="mt-10">
        {products.isLoading ? <LoadingGrid ticket={false} />
          : products.isError ? <p role="alert" className="text-[var(--cw-ink-soft)]">{text.productsFailedBefore}<Link href="/products" className="font-bold text-[var(--cw-stamp)] underline">{text.openProducts}</Link>.</p>
          : items.length ? <ProductGrid items={items} />
          : <CommerceEmpty title={text.productsEmptyTitle} text={text.productsEmptyText}>
            <Link href="/products" className="cw-btn cw-btn-stamp">{text.productsPage}</Link>
          </CommerceEmpty>}
      </div>
    </div>
  </section>;
}

const BUSINESS_ICONS = [CalendarCheck, UsersRound, Wallet, Globe];

function BusinessBand() {
  const { locale } = usePublicLocale();
  const text = ui[locale];
  return <section className="cw-desk" aria-labelledby="cw-business-title">
    <div className="cw-container py-16 lg:py-20">
      <div className="grid gap-8 lg:grid-cols-[1.3fr_1fr] lg:items-end">
        <div>
          <h2 id="cw-business-title" className="cw-h2 text-white">{text.businessTitle}</h2>
          <p className="mt-4 max-w-xl leading-7 text-[var(--cw-on-desk-soft)]">{text.businessLede}</p>
          <ul className="mt-5 flex flex-wrap gap-2">{VERTICALS.map(item => <li key={item.id} className="rounded-[3px] px-3 py-1 text-sm font-extrabold" style={{ background: item.bg, color: item.ink }}>{verticalLabel(item.id, locale)}{item.id === "dental" ? ` · ${text.soon}` : ""}</li>)}</ul>
        </div>
        <div className="flex flex-wrap gap-3 lg:justify-end">
          <Link href="/partner" className="cw-btn cw-btn-paper">{text.management} <ArrowRight className="size-4" aria-hidden="true" /></Link>
          <Link href="/register" className="cw-btn cw-btn-line text-white">{text.register}</Link>
        </div>
      </div>
      <ul className="mt-12 grid gap-px overflow-hidden rounded-[4px] border border-[var(--cw-desk-soft)] bg-[var(--cw-desk-soft)] sm:grid-cols-2 lg:grid-cols-4">
        {text.features.map((item, index) => {
          const Icon = BUSINESS_ICONS[index]!;
          return <li key={item.title} className="bg-[var(--cw-desk)] p-5">
            <Icon className="size-5 text-[var(--cw-aesthetics)]" aria-hidden="true" />
            <p className="mt-3 font-extrabold text-white [font-stretch:85%]">{item.title}</p>
            <p className="mt-1 text-sm leading-6 text-[var(--cw-on-desk-soft)]">{item.text}</p>
          </li>;
        })}
      </ul>
    </div>
  </section>;
}

export default function Home() {
  const text = ui[usePublicLocale().locale];
  usePublicMeta({ title: text.metaTitle, description: text.metaDescription, canonicalPath: "/" });
  const [vertical, setVertical] = useState<Vertical | null>(null);

  return <div className="cw min-h-screen">
    <CatalogHeader />
    <main id="main-content">
      <section className="cw-desk cw-section-hero pb-14 pt-6 sm:pb-20 sm:pt-10" aria-label={text.searchSection}>
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
