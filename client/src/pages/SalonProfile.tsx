import { CatalogFooter, CatalogHeader } from "@/components/catalog/CatalogChrome";
import { ProductGrid } from "@/components/catalog/Commerce";
import { HeroIn } from "@/components/catalog/HomeMotion";
import { cssVars } from "@/components/catalog/Tickets";
import "@/components/catalog/profile.css";
import { DATE_NAMES, addDaysKey, schemaWeekdayOf } from "@/components/public/BookingPrimitives";
import { usePublicMeta } from "@/components/public/PublicMeta";
import { usePublicLocale, type PublicLocale } from "@/contexts/PublicLocaleContext";
import { formatPhoneDisplay } from "@/lib/phone";
import { formatGelTetri } from "@/lib/presentation";
import { trpc } from "@/lib/trpc";
import { verticalForCategory, verticalStyle, verticalsForListing } from "@/lib/verticals";
import { BRAND } from "@shared/brand";
import { dateKeyInTimeZone } from "@shared/timezones";
import { MAX_SELECTED_SERVICES } from "@shared/validation";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "../../../server/routers";
import { ArrowLeft, ChevronDown, Clock, ExternalLink, Info, Instagram, MapPin, Phone, Search, ShieldCheck, Star } from "lucide-react";
import { type KeyboardEvent, useEffect, useId, useMemo, useRef, useState } from "react";
import { Link, useRoute } from "wouter";

/** The multi-service booking endpoint accepts 2..6 services (shared/validation.ts), so the profile caps selection at 6. */

const copy = {
  ka: {
    crumb: "კატალოგი", loading: "ბიზნესის გვერდი იტვირთება…", unavailable: "ბიზნესის გვერდი დროებით მიუწვდომელია", retry: "შეამოწმე კავშირი და სცადე მოგვიანებით.", retryButton: "ხელახლა ცდა",
    missing: "ბიზნესი ვერ მოიძებნა", missingLead: "ბმული შეიძლება შეიცვალა ან გვერდი აღარ არის ხელმისაწვდომი.", all: "მთელი კატალოგი",
    noDescription: "ბიზნესის აღწერა მალე დაემატება.", bookingPaused: "ონლაინ ჩაწერა ამ ბიზნესისთვის დროებით მიუწვდომელია. ინფორმაცია და საჯარო გვერდი შენარჩუნებულია; დეტალებისთვის დაუკავშირდი ბიზნესს.",
    website: "ვებგვერდი", verified: "დამტკიცებული პროფილი", ad: "რეკლამა", recommended: "რჩეული",
    tabs: "პროფილის განყოფილებები", tabServices: "სერვისები", tabTeam: "გუნდი", tabHours: "სამუშაო საათები", tabProducts: "პროდუქტები", productsTitle: "პროდუქტები", productsNote: "შეძენა ხდება უშუალოდ ბიზნესში; ონლაინ გადახდა არ არის.",
    searchLabel: "მომსახურების ძებნა", searchPlaceholder: "სახელი ან კატეგორია", found: "ნაპოვნია", nothingFound: "ამ მოთხოვნით მომსახურება ვერ მოიძებნა.", minutes: "წთ", noServices: "საჯარო მომსახურებები ჯერ არ არის დამატებული.",
    toggleGroup: "კატეგორიის გახსნა ან დახურვა", limit: `ერთდროულად მაქსიმუმ ${MAX_SELECTED_SERVICES} მომსახურების არჩევა შეგიძლია.`, selectService: "მომსახურების არჩევა",
    team: "გუნდი", specialist: "სპეციალისტი", noTeam: "საჯარო გუნდის პროფილები ჯერ არ არის დამატებული.", experience: "წლის გამოცდილება", bookStaff: "ჩაწერა", nearest: "უახლოესი: {d}, {t}",
    hours: "სამუშაო საათები", hoursNote: "გუნდის გრაფიკის მიხედვით. კონკრეტული დრო ჯავშნისას მოწმდება.", hoursLoading: "სამუშაო საათები იტვირთება…", hoursMissing: "სამუშაო საათები ჯერ არ არის გამოქვეყნებული.", closedDay: "დახურულია",
    openUntil: "ღიაა, იკეტება {t}-ზე", closed: "დაკეტილია", opensAt: "იხსნება {d} {t}-ზე", today: "დღეს", tomorrow: "ხვალ",
    summary: "შენი ჩანაწერი", selected: "არჩეულია", selectedCount: "არჩეულია: {n} სერვისი", total: "ჯამი", duration: "ხანგრძლივობა", nothingSelected: "მომსახურება არ არის არჩეული.",
    from: "{p}-დან", book: "დაჯავშნა", pickTime: "დროის არჩევა", pickService: "აირჩიე სერვისი", recheck: "დრო საბოლოოდ მოწმდება ჩაწერის დადასტურებისას.", unavailableNote: "ონლაინ ჩაწერა დროებით მიუწვდომელია.",
    beforeAfter: "მანამდე / შემდეგ", consent: "აქ ჩანს მხოლოდ კლიენტის ცალკე თანხმობით საჯაროდ გამოქვეყნებული შედეგები.", before: "მანამდე", after: "შემდეგ",
    latest: "ახალი პუბლიკაციები",
    feedbackTitle: "დადასტურებული ვიზიტების უკუკავშირი", feedbackNote: "უკუკავშირს ტოვებს მხოლოდ დასრულებული ვიზიტის კლიენტი; გამოქვეყნებამდე იგი გადის მოდერაციას.",
    days: ["ორშაბათი", "სამშაბათი", "ოთხშაბათი", "ხუთშაბათი", "პარასკევი", "შაბათი", "კვირა"],
    daysAt: ["ორშაბათს", "სამშაბათს", "ოთხშაბათს", "ხუთშაბათს", "პარასკევს", "შაბათს", "კვირას"], dateLocale: "ka-GE",
  },
  en: {
    crumb: "Catalog", loading: "Loading business page…", unavailable: "This business page is temporarily unavailable", retry: "Check your connection and try again later.", retryButton: "Try again",
    missing: "Business not found", missingLead: "The link may have changed or the page is no longer available.", all: "Whole catalog",
    noDescription: "A business description will be added soon.", bookingPaused: "Online booking is temporarily unavailable. The profile remains available; please contact the business for details.",
    website: "Website", verified: "Approved profile", ad: "Advertisement", recommended: "Recommended",
    tabs: "Profile sections", tabServices: "Services", tabTeam: "Team", tabHours: "Opening hours", tabProducts: "Products", productsTitle: "Products", productsNote: "Purchased at the business itself; there is no online checkout.",
    searchLabel: "Search services", searchPlaceholder: "Name or category", found: "Found", nothingFound: "No service matches your search.", minutes: "min", noServices: "No public services have been added yet.",
    toggleGroup: "Expand or collapse category", limit: `You can select up to ${MAX_SELECTED_SERVICES} services at once.`, selectService: "Select service",
    team: "Team", specialist: "Specialist", noTeam: "No public team profiles have been added yet.", experience: "years of experience", bookStaff: "Book", nearest: "Next free: {d}, {t}",
    hours: "Opening hours", hoursNote: "Based on the team's schedules. The exact time is checked when you book.", hoursLoading: "Loading opening hours…", hoursMissing: "Opening hours have not been published yet.", closedDay: "Closed",
    openUntil: "Open, closes at {t}", closed: "Closed", opensAt: "opens {d} at {t}", today: "today", tomorrow: "tomorrow",
    summary: "Your booking", selected: "Selected", selectedCount: "Selected: {n}", total: "Total", duration: "Duration", nothingSelected: "No services selected.",
    from: "From {p}", book: "Book now", pickTime: "Choose a time", pickService: "Choose a service", recheck: "Availability is checked again when the booking is confirmed.", unavailableNote: "Online booking is temporarily unavailable.",
    beforeAfter: "Before / after", consent: "Only results published with a client's separate consent are shown here.", before: "Before", after: "After",
    latest: "Latest posts",
    feedbackTitle: "Feedback from verified visits", feedbackNote: "Only a client with a completed visit can submit feedback, and every submission is moderated before publication.",
    days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
    daysAt: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"], dateLocale: "en-US",
  },
  ru: {
    crumb: "Каталог", loading: "Загрузка страницы…", unavailable: "Страница временно недоступна", retry: "Проверьте подключение и попробуйте позже.", retryButton: "Повторить",
    missing: "Бизнес не найден", missingLead: "Ссылка могла измениться или страница больше не доступна.", all: "Весь каталог",
    noDescription: "Описание будет добавлено позже.", bookingPaused: "Онлайн-запись временно недоступна. Профиль остаётся доступным; свяжитесь с бизнесом для деталей.",
    website: "Сайт", verified: "Одобренный профиль", ad: "Реклама", recommended: "Рекомендуем",
    tabs: "Разделы профиля", tabServices: "Услуги", tabTeam: "Команда", tabHours: "Часы работы", tabProducts: "Товары", productsTitle: "Товары", productsNote: "Покупка — непосредственно в заведении; онлайн-оплаты нет.",
    searchLabel: "Поиск услуг", searchPlaceholder: "Название или категория", found: "Найдено", nothingFound: "По вашему запросу услуг не найдено.", minutes: "мин", noServices: "Публичные услуги ещё не добавлены.",
    toggleGroup: "Развернуть или свернуть категорию", limit: `Одновременно можно выбрать не более ${MAX_SELECTED_SERVICES} услуг.`, selectService: "Выбрать услугу",
    team: "Команда", specialist: "Специалист", noTeam: "Публичные профили команды ещё не добавлены.", experience: "лет опыта", bookStaff: "Записаться", nearest: "Ближайшее: {d}, {t}",
    hours: "Часы работы", hoursNote: "По графикам команды. Точное время проверяется при записи.", hoursLoading: "Загрузка часов работы…", hoursMissing: "Часы работы ещё не опубликованы.", closedDay: "Закрыто",
    openUntil: "Открыто, закрывается в {t}", closed: "Закрыто", opensAt: "откроется {d} в {t}", today: "сегодня", tomorrow: "завтра",
    summary: "Ваша запись", selected: "Выбрано", selectedCount: "Выбрано: {n}", total: "Итого", duration: "Длительность", nothingSelected: "Услуги не выбраны.",
    from: "от {p}", book: "Записаться", pickTime: "Выбрать время", pickService: "Выберите услугу", recheck: "Время окончательно проверяется при подтверждении записи.", unavailableNote: "Онлайн-запись временно недоступна.",
    beforeAfter: "До / после", consent: "Здесь показаны только результаты, опубликованные с отдельного согласия клиента.", before: "До", after: "После",
    latest: "Новые публикации",
    feedbackTitle: "Отзывы подтверждённых визитов", feedbackNote: "Отзыв может оставить только клиент после завершённого визита; каждая публикация проходит модерацию.",
    days: ["Понедельник", "Вторник", "Среда", "Четверг", "Пятница", "Суббота", "Воскресенье"],
    daysAt: ["в понедельник", "во вторник", "в среду", "в четверг", "в пятницу", "в субботу", "в воскресенье"], dateLocale: "ru-RU",
  },
} as const;

type Copy = (typeof copy)[PublicLocale];
type ProfileData = NonNullable<inferRouterOutputs<AppRouter>["public"]["salonProfile"]>;
type WorkingHour = { weekday: number; startLocalTime: string; endLocalTime: string };

const fill = (template: string, values: Record<string, string>) => template.replace(/\{(\w+)\}/g, (_, key: string) => values[key] ?? "");

/* ---------- Working hours (weekday 0 = Monday, as stored by the server) ---------- */

const WEEKDAY_BY_SHORT: Record<string, number> = { Mon: 0, Tue: 1, Wed: 2, Thu: 3, Fri: 4, Sat: 5, Sun: 6 };
const toMinutes = (value: string) => { const [h = "0", m = "0"] = value.split(":"); return Number(h) * 60 + Number(m); };
const hhmm = (value: string) => value.slice(0, 5);

/** Weekday (Mon = 0) and minutes since midnight in the location's IANA timezone; null for an invalid zone. */
export function localWeekdayMinutes(now: Date, timeZone: string): { weekday: number; minutes: number } | null {
  try {
    const parts = new Intl.DateTimeFormat("en-US", { timeZone, weekday: "short", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(now);
    const weekday = WEEKDAY_BY_SHORT[parts.find(part => part.type === "weekday")?.value ?? ""];
    const hour = Number(parts.find(part => part.type === "hour")?.value);
    const minute = Number(parts.find(part => part.type === "minute")?.value);
    if (weekday === undefined || !Number.isFinite(hour) || !Number.isFinite(minute)) return null;
    return { weekday, minutes: (hour % 24) * 60 + minute };
  } catch {
    return null;
  }
}

export type OpenStatus = { open: true; closesAt: string } | { open: false; next: { daysAhead: number; weekday: number; time: string } | null };

/** Open/closed right now, from the published working hours. Returns null when the data cannot answer truthfully. */
export function openStatus(hours: ReadonlyArray<WorkingHour>, timeZone: string, now: Date): OpenStatus | null {
  if (!hours.length) return null;
  const local = localWeekdayMinutes(now, timeZone);
  if (!local) return null;
  const today = hours.find(hour => hour.weekday === local.weekday);
  if (today && local.minutes >= toMinutes(today.startLocalTime) && local.minutes < toMinutes(today.endLocalTime)) return { open: true, closesAt: hhmm(today.endLocalTime) };
  for (let ahead = 0; ahead <= 7; ahead += 1) {
    const weekday = (local.weekday + ahead) % 7;
    const day = hours.find(hour => hour.weekday === weekday);
    if (!day) continue;
    if (ahead === 0 && local.minutes >= toMinutes(day.startLocalTime)) continue;
    return { open: false, next: { daysAhead: ahead, weekday, time: hhmm(day.startLocalTime) } };
  }
  return { open: false, next: null };
}

/* ---------- Booking link ---------- */

/** Service IDs on this page are `services.id`, the same IDs `public.bookingCatalog` returns as `catalog[].service.id`. */
export function bookingHref(slug: string, serviceIds: ReadonlyArray<string>) {
  const base = `/book/${slug}`;
  return serviceIds.length ? `${base}?services=${serviceIds.map(encodeURIComponent).join(",")}` : base;
}

/** Team card link: the booking flow preselects the specialist from ?staff=. */
export function staffBookingHref(slug: string, staffProfileId: string) {
  return `/book/${slug}?staff=${encodeURIComponent(staffProfileId)}`;
}

/* ---------- Page ---------- */

export default function SalonProfile() {
  const [, params] = useRoute("/salon/:slug");
  const slug = params?.slug ?? "";
  const { locale } = usePublicLocale();
  const ui = copy[locale];
  const profile = trpc.public.salonProfile.useQuery(slug, { enabled: Boolean(slug) });
  const marketplace = trpc.marketplace.listingBySlug.useQuery(slug, { enabled: Boolean(slug) });

  usePublicMeta({
    title: profile.data ? `${profile.data.salon.name} | ${BRAND.name}` : `ბიზნესის პროფილი | ${BRAND.name}`,
    description: profile.data?.salon.publicDescription || "დამტკიცებული ბიზნესის საჯარო პროფილი: მომსახურებები, გუნდი, სამუშაო საათები და ონლაინ ჩაწერა.",
    canonicalPath: `/salon/${slug}`,
  });

  let body: React.ReactNode;
  if (profile.isLoading) body = <StateBlock role="status" title={ui.loading} loading />;
  else if (profile.isError) body = <StateBlock role="alert" title={ui.unavailable} lead={ui.retry} action={<button type="button" className="cwp-btn cwp-btn-line" onClick={() => void profile.refetch()}>{ui.retryButton}</button>} />;
  else if (!profile.data) body = <StateBlock title={ui.missing} lead={ui.missingLead} action={<Link href="/salons" className="cwp-btn cwp-btn-primary">{ui.all}</Link>} />;
  else body = <ProfileView data={profile.data} slug={slug} ui={ui} locale={locale} categories={marketplace.data?.categories ?? []} promotion={marketplace.data?.promotion ?? null} approved={Boolean(marketplace.data)} />;

  return <div className="cw">
    <CatalogHeader />
    <main id="main-content">{body}</main>
    <CatalogFooter />
  </div>;
}

function StateBlock({ title, lead, action, role, loading }: { title: string; lead?: string; action?: React.ReactNode; role?: "status" | "alert"; loading?: boolean }) {
  return <div className="cwp">
    <div className="cw-container py-12 sm:py-20">
      <div className="cwp-state mx-auto" role={role} aria-busy={loading || undefined}>
        <h1 className="cwp-state-title">{title}</h1>
        {loading ? <div className="cwp-skeleton" aria-hidden="true" /> : null}
        {lead ? <p className="cwp-muted mt-2">{lead}</p> : null}
        {action ? <div className="mt-5">{action}</div> : null}
      </div>
    </div>
  </div>;
}

type ProfileViewProps = {
  data: ProfileData;
  slug: string;
  ui: Copy;
  locale: PublicLocale;
  categories: ReadonlyArray<{ id: string; slug: string; nameKa: string }>;
  promotion: { tier: string; disclosure: string | null } | null;
  approved: boolean;
};

type TabKey = "services" | "team" | "hours" | "products";

function ProfileView({ data, slug, ui, locale, categories, promotion, approved }: ProfileViewProps) {
  const { salon, services, team, feed, gallery, feedback } = data;
  const social = salon.socialLinks ?? {};
  const bookable = salon.bookingEnabled;
  const lead = verticalsForListing(categories)[0];
  const tone = lead ? verticalStyle(lead) : null;
  const catalog = trpc.public.bookingCatalog.useQuery(slug, { enabled: bookable && Boolean(slug) });
  const products = trpc.products.byLocation.useQuery({ publicSlug: slug }, { enabled: Boolean(slug) }).data ?? [];
  const workingHours = catalog.data?.location.workingHours ?? [];
  const timezone = catalog.data?.location.timezone ?? "";

  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(timer);
  }, []);
  const status = useMemo(() => openStatus(workingHours, timezone, now), [workingHours, timezone, now]);

  const [selected, setSelected] = useState<ReadonlySet<string>>(() => new Set());
  const toggle = (id: string) => setSelected(current => {
    const next = new Set(current);
    if (next.has(id)) next.delete(id);
    else if (next.size < MAX_SELECTED_SERVICES) next.add(id);
    return next;
  });
  const chosen = services.filter(service => selected.has(service.id));
  const chosenIds = chosen.map(service => service.id);
  const total = chosen.reduce((sum, service) => sum + service.priceTetri, 0);
  const minutes = chosen.reduce((sum, service) => sum + service.durationMinutes, 0);
  const anyFrom = chosen.some(service => service.isFromPrice);
  const href = bookingHref(salon.publicSlug, chosenIds);

  // Nearest free day for the chosen services (any specialist), in the location's calendar. Server-computed; display only.
  const today = useMemo(() => (timezone ? dateKeyInTimeZone(new Date(), timezone) : ""), [timezone]);
  const nearest = trpc.public.availabilityDays.useQuery(
    { slug, serviceIds: chosenIds, staffProfileId: "ANY_AVAILABLE", fromDate: today, days: 7 },
    { enabled: bookable && chosenIds.length > 0 && Boolean(slug) && Boolean(today) },
  );
  const nextFree = chosenIds.length ? nearest.data?.days.find(day => day.slotCount > 0 && day.firstLabel) : undefined;
  const nearestText = nextFree?.firstLabel
    ? fill(ui.nearest, { d: nextFree.date === today ? ui.today : nextFree.date === addDaysKey(today, 1) ? ui.tomorrow : DATE_NAMES[locale].weekdayShort[schemaWeekdayOf(nextFree.date)]!, t: nextFree.firstLabel })
    : "";
  const money = (tetri: number, from = false) => from ? fill(ui.from, { p: formatGelTetri(tetri) }) : formatGelTetri(tetri);
  const totalLabel = chosen.length ? money(total, anyFrom) : "";
  // With nothing chosen the booking button waits for a service; a business without public services still links to the flow.
  const needsService = services.length > 0 && chosen.length === 0;

  const mark = salon.name.trim().charAt(0).toLocaleUpperCase() || "•";
  const tabIds = useId();
  const tabKeys: TabKey[] = products.length ? ["services", "team", "hours", "products"] : ["services", "team", "hours"];
  const [tab, setTab] = useState<TabKey>("services");
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const tabLabels: Record<TabKey, string> = { services: ui.tabServices, team: ui.tabTeam, hours: ui.tabHours, products: ui.tabProducts };
  const onTabKey = (event: KeyboardEvent<HTMLButtonElement>) => {
    const index = tabKeys.indexOf(tab);
    const target = event.key === "ArrowRight" ? (index + 1) % tabKeys.length : event.key === "ArrowLeft" ? (index + tabKeys.length - 1) % tabKeys.length : event.key === "Home" ? 0 : event.key === "End" ? tabKeys.length - 1 : null;
    if (target === null) return;
    event.preventDefault();
    const key = tabKeys[target]!;
    setTab(key);
    tabRefs.current[key]?.focus();
  };

  const statusText = status ? status.open
    ? fill(ui.openUntil, { t: status.closesAt })
    : status.next
      ? `${ui.closed}, ${fill(ui.opensAt, { d: status.next.daysAhead === 0 ? ui.today : status.next.daysAhead === 1 ? ui.tomorrow : ui.daysAt[status.next.weekday]!, t: status.next.time })}`
      : ui.closed
    : null;

  const sheetVars = cssVars(tone ? { "--v-bg": tone.bg, "--v-ink": tone.ink } : {});
  const hasAddress = Boolean(salon.address);
  const selectedCount = fill(ui.selectedCount, { n: String(chosen.length) });

  return <div className="cwp" style={sheetVars}>
    <div className="cwp-hero" data-cover={Boolean(salon.coverImageUrl)}>
      {salon.coverImageUrl
        ? <img src={salon.coverImageUrl} alt={salon.coverImageAltKa || ""} className="cwp-cover" />
        : <div className="cwp-tint" aria-hidden="true"><span className="cwp-mark">{mark}</span></div>}
      <Link href="/salons" className="cwp-back" aria-label={ui.crumb}><ArrowLeft className="size-5" aria-hidden="true" /></Link>
    </div>

    <section className="cw-container cwp-intro" aria-labelledby="profile-title">
      <HeroIn><h1 id="profile-title" className="cwp-title">{salon.name}</h1></HeroIn>
      <div className="cwp-badges">
        {status && statusText ? <span className="cwp-status" data-open={status.open}><Clock className="size-4 shrink-0" aria-hidden="true" />{statusText}</span> : null}
        {approved ? <span className="cwp-badge"><ShieldCheck className="size-4" aria-hidden="true" />{ui.verified}</span> : null}
        {promotion ? <span className="inline-flex flex-wrap items-center gap-2"><span className="cwp-badge cwp-badge-accent">{promotion.tier === "VIP" ? "VIP" : promotion.tier === "RECOMMENDED" ? ui.recommended : ui.ad}</span>{promotion.disclosure ? <span className="cwp-muted text-sm">{promotion.disclosure}</span> : null}</span> : null}
      </div>
      <HeroIn delay={0.08}><p className="cwp-lede">{salon.publicDescription || ui.noDescription}</p></HeroIn>
      {categories.length ? <ul className="cwp-chips" aria-label={ui.tabServices}>{categories.map(category => {
        const style = verticalStyle(verticalForCategory(category.slug));
        return <li key={category.id}><span className="cwp-chip" style={cssVars({ "--chip-bg": style.bg, "--chip-ink": style.ink })}>{category.nameKa}</span></li>;
      })}</ul> : null}
      <ul className="cwp-contact">
        {hasAddress ? <li><MapPin className="size-4 shrink-0" aria-hidden="true" /><span>{salon.address}</span></li> : null}
        {salon.phone ? <li><Phone className="size-4 shrink-0" aria-hidden="true" /><a href={`tel:${salon.phone}`} className="cwp-tel cw-num">{formatPhoneDisplay(salon.phone)}</a></li> : null}
        {social.instagram ? <li><Instagram className="size-4 shrink-0" aria-hidden="true" /><a href={social.instagram} target="_blank" rel="noreferrer">Instagram<span className="sr-only"> ↗</span></a></li> : null}
        {social.website ? <li><ExternalLink className="size-4 shrink-0" aria-hidden="true" /><a href={social.website} target="_blank" rel="noreferrer">{ui.website}<span className="sr-only"> ↗</span></a></li> : null}
      </ul>
      {!bookable ? <p className="cwp-notice" role="status"><Info className="size-5 shrink-0" aria-hidden="true" />{ui.bookingPaused}</p> : null}
    </section>

    <div className="cw-container cwp-layout">
      <div className="min-w-0">
        <div role="tablist" aria-label={ui.tabs} className="cwp-tablist">
          {tabKeys.map(key => <button key={key} ref={element => { tabRefs.current[key] = element; }} type="button" role="tab" id={`${tabIds}-tab-${key}`} aria-selected={tab === key} aria-controls={`${tabIds}-panel-${key}`} tabIndex={tab === key ? 0 : -1} className="cwp-tab" onClick={() => setTab(key)} onKeyDown={onTabKey}>{tabLabels[key]}</button>)}
        </div>

        {tabKeys.map(key => <div key={key} role="tabpanel" id={`${tabIds}-panel-${key}`} aria-labelledby={`${tabIds}-tab-${key}`} hidden={tab !== key} tabIndex={0} className="cwp-panel">
          {key !== "hours" ? <h2 className="sr-only">{tabLabels[key]}</h2> : null}
          {key === "services" ? <ServicesPanel services={services} selected={selected} onToggle={toggle} bookable={bookable} ui={ui} money={money} /> : null}
          {key === "team" ? <TeamPanel team={team} ui={ui} slug={slug} bookable={bookable} /> : null}
          {key === "hours" ? <HoursPanel ui={ui} bookable={bookable} loading={catalog.isLoading} failed={catalog.isError} hours={workingHours} timezone={timezone} now={now} /> : null}
          {key === "products" ? (products.length ? <section aria-label={ui.productsTitle}>
            <p className="cwp-muted mb-4 max-w-2xl text-sm">{ui.productsNote}</p>
            <ProductGrid items={products} />
          </section> : null) : null}
        </div>)}

        {feedback.length ? <section className="cwp-block" aria-labelledby="feedback-title">
          <h2 id="feedback-title" className="cwp-h2">{ui.feedbackTitle}</h2>
          <p className="cwp-muted mt-2 max-w-2xl text-sm">{ui.feedbackNote}</p>
          <ul className="mt-4 grid gap-3 md:grid-cols-2">{feedback.map(item => <li key={item.id} className="cwp-card p-4">
            <div className="flex items-center justify-between gap-3"><p className="font-bold">{item.authorName}</p><p className="cw-num inline-flex items-center gap-1 text-sm font-semibold"><Star className="size-4 fill-current" aria-hidden="true" /><span aria-label={`${item.rating} / 5`}>{item.rating}/5</span></p></div>
            <p className="mt-3 text-sm leading-6">{item.comment}</p>
            <p className="cw-num cwp-muted mt-3 text-xs">{new Intl.DateTimeFormat(ui.dateLocale, { day: "numeric", month: "long", year: "numeric" }).format(new Date(item.submittedAt))}</p>
          </li>)}</ul>
        </section> : null}

        {gallery.length ? <section className="cwp-block" aria-labelledby="results-title">
          <h2 id="results-title" className="cwp-h2">{ui.beforeAfter}</h2>
          <p className="cwp-muted mt-2 text-sm">{ui.consent}</p>
          <ul className="mt-4 grid gap-3 md:grid-cols-2">{gallery.map(item => <li key={item.id} className="cwp-card overflow-hidden"><div className="grid grid-cols-2">
            {item.before ? <figure><img src={item.before.mediaUrl} alt={item.before.altTextKa || ui.before} className="aspect-square w-full object-cover" loading="lazy" /><figcaption className="px-3 py-2 text-sm font-semibold">{ui.before}</figcaption></figure> : null}
            {item.after ? <figure><img src={item.after.mediaUrl} alt={item.after.altTextKa || ui.after} className="aspect-square w-full object-cover" loading="lazy" /><figcaption className="px-3 py-2 text-sm font-semibold">{ui.after}</figcaption></figure> : null}
          </div></li>)}</ul>
        </section> : null}

        {feed.length ? <section className="cwp-block" aria-labelledby="feed-title">
          <h2 id="feed-title" className="cwp-h2">{ui.latest}</h2>
          <ul className="mt-4 columns-1 gap-3 sm:columns-2">{feed.map(post => <li key={post.id} className="cwp-card mb-3 break-inside-avoid overflow-hidden">
            <img src={post.mediaUrl} alt={post.altTextKa} className="w-full object-cover" loading="lazy" />
            {post.titleKa || post.captionKa ? <div className="p-4">{post.titleKa ? <h3 className="font-bold">{post.titleKa}</h3> : null}{post.captionKa ? <p className="cwp-muted mt-2 text-sm leading-6">{post.captionKa}</p> : null}</div> : null}
          </li>)}</ul>
        </section> : null}
      </div>

      <aside aria-label={ui.summary} className="cwp-aside-wrap">
        <div className="cwp-aside">
          <h2 className="cwp-aside-title">{ui.summary}</h2>
          {bookable ? <div className="grid gap-3">
            {chosen.length ? <ul className="cwp-picked">{chosen.map(service => <li key={service.id}><span className="min-w-0">{service.nameKa}</span><span className="cwp-price">{money(service.priceTetri, service.isFromPrice)}</span></li>)}</ul>
              : <p className="cwp-muted text-sm leading-6">{ui.nothingSelected}</p>}
            {chosen.length ? <dl className="cwp-totals" aria-live="polite" aria-atomic="true">
              <dt className="cwp-muted">{selectedCount}</dt><dd className="cw-num text-right">{minutes} {ui.minutes}</dd>
              <dt className="font-bold">{ui.total}</dt><dd className="cwp-price text-right text-lg">{totalLabel}</dd>
            </dl> : null}
            {chosen.length && nearestText ? <p className="cwp-nearest">{nearestText}</p> : null}
            {needsService
              ? <button type="button" className="cwp-btn cwp-btn-primary w-full" disabled>{ui.pickService}</button>
              : <Link href={href} className="cwp-btn cwp-btn-primary w-full">{services.length ? ui.pickTime : ui.book}</Link>}
            <p className="cwp-muted text-sm leading-5">{ui.recheck}</p>
          </div> : <p className="cwp-muted text-sm leading-6">{ui.unavailableNote}</p>}
        </div>
      </aside>
    </div>

    {bookable ? <div className="cwp-bar" role="region" aria-label={ui.summary}>
      {chosen.length ? <div className="min-w-0" aria-live="polite" aria-atomic="true">
        <p className="cwp-bar-count">{selectedCount}</p>
        <p className="cwp-bar-total">{totalLabel}</p>
        {nearestText ? <p className="cwp-bar-nearest">{nearestText}</p> : null}
      </div> : null}
      {needsService
        ? <button type="button" className="cwp-btn cwp-btn-primary cwp-bar-cta" disabled>{ui.pickService}</button>
        : <Link href={href} className="cwp-btn cwp-btn-primary cwp-bar-cta">{services.length ? ui.pickTime : ui.book}</Link>}
    </div> : null}
  </div>;
}

/* ---------- Services ---------- */

type ServiceRow = ProfileData["services"][number];

function ServicesPanel({ services, selected, onToggle, bookable, ui, money }: { services: ServiceRow[]; selected: ReadonlySet<string>; onToggle: (id: string) => void; bookable: boolean; ui: Copy; money: (tetri: number, from?: boolean) => string }) {
  const [query, setQuery] = useState("");
  const [collapsed, setCollapsed] = useState<ReadonlySet<string>>(() => new Set());
  const searchId = useId();
  const needle = query.trim().toLowerCase();
  const visible = needle ? services.filter(service => `${service.nameKa} ${service.categoryNameKa} ${service.description ?? ""}`.toLowerCase().includes(needle)) : services;
  const groups = useMemo(() => {
    const byCategory = new Map<string, ServiceRow[]>();
    for (const service of visible) byCategory.set(service.categoryNameKa, [...(byCategory.get(service.categoryNameKa) ?? []), service]);
    return Array.from(byCategory.entries());
  }, [visible]);
  const atLimit = selected.size >= MAX_SELECTED_SERVICES;
  const toggleGroup = (name: string) => setCollapsed(current => { const next = new Set(current); if (next.has(name)) next.delete(name); else next.add(name); return next; });

  if (!services.length) return <p className="cwp-empty">{ui.noServices}</p>;

  return <div>
    <div className="cwp-search">
      <label className="cwp-label" htmlFor={searchId}>{ui.searchLabel}</label>
      <span className="cwp-search-box"><Search className="size-5 shrink-0" aria-hidden="true" /><input id={searchId} type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder={ui.searchPlaceholder} autoComplete="off" /></span>
    </div>
    <p className="cw-num cwp-muted min-h-5 pt-2 text-sm" role="status">{needle ? `${ui.found}: ${visible.length}` : ""}</p>
    {bookable && atLimit ? <p className="mb-3 text-sm font-semibold" role="status">{ui.limit}</p> : null}
    {!visible.length ? <p className="cwp-empty">{ui.nothingFound}</p> : null}
    {groups.map(([name, rows], groupIndex) => {
      const open = Boolean(needle) || !collapsed.has(name);
      const panelId = `${searchId}-group-${groupIndex}`;
      return <section key={name} className="cwp-group" aria-label={name}>
        <h3 className="m-0">
          <button type="button" className="cwp-group-head" aria-expanded={open} aria-controls={panelId} onClick={() => toggleGroup(name)} title={ui.toggleGroup}>
            <span className="min-w-0">{name}</span>
            <span className="flex items-center gap-2"><span className="cw-num cwp-muted text-sm">{rows.length}</span><ChevronDown className="cwp-chevron size-5" aria-hidden="true" /></span>
          </button>
        </h3>
        {open ? <div id={panelId}>{rows.map(service => {
          const isSelected = selected.has(service.id);
          const blocked = !isSelected && atLimit;
          const inner = <>
            <span className="min-w-0">
              <span className="cwp-svc-name">{service.nameKa}</span>
              {service.description ? <span className="cwp-svc-meta">{service.description}</span> : null}
              <span className="cw-num cwp-svc-meta">{service.durationMinutes} {ui.minutes}</span>
            </span>
            <span className="cwp-price">{money(service.priceTetri, service.isFromPrice)}</span>
          </>;
          return bookable
            ? <label key={service.id} className="cwp-svc" data-static="false" data-selected={isSelected} data-disabled={blocked}>
              <input type="checkbox" className="cwp-check" checked={isSelected} disabled={blocked} onChange={() => onToggle(service.id)} aria-label={`${ui.selectService}: ${service.nameKa}`} />
              {inner}
            </label>
            : <div key={service.id} className="cwp-svc" data-static="true" data-selected="false">{inner}</div>;
        })}</div> : null}
      </section>;
    })}
  </div>;
}

/* ---------- Team ---------- */

function TeamPanel({ team, ui, slug, bookable }: { team: ProfileData["team"]; ui: Copy; slug: string; bookable: boolean }) {
  if (!team.length) return <p className="cwp-empty">{ui.noTeam}</p>;
  return <ul className="grid gap-3 sm:grid-cols-2">{team.map(member => <li key={member.id} className="cwp-card p-4">
    <div className="flex items-center gap-4">
      {member.avatarUrl
        ? <img src={member.avatarUrl} alt={member.avatarAltKa || ""} className="cwp-avatar" loading="lazy" />
        : <span className="cwp-avatar" aria-hidden="true">{member.name.trim().charAt(0).toLocaleUpperCase() || "•"}</span>}
      <div className="min-w-0"><h3 className="text-lg font-bold leading-6">{member.name}</h3><p className="cwp-muted text-sm">{member.jobTitle || member.specialty || ui.specialist}</p></div>
    </div>
    {member.bio ? <p className="mt-3 text-sm leading-6">{member.bio}</p> : null}
    {member.experienceYears ? <p className="mt-3 text-sm font-semibold"><span className="cw-num">{member.experienceYears}</span> {ui.experience}</p> : null}
    {bookable ? <Link href={staffBookingHref(slug, member.id)} className="cwp-btn cwp-btn-line mt-4 w-full" aria-label={`${ui.bookStaff}: ${member.name}`}>{ui.bookStaff}</Link> : null}
  </li>)}</ul>;
}

/* ---------- Hours ---------- */

function HoursPanel({ ui, bookable, loading, failed, hours, timezone, now }: { ui: Copy; bookable: boolean; loading: boolean; failed: boolean; hours: WorkingHour[]; timezone: string; now: Date }) {
  if (bookable && loading) return <p className="cwp-empty" role="status">{ui.hoursLoading}</p>;
  if (!bookable || failed || !hours.length) return <p className="cwp-empty">{ui.hoursMissing}</p>;
  const today = localWeekdayMinutes(now, timezone)?.weekday;
  return <div>
    <div className="cwp-card overflow-hidden">
      <h2 className="cwp-hours-head">{ui.hours}</h2>
      <ul>{ui.days.map((day, weekday) => {
        const rule = hours.find(hour => hour.weekday === weekday);
        return <li key={day} className="cwp-hours-row" aria-current={today === weekday ? "date" : undefined}>
          <span>{day}</span>
          <span className="cw-num">{rule ? `${hhmm(rule.startLocalTime)}–${hhmm(rule.endLocalTime)}` : ui.closedDay}</span>
        </li>;
      })}</ul>
    </div>
    <p className="cwp-muted mt-3 text-sm">{ui.hoursNote}</p>
  </div>;
}
