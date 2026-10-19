import { CatalogFooter, CatalogHeader } from "@/components/catalog/CatalogChrome";
import { ProductGrid } from "@/components/catalog/Commerce";
import { cssVars } from "@/components/catalog/Tickets";
import "@/components/catalog/profile.css";
import { usePublicMeta } from "@/components/public/PublicMeta";
import { usePublicLocale, type PublicLocale } from "@/contexts/PublicLocaleContext";
import { formatGelTetri } from "@/lib/presentation";
import { trpc } from "@/lib/trpc";
import { verticalForCategory, verticalStyle, verticalsForListing } from "@/lib/verticals";
import { BRAND } from "@shared/brand";
import { MAX_SELECTED_SERVICES } from "@shared/validation";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "../../../server/routers";
import { ArrowLeft, ArrowRight, ChevronDown, ExternalLink, Instagram, MapPin, Phone, Search, ShieldCheck, Star } from "lucide-react";
import { type KeyboardEvent, useEffect, useId, useMemo, useRef, useState } from "react";
import { Link, useRoute } from "wouter";

/** The multi-service booking endpoint accepts 2..6 services (shared/validation.ts), so the profile caps selection at 6. */

const copy = {
  ka: {
    crumb: "კატალოგი", loading: "ბიზნესის გვერდი იტვირთება…", unavailable: "ბიზნესის გვერდი დროებით მიუწვდომელია", retry: "შეამოწმეთ კავშირი და სცადეთ მოგვიანებით.", retryButton: "ხელახლა ცდა",
    missing: "ბიზნესი ვერ მოიძებნა", missingLead: "ბმული შეიძლება შეიცვალა ან გვერდი აღარ არის ხელმისაწვდომი.", all: "მთელი კატალოგი",
    noDescription: "ბიზნესის აღწერა მალე დაემატება.", bookingPaused: "ონლაინ ჩაწერა ამ ბიზნესისთვის დროებით მიუწვდომელია. ინფორმაცია და საჯარო გვერდი შენარჩუნებულია; დეტალებისთვის დაუკავშირდით ბიზნესს.",
    website: "ვებგვერდი", verified: "დამტკიცებული პროფილი", ad: "რეკლამა", recommended: "რჩეული",
    tabs: "პროფილის განყოფილებები", tabServices: "სერვისები", tabTeam: "გუნდი", tabHours: "სამუშაო საათები", productsTitle: "პროდუქტები", productsNote: "შეძენა ხდება უშუალოდ ბიზნესში; ონლაინ გადახდა არ არის.",
    searchLabel: "მომსახურების ძებნა", searchPlaceholder: "სახელი ან კატეგორია", found: "ნაპოვნია", nothingFound: "ამ მოთხოვნით მომსახურება ვერ მოიძებნა.", minutes: "წთ", noServices: "საჯარო მომსახურებები ჯერ არ არის დამატებული.",
    toggleGroup: "კატეგორიის გახსნა ან დახურვა", limit: `ერთდროულად მაქსიმუმ ${MAX_SELECTED_SERVICES} მომსახურების არჩევა შეგიძლიათ.`, selectService: "მომსახურების არჩევა",
    team: "გუნდი", specialist: "სპეციალისტი", noTeam: "საჯარო გუნდის პროფილები ჯერ არ არის დამატებული.", experience: "წლის გამოცდილება",
    hours: "სამუშაო საათები", hoursNote: "გუნდის გრაფიკის მიხედვით. კონკრეტული დრო ჯავშნისას მოწმდება.", hoursLoading: "სამუშაო საათები იტვირთება…", hoursMissing: "სამუშაო საათები ჯერ არ არის გამოქვეყნებული.", closedDay: "დახურულია",
    openUntil: "ღიაა · {t}-მდე", closed: "დაკეტილია", opensAt: "იხსნება: {d} {t}", today: "დღეს", tomorrow: "ხვალ",
    summary: "თქვენი ჩანაწერი", address: "მისამართი", phone: "ტელეფონი", selected: "არჩეულია", total: "ჯამი", duration: "ხანგრძლივობა", pickHint: "აირჩიეთ მომსახურება", nothingSelected: "მომსახურება არ არის არჩეული. მომსახურებებს ჯავშნის გვერდზეც აირჩევთ.",
    from: "{p}-დან", book: "დაჯავშნა", continue: "გაგრძელება", recheck: "დრო საბოლოოდ მოწმდება ჩაწერის დადასტურებისას.", call: "დარეკვა", unavailableNote: "ონლაინ ჩაწერა დროებით მიუწვდომელია.",
    results: "დადასტურებული შედეგები", beforeAfter: "მანამდე / შემდეგ", consent: "აქ ჩანს მხოლოდ კლიენტის ცალკე თანხმობით საჯაროდ გამოქვეყნებული შედეგები.", before: "მანამდე", after: "შემდეგ",
    diary: "დღიური", latest: "ახალი პუბლიკაციები", soonStamp: "მალე", soon: "ბიზნესის ვიზუალური ამბები მალე დაემატება.", approved: "ამ გვერდზე გამოჩნდება მხოლოდ მფლობელის ან მენეჯერის მიერ დამტკიცებული საჯარო მასალა.",
    feedback: "შეფასებები", feedbackTitle: "დადასტურებული ვიზიტების უკუკავშირი", feedbackNote: "უკუკავშირს ტოვებს მხოლოდ დასრულებული ვიზიტის კლიენტი; გამოქვეყნებამდე იგი გადის მოდერაციას.", noFeedback: "დამტკიცებული შეფასებები ჯერ არ გამოჩენილა.",
    days: ["ორშაბათი", "სამშაბათი", "ოთხშაბათი", "ხუთშაბათი", "პარასკევი", "შაბათი", "კვირა"], dateLocale: "ka-GE",
  },
  en: {
    crumb: "Catalog", loading: "Loading business page…", unavailable: "This business page is temporarily unavailable", retry: "Check your connection and try again later.", retryButton: "Try again",
    missing: "Business not found", missingLead: "The link may have changed or the page is no longer available.", all: "Whole catalog",
    noDescription: "A business description will be added soon.", bookingPaused: "Online booking is temporarily unavailable. The profile remains available; please contact the business for details.",
    website: "Website", verified: "Approved profile", ad: "Advertisement", recommended: "Recommended",
    tabs: "Profile sections", tabServices: "Services", tabTeam: "Team", tabHours: "Opening hours", productsTitle: "Products", productsNote: "Purchased at the business itself; there is no online checkout.",
    searchLabel: "Search services", searchPlaceholder: "Name or category", found: "Found", nothingFound: "No service matches your search.", minutes: "min", noServices: "No public services have been added yet.",
    toggleGroup: "Expand or collapse category", limit: `You can select up to ${MAX_SELECTED_SERVICES} services at once.`, selectService: "Select service",
    team: "Team", specialist: "Specialist", noTeam: "No public team profiles have been added yet.", experience: "years of experience",
    hours: "Opening hours", hoursNote: "Based on the team's schedules. The exact time is checked when you book.", hoursLoading: "Loading opening hours…", hoursMissing: "Opening hours have not been published yet.", closedDay: "Closed",
    openUntil: "Open · until {t}", closed: "Closed", opensAt: "Opens: {d} {t}", today: "today", tomorrow: "tomorrow",
    summary: "Your booking", address: "Address", phone: "Phone", selected: "Selected", total: "Total", duration: "Duration", pickHint: "Choose services", nothingSelected: "No services selected. You can also choose services on the booking page.",
    from: "From {p}", book: "Book now", continue: "Continue", recheck: "Availability is checked again when the booking is confirmed.", call: "Call", unavailableNote: "Online booking is temporarily unavailable.",
    results: "Approved results", beforeAfter: "Before / after", consent: "Only results published with a client's separate consent are shown here.", before: "Before", after: "After",
    diary: "Journal", latest: "Latest posts", soonStamp: "Soon", soon: "Visual stories from this business will be added soon.", approved: "Only public material approved by the owner or manager is shown on this page.",
    feedback: "Feedback", feedbackTitle: "Feedback from verified visits", feedbackNote: "Only a client with a completed visit can submit feedback, and every submission is moderated before publication.", noFeedback: "No approved feedback has been published yet.",
    days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"], dateLocale: "en-US",
  },
  ru: {
    crumb: "Каталог", loading: "Загрузка страницы…", unavailable: "Страница временно недоступна", retry: "Проверьте подключение и попробуйте позже.", retryButton: "Повторить",
    missing: "Бизнес не найден", missingLead: "Ссылка могла измениться или страница больше не доступна.", all: "Весь каталог",
    noDescription: "Описание будет добавлено позже.", bookingPaused: "Онлайн-запись временно недоступна. Профиль остаётся доступным; свяжитесь с бизнесом для деталей.",
    website: "Сайт", verified: "Одобренный профиль", ad: "Реклама", recommended: "Рекомендуем",
    tabs: "Разделы профиля", tabServices: "Услуги", tabTeam: "Команда", tabHours: "Часы работы", productsTitle: "Товары", productsNote: "Покупка — непосредственно в заведении; онлайн-оплаты нет.",
    searchLabel: "Поиск услуг", searchPlaceholder: "Название или категория", found: "Найдено", nothingFound: "По вашему запросу услуг не найдено.", minutes: "мин", noServices: "Публичные услуги ещё не добавлены.",
    toggleGroup: "Развернуть или свернуть категорию", limit: `Одновременно можно выбрать не более ${MAX_SELECTED_SERVICES} услуг.`, selectService: "Выбрать услугу",
    team: "Команда", specialist: "Специалист", noTeam: "Публичные профили команды ещё не добавлены.", experience: "лет опыта",
    hours: "Часы работы", hoursNote: "По графикам команды. Точное время проверяется при записи.", hoursLoading: "Загрузка часов работы…", hoursMissing: "Часы работы ещё не опубликованы.", closedDay: "Закрыто",
    openUntil: "Открыто · до {t}", closed: "Закрыто", opensAt: "Откроется: {d} {t}", today: "сегодня", tomorrow: "завтра",
    summary: "Ваша запись", address: "Адрес", phone: "Телефон", selected: "Выбрано", total: "Итого", duration: "Длительность", pickHint: "Выберите услуги", nothingSelected: "Услуги не выбраны. Их можно выбрать и на странице записи.",
    from: "от {p}", book: "Записаться", continue: "Продолжить", recheck: "Время окончательно проверяется при подтверждении записи.", call: "Позвонить", unavailableNote: "Онлайн-запись временно недоступна.",
    results: "Подтверждённые результаты", beforeAfter: "До / после", consent: "Здесь показаны только результаты, опубликованные с отдельного согласия клиента.", before: "До", after: "После",
    diary: "Дневник", latest: "Новые публикации", soonStamp: "Скоро", soon: "Визуальные истории бизнеса будут добавлены позже.", approved: "На этой странице показываются только публичные материалы, одобренные владельцем или менеджером.",
    feedback: "Отзывы", feedbackTitle: "Отзывы подтверждённых визитов", feedbackNote: "Отзыв может оставить только клиент после завершённого визита; каждая публикация проходит модерацию.", noFeedback: "Одобренных отзывов пока нет.",
    days: ["Понедельник", "Вторник", "Среда", "Четверг", "Пятница", "Суббота", "Воскресенье"], dateLocale: "ru-RU",
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
  else if (profile.isError) body = <StateBlock role="alert" title={ui.unavailable} lead={ui.retry} action={<button type="button" className="cw-btn cw-btn-line" onClick={() => void profile.refetch()}>{ui.retryButton}</button>} />;
  else if (!profile.data) body = <StateBlock title={ui.missing} lead={ui.missingLead} action={<Link href="/salons" className="cw-btn cw-btn-stamp">{ui.all}<ArrowRight className="size-4" aria-hidden="true" /></Link>} />;
  else body = <ProfileView data={profile.data} slug={slug} ui={ui} locale={locale} categories={marketplace.data?.categories ?? []} promotion={marketplace.data?.promotion ?? null} approved={Boolean(marketplace.data)} />;

  return <div className="cw min-h-screen">
    <CatalogHeader />
    <main id="main-content">{body}</main>
    <CatalogFooter />
  </div>;
}

function StateBlock({ title, lead, action, role, loading }: { title: string; lead?: string; action?: React.ReactNode; role?: "status" | "alert"; loading?: boolean }) {
  return <section className="cw-desk">
    <div className="cw-container py-16 sm:py-24">
      <div className="cwp-sheet mx-auto max-w-xl" role={role} aria-busy={loading || undefined}>
        <div className="cwp-band" />
        <div className="cwp-sheet-inner">
          <h1 className="cw-display text-3xl">{title}</h1>
          {loading ? <div className="cw-ticket-blank mt-6 h-24" aria-hidden="true" /> : null}
          {lead ? <p className="cw-lede mt-3">{lead}</p> : null}
          {action ? <div className="mt-6">{action}</div> : null}
        </div>
      </div>
    </div>
  </section>;
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
  const total = chosen.reduce((sum, service) => sum + service.priceTetri, 0);
  const minutes = chosen.reduce((sum, service) => sum + service.durationMinutes, 0);
  const anyFrom = chosen.some(service => service.isFromPrice);
  const href = bookingHref(salon.publicSlug, chosen.map(service => service.id));
  const money = (tetri: number, from = false) => from ? fill(ui.from, { p: formatGelTetri(tetri) }) : formatGelTetri(tetri);
  const totalLabel = chosen.length ? money(total, anyFrom) : "";

  const mark = salon.name.trim().charAt(0).toLocaleUpperCase() || "•";
  const tabIds = useId();
  const tabKeys = ["services", "team", "hours"] as const;
  const [tab, setTab] = useState<(typeof tabKeys)[number]>("services");
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const tabLabels = { services: ui.tabServices, team: ui.tabTeam, hours: ui.tabHours };
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
      ? `${ui.closed} · ${fill(ui.opensAt, { d: status.next.daysAhead === 0 ? ui.today : status.next.daysAhead === 1 ? ui.tomorrow : ui.days[status.next.weekday]!, t: status.next.time })}`
      : ui.closed
    : null;

  const sheetVars = cssVars(tone ? { "--v-bg": tone.bg, "--v-ink": tone.ink, "--band": tone.bg } : {});
  const hasAddress = Boolean(salon.address);

  return <div className={`cwp ${bookable ? "cwp-bar-pad" : ""}`} style={sheetVars}>
    <section className="cw-desk pb-10 pt-5 sm:pb-14" aria-labelledby="profile-title">
      <div className="cw-container">
        <Link href="/salons" className="cw-navlink -ml-2 inline-flex items-center gap-1.5"><ArrowLeft className="size-4" aria-hidden="true" />{ui.crumb}</Link>
        <div className="cwp-sheet mt-3">
          <div className="cwp-band" />
          <div className="cwp-sheet-inner">
            <div className="cwp-head">
              <span className="font-bold">{tone ? categories.length ? Array.from(new Set(categories.map(category => verticalStyle(verticalForCategory(category.slug)).label))).join(" · ") : tone.label : ui.crumb}</span>
              <span className="cw-num">{BRAND.domain}/salon/{salon.publicSlug}</span>
            </div>
            {salon.coverImageUrl ? <img src={salon.coverImageUrl} alt={salon.coverImageAltKa || ""} className="cwp-cover" /> : null}
            <div className="mt-5 flex items-start gap-4">
              <span className="cwp-mark" aria-hidden="true">{mark}</span>
              <div className="min-w-0 flex-1">
                <h1 id="profile-title" className="cw-display text-[clamp(1.75rem,5vw,3.25rem)]">{salon.name}</h1>
                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
                  {approved ? <span className="inline-flex items-center gap-1.5 font-bold"><ShieldCheck className="size-4" aria-hidden="true" />{ui.verified}</span> : null}
                  {status && statusText ? <span className="cwp-status" data-open={status.open}><span className="cwp-status-dot" aria-hidden="true" />{statusText}</span> : null}
                  {promotion ? <span className="inline-flex items-center gap-2"><span className="cw-stamp-mark">{promotion.tier === "VIP" ? "VIP" : promotion.tier === "RECOMMENDED" ? ui.recommended : ui.ad}</span>{promotion.disclosure ? <span className="text-xs text-[var(--cw-ink-soft)]">{promotion.disclosure}</span> : null}</span> : null}
                </div>
              </div>
            </div>
            <p className="cw-lede mt-4 max-w-2xl">{salon.publicDescription || ui.noDescription}</p>
            {categories.length ? <ul className="mt-4 flex flex-wrap gap-2" aria-label={ui.tabServices}>{categories.map(category => {
              const style = verticalStyle(verticalForCategory(category.slug));
              return <li key={category.id}><span className="cwp-chip" style={cssVars({ "--chip-bg": style.bg, "--chip-ink": style.ink })}>{category.nameKa}</span></li>;
            })}</ul> : null}
            <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-3 text-[0.95rem] font-semibold">
              {hasAddress ? <span className="inline-flex items-center gap-2"><MapPin className="size-4 shrink-0" aria-hidden="true" />{salon.address}</span> : null}
              {salon.phone ? <a href={`tel:${salon.phone}`} className="cw-num inline-flex items-center gap-2 underline"><Phone className="size-4 shrink-0" aria-hidden="true" />{salon.phone}</a> : null}
              {social.instagram ? <a href={social.instagram} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 underline"><Instagram className="size-4" aria-hidden="true" />Instagram<span className="sr-only"> ↗</span></a> : null}
              {social.website ? <a href={social.website} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 underline"><ExternalLink className="size-4" aria-hidden="true" />{ui.website}<span className="sr-only"> ↗</span></a> : null}
            </div>
            {!bookable ? <p className="cwp-dashed mt-5 text-sm leading-6" role="status">{ui.bookingPaused}</p> : null}
          </div>
        </div>
      </div>
    </section>

    <div className="cw-container py-8 lg:grid lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start lg:gap-10 lg:py-12">
      <div className="min-w-0">
        <div role="tablist" aria-label={ui.tabs} className="cwp-tablist">
          {tabKeys.map(key => <button key={key} ref={element => { tabRefs.current[key] = element; }} type="button" role="tab" id={`${tabIds}-tab-${key}`} aria-selected={tab === key} aria-controls={`${tabIds}-panel-${key}`} tabIndex={tab === key ? 0 : -1} className="cwp-tab" onClick={() => setTab(key)} onKeyDown={onTabKey}>{tabLabels[key]}</button>)}
        </div>

        {tabKeys.map(key => <div key={key} role="tabpanel" id={`${tabIds}-panel-${key}`} aria-labelledby={`${tabIds}-tab-${key}`} hidden={tab !== key} tabIndex={0} className="cwp-panel">
          {key !== "hours" ? <h2 className="sr-only">{tabLabels[key]}</h2> : null}
          {key === "services" ? <ServicesPanel services={services} selected={selected} onToggle={toggle} bookable={bookable} ui={ui} money={money} /> : null}
          {key === "team" ? <TeamPanel team={team} ui={ui} /> : null}
          {key === "hours" ? <HoursPanel ui={ui} bookable={bookable} loading={catalog.isLoading} failed={catalog.isError} hours={workingHours} timezone={timezone} now={now} /> : null}
        </div>)}

        {products.length ? <section className="cwp-block" aria-labelledby="products-title">
          <div className="cwp-block-head"><h2 id="products-title" className="text-xl font-extrabold [font-stretch:85%]">{ui.productsTitle}</h2></div>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--cw-ink-soft)]">{ui.productsNote}</p>
          <div className="mt-5"><ProductGrid items={products} /></div>
        </section> : null}

        <section className="cwp-block" aria-labelledby="feedback-title">
          <div className="cwp-block-head"><h2 id="feedback-title" className="text-xl font-extrabold [font-stretch:85%]">{ui.feedbackTitle}</h2></div>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--cw-ink-soft)]">{ui.feedbackNote}</p>
          {feedback.length
            ? <ul className="mt-5 grid gap-4 md:grid-cols-2">{feedback.map(item => <li key={item.id} className="cw-ledger p-4">
              <div className="flex items-center justify-between gap-3"><p className="font-extrabold">{item.authorName}</p><p className="cw-num inline-flex items-center gap-1 text-sm font-semibold"><Star className="size-4 fill-current" aria-hidden="true" /><span aria-label={`${item.rating} / 5`}>{item.rating}/5</span></p></div>
              <p className="mt-3 text-sm leading-6">{item.comment}</p>
              <p className="cw-num mt-3 text-xs text-[var(--cw-ink-soft)]">{new Intl.DateTimeFormat(ui.dateLocale, { day: "numeric", month: "long", year: "numeric" }).format(new Date(item.submittedAt))}</p>
            </li>)}</ul>
            : <p className="cwp-dashed mt-5 text-sm leading-6 text-[var(--cw-ink-soft)]">{ui.noFeedback}</p>}
        </section>

        {gallery.length ? <section className="cwp-block" aria-labelledby="results-title">
          <div className="cwp-block-head"><h2 id="results-title" className="text-xl font-extrabold [font-stretch:85%]">{ui.beforeAfter}</h2></div>
          <p className="mt-3 text-sm text-[var(--cw-ink-soft)]">{ui.consent}</p>
          <ul className="mt-5 grid gap-4 md:grid-cols-2">{gallery.map(item => <li key={item.id} className="cw-ledger overflow-hidden"><div className="grid grid-cols-2">
            {item.before ? <figure><img src={item.before.mediaUrl} alt={item.before.altTextKa || ui.before} className="aspect-square w-full object-cover" loading="lazy" /><figcaption className="px-3 py-2 text-xs font-semibold">{ui.before}</figcaption></figure> : null}
            {item.after ? <figure><img src={item.after.mediaUrl} alt={item.after.altTextKa || ui.after} className="aspect-square w-full object-cover" loading="lazy" /><figcaption className="px-3 py-2 text-xs font-semibold">{ui.after}</figcaption></figure> : null}
          </div></li>)}</ul>
        </section> : null}

        {feed.length ? <section className="cwp-block" aria-labelledby="feed-title">
          <div className="cwp-block-head"><h2 id="feed-title" className="text-xl font-extrabold [font-stretch:85%]">{ui.latest}</h2></div>
          <ul className="mt-5 columns-1 gap-4 sm:columns-2">{feed.map(post => <li key={post.id} className="cw-ledger mb-4 break-inside-avoid overflow-hidden">
            <img src={post.mediaUrl} alt={post.altTextKa} className="w-full object-cover" loading="lazy" />
            {post.titleKa || post.captionKa ? <div className="p-4">{post.titleKa ? <h3 className="font-extrabold">{post.titleKa}</h3> : null}{post.captionKa ? <p className="mt-2 text-sm leading-6 text-[var(--cw-ink-soft)]">{post.captionKa}</p> : null}</div> : null}
          </li>)}</ul>
        </section> : null}

        {!feed.length && !gallery.length ? <section className="cwp-block cwp-dashed flex items-start gap-3" aria-label={ui.diary}>
          <span className="cw-stamp-mark shrink-0">{ui.soonStamp}</span>
          <div><p className="font-extrabold">{ui.soon}</p><p className="mt-1 text-sm text-[var(--cw-ink-soft)]">{ui.approved}</p></div>
        </section> : null}
      </div>

      <aside aria-label={ui.summary} className="mt-10 hidden lg:mt-0 lg:block">
        <div className="cwp-aside cw-ledger">
          <div className="cw-ledger-head" style={cssVars({ "--ledger-bg": tone?.bg ?? "var(--cw-rule)", "--ledger-ink": tone?.ink ?? "var(--cw-ink)" })}>
            <h2 className="font-extrabold [font-stretch:85%]">{ui.summary}</h2>
            <span className="cw-num text-sm font-semibold" aria-live="polite">{chosen.length ? `${ui.selected}: ${chosen.length}` : ""}</span>
          </div>
          <div className="grid gap-3 p-4 text-sm">
            {hasAddress ? <p className="flex items-start gap-2"><MapPin className="mt-0.5 size-4 shrink-0" aria-hidden="true" /><span><span className="sr-only">{ui.address}: </span>{salon.address}</span></p> : null}
            {salon.phone ? <a href={`tel:${salon.phone}`} className="cw-num inline-flex items-center gap-2 font-semibold underline"><Phone className="size-4 shrink-0" aria-hidden="true" /><span className="sr-only">{ui.phone}: </span>{salon.phone}</a> : null}
            {bookable ? <>
              {chosen.length ? <ul className="grid gap-2 border-t border-[var(--cw-rule)] pt-3">{chosen.map(service => <li key={service.id} className="flex items-baseline justify-between gap-3"><span className="min-w-0">{service.nameKa}</span><span className="cw-num shrink-0 text-xs font-semibold">{money(service.priceTetri, service.isFromPrice)}</span></li>)}</ul>
                : <p className="border-t border-[var(--cw-rule)] pt-3 leading-6 text-[var(--cw-ink-soft)]">{ui.nothingSelected}</p>}
              {chosen.length ? <dl className="grid grid-cols-[1fr_auto] gap-x-3 gap-y-1 border-t border-[var(--cw-rule)] pt-3" aria-live="polite" aria-atomic="true">
                <dt className="text-[var(--cw-ink-soft)]">{ui.duration}</dt><dd className="cw-num text-right font-semibold">{minutes} {ui.minutes}</dd>
                <dt className="font-extrabold">{ui.total}</dt><dd className="cw-num text-right text-base font-extrabold">{totalLabel}</dd>
              </dl> : null}
              <Link href={href} className="cw-btn cw-btn-stamp w-full">{chosen.length ? `${ui.continue} · ${totalLabel}` : ui.book}<ArrowRight className="size-4 shrink-0" aria-hidden="true" /></Link>
              <p className="text-xs leading-5 text-[var(--cw-ink-soft)]">{ui.recheck}</p>
            </> : <p className="border-t border-[var(--cw-rule)] pt-3 leading-6 text-[var(--cw-ink-soft)]">{ui.unavailableNote}</p>}
          </div>
        </div>
      </aside>
    </div>

    {bookable ? <div className="cwp-bar" role="region" aria-label={ui.summary}>
      <div className="min-w-0 text-sm" aria-live="polite" aria-atomic="true">
        {chosen.length ? <><p className="cw-num text-xs font-semibold text-[var(--cw-ink-soft)]">{ui.selected}: {chosen.length} · {minutes} {ui.minutes}</p><p className="cw-num truncate text-base font-extrabold">{totalLabel}</p></>
          : <p className="font-semibold leading-5 text-[var(--cw-ink-soft)]">{ui.pickHint}</p>}
      </div>
      <Link href={href} className="cw-btn cw-btn-stamp shrink-0 px-4">{chosen.length ? ui.continue : ui.book}<ArrowRight className="size-4 shrink-0" aria-hidden="true" /></Link>
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

  if (!services.length) return <p className="cwp-dashed text-sm leading-6 text-[var(--cw-ink-soft)]">{ui.noServices}</p>;

  return <div>
    <label className="cw-field" htmlFor={searchId}>
      <span className="cw-caption">{ui.searchLabel}</span>
      <span className="flex items-center gap-2"><Search className="size-4 shrink-0 text-[var(--cw-ink-soft)]" aria-hidden="true" /><input id={searchId} type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder={ui.searchPlaceholder} autoComplete="off" /></span>
    </label>
    <p className="cw-num mt-2 min-h-5 text-xs text-[var(--cw-ink-soft)]" role="status">{needle ? `${ui.found}: ${visible.length}` : ""}</p>
    {bookable && atLimit ? <p className="mb-3 text-sm font-semibold" role="status">{ui.limit}</p> : null}
    {!visible.length ? <p className="cwp-dashed text-sm leading-6 text-[var(--cw-ink-soft)]">{ui.nothingFound}</p> : null}
    {groups.map(([name, rows], groupIndex) => {
      const open = Boolean(needle) || !collapsed.has(name);
      const panelId = `${searchId}-group-${groupIndex}`;
      const style = cssVars({ "--ledger-bg": "var(--v-bg)", "--ledger-ink": "var(--v-ink)" });
      return <section key={name} className="cwp-group cw-ledger" style={style} aria-label={name}>
        <h3 className="m-0">
          <button type="button" className="cw-ledger-head cwp-group-head" aria-expanded={open} aria-controls={panelId} onClick={() => toggleGroup(name)} title={ui.toggleGroup}>
            <span className="min-w-0">{name}</span>
            <span className="flex items-center gap-2"><span className="cw-num text-sm">{rows.length}</span><ChevronDown className="cwp-chevron size-5" aria-hidden="true" /></span>
          </button>
        </h3>
        {open ? <div id={panelId}>{rows.map(service => {
          const isSelected = selected.has(service.id);
          const blocked = !isSelected && atLimit;
          const inner = <>
            <span className="min-w-0">
              <span className="block font-semibold">{service.nameKa}</span>
              {service.description ? <span className="mt-0.5 block text-sm leading-5 text-[var(--cw-ink-soft)]">{service.description}</span> : null}
              <span className="cw-num mt-1 block text-xs font-semibold text-[var(--cw-ink-soft)]">{service.durationMinutes} {ui.minutes}</span>
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

function TeamPanel({ team, ui }: { team: ProfileData["team"]; ui: Copy }) {
  if (!team.length) return <p className="cwp-dashed text-sm leading-6 text-[var(--cw-ink-soft)]">{ui.noTeam}</p>;
  return <ul className="grid gap-4 sm:grid-cols-2">{team.map(member => <li key={member.id} className="cw-ledger p-4">
    <div className="flex items-center gap-4">
      {member.avatarUrl
        ? <img src={member.avatarUrl} alt={member.avatarAltKa || ""} className="size-16 shrink-0 rounded-[4px] border-[1.5px] border-[var(--cw-ink)] object-cover" loading="lazy" />
        : <span className="cwp-mark !size-16 !text-2xl" aria-hidden="true">{member.name.trim().charAt(0).toLocaleUpperCase() || "•"}</span>}
      <div className="min-w-0"><h3 className="text-lg font-extrabold leading-6 [font-stretch:85%]">{member.name}</h3><p className="text-sm text-[var(--cw-ink-soft)]">{member.jobTitle || member.specialty || ui.specialist}</p></div>
    </div>
    {member.bio ? <p className="mt-3 text-sm leading-6">{member.bio}</p> : null}
    {member.experienceYears ? <p className="mt-3 text-xs font-bold"><span className="cw-num">{member.experienceYears}</span> {ui.experience}</p> : null}
  </li>)}</ul>;
}

/* ---------- Hours ---------- */

function HoursPanel({ ui, bookable, loading, failed, hours, timezone, now }: { ui: Copy; bookable: boolean; loading: boolean; failed: boolean; hours: WorkingHour[]; timezone: string; now: Date }) {
  if (bookable && loading) return <p className="cwp-dashed text-sm text-[var(--cw-ink-soft)]" role="status">{ui.hoursLoading}</p>;
  if (!bookable || failed || !hours.length) return <p className="cwp-dashed text-sm leading-6 text-[var(--cw-ink-soft)]">{ui.hoursMissing}</p>;
  const today = localWeekdayMinutes(now, timezone)?.weekday;
  return <div>
    <div className="cw-ledger" style={cssVars({ "--ledger-bg": "var(--v-bg)", "--ledger-ink": "var(--v-ink)" })}>
      <div className="cw-ledger-head"><h2 className="font-extrabold [font-stretch:85%]">{ui.hours}</h2></div>
      <ul>{ui.days.map((day, weekday) => {
        const rule = hours.find(hour => hour.weekday === weekday);
        return <li key={day} className="cwp-hours-row" aria-current={today === weekday ? "date" : undefined}>
          <span>{day}</span>
          <span className="cw-num text-sm">{rule ? `${hhmm(rule.startLocalTime)}–${hhmm(rule.endLocalTime)}` : ui.closedDay}</span>
        </li>;
      })}</ul>
    </div>
    <p className="mt-3 text-sm text-[var(--cw-ink-soft)]">{ui.hoursNote}</p>
  </div>;
}
