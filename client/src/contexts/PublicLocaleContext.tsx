import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

export type PublicLocale = "ka" | "en" | "ru";
type Phrase = keyof typeof copy.ka;

const copy = {
  ka: {
    skip: "ძირითად შინაარსზე გადასვლა", mainNav: "მთავარი ნავიგაცია", mobileNav: "მობილური მთავარი ნავიგაცია", closeMenu: "მენიუს დახურვა", openMenu: "მენიუს გახსნა", features: "შესაძლებლობები", pricing: "ტარიფები", preview: "დათვალიერება", faq: "კითხვები", contact: "კონტაქტი", onlineBooking: "ონლაინ ჩაწერა", book: "ჩაწერა", signIn: "შესვლა", startFree: "დაიწყე უფასოდ", start: "დაიწყე", installApp: "აპის დაყენება", product: "პროდუქტი", information: "ინფორმაცია", workspaceCreate: "სამუშაო სივრცის შექმნა", workspaceLogin: "სამუშაო სივრცეში შესვლა", footer: "ქართული ინტერფეისი · უსაფრთხო ადგილობრივი ანგარიში",
    bookEyebrow: "ონლაინ ჩაწერა", bookTitle: "იპოვეთ თქვენთვის სასურველი ფილიალი.", bookLead: "შემდეგ ნაბიჯებში მშვიდად აირჩევთ სერვისს, სპეციალისტს, დროს და საკონტაქტო ინფორმაციას.", checkTitle: "რას ამოწმებს SalonFlow?", checkLead: "ონლაინ მოთხოვნისას საბოლოო ხელმისაწვდომობა server-ზე მოწმდება, რათა დროის კონფლიქტი არ დადასტურდეს.", searchLabel: "მოძებნეთ ფილიალი ან სერვისი", searchPlaceholder: "მაგ. თმის შეჭრა ან ფილიალის სახელი", loading: "ფილიალები იტვირთება…", unavailableTitle: "ონლაინ ჩაწერის მონაცემები დროებით მიუწვდომელია.", retry: "გთხოვთ სცადოთ ხელახლა რამდენიმე წუთში.", emptyTitle: "ჩაწერა მალე გააქტიურდება", emptyLead: "სალონს ჯერ არ აქვს აქტიური ონლაინ-ჩაწერის ფილიალი. გთხოვთ დაუკავშირდეთ სალონს უშუალოდ.", categoryFilter: "მომსახურების კატეგორიის ფილტრი", allServices: "ყველა სერვისი", noResults: "შესაბამისი ფილიალი ვერ მოიძებნა", noResultsLead: "ამ კატეგორიის ონლაინ სერვისი ამჟამად არცერთ აქტიურ ფილიალს არ აქვს. სცადეთ სხვა კატეგორია ან შეცვალეთ ძიების სიტყვა.", allLocations: "ყველა ფილიალის ნახვა", noAddress: "მისამართი ჯერ არ არის მითითებული. ჩაწერის დროს ხელმისაწვდომობა მაინც შემოწმდება.", call: "დარეკვა", email: "ელფოსტა", bookNow: "ჩაწერა"
  },
  en: {
    skip: "Skip to main content", mainNav: "Main navigation", mobileNav: "Mobile navigation", closeMenu: "Close menu", openMenu: "Open menu", features: "Features", pricing: "Pricing", preview: "Preview", faq: "FAQ", contact: "Contact", onlineBooking: "Online booking", book: "Book", signIn: "Sign in", startFree: "Get started", start: "Start", installApp: "Install app", product: "Product", information: "Information", workspaceCreate: "Create workspace", workspaceLogin: "Workspace sign in", footer: "Georgian-first interface · secure local account",
    bookEyebrow: "Online booking", bookTitle: "Find the salon location that suits you.", bookLead: "Choose a service, specialist, time and contact details in the next steps.", checkTitle: "What does SalonFlow check?", checkLead: "Final availability is checked on the server so a conflicting time is never confirmed.", searchLabel: "Search by location or service", searchPlaceholder: "For example, haircut or salon name", loading: "Loading locations…", unavailableTitle: "Online booking data is temporarily unavailable.", retry: "Please try again in a few minutes.", emptyTitle: "Booking will be available soon", emptyLead: "This salon does not yet have an active online-booking location. Please contact the salon directly.", categoryFilter: "Service category filter", allServices: "All services", noResults: "No matching location found", noResultsLead: "No active location currently offers online booking for this category. Try another category or change your search.", allLocations: "View all locations", noAddress: "No address has been provided yet. Availability will still be checked during booking.", call: "Call", email: "Email", bookNow: "Book"
  },
  ru: {
    skip: "Перейти к основному содержанию", mainNav: "Главная навигация", mobileNav: "Мобильная навигация", closeMenu: "Закрыть меню", openMenu: "Открыть меню", features: "Возможности", pricing: "Тарифы", preview: "Обзор", faq: "Вопросы", contact: "Контакты", onlineBooking: "Онлайн-запись", book: "Записаться", signIn: "Войти", startFree: "Начать", start: "Начать", installApp: "Установить приложение", product: "Продукт", information: "Информация", workspaceCreate: "Создать рабочее пространство", workspaceLogin: "Вход в рабочее пространство", footer: "Интерфейс на грузинском · безопасная локальная учётная запись",
    bookEyebrow: "Онлайн-запись", bookTitle: "Найдите подходящий салон.", bookLead: "На следующих шагах выберите услугу, специалиста, время и контактные данные.", checkTitle: "Что проверяет SalonFlow?", checkLead: "Окончательная доступность проверяется на сервере, чтобы не подтвердить конфликтующее время.", searchLabel: "Поиск салона или услуги", searchPlaceholder: "Например, стрижка или название салона", loading: "Загрузка салонов…", unavailableTitle: "Данные онлайн-записи временно недоступны.", retry: "Попробуйте снова через несколько минут.", emptyTitle: "Онлайн-запись скоро станет доступна", emptyLead: "У этого салона пока нет активного филиала для онлайн-записи. Свяжитесь с салоном напрямую.", categoryFilter: "Фильтр категории услуг", allServices: "Все услуги", noResults: "Подходящий салон не найден", noResultsLead: "Ни один активный салон сейчас не предлагает онлайн-запись для этой категории. Выберите другую категорию или измените поиск.", allLocations: "Все салоны", noAddress: "Адрес пока не указан. Доступность всё равно будет проверена во время записи.", call: "Позвонить", email: "Эл. почта", bookNow: "Записаться"
  }
} as const;

type PublicLocaleState = { locale: PublicLocale; setLocale: (locale: PublicLocale) => void; t: (phrase: Phrase) => string };
const PublicLocaleContext = createContext<PublicLocaleState>({ locale: "ka", setLocale: () => undefined, t: phrase => copy.ka[phrase] });

export function PublicLocaleProvider({ children, initialLocale }: { children: React.ReactNode; initialLocale?: PublicLocale }) {
  const [locale, setLocale] = useState<PublicLocale>(() => {
    if (initialLocale) return initialLocale;
    if (typeof window === "undefined") return "ka";
    const saved = window.localStorage.getItem("salonflow-public-locale");
    return saved === "en" || saved === "ru" || saved === "ka" ? saved : "ka";
  });
  useEffect(() => { window.localStorage.setItem("salonflow-public-locale", locale); document.documentElement.lang = locale === "ka" ? "ka" : locale; }, [locale]);
  const value = useMemo(() => ({ locale, setLocale, t: (phrase: Phrase) => copy[locale][phrase] }), [locale]);
  return <PublicLocaleContext.Provider value={value}>{children}</PublicLocaleContext.Provider>;
}

export function usePublicLocale() { return useContext(PublicLocaleContext); }

export function publicWeekdayShort(weekday: number, locale: PublicLocale) {
  const labels = { ka: ["ორშ", "სამ", "ოთხ", "ხუთ", "პარ", "შაბ", "კვ"], en: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"], ru: ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"] };
  return labels[locale][weekday] ?? labels[locale][0]!;
}
