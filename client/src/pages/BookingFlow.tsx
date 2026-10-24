import { CatalogFooter, CatalogHeader } from "@/components/catalog/CatalogChrome";
import { EASE } from "@/components/catalog/HomeMotion";
import { BookingBar, BookingBusinessStrip, BookingChoiceCard, BookingChoiceStrip, BookingDateStrip, BookingNotice, BookingRail, BookingSlotGroup, BookingStepHeader, DATE_NAMES, addDaysKey, formatDateKeyLong, schemaWeekdayOf, type BookingChoice } from "@/components/public/BookingPrimitives";
import { usePublicMeta } from "@/components/public/PublicMeta";
import { type PublicLocale, usePublicLocale } from "@/contexts/PublicLocaleContext";
import { downloadBookingCalendar } from "@/lib/bookingCalendar";
import { addDeviceBooking } from "@/lib/deviceSaved";
import { formatDateTimeForLocale, formatGelTetri } from "@/lib/presentation";
import { trpc } from "@/lib/trpc";
import { BRAND } from "@shared/brand";
import { MAX_SELECTED_SERVICES } from "@shared/validation";
import { dateKeyInTimeZone } from "@shared/timezones";
import { AnimatePresence, motion, useReducedMotionConfig } from "framer-motion";
import { CalendarClock, CalendarPlus, Check, ChevronDown, ChevronLeft, CircleAlert, Clock, Mail, Phone, RefreshCw, Users, X } from "lucide-react";
import React, { useEffect, useId, useMemo, useRef, useState } from "react";
import { Link, useRoute, useSearch } from "wouter";
import "@/components/catalog/booking.css";

export const bookingUi = {
  ka: { loading: "ჩაწერის კატალოგი იტვირთება…", unavailable: "ჩაწერის მონაცემები დროებით მიუწვდომელია. შეამოწმე კავშირი და სცადე მოგვიანებით.", inactive: "ეს ჩაწერის ბმული აღარ არის აქტიური", inactiveLead: "ფილიალი შესაძლოა გათიშულია ან ბმული არასწორია. დაბრუნდი კატალოგში და აირჩიე აქტიური ფილიალი.", trialPaused: "ონლაინ ჩაწერა ამ სალონისთვის დროებით მიუწვდომელია", trialPausedLead: "სალონის საჯარო ინფორმაცია არ წაშლილა, თუმცა ამ ეტაპზე ახალი ონლაინ ჯავშანი ვერ მიიღება. დეტალებისთვის დაუკავშირდი სალონს.", viewSalon: "სალონის გვერდის ნახვა", received: "მოთხოვნა მიღებულია — ელოდება სალონის დადასტურებას", receivedLead: "შენი მოთხოვნა სალონმა უნდა დაადასტუროს. საჭიროების შემთხვევაში შეინახე დადასტურების კოდი და გამოიყენე დაცული მართვის ბმული.", assigned: "შენი სპეციალისტი:", code: "ჯავშნის დადასტურების კოდი", calendar: "კალენდარში დამატება", manage: "ჯავშნის მართვა", returnToList: "კატალოგში დაბრუნება" },
  en: { loading: "Loading booking catalog…", unavailable: "Booking data is temporarily unavailable. Check your connection and try again.", inactive: "This booking link is no longer active", inactiveLead: "The location may be inactive or the link may be incorrect. Return to the catalog and choose an active business.", trialPaused: "Online booking is temporarily unavailable", trialPausedLead: "This salon profile remains available, but it is not accepting new online bookings at this time. Please contact the salon for details.", viewSalon: "View salon profile", received: "Booking request received!", receivedLead: "Your booking is awaiting salon confirmation. Save the confirmation code if needed.", assigned: "Your specialist:", code: "Booking confirmation code", calendar: "Add to calendar", manage: "Manage booking", returnToList: "Back to the catalog" },
  ru: { loading: "Загрузка каталога записи…", unavailable: "Данные записи временно недоступны. Проверьте подключение и попробуйте снова.", inactive: "Эта ссылка для записи больше не активна", inactiveLead: "Филиал может быть неактивен или ссылка неверна. Вернитесь в каталог и выберите активный.", trialPaused: "Онлайн-запись временно недоступна", trialPausedLead: "Профиль салона остаётся доступным, но новые онлайн-записи сейчас не принимаются. Свяжитесь с салоном для деталей.", viewSalon: "Страница салона", received: "Заявка на запись принята!", receivedLead: "Запись ожидает подтверждения салоном. При необходимости сохраните код подтверждения.", assigned: "Ваш специалист:", code: "Код подтверждения", calendar: "Добавить в календарь", manage: "Управление записью", returnToList: "Вернуться в каталог" },
} as const;

const ANY_AVAILABLE = "ANY_AVAILABLE";

const ruPlural = (n: number, one: string, few: string, many: string) => (n % 10 === 1 && n % 100 !== 11 ? one : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20) ? few : many);

// Wizard copy (steps, validation, review table). Georgian is the source of truth; business data (service and staff names) is never translated.
export const flowUi = {
  ka: {
    metaWith: (name: string) => `ჩაწერა — ${name}`, metaOnline: "ონლაინ ჩაწერა", metaDescription: "აირჩიე სერვისი, სპეციალისტი და თავისუფალი დრო და დაჯავშნე ონლაინ.",
    steps: ["სერვისი", "სპეციალისტი", "დრო", "დადასტურება"],
    stepCopy: [
      { title: "რომელი სერვისი გჭირდება?", lede: "აირჩიე ერთი ან რამდენიმე სერვისი. შემდეგ ეტაპზე გამოჩნდება მხოლოდ ყველა არჩეული სერვისისთვის შესაბამისი სპეციალისტი." },
      { title: "ვინ მოგემსახურება?", lede: "აირჩიე კონკრეტული სპეციალისტი ან ნებისმიერი თავისუფალი." },
      { title: "რომელი დრო გერგება?", lede: "ნაჩვენებია მხოლოდ რეალურად თავისუფალი საათები. არჩეული დრო დაჯავშნისას კვლავ გადამოწმდება." },
      { title: "გადაამოწმე და დაადასტურე", lede: "მიუთითე საკონტაქტო მონაცემები. ჯავშანს სალონი დაგიდასტურებს." },
    ],
    issues: {
      service: { title: "ჯერ აირჩიე სერვისი", description: "მონიშნე სასურველი მომსახურება, შემდეგ კი გადადი სპეციალისტის არჩევაზე." },
      staff: { title: "ჯერ აირჩიე სპეციალისტი", description: "შეგიძლია მონიშნო კონკრეტული სპეციალისტი ან აირჩიო ნებისმიერი თავისუფალი სპეციალისტი." },
      timeMissing: { title: "დაამატე სასურველი თარიღი და დრო", description: `დროის არჩევის შემდეგ ${BRAND.nameKa} ავტომატურად გადაამოწმებს ხელმისაწვდომობას.` },
      timeUnconfirmed: { title: "ეს დრო ჯერ არ დადასტურებულა", description: "აირჩიე სხვა დრო ან დაელოდე ხელმისაწვდომობის შემოწმების დასრულებას." },
      firstName: { title: "მიუთითე სახელი", description: "სახელი საჭიროა ჯავშნის მოთხოვნის დასადასტურებლად." },
      phone: { title: "მიუთითე მობილურის ნომერი", description: "მობილურის ნომერი საჭიროა, რომ სალონმა შენს მოთხოვნაზე დაგიკავშირდეს." },
      terms: { title: "დაადასტურე ჯავშნის პირობები", description: "გაგრძელებამდე საჭიროა მონაცემების დამუშავებაზე თანხმობა." },
      submit: { title: "ჯავშნის მოთხოვნა ვერ გაიგზავნა", description: "მონაცემები არ დაგვიკარგავს. შეამოწმე კავშირი და სცადე ხელახლა." },
      network: { title: "კავშირი გაწყდა. სცადე თავიდან.", description: "შენი მონაცემები არ დაგვიკარგავს." },
    },
    retry: "თავიდან ცდა", autoPicked: (name: string) => `${name} (ავტომატურად შეირჩა)`, anyStaff: "ნებისმიერი თავისუფალი სპეციალისტი",
    back: "უკან", profile: "პროფილი", catalog: "კატალოგი", onlineBooking: "ჩაწერა", closeBooking: "ჩაწერის დახურვა", progress: "ჯავშნის პროგრესი", hoursAndContact: "სამუშაო საათები და კონტაქტი",
    summary: (count: number, minutes: number) => `${count} სერვისი · ${minutes} წთ`, noService: "სერვისი არ არის არჩეული", pickService: "აირჩიე სერვისი", from: (price: string) => `${price}-დან`, next: "შემდეგი", sending: "იგზავნება…", book: "დაჯავშნა",
    staffHours: "ხელმისაწვდომი სპეციალისტების საათები", noHours: "სამუშაო საათები ჯერ არ არის მითითებული. დროის არჩევისას ხელმისაწვდომობა მაინც ავტომატურად შემოწმდება.", dayFallback: "დღე",
    noServicesTitle: "ონლაინ სერვისი ჯერ არ არის", noServicesText: "ამ ფილიალში ონლაინ ჩასაწერი სერვისები ჯერ არ არის. დაუკავშირდი სალონს.", choose: (name: string) => `${name} არჩევა`, minutes: "წთ",
    noStaffTitle: "სპეციალისტი ვერ მოიძებნა", noStaffText: "არჩეული სერვისების ერთობლიობისთვის ამ ფილიალში აქტიური ონლაინ სპეციალისტი ჯერ არ არის. აირჩიე სხვა სერვისი ან დაუკავშირდი სალონს.", changeServices: "სერვისების შეცვლა", specialist: "სპეციალისტი",
    anyStaffLabel: "ნებისმიერი თავისუფალი სპეციალისტის არჩევა", anyStaffMeta: "სისტემა დროის არჩევისას მოძებნის მხოლოდ არჩეული სერვისებისთვის რეალურად თავისუფალ სპეციალისტს.",
    duration: "ხანგრძლივობა: ", closedDay: "ამ დღეს დაკეტილია.", slotsLoading: "თავისუფალი დრო იტვირთება…", slotsFailed: "თავისუფალი დროის ჩატვირთვა ვერ მოხერხდა. სცადე ხელახლა.",
    morning: "დილა", afternoon: "შუადღე", evening: "საღამო",
    noSlotsTitle: "ამ დღეს თავისუფალი დრო აღარ არის.", noSlotsText: "შეგიძლია აირჩიო სხვა დღე ან დატოვო მოთხოვნა მოლოდინის სიაში. ეს არ არის დადასტურებული ჯავშანი და ავტომატური შეტყობინება ჯერ არ იგზავნება.", waitlist: "მოლოდინის სიის მოთხოვნა", nextDay: "შემდეგი დღე", choicesLabel: "შენი არჩევანი",
    checking: "ხელმისაწვდომობა მოწმდება…", available: "ეს დრო ხელმისაწვდომია — შეგიძლია გააგრძელო.", taken: "ეს დრო ახლახან დაიკავეს. აირჩიე სხვა დრო.",
    change: "შეცვლა", changeAria: (label: string) => `${label} — შეცვლა`, summaryCaption: "ჯავშნის შეჯამება", business: "ბიზნესი", dateTime: "თარიღი და დრო", duration2: "ხანგრძლივობა", services: "სერვისები", total: "ჯამი",
    firstName: "სახელი *", lastName: "გვარი", optional: "(არასავალდებულო)", phone: "მობილურის ნომერი *", phonePlaceholder: "მაგ. 555 12 34 56", phoneHelp: "ფორმატი: 5XX XX XX XX. ნომერი გამოყენებული იქნება მხოლოდ ამ მოთხოვნისთვის.",
    email: "ელფოსტა", note: "კომენტარი სალონისთვის", consent: "ვეთანხმები, რომ სალონმა ჩემი მონაცემები გამოიყენოს მხოლოდ ამ ჯავშნის მოთხოვნის დამუშავებისა და დადასტურებისთვის. *",
    stamp: "ჩაწერილია", detailsCaption: "ჯავშნის დეტალები",
  },
  en: {
    metaWith: (name: string) => `Booking — ${name}`, metaOnline: "Online booking", metaDescription: "Choose a service, specialist and free time and book online.",
    steps: ["Service", "Specialist", "Time", "Confirm"],
    stepCopy: [
      { title: "What would you like today?", lede: "Choose one or more services. The next step shows only specialists who can do every selected service." },
      { title: "Who should serve you?", lede: "Choose a specific specialist or any available one." },
      { title: "Which time suits you?", lede: "Only truly free times are shown. The chosen time is checked again when you book." },
      { title: "Review and confirm", lede: "Enter your contact details. The salon will confirm your booking." },
    ],
    issues: {
      service: { title: "Choose a service first", description: "Select the service you want, then move on to choosing a specialist." },
      staff: { title: "Choose a specialist first", description: "You can pick a specific specialist or any available specialist." },
      timeMissing: { title: "Add your preferred date and time", description: `After you choose a time, ${BRAND.name} automatically checks availability.` },
      timeUnconfirmed: { title: "This time has not been confirmed yet", description: "Choose another time or wait for the availability check to finish." },
      firstName: { title: "Enter your first name", description: "Your name is needed to confirm the booking request." },
      phone: { title: "Enter your mobile number", description: "A mobile number is needed so the salon can contact you about your request." },
      terms: { title: "Accept the booking terms", description: "Consent to data processing is required before you continue." },
      submit: { title: "The booking request could not be sent", description: "We have not lost your data. Check your connection and try again." },
      network: { title: "Connection lost. Please try again.", description: "We have not lost your data." },
    },
    retry: "Try again", autoPicked: (name: string) => `${name} (assigned automatically)`, anyStaff: "Any available specialist",
    back: "Back", profile: "Profile", catalog: "Catalog", onlineBooking: "Online booking", closeBooking: "Close booking", progress: "Booking progress", hoursAndContact: "Working hours and contact",
    summary: (count: number, minutes: number) => `${count} ${count === 1 ? "service" : "services"} · ${minutes} min`, noService: "No service selected", pickService: "Choose a service", from: (price: string) => `From ${price}`, next: "Next", sending: "Sending…", book: "Book",
    staffHours: "Specialists' available hours", noHours: "Working hours have not been set yet. Availability is still checked automatically when you choose a time.", dayFallback: "Day",
    noServicesTitle: "No online services yet", noServicesText: "This location has no services available for online booking yet. Please contact the salon.", choose: (name: string) => `Select ${name}`, minutes: "min",
    noStaffTitle: "No specialist found", noStaffText: "No active online specialist at this location can do the selected combination of services. Choose a different service or contact the salon.", changeServices: "Change services", specialist: "Specialist",
    anyStaffLabel: "Select any available specialist", anyStaffMeta: "When you choose a time, the system finds a specialist who is truly free for all selected services.",
    duration: "Duration: ", closedDay: "The salon is closed on this day. Choose another date.", slotsLoading: "Loading free times…", slotsFailed: "Free times could not be loaded. Please try again.",
    morning: "Morning", afternoon: "Afternoon", evening: "Evening",
    noSlotsTitle: "There is no free time left on this day.", noSlotsText: "You can choose another day or leave a waitlist request. This is not a confirmed booking, and no automatic notification is sent yet.", waitlist: "Waitlist request", nextDay: "Next day", choicesLabel: "Your choices",
    checking: "Checking availability…", available: "This time is available — you can continue.", taken: "This time was just taken. Choose another free time.",
    change: "Change", changeAria: (label: string) => `${label} — change`, summaryCaption: "Booking summary", business: "Business", dateTime: "Date and time", duration2: "Duration", services: "Services", total: "Total",
    firstName: "First name *", lastName: "Last name", optional: "(optional)", phone: "Mobile number *", phonePlaceholder: "e.g. 555 12 34 56", phoneHelp: "Format: 5XX XX XX XX. The number is used only for this request.",
    email: "Email", note: "Note for the salon", consent: "I agree that the salon may use my data only to process and confirm this booking request. *",
    stamp: "Recorded", detailsCaption: "Booking details",
  },
  ru: {
    metaWith: (name: string) => `Запись — ${name}`, metaOnline: "Онлайн-запись", metaDescription: "Выберите услугу, специалиста и свободное время и запишитесь онлайн.",
    steps: ["Услуга", "Специалист", "Время", "Подтверждение"],
    stepCopy: [
      { title: "Что вам нужно сегодня?", lede: "Выберите одну или несколько услуг. На следующем шаге будут только специалисты, подходящие для всех выбранных услуг." },
      { title: "Кто вас обслужит?", lede: "Выберите конкретного специалиста или любого свободного." },
      { title: "Какое время вам подходит?", lede: "Показано только действительно свободное время. Выбранное время ещё раз проверяется при записи." },
      { title: "Проверьте и подтвердите", lede: "Укажите контактные данные. Запись подтвердит салон." },
    ],
    issues: {
      service: { title: "Сначала выберите услугу", description: "Отметьте нужную услугу, затем переходите к выбору специалиста." },
      staff: { title: "Сначала выберите специалиста", description: "Можно выбрать конкретного специалиста или любого свободного." },
      timeMissing: { title: "Укажите желаемую дату и время", description: `После выбора времени ${BRAND.name} автоматически проверит доступность.` },
      timeUnconfirmed: { title: "Это время ещё не подтверждено", description: "Выберите другое время или дождитесь завершения проверки доступности." },
      firstName: { title: "Укажите имя", description: "Имя необходимо для подтверждения запроса на запись." },
      phone: { title: "Укажите номер мобильного телефона", description: "Номер нужен, чтобы салон мог связаться с вами по вашему запросу." },
      terms: { title: "Подтвердите условия записи", description: "Перед продолжением необходимо согласие на обработку данных." },
      submit: { title: "Не удалось отправить запрос на запись", description: "Ваши данные не потеряны. Проверьте подключение и попробуйте снова." },
      network: { title: "Соединение потеряно. Попробуйте ещё раз.", description: "Ваши данные не потеряны." },
    },
    retry: "Попробовать ещё раз", autoPicked: (name: string) => `${name} (выбран автоматически)`, anyStaff: "Любой свободный специалист",
    back: "Назад", profile: "Профиль", catalog: "Каталог", onlineBooking: "Онлайн-запись", closeBooking: "Закрыть запись", progress: "Ход записи", hoursAndContact: "Часы работы и контакты",
    summary: (count: number, minutes: number) => `${count} ${ruPlural(count, "услуга", "услуги", "услуг")} · ${minutes} мин`, noService: "Услуга не выбрана", pickService: "Выберите услугу", from: (price: string) => `от ${price}`, next: "Далее", sending: "Отправка…", book: "Записаться",
    staffHours: "Доступные часы специалистов", noHours: "Часы работы пока не указаны. Доступность всё равно проверяется автоматически при выборе времени.", dayFallback: "День",
    noServicesTitle: "Онлайн-услуг пока нет", noServicesText: "В этом филиале пока нет услуг для онлайн-записи. Свяжитесь с салоном.", choose: (name: string) => `Выбрать: ${name}`, minutes: "мин",
    noStaffTitle: "Специалист не найден", noStaffText: "В этом филиале нет активного онлайн-специалиста для выбранного сочетания услуг. Выберите другую услугу или свяжитесь с салоном.", changeServices: "Изменить услуги", specialist: "Специалист",
    anyStaffLabel: "Выбрать любого свободного специалиста", anyStaffMeta: "При выборе времени система найдёт специалиста, который действительно свободен для всех выбранных услуг.",
    duration: "Длительность: ", closedDay: "В этот день салон закрыт. Выберите другую дату.", slotsLoading: "Загрузка свободного времени…", slotsFailed: "Не удалось загрузить свободное время. Попробуйте снова.",
    morning: "Утро", afternoon: "День", evening: "Вечер",
    noSlotsTitle: "На этот день свободного времени больше нет.", noSlotsText: "Можно выбрать другой день или оставить запрос в листе ожидания. Это не подтверждённая запись, и автоматическое уведомление пока не отправляется.", waitlist: "Запрос в лист ожидания", nextDay: "Следующий день", choicesLabel: "Ваш выбор",
    checking: "Проверка доступности…", available: "Это время доступно — можно продолжать.", taken: "Это время только что заняли. Выберите другое свободное время.",
    change: "Изменить", changeAria: (label: string) => `${label} — изменить`, summaryCaption: "Сводка записи", business: "Бизнес", dateTime: "Дата и время", duration2: "Длительность", services: "Услуги", total: "Итого",
    firstName: "Имя *", lastName: "Фамилия", optional: "(необязательно)", phone: "Номер мобильного телефона *", phonePlaceholder: "напр. 555 12 34 56", phoneHelp: "Формат: 5XX XX XX XX. Номер используется только для этого запроса.",
    email: "Эл. почта", note: "Комментарий для салона", consent: "Я согласен(на), что салон использует мои данные только для обработки и подтверждения этого запроса на запись. *",
    stamp: "Записано", detailsCaption: "Детали записи",
  },
} as const;

export type BookingTeamMember = { id: string; name: string; specialty: string | null; bio: string | null; eligibleServiceIds: string[] };
type BookingService = { id: string; nameKa: string; defaultDurationMinutes: number; priceTetri: number; isFromPrice?: boolean };
type BookingLocation = { name: string; timezone: string; address: string | null; phone: string | null; email: string | null; publicDescription: string | null; workingHours: Array<{ weekday: number; startLocalTime: string; endLocalTime: string }> };
type BookingIssueKind = "service" | "staff" | "time" | "contact" | "submit";
export type BookingValidationIssue = { kind: BookingIssueKind; title: string; description: string };

export function getEligibleTeam(team: BookingTeamMember[], serviceIds?: string | string[]) {
  const selected = Array.isArray(serviceIds) ? serviceIds : serviceIds ? [serviceIds] : [];
  return team.filter(member => selected.every(serviceId => member.eligibleServiceIds.includes(serviceId)));
}

export function formatGel(tetri: number) {
  return formatGelTetri(tetri);
}

// "40,00 ₾-დან" for services priced "from"; shown the same way on the salon profile.
const priceLabel = (text: { from: (price: string) => string }, tetri: number, from?: boolean) => from ? text.from(formatGel(tetri)) : formatGel(tetri);

export function getBookingValidationIssue(input: { step: number; serviceId?: string; staffProfileId?: string; startsAt: Date | null; available?: boolean; firstName: string; phone: string; termsAccepted: boolean; locale?: PublicLocale }): BookingValidationIssue | null {
  const issues = flowUi[input.locale ?? "ka"].issues;
  if (input.step === 0 && !input.serviceId) return { kind: "service", ...issues.service };
  if (input.step === 1 && !input.staffProfileId) return { kind: "staff", ...issues.staff };
  if (input.step === 2 && !input.startsAt) return { kind: "time", ...issues.timeMissing };
  if (input.step === 2 && input.available !== true) return { kind: "time", ...issues.timeUnconfirmed };
  if (input.step === 3 && !input.firstName.trim()) return { kind: "contact", ...issues.firstName };
  if (input.step === 3 && !input.phone.trim()) return { kind: "contact", ...issues.phone };
  if (input.step === 3 && !input.termsAccepted) return { kind: "contact", ...issues.terms };
  return null;
}

// The commit endpoints throw plain errors without a code, so a taken slot is told apart by the server's own message
// (Georgian for the multi-service route, English for the single-service route). shortcut: message match, replace with a stable error code on the server.
// Server messages from server/routers/public.ts that mean "pick another time"; booking-window misses too.
const SLOT_TAKEN_MESSAGES = ["ეს დრო ახლახან დაიკავეს", "The selected time is no longer available", "ჩაწერის დაშვებულ დიაპაზონში არ არის", "falls outside the booking window"];
export function isSlotTakenError(error: { message?: string }) {
  const message = error.message ?? "";
  return SLOT_TAKEN_MESSAGES.some(part => message.includes(part));
}
// A tRPC error that never reached the server (offline, dropped connection) carries no `data`; server-side failures always do.
export function isNetworkError(error: { data?: unknown }) { return !error.data; }

// `?services=<id1>,<id2>` (ids from public.bookingCatalog) preselects services. Unknown ids are ignored later,
// once the catalog is known; here we only split and de-duplicate.
export function parseRequestedServiceIds(search: string) {
  const raw = new URLSearchParams(search).get("services");
  if (!raw) return [];
  return Array.from(new Set(raw.split(",").map(id => id.trim()).filter(Boolean)));
}

export default function BookingFlow() {
  const [, params] = useRoute("/book/:slug");
  const search = useSearch();
  const { locale } = usePublicLocale();
  const ui = bookingUi[locale];
  const text = flowUi[locale];
  const slug = params?.slug ?? "";
  const catalog = trpc.public.bookingCatalog.useQuery(slug, { enabled: Boolean(slug) });
  usePublicMeta({
    title: catalog.data ? `${text.metaWith(catalog.data.location.name)} | ${BRAND.name}` : `${text.metaOnline} | ${BRAND.name}`,
    description: text.metaDescription,
    canonicalPath: `/book/${slug}`,
    robots: "noindex,nofollow",
  });
  const [step, setStep] = useState(0);
  const [serviceIds, setServiceIds] = useState<string[]>([]);
  const [initialised, setInitialised] = useState(false);
  const [staffProfileId, setStaffProfileId] = useState<string>();
  const [dateTime, setDateTime] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [customerNote, setCustomerNote] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [idempotencyKey] = useState(() => crypto.randomUUID());
  const [confirmation, setConfirmation] = useState<{ token: string; assignedStaffName?: string; endsAt: Date }>();
  const [interactionError, setInteractionError] = useState<BookingValidationIssue | null>(null);
  const [slotTaken, setSlotTaken] = useState(false);
  const errorRef = useRef<HTMLDivElement>(null);
  const focusTitle = useRef(false);
  const reduceMotion = useReducedMotionConfig();
  const [moreOpen, setMoreOpen] = useState(false);
  const moreId = useId();

  // Once the catalog arrives, apply ?services= : keep only ids that exist, preselect them and start at the specialist step.
  if (catalog.data && !initialised) {
    setInitialised(true);
    const known = new Set(catalog.data.catalog.map(item => item.service.id));
    const wanted = parseRequestedServiceIds(search).filter(id => known.has(id)).slice(0, MAX_SELECTED_SERVICES);
    if (wanted.length && catalog.data.onlineBookingAvailable !== false) {
      setServiceIds(wanted);
      setStep(1);
    }
  }

  const startsAt = useMemo(() => (dateTime ? new Date(dateTime) : null), [dateTime]);
  const serviceId = serviceIds[0];
  const isMultiService = serviceIds.length > 1;
  const availabilityInput = useMemo(() => ({ slug, serviceId: serviceId ?? "pending-service", staffProfileId: staffProfileId ?? "pending-specialist", startsAt: startsAt ?? new Date(0) }), [slug, serviceId, staffProfileId, startsAt]);
  const multiAvailabilityInput = useMemo(() => ({ slug, serviceIds: isMultiService ? serviceIds : ["pending_service_001", "pending_service_002"], staffProfileId: staffProfileId ?? "pending-specialist", startsAt: startsAt ?? new Date(0) }), [slug, serviceIds, isMultiService, staffProfileId, startsAt]);
  const singleAvailability = trpc.public.checkAvailability.useQuery(availabilityInput, { enabled: Boolean(serviceId && staffProfileId && startsAt && step >= 2 && !isMultiService) });
  const multiAvailability = trpc.public.checkMultiAvailability.useQuery(multiAvailabilityInput, { enabled: Boolean(isMultiService && staffProfileId && startsAt && step >= 2) });
  const availability = isMultiService ? multiAvailability : singleAvailability;
  // Device-local "my bookings" entry: salon, service names and start time only, never the manage token or link.
  const rememberOnDevice = () => {
    if (!catalog.data || !startsAt) return;
    addDeviceBooking({ slug, salonName: catalog.data.location.name, services: selectedServices.map(service => service.nameKa), startsAt: startsAt.toISOString() });
  };
  const onCommitSuccess = (result: { confirmationToken: string; assignedStaffName?: string; endsAt: Date }) => {
    setInteractionError(null);
    setSlotTaken(false);
    setConfirmation({ token: result.confirmationToken, assignedStaffName: result.assignedStaffName, endsAt: result.endsAt });
    rememberOnDevice();
  };
  // A taken slot sends the visitor back to the time step with an alert next to the slots (no title focus: the alert takes it).
  const onCommitError = (error: { message: string; data?: unknown }) => {
    // Refetch the availability check too, so its cached "available" can't wave the lost slot through again.
    if (isSlotTakenError(error)) { setInteractionError(null); setSlotTaken(true); setStep(2); void (isMultiService ? multiAvailability : singleAvailability).refetch(); return; }
    setInteractionError({ kind: "submit", ...(isNetworkError(error) ? text.issues.network : text.issues.submit) });
  };
  const commitBooking = trpc.public.commitBooking.useMutation({ onSuccess: onCommitSuccess, onError: onCommitError });
  const commitMultiBooking = trpc.public.commitMultiBooking.useMutation({ onSuccess: onCommitSuccess, onError: onCommitError });
  const submitting = commitBooking.isPending || commitMultiBooking.isPending;
  const selectedServices = catalog.data?.catalog.filter(item => serviceIds.includes(item.service.id)).map(item => item.service) ?? [];
  const totalMinutes = selectedServices.reduce((sum, service) => sum + service.defaultDurationMinutes, 0);
  const totalTetri = selectedServices.reduce((sum, service) => sum + service.priceTetri, 0);
  const anyFrom = selectedServices.some(service => service.isFromPrice);
  const money = (tetri: number, from?: boolean) => priceLabel(text, tetri, from);
  const selectedStaff = catalog.data?.team.find(member => member.id === staffProfileId);
  const eligibleTeam = getEligibleTeam(catalog.data?.team ?? [], serviceIds);
  const staffLabel = staffProfileId === ANY_AVAILABLE ? (availability.data?.staffName ? text.autoPicked(availability.data.staffName) : text.anyStaff) : selectedStaff?.name;

  useEffect(() => {
    if (!interactionError) return;
    const frame = requestAnimationFrame(() => errorRef.current?.focus());
    return () => cancelAnimationFrame(frame);
  }, [interactionError]);

  // After the user moves between steps, put focus on the new step title (the new step mounts after the old one fades out).
  const focusStepTitle = (node: HTMLHeadingElement | null) => {
    if (!node || !focusTitle.current) return;
    focusTitle.current = false;
    node.focus();
  };

  const goToStep = (target: number) => { focusTitle.current = true; setInteractionError(null); setSlotTaken(false); setStep(target); };
  const clearIssue = (kind?: BookingIssueKind) => setInteractionError(current => !kind || current?.kind === kind ? null : current);
  const selectService = (value: string) => { setServiceIds(current => current.includes(value) ? current.filter(item => item !== value) : [...current, value]); setStaffProfileId(undefined); setDateTime(""); clearIssue("service"); };
  const selectStaff = (value: string) => { setStaffProfileId(value); setDateTime(""); clearIssue("staff"); };
  const selectDateTime = (value: string) => { setDateTime(value); setSlotTaken(false); clearIssue("time"); };
  const currentValidation = () => getBookingValidationIssue({ step, serviceId, staffProfileId, startsAt, available: slotTaken ? false : availability.data?.available, firstName, phone, termsAccepted, locale });
  const submitBooking = () => {
    if (!serviceId || !staffProfileId || !startsAt) return;
    const sharedPayload = { slug, staffProfileId, startsAt, firstName, lastName: lastName || undefined, phone, email: email || undefined, customerNote: customerNote || undefined, bookingTermsConsent: true as const, idempotencyKey };
    if (isMultiService) commitMultiBooking.mutate({ ...sharedPayload, serviceIds });
    else commitBooking.mutate({ ...sharedPayload, serviceId });
  };
  const advanceBooking = () => {
    if (submitting) return;
    const issue = currentValidation();
    if (issue) { setInteractionError(issue); return; }
    setInteractionError(null);
    if (step < 3) goToStep(step + 1);
    else submitBooking();
  };

  const profileHref = catalog.data ? `/salon/${slug}` : "/salons";
  const available = catalog.data?.onlineBookingAvailable !== false;

  if (catalog.data && confirmation && selectedServices.length && startsAt) {
    return <div className="cw min-h-screen">
      <CatalogHeader />
      <main id="main-content" tabIndex={-1} className="cwb-page">
        <BookingConfirmation confirmationToken={confirmation.token} assignedStaffName={confirmation.assignedStaffName} serviceName={selectedServices.map(service => service.nameKa).join(" + ")} services={selectedServices.map(service => ({ name: service.nameKa, priceTetri: service.priceTetri, isFromPrice: service.isFromPrice }))} totalTetri={totalTetri} totalIsFrom={anyFrom} startsAt={startsAt} endsAt={confirmation.endsAt} locationName={catalog.data.location.name} locationAddress={catalog.data.location.address} timeZone={catalog.data.location.timezone} />
      </main>
      <CatalogFooter />
    </div>;
  }

  const blockedIssue = catalog.data && available ? currentValidation() : null;
  const barBlocked = Boolean(blockedIssue) || submitting;
  const timeZone = catalog.data?.location.timezone;
  const choices: BookingChoice[] = [];
  if (step >= 1 && selectedServices.length) choices.push({ id: "services", text: selectedServices.map(service => service.nameKa).join(" + "), onChange: () => goToStep(0), changeLabel: text.change, changeAria: text.changeAria(text.services) });
  if (step >= 2 && staffLabel) choices.push({ id: "staff", text: staffLabel, onChange: () => goToStep(1), changeLabel: text.change, changeAria: text.changeAria(text.specialist) });
  if (step >= 3 && startsAt) choices.push({ id: "time", text: formatDateTimeForLocale(startsAt, locale, timeZone), onChange: () => goToStep(2), changeLabel: text.change, changeAria: text.changeAria(text.dateTime) });
  if (step >= 1 && selectedServices.length) choices.push({ id: "price", text: money(totalTetri, anyFrom) });

  return <div className="cw min-h-screen">
    <CatalogHeader />
    <main id="main-content" tabIndex={-1} className="cwb-page">
      <div className="cwb-card">
        <div className="cwb-head">
          {step > 0 && catalog.data && available ? <button type="button" className="cwb-btn" onClick={() => goToStep(step - 1)}><ChevronLeft className="size-4" aria-hidden="true" />{text.back}</button>
            : <Link href={profileHref} className="cwb-btn"><ChevronLeft className="size-4" aria-hidden="true" />{catalog.data ? text.profile : text.catalog}</Link>}
          <span className="cwb-head-title">{text.onlineBooking}</span>
          <Link href={profileHref} className="cwb-btn" aria-label={text.closeBooking}><X className="size-4" aria-hidden="true" /></Link>
        </div>

        {catalog.isLoading ? <div className="cwb-step"><p role="status" className="cwb-empty">{ui.loading}</p></div> : null}
        {catalog.isError ? <div className="cwb-step"><BookingNotice tone="error" title={ui.unavailable}><button type="button" className="cwb-btn cwb-btn-danger cwb-btn-sm" onClick={() => void catalog.refetch()}><RefreshCw className="size-4" aria-hidden="true" />{text.retry}</button></BookingNotice></div> : null}
        {catalog.data === null ? <div className="cwb-step"><div className="cwb-empty"><strong>{ui.inactive}</strong>{ui.inactiveLead}</div><div className="cwb-actions mt-4"><Link href="/salons" className="cwb-btn cwb-btn-primary">{ui.returnToList}</Link></div></div> : null}
        {catalog.data && !available ? <div className="cwb-step">
          <div className="cwb-empty"><strong>{ui.trialPaused}</strong>{ui.trialPausedLead}</div>
          <div className="cwb-actions mt-4"><Link href={`/salon/${slug}`} className="cwb-btn cwb-btn-primary">{ui.viewSalon}</Link></div>
        </div> : null}

        {catalog.data && available ? <>
          <BookingRail steps={[...text.steps]} current={step} label={text.progress} />
          <BookingBusinessStrip name={catalog.data.location.name} address={catalog.data.location.address} action={<button type="button" className="cwb-more-btn" aria-expanded={moreOpen} aria-controls={moreId} onClick={() => setMoreOpen(open => !open)}><Clock className="size-4 shrink-0" aria-hidden="true" /><span>{text.hoursAndContact}</span><ChevronDown className="cwb-more-chevron size-4 shrink-0" aria-hidden="true" /></button>} />
          {moreOpen ? <div id={moreId} className="cwb-more"><LocationContext location={catalog.data.location} /></div> : null}
          <BookingChoiceStrip choices={choices} label={text.choicesLabel} />
          {interactionError ? <div className="cwb-pad"><BookingErrorNotice issue={interactionError} errorRef={errorRef} onRetry={interactionError.kind === "submit" ? submitBooking : undefined} /></div> : null}
          <AnimatePresence mode="wait" initial={false}>
          <motion.div className="cwb-step" key={step} initial={reduceMotion ? false : { opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0, transition: { duration: 0.18, ease: EASE } }} exit={reduceMotion ? undefined : { opacity: 0, transition: { duration: 0.12, ease: [0.4, 0, 1, 1] } }}>
            <BookingStepHeader title={text.stepCopy[step]!.title} description={text.stepCopy[step]!.lede} headingRef={focusStepTitle} />
            <div className="mt-4">
              {step === 0 ? <ServiceStep catalog={catalog.data.catalog} selectedIds={serviceIds} onSelect={selectService} /> : null}
              {step === 1 ? <StaffStep team={eligibleTeam} selectedId={staffProfileId} onSelect={selectStaff} onEditServices={() => goToStep(0)} /> : null}
              {step === 2 ? <TimeStep slug={slug} serviceId={serviceId} serviceIds={serviceIds} multiService={isMultiService} staffProfileId={staffProfileId} workingHours={catalog.data.location.workingHours} timezone={catalog.data.location.timezone} dateTime={dateTime} durationMinutes={totalMinutes} onChange={selectDateTime} availability={availability} slotTaken={slotTaken} /> : null}
              {step === 3 ? <ConfirmStep location={catalog.data.location} services={selectedServices} staffLabel={staffLabel} startsAt={startsAt} totalMinutes={totalMinutes} totalTetri={totalTetri} totalIsFrom={anyFrom} onEdit={goToStep} contactError={interactionError?.kind === "contact"} firstName={firstName} lastName={lastName} phone={phone} email={email} customerNote={customerNote} termsAccepted={termsAccepted} onFirstName={value => { setFirstName(value); clearIssue("contact"); }} onLastName={setLastName} onPhone={value => { setPhone(value); clearIssue("contact"); }} onEmail={setEmail} onNote={setCustomerNote} onTerms={value => { setTermsAccepted(value); clearIssue("contact"); }} /> : null}
            </div>
          </motion.div>
          </AnimatePresence>
          <BookingBar
            summary={selectedServices.length ? text.summary(selectedServices.length, totalMinutes) : undefined}
            total={selectedServices.length ? money(totalTetri, anyFrom) : undefined}
            label={!selectedServices.length ? text.pickService : step < 3 ? text.next : submitting ? text.sending : text.book}
            blocked={barBlocked}
            hint={selectedServices.length ? blockedIssue?.title : undefined}
            conversionEvent={step === 3 ? "BOOKING_SUBMIT_SELECTED" : undefined}
            onClick={advanceBooking}
          />
        </> : null}
      </div>
    </main>
    <CatalogFooter />
  </div>;
}

export function LocationContext({ location }: { location: BookingLocation }) {
  const { locale } = usePublicLocale();
  const text = flowUi[locale];
  return <div className="cwb-more-body">
    {location.publicDescription ? <p>{location.publicDescription}</p> : null}
    {location.workingHours.length ? <div>
      <p className="cwb-caption flex items-center gap-2"><CalendarClock className="size-4" aria-hidden="true" />{text.staffHours}</p>
      <ul>{location.workingHours.map(rule => <li key={rule.weekday}>{weekdayName(rule.weekday, locale)} · <span className="cw-num">{rule.startLocalTime}–{rule.endLocalTime}</span></li>)}</ul>
    </div> : <p className="cwb-empty">{text.noHours}</p>}
    {location.phone ? <a href={`tel:${location.phone}`}><Phone className="size-4" aria-hidden="true" /><span className="cw-num">{location.phone}</span></a> : null}
    {location.email ? <a href={`mailto:${location.email}`}><Mail className="size-4" aria-hidden="true" />{location.email}</a> : null}
  </div>;
}

export function weekdayName(day: number, locale: PublicLocale = "ka") { return DATE_NAMES[locale].weekdayFull[day] ?? flowUi[locale].dayFallback; }

function ServiceStep({ catalog, selectedIds, onSelect }: { catalog: Array<{ service: BookingService; category: { nameKa: string } }>; selectedIds: string[]; onSelect: (id: string) => void }) {
  const text = flowUi[usePublicLocale().locale];
  const groups = useMemo(() => {
    const map = new Map<string, BookingService[]>();
    for (const { service, category } of catalog) map.set(category.nameKa, [...(map.get(category.nameKa) ?? []), service]);
    return Array.from(map, ([name, items]) => ({ name, items }));
  }, [catalog]);
  if (!groups.length) return <div className="cwb-empty"><strong>{text.noServicesTitle}</strong>{text.noServicesText}</div>;
  return <div className="grid gap-4">{groups.map((group, index) => {
    const picked = group.items.filter(service => selectedIds.includes(service.id)).length;
    return <div key={group.name} className="cwb-group" role="group" aria-labelledby={`booking-group-${index}`}>
      <div className="cwb-group-head"><h2 id={`booking-group-${index}`}>{group.name}</h2><span className="cwb-group-count cw-num">{picked ? `${picked} / ${group.items.length}` : group.items.length}</span></div>
      {group.items.map(service => <BookingChoiceCard key={service.id} conversionEvent="BOOKING_SERVICE_SELECTED" label={text.choose(service.nameKa)} selected={selectedIds.includes(service.id)} onSelect={() => onSelect(service.id)}>
        <span className="cwb-row-line"><span className="cwb-row-title">{service.nameKa}</span><span className="cwb-price">{priceLabel(text, service.priceTetri, service.isFromPrice)}</span></span>
        <span className="cwb-row-meta block"><span className="cw-num">{service.defaultDurationMinutes} {text.minutes}</span></span>
      </BookingChoiceCard>)}
    </div>;
  })}</div>;
}

const initialOf = (name: string) => name.trim().charAt(0).toLocaleUpperCase() || "·";

export function StaffStep({ team, selectedId, onSelect, onEditServices }: { team: BookingTeamMember[]; selectedId?: string; onSelect: (id: string) => void; onEditServices?: () => void }) {
  const text = flowUi[usePublicLocale().locale];
  if (!team.length) return <div className="cwb-empty"><strong>{text.noStaffTitle}</strong>{text.noStaffText}{onEditServices ? <div className="mt-3"><button type="button" className="cwb-btn cwb-btn-line cwb-btn-sm" onClick={onEditServices}>{text.changeServices}</button></div> : null}</div>;
  return <div className="cwb-list" role="radiogroup" aria-label={text.specialist}>
    <BookingChoiceCard kind="radio" name="booking-specialist" conversionEvent="BOOKING_ANY_AVAILABLE_SELECTED" label={text.anyStaffLabel} selected={selectedId === ANY_AVAILABLE} onSelect={() => onSelect(ANY_AVAILABLE)} leading={<span className="cwb-avatar" aria-hidden="true"><Users className="size-5" /></span>}>
      <span className="cwb-row-title block">{text.anyStaff}</span>
      <span className="cwb-row-meta block">{text.anyStaffMeta}</span>
    </BookingChoiceCard>
    {team.map(member => <BookingChoiceCard key={member.id} kind="radio" name="booking-specialist" conversionEvent="BOOKING_SPECIALIST_SELECTED" label={text.choose(member.name)} selected={member.id === selectedId} onSelect={() => onSelect(member.id)} leading={<span className="cwb-avatar" aria-hidden="true">{initialOf(member.name)}</span>}>
      <span className="cwb-row-title block">{member.name}</span>
      {member.specialty ? <span className="cwb-row-meta block">{member.specialty}</span> : null}
      {member.bio ? <span className="cwb-row-meta block">{member.bio}</span> : null}
    </BookingChoiceCard>)}
  </div>;
}

const DAYS_AHEAD = 14;

function TimeStep({ slug, serviceId, serviceIds, multiService, staffProfileId, workingHours, timezone, dateTime, durationMinutes, onChange, availability, slotTaken }: { slug: string; serviceId?: string; serviceIds: string[]; multiService: boolean; staffProfileId?: string; workingHours: Array<{ weekday: number }>; timezone: string; dateTime: string; durationMinutes: number; onChange: (value: string) => void; availability: { isLoading: boolean; isError: boolean; data?: { available: boolean; reason?: string } }; slotTaken: boolean }) {
  const { locale } = usePublicLocale();
  const text = flowUi[locale];
  const openWeekdays = useMemo(() => new Set(workingHours.map(hour => hour.weekday)), [workingHours]);
  const today = useMemo(() => dateKeyInTimeZone(new Date(), timezone), [timezone]);
  // When no working-hour rule exists at all, nothing is marked closed and availability is decided by the server.
  const days = useMemo(() => Array.from({ length: DAYS_AHEAD }, (_, index) => { const key = addDaysKey(today, index); return { key, closed: openWeekdays.size > 0 && !openWeekdays.has(schemaWeekdayOf(key)) }; }), [today, openWeekdays]);
  const firstOpen = useMemo(() => days.find(day => !day.closed)?.key ?? today, [days, today]);
  const [selectedDate, setSelectedDate] = useState(() => dateTime ? dateKeyInTimeZone(new Date(dateTime), timezone) : firstOpen);

  const dayIsOpen = !(days.find(day => day.key === selectedDate)?.closed ?? false);
  const singleSlotsQuery = trpc.public.availableSlots.useQuery(
    { slug, serviceId: serviceId ?? "", staffProfileId: staffProfileId ?? "", date: selectedDate },
    { enabled: Boolean(serviceId && staffProfileId && selectedDate && dayIsOpen && !multiService) },
  );
  const multiSlotsQuery = trpc.public.multiAvailableSlots.useQuery(
    { slug, serviceIds: multiService ? serviceIds : ["pending_service_001", "pending_service_002"], staffProfileId: staffProfileId ?? "", date: selectedDate },
    { enabled: Boolean(multiService && serviceIds.length > 1 && staffProfileId && selectedDate && dayIsOpen) },
  );
  const slotsQuery = multiService ? multiSlotsQuery : singleSlotsQuery;
  const slots = slotsQuery.data?.slots ?? [];
  const slotsByPeriod = useMemo(() => ({
    დილა: slots.filter(slot => Number(slot.label.split(":")[0]) < 12),
    შუადღე: slots.filter(slot => { const hour = Number(slot.label.split(":")[0]); return hour >= 12 && hour < 17; }),
    საღამო: slots.filter(slot => Number(slot.label.split(":")[0]) >= 17),
  }), [slots]);

  // A commit that lost the slot lands here: refresh the slots with the existing query and move focus to the alert.
  const takenRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!slotTaken) return;
    if (dayIsOpen) void slotsQuery.refetch({ cancelRefetch: false });
    const frame = requestAnimationFrame(() => takenRef.current?.focus());
    return () => cancelAnimationFrame(frame);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slotTaken]);

  const pickDate = (day: string) => { setSelectedDate(day); if (dateTime) onChange(""); };
  const nextOpenDay = days.find(day => day.key > selectedDate && !day.closed);
  const unavailable = slotTaken || Boolean(dateTime && (availability.isError || availability.data?.available === false));

  return <div className="grid gap-4">
    <BookingDateStrip days={days} selected={selectedDate} todayKey={today} onSelect={pickDate} />
    <p className="cwb-when"><span>{formatDateKeyLong(selectedDate, locale)}</span><span>{text.duration}<strong className="cw-num">{durationMinutes} {text.minutes}</strong></span></p>
    <div aria-live="polite" className="grid min-h-24 gap-4">
      {unavailable ? <BookingNotice tone="error" role="alert" noticeRef={takenRef} title={text.taken} /> : null}
      {!dayIsOpen ? <p className="cwb-empty">{text.closedDay}</p>
        : slotsQuery.isLoading ? <p role="status" className="cwb-muted">{text.slotsLoading}</p>
        : slotsQuery.isError ? <BookingNotice tone="error" role="alert" title={text.slotsFailed}><button type="button" className="cwb-btn cwb-btn-danger cwb-btn-sm" onClick={() => void slotsQuery.refetch()}><RefreshCw className="size-4" aria-hidden="true" />{text.retry}</button></BookingNotice>
        : slots.length ? <div>
          <BookingSlotGroup conversionEvent="BOOKING_TIME_SELECTED" title={text.morning} slots={slotsByPeriod.დილა} selectedStartsAt={slotTaken ? "" : dateTime} onSelect={onChange} />
          <BookingSlotGroup conversionEvent="BOOKING_TIME_SELECTED" title={text.afternoon} slots={slotsByPeriod.შუადღე} selectedStartsAt={slotTaken ? "" : dateTime} onSelect={onChange} />
          <BookingSlotGroup conversionEvent="BOOKING_TIME_SELECTED" title={text.evening} slots={slotsByPeriod.საღამო} selectedStartsAt={slotTaken ? "" : dateTime} onSelect={onChange} />
        </div>
        : <div className="cwb-empty"><strong>{text.noSlotsTitle}</strong>{text.noSlotsText}
          <div className="cwb-actions mt-3">
            {nextOpenDay ? <button type="button" className="cwb-btn cwb-btn-line cwb-btn-sm" onClick={() => pickDate(nextOpenDay.key)}>{text.nextDay}</button> : null}
            <Link href={`/waitlist/${slug}?serviceId=${encodeURIComponent(serviceId ?? "")}&staffProfileId=${encodeURIComponent(staffProfileId ?? "")}&date=${encodeURIComponent(selectedDate)}`} data-conversion-event="BOOKING_WAITLIST_HANDOFF" className="cwb-link">{text.waitlist}</Link>
          </div></div>}
    </div>
    {dateTime && !unavailable && availability.isLoading ? <p role="status" className="cwb-muted">{text.checking}</p> : null}
    {dateTime && !unavailable && availability.data?.available ? <BookingNotice tone="ok" role="status">{text.available}</BookingNotice> : null}
  </div>;
}

function FieldError({ id, children }: { id: string; children: React.ReactNode }) {
  return <p id={id} className="cwb-error"><CircleAlert className="size-4" aria-hidden="true" />{children}</p>;
}

function ConfirmStep({ location, services, staffLabel, startsAt, totalMinutes, totalTetri, totalIsFrom, onEdit, contactError, firstName, lastName, phone, email, customerNote, termsAccepted, onFirstName, onLastName, onPhone, onEmail, onNote, onTerms }: { location: BookingLocation; services: BookingService[]; staffLabel?: string; startsAt: Date | null; totalMinutes: number; totalTetri: number; totalIsFrom: boolean; onEdit: (step: number) => void; contactError: boolean; firstName: string; lastName: string; phone: string; email: string; customerNote: string; termsAccepted: boolean; onFirstName: (value: string) => void; onLastName: (value: string) => void; onPhone: (value: string) => void; onEmail: (value: string) => void; onNote: (value: string) => void; onTerms: (value: boolean) => void }) {
  const { locale } = usePublicLocale();
  const text = flowUi[locale];
  const edit = (label: string, target: number) => <button type="button" className="cwb-link" aria-label={text.changeAria(label)} onClick={() => onEdit(target)}>{text.change}</button>;
  const nameInvalid = contactError && !firstName.trim();
  const phoneInvalid = contactError && !phone.trim();
  const termsInvalid = contactError && !termsAccepted;
  return <div className="grid gap-5">
    <div className="cwb-review-wrap"><table className="cwb-review"><caption className="sr-only">{text.summaryCaption}</caption><tbody>
      <tr><th scope="row">{text.business}</th><td colSpan={2}>{location.name}{location.address ? <span className="block text-sm font-normal text-muted-foreground">{location.address}</span> : null}</td></tr>
      <tr><th scope="row">{text.dateTime}</th><td className="cw-num">{startsAt ? formatDateTimeForLocale(startsAt, locale, location.timezone) : "—"}</td><td className="cwb-review-edit">{edit(text.dateTime, 2)}</td></tr>
      <tr><th scope="row">{text.specialist}</th><td>{staffLabel ?? "—"}</td><td className="cwb-review-edit">{edit(text.specialist, 1)}</td></tr>
      <tr><th scope="row">{text.duration2}</th><td colSpan={2} className="cw-num">{totalMinutes} {text.minutes}</td></tr>
      <tr><th scope="row">{text.services}</th><td><ul className="cwb-review-services">{services.map(service => <li key={service.id}><span>{service.nameKa}</span><span className="cwb-price">{priceLabel(text, service.priceTetri, service.isFromPrice)}</span></li>)}</ul></td><td className="cwb-review-edit">{edit(text.services, 0)}</td></tr>
      <tr className="cwb-review-total"><th scope="row">{text.total}</th><td colSpan={2} className="cw-num">{priceLabel(text, totalTetri, totalIsFrom)}</td></tr>
    </tbody></table></div>
    <div className="cwb-fields">
      <div className="cwb-fields cwb-two">
        <div className="cwb-field">
          <label className="cwb-label" htmlFor="booking-first-name">{text.firstName}</label>
          <input id="booking-first-name" className="cwb-input" value={firstName} onChange={event => onFirstName(event.target.value)} autoComplete="name" aria-required="true" aria-invalid={nameInvalid} aria-describedby={nameInvalid ? "booking-first-name-error" : undefined} />
          {nameInvalid ? <FieldError id="booking-first-name-error">{text.issues.firstName.title}</FieldError> : null}
        </div>
        <div className="cwb-field">
          <label className="cwb-label" htmlFor="booking-last-name">{text.lastName} <span className="cwb-opt">{text.optional}</span></label>
          <input id="booking-last-name" className="cwb-input" value={lastName} onChange={event => onLastName(event.target.value)} autoComplete="family-name" />
        </div>
      </div>
      <div className="cwb-field">
        <label className="cwb-label" htmlFor="booking-phone">{text.phone}</label>
        <div className="cwb-affix" data-invalid={phoneInvalid}>
          <span className="cwb-affix-prefix" aria-hidden="true">+995</span>
          <input id="booking-phone" className="cwb-input" type="tel" value={phone} onChange={event => onPhone(event.target.value)} autoComplete="tel" inputMode="tel" placeholder={text.phonePlaceholder} aria-required="true" aria-invalid={phoneInvalid} aria-describedby={phoneInvalid ? "booking-phone-help booking-phone-error" : "booking-phone-help"} />
        </div>
        <p id="booking-phone-help" className="cwb-hint">{text.phoneHelp}</p>
        {phoneInvalid ? <FieldError id="booking-phone-error">{text.issues.phone.title}</FieldError> : null}
      </div>
      <div className="cwb-field">
        <label className="cwb-label" htmlFor="booking-email">{text.email} <span className="cwb-opt">{text.optional}</span></label>
        <input id="booking-email" className="cwb-input" type="email" value={email} onChange={event => onEmail(event.target.value)} autoComplete="email" />
      </div>
      <div className="cwb-field">
        <label className="cwb-label" htmlFor="booking-note">{text.note} <span className="cwb-opt">{text.optional}</span></label>
        <textarea id="booking-note" className="cwb-input" value={customerNote} onChange={event => onNote(event.target.value)} />
      </div>
      <div className="cwb-field">
        <label className="cwb-agree" data-invalid={termsInvalid}>
          <input type="checkbox" className="cwb-check" checked={termsAccepted} onChange={event => onTerms(event.target.checked)} aria-required="true" aria-invalid={termsInvalid} aria-describedby={termsInvalid ? "booking-terms-error" : undefined} />
          <span>{text.consent}</span>
        </label>
        {termsInvalid ? <FieldError id="booking-terms-error">{text.issues.terms.title}</FieldError> : null}
      </div>
    </div>
  </div>;
}

export function BookingConfirmation({ confirmationToken, assignedStaffName, serviceName, services, totalTetri, totalIsFrom, startsAt, endsAt, locationName, locationAddress, timeZone }: { confirmationToken: string; assignedStaffName?: string; serviceName: string; services?: Array<{ name: string; priceTetri: number; isFromPrice?: boolean }>; totalTetri?: number; totalIsFrom?: boolean; startsAt: Date; endsAt: Date; locationName: string; locationAddress?: string | null; timeZone?: string }) {
  const { locale } = usePublicLocale();
  const ui = bookingUi[locale];
  const text = flowUi[locale];
  const titleRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => { titleRef.current?.focus(); }, []);
  const calendarDescription = locale === "en" ? `${BRAND.name} booking. Status: awaiting salon confirmation.${assignedStaffName ? ` Specialist: ${assignedStaffName}.` : ""}` : locale === "ru" ? `Запись ${BRAND.name}. Статус: ожидает подтверждения салоном.${assignedStaffName ? ` Специалист: ${assignedStaffName}.` : ""}` : `${BRAND.name} ჯავშანი. სტატუსი: სალონის დადასტურებას ელოდება.${assignedStaffName ? ` სპეციალისტი: ${assignedStaffName}.` : ""}`;
  const saveToCalendar = () => downloadBookingCalendar({ startsAt, endsAt, title: `${serviceName} — ${locationName}`, location: locationAddress ?? locationName, description: calendarDescription });
  return <div className="cwb-card">
    <div className="cwb-done">
      <div className="flex items-start gap-3">
        <span className="cwb-done-mark" aria-hidden="true"><Check className="size-6" /></span>
        <div className="min-w-0">
          <h1 ref={titleRef} tabIndex={-1}>{ui.received}</h1>
          <p className="cwb-step-lede">{ui.receivedLead}</p>
          <p className="mt-3"><span className="cwb-pill" data-tone="ok"><Check className="size-3.5" aria-hidden="true" />{text.stamp}</span></p>
        </div>
      </div>
      <div className="cwb-review-wrap"><table className="cwb-review cwb-review-flat"><caption className="sr-only">{text.detailsCaption}</caption><tbody>
        <tr><th scope="row">{text.business}</th><td>{locationName}{locationAddress ? <span className="block text-sm font-normal text-muted-foreground">{locationAddress}</span> : null}</td></tr>
        <tr><th scope="row">{text.dateTime}</th><td className="cw-num">{formatDateTimeForLocale(startsAt, locale, timeZone)}</td></tr>
        {assignedStaffName ? <tr><th scope="row">{text.specialist}</th><td><span className="sr-only">{ui.assigned} </span>{assignedStaffName}</td></tr> : null}
        <tr><th scope="row">{text.services}</th><td>{services?.length ? <ul className="cwb-review-services">{services.map(service => <li key={service.name}><span>{service.name}</span><span className="cwb-price">{priceLabel(text, service.priceTetri, service.isFromPrice)}</span></li>)}</ul> : serviceName}</td></tr>
        {totalTetri !== undefined ? <tr className="cwb-review-total"><th scope="row">{text.total}</th><td className="cw-num">{priceLabel(text, totalTetri, totalIsFrom)}</td></tr> : null}
      </tbody></table></div>
      <div>
        <p className="cwb-caption">{ui.code}</p>
        <code aria-label={ui.code} className="cwb-code">{confirmationToken}</code>
      </div>
      <div className="cwb-actions">
        <Link href={`/manage-booking/${confirmationToken}`} className="cwb-btn cwb-btn-primary">{ui.manage}</Link>
        <button type="button" className="cwb-btn cwb-btn-line" onClick={saveToCalendar}><CalendarPlus className="size-4" aria-hidden="true" />{ui.calendar}</button>
        <Link href="/salons" className="cwb-btn cwb-btn-line">{ui.returnToList}</Link>
      </div>
    </div>
  </div>;
}

function BookingErrorNotice({ issue, errorRef, onRetry }: { issue: BookingValidationIssue; errorRef: React.RefObject<HTMLDivElement | null>; onRetry?: () => void }) {
  const text = flowUi[usePublicLocale().locale];
  return <BookingNotice tone="error" role="alert" noticeRef={errorRef} title={issue.title}>
    <p>{issue.description}</p>
    {onRetry ? <button type="button" className="cwb-btn cwb-btn-danger cwb-btn-sm" onClick={onRetry}><RefreshCw className="size-4" aria-hidden="true" />{text.retry}</button> : null}
  </BookingNotice>;
}
