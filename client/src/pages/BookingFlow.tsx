import { Ring } from "@/components/brand/Ring";
import { CatalogHeader } from "@/components/catalog/CatalogChrome";
import { EASE } from "@/components/catalog/HomeMotion";
import { BookingBar, BookingBusinessStrip, BookingChoiceCard, BookingDateStrip, BookingNotice, BookingRail, BookingSlotGroup, BookingStaffCard, BookingStepHeader, moveRadioFocus, DATE_NAMES, addDaysKey, schemaWeekdayOf } from "@/components/public/BookingPrimitives";
import { usePublicMeta } from "@/components/public/PublicMeta";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { type PublicLocale, usePublicLocale } from "@/contexts/PublicLocaleContext";
import { downloadBookingCalendar } from "@/lib/bookingCalendar";
import { addDeviceBooking } from "@/lib/deviceSaved";
import { formatGelTetri } from "@/lib/presentation";
import { trpc } from "@/lib/trpc";
import { BRAND } from "@shared/brand";
import { MAX_SELECTED_SERVICES } from "@shared/validation";
import { dateKeyInTimeZone } from "@shared/timezones";
import { AnimatePresence, motion, useReducedMotionConfig } from "framer-motion";
import { CalendarClock, CalendarPlus, ChevronDown, ChevronLeft, CircleAlert, Clock, Link2, Mail, MapPin, Phone, RefreshCw, Share2, Sparkles, X } from "lucide-react";
import React, { useEffect, useId, useMemo, useRef, useState } from "react";
import { Link, useLocation, useRoute, useSearch } from "wouter";
import { toast } from "sonner";
import "@/components/catalog/booking.css";

export const bookingUi = {
  ka: { loading: "ჩაწერის კატალოგი იტვირთება…", unavailable: "ჩაწერის მონაცემები დროებით მიუწვდომელია. შეამოწმე კავშირი და სცადე მოგვიანებით.", inactive: "ეს ჩაწერის ბმული აღარ არის აქტიური", inactiveLead: "ფილიალი შესაძლოა გათიშულია ან ბმული არასწორია. დაბრუნდი კატალოგში და აირჩიე აქტიური ფილიალი.", trialPaused: "ონლაინ ჩაწერა ამ სალონისთვის დროებით მიუწვდომელია", trialPausedLead: "სალონის საჯარო ინფორმაცია არ წაშლილა, თუმცა ამ ეტაპზე ახალი ონლაინ ჯავშანი ვერ მიიღება. დეტალებისთვის დაუკავშირდი სალონს.", viewSalon: "სალონის გვერდის ნახვა", received: "ჯავშანი გაიგზავნა", receivedLead: "ახლა ჯავშანს დადასტურება სჭირდება. სტატუსს ჯავშნის გვერდზე ნახავ.", assigned: "შენი სპეციალისტი:", calendar: "კალენდარში დამატება", map: "რუკაზე ნახვა", share: "გაზიარება", copied: "დაკოპირდა", manage: "ჯავშნის გვერდი", returnToList: "კატალოგში დაბრუნება", whatNext: "რა ხდება შემდეგ", next1: (name: string) => `${name} ჯავშანს განიხილავს.`, next2: "სტატუსს ნახავ ჯავშნის პირად გვერდზე.", next3: (minutes: number) => minutes % 60 === 0 ? `შეცვლა ან გაუქმება შეგიძლია ვიზიტამდე ${minutes / 60} საათით ადრე.` : `შეცვლა ან გაუქმება შეგიძლია ვიზიტამდე ${minutes} წუთით ადრე.`, privateTitle: "ჯავშნის პირადი ბმული", privateText: "ჯავშნის შეცვლა ან გაუქმება მხოლოდ ამ ბმულით შეიძლება. შეინახე და სხვას ნუ გაუზიარებ.", copyLink: "ბმულის კოპირება", linkCopied: "ბმული დაკოპირდა" },
  en: { loading: "Loading booking catalog…", unavailable: "Booking data is temporarily unavailable. Check your connection and try again.", inactive: "This booking link is no longer active", inactiveLead: "The location may be inactive or the link may be incorrect. Return to the catalog and choose an active business.", trialPaused: "Online booking is temporarily unavailable", trialPausedLead: "This salon profile remains available, but it is not accepting new online bookings at this time. Please contact the salon for details.", viewSalon: "View salon profile", received: "Booking sent", receivedLead: "The salon now needs to confirm your booking. You can follow its status on your booking page.", assigned: "Your specialist:", calendar: "Add to calendar", map: "View on map", share: "Share", copied: "Copied", manage: "Booking page", returnToList: "Back to the catalog", whatNext: "What happens next", next1: (name: string) => `${name} will review your booking.`, next2: "You can follow the status on your private booking page.", next3: (minutes: number) => minutes % 60 === 0 ? `You can change or cancel up to ${minutes / 60} ${minutes === 60 ? "hour" : "hours"} before the visit.` : `You can change or cancel up to ${minutes} minutes before the visit.`, privateTitle: "Your private booking link", privateText: "This link is the only way to change or cancel the booking. Save it and do not share it with anyone.", copyLink: "Copy link", linkCopied: "Link copied" },
  ru: { loading: "Загрузка каталога записи…", unavailable: "Данные записи временно недоступны. Проверьте подключение и попробуйте снова.", inactive: "Эта ссылка для записи больше не активна", inactiveLead: "Филиал может быть неактивен или ссылка неверна. Вернитесь в каталог и выберите активный.", trialPaused: "Онлайн-запись временно недоступна", trialPausedLead: "Профиль салона остаётся доступным, но новые онлайн-записи сейчас не принимаются. Свяжитесь с салоном для деталей.", viewSalon: "Страница салона", received: "Запись отправлена", receivedLead: "Теперь салон должен подтвердить запись. Статус будет на странице вашей записи.", assigned: "Ваш специалист:", calendar: "Добавить в календарь", map: "Показать на карте", share: "Поделиться", copied: "Скопировано", manage: "Страница записи", returnToList: "Вернуться в каталог", whatNext: "Что дальше", next1: (name: string) => `${name} рассмотрит вашу запись.`, next2: "Статус будет на вашей личной странице записи.", next3: (minutes: number) => minutes % 60 === 0 ? `Изменить или отменить запись можно не позднее чем за ${minutes / 60} ч до визита.` : `Изменить или отменить запись можно не позднее чем за ${minutes} мин до визита.`, privateTitle: "Личная ссылка на запись", privateText: "Изменить или отменить запись можно только по этой ссылке. Сохраните её и никому не передавайте.", copyLink: "Скопировать ссылку", linkCopied: "Ссылка скопирована" },
} as const;

const ANY_AVAILABLE = "ANY_AVAILABLE";
const STEP_KEYS = ["services", "staff", "time", "details"] as const;

// Wizard copy (steps, validation, review card). Georgian is the source of truth; business data (service and staff names) is never translated.
export const flowUi = {
  ka: {
    metaWith: (name: string) => `ჩაწერა — ${name}`, metaOnline: "ონლაინ ჩაწერა", metaDescription: "აირჩიე სერვისი და თავისუფალი დრო და დაჯავშნე ონლაინ.",
    steps: ["სერვისი", "სპეციალისტი", "დრო", "დეტალები"],
    stepCopy: [
      { title: "რომელი სერვისი გჭირდება?", lede: "აირჩიე ერთი ან რამდენიმე სერვისი." },
      { title: "ვინ მოგემსახურება?", lede: "აირჩიე სპეციალისტი ან დაგვანდე — თავისუფალს ჩვენ შეგირჩევთ." },
      { title: "რომელი დრო გერგება?", lede: "ნაჩვენებია მხოლოდ რეალურად თავისუფალი საათები. არჩეული დრო ჯავშნისას კვლავ გადამოწმდება." },
      { title: "ვის სახელზე ჩავწეროთ?", lede: "ჯავშანს სალონი დაგიდასტურებს." },
    ],
    issues: {
      service: { title: "ჯერ აირჩიე სერვისი", description: "მონიშნე სასურველი მომსახურება და გააგრძელე." },
      staff: { title: "აირჩიე სპეციალისტი", description: "ან მონიშნე „ნებისმიერი თავისუფალი“ — სისტემა თავად შეარჩევს." },
      timeMissing: { title: "დაამატე სასურველი თარიღი და დრო", description: `დროის არჩევის შემდეგ ${BRAND.nameKa} ავტომატურად გადაამოწმებს ხელმისაწვდომობას.` },
      timeUnconfirmed: { title: "ეს დრო ჯერ არ დადასტურებულა", description: "აირჩიე სხვა დრო ან დაელოდე ხელმისაწვდომობის შემოწმების დასრულებას." },
      firstName: { title: "მიუთითე სახელი", description: "სახელი საჭიროა ჯავშნის მოთხოვნის დასადასტურებლად." },
      phone: { title: "მიუთითე მობილურის ნომერი", description: "მობილურის ნომერი საჭიროა, რომ სალონმა შენს მოთხოვნაზე დაგიკავშირდეს." },
      terms: { title: "დაადასტურე ჯავშნის პირობები", description: "გაგრძელებამდე საჭიროა მონაცემების დამუშავებაზე თანხმობა." },
      submit: { title: "ჯავშნის მოთხოვნა ვერ გაიგზავნა", description: "მონაცემები არ დაგვიკარგავს. შეამოწმე კავშირი და სცადე ხელახლა." },
      network: { title: "ჯავშანი ვერ გაიგზავნა: კავშირი გაწყდა.", description: "შეყვანილი მონაცემები შენახულია." },
    },
    retry: "თავიდან ცდა", autoPicked: (name: string) => `${name} (ავტომატურად)`, anyStaff: "ნებისმიერი თავისუფალი სპეციალისტი", anyStaffShort: "ნებისმიერი თავისუფალი",
    back: "უკან", profile: "პროფილი", catalog: "კატალოგი", onlineBooking: "ჩაწერა", closeBooking: "ჩაწერის დახურვა", progress: "ჯავშნის პროგრესი", hoursAndContact: "სამუშაო საათები და კონტაქტი",
    noService: "სერვისი არ არის არჩეული", pickService: "აირჩიე სერვისი", from: (price: string) => `${price}-დან`, pickTime: "აირჩიე დრო", next: "გაგრძელება", checkingShort: "მოწმდება…", send: "ჯავშნის გაგზავნა", sending: "იგზავნება…",
    staffHours: "ხელმისაწვდომი სპეციალისტების საათები", noHours: "სამუშაო საათები ჯერ არ არის მითითებული. დროის არჩევისას ხელმისაწვდომობა მაინც ავტომატურად შემოწმდება.", dayFallback: "დღე",
    noServicesTitle: "ონლაინ სერვისი ჯერ არ არის", noServicesText: "ამ ფილიალში ონლაინ ჩასაწერი სერვისები ჯერ არ არის. დაუკავშირდი სალონს.", choose: (name: string) => `${name} არჩევა`, minutes: "წთ",
    noStaffTitle: "სპეციალისტი ვერ მოიძებნა", noStaffText: "ამ სერვისების ერთად შესრულება ონლაინ ვერ ხერხდება. სცადე სერვისების ცალ-ცალკე დაჯავშნა.", changeServices: "სერვისების შეცვლა", specialist: "სპეციალისტი", pickSpecialist: "აირჩიე სპეციალისტი",
    anyStaffLabel: "ნებისმიერი თავისუფალი სპეციალისტის არჩევა", anyStaffMeta: "უახლოესი თავისუფალი დრო", nearestShort: "უახლოესი: ",
    duration: "ხანგრძლივობა: ", closedDay: "ამ დღეს დაკეტილია.", slotsLoading: "თავისუფალი დრო იტვირთება…", slotsFailed: "თავისუფალი დრო ვერ ჩაიტვირთა.", slotsLabel: "თავისუფალი დრო",
    morning: "დილა", afternoon: "შუადღე", evening: "საღამო",
    noSlotsTitle: "ამ დღეს თავისუფალი დრო აღარ არის.", noSlotsText: "შეგიძლია აირჩიო სხვა დღე ან დატოვო მოთხოვნა მოლოდინის სიაში. ეს არ არის დადასტურებული ჯავშანი და ავტომატური შეტყობინება ჯერ არ იგზავნება.", waitlist: "მოლოდინის სიის მოთხოვნა", nextOpenDay: "შემდეგი ღია დღე", nextFreeDay: "შემდეგი თავისუფალი დღე",
    nearest: "უახლოესი თავისუფალი დრო:", nearestToday: "უახლოესი თავისუფალი დრო ამ დღეს:", todayWord: "დღეს", tomorrowWord: "ხვალ", taken: "ეს დრო ახლახან დაიკავეს. აირჩიე სხვა დრო.",
    change: "შეცვლა", changeAria: (label: string) => `${label} — შეცვლა`, summaryTitle: "შენი ჩაწერა", openSummary: "ჩაწერის დეტალები", reviewCaption: "ჯავშნის შეჯამება", detailsCaption: "ჯავშნის დეტალები", business: "ბიზნესი", dateTime: "თარიღი და დრო", services: "სერვისები", total: "ჯამი",
    firstName: "სახელი", lastName: "გვარი", optional: "(არასავალდებულო)", phone: "ტელეფონი", phonePlaceholder: "555 12 34 56", phoneHelp: "ფორმატი: 5XX XX XX XX",
    moreDetails: "მეტი დეტალი (არასავალდებულო)", email: "ელფოსტა", note: "კომენტარი", noteHint: "მაგ. რა უნდა იცოდნენ ვიზიტამდე", consent: "ვეთანხმები, რომ სალონმა ჩემი მონაცემები გამოიყენოს მხოლოდ ამ ჯავშნის დამუშავებისა და დადასტურებისთვის.", privacyLink: "კონფიდენციალურობა",
  },
  en: {
    metaWith: (name: string) => `Booking — ${name}`, metaOnline: "Online booking", metaDescription: "Choose a service and a free time and book online.",
    steps: ["Service", "Specialist", "Time", "Details"],
    stepCopy: [
      { title: "What would you like today?", lede: "Choose one or more services." },
      { title: "Who will look after you?", lede: "Pick a specialist or leave it to us — we will choose whoever is free." },
      { title: "Which time suits you?", lede: "Only truly free times are shown. The chosen time is checked again when you book." },
      { title: "Whose name should we book under?", lede: "The salon will confirm your booking." },
    ],
    issues: {
      service: { title: "Choose a service first", description: "Select the service you want and continue." },
      staff: { title: "Choose a specialist", description: "Or pick “Any available” and the system will choose for you." },
      timeMissing: { title: "Add your preferred date and time", description: `After you choose a time, ${BRAND.name} automatically checks availability.` },
      timeUnconfirmed: { title: "This time has not been confirmed yet", description: "Choose another time or wait for the availability check to finish." },
      firstName: { title: "Enter your first name", description: "Your name is needed to confirm the booking request." },
      phone: { title: "Enter your mobile number", description: "A mobile number is needed so the salon can contact you about your request." },
      terms: { title: "Accept the booking terms", description: "Consent to data processing is required before you continue." },
      submit: { title: "The booking request could not be sent", description: "We have not lost your data. Check your connection and try again." },
      network: { title: "Booking not sent: connection lost.", description: "Your details are saved." },
    },
    retry: "Try again", autoPicked: (name: string) => `${name} (assigned automatically)`, anyStaff: "Any available specialist", anyStaffShort: "Any available",
    back: "Back", profile: "Profile", catalog: "Catalog", onlineBooking: "Online booking", closeBooking: "Close booking", progress: "Booking progress", hoursAndContact: "Working hours and contact",
    noService: "No service selected", pickService: "Choose a service", from: (price: string) => `From ${price}`, pickTime: "Choose a time", next: "Continue", checkingShort: "Checking…", send: "Send booking", sending: "Sending…",
    staffHours: "Specialists' available hours", noHours: "Working hours have not been set yet. Availability is still checked automatically when you choose a time.", dayFallback: "Day",
    noServicesTitle: "No online services yet", noServicesText: "This location has no services available for online booking yet. Please contact the salon.", choose: (name: string) => `Select ${name}`, minutes: "min",
    noStaffTitle: "No specialist found", noStaffText: "These services cannot be done together online. Try booking them separately.", changeServices: "Change services", specialist: "Specialist", pickSpecialist: "Choose a specialist",
    anyStaffLabel: "Select any available specialist", anyStaffMeta: "Nearest free time", nearestShort: "Nearest: ",
    duration: "Duration: ", closedDay: "Closed on this day.", slotsLoading: "Loading free times…", slotsFailed: "Free times could not be loaded.", slotsLabel: "Free times",
    morning: "Morning", afternoon: "Afternoon", evening: "Evening",
    noSlotsTitle: "There is no free time left on this day.", noSlotsText: "You can choose another day or leave a waitlist request. This is not a confirmed booking, and no automatic notification is sent yet.", waitlist: "Waitlist request", nextOpenDay: "Next open day", nextFreeDay: "Next day with free time",
    nearest: "Nearest free time:", nearestToday: "Nearest free time on this day:", todayWord: "Today", tomorrowWord: "Tomorrow", taken: "This time was just taken. Choose another time.",
    change: "Change", changeAria: (label: string) => `${label} — change`, summaryTitle: "Your booking", openSummary: "Booking details", reviewCaption: "Booking summary", detailsCaption: "Booking details", business: "Business", dateTime: "Date and time", services: "Services", total: "Total",
    firstName: "First name", lastName: "Last name", optional: "(optional)", phone: "Phone", phonePlaceholder: "555 12 34 56", phoneHelp: "Format: 5XX XX XX XX",
    moreDetails: "More details (optional)", email: "Email", note: "Comment", noteHint: "e.g. what should they know before your visit", consent: "I agree that the salon may use my data only to process and confirm this booking.", privacyLink: "Privacy",
  },
  ru: {
    metaWith: (name: string) => `Запись — ${name}`, metaOnline: "Онлайн-запись", metaDescription: "Выберите услугу и свободное время и запишитесь онлайн.",
    steps: ["Услуга", "Специалист", "Время", "Данные"],
    stepCopy: [
      { title: "Что вам нужно сегодня?", lede: "Выберите одну или несколько услуг." },
      { title: "Кто вас обслужит?", lede: "Выберите специалиста или доверьтесь нам — свободного подберём мы." },
      { title: "Какое время вам подходит?", lede: "Показано только действительно свободное время. Выбранное время ещё раз проверяется при записи." },
      { title: "На чьё имя записать?", lede: "Запись подтвердит салон." },
    ],
    issues: {
      service: { title: "Сначала выберите услугу", description: "Отметьте нужную услугу и продолжайте." },
      staff: { title: "Выберите специалиста", description: "Или отметьте «Любой свободный» — система подберёт сама." },
      timeMissing: { title: "Укажите желаемую дату и время", description: `После выбора времени ${BRAND.name} автоматически проверит доступность.` },
      timeUnconfirmed: { title: "Это время ещё не подтверждено", description: "Выберите другое время или дождитесь завершения проверки доступности." },
      firstName: { title: "Укажите имя", description: "Имя необходимо для подтверждения запроса на запись." },
      phone: { title: "Укажите номер мобильного телефона", description: "Номер нужен, чтобы салон мог связаться с вами по вашему запросу." },
      terms: { title: "Подтвердите условия записи", description: "Перед продолжением необходимо согласие на обработку данных." },
      submit: { title: "Не удалось отправить запрос на запись", description: "Ваши данные не потеряны. Проверьте подключение и попробуйте снова." },
      network: { title: "Запись не отправлена: соединение потеряно.", description: "Введённые данные сохранены." },
    },
    retry: "Попробовать ещё раз", autoPicked: (name: string) => `${name} (выбран автоматически)`, anyStaff: "Любой свободный специалист", anyStaffShort: "Любой свободный",
    back: "Назад", profile: "Профиль", catalog: "Каталог", onlineBooking: "Онлайн-запись", closeBooking: "Закрыть запись", progress: "Ход записи", hoursAndContact: "Часы работы и контакты",
    noService: "Услуга не выбрана", pickService: "Выберите услугу", from: (price: string) => `от ${price}`, pickTime: "Выберите время", next: "Продолжить", checkingShort: "Проверка…", send: "Отправить запись", sending: "Отправка…",
    staffHours: "Доступные часы специалистов", noHours: "Часы работы пока не указаны. Доступность всё равно проверяется автоматически при выборе времени.", dayFallback: "День",
    noServicesTitle: "Онлайн-услуг пока нет", noServicesText: "В этом филиале пока нет услуг для онлайн-записи. Свяжитесь с салоном.", choose: (name: string) => `Выбрать: ${name}`, minutes: "мин",
    noStaffTitle: "Специалист не найден", noStaffText: "Эти услуги нельзя выполнить вместе онлайн. Попробуйте записаться на них по отдельности.", changeServices: "Изменить услуги", specialist: "Специалист", pickSpecialist: "Выберите специалиста",
    anyStaffLabel: "Выбрать любого свободного специалиста", anyStaffMeta: "Ближайшее свободное время", nearestShort: "Ближайшее: ",
    duration: "Длительность: ", closedDay: "В этот день закрыто.", slotsLoading: "Загрузка свободного времени…", slotsFailed: "Не удалось загрузить свободное время.", slotsLabel: "Свободное время",
    morning: "Утро", afternoon: "День", evening: "Вечер",
    noSlotsTitle: "На этот день свободного времени больше нет.", noSlotsText: "Можно выбрать другой день или оставить запрос в листе ожидания. Это не подтверждённая запись, и автоматическое уведомление пока не отправляется.", waitlist: "Запрос в лист ожидания", nextOpenDay: "Следующий рабочий день", nextFreeDay: "Следующий день со свободным временем",
    nearest: "Ближайшее свободное время:", nearestToday: "Ближайшее свободное время в этот день:", todayWord: "Сегодня", tomorrowWord: "Завтра", taken: "Это время только что заняли. Выберите другое время.",
    change: "Изменить", changeAria: (label: string) => `${label} — изменить`, summaryTitle: "Ваша запись", openSummary: "Детали записи", reviewCaption: "Сводка записи", detailsCaption: "Детали записи", business: "Бизнес", dateTime: "Дата и время", services: "Услуги", total: "Итого",
    firstName: "Имя", lastName: "Фамилия", optional: "(необязательно)", phone: "Телефон", phonePlaceholder: "555 12 34 56", phoneHelp: "Формат: 5XX XX XX XX",
    moreDetails: "Больше деталей (необязательно)", email: "Эл. почта", note: "Комментарий", noteHint: "напр. что нужно знать до визита", consent: "Я согласен(на), что салон использует мои данные только для обработки и подтверждения этой записи.", privacyLink: "Конфиденциальность",
  },
} as const;

export type BookingTeamMember = { id: string; name: string; specialty: string | null; bio: string | null; avatarUrl?: string | null; eligibleServiceIds: string[] };
type BookingService = { id: string; nameKa: string; defaultDurationMinutes: number; priceTetri: number; isFromPrice?: boolean };
type BookingLocation = { name: string; timezone: string; address: string | null; phone: string | null; email: string | null; publicDescription: string | null; cancellationCutoffMinutes?: number; workingHours: Array<{ weekday: number; startLocalTime: string; endLocalTime: string }> };
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

// Steps: 0 = service, 1 = specialist, 2 = time, 3 = details.
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

// The commit endpoints throw CONFLICT for a taken slot or a booking-window miss; the message match is a fallback.
const SLOT_TAKEN_MESSAGES = ["ეს დრო ახლახან დაიკავეს", "The selected time is no longer available", "ჩაწერის დაშვებულ დიაპაზონში არ არის", "falls outside the booking window"];
export function isSlotTakenError(error: { message?: string; data?: unknown }) {
  if ((error.data as { code?: string } | null | undefined)?.code === "CONFLICT") return true;
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

// Which step the URL asks for: ?step=services|staff|time|details; without it, a ?services= link opens on the specialist step
// (the time step when ?staff= is given too). BookingFlow then falls back to the first step whose data is missing.
export function stepFromSearch(search: string) {
  const params = new URLSearchParams(search);
  const index = STEP_KEYS.indexOf((params.get("step") ?? "") as (typeof STEP_KEYS)[number]);
  if (index >= 0) return index;
  return parseRequestedServiceIds(search).length ? (params.get("staff") ? 2 : 1) : 0;
}

// Wall-clock parts of an instant in the location's timezone (display only).
export function bookingMoment(date: Date, timeZone: string | undefined, locale: PublicLocale = "ka") {
  const tz = timeZone ?? "Asia/Tbilisi";
  const key = dateKeyInTimeZone(date, tz);
  const [, month, day] = key.split("-").map(Number) as [number, number, number];
  const names = DATE_NAMES[locale];
  const weekday = schemaWeekdayOf(key);
  const time = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", hourCycle: "h23", timeZone: tz }).format(date);
  return { key, day, time, weekdayFull: names.weekdayFull[weekday] as string, weekdayShort: names.weekdayShort[weekday] as string, monthFull: names.monthFull[month - 1] as string, monthShort: names.monthShort[month - 1] as string };
}

async function copyText(value: string) {
  try { await navigator.clipboard.writeText(value); return true; } catch { return false; }
}

export default function BookingFlow() {
  const [, params] = useRoute("/book/:slug");
  const search = useSearch();
  const [, navigate] = useLocation();
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
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [advanceWhenChecked, setAdvanceWhenChecked] = useState(false);
  const [checkingSlow, setCheckingSlow] = useState(false);
  const errorRef = useRef<HTMLDivElement>(null);
  const focusTitle = useRef(false);
  const autoAdvance = useRef<number | undefined>(undefined);
  const reduceMotion = useReducedMotionConfig();
  const [moreOpen, setMoreOpen] = useState(false);
  const moreId = useId();

  // Once the catalog arrives, apply ?services= (only ids that exist) and ?staff= (checked against eligibility below).
  if (catalog.data && !initialised) {
    setInitialised(true);
    const known = new Set(catalog.data.catalog.map(item => item.service.id));
    const wanted = parseRequestedServiceIds(search).filter(id => known.has(id)).slice(0, MAX_SELECTED_SERVICES);
    if (wanted.length && catalog.data.onlineBookingAvailable !== false) {
      setServiceIds(wanted);
      const staffParam = new URLSearchParams(search).get("staff");
      if (staffParam) setStaffProfileId(staffParam);
    }
  }

  const startsAt = useMemo(() => (dateTime ? new Date(dateTime) : null), [dateTime]);
  const serviceId = serviceIds[0];
  const isMultiService = serviceIds.length > 1;
  const selectedServices = catalog.data?.catalog.filter(item => serviceIds.includes(item.service.id)).map(item => item.service) ?? [];
  const eligibleTeam = getEligibleTeam(catalog.data?.team ?? [], serviceIds);
  // The specialist has its own step: an explicit pick (or ANY), else the only eligible one when there is exactly one.
  const staffId = serviceIds.length ? (staffProfileId === ANY_AVAILABLE || eligibleTeam.some(member => member.id === staffProfileId) ? staffProfileId : eligibleTeam.length === 1 ? eligibleTeam[0]!.id : undefined) : undefined;

  // Step lives in the URL (?step=), so the phone back gesture goes one step back. Guards keep a reloaded or hand-typed URL on a step that has its data.
  let step = stepFromSearch(search);
  if (step >= 1 && !serviceIds.length) step = 0;
  // A bare ?services= link whose specialist is already known (only one eligible) goes straight to the time step.
  if (step === 1 && staffId && !new URLSearchParams(search).get("step")) step = 2;
  if (step >= 2 && !staffId) step = 1;
  if (step === 3 && !startsAt) step = 2;
  const prevStep = useRef(step);
  if (prevStep.current !== step) { prevStep.current = step; focusTitle.current = true; }
  useEffect(() => { if (typeof window !== "undefined" && prevStep.current === step) window.scrollTo?.({ top: 0 }); }, [step]);

  const availabilityInput = useMemo(() => ({ slug, serviceId: serviceId ?? "pending-service", staffProfileId: staffId ?? "pending-specialist", startsAt: startsAt ?? new Date(0) }), [slug, serviceId, staffId, startsAt]);
  const multiAvailabilityInput = useMemo(() => ({ slug, serviceIds: isMultiService ? serviceIds : ["pending_service_001", "pending_service_002"], staffProfileId: staffId ?? "pending-specialist", startsAt: startsAt ?? new Date(0) }), [slug, serviceIds, isMultiService, staffId, startsAt]);
  const singleAvailability = trpc.public.checkAvailability.useQuery(availabilityInput, { enabled: Boolean(serviceId && staffId && startsAt && step >= 2 && !isMultiService) });
  const multiAvailability = trpc.public.checkMultiAvailability.useQuery(multiAvailabilityInput, { enabled: Boolean(isMultiService && staffId && startsAt && step >= 2) });
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
  // A taken slot sends the visitor back to the time step, same day, with an alert next to the slots (the alert takes focus).
  const onCommitError = (error: { message: string; data?: unknown }) => {
    // Refetch the availability check too, so its cached "available" can't wave the lost slot through again.
    if (isSlotTakenError(error)) { setInteractionError(null); setSlotTaken(true); goTo(2, true); void (isMultiService ? multiAvailability : singleAvailability).refetch(); return; }
    setInteractionError({ kind: "submit", ...(isNetworkError(error) ? text.issues.network : text.issues.submit) });
  };
  const commitBooking = trpc.public.commitBooking.useMutation({ onSuccess: onCommitSuccess, onError: onCommitError });
  const commitMultiBooking = trpc.public.commitMultiBooking.useMutation({ onSuccess: onCommitSuccess, onError: onCommitError });
  const submitting = commitBooking.isPending || commitMultiBooking.isPending;
  const totalMinutes = selectedServices.reduce((sum, service) => sum + service.defaultDurationMinutes, 0);
  const totalTetri = selectedServices.reduce((sum, service) => sum + service.priceTetri, 0);
  const anyFrom = selectedServices.some(service => service.isFromPrice);
  const selectedStaff = catalog.data?.team.find(member => member.id === staffId);
  const staffLabel = staffId === ANY_AVAILABLE ? (availability.data?.staffName ? text.autoPicked(availability.data.staffName) : text.anyStaff) : selectedStaff?.name;
  const timeZone = catalog.data?.location.timezone;

  useEffect(() => {
    if (!interactionError) return;
    const frame = requestAnimationFrame(() => errorRef.current?.focus());
    return () => cancelAnimationFrame(frame);
  }, [interactionError]);

  // "მოწმდება…" only shows when the silent availability check takes longer than 300ms.
  const checking = Boolean(startsAt) && availability.isLoading && !slotTaken;
  useEffect(() => {
    if (!checking) { setCheckingSlow(false); return; }
    const timer = window.setTimeout(() => setCheckingSlow(true), 300);
    return () => window.clearTimeout(timer);
  }, [checking]);

  // After the user moves between steps, put focus on the new step title (the new step mounts after the old one fades out).
  const focusStepTitle = (node: HTMLHeadingElement | null) => {
    if (!node || !focusTitle.current) return;
    focusTitle.current = false;
    node.focus();
  };

  const stepUrl = (target: number, staff = staffId) => {
    const next = new URLSearchParams();
    if (serviceIds.length) next.set("services", serviceIds.join(","));
    if (staff && staff !== ANY_AVAILABLE) next.set("staff", staff);
    next.set("step", STEP_KEYS[target]!);
    return `/book/${slug}?${next.toString()}`;
  };
  // Push (not replace) so the browser back gesture steps back through the wizard; the marker lets our own back button do the same.
  const goTo = (target: number, replace = false, staff = staffId) => {
    window.clearTimeout(autoAdvance.current);
    setInteractionError(null);
    setSummaryOpen(false);
    if (target === step && !replace) return;
    navigate(stepUrl(target, staff), { replace, state: { cwbFlow: true } });
  };
  const clearIssue = (kind?: BookingIssueKind) => setInteractionError(current => !kind || current?.kind === kind ? null : current);
  const selectService = (value: string) => { setServiceIds(current => current.includes(value) ? current.filter(item => item !== value) : [...current, value]); setStaffProfileId(undefined); setDateTime(""); clearIssue("service"); };
  // Picking a specialist moves on to the time step after a beat (at once under reduced motion); another specialist clears the chosen time.
  const selectStaff = (value: string) => {
    if (value !== staffId) { setStaffProfileId(value); setDateTime(""); setSlotTaken(false); }
    clearIssue("staff");
    window.clearTimeout(autoAdvance.current);
    if (reduceMotion) goTo(2, false, value); else autoAdvance.current = window.setTimeout(() => goTo(2, false, value), 250);
  };
  useEffect(() => () => window.clearTimeout(autoAdvance.current), []);
  const selectDateTime = (value: string) => { setDateTime(value); setSlotTaken(false); setAdvanceWhenChecked(false); clearIssue("time"); };
  const currentValidation = () => getBookingValidationIssue({ step, serviceId, staffProfileId: staffId, startsAt, available: slotTaken ? false : availability.data?.available, firstName, phone, termsAccepted, locale });
  const submitBooking = () => {
    if (!serviceId || !staffId || !startsAt) return;
    const sharedPayload = { slug, staffProfileId: staffId, startsAt, firstName, lastName: lastName || undefined, phone, email: email || undefined, customerNote: customerNote || undefined, bookingTermsConsent: true as const, idempotencyKey };
    if (isMultiService) commitMultiBooking.mutate({ ...sharedPayload, serviceIds });
    else commitBooking.mutate({ ...sharedPayload, serviceId });
  };
  const advanceBooking = () => {
    if (submitting) return;
    // A tap on "გაგრძელება" while the silent check is still running continues as soon as the check passes.
    if (step === 2 && startsAt && availability.isLoading && !slotTaken) { setAdvanceWhenChecked(true); return; }
    const issue = currentValidation();
    if (issue) { setInteractionError(issue); return; }
    setInteractionError(null);
    if (step < 3) goTo(step === 0 && eligibleTeam.length === 1 ? 2 : step + 1);
    else submitBooking();
  };
  useEffect(() => {
    if (!advanceWhenChecked || availability.isLoading) return;
    setAdvanceWhenChecked(false);
    // The visitor may have left the time step while the check was running; only the time step auto-advances.
    if (step !== 2) return;
    const issue = currentValidation();
    if (issue) setInteractionError(issue); else goTo(3);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [advanceWhenChecked, availability.isLoading]);

  const profileHref = catalog.data ? `/salon/${slug}` : "/salons";
  const available = catalog.data?.onlineBookingAvailable !== false;
  const fromFlow = typeof window !== "undefined" && Boolean((window.history.state as { cwbFlow?: boolean } | null)?.cwbFlow);

  if (catalog.data && confirmation && selectedServices.length && startsAt) {
    return <div className="cw min-h-screen">
      <CatalogHeader />
      <main id="main-content" tabIndex={-1} className="cwb-page">
        <BookingConfirmation slug={slug} confirmationToken={confirmation.token} assignedStaffName={confirmation.assignedStaffName} serviceName={selectedServices.map(service => service.nameKa).join(" + ")} services={selectedServices.map(service => ({ name: service.nameKa, priceTetri: service.priceTetri, isFromPrice: service.isFromPrice }))} totalTetri={totalTetri} totalIsFrom={anyFrom} startsAt={startsAt} endsAt={confirmation.endsAt} locationName={catalog.data.location.name} locationAddress={catalog.data.location.address} timeZone={catalog.data.location.timezone} cancellationCutoffMinutes={catalog.data.location.cancellationCutoffMinutes} />
      </main>
    </div>;
  }

  const blockedIssue = catalog.data && available ? currentValidation() : null;
  const barBlocked = Boolean(blockedIssue) || submitting;
  const moment = startsAt ? bookingMoment(startsAt, timeZone, locale) : null;
  const barLabel = step === 0 ? (serviceIds.length ? text.next : text.pickService)
    : step === 1 ? (staffId ? text.next : text.pickSpecialist)
    : step === 2 ? (!startsAt ? text.pickTime : checkingSlow ? text.checkingShort : text.next)
    : submitting ? text.sending : text.send;
  const barDetail = moment ? `${moment.weekdayShort}, ${moment.day} ${moment.monthShort} · ${moment.time}` : selectedServices.length ? `${totalMinutes} ${text.minutes}` : undefined;
  const summary = (idPrefix: string) => <BookingSummary idPrefix={idPrefix} services={selectedServices} staffLabel={step >= 2 && staffId ? staffLabel : undefined} staffPhoto={selectedStaff?.avatarUrl} startsAt={startsAt} ringOn={!slotTaken} timeZone={timeZone} totalTetri={totalTetri} totalIsFrom={anyFrom} onEditServices={() => goTo(0)} onEditStaff={() => goTo(1)} onEditTime={() => goTo(2)} />;

  return <div className="cw min-h-screen">
    <CatalogHeader />
    <main id="main-content" tabIndex={-1} className="cwb-page">
      <div className="cwb-layout">
      <div className="cwb-card">
        <div className="cwb-head">
          {step > 0 && catalog.data && available && fromFlow ? <button type="button" className="cwb-btn" onClick={() => window.history.back()}><ChevronLeft className="size-4" aria-hidden="true" />{text.back}</button>
            : step > 0 && catalog.data && available ? <button type="button" className="cwb-btn" onClick={() => goTo(step - 1, true)}><ChevronLeft className="size-4" aria-hidden="true" />{text.back}</button>
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
          {interactionError ? <div className="cwb-pad"><BookingErrorNotice issue={interactionError} errorRef={errorRef} onRetry={interactionError.kind === "submit" ? submitBooking : undefined} /></div> : null}
          <AnimatePresence mode="wait" initial={false}>
          <motion.div className="cwb-step" key={step} initial={reduceMotion ? false : { opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0, transition: { duration: 0.18, ease: EASE } }} exit={reduceMotion ? undefined : { opacity: 0, transition: { duration: 0.12, ease: [0.4, 0, 1, 1] } }}>
            <BookingStepHeader title={text.stepCopy[step]!.title} description={text.stepCopy[step]!.lede} headingRef={focusStepTitle} />
            <div className="mt-4">
              {step === 0 ? <ServiceStep catalog={catalog.data.catalog} selectedIds={serviceIds} onSelect={selectService} /> : null}
              {step === 1 ? <StaffStep team={eligibleTeam} selectedId={staffId} onSelect={selectStaff} onEditServices={() => goTo(0)} slug={slug} serviceIds={serviceIds} timezone={catalog.data.location.timezone} /> : null}
              {step === 2 ? <TimeStep slug={slug} serviceId={serviceId} serviceIds={serviceIds} multiService={isMultiService} staffId={staffId} staffLabel={staffLabel} selectedStaff={selectedStaff} eligibleCount={eligibleTeam.length} onChangeStaff={() => goTo(1)} onEditServices={() => goTo(0)} workingHours={catalog.data.location.workingHours} timezone={catalog.data.location.timezone} dateTime={dateTime} durationMinutes={totalMinutes} onChange={selectDateTime} availability={availability} slotTaken={slotTaken} /> : null}
              {step === 3 ? <DetailsStep review={summary("details")} contactError={interactionError?.kind === "contact"} firstName={firstName} lastName={lastName} phone={phone} email={email} customerNote={customerNote} termsAccepted={termsAccepted} onFirstName={value => { setFirstName(value); clearIssue("contact"); }} onLastName={setLastName} onPhone={value => { setPhone(value); clearIssue("contact"); }} onEmail={setEmail} onNote={setCustomerNote} onTerms={value => { setTermsAccepted(value); clearIssue("contact"); }} /> : null}
            </div>
          </motion.div>
          </AnimatePresence>
          <BookingBar
            summary={selectedServices.length ? selectedServices.map(service => service.nameKa).join(" + ") : undefined}
            detail={barDetail}
            summaryLabel={text.summaryTitle}
            summaryOpen={summaryOpen}
            onOpenSummary={() => setSummaryOpen(true)}
            label={barLabel}
            blocked={barBlocked}
            hint={selectedServices.length ? blockedIssue?.title : undefined}
            conversionEvent={step === 3 ? "BOOKING_SUBMIT_SELECTED" : undefined}
            onClick={advanceBooking}
          />
        </> : null}
      </div>
      {catalog.data && available && selectedServices.length ? <aside className="cwb-aside" aria-label={text.summaryTitle}>
        <h2 className="cwb-aside-title">{text.summaryTitle}</h2>
        {summary("aside")}
      </aside> : null}
      </div>
    </main>
    <Drawer open={summaryOpen} onOpenChange={setSummaryOpen}>
      <DrawerContent aria-describedby={undefined}>
        <DrawerHeader><DrawerTitle>{text.summaryTitle}</DrawerTitle></DrawerHeader>
        <div className="cwb-drawer-body">{summaryOpen ? summary("drawer") : null}</div>
      </DrawerContent>
    </Drawer>
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

// "შენი ჩაწერა": services and prices, specialist, ringed date and time, total; each editable. Used in the side card (>=1024), the phone drawer and the details step.
function BookingSummary({ idPrefix, services, staffLabel, staffPhoto, startsAt, ringOn, timeZone, totalTetri, totalIsFrom, onEditServices, onEditStaff, onEditTime }: { idPrefix: string; services: BookingService[]; staffLabel?: string; staffPhoto?: string | null; startsAt: Date | null; ringOn: boolean; timeZone?: string; totalTetri: number; totalIsFrom: boolean; onEditServices: () => void; onEditStaff: () => void; onEditTime: () => void }) {
  const { locale } = usePublicLocale();
  const text = flowUi[locale];
  const moment = startsAt ? bookingMoment(startsAt, timeZone, locale) : null;
  const edit = (label: string, onClick: () => void) => <button type="button" className="cwb-link cwb-sum-edit" aria-label={text.changeAria(label)} onClick={onClick}>{text.change}</button>;
  return <dl className="cwb-sum" aria-label={text.reviewCaption} id={`${idPrefix}-summary`}>
    <div className="cwb-sum-row">
      <dt>{text.services}</dt>
      <dd><ul className="cwb-review-services">{services.map(service => <li key={service.id}><span>{service.nameKa}</span><span className="cwb-price">{priceLabel(text, service.priceTetri, service.isFromPrice)}</span></li>)}</ul></dd>
      {edit(text.services, onEditServices)}
    </div>
    {staffLabel ? <div className="cwb-sum-row">
      <dt>{text.specialist}</dt>
      <dd className="cwb-sum-staff">{staffPhoto ? <img className="cwb-sum-photo" src={staffPhoto} alt="" loading="lazy" /> : null}{staffLabel}</dd>
      {edit(text.specialist, onEditStaff)}
    </div> : null}
    {moment ? <div className="cwb-sum-row">
      <dt>{text.dateTime}</dt>
      <dd><span className="cwb-sum-date">{moment.weekdayFull}, {moment.day} {moment.monthFull}</span><span className="cwb-ringed cwb-sum-time cw-num">{moment.time}<Ring variant="wide" draw={ringOn} /></span></dd>
      {edit(text.dateTime, onEditTime)}
    </div> : null}
    <div className="cwb-sum-row cwb-sum-total">
      <dt>{text.total}</dt>
      <dd className="cw-num">{priceLabel(text, totalTetri, totalIsFrom)}</dd>
    </div>
  </dl>;
}

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

function Avatar({ member, small }: { member: Pick<BookingTeamMember, "name" | "avatarUrl">; small?: boolean }) {
  return <span className={small ? "cwb-avatar cwb-avatar-sm" : "cwb-avatar"} aria-hidden="true">{member.avatarUrl ? <img src={member.avatarUrl} alt="" loading="lazy" /> : initialOf(member.name)}</span>;
}

// "tomorrow, 11:30" style label for a day's first free time; today / tomorrow are words, later days "Thu, 29 Oct, 11:30".
function whenLabel(date: string, time: string, today: string, locale: PublicLocale) {
  const text = flowUi[locale];
  if (date === today) return `${text.todayWord.toLocaleLowerCase(locale)}, ${time}`;
  if (date === addDaysKey(today, 1)) return `${text.tomorrowWord.toLocaleLowerCase(locale)}, ${time}`;
  const weekday = DATE_NAMES[locale].weekdayShort[schemaWeekdayOf(date)];
  const [, month, day] = date.split("-").map(Number) as [number, number, number];
  return `${weekday}, ${day} ${DATE_NAMES[locale].monthShort[month - 1]}, ${time}`;
}

// Display-only hint under a specialist card. Silent while loading, on error and when nothing is free.
function NearestFree({ slug, serviceIds, staffProfileId, today }: { slug: string; serviceIds: string[]; staffProfileId: string; today: string }) {
  const { locale } = usePublicLocale();
  const days = trpc.public.availabilityDays.useQuery({ slug, serviceIds, staffProfileId, fromDate: today, days: 7 });
  const first = days.data?.days.find(day => day.slotCount > 0 && day.firstLabel);
  return first ? <span className="cwb-staff-next">{flowUi[locale].nearestShort}<strong>{whenLabel(first.date, first.firstLabel!, today, locale)}</strong></span> : null;
}

const NEAREST_MAX_TEAM = 8;

// The specialist step: "any available" first (the system chooses), then one photo card per eligible specialist.
// Pass slug, serviceIds and timezone to show each specialist's nearest free time (skipped for larger teams).
export function StaffStep({ team, selectedId, onSelect, onEditServices, slug, serviceIds, timezone }: { team: BookingTeamMember[]; selectedId?: string; onSelect: (id: string) => void; onEditServices?: () => void; slug?: string; serviceIds?: string[]; timezone?: string }) {
  const text = flowUi[usePublicLocale().locale];
  const today = useMemo(() => timezone ? dateKeyInTimeZone(new Date(), timezone) : "", [timezone]);
  if (!team.length) return <div className="cwb-empty"><strong>{text.noStaffTitle}</strong>{text.noStaffText}{onEditServices ? <div className="mt-3"><button type="button" className="cwb-btn cwb-btn-line cwb-btn-sm" onClick={onEditServices}>{text.changeServices}</button></div> : null}</div>;
  const showNearest = Boolean(slug && serviceIds?.length && today && team.length <= NEAREST_MAX_TEAM);
  return <div className="cwb-staff-grid" role="radiogroup" aria-label={text.specialist} onKeyDown={moveRadioFocus}>
    <BookingStaffCard conversionEvent="BOOKING_ANY_AVAILABLE_SELECTED" label={text.anyStaff} name={text.anyStaffShort} meta={text.anyStaffMeta} icon={<Sparkles className="size-7" />} selected={selectedId === ANY_AVAILABLE} onSelect={() => onSelect(ANY_AVAILABLE)} />
    {team.map(member => <BookingStaffCard key={member.id} conversionEvent="BOOKING_SPECIALIST_SELECTED" label={member.name} name={member.name} meta={member.specialty} photoUrl={member.avatarUrl} selected={member.id === selectedId} onSelect={() => onSelect(member.id)} extra={showNearest ? <NearestFree slug={slug!} serviceIds={serviceIds!} staffProfileId={member.id} today={today} /> : undefined} />)}
  </div>;
}

const DAYS_AHEAD = 14;

type SlotsQuery = { isLoading: boolean; isError: boolean; data?: { slots: Array<{ startsAt: string; label: string }> }; refetch: (options?: { cancelRefetch?: boolean }) => unknown };

function TimeStep({ slug, serviceId, serviceIds, multiService, staffId, staffLabel, selectedStaff, eligibleCount, onChangeStaff, onEditServices, workingHours, timezone, dateTime, durationMinutes, onChange, availability, slotTaken }: { slug: string; serviceId?: string; serviceIds: string[]; multiService: boolean; staffId?: string; staffLabel?: string; selectedStaff?: BookingTeamMember; eligibleCount: number; onChangeStaff: () => void; onEditServices: () => void; workingHours: Array<{ weekday: number }>; timezone: string; dateTime: string; durationMinutes: number; onChange: (value: string) => void; availability: { isLoading: boolean; isError: boolean; data?: { available: boolean; reason?: string } }; slotTaken: boolean }) {
  const { locale } = usePublicLocale();
  const text = flowUi[locale];
  const openWeekdays = useMemo(() => new Set(workingHours.map(hour => hour.weekday)), [workingHours]);
  const today = useMemo(() => dateKeyInTimeZone(new Date(), timezone), [timezone]);
  // When no working-hour rule exists at all, nothing is marked closed and availability is decided by the server.
  const baseDays = useMemo(() => Array.from({ length: DAYS_AHEAD }, (_, index) => { const key = addDaysKey(today, index); return { key, closed: openWeekdays.size > 0 && !openWeekdays.has(schemaWeekdayOf(key)) }; }), [today, openWeekdays]);
  const firstOpen = useMemo(() => baseDays.find(day => !day.closed)?.key ?? today, [baseDays, today]);

  // Server-computed free-slot counts per day: drives "სავსეა", the first day with slots and the suggestion chip. Display only.
  const daysQuery = trpc.public.availabilityDays.useQuery(
    { slug, serviceIds, staffProfileId: staffId ?? ANY_AVAILABLE, fromDate: today, days: DAYS_AHEAD },
    { enabled: Boolean(serviceIds.length && staffId) },
  );
  const freeDays = daysQuery.data?.days ?? [];
  const days = useMemo(() => baseDays.map(day => ({ ...day, full: !day.closed && freeDays.some(item => item.date === day.key && item.slotCount === 0) })), [baseDays, freeDays]);
  const firstFree = freeDays.find(item => item.slotCount > 0 && item.firstStartsAt && item.firstLabel);

  const [selectedDate, setSelectedDate] = useState(() => dateTime ? dateKeyInTimeZone(new Date(dateTime), timezone) : firstOpen);
  const touched = useRef(Boolean(dateTime));
  // The first day shown is the first day that really has free time (once the server has answered).
  useEffect(() => {
    if (touched.current || !daysQuery.data) return;
    setSelectedDate(firstFree?.date ?? firstOpen);
  }, [daysQuery.data, firstFree?.date, firstOpen]);
  const daysSettled = !daysQuery.isLoading;

  const dayIsOpen = !(days.find(day => day.key === selectedDate)?.closed ?? false);
  const slotsEnabled = Boolean(staffId && selectedDate && dayIsOpen && (daysSettled || touched.current));
  const singleSlotsQuery = trpc.public.availableSlots.useQuery(
    { slug, serviceId: serviceId ?? "", staffProfileId: staffId ?? "", date: selectedDate },
    { enabled: Boolean(serviceId && slotsEnabled && !multiService) },
  );
  const multiSlotsQuery = trpc.public.multiAvailableSlots.useQuery(
    { slug, serviceIds: multiService ? serviceIds : ["pending_service_001", "pending_service_002"], staffProfileId: staffId ?? "", date: selectedDate },
    { enabled: Boolean(multiService && serviceIds.length > 1 && slotsEnabled) },
  );
  const slotsQuery: SlotsQuery = multiService ? multiSlotsQuery : singleSlotsQuery;
  const slots = slotsQuery.data?.slots ?? [];
  const slotsByPeriod = useMemo(() => ({
    morning: slots.filter(slot => Number(slot.label.split(":")[0]) < 12),
    afternoon: slots.filter(slot => { const hour = Number(slot.label.split(":")[0]); return hour >= 12 && hour < 17; }),
    evening: slots.filter(slot => Number(slot.label.split(":")[0]) >= 17),
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

  const pickDate = (day: string) => { touched.current = true; setSelectedDate(day); if (dateTime) onChange(""); };
  const nextOpenDay = days.find(day => day.key > selectedDate && !day.closed);
  const nextFreeDay = freeDays.find(item => item.date > selectedDate && item.slotCount > 0);
  const unavailable = slotTaken || Boolean(dateTime && (availability.isError || availability.data?.available === false));
  // After a lost slot: the next free time that day from the refetched list (never the lost one).
  const nearestSlot = unavailable ? slots.find(slot => slot.startsAt > dateTime) ?? slots.find(slot => slot.startsAt !== dateTime) : undefined;

  // Suggestion chip: the first free time overall, when it is not on the day being looked at.
  const suggestion = firstFree && firstFree.date !== selectedDate && !dateTime ? firstFree : undefined;
  if (eligibleCount === 0 || !staffId) return <div className="cwb-empty"><strong>{text.noStaffTitle}</strong>{text.noStaffText}<div className="mt-3"><button type="button" className="cwb-btn cwb-btn-line cwb-btn-sm" onClick={onEditServices}>{text.changeServices}</button></div></div>;

  return <div className="grid gap-4">
    <div className="cwb-staff-row">
      <span className="cwb-staff-chip">
        {selectedStaff ? <Avatar member={selectedStaff} small /> : <span className="cwb-avatar cwb-avatar-sm" aria-hidden="true"><Sparkles className="size-3.5" /></span>}
        <strong>{staffId === ANY_AVAILABLE ? (staffLabel && staffLabel !== text.anyStaff ? staffLabel : text.anyStaffShort) : staffLabel}</strong>
      </span>
      <button type="button" className="cwb-link" aria-label={text.changeAria(text.specialist)} onClick={onChangeStaff}>{text.change}</button>
    </div>
    {suggestion ? <button type="button" className="cwb-suggest" onClick={() => { touched.current = true; setSelectedDate(suggestion.date); onChange(suggestion.firstStartsAt!); }}>
      <Clock className="size-4 shrink-0" aria-hidden="true" />
      <span>{text.nearest} <strong>{whenLabel(suggestion.date, suggestion.firstLabel!, today, locale)}</strong></span>
    </button> : null}
    <BookingDateStrip days={days} selected={selectedDate} todayKey={today} onSelect={pickDate} selectableUnavailable />
    <div aria-live="polite" className="grid min-h-24 gap-4">
      {unavailable ? <BookingNotice tone="error" role="alert" noticeRef={takenRef} title={text.taken}>
        {nearestSlot ? <div className="cwb-nearest"><p>{text.nearestToday}</p><button type="button" className="cwb-btn cwb-btn-line cwb-btn-sm cw-num" onClick={() => onChange(nearestSlot.startsAt)}>{nearestSlot.label}</button></div> : null}
      </BookingNotice> : null}
      {!dayIsOpen ? <div className="cwb-empty"><strong>{text.closedDay}</strong>
          {nextOpenDay ? <div className="cwb-actions mt-3"><button type="button" className="cwb-btn cwb-btn-line cwb-btn-sm" onClick={() => pickDate(nextOpenDay.key)}>{text.nextOpenDay}</button></div> : null}</div>
        : slotsQuery.isLoading || (!slotsEnabled && !slotsQuery.isError) ? <p role="status" className="cwb-muted">{text.slotsLoading}</p>
        : slotsQuery.isError ? <BookingNotice tone="error" role="alert" title={text.slotsFailed}><button type="button" className="cwb-btn cwb-btn-danger cwb-btn-sm" onClick={() => void slotsQuery.refetch()}><RefreshCw className="size-4" aria-hidden="true" />{text.retry}</button></BookingNotice>
        : slots.length ? <div key={selectedDate} className="cwb-fade">
          <BookingSlotGroup conversionEvent="BOOKING_TIME_SELECTED" title={text.morning} slots={slotsByPeriod.morning} selectedStartsAt={slotTaken ? "" : dateTime} onSelect={onChange} />
          <BookingSlotGroup conversionEvent="BOOKING_TIME_SELECTED" title={text.afternoon} slots={slotsByPeriod.afternoon} selectedStartsAt={slotTaken ? "" : dateTime} onSelect={onChange} />
          <BookingSlotGroup conversionEvent="BOOKING_TIME_SELECTED" title={text.evening} slots={slotsByPeriod.evening} selectedStartsAt={slotTaken ? "" : dateTime} onSelect={onChange} />
        </div>
        : <div className="cwb-empty"><strong>{text.noSlotsTitle}</strong>{text.noSlotsText}
          <div className="cwb-actions mt-3">
            {nextFreeDay ? <button type="button" className="cwb-btn cwb-btn-line cwb-btn-sm" onClick={() => pickDate(nextFreeDay.date)}>{text.nextFreeDay}</button> : null}
            <Link href={`/waitlist/${slug}?serviceId=${encodeURIComponent(serviceId ?? "")}&staffProfileId=${encodeURIComponent(staffId ?? "")}&date=${encodeURIComponent(selectedDate)}`} data-conversion-event="BOOKING_WAITLIST_HANDOFF" className="cwb-link">{text.waitlist}</Link>
          </div></div>}
    </div>
    <p className="cwb-when"><span>{text.duration}<strong className="cw-num">{durationMinutes} {text.minutes}</strong></span></p>
  </div>;
}

function FieldError({ id, children }: { id: string; children: React.ReactNode }) {
  return <p id={id} className="cwb-error"><CircleAlert className="size-4" aria-hidden="true" />{children}</p>;
}

function DetailsStep({ review, contactError, firstName, lastName, phone, email, customerNote, termsAccepted, onFirstName, onLastName, onPhone, onEmail, onNote, onTerms }: { review: React.ReactNode; contactError: boolean; firstName: string; lastName: string; phone: string; email: string; customerNote: string; termsAccepted: boolean; onFirstName: (value: string) => void; onLastName: (value: string) => void; onPhone: (value: string) => void; onEmail: (value: string) => void; onNote: (value: string) => void; onTerms: (value: boolean) => void }) {
  const { locale } = usePublicLocale();
  const text = flowUi[locale];
  const [moreOpen, setMoreOpen] = useState(() => Boolean(lastName || email || customerNote));
  const moreId = useId();
  const nameInvalid = contactError && !firstName.trim();
  const phoneInvalid = contactError && !phone.trim();
  const termsInvalid = contactError && !termsAccepted;
  return <div className="grid gap-5">
    <div className="cwb-review-card">{review}</div>
    <div className="cwb-fields">
      <div className="cwb-field">
        <label className="cwb-label" htmlFor="booking-first-name">{text.firstName}</label>
        <input id="booking-first-name" className="cwb-input" value={firstName} onChange={event => onFirstName(event.target.value)} autoComplete="given-name" aria-required="true" aria-invalid={nameInvalid} aria-describedby={nameInvalid ? "booking-first-name-error" : undefined} />
        {nameInvalid ? <FieldError id="booking-first-name-error">{text.issues.firstName.title}</FieldError> : null}
      </div>
      <div className="cwb-field">
        <label className="cwb-label" htmlFor="booking-phone">{text.phone}</label>
        <div className="cwb-affix" data-invalid={phoneInvalid}>
          <span className="cwb-affix-prefix" aria-hidden="true">+995</span>
          <input id="booking-phone" className="cwb-input" type="tel" value={phone} onChange={event => onPhone(event.target.value)} autoComplete="tel-national" inputMode="tel" placeholder={text.phonePlaceholder} aria-required="true" aria-invalid={phoneInvalid} aria-describedby={phoneInvalid ? "booking-phone-help booking-phone-error" : "booking-phone-help"} />
        </div>
        <p id="booking-phone-help" className="cwb-hint">{text.phoneHelp}</p>
        {phoneInvalid ? <FieldError id="booking-phone-error">{text.issues.phone.title}</FieldError> : null}
      </div>
      <div>
        <button type="button" className="cwb-more-btn cwb-disclosure" aria-expanded={moreOpen} aria-controls={moreId} onClick={() => setMoreOpen(open => !open)}><span>{text.moreDetails}</span><ChevronDown className="cwb-more-chevron size-4 shrink-0" aria-hidden="true" /></button>
        {moreOpen ? <div id={moreId} className="cwb-fields cwb-disclosure-body">
          <div className="cwb-field">
            <label className="cwb-label" htmlFor="booking-last-name">{text.lastName}</label>
            <input id="booking-last-name" className="cwb-input" value={lastName} onChange={event => onLastName(event.target.value)} autoComplete="family-name" />
          </div>
          <div className="cwb-field">
            <label className="cwb-label" htmlFor="booking-email">{text.email}</label>
            <input id="booking-email" className="cwb-input" type="email" value={email} onChange={event => onEmail(event.target.value)} autoComplete="email" />
          </div>
          <div className="cwb-field">
            <label className="cwb-label" htmlFor="booking-note">{text.note}</label>
            <textarea id="booking-note" className="cwb-input" value={customerNote} onChange={event => onNote(event.target.value)} aria-describedby="booking-note-hint" />
            <p id="booking-note-hint" className="cwb-hint">{text.noteHint}</p>
          </div>
        </div> : null}
      </div>
      <div className="cwb-field">
        <label className="cwb-agree" data-invalid={termsInvalid}>
          <input type="checkbox" className="cwb-check" checked={termsAccepted} onChange={event => onTerms(event.target.checked)} aria-required="true" aria-invalid={termsInvalid} aria-describedby={termsInvalid ? "booking-terms-error" : undefined} />
          <span>{text.consent} <a href="/privacy" target="_blank" rel="noopener noreferrer" className="cwb-link-inline">{text.privacyLink}</a></span>
        </label>
        {termsInvalid ? <FieldError id="booking-terms-error">{text.issues.terms.title}</FieldError> : null}
      </div>
    </div>
  </div>;
}

// 56px mark: accent-soft disc scales in, the check draws, then the ring (CSS in booking.css; static under reduced motion).
function ConfirmMark() {
  return <span className="cwb-mark" aria-hidden="true">
    <svg viewBox="0 0 56 56" className="cwb-mark-disc" focusable="false"><circle cx="28" cy="28" r="28" /></svg>
    <svg viewBox="0 0 56 56" className="cwb-mark-check" focusable="false"><path d="M17.5 29.5 L25 37 L39 20.5" pathLength={1} fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></svg>
    <Ring variant="square" draw />
  </span>;
}

export function BookingConfirmation({ slug, confirmationToken, assignedStaffName, serviceName, services, totalTetri, totalIsFrom, startsAt, endsAt, locationName, locationAddress, timeZone, cancellationCutoffMinutes }: { slug?: string; confirmationToken: string; assignedStaffName?: string; serviceName: string; services?: Array<{ name: string; priceTetri: number; isFromPrice?: boolean }>; totalTetri?: number; totalIsFrom?: boolean; startsAt: Date; endsAt: Date; locationName: string; locationAddress?: string | null; timeZone?: string; cancellationCutoffMinutes?: number | null; }) {
  const { locale } = usePublicLocale();
  const ui = bookingUi[locale];
  const text = flowUi[locale];
  const titleRef = useRef<HTMLHeadingElement>(null);
  const [announcement, setAnnouncement] = useState("");
  useEffect(() => { titleRef.current?.focus(); }, []);
  const start = bookingMoment(startsAt, timeZone, locale);
  const end = bookingMoment(endsAt, timeZone, locale);
  const calendarDescription = locale === "en" ? `${BRAND.name} booking. Status: awaiting salon confirmation.${assignedStaffName ? ` Specialist: ${assignedStaffName}.` : ""}` : locale === "ru" ? `Запись ${BRAND.name}. Статус: ожидает подтверждения салоном.${assignedStaffName ? ` Специалист: ${assignedStaffName}.` : ""}` : `${BRAND.nameKa} ჯავშანი. სტატუსი: სალონის დადასტურებას ელოდება.${assignedStaffName ? ` სპეციალისტი: ${assignedStaffName}.` : ""}`;
  const saveToCalendar = () => downloadBookingCalendar({ startsAt, endsAt, title: `${serviceName} — ${locationName}`, location: locationAddress ?? locationName, description: calendarDescription });
  const mapsUrl = locationAddress ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${locationName}, ${locationAddress}`)}` : null;
  const notify = (message: string) => { setAnnouncement(message); toast.success(message); };
  // Shares the salon page, never the private manage link.
  const share = async () => {
    const url = `${window.location.origin}/salon/${slug ?? ""}`;
    const shareText = [`${start.day} ${start.monthFull}`, start.time, locationName, locationAddress].filter(Boolean).join(", ");
    if (typeof navigator.share === "function") {
      try { await navigator.share({ title: locationName, text: shareText, url }); }
      catch (error) { if ((error as { name?: string }).name !== "AbortError" && await copyText(`${shareText}\n${url}`)) notify(ui.copied); }
      return;
    }
    if (await copyText(`${shareText}\n${url}`)) notify(ui.copied);
  };
  const manageUrl = `/manage-booking/${confirmationToken}`;
  const copyManageLink = async () => { if (await copyText(`${window.location.origin}${manageUrl}`)) notify(ui.linkCopied); };
  return <div className="cwb-card cwb-card-narrow">
    <div className="cwb-done">
      <ConfirmMark />
      <div>
        <h1 ref={titleRef} tabIndex={-1}>{ui.received}</h1>
        <p className="cwb-step-lede">{ui.receivedLead}</p>
      </div>
      <div className="cwb-when-block">
        <p className="cwb-when-weekday">{start.weekdayFull}</p>
        <p className="cwb-when-date">{start.day} {start.monthFull}</p>
        <p className="cwb-when-time"><span className="cwb-ringed cw-num">{start.time}–{end.time}<Ring variant="wide" draw /></span></p>
      </div>
      <div className="cwb-review-wrap"><table className="cwb-review cwb-review-flat"><caption className="sr-only">{text.detailsCaption}</caption><tbody>
        <tr><th scope="row">{text.business}</th><td>{locationName}{locationAddress ? <span className="block text-sm font-normal text-muted-foreground">{locationAddress}</span> : null}</td></tr>
        {assignedStaffName ? <tr><th scope="row">{text.specialist}</th><td><span className="sr-only">{ui.assigned} </span>{assignedStaffName}</td></tr> : null}
        <tr><th scope="row">{text.services}</th><td>{services?.length ? <ul className="cwb-review-services">{services.map(service => <li key={service.name}><span>{service.name}</span><span className="cwb-price">{priceLabel(text, service.priceTetri, service.isFromPrice)}</span></li>)}</ul> : serviceName}</td></tr>
        {totalTetri !== undefined ? <tr className="cwb-review-total"><th scope="row">{text.total}</th><td className="cw-num">{priceLabel(text, totalTetri, totalIsFrom)}</td></tr> : null}
      </tbody></table></div>
      <div className="cwb-actions cwb-actions-stack">
        <button type="button" className="cwb-btn cwb-btn-primary" onClick={saveToCalendar}><CalendarPlus className="size-4" aria-hidden="true" />{ui.calendar}</button>
        {mapsUrl ? <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="cwb-btn cwb-btn-line"><MapPin className="size-4" aria-hidden="true" />{ui.map}</a> : null}
        <button type="button" className="cwb-btn cwb-btn-line" onClick={() => void share()}><Share2 className="size-4" aria-hidden="true" />{ui.share}</button>
      </div>
      <section aria-labelledby="booking-next-title">
        <h2 id="booking-next-title" className="cwb-section-title">{ui.whatNext}</h2>
        <ol className="cwb-next">
          <li>{ui.next1(locationName)}</li>
          <li>{ui.next2}</li>
          {cancellationCutoffMinutes ? <li>{ui.next3(cancellationCutoffMinutes)}</li> : null}
        </ol>
      </section>
      <section className="cwb-private" aria-labelledby="booking-private-title">
        <h2 id="booking-private-title">{ui.privateTitle}</h2>
        <p>{ui.privateText}</p>
        <div className="cwb-actions">
          <button type="button" className="cwb-btn cwb-btn-line" onClick={() => void copyManageLink()}><Link2 className="size-4" aria-hidden="true" />{ui.copyLink}</button>
          <Link href={manageUrl} className="cwb-btn cwb-btn-line">{ui.manage}</Link>
        </div>
      </section>
      <p role="status" className="sr-only">{announcement}</p>
    </div>
  </div>;
}

function BookingErrorNotice({ issue, errorRef, onRetry }: { issue: BookingValidationIssue; errorRef: React.RefObject<HTMLDivElement | null>; onRetry?: () => void }) {
  const text = flowUi[usePublicLocale().locale];
  return <BookingNotice tone="error" role="alert" noticeRef={errorRef} title={issue.title}>
    {issue.description ? <p>{issue.description}</p> : null}
    {onRetry ? <button type="button" className="cwb-btn cwb-btn-danger cwb-btn-sm" onClick={onRetry}><RefreshCw className="size-4" aria-hidden="true" />{text.retry}</button> : null}
  </BookingNotice>;
}
