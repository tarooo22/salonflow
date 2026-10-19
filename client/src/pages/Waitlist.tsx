import { CatalogFooter, CatalogHeader } from "@/components/catalog/CatalogChrome";
import "@/components/catalog/discovery.css";
import { cssVars } from "@/components/catalog/Tickets";
import { GeorgianDatePicker, GeorgianTimePicker } from "@/components/public/GeorgianDateTimePicker";
import { usePublicMeta } from "@/components/public/PublicMeta";
import { usePublicLocale } from "@/contexts/PublicLocaleContext";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { BRAND } from "@shared/brand";
import { dateKeyInTimeZone } from "@shared/timezones";
import { CalendarHeart, CheckCircle2 } from "lucide-react";
import { FormEvent, useMemo, useState } from "react";
import { Link, useRoute } from "wouter";

export const ui = {
  ka: {
    metaTitle: "მოლოდინის სია", metaDescription: "დატოვეთ მოთხოვნა მოლოდინის სიაში — თუ სასურველი დრო გათავისუფლდება, ადგილის გუნდი ამას დაინახავს.",
    back: "← ჩაწერაზე დაბრუნება", eyebrow: "მოლოდინის სია · მოთხოვნა", title: "დარჩით მოლოდინის სიაში.", lede: "თუ სასურველი დრო გათავისუფლდება, თქვენი მოთხოვნა გუნდს დაეხმარება პრიორიტეტების ნახვაში. ეს არ არის დადასტურებული ჩაწერა და შეტყობინება ჯერ ავტომატურად არ იგზავნება.",
    formAria: "მოლოდინის სიის ფორმა", loading: "მონაცემები იტვირთება…", unavailable: "ამ ფილიალის მოლოდინის სია ახლა მიუწვდომელია.", goBack: "დაბრუნდით ჩაწერის გვერდზე.", bookingPage: "ჩაწერის გვერდი",
    received: "მოთხოვნა მიღებულია", receivedText: "თქვენი სასურველი დრო მოლოდინის სიას დაემატა. ეს არ წარმოადგენს დადასტურებულ ჯავშანს და ავტომატური შეტყობინება არ იგზავნება.", backToBooking: "ჩაწერის გვერდზე დაბრუნება",
    yourVisit: "თქვენი სასურველი ვიზიტი", required: "* სავალდებულო", dateHint: "აირჩიეთ თარიღი ქართულ კალენდარში. წარსული დღეები და მიმდინარე დღის გასული საათები მიუწვდომელია.",
    step1: "სერვისი და დრო", service: "სერვისი", chooseService: "აირჩიეთ სერვისი", specialist: "სპეციალისტი", anyStaff: "ნებისმიერი თავისუფალი სპეციალისტი", wantedDate: "სასურველი თარიღი", wantedTime: "სასურველი დრო (არასავალდებულო)", selectedService: "არჩეული სერვისი: ",
    step2: "თქვენი მონაცემები", firstName: "სახელი", lastName: "გვარი", phone: "მობილურის ნომერი", phoneHint: "ფორმატი: 5XX XX XX XX ან +995 5XX XX XX XX.", phonePlaceholder: "მაგ. 555 12 34 56", email: "ელფოსტა", note: "კომენტარი ადგილისთვის",
    consent: "ვეთანხმები, რომ ბიზნესმა ეს მონაცემები გამოიყენოს მხოლოდ მოლოდინის სიის მოთხოვნის დამუშავებისთვის. *", validation: "შეავსეთ სერვისი, სახელი, მობილურის ნომერი და დაადასტურეთ პირობები.", sending: "იგზავნება…", send: "მოთხოვნის გაგზავნა",
  },
  en: {
    metaTitle: "Waitlist", metaDescription: "Leave a waitlist request — if the time you want becomes free, the team will see it.",
    back: "← Back to booking", eyebrow: "Waitlist · request", title: "Stay on the waitlist.", lede: "If a preferred time becomes free, your request helps the team see priorities. This is not a confirmed booking, and notifications are not sent automatically yet.",
    formAria: "Waitlist form", loading: "Loading data…", unavailable: "The waitlist for this location is unavailable right now.", goBack: "Go back to the booking page.", bookingPage: "Booking page",
    received: "Request received", receivedText: "Your preferred time has been added to the waitlist. This is not a confirmed booking, and no automatic notification is sent.", backToBooking: "Back to the booking page",
    yourVisit: "Your preferred visit", required: "* required", dateHint: "Choose a date in the calendar. Past days and hours that have already passed today are unavailable.",
    step1: "Service and time", service: "Service", chooseService: "Choose a service", specialist: "Specialist", anyStaff: "Any available specialist", wantedDate: "Preferred date", wantedTime: "Preferred time (optional)", selectedService: "Selected service: ",
    step2: "Your details", firstName: "First name", lastName: "Last name", phone: "Mobile number", phoneHint: "Format: 5XX XX XX XX or +995 5XX XX XX XX.", phonePlaceholder: "e.g. 555 12 34 56", email: "Email", note: "Note for the place",
    consent: "I agree that the business may use this data only to process my waitlist request. *", validation: "Fill in the service, first name and mobile number, and accept the terms.", sending: "Sending…", send: "Send request",
  },
  ru: {
    metaTitle: "Лист ожидания", metaDescription: "Оставьте запрос в листе ожидания — если нужное время освободится, команда это увидит.",
    back: "← Вернуться к записи", eyebrow: "Лист ожидания · запрос", title: "Оставайтесь в листе ожидания.", lede: "Если желаемое время освободится, ваш запрос поможет команде увидеть приоритеты. Это не подтверждённая запись, и уведомления пока не отправляются автоматически.",
    formAria: "Форма листа ожидания", loading: "Загрузка данных…", unavailable: "Лист ожидания этого филиала сейчас недоступен.", goBack: "Вернитесь на страницу записи.", bookingPage: "Страница записи",
    received: "Запрос принят", receivedText: "Желаемое время добавлено в лист ожидания. Это не подтверждённая запись, и автоматическое уведомление не отправляется.", backToBooking: "Вернуться на страницу записи",
    yourVisit: "Желаемый визит", required: "* обязательно", dateHint: "Выберите дату в календаре. Прошедшие дни и уже прошедшие часы сегодняшнего дня недоступны.",
    step1: "Услуга и время", service: "Услуга", chooseService: "Выберите услугу", specialist: "Специалист", anyStaff: "Любой свободный специалист", wantedDate: "Желаемая дата", wantedTime: "Желаемое время (необязательно)", selectedService: "Выбранная услуга: ",
    step2: "Ваши данные", firstName: "Имя", lastName: "Фамилия", phone: "Номер мобильного телефона", phoneHint: "Формат: 5XX XX XX XX или +995 5XX XX XX XX.", phonePlaceholder: "напр. 555 12 34 56", email: "Эл. почта", note: "Комментарий для заведения",
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
    <main id="main-content" tabIndex={-1}>
      <section className="cw-desk pb-12 pt-6 sm:pb-16 sm:pt-8" aria-labelledby="waitlist-title">
        <div className="cw-container max-w-3xl">
          <Link href={`/book/${slug}`} className="cw-navlink -ml-2 inline-flex min-h-11 items-center">{text.back}</Link>
          <p className="cw-caption mt-6">{text.eyebrow}</p>
          <h1 id="waitlist-title" className="cw-display mt-3 text-[clamp(1.95rem,4.6vw,3.4rem)]">{text.title}</h1>
          <p className="cw-lede mt-4">{text.lede}</p>
        </div>
      </section>

      <section className="py-10 sm:py-14" aria-label={text.formAria}>
        <div className="cw-container max-w-3xl">
          {catalog.isLoading ? <div className="h-48 animate-pulse rounded-[4px] border-[1.5px] border-[var(--cw-rule)] bg-white p-8" role="status">{text.loading}</div> : null}
          {catalog.isError || catalog.data === null ? <div className="cw-notice" role="alert">
            <p className="font-extrabold">{text.unavailable}</p>
            <p className="mt-2 text-sm text-[var(--cw-ink-soft)]">{text.goBack}</p>
            <Link href={`/book/${slug}`} className="cw-btn cw-btn-line mt-4 min-h-11">{text.bookingPage}</Link>
          </div> : null}

          {catalog.data && submitted ? <div role="status" aria-live="polite" className="cw-ledger">
            <div className="cw-ledger-head" style={cssVars({ "--ledger-bg": "var(--cw-paper)", "--ledger-ink": "var(--cw-ink)" })}>
              <span className="flex items-center gap-2 text-lg font-extrabold [font-stretch:85%]"><CheckCircle2 className="size-5 text-[var(--cw-stamp)]" aria-hidden="true" />{text.received}</span>
            </div>
            <div className="p-6 sm:p-8">
              <p className="max-w-lg leading-7 text-[var(--cw-ink-soft)]">{text.receivedText}</p>
              <Link href={`/book/${slug}`} className="cw-btn cw-btn-stamp mt-5">{text.backToBooking}</Link>
            </div>
          </div> : null}

          {catalog.data && !submitted ? <form data-conversion-event="BOOKING_WAITLIST_SUBMIT" className="cw-ledger" onSubmit={submit}>
            <div className="cw-ledger-head" style={cssVars({ "--ledger-bg": "var(--cw-paper)", "--ledger-ink": "var(--cw-ink)" })}>
              <span className="text-lg font-extrabold [font-stretch:85%]">{text.yourVisit}</span>
              <span className="cw-num text-xs">{text.required}</span>
            </div>
            <div className="grid gap-6 p-4 sm:p-6">
              <p className="text-sm leading-6 text-[var(--cw-ink-soft)]">{text.dateHint}</p>

              <fieldset className="grid gap-4">
                <legend className="cw-form-step mb-3"><span className="cw-num grid size-9 place-items-center rounded-[3px] border-[1.5px] border-[var(--cw-ink)] text-sm font-semibold">1</span><span className="text-lg font-extrabold [font-stretch:85%]">{text.step1}</span></legend>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label={text.service} required>
                    <Select value={serviceId} onValueChange={value => { setServiceId(value); setStaffProfileId("ANY"); }}>
                      <SelectTrigger><SelectValue placeholder={text.chooseService} /></SelectTrigger>
                      <SelectContent>{catalog.data.catalog.map(({ service }) => <SelectItem key={service.id} value={service.id}>{service.nameKa}</SelectItem>)}</SelectContent>
                    </Select>
                  </Field>
                  <Field label={text.specialist}>
                    <Select value={staffProfileId} onValueChange={setStaffProfileId}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
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
                {selectedService ? <p className="flex items-center gap-2 rounded-[3px] border border-[var(--cw-rule)] bg-[var(--cw-paper)] p-3 text-sm text-[var(--cw-ink-soft)]"><CalendarHeart className="size-4 shrink-0" aria-hidden="true" />{text.selectedService}<span className="font-extrabold text-[var(--cw-ink)]">{selectedService.nameKa}</span></p> : null}
              </fieldset>

              <fieldset className="grid gap-4 border-t-[1.5px] border-[var(--cw-ink)] pt-6">
                <legend className="cw-form-step mb-3"><span className="cw-num grid size-9 place-items-center rounded-[3px] border-[1.5px] border-[var(--cw-ink)] text-sm font-semibold">2</span><span className="text-lg font-extrabold [font-stretch:85%]">{text.step2}</span></legend>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label={text.firstName} required><input value={firstName} onChange={event => setFirstName(event.target.value)} autoComplete="given-name" required /></Field>
                  <Field label={text.lastName}><input value={lastName} onChange={event => setLastName(event.target.value)} autoComplete="family-name" /></Field>
                  <Field label={text.phone} required hint={text.phoneHint} hintId="waitlist-phone-help">
                    <input value={phone} onChange={event => setPhone(event.target.value)} autoComplete="tel" inputMode="tel" type="tel" placeholder={text.phonePlaceholder} aria-describedby="waitlist-phone-help" required />
                  </Field>
                  <Field label={text.email}><input value={email} onChange={event => setEmail(event.target.value)} autoComplete="email" type="email" /></Field>
                </div>
                <Field label={text.note}><textarea value={note} onChange={event => setNote(event.target.value)} /></Field>
                <label className="cw-check"><Checkbox checked={accepted} onCheckedChange={value => setAccepted(value === true)} /><span>{text.consent}</span></label>
              </fieldset>

              {error ? <p role="alert" className="cw-notice cw-notice-error text-sm">{error}</p> : null}
              <button type="submit" className="cw-btn cw-btn-stamp w-full" disabled={join.isPending}>{join.isPending ? text.sending : text.send}</button>
            </div>
          </form> : null}
        </div>
      </section>
    </main>
    <CatalogFooter />
  </div>;
}

function Field({ label, children, required, hint, hintId }: { label: string; children: React.ReactNode; required?: boolean; hint?: string; hintId?: string }) {
  return <label className="cw-field">
    <span className="cw-caption">{label}{required ? <span aria-hidden="true"> *</span> : null}</span>
    {children}
    {hint ? <span id={hintId} className="cw-field-hint">{hint}</span> : null}
  </label>;
}
