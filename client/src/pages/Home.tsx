import { CatalogFooter, CatalogHeader } from "@/components/catalog/CatalogChrome";
import { Float, HeroIn, HeroPhoto, RevealGroup, RevealItem } from "@/components/catalog/HomeMotion";
import { ProductCard, VacancyTicket } from "@/components/catalog/Commerce";
import { categoryIcon, cssVars, EmptyCatalog, listingMatchesVertical, newestListings, SalonGrid, SalonLoading, ui as ticketsUi, type CatalogCategory as Category, type CatalogListing as Listing } from "@/components/catalog/Tickets";
import { marketplaceDiscoveryHref } from "@/components/public/MarketplaceDiscovery";
import { usePublicMeta } from "@/components/public/PublicMeta";
import { usePublicLocale } from "@/contexts/PublicLocaleContext";
import { trpc } from "@/lib/trpc";
import { VERTICALS, verticalForCategory, verticalLabel, type Vertical } from "@/lib/verticals";
import { BRAND } from "@shared/brand";
import { ArrowRight, CalendarCheck, Check, ChevronLeft, ChevronRight, Globe, MapPin, Scissors, Search, Smile, Sparkles, UsersRound, Wallet, type LucideIcon } from "lucide-react";
import { type FormEvent, type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation } from "wouter";

function plural(count: number, one: string, few: string, many: string) {
  const rule = new Intl.PluralRules("ru").select(count);
  return rule === "one" ? one : rule === "few" ? few : many;
}

export const ui = {
  ka: {
    metaTitle: `${BRAND.name} — ონლაინ ჩაწერა სალონში, ესთეტიკის ცენტრსა და სტომატოლოგთან`,
    metaDescription: "იპოვე გადამოწმებული სალონი, ესთეტიკის ცენტრი ან სტომატოლოგიური კლინიკა მთელ საქართველოში და ჩაეწერე ონლაინ — სერვისი, სპეციალისტი და თავისუფალი დრო ერთ ადგილას.",
    searchSection: "ძებნა", chooseField: "სფეროს არჩევა", all: "ყველა",
    heroTitle: "იპოვე და ჩაეწერე ონლაინ", heroLede: "სალონები, ესთეტიკის ცენტრები და სტომატოლოგიური კლინიკები მთელ საქართველოში.",
    searchForm: "ადგილის ძებნა", what: "რა გჭირდება?", whatSr: " — სერვისი ან ადგილის სახელი", where: "სად?", whereSr: " — ქალაქი ან უბანი", wherePlaceholder: "ქალაქი ან უბანი", search: "მოძებნე",
    bannerLabel: "გამორჩეული ადგილები", slideLabel: (index: number, total: number) => `${index} / ${total}`, prev: "წინა", next: "შემდეგი",
    categoriesTitle: "კატეგორიები",
    verticalsTitle: "აირჩიე სფერო", allCategories: "ყველა კატეგორია",
    chipCategories: (count: number) => `${count} კატეგორია`, chipFields: (count: number) => `${count} სფერო`,
    vip: "VIP ადგილები", recommended: "რეკომენდებული", paidNote: "ფასიანი განთავსება", fresh: "ახალი კატალოგში", allPlaces: "ყველა ადგილი", viewAll: "ყველას ნახვა",
    loading: "იტვირთება", placesFailed: "ადგილების ჩატვირთვა ვერ მოხერხდა.", retry: "სცადე თავიდან",
    emptyDental: "სტომატოლოგიური კლინიკები მალე დაემატება.", emptyVertical: (label: string) => `${label} — პირველი ადგილები მალე გამოჩნდება.`, emptyDefault: "პირველი გადამოწმებული ადგილები მალე გამოჩნდება.",
    howTitle: "ჩაწერა სამ ნაბიჯში, ზარის გარეშე.", howLede: "თავისუფალ დროს სისტემა სპეციალისტის რეალური განრიგიდან ითვლის და ჯავშნის მომენტში ხელახლა ამოწმებს — ერთი და იგივე დრო ორ ადამიანს ვერ მიეცემა.",
    steps: [
      { title: "აირჩიე სერვისი", text: "ნახე ფასი და ხანგრძლივობა. შეგიძლია რამდენიმე სერვისი ერთად აირჩიო." },
      { title: "აირჩიე სპეციალისტი და დრო", text: "ჩანს მხოლოდ ის დრო, რომელიც სპეციალისტის განრიგში ნამდვილად თავისუფალია." },
      { title: "დაადასტურე", text: "მიუთითე სახელი და ტელეფონი. ჯავშნის შეცვლა ან გაუქმება შეგიძლია პირადი ბმულით." },
    ],
    citiesTitle: "მთელი საქართველო.", citiesLede: "აირჩიე ქალაქი ან გახსენი რუკა და ნახე, რა არის შენთან ახლოს.", openMap: "რუკის გახსნა",
    vacanciesTitle: "ვაკანსიები", productsTitle: "პროდუქტები",
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
    searchSection: "Search", chooseField: "Choose a field", all: "All",
    heroTitle: "Find and book online", heroLede: "Salons, aesthetics centres and dental clinics across Georgia.",
    searchForm: "Search for a place", what: "What do you need?", whatSr: " — service or place name", where: "Where?", whereSr: " — city or area", wherePlaceholder: "City or area", search: "Search",
    bannerLabel: "Featured places", slideLabel: (index: number, total: number) => `${index} / ${total}`, prev: "Previous", next: "Next",
    categoriesTitle: "Categories",
    verticalsTitle: "Choose a field", allCategories: "All categories",
    chipCategories: (count: number) => `${count} ${count === 1 ? "category" : "categories"}`, chipFields: (count: number) => `${count} ${count === 1 ? "field" : "fields"}`,
    vip: "VIP places", recommended: "Recommended", paidNote: "Paid placement", fresh: "New in the catalog", allPlaces: "All places", viewAll: "View all",
    loading: "Loading", placesFailed: "Places could not be loaded.", retry: "Try again",
    emptyDental: "Dental clinics will be added soon.", emptyVertical: (label: string) => `${label} — the first places will appear soon.`, emptyDefault: "The first verified places will appear soon.",
    howTitle: "Book in three steps, no phone call.", howLede: "Free time is calculated from the specialist's real schedule and checked again at the moment of booking — the same time can never be given to two people.",
    steps: [
      { title: "Choose a service", text: "See the price and duration. You can pick several services together." },
      { title: "Choose a specialist and time", text: "Only times that are truly free in the specialist's schedule are shown." },
      { title: "Confirm", text: "Enter your name and phone. You can change or cancel the booking with your private link." },
    ],
    citiesTitle: "All of Georgia.", citiesLede: "Choose a city or open the map to see what is near you.", openMap: "Open map",
    vacanciesTitle: "Vacancies", productsTitle: "Products",
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
    searchSection: "Поиск", chooseField: "Выбор сферы", all: "Все",
    heroTitle: "Найдите и запишитесь онлайн", heroLede: "Салоны, центры эстетики и стоматологические клиники по всей Грузии.",
    searchForm: "Поиск места", what: "Что вам нужно?", whatSr: " — услуга или название места", where: "Где?", whereSr: " — город или район", wherePlaceholder: "Город или район", search: "Найти",
    bannerLabel: "Избранные места", slideLabel: (index: number, total: number) => `${index} / ${total}`, prev: "Назад", next: "Вперёд",
    categoriesTitle: "Категории",
    verticalsTitle: "Выберите сферу", allCategories: "Все категории",
    chipCategories: (count: number) => `${count} ${plural(count, "категория", "категории", "категорий")}`, chipFields: (count: number) => `${count} ${plural(count, "сфера", "сферы", "сфер")}`,
    vip: "VIP-места", recommended: "Рекомендуем", paidNote: "Платное размещение", fresh: "Новое в каталоге", allPlaces: "Все места", viewAll: "Смотреть все",
    loading: "Загрузка", placesFailed: "Не удалось загрузить места.", retry: "Повторить",
    emptyDental: "Стоматологические клиники скоро появятся.", emptyVertical: (label: string) => `${label} — первые места скоро появятся.`, emptyDefault: "Первые проверенные места скоро появятся.",
    howTitle: "Запись в три шага, без звонков.", howLede: "Свободное время рассчитывается по реальному расписанию специалиста и проверяется ещё раз в момент записи — одно и то же время не достанется двум людям.",
    steps: [
      { title: "Выберите услугу", text: "Посмотрите цену и длительность. Можно выбрать сразу несколько услуг." },
      { title: "Выберите специалиста и время", text: "Показывается только то время, которое в расписании специалиста действительно свободно." },
      { title: "Подтвердите", text: "Укажите имя и телефон. Изменить или отменить запись можно по личной ссылке." },
    ],
    citiesTitle: "Вся Грузия.", citiesLede: "Выберите город или откройте карту и посмотрите, что есть рядом.", openMap: "Открыть карту",
    vacanciesTitle: "Вакансии", productsTitle: "Товары",
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

const MAX_SLIDES = 6;
const reducedMotion = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Decorative brand photo from /brand. When the file is missing or broken it renders nothing and the parent's tinted fallback shows. */
function BrandImg({ name, width, height, eager = false, onFail }: { name: string; width: number; height: number; eager?: boolean; onFail?: () => void }) {
  const [broken, setBroken] = useState(false);
  if (broken) return null;
  const fail = () => { setBroken(true); onFail?.(); };
  return <img
    ref={el => { if (el?.complete && !el.naturalWidth) fail(); }}
    src={`/brand/${name}.webp`} alt="" width={width} height={height}
    loading={eager ? "eager" : "lazy"} fetchPriority={eager ? "high" : undefined} decoding="async" onError={fail}
  />;
}

/** Distance between slide starts, measured from the DOM so it follows the 1-up / 2-up CSS. */
function slideStep(track: HTMLElement) {
  const first = track.children[0] as HTMLElement | undefined;
  const second = track.children[1] as HTMLElement | undefined;
  return first && second ? second.offsetLeft - first.offsetLeft : 0;
}

/** Paid VIP placements that have a real cover photo. Scroll-snap, never autoplays; prev/next are real buttons. */
function Banner({ items }: { items: Listing[] }) {
  const { locale } = usePublicLocale();
  const text = ui[locale];
  const disclosure = ticketsUi[locale].adSr;
  const track = useRef<HTMLUListElement>(null);
  const [pos, setPos] = useState({ index: 0, max: 0 });
  const measure = useCallback(() => {
    const el = track.current;
    if (!el) return;
    const step = slideStep(el);
    const max = step ? Math.max(0, Math.round((el.scrollWidth - el.clientWidth) / step)) : 0;
    const index = step ? Math.min(max, Math.round(el.scrollLeft / step)) : 0;
    setPos(current => (current.index === index && current.max === max ? current : { index, max }));
  }, []);
  useEffect(() => {
    measure();
    const el = track.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [measure, items.length]);
  const go = (direction: 1 | -1) => {
    const el = track.current;
    if (el) el.scrollBy({ left: direction * slideStep(el), behavior: reducedMotion() ? "auto" : "smooth" });
  };

  return <section className="hb" aria-roledescription="carousel" aria-label={text.bannerLabel}>
    <div className="cw-container">
      <div className="hb-stage">
        <ul ref={track} className="hb-track" data-count={items.length} onScroll={measure}>
          {items.map((item, index) => <li key={item.publicSlug} className="hb-slide" data-current={index === pos.index} role="group" aria-roledescription="slide" aria-label={text.slideLabel(index + 1, items.length)}>
            <Link href={`/salon/${item.publicSlug}`} className="hb-link">
              <img src={item.coverImageUrl!} alt={item.coverImageAltKa ?? ""} loading={index < 2 ? "eager" : "lazy"} />
              <span className="hb-chip">VIP<span className="sr-only">{disclosure}</span></span>
              <span className="hb-text">
                <span className="hb-name">{item.name}</span>
                <span className="hb-meta">{[item.areaLabelKa, ...item.categories.slice(0, 2).map(category => category.nameKa)].filter(Boolean).join(" · ")}</span>
              </span>
            </Link>
          </li>)}
        </ul>
        {pos.max > 0 ? <>
          <button type="button" className="hb-nav hb-nav--prev" aria-label={text.prev} aria-disabled={pos.index === 0} onClick={() => pos.index > 0 && go(-1)}><ChevronLeft className="size-6" aria-hidden="true" /></button>
          <button type="button" className="hb-nav hb-nav--next" aria-label={text.next} aria-disabled={pos.index >= pos.max} onClick={() => pos.index < pos.max && go(1)}><ChevronRight className="size-6" aria-hidden="true" /></button>
        </> : null}
      </div>
      {pos.max > 0 ? <div className="hb-dots" aria-hidden="true">{Array.from({ length: pos.max + 1 }, (_, index) => <span key={index} className="hb-dot" data-active={index === pos.index} />)}</div> : null}
    </div>
  </section>;
}

/** Hero: brand photo with the search on it. The chip shows real catalog counts and is decoration, hidden from assistive tech. */
function Hero({ categoryCount }: { categoryCount: number }) {
  const { locale } = usePublicLocale();
  const text = ui[locale];
  const [, setLocation] = useLocation();
  const [what, setWhat] = useState("");
  const [where, setWhere] = useState("");
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLocation(marketplaceDiscoveryHref("/salons", undefined, what, where));
  };

  return <section className="cw-container hh" aria-label={text.searchSection}>
    <div className="hh-stage">
      <HeroPhoto className="hh-media"><BrandImg name="hero" width={1600} height={900} eager /></HeroPhoto>
      <div className="hh-copy">
        <HeroIn><h1 className="cw-display">{text.heroTitle}</h1></HeroIn>
        <HeroIn delay={0.08}><p className="cw-lede">{text.heroLede}</p></HeroIn>
      </div>
      <HeroIn delay={0.16} className="hh-formwrap">
        <form onSubmit={submit} className="hm-bar hh-form" role="search" aria-label={text.searchForm}>
          <label className="hm-bar-field">
            <span className="sr-only">{text.what}{text.whatSr}</span>
            <Search className="size-5 shrink-0" aria-hidden="true" />
            <input value={what} onChange={event => setWhat(event.target.value)} placeholder={text.what} maxLength={120} autoComplete="off" enterKeyHint="search" />
          </label>
          <label className="hm-bar-field">
            <span className="sr-only">{text.where}{text.whereSr}</span>
            <MapPin className="size-5 shrink-0" aria-hidden="true" />
            <input value={where} onChange={event => setWhere(event.target.value)} placeholder={text.wherePlaceholder} maxLength={120} list="hm-cities" autoComplete="off" enterKeyHint="search" />
          </label>
          <datalist id="hm-cities">{CITIES.map(city => <option key={city.value} value={city.value} />)}</datalist>
          <button type="submit" className="hm-bar-btn">{text.search}</button>
        </form>
      </HeroIn>
      <div className="hh-chips" aria-hidden="true">
        {categoryCount > 0 ? <Float className="hh-chip-pos">
          <div className="hh-chip">
            <span className="hh-chip-icon"><Sparkles className="size-5" /></span>
            <span><span className="hh-chip-title">{text.chipCategories(categoryCount)} · {text.chipFields(VERTICALS.length)}</span></span>
          </div>
        </Float> : null}
      </div>
    </div>
  </section>;
}

function Zone({ labelledBy, label, tone, children }: { labelledBy?: string; label?: string; tone?: "band"; children: ReactNode }) {
  return <section className="hm-zone" data-tone={tone} aria-labelledby={labelledBy} aria-label={label}>
    <div className="cw-container">{children}</div>
  </section>;
}

function Head({ id, title, note, href }: { id: string; title: string; note?: string; href: string }) {
  const text = ui[usePublicLocale().locale];
  return <RevealGroup className="hm-head">
    <RevealItem>
      <h2 id={id} className="cw-h2">{title}</h2>
      {note ? <p className="hm-note">{note}</p> : null}
    </RevealItem>
    <RevealItem><Link href={href} className="hm-all">{text.viewAll} <ArrowRight className="size-4" aria-hidden="true" /></Link></RevealItem>
  </RevealGroup>;
}

const VERTICAL_ART: Record<Vertical, { photo: string; Icon: LucideIcon }> = {
  beauty: { photo: "cat-hair", Icon: Scissors },
  aesthetics: { photo: "cat-aesthetics", Icon: Sparkles },
  dental: { photo: "cat-dental", Icon: Smile },
};

/** Three large field cards. Same filter behaviour as the old chips: a pressed card filters, pressing again clears. */
function Verticals({ vertical, onVertical, categories }: { vertical: Vertical | null; onVertical: (next: Vertical | null) => void; categories: Category[] }) {
  const { locale } = usePublicLocale();
  const text = ui[locale];
  return <Zone labelledBy="hm-fields-title">
    <div className="hm-head">
      <h2 id="hm-fields-title" className="cw-h2">{text.verticalsTitle}</h2>
      <button type="button" className="hm-vchip" aria-pressed={vertical === null} onClick={() => onVertical(null)}>{text.all}</button>
    </div>
    <RevealGroup className="hv-grid">
      {VERTICALS.map(item => {
        const { photo, Icon } = VERTICAL_ART[item.id];
        const blurb = categories.filter(category => verticalForCategory(category.slug) === item.id).slice(0, 3).map(category => category.nameKa).join(" · ");
        return <RevealItem key={item.id} className="hv-item">
          <button type="button" className="hv-card" aria-pressed={vertical === item.id} style={cssVars({ "--vc-bg": item.bg, "--vc-ink": item.ink })} onClick={() => onVertical(vertical === item.id ? null : item.id)}>
            <Icon className="hv-fallback" aria-hidden="true" />
            <BrandImg name={photo} width={800} height={600} />
            <span className="hv-text">
              <span className="hv-title">{verticalLabel(item.id, locale)}</span>
              {blurb ? <span className="hv-blurb">{blurb}</span> : null}
            </span>
            <span className="hv-check" aria-hidden="true"><Check className="size-4" /></span>
          </button>
        </RevealItem>;
      })}
    </RevealGroup>
  </Zone>;
}

// The eight photo tiles. A tile with `slug` is that category; one with `vertical` links to the first category of that field.
const PHOTO_GROUPS: ReadonlyArray<{ key: string; photo: string; slug?: string; vertical?: Vertical }> = [
  { key: "hair", photo: "cat-hair", slug: "hair" },
  { key: "nails", photo: "cat-nails", slug: "nails" },
  { key: "makeup", photo: "cat-makeup", slug: "makeup" },
  { key: "brows", photo: "cat-brows", slug: "brows-lashes" },
  { key: "massage", photo: "cat-massage", slug: "massage-spa" },
  { key: "barber", photo: "cat-barber", slug: "barber" },
  { key: "aesthetics", photo: "cat-aesthetics", vertical: "aesthetics" },
  { key: "dental", photo: "cat-dental", vertical: "dental" },
];

function Categories({ vertical, categories }: { vertical: Vertical | null; categories: Category[] }) {
  const { locale } = usePublicLocale();
  const text = ui[locale];
  const shown = useMemo(() => categories.filter(category => !vertical || verticalForCategory(category.slug) === vertical), [categories, vertical]);
  const tiles = useMemo(() => PHOTO_GROUPS.flatMap(group => {
    const category = group.slug ? categories.find(item => item.slug === group.slug) : categories.find(item => verticalForCategory(item.slug) === group.vertical);
    const field = group.vertical ?? verticalForCategory(group.slug!);
    if (!category || (vertical && field !== vertical)) return [];
    return [{ key: group.key, photo: group.photo, slug: category.slug, name: group.vertical ? verticalLabel(group.vertical, locale) : category.nameKa, Icon: categoryIcon(category.iconKey) }];
  }), [categories, vertical, locale]);
  // The chip list below the photo tiles only carries categories that have no tile of their own.
  const tiled = new Set(tiles.map(tile => tile.slug));
  const rest = shown.filter(category => !tiled.has(category.slug));
  if (!shown.length) return null;
  return <Zone labelledBy="hm-categories-title">
    <RevealGroup className="hm-head"><RevealItem><h2 id="hm-categories-title" className="cw-h2">{text.categoriesTitle}</h2></RevealItem></RevealGroup>
    {tiles.length ? <RevealGroup as="ul" className="hp-grid">
      {tiles.map(tile => <RevealItem as="li" key={tile.key}>
        <Link href={marketplaceDiscoveryHref("/salons", tile.slug)} className="hp-tile">
          <tile.Icon className="hp-fallback" aria-hidden="true" />
          <BrandImg name={tile.photo} width={800} height={600} />
          <span className="hp-name">{tile.name}</span>
        </Link>
      </RevealItem>)}
    </RevealGroup> : null}
    {rest.length ? <>
    <h3 className="hq-title">{text.allCategories}</h3>
    <ul className="hq">
      {rest.map(category => {
        const Icon = categoryIcon(category.iconKey);
        return <li key={category.id}>
          <Link href={marketplaceDiscoveryHref("/salons", category.slug)} className="hq-chip"><Icon className="size-[18px]" aria-hidden="true" />{category.nameKa}</Link>
        </li>;
      })}
    </ul>
    </> : null}
  </Zone>;
}

function Strip({ id, title, note, items, rail = true }: { id: string; title: string; note?: string; items: Listing[]; rail?: boolean }) {
  if (!items.length) return null;
  return <Zone labelledBy={id}>
    <Head id={id} title={title} note={note} href="/salons" />
    <SalonGrid items={items} rail={rail} reveal />
  </Zone>;
}

function Listings({ items, loading, failed, onRetry, vertical }: { items: Listing[]; loading: boolean; failed: boolean; onRetry: () => void; vertical: Vertical | null }) {
  const { locale } = usePublicLocale();
  const text = ui[locale];
  const verticalName = vertical ? verticalLabel(vertical, locale) : null;
  if (loading) return <Zone label={text.allPlaces}><SalonLoading label={text.loading} /></Zone>;
  if (failed) return <Zone label={text.allPlaces}>
    <div className="cw-notice cw-notice-error" role="alert">
      <p>{text.placesFailed}</p>
      <button type="button" className="cw-btn cw-btn-line mt-3 min-h-11" onClick={onRetry}>{text.retry}</button>
    </div>
  </Zone>;
  if (!items.length) return <Zone label={text.allPlaces}>
    <EmptyCatalog message={vertical === "dental" ? text.emptyDental : verticalName ? text.emptyVertical(verticalName) : text.emptyDefault} />
  </Zone>;
  // Fewer than four places: one plain grid, no strips of one card.
  if (items.length < 4) return <Strip id="hm-all-title" title={text.allPlaces} items={items} rail={false} />;
  const vip = items.filter(item => item.promotion?.tier === "VIP");
  const recommended = items.filter(item => item.promotion?.tier === "RECOMMENDED");
  const fresh = newestListings(items.filter(item => !item.promotion));
  const rest = items.filter(item => !item.promotion && !fresh.includes(item));
  return <>
    <Strip id="hm-vip-title" title={text.vip} note={text.paidNote} items={vip} />
    <Strip id="hm-rec-title" title={text.recommended} note={text.paidNote} items={recommended} />
    <Strip id="hm-new-title" title={text.fresh} items={fresh} />
    <Strip id="hm-all-title" title={text.allPlaces} items={rest} />
  </>;
}

function HowItWorks() {
  const text = ui[usePublicLocale().locale];
  return <Zone labelledBy="hm-how-title">
    <RevealGroup>
      <RevealItem><h2 id="hm-how-title" className="cw-h2">{text.howTitle}</h2></RevealItem>
      <RevealItem><p className="cw-lede mt-2">{text.howLede}</p></RevealItem>
    </RevealGroup>
    <RevealGroup as="ul" className="hm-steps">
      {text.steps.map((step, index) => <RevealItem as="li" key={step.title} className="hm-step">
        <span className="hm-step-n">{index + 1}</span>
        <span><span className="hm-step-title">{step.title}</span><span className="hm-step-text">{step.text}</span></span>
      </RevealItem>)}
    </RevealGroup>
  </Zone>;
}

function Cities() {
  const { locale } = usePublicLocale();
  const text = ui[locale];
  return <Zone labelledBy="hm-cities-title">
    <RevealGroup>
      <RevealItem><h2 id="hm-cities-title" className="cw-h2">{text.citiesTitle}</h2></RevealItem>
      <RevealItem><p className="cw-lede mt-2">{text.citiesLede}</p></RevealItem>
    </RevealGroup>
    <div className="hm-cities">
      <ul>{CITIES.map(city => <li key={city.value}><Link href={marketplaceDiscoveryHref("/salons", undefined, undefined, city.value)} className="hm-city">{locale === "ka" ? city.value : city[locale]}</Link></li>)}</ul>
      <Link href="/salons/map" className="hm-map-link"><MapPin className="size-5" aria-hidden="true" />{text.openMap}</Link>
    </div>
  </Zone>;
}

// Strips render only when the API returned items: no loading frames, no empty boxes.
function VacancyStrip({ vertical }: { vertical: Vertical | null }) {
  const text = ui[usePublicLocale().locale];
  const vip = trpc.vacancies.publicVipList.useQuery({ vertical: vertical ?? undefined, limit: 3 });
  const items = vip.data ?? [];
  if (!items.length) return null;
  return <Zone labelledBy="hm-vacancies-title">
    <Head id="hm-vacancies-title" title={text.vacanciesTitle} href="/vacancies" />
    <ul className="cwx-grid hm-snap">{items.map((item, index) => <li key={item.id}><VacancyTicket item={item} number={index + 1} /></li>)}</ul>
  </Zone>;
}

function ProductStrip({ vertical }: { vertical: Vertical | null }) {
  const text = ui[usePublicLocale().locale];
  const products = trpc.products.publicList.useQuery({ vertical: vertical ?? undefined, limit: 4, offset: 0 });
  const items = products.data?.items ?? [];
  if (!items.length) return null;
  return <Zone labelledBy="hm-products-title">
    <Head id="hm-products-title" title={text.productsTitle} href="/products" />
    <ul className="cwx-grid hm-snap">{items.map(item => <li key={item.id}><ProductCard item={item} /></li>)}</ul>
  </Zone>;
}

const BUSINESS_ICONS = [CalendarCheck, UsersRound, Wallet, Globe];

function BusinessBand() {
  const text = ui[usePublicLocale().locale];
  const [hasPhoto, setHasPhoto] = useState(true);
  return <Zone labelledBy="hm-business-title" tone="band">
    <div className="hm-band" data-photo={hasPhoto}>
      {hasPhoto ? <div className="hm-band-media"><BrandImg name="business" width={1600} height={900} onFail={() => setHasPhoto(false)} /></div> : null}
      <div className="hm-band-body">
        <h2 id="hm-business-title" className="cw-h2">{text.businessTitle}</h2>
        <p className="hm-band-lede">{text.businessLede}</p>
        <div className="hm-band-actions">
          <Link href="/partner" className="hm-band-btn hm-band-btn--fill">{text.management} <ArrowRight className="size-4" aria-hidden="true" /></Link>
          <Link href="/register" className="hm-band-btn hm-band-btn--line">{text.register}</Link>
        </div>
        <ul className="hm-features">
          {text.features.map((item, index) => {
            const Icon = BUSINESS_ICONS[index]!;
            return <li key={item.title}>
              <Icon className="size-6" aria-hidden="true" />
              <p className="hm-feature-title">{item.title}</p>
              <p className="hm-feature-text">{item.text}</p>
            </li>;
          })}
        </ul>
      </div>
    </div>
  </Zone>;
}

export default function Home() {
  const text = ui[usePublicLocale().locale];
  usePublicMeta({ title: text.metaTitle, description: text.metaDescription, canonicalPath: "/" });
  const [vertical, setVertical] = useState<Vertical | null>(null);
  const directory = trpc.marketplace.directory.useQuery({ limit: 24, offset: 0 });
  const categories = (trpc.marketplace.categories.useQuery().data ?? []) as Category[];
  const all = (directory.data?.items ?? []) as Listing[];
  const slides = all.filter(item => item.promotion?.tier === "VIP" && item.coverImageUrl).slice(0, MAX_SLIDES);
  const items = all.filter(item => listingMatchesVertical(item, vertical));

  return <div className="cw">
    <CatalogHeader />
    <main id="main-content" className="hm">
      <div className="hm-top">
        <Hero categoryCount={categories.length} />
        {slides.length ? <Banner items={slides} /> : null}
      </div>
      <div className="hm-zones">
        <Verticals vertical={vertical} onVertical={setVertical} categories={categories} />
        <Categories vertical={vertical} categories={categories} />
        <Listings items={items} loading={directory.isLoading} failed={directory.isError} onRetry={() => directory.refetch()} vertical={vertical} />
        <HowItWorks />
        <Cities />
        <VacancyStrip vertical={vertical} />
        <ProductStrip vertical={vertical} />
        <BusinessBand />
      </div>
    </main>
    <CatalogFooter />
  </div>;
}
