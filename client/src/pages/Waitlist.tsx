import { CatalogFooter, CatalogHeader } from "@/components/catalog/CatalogChrome";
import "@/components/catalog/booking.css";
import { GeorgianDatePicker, GeorgianTimePicker } from "@/components/public/GeorgianDateTimePicker";
import { usePublicMeta } from "@/components/public/PublicMeta";
import { usePublicLocale } from "@/contexts/PublicLocaleContext";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { BRAND } from "@shared/brand";
import { dateKeyInTimeZone } from "@shared/timezones";
import { CalendarHeart, CheckCircle2, ChevronLeft, CircleAlert } from "lucide-react";
import { FormEvent, useMemo, useState } from "react";
import { Link, useRoute } from "wouter";

export const ui = {
  ka: {
    metaTitle: "მოლოდინის სია", metaDescription: "დატოვე მოთხოვნა მოლოდინის სიაში — თუ სასურველი დრო გათავისუფლდება, ადგილის გუნდი ამას დაინახავს.",
    back: "ჩაწერაზე დაბრუნება", eyebrow: "მოლოდინის სია · მოთხოვნა", title: "დარჩი მოლოდინის სიაში.", lede: "თუ სასურველი დრო გათავისუფლდება, შენი მოთხოვნა გუნდს დაეხმარება პრიორიტეტების ნახვაში. ეს არ არის დადასტურებული ჩაწერა და შეტყობინება ჯერ ავტომატურად არ იგზავნება.",
    formAria: "მოლოდინის სიის ფორმა", loading: "მონაცემები იტვირთება…", unavailable: "ამ ფილიალის მოლოდინის სია ახლა მიუწვდომელია.", goBack: "დაბრუნდი ჩაწერის გვერდზე.", bookingPage: "ჩაწერის გვერდი",
    received: "მოთხოვნა მიღებულია", receivedText: "შენი სასურველი დრო მოლოდინის სიას დაემატა. ეს არ წარმოადგენს დადასტურებულ ჯავშანს და ავტომატური შეტყობინება არ იგზავნება.", backToBooking: "ჩაწერის გვერდზე დაბრუნება",
    yourVisit: "შენი სასურველი ვიზიტი", required: "* სავალდებულო", dateHint: "აირჩიე თარიღი ქართულ კალენდარში. წარსული დღეები და მიმდინარე დღის გასული საათები მიუწვდომელია.",
    step1: "სერვისი და დრო", service: "სერვისი", chooseService: "აირჩიე სერვისი", specialist: "სპეციალისტი", anyStaff: "ნებისმიერი სპეციალისტი", wantedDate: "სასურველი თარიღი", wantedTime: "სასურველი დრო (არასავალდებულო)", selectedService: "არჩეული სერვისი: ",
    step2: "შენი მონაცემები", firstName: "სახელი", lastName: "გვარი", phone: "მობილურის ნომერი", phoneHint: "ფორმატი: 5XX XX XX XX", phonePlaceholder: "მაგ. 555 12 34 56", email: "ელფოსტა", note: "კომენტარი ადგილისთვის",
    consent: "ვეთანხმები, რომ ბიზნესმა ეს მონაცემები გამოიყენოს მხოლოდ მოლოდინის სიის მოთხოვნის დამუშავებისთვის. *", validation: "შეავსე სერვისი, სახელი, მობილურის ნომერი და დაადასტურე პირობები.", sending: "იგზავნება…", send: "მოთხოვნის გაგზავნა",
  },
  en: {
    metaTitle: "Waitlist", metaDescription: "Leave a waitlist request — if the time you want becomes free, the team will see it.",
    back: "Back to booking", eyebrow: "Waitlist · request", title: "Stay on the waitlist.", lede: "If a preferred time becomes free, your request helps the team see priorities. This is not a confirmed booking, and notifications are not sent automatically yet.",
    formAria: "Waitlist form", loading: "Loading data…", unavailable: "The waitlist for this location is unavailable right now.", goBack: "Go back to the booking page.", bookingPage: "Booking page",
    received: "Request received", receivedText: "Your preferred time has been added to the waitlist. This is not a confirmed booking, and no automatic notification is sent.", backToBooking: "Back to the booking page",
    yourVisit: "Your preferred visit", required: "* required", dateHint: "Choose a date in the calendar. Past days and hours that have already passed today are unavailable.",
    step1: "Service and time", service: "Service", chooseService: "Choose a service", specialist: "Specialist", anyStaff: "Any available specialist", wantedDate: "Preferred date", wantedTime: "Preferred time (optional)", selectedService: "Selected service: ",
    step2: "Your details", firstName: "First name", lastName: "Last name", phone: "Mobile number", phoneHint: "Format: 5XX XX XX XX", phonePlaceholder: "e.g. 555 12 34 56", email: "Email", note: "Note for the place",
    consent: "I agree that the business may use this data only to process my waitlist request. *", validation: "Fill in the service, first name and mobile number, and accept the terms.", sending: "Sending…", send: "Send request",
  },
  ru: {
    metaTitle: "Лист ожидания", metaDescription: "Оставьте запрос в листе ожидания — если нужное время освободится, команда это увидит.",
    back: "Вернуться к записи", eyebrow: "Лист ожидания · запрос", title: "Оставайтесь в листе ожидания.", lede: "Если желаемое время освободится, ваш запрос поможет команде увидеть приоритеты. Это не подтверждённая запись, и уведомления пока не отправляются автоматически.",
    formAria: "Форма листа ожидания", loading: "Загрузка данных…", unavailable: "Лист ожидания этого филиала сейчас недоступен.", goBack: "Вернитесь на страницу записи.", bookingPage: "Страница записи",
    received: "Запрос принят", receivedText: "Желаемое время добавлено в лист ожидания. Это не подтверждённая запись, и автоматическое уведомление не отправляется.", backToBooking: "Вернуться на страницу записи",
    yourVisit: "Желаемый визит", required: "* обязательно", dateHint: "Выберите дату в календаре. Прошедшие дни и уже прошедшие часы сегодняшнего дня недоступны.",
    step1: "Услуга и время", service: "Услуга", chooseService: "Выберите услугу", specialist: "Специалист", anyStaff: "Любой свободный специалист", wantedDate: "Желаемая дата", wantedTime: "Желаемое время (необязательно)", selectedService: "Выбранная услуга: ",
    step2: "Ваши данные", firstName: "Имя", lastName: "Фамилия", phone: "Номер мобильного телефона", phoneHint: "Формат: 5XX XX XX XX", phonePlaceholder: "напр. 555 12 34 56", email: "Эл. почта", note: "Комментарий для заведения",
    consent: "Я согласен(на), что бизнес использует эти данные только для обработки моего запроса в листе ожидания. *", validation: "Заполните услугу, имя и номер мобильного телефона и подтвердите условия.", sending: "Отправка…", send: "Отправить запрос",
  },
} as const;

function defaultDate() { return dateKeyInTimeZone(new Date(), "Asia/Tbilisi"); }

export default function Waitlist() {
  const [, params] = useRoute("/waitlist/:slug");
  const slug = params?.slug ?? "";
  const text = ui[usePublicLocale().locale];
  usePublicMeta({ title: `${text.metaTitle} | ${BRAND.name}`, description: text.metaDescription, canonicalPath: `/waitlist/${slug}`, robots: "noindex,nofollow" });
  const catalog = trpc.public.bookingCatalog.useQuery(slug, { enabled: Boolean(slug) });
  const query = useMemo(() => new URLSearchParams(window.location.search), []);
  const [serviceId, setServiceId] = useState(query.get("serviceId") ?? "");
  const [staffProfileId, setStaffProfileId] = useState(query.get("staffProfileId") ?? "ANY");
  const [requestedDate, setRequestedDate] = useState(query.get("date") ?? defaultDate());
  const [preferredStartLocalTime, setPreferredStartLocalTime] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [note, setNote] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [idempotencyKey] = useState(() => crypto.randomUUID());
  const selectedService = catalog.data?.catalog.find(item => item.service.id === serviceId)?.service;
  const eligibleTeam = (catalog.data?.team ?? []).filter(member => member.eligibleServiceIds.includes(serviceId));
  const join = trpc.public.joinWaitlist.useMutation({ onSuccess: () => setSubmitted(true), onError: cause => setError(cause.message) });
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    if (!serviceId || !firstName.trim() || !phone.trim() || !accepted) { setError(text.validation); return; }
    join.mutate({ slug, serviceId, staffProfileId: staffProfileId === "ANY" ? undefined : staffProfileId, requestedDate, preferredStartLocalTime: preferredStartLocalTime || undefined, firstName, lastName: lastName || undefined, phone, email: email || undefined, customerNote: note || undefined, bookingTermsConsent: true, idempotencyKey });
  };

  return <div className="cw min-h-screen">
    <CatalogHeader />
    <main id="main-content" tabIndex={-1} className="cwb-page">
      <div className="cwb-card">
        <div className="cwb-head">
          <Link href={`/book/${slug}`} className="cwb-btn"><ChevronLeft className="size-4" aria-hidden="true" />{text.back}</Link>
          <span className="cwb-head-spacer" aria-hidden="true" />
        </div>
        <section className="cwb-section pt-2" aria-labelledby="waitlist-title">
          <h1 id="waitlist-title" className="cwb-step-title">{text.title}</h1>
          <p className="cwb-step-lede">{text.lede}</p>
        </section>

        <section className="cwb-section" aria-label={text.formAria}>
          {catalog.isLoading ? <p className="cwb-empty" role="status">{text.loading}</p> : null}
          {catalog.isError || catalog.data === null ? <div className="cwb-notice" data-tone="error" role="alert">
            <CircleAlert className="size-5" aria-hidden="true" />
            <div className="min-w-0">
              <p className="cwb-notice-title">{text.unavailable}</p>
              <p>{text.goBack}</p>
              <Link href={`/book/${slug}`} className="cwb-btn cwb-btn-line cwb-btn-sm mt-3">{text.bookingPage}</Link>
            </div>
          </div> : null}

          {catalog.data && submitted ? <div role="status" aria-live="polite" className="grid gap-3">
            <span className="cwb-done-mark" aria-hidden="true"><CheckCircle2 className="size-6" /></span>
            <h2 className="cwb-section-title">{text.received}</h2>
            <p className="cwb-step-lede">{text.receivedText}</p>
            <div><Link href={`/book/${slug}`} className="cwb-btn cwb-btn-primary mt-2">{text.backToBooking}</Link></div>
          </div> : null}

          {catalog.data && !submitted ? <form data-conversion-event="BOOKING_WAITLIST_SUBMIT" className="grid gap-6" onSubmit={submit}>
            <p className="cwb-hint">{text.dateHint} <span className="cw-num">{text.required}</span></p>

            <fieldset className="cwb-fieldset">
              <legend><span className="cwb-step-num cw-num" aria-hidden="true">1</span>{text.step1}</legend>
              <div className="cwb-fields cwb-two">
                <Field label={text.service} required>
                  <Select value={serviceId} onValueChange={value => { setServiceId(value); setStaffProfileId("ANY"); }}>
                    <SelectTrigger className="w-full min-w-0"><SelectValue placeholder={text.chooseService} /></SelectTrigger>
                    <SelectContent>{catalog.data.catalog.map(({ service }) => <SelectItem key={service.id} value={service.id}>{service.nameKa}</SelectItem>)}</SelectContent>
                  </Select>
                </Field>
                <Field label={text.specialist}>
                  <Select value={staffProfileId} onValueChange={setStaffProfileId}>
                    <SelectTrigger className="w-full min-w-0"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ANY">{text.anyStaff}</SelectItem>
                      {eligibleTeam.map(member => <SelectItem key={member.id} value={member.id}>{member.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label={text.wantedDate}>
                  <GeorgianDatePicker value={requestedDate} onChange={value => { setRequestedDate(value); setPreferredStartLocalTime(""); }} />
                </Field>
                <Field label={text.wantedTime}>
                  <GeorgianTimePicker dateKey={requestedDate} value={preferredStartLocalTime} onChange={setPreferredStartLocalTime} />
                </Field>
              </div>
              {selectedService ? <p className="cwb-note"><CalendarHeart className="size-4 shrink-0" aria-hidden="true" />{text.selectedService}<strong>{selectedService.nameKa}</strong></p> : null}
            </fieldset>

            <fieldset className="cwb-fieldset">
              <legend><span className="cwb-step-num cw-num" aria-hidden="true">2</span>{text.step2}</legend>
              <div className="cwb-fields cwb-two">
                <Field label={text.firstName} required><input className="cwb-input" value={firstName} onChange={event => setFirstName(event.target.value)} autoComplete="given-name" required /></Field>
                <Field label={text.lastName}><input className="cwb-input" value={lastName} onChange={event => setLastName(event.target.value)} autoComplete="family-name" /></Field>
                <Field label={text.phone} required hint={text.phoneHint} hintId="waitlist-phone-help">
                  <div className="cwb-affix">
                    <span className="cwb-affix-prefix" aria-hidden="true">+995</span>
                    <input className="cwb-input" value={phone} onChange={event => setPhone(event.target.value)} autoComplete="tel" inputMode="tel" type="tel" placeholder={text.phonePlaceholder} aria-describedby="waitlist-phone-help" required />
                  </div>
                </Field>
                <Field label={text.email}><input className="cwb-input" value={email} onChange={event => setEmail(event.target.value)} autoComplete="email" type="email" /></Field>
              </div>
              <Field label={text.note}><textarea className="cwb-input" value={note} onChange={event => setNote(event.target.value)} /></Field>
              <label className="cwb-agree"><Checkbox checked={accepted} onCheckedChange={value => setAccepted(value === true)} /><span>{text.consent}</span></label>
            </fieldset>

            {error ? <div role="alert" className="cwb-notice" data-tone="error"><CircleAlert className="size-5" aria-hidden="true" /><p className="cwb-notice-title">{error}</p></div> : null}
            <button type="submit" className="cwb-btn cwb-btn-primary w-full" disabled={join.isPending}>{join.isPending ? text.sending : text.send}</button>
          </form> : null}
        </section>
      </div>
    </main>
    <CatalogFooter />
  </div>;
}

function Field({ label, children, required, hint, hintId }: { label: string; children: React.ReactNode; required?: boolean; hint?: string; hintId?: string }) {
  return <label className="cwb-field">
    <span className="cwb-label">{label}{required ? <span aria-hidden="true"> *</span> : null}</span>
    {children}
    {hint ? <span id={hintId} className="cwb-hint">{hint}</span> : null}
  </label>;
}
