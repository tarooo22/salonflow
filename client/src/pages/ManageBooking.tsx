import { CatalogFooter, CatalogHeader } from "@/components/catalog/CatalogChrome";
import { BookingFeedbackForm } from "@/components/public/BookingFeedbackForm";
import { BookingDateStrip, BookingNotice, BookingSlotGroup, addDaysKey, formatDateKeyLong } from "@/components/public/BookingPrimitives";
import { usePublicMeta } from "@/components/public/PublicMeta";
import { formatGelTetri, formatKaDateTime } from "@/lib/presentation";
import { trpc } from "@/lib/trpc";
import { BRAND } from "@shared/brand";
import { dateKeyInTimeZone } from "@shared/timezones";
import { ChevronLeft, XCircle } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useRoute } from "wouter";
import "@/components/catalog/booking.css";

const STATUS_LABELS: Record<string, string> = { PENDING: "ელოდება დადასტურებას", CONFIRMED: "დადასტურებულია", CHECKED_IN: "სალონშია", IN_SERVICE: "მიმდინარეობს", COMPLETED: "დასრულებულია", CANCELLED: "გაუქმებულია", NO_SHOW: "არ გამოცხადდა" };
const DAYS_AHEAD = 14;

export default function ManageBooking() {
  const [, params] = useRoute("/manage-booking/:token");
  const token = params?.token ?? "";
  usePublicMeta({ title: `ჯავშნის მართვა | ${BRAND.name}`, description: "ნახეთ ჯავშნის დეტალები, გადაიტანეთ დრო ან გააუქმეთ ჯავშანი.", canonicalPath: "/manage-booking", robots: "noindex,nofollow" });
  const utils = trpc.useUtils();
  const detail = trpc.public.bookingByToken.useQuery({ token }, { enabled: Boolean(token), retry: false });
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedSlot, setSelectedSlot] = useState("");
  const [cancelConfirm, setCancelConfirm] = useState(false);
  const [feedback, setFeedback] = useState("");
  const timezone = detail.data?.location.timezone ?? "Asia/Tbilisi";
  const serviceId = detail.data?.services[0]?.serviceId ?? undefined;
  useEffect(() => { if (detail.data?.appointment.startsAt && !selectedDate) setSelectedDate(dateKeyInTimeZone(detail.data.appointment.startsAt, timezone)); }, [detail.data?.appointment.startsAt, selectedDate, timezone]);
  const slots = trpc.public.availableSlots.useQuery({ slug: detail.data?.location.publicSlug ?? "pending-location", serviceId: serviceId ?? "pending-service", staffProfileId: detail.data?.appointment.staffProfileId ?? "pending-staff", date: selectedDate || "1970-01-01" }, { enabled: Boolean(detail.data?.appointment.canManage && serviceId && selectedDate) });
  const cancel = trpc.public.cancelBookingByToken.useMutation({ onSuccess: async () => { setFeedback("ჯავშანი გაუქმდა."); setCancelConfirm(false); await utils.public.bookingByToken.invalidate({ token }); }, onError: error => setFeedback(error.message) });
  const reschedule = trpc.public.rescheduleBookingByToken.useMutation({ onSuccess: async () => { setFeedback("ახალი დრო შენახულია."); setSelectedSlot(""); await utils.public.bookingByToken.invalidate({ token }); await utils.public.availableSlots.invalidate(); }, onError: error => setFeedback(error.message) });
  const todayKey = useMemo(() => dateKeyInTimeZone(new Date(), timezone), [timezone]);
  const days = useMemo(() => Array.from({ length: DAYS_AHEAD }, (_, index) => ({ key: addDaysKey(todayKey, index) })), [todayKey]);
  const slotList = slots.data?.slots ?? [];
  const periods = [
    { title: "დილა", slots: slotList.filter(slot => Number(slot.label.split(":")[0]) < 12) },
    { title: "შუადღე", slots: slotList.filter(slot => { const hour = Number(slot.label.split(":")[0]); return hour >= 12 && hour < 17; }) },
    { title: "საღამო", slots: slotList.filter(slot => Number(slot.label.split(":")[0]) >= 17) },
  ];
  const appointment = detail.data?.appointment;

  return <div className="cw min-h-screen">
    <CatalogHeader />
    <main id="main-content" tabIndex={-1} className="cw-book">
      <div className="cw-form">
        <div className="cw-form-band" aria-hidden="true" />
        <div className="cw-form-head">
          <Link href="/salons" className="cw-btn cw-btn-line"><ChevronLeft className="size-4" aria-hidden="true" />კატალოგი</Link>
          <div className="cw-form-head-title"><span className="cw-caption">დაცული ჯავშნის მართვა</span></div>
          <span className="w-11" aria-hidden="true" />
        </div>

        {detail.isLoading ? <div className="cw-sheet-section"><p role="status" className="cw-empty">ჯავშნის ინფორმაცია იტვირთება…</p></div> : null}
        {detail.isError ? <div className="cw-sheet-section"><BookingNotice tone="error" title="ჯავშნის მართვა ვერ გაიხსნა">ბმული შეიძლება არასწორია ან მისი ვადა უკვე გავიდა.</BookingNotice></div> : null}

        {detail.data && appointment ? <>
          <section className="cw-sheet-section" aria-labelledby="manage-title">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="cw-caption cw-step-eyebrow">{detail.data.location.name}</span>
                <h1 id="manage-title" className="cw-step-title">თქვენი ვიზიტი</h1>
              </div>
              <span className="cw-stamp-mark shrink-0">{STATUS_LABELS[appointment.status] ?? appointment.status}</span>
            </div>
            <p className="cw-step-lede">აქ შეგიძლიათ ნახოთ დეტალები, ნებადართულ ვადაში მოითხოვოთ დროის გადატანა ან გააუქმოთ მოთხოვნა. ნებისმიერი ახალი დრო შენახვისას კვლავ მოწმდება.</p>
            <div className="cw-ledger mt-4"><table className="cw-review"><caption className="sr-only">ჯავშნის დეტალები</caption><tbody>
              <tr><th scope="row">ბიზნესი</th><td>{detail.data.location.name}{detail.data.location.address ? <span className="block text-sm font-normal text-[var(--cw-ink-soft)]">{detail.data.location.address}</span> : null}</td></tr>
              <tr><th scope="row">თარიღი და დრო</th><td className="cw-num text-[0.9rem]">{formatKaDateTime(appointment.startsAt, timezone)}</td></tr>
              {detail.data.staffName ? <tr><th scope="row">სპეციალისტი</th><td>{detail.data.staffName}</td></tr> : null}
              <tr><th scope="row">ხანგრძლივობა</th><td className="cw-num text-[0.9rem]">{Math.round((appointment.endsAt.getTime() - appointment.startsAt.getTime()) / 60_000)} წთ</td></tr>
              <tr><th scope="row">სერვისები</th><td><ul className="cw-review-services">{detail.data.services.map(service => <li key={service.id}><span>{service.name}</span><span className="cw-choice-price">{formatGelTetri(service.priceTetri)}</span></li>)}</ul></td></tr>
              <tr className="cw-review-total"><th scope="row">ჯამი</th><td className="cw-num">{formatGelTetri(appointment.totalTetri)}</td></tr>
            </tbody></table></div>
          </section>

          {feedback ? <div className="cw-form-pad"><BookingNotice tone="ok" role="status">{feedback}</BookingNotice></div> : null}
          {appointment.status === "COMPLETED" ? <section className="cw-sheet-section"><BookingFeedbackForm token={token} /></section> : null}

          {appointment.canManage ? <>
            <section className="cw-sheet-section" aria-labelledby="reschedule-title">
              <h2 id="reschedule-title" className="cw-step-title !text-[1.3rem]">დროის გადატანა</h2>
              <p className="cw-step-lede">აირჩიეთ დღე, შემდეგ კი მხოლოდ თავისუფალი დრო. საბოლოო ხელმისაწვდომობა შენახვისას ისევ მოწმდება.</p>
              <div className="mt-4 grid gap-4">
                <BookingDateStrip days={days} selected={selectedDate} todayKey={todayKey} onSelect={key => { setSelectedDate(key); setSelectedSlot(""); }} />
                {selectedDate ? <p className="cw-duration"><span>{formatDateKeyLong(selectedDate)}</span></p> : null}
                <div aria-live="polite" className="min-h-24">
                  {slots.isLoading ? <p role="status" className="text-sm text-[var(--cw-ink-soft)]">თავისუფალი დრო იტვირთება…</p>
                    : slotList.length ? <div>{periods.map(period => <BookingSlotGroup key={period.title} title={period.title} slots={period.slots} selectedStartsAt={selectedSlot} onSelect={setSelectedSlot} />)}</div>
                    : <div className="cw-empty text-sm"><strong>ამ დღისთვის თავისუფალი დრო ვერ მოიძებნა.</strong><Link href={`/waitlist/${detail.data.location.publicSlug}?serviceId=${encodeURIComponent(serviceId ?? "")}&staffProfileId=${encodeURIComponent(appointment.staffProfileId)}&date=${encodeURIComponent(selectedDate)}`} className="cw-link">Waitlist მოთხოვნა</Link></div>}
                </div>
                <div className="cw-actions">
                  <button type="button" className="cw-btn cw-btn-stamp" aria-disabled={!selectedSlot || reschedule.isPending} onClick={() => { if (selectedSlot && !reschedule.isPending) reschedule.mutate({ token, startsAt: new Date(selectedSlot) }); }}>{reschedule.isPending ? "ინახება…" : "დროის გადატანა"}</button>
                </div>
              </div>
            </section>
            <section className="cw-sheet-section" aria-labelledby="cancel-title">
              <h2 id="cancel-title" className="cw-step-title !text-[1.3rem]">გაუქმება</h2>
              <p className="cw-step-lede">ონლაინ გაუქმება შესაძლებელია ფილიალის მიერ განსაზღვრულ ვადამდე.</p>
              <div className="mt-4">
                {!cancelConfirm ? <button type="button" className="cw-btn cw-btn-danger" onClick={() => setCancelConfirm(true)}><XCircle className="size-4" aria-hidden="true" />ჯავშნის გაუქმება</button>
                  : <BookingNotice tone="error" title="დარწმუნებული ხართ?">
                    <p>გაუქმების შემდეგ ჯავშანი აღდგება მხოლოდ სალონის ახალი მოქმედებით.</p>
                    <div className="cw-actions mt-3">
                      <button type="button" className="cw-btn cw-btn-line" onClick={() => setCancelConfirm(false)}>არა</button>
                      <button type="button" className="cw-btn cw-btn-danger-solid" onClick={() => cancel.mutate({ token })} disabled={cancel.isPending}>{cancel.isPending ? "მიმდინარეობს…" : "დიახ, გაუქმება"}</button>
                    </div>
                  </BookingNotice>}
              </div>
            </section>
          </> : <section className="cw-sheet-section"><p className="cw-empty text-sm">ამ ჯავშნის შეცვლა ან გაუქმება ონლაინ აღარ არის ხელმისაწვდომი. ცვლილების შემთხვევაში დაუკავშირდით ფილიალს.</p></section>}
        </> : null}
      </div>
    </main>
    <CatalogFooter />
  </div>;
}
