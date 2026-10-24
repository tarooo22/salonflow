import { CatalogFooter, CatalogHeader } from "@/components/catalog/CatalogChrome";
import { BookingFeedbackForm } from "@/components/public/BookingFeedbackForm";
import { BookingDateStrip, BookingNotice, BookingSlotGroup, addDaysKey, formatDateKeyLong } from "@/components/public/BookingPrimitives";
import { usePublicMeta } from "@/components/public/PublicMeta";
import { usePublicLocale } from "@/contexts/PublicLocaleContext";
import { formatDateTimeForLocale, formatGelTetri } from "@/lib/presentation";
import { trpc } from "@/lib/trpc";
import { BRAND } from "@shared/brand";
import { dateKeyInTimeZone } from "@shared/timezones";
import { CalendarCheck, Check, ChevronLeft, Clock, RefreshCw, UserCheck, X, XCircle } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useRoute } from "wouter";
import "@/components/catalog/booking.css";

export const ui = {
  ka: {
    metaTitle: "ჯავშნის მართვა", metaDescription: "ნახე ჯავშნის დეტალები, გადაიტანე დრო ან გააუქმე ჯავშანი.",
    status: { PENDING: "ელოდება დადასტურებას", CONFIRMED: "დადასტურებულია", CHECKED_IN: "სალონშია", IN_SERVICE: "მიმდინარეობს", COMPLETED: "დასრულებულია", CANCELLED: "გაუქმებულია", NO_SHOW: "არ გამოცხადდა" } as Record<string, string>,
    catalog: "კატალოგი", eyebrow: "დაცული ჯავშნის მართვა", loading: "ჯავშნის ინფორმაცია იტვირთება…", errorTitle: "ჯავშნის მართვა ვერ გაიხსნა", errorText: "ბმული შეიძლება არასწორია ან მისი ვადა უკვე გავიდა.",
    yourVisit: "შენი ვიზიტი", lede: "აქ შეგიძლია ნახო დეტალები, ნებადართულ ვადაში მოითხოვო დროის გადატანა ან გააუქმო მოთხოვნა. ნებისმიერი ახალი დრო შენახვისას კვლავ მოწმდება.",
    detailsCaption: "ჯავშნის დეტალები", business: "ბიზნესი", dateTime: "თარიღი და დრო", specialist: "სპეციალისტი", duration: "ხანგრძლივობა", minutes: "წთ", services: "სერვისები", total: "ჯამი",
    rescheduleTitle: "დროის გადატანა", rescheduleLede: "აირჩიე დღე, შემდეგ კი მხოლოდ თავისუფალი დრო. საბოლოო ხელმისაწვდომობა შენახვისას ისევ მოწმდება.",
    morning: "დილა", afternoon: "შუადღე", evening: "საღამო", slotsLoading: "თავისუფალი დრო იტვირთება…", noSlots: "ამ დღისთვის თავისუფალი დრო ვერ მოიძებნა.", waitlist: "მოლოდინის სიის მოთხოვნა", saving: "ინახება…", reschedule: "დროის გადატანა",
    cancelTitle: "გაუქმება", cancelLede: "ონლაინ გაუქმება შესაძლებელია ფილიალის მიერ განსაზღვრულ ვადამდე.", cancelBooking: "ჯავშნის გაუქმება", sure: "დარწმუნებული ხარ?", cancelWarning: "გაუქმების შემდეგ ჯავშანი აღდგება მხოლოდ სალონის ახალი მოქმედებით.", no: "არა", yesCancel: "დიახ, გაუქმება", working: "მიმდინარეობს…",
    locked: "ამ ჯავშნის შეცვლა ან გაუქმება ონლაინ აღარ არის ხელმისაწვდომი. ცვლილებისთვის დაუკავშირდი ფილიალს.", cancelled: "ჯავშანი გაუქმდა.", saved: "ახალი დრო შენახულია.", retry: "თავიდან ცდა",
  },
  en: {
    metaTitle: "Manage booking", metaDescription: "View your booking details, reschedule or cancel the booking.",
    status: { PENDING: "Awaiting confirmation", CONFIRMED: "Confirmed", CHECKED_IN: "At the salon", IN_SERVICE: "In progress", COMPLETED: "Completed", CANCELLED: "Cancelled", NO_SHOW: "No-show" } as Record<string, string>,
    catalog: "Catalog", eyebrow: "Secure booking management", loading: "Loading booking details…", errorTitle: "The booking could not be opened", errorText: "The link may be incorrect or may have expired.",
    yourVisit: "Your visit", lede: "Here you can view the details, request a new time within the allowed period, or cancel your request. Any new time is checked again when it is saved.",
    detailsCaption: "Booking details", business: "Business", dateTime: "Date and time", specialist: "Specialist", duration: "Duration", minutes: "min", services: "Services", total: "Total",
    rescheduleTitle: "Reschedule", rescheduleLede: "Choose a day, then only a free time. Final availability is checked again when you save.",
    morning: "Morning", afternoon: "Afternoon", evening: "Evening", slotsLoading: "Loading free times…", noSlots: "No free time found for this day.", waitlist: "Join the waitlist", saving: "Saving…", reschedule: "Reschedule",
    cancelTitle: "Cancel", cancelLede: "You can cancel online until the deadline set by the location.", cancelBooking: "Cancel booking", sure: "Are you sure?", cancelWarning: "After cancelling, the booking can be restored only by a new action from the salon.", no: "No", yesCancel: "Yes, cancel", working: "Working…",
    locked: "This booking can no longer be changed or cancelled online. To make a change, contact the location.", cancelled: "The booking has been cancelled.", saved: "The new time has been saved.", retry: "Try again",
  },
  ru: {
    metaTitle: "Управление записью", metaDescription: "Посмотрите детали записи, перенесите время или отмените запись.",
    status: { PENDING: "Ожидает подтверждения", CONFIRMED: "Подтверждено", CHECKED_IN: "В салоне", IN_SERVICE: "Выполняется", COMPLETED: "Завершено", CANCELLED: "Отменено", NO_SHOW: "Не явился" } as Record<string, string>,
    catalog: "Каталог", eyebrow: "Защищённое управление записью", loading: "Загрузка данных записи…", errorTitle: "Не удалось открыть запись", errorText: "Ссылка может быть неверной или срок её действия истёк.",
    yourVisit: "Ваш визит", lede: "Здесь можно посмотреть детали, в допустимый срок запросить перенос времени или отменить запись. Любое новое время при сохранении проверяется заново.",
    detailsCaption: "Детали записи", business: "Бизнес", dateTime: "Дата и время", specialist: "Специалист", duration: "Длительность", minutes: "мин", services: "Услуги", total: "Итого",
    rescheduleTitle: "Перенос времени", rescheduleLede: "Выберите день, затем только свободное время. Окончательная доступность проверяется заново при сохранении.",
    morning: "Утро", afternoon: "День", evening: "Вечер", slotsLoading: "Загрузка свободного времени…", noSlots: "На этот день свободного времени не найдено.", waitlist: "Встать в лист ожидания", saving: "Сохранение…", reschedule: "Перенести время",
    cancelTitle: "Отмена", cancelLede: "Отменить онлайн можно до срока, установленного филиалом.", cancelBooking: "Отменить запись", sure: "Вы уверены?", cancelWarning: "После отмены запись можно восстановить только новым действием салона.", no: "Нет", yesCancel: "Да, отменить", working: "Выполняется…",
    locked: "Изменить или отменить эту запись онлайн больше нельзя. Для изменений свяжитесь с филиалом.", cancelled: "Запись отменена.", saved: "Новое время сохранено.", retry: "Попробовать ещё раз",
  },
} as const;
const DAYS_AHEAD = 14;

// Status mark: icon and word together, tone from the booking status.
const STATUS_MARK = { PENDING: { tone: "warn", Icon: Clock }, CONFIRMED: { tone: "info", Icon: CalendarCheck }, CHECKED_IN: { tone: "accent", Icon: UserCheck }, IN_SERVICE: { tone: "accent", Icon: UserCheck }, COMPLETED: { tone: "ok", Icon: Check }, CANCELLED: { tone: "muted", Icon: X }, NO_SHOW: { tone: "muted", Icon: X } } as const;

export default function ManageBooking() {
  const [, params] = useRoute("/manage-booking/:token");
  const token = params?.token ?? "";
  const { locale } = usePublicLocale();
  const text = ui[locale];
  usePublicMeta({ title: `${text.metaTitle} | ${BRAND.name}`, description: text.metaDescription, canonicalPath: "/manage-booking", robots: "noindex,nofollow" });
  const utils = trpc.useUtils();
  const detail = trpc.public.bookingByToken.useQuery({ token }, { enabled: Boolean(token), retry: false });
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedSlot, setSelectedSlot] = useState("");
  const [cancelConfirm, setCancelConfirm] = useState(false);
  const [feedback, setFeedback] = useState("");
  const timezone = detail.data?.location.timezone ?? "Asia/Tbilisi";
  const serviceId = detail.data?.services[0]?.serviceId ?? undefined;
  useEffect(() => { if (detail.data?.appointment.startsAt && !selectedDate) setSelectedDate(dateKeyInTimeZone(detail.data.appointment.startsAt, timezone)); }, [detail.data?.appointment.startsAt, selectedDate, timezone]);
  const slots = trpc.public.rescheduleSlots.useQuery({ token, date: selectedDate || "1970-01-01" }, { enabled: Boolean(detail.data?.appointment.canManage && selectedDate) });
  const cancel = trpc.public.cancelBookingByToken.useMutation({ onSuccess: async () => { setFeedback(text.cancelled); setCancelConfirm(false); await utils.public.bookingByToken.invalidate({ token }); }, onError: error => setFeedback(error.message) });
  const reschedule = trpc.public.rescheduleBookingByToken.useMutation({ onSuccess: async () => { setFeedback(text.saved); setSelectedSlot(""); await utils.public.bookingByToken.invalidate({ token }); await utils.public.rescheduleSlots.invalidate(); }, onError: error => setFeedback(error.message) });
  const todayKey = useMemo(() => dateKeyInTimeZone(new Date(), timezone), [timezone]);
  const days = useMemo(() => Array.from({ length: DAYS_AHEAD }, (_, index) => ({ key: addDaysKey(todayKey, index) })), [todayKey]);
  const slotList = slots.data?.slots ?? [];
  const periods = [
    { title: text.morning, slots: slotList.filter(slot => Number(slot.label.split(":")[0]) < 12) },
    { title: text.afternoon, slots: slotList.filter(slot => { const hour = Number(slot.label.split(":")[0]); return hour >= 12 && hour < 17; }) },
    { title: text.evening, slots: slotList.filter(slot => Number(slot.label.split(":")[0]) >= 17) },
  ];
  const appointment = detail.data?.appointment;

  return <div className="cw min-h-screen">
    <CatalogHeader />
    <main id="main-content" tabIndex={-1} className="cwb-page">
      <div className="cwb-card">
        <div className="cwb-head">
          <Link href="/salons" className="cwb-btn"><ChevronLeft className="size-4" aria-hidden="true" />{text.catalog}</Link>
          <span className="cwb-head-title">{text.eyebrow}</span>
          <span className="cwb-head-spacer" aria-hidden="true" />
        </div>

        {detail.isLoading ? <div className="cwb-section"><p role="status" className="cwb-empty">{text.loading}</p></div> : null}
        {detail.isError ? <div className="cwb-section"><BookingNotice tone="error" title={text.errorTitle}>{text.errorText}<div><button type="button" className="cwb-btn cwb-btn-danger cwb-btn-sm" onClick={() => void detail.refetch()}><RefreshCw className="size-4" aria-hidden="true" />{text.retry}</button></div></BookingNotice></div> : null}

        {detail.data && appointment ? <>
          <section className="cwb-section" aria-labelledby="manage-title">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h1 id="manage-title" className="cwb-step-title">{text.yourVisit}</h1>
              {(() => { const mark = STATUS_MARK[appointment.status as keyof typeof STATUS_MARK]; const Icon = mark?.Icon; return <span className="cwb-pill" data-tone={mark?.tone}>{Icon ? <Icon className="size-3.5" aria-hidden="true" /> : null}{text.status[appointment.status] ?? appointment.status}</span>; })()}
            </div>
            <p className="cwb-step-lede">{text.lede}</p>
            <div className="cwb-review-wrap mt-4"><table className="cwb-review"><caption className="sr-only">{text.detailsCaption}</caption><tbody>
              <tr><th scope="row">{text.business}</th><td>{detail.data.location.name}{detail.data.location.address ? <span className="block text-sm font-normal text-muted-foreground">{detail.data.location.address}</span> : null}</td></tr>
              <tr><th scope="row">{text.dateTime}</th><td className="cw-num">{formatDateTimeForLocale(appointment.startsAt, locale, timezone)}</td></tr>
              {detail.data.staffName ? <tr><th scope="row">{text.specialist}</th><td>{detail.data.staffName}</td></tr> : null}
              <tr><th scope="row">{text.duration}</th><td className="cw-num">{Math.round((appointment.endsAt.getTime() - appointment.startsAt.getTime()) / 60_000)} {text.minutes}</td></tr>
              <tr><th scope="row">{text.services}</th><td><ul className="cwb-review-services">{detail.data.services.map(service => <li key={service.id}><span>{service.name}</span><span className="cwb-price">{formatGelTetri(service.priceTetri)}</span></li>)}</ul></td></tr>
              <tr className="cwb-review-total"><th scope="row">{text.total}</th><td className="cw-num">{formatGelTetri(appointment.totalTetri)}</td></tr>
            </tbody></table></div>
          </section>

          {feedback ? <div className="cwb-pad"><BookingNotice tone="ok" role="status">{feedback}</BookingNotice></div> : null}
          {appointment.status === "COMPLETED" ? <section className="cwb-section"><BookingFeedbackForm token={token} /></section> : null}

          {appointment.canManage ? <>
            <section className="cwb-section" aria-labelledby="reschedule-title">
              <h2 id="reschedule-title" className="cwb-section-title">{text.rescheduleTitle}</h2>
              <p className="cwb-step-lede">{text.rescheduleLede}</p>
              <div className="mt-4 grid gap-4">
                <BookingDateStrip days={days} selected={selectedDate} todayKey={todayKey} onSelect={key => { setSelectedDate(key); setSelectedSlot(""); }} />
                {selectedDate ? <p className="cwb-when"><span>{formatDateKeyLong(selectedDate, locale)}</span></p> : null}
                <div aria-live="polite" className="min-h-24">
                  {slots.isLoading ? <p role="status" className="cwb-muted">{text.slotsLoading}</p>
                    : slotList.length ? <div>{periods.map(period => <BookingSlotGroup key={period.title} title={period.title} slots={period.slots} selectedStartsAt={selectedSlot} onSelect={setSelectedSlot} />)}</div>
                    : <div className="cwb-empty"><strong>{text.noSlots}</strong><Link href={`/waitlist/${detail.data.location.publicSlug}?serviceId=${encodeURIComponent(serviceId ?? "")}&staffProfileId=${encodeURIComponent(appointment.staffProfileId)}&date=${encodeURIComponent(selectedDate)}`} className="cwb-link">{text.waitlist}</Link></div>}
                </div>
                <div className="cwb-actions">
                  <button type="button" className="cwb-btn cwb-btn-primary" aria-disabled={!selectedSlot || reschedule.isPending} onClick={() => { if (selectedSlot && !reschedule.isPending) reschedule.mutate({ token, startsAt: new Date(selectedSlot) }); }}>{reschedule.isPending ? text.saving : text.reschedule}</button>
                </div>
              </div>
            </section>
            <section className="cwb-section" aria-labelledby="cancel-title">
              <h2 id="cancel-title" className="cwb-section-title">{text.cancelTitle}</h2>
              <p className="cwb-step-lede">{text.cancelLede}</p>
              <div className="mt-4">
                {!cancelConfirm ? <button type="button" className="cwb-btn cwb-btn-danger" onClick={() => setCancelConfirm(true)}><XCircle className="size-4" aria-hidden="true" />{text.cancelBooking}</button>
                  : <BookingNotice tone="error" title={text.sure}>
                    <p>{text.cancelWarning}</p>
                    <div className="cwb-actions mt-3">
                      <button type="button" className="cwb-btn cwb-btn-line" onClick={() => setCancelConfirm(false)}>{text.no}</button>
                      <button type="button" className="cwb-btn cwb-btn-danger" onClick={() => cancel.mutate({ token })} disabled={cancel.isPending}>{cancel.isPending ? text.working : text.yesCancel}</button>
                    </div>
                  </BookingNotice>}
              </div>
            </section>
          </> : <section className="cwb-section"><p className="cwb-empty">{text.locked}</p></section>}
        </> : null}
      </div>
    </main>
    <CatalogFooter />
  </div>;
}
