import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { downloadBookingCalendar } from "@/lib/bookingCalendar";
import { formatGelTetri, formatKaDateTime } from "@/lib/presentation";
import { trpc } from "@/lib/trpc";
import { PublicLanguageSelector } from "@/components/public/PublicPrimitives";
import { usePublicLocale } from "@/contexts/PublicLocaleContext";
import { dateKeyInTimeZone } from "@shared/timezones";
import { CalendarClock, CalendarPlus, Check, CheckCircle2, ChevronLeft, ChevronRight, CircleAlert, Clock3, Mail, MapPin, Phone, RefreshCw, ShieldCheck, Sparkles, UserRound } from "lucide-react";
import React, { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Link, useRoute } from "wouter";

const bookingUi = {
  ka: { steps: ["სერვისი", "სპეციალისტი", "თარიღი და დრო", "თქვენი მონაცემები"], back: "ფილიალების სია", online: "ონლაინ ჩაწერა · 4 ნაბიჯი", secure: "დაცული მოთხოვნა", title: "დაჯავშნეთ თქვენი მშვიდი დრო.", lead: "აირჩიეთ სერვისი და დაგეგმეთ ვიზიტი რამდენიმე მარტივ ნაბიჯში.", progress: "ჯავშნის პროგრესი", loading: "ჩაწერის კატალოგი იტვირთება…", unavailable: "ჩაწერის მონაცემები დროებით მიუწვდომელია. შეამოწმეთ კავშირი და სცადეთ მოგვიანებით.", inactive: "ეს ჩაწერის ბმული აღარ არის აქტიური", inactiveLead: "ფილიალი შესაძლოა გათიშულია ან ბმული არასწორია. დაბრუნდით ფილიალების სიაში და აირჩიეთ აქტიური ფილიალი.", continue: "გაგრძელება", submit: "ჯავშნის გაგზავნა", submitting: "იგზავნება…", step: "ნაბიჯი", choice: "თქვენი არჩევანი", summary: "შეჯამება განახლდება თითოეულ ნაბიჯზე.", service: "სერვისი", specialist: "სპეციალისტი", time: "დრო", pending: "ჯერ არ არის არჩეული", selectSpecialist: "შემდეგ აირჩიეთ სპეციალისტი", selectTime: "შემდეგ აირჩიეთ თქვენთვის სასურველი დრო", previous: "წინა ნაბიჯი", protected: "დაცული ონლაინ მოთხოვნა.", protectedLead: "არჩევანი გადამოწმდება ხელმისაწვდომობასთან, ხოლო საბოლოო დადასტურებას მიიღებთ სალონისგან.", received: "ჯავშანი მიღებულია!", receivedLead: "ჯავშანი ელოდება სალონის დადასტურებას. საჭიროების შემთხვევაში შეინახეთ დადასტურების კოდი.", assigned: "თქვენი სპეციალისტი:", code: "ჯავშნის დადასტურების კოდი", calendar: "კალენდარში დამატება", manage: "ჯავშნის მართვა", returnToList: "ფილიალების სიაში დაბრუნება" },
  en: { steps: ["Service", "Specialist", "Date & time", "Your details"], back: "All locations", online: "Online booking · 4 steps", secure: "Secure request", title: "Book a time that works for you.", lead: "Choose a service and plan your visit in a few simple steps.", progress: "Booking progress", loading: "Loading booking catalog…", unavailable: "Booking data is temporarily unavailable. Check your connection and try again.", inactive: "This booking link is no longer active", inactiveLead: "The location may be inactive or the link may be incorrect. Return to the locations list and choose an active salon.", continue: "Continue", submit: "Send booking request", submitting: "Sending…", step: "Step", choice: "Your selection", summary: "This summary updates at each step.", service: "Service", specialist: "Specialist", time: "Time", pending: "Not selected yet", selectSpecialist: "Choose a specialist next", selectTime: "Choose your preferred time next", previous: "Previous step", protected: "Secure online request.", protectedLead: "Your selection is checked against availability, and the salon will provide final confirmation.", received: "Booking request received!", receivedLead: "Your booking is awaiting salon confirmation. Save the confirmation code if needed.", assigned: "Your specialist:", code: "Booking confirmation code", calendar: "Add to calendar", manage: "Manage booking", returnToList: "Return to locations" },
  ru: { steps: ["Услуга", "Специалист", "Дата и время", "Ваши данные"], back: "Все салоны", online: "Онлайн-запись · 4 шага", secure: "Защищённая заявка", title: "Выберите удобное время.", lead: "Выберите услугу и запланируйте визит за несколько простых шагов.", progress: "Ход записи", loading: "Загрузка каталога записи…", unavailable: "Данные записи временно недоступны. Проверьте подключение и попробуйте снова.", inactive: "Эта ссылка для записи больше не активна", inactiveLead: "Филиал может быть неактивен или ссылка неверна. Вернитесь к списку салонов и выберите активный.", continue: "Продолжить", submit: "Отправить заявку", submitting: "Отправка…", step: "Шаг", choice: "Ваш выбор", summary: "Сводка обновляется на каждом шаге.", service: "Услуга", specialist: "Специалист", time: "Время", pending: "Пока не выбрано", selectSpecialist: "Далее выберите специалиста", selectTime: "Далее выберите удобное время", previous: "Предыдущий шаг", protected: "Защищённая онлайн-заявка.", protectedLead: "Ваш выбор проверяется по доступности, а окончательное подтверждение даст салон.", received: "Заявка на запись принята!", receivedLead: "Запись ожидает подтверждения салоном. При необходимости сохраните код подтверждения.", assigned: "Ваш специалист:", code: "Код подтверждения", calendar: "Добавить в календарь", manage: "Управление записью", returnToList: "Вернуться к салонам" }
} as const;
const ANY_AVAILABLE = "ANY_AVAILABLE";
const WEEKDAY_SHORT = ["ორშ", "სამ", "ოთხ", "ხუთ", "პარ", "შაბ", "კვ"];
const MONTH_SHORT = ["იან", "თებ", "მარ", "აპრ", "მაი", "ივნ", "ივლ", "აგვ", "სექ", "ოქტ", "ნოე", "დეკ"];
function addDaysKey(key: string, days: number) { const [y, m, d] = key.split("-").map(Number) as [number, number, number]; return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10); }
function schemaWeekdayOf(key: string) { const [y, m, d] = key.split("-").map(Number) as [number, number, number]; return (new Date(Date.UTC(y, m - 1, d)).getUTCDay() + 6) % 7; }
function dayNumberOf(key: string) { return Number(key.split("-")[2]); }
function monthOf(key: string) { return Number(key.split("-")[1]); }

export type BookingTeamMember = { id: string; name: string; specialty: string | null; bio: string | null; eligibleServiceIds: string[] };
type BookingService = { id: string; nameKa: string; defaultDurationMinutes: number; priceTetri: number };
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

export function getBookingValidationIssue(input: { step: number; serviceId?: string; staffProfileId?: string; startsAt: Date | null; available?: boolean; firstName: string; phone: string; termsAccepted: boolean }): BookingValidationIssue | null {
  if (input.step === 0 && !input.serviceId) return { kind: "service", title: "ჯერ აირჩიეთ სერვისი", description: "მონიშნეთ თქვენთვის სასურველი მომსახურება, შემდეგ კი გადადით სპეციალისტის არჩევაზე." };
  if (input.step === 1 && !input.staffProfileId) return { kind: "staff", title: "ჯერ აირჩიეთ სპეციალისტი", description: "შეგიძლიათ მონიშნოთ კონკრეტული სპეციალისტი ან აირჩიოთ ნებისმიერი თავისუფალი სპეციალისტი." };
  if (input.step === 2 && !input.startsAt) return { kind: "time", title: "დაამატეთ სასურველი თარიღი და დრო", description: "დროის არჩევის შემდეგ SalonFlow ავტომატურად გადაამოწმებს ხელმისაწვდომობას." };
  if (input.step === 2 && input.available !== true) return { kind: "time", title: "ეს დრო ჯერ არ დადასტურებულა", description: "აირჩიეთ სხვა დრო ან დაელოდეთ ხელმისაწვდომობის შემოწმების დასრულებას." };
  if (input.step === 3 && !input.firstName.trim()) return { kind: "contact", title: "მიუთითეთ სახელი", description: "სახელი საჭიროა ჯავშნის მოთხოვნის დასადასტურებლად." };
  if (input.step === 3 && !input.phone.trim()) return { kind: "contact", title: "მიუთითეთ მობილურის ნომერი", description: "მობილურის ნომერი საჭიროა სალონთან თქვენი მოთხოვნის დასაკავშირებლად." };
  if (input.step === 3 && !input.termsAccepted) return { kind: "contact", title: "დაადასტურეთ ჯავშნის პირობები", description: "გაგრძელებამდე საჭიროა მონაცემების დამუშავებაზე თანხმობა." };
  return null;
}

export default function BookingFlow() {
  const [, params] = useRoute("/book/:slug");
  const { locale } = usePublicLocale();
  const ui = bookingUi[locale];
  const slug = params?.slug ?? "";
  const catalog = trpc.public.bookingCatalog.useQuery(slug, { enabled: Boolean(slug) });
  const [step, setStep] = useState(0);
  const [serviceIds, setServiceIds] = useState<string[]>([]);
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
  const errorRef = useRef<HTMLDivElement>(null);
  const startsAt = useMemo(() => (dateTime ? new Date(dateTime) : null), [dateTime]);
  const serviceId = serviceIds[0];
  const isMultiService = serviceIds.length > 1;
  const availabilityInput = useMemo(() => ({ slug, serviceId: serviceId ?? "pending-service", staffProfileId: staffProfileId ?? "pending-specialist", startsAt: startsAt ?? new Date(0) }), [slug, serviceId, staffProfileId, startsAt]);
  const multiAvailabilityInput = useMemo(() => ({ slug, serviceIds: isMultiService ? serviceIds : ["pending_service_001", "pending_service_002"], staffProfileId: staffProfileId ?? "pending-specialist", startsAt: startsAt ?? new Date(0) }), [slug, serviceIds, isMultiService, staffProfileId, startsAt]);
  const singleAvailability = trpc.public.checkAvailability.useQuery(availabilityInput, { enabled: Boolean(serviceId && staffProfileId && startsAt && step >= 2 && !isMultiService) });
  const multiAvailability = trpc.public.checkMultiAvailability.useQuery(multiAvailabilityInput, { enabled: Boolean(isMultiService && staffProfileId && startsAt && step >= 2) });
  const availability = isMultiService ? multiAvailability : singleAvailability;
  const commitBooking = trpc.public.commitBooking.useMutation({
    onSuccess: result => {
      setInteractionError(null);
      setConfirmation({ token: result.confirmationToken, assignedStaffName: result.assignedStaffName, endsAt: result.endsAt });
    },
    onError: () => setInteractionError({ kind: "submit", title: "ჯავშნის მოთხოვნა ვერ გაიგზავნა", description: "მონაცემები არ დაგვიკარგავს. შეამოწმეთ კავშირი და სცადეთ ხელახლა." }),
  });
  const commitMultiBooking = trpc.public.commitMultiBooking.useMutation({
    onSuccess: result => {
      setInteractionError(null);
      setConfirmation({ token: result.confirmationToken, assignedStaffName: result.assignedStaffName, endsAt: result.endsAt });
    },
    onError: () => setInteractionError({ kind: "submit", title: "ჯავშნის მოთხოვნა ვერ გაიგზავნა", description: "მონაცემები არ დაგვიკარგავს. შეამოწმეთ კავშირი და სცადეთ ხელახლა." }),
  });
  const selectedServices = catalog.data?.catalog.filter(item => serviceIds.includes(item.service.id)).map(item => item.service) ?? [];
  const selectedService = selectedServices[0];
  const selectedServiceSummary = selectedServices.length ? { ...selectedServices[0]!, nameKa: selectedServices.map(service => service.nameKa).join(" + "), defaultDurationMinutes: selectedServices.reduce((sum, service) => sum + service.defaultDurationMinutes, 0), priceTetri: selectedServices.reduce((sum, service) => sum + service.priceTetri, 0) } : undefined;
  const selectedStaff = catalog.data?.team.find(member => member.id === staffProfileId);
  const eligibleTeam = getEligibleTeam(catalog.data?.team ?? [], serviceIds);

  useEffect(() => {
    if (!interactionError) return;
    const frame = requestAnimationFrame(() => errorRef.current?.focus());
    return () => cancelAnimationFrame(frame);
  }, [interactionError]);

  const clearIssue = (kind?: BookingIssueKind) => setInteractionError(current => !kind || current?.kind === kind ? null : current);
  const selectService = (value: string) => { setServiceIds(current => current.includes(value) ? (current.length > 1 ? current.filter(item => item !== value) : current) : [...current, value]); setStaffProfileId(undefined); clearIssue("service"); };
  const selectStaff = (value: string) => { setStaffProfileId(value); clearIssue("staff"); };
  const selectDateTime = (value: string) => { setDateTime(value); clearIssue("time"); };
  const currentValidation = () => getBookingValidationIssue({ step, serviceId, staffProfileId, startsAt, available: availability.data?.available, firstName, phone, termsAccepted });
  const submitBooking = () => {
    if (!serviceId || !staffProfileId || !startsAt) return;
    const sharedPayload = { slug, staffProfileId, startsAt, firstName, lastName: lastName || undefined, phone, email: email || undefined, customerNote: customerNote || undefined, bookingTermsConsent: true as const, idempotencyKey };
    if (isMultiService) commitMultiBooking.mutate({ ...sharedPayload, serviceIds });
    else commitBooking.mutate({ ...sharedPayload, serviceId });
  };
  const advanceBooking = () => {
    const issue = currentValidation();
    if (issue) { setInteractionError(issue); return; }
    setInteractionError(null);
    if (step < 3) setStep(current => Math.min(current + 1, 3));
    else submitBooking();
  };
  const stepBack = () => { setInteractionError(null); setStep(current => Math.max(0, current - 1)); };

  return <main className="sf-public-page sf-booking-flow px-4 py-6 pb-28 sm:px-6 sm:py-10 lg:pb-10"><div className="mx-auto max-w-6xl">
    <div className="flex items-center justify-between gap-3"><Link href="/book" className="sf-interactive inline-flex items-center gap-2 rounded-lg px-1 py-2 text-sm font-semibold text-[var(--sf-muted)] hover:text-[var(--sf-ink)]"><ChevronLeft className="h-4 w-4" /> {ui.back}</Link><PublicLanguageSelector /></div>
    <header className="sf-grain relative mt-5 overflow-hidden rounded-[var(--sf-radius-hero)] px-6 py-7 text-white shadow-[var(--sf-glow-brand)] sm:px-8 sm:py-9" style={{ background: "var(--sf-gradient-brand)" }}><span className="sf-blob" style={{ width: "20rem", height: "20rem", top: "-7rem", right: "-3rem", background: "rgba(255,255,255,0.3)", opacity: 0.55, animation: "sf-blob-morph 16s ease-in-out infinite" }} aria-hidden="true" /><div className="relative"><div className="flex flex-wrap items-center justify-between gap-3"><p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-white/85"><Sparkles className="h-3.5 w-3.5" aria-hidden="true" /> {ui.online}</p><span className="rounded-full border border-white/30 bg-white/15 px-3 py-1.5 text-xs font-semibold text-white/90">{ui.secure}</span></div><h1 className="sf-display mt-5 max-w-2xl text-4xl font-semibold leading-tight sm:text-5xl">{ui.title}</h1>{catalog.data ? <p className="mt-3 text-sm text-white/80">{catalog.data.location.name} · {catalog.data.location.timezone}</p> : <p className="mt-3 text-sm text-white/80">{ui.lead}</p>}<p className="mt-5 inline-flex max-w-xl items-start gap-2 rounded-xl border border-white/15 bg-black/10 px-3 py-2 text-xs leading-5 text-white/85"><ShieldCheck className="mt-0.5 size-4 shrink-0" aria-hidden="true" />{ui.protectedLead}</p></div></header>
    <ol className="sf-booking-progress mt-5 grid gap-2 sm:grid-cols-4" aria-label={ui.progress}>{ui.steps.map((label, index) => <li key={label} aria-current={index === step ? "step" : undefined} className={`sf-booking-progress__step flex items-center gap-2 rounded-[var(--sf-radius-control)] border px-3 py-3 text-sm ${index === step ? "is-current border-[var(--sf-terracotta)] bg-[color-mix(in_srgb,var(--sf-terracotta)_9%,transparent)] font-semibold text-[var(--sf-terracotta-strong)]" : index < step ? "is-complete border-[color-mix(in_srgb,var(--sf-jade)_28%,transparent)] bg-[color-mix(in_srgb,var(--sf-jade)_6%,transparent)] text-[var(--sf-jade)]" : "border-[var(--sf-line)] bg-[var(--sf-surface)] text-[var(--sf-muted)]"}`}><span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-current/25 text-[0.65rem]">{index < step ? <Check className="h-3 w-3" aria-hidden="true" /> : `0${index + 1}`}</span>{label}</li>)}</ol>
    {interactionError ? <BookingErrorNotice issue={interactionError} errorRef={errorRef} onRetry={interactionError.kind === "submit" ? submitBooking : undefined} /> : null}
    {catalog.isLoading ? <Card className="mt-8 border-border"><CardContent className="sf-skeleton p-6 text-sm text-muted-foreground" role="status" aria-live="polite">ჩაწერის კატალოგი იტვირთება…</CardContent></Card> : null}
    {catalog.isError ? <Alert>ჩაწერის მონაცემები დროებით მიუწვდომელია. შეამოწმეთ კავშირი და სცადეთ მოგვიანებით.</Alert> : null}
    {catalog.data === null ? <Card className="mt-8 border-[var(--sf-ink)]/10"><CardHeader><CardTitle>ეს ჩაწერის ბმული აღარ არის აქტიური</CardTitle></CardHeader><CardContent className="text-sm leading-6 text-muted-foreground">ფილიალი შესაძლოა გათიშულია ან ბმული არასწორია. დაბრუნდით ფილიალების სიაში და აირჩიეთ აქტიური ფილიალი.</CardContent></Card> : null}
    {catalog.data && confirmation && selectedServiceSummary && startsAt ? <BookingConfirmation confirmationToken={confirmation.token} assignedStaffName={confirmation.assignedStaffName} serviceName={selectedServiceSummary.nameKa} startsAt={startsAt} endsAt={confirmation.endsAt} locationName={catalog.data.location.name} locationAddress={catalog.data.location.address} /> : null}
    {catalog.data && !confirmation ? <div className="mt-7 grid gap-5 lg:grid-cols-[minmax(0,1fr)_21rem]"><section className="space-y-4"><LocationContext location={catalog.data.location} /><div key={step} className="sf-booking-step-pane">{step === 0 ? <ServiceStep catalog={catalog.data.catalog} selectedIds={serviceIds} onSelect={selectService} error={interactionError?.kind === "service" ? interactionError.description : undefined} /> : null}{step === 1 ? <StaffStep team={eligibleTeam} selectedId={staffProfileId} onSelect={selectStaff} error={interactionError?.kind === "staff" ? interactionError.description : undefined} /> : null}{step === 2 ? <TimeStep slug={slug} serviceId={serviceId} serviceIds={serviceIds} multiService={isMultiService} staffProfileId={staffProfileId} workingHours={catalog.data.location.workingHours} timezone={catalog.data.location.timezone} dateTime={dateTime} onChange={selectDateTime} availability={availability} error={interactionError?.kind === "time" ? interactionError.description : undefined} /> : null}{step === 3 ? <ContactStep firstName={firstName} lastName={lastName} phone={phone} email={email} customerNote={customerNote} termsAccepted={termsAccepted} error={interactionError?.kind === "contact" ? interactionError.description : undefined} onFirstName={value => { setFirstName(value); clearIssue("contact"); }} onLastName={setLastName} onPhone={value => { setPhone(value); clearIssue("contact"); }} onEmail={setEmail} onNote={setCustomerNote} onTerms={value => { setTermsAccepted(value); clearIssue("contact"); }} /> : null}</div></section><aside className="lg:sticky lg:top-6 lg:self-start"><BookingSummary step={step} service={selectedServiceSummary} staff={selectedStaff} staffLabel={staffProfileId === ANY_AVAILABLE ? (availability.data?.staffName ? `${availability.data.staffName} (ავტომატურად შეირჩა)` : "ნებისმიერი თავისუფალი სპეციალისტი") : undefined} startsAt={startsAt} available={availability.data?.available === true} onBack={stepBack} onContinue={advanceBooking} submitting={commitBooking.isPending || commitMultiBooking.isPending} /></aside><MobileBookingAction step={step} submitting={commitBooking.isPending || commitMultiBooking.isPending} onContinue={advanceBooking} /></div> : null}
  </div></main>;
}

export function LocationContext({ location }: { location: BookingLocation }) {
  return <Card className="border-[var(--sf-ink)]/10 bg-white/80"><CardHeader className="pb-3"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--sf-accent-strong)]">ფილიალი</p><CardTitle className="mt-2">{location.name}</CardTitle>{location.publicDescription ? <p className="mt-2 text-sm leading-6 text-muted-foreground">{location.publicDescription}</p> : null}</CardHeader><CardContent className="space-y-3 text-sm text-muted-foreground"><p className="flex items-center gap-2"><MapPin className="h-4 w-4 shrink-0 text-[var(--sf-accent-strong)]" aria-hidden="true" />{location.address || location.timezone}</p>{location.workingHours.length ? <div className="rounded-xl bg-[var(--sf-surface-hover)] p-3"><p className="flex items-center gap-2 font-medium text-[var(--sf-ink)]"><CalendarClock className="h-4 w-4 text-[var(--sf-accent-strong)]" aria-hidden="true" />ხელმისაწვდომი სპეციალისტების საათები</p><div className="mt-2 grid gap-1 text-xs">{location.workingHours.map(rule => <p key={rule.weekday}>{weekdayName(rule.weekday)} · {rule.startLocalTime}–{rule.endLocalTime}</p>)}</div></div> : <p className="rounded-xl border border-dashed p-3 text-xs leading-5">სამუშაო საათები ჯერ არ არის მითითებული. დროის არჩევისას ხელმისაწვდომობა მაინც ავტომატურად შემოწმდება.</p>}{location.phone ? <a href={`tel:${location.phone}`} className="flex items-center gap-2 font-medium text-[var(--sf-ink)] hover:text-[var(--sf-accent-strong)]"><Phone className="h-4 w-4 text-[var(--sf-accent-strong)]" aria-hidden="true" />{location.phone}</a> : null}{location.email ? <a href={`mailto:${location.email}`} className="flex items-center gap-2 font-medium text-[var(--sf-ink)] hover:text-[var(--sf-accent-strong)]"><Mail className="h-4 w-4 text-[var(--sf-accent-strong)]" aria-hidden="true" />{location.email}</a> : null}</CardContent></Card>;
}

export function weekdayName(day: number) { return ["ორშაბათი", "სამშაბათი", "ოთხშაბათი", "ხუთშაბათი", "პარასკევი", "შაბათი", "კვირა"][day] ?? "დღე"; }

function ServiceStep({ catalog, selectedIds, onSelect, error }: { catalog: Array<{ service: BookingService; category: { nameKa: string } }>; selectedIds: string[]; onSelect: (id: string) => void; error?: string }) {
  return <Card className="border-[var(--sf-ink)]/10"><CardHeader><p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--sf-accent-strong)]">ნაბიჯი 01</p><CardTitle className="mt-2">აირჩიეთ სერვისები</CardTitle><p className="mt-1 text-sm leading-6 text-muted-foreground">შეგიძლიათ დაამატოთ რამდენიმე სერვისი ერთ ვიზიტში. დრო და ფასი საბოლოოდ შეიკრიბება, ხოლო გამოჩნდება მხოლოდ ყველა არჩეული სერვისისთვის eligible სპეციალისტი.</p></CardHeader><CardContent className="space-y-3">{error ? <InlineIssue>{error}</InlineIssue> : null}{catalog.length ? catalog.map(({ service, category }) => { const selected = selectedIds.includes(service.id); return <button key={service.id} type="button" aria-pressed={selected} onClick={() => onSelect(service.id)} className={`sf-booking-choice w-full rounded-2xl border p-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--sf-accent-strong)] ${selected ? "sf-booking-choice--selected border-[var(--sf-accent-strong)] bg-[var(--sf-accent-strong)]/5 shadow-sm" : "border-[var(--sf-ink)]/10 bg-white hover:border-[var(--sf-accent-strong)]/60 hover:shadow-sm"}`}><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-semibold text-[var(--sf-accent-strong)]">{category.nameKa}</p><p className="mt-1 text-base font-semibold">{service.nameKa}</p></div>{selected ? <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[var(--sf-accent-strong)] text-white"><Check className="h-3.5 w-3.5" aria-hidden="true" /></span> : null}</div><div className="mt-4 flex flex-wrap gap-2 text-xs font-medium text-[var(--sf-muted)]"><span className="rounded-full bg-[var(--sf-surface-subtle)] px-2.5 py-1"><Clock3 className="mr-1 inline h-3.5 w-3.5 text-[var(--sf-accent-strong)]" aria-hidden="true" />{service.defaultDurationMinutes} წუთი</span><span className="rounded-full bg-[var(--sf-surface-subtle)] px-2.5 py-1">{formatGel(service.priceTetri)}</span></div></button>; }) : <p className="rounded-xl border border-dashed border-[var(--sf-ink)]/15 bg-white/60 p-4 text-sm leading-6 text-muted-foreground">ამ ფილიალისთვის ჯერ არ არის ხელმისაწვდომი ონლაინ სერვისები.</p>}</CardContent></Card>;
}

export function StaffStep({ team, selectedId, onSelect, error }: { team: BookingTeamMember[]; selectedId?: string; onSelect: (id: string) => void; error?: string }) {
  return <Card className="border-[var(--sf-ink)]/10"><CardHeader><p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--sf-accent-strong)]">ნაბიჯი 02</p><CardTitle className="mt-2">აირჩიეთ სპეციალისტი</CardTitle><p className="mt-1 text-sm leading-6 text-muted-foreground">ნაჩვენებია მხოლოდ ამ სერვისისთვის ხელმისაწვდომი სპეციალისტები. სურვილის შემთხვევაში სისტემა თავისუფალ სპეციალისტს თავად შეარჩევს.</p></CardHeader><CardContent className="space-y-3">{error ? <InlineIssue>{error}</InlineIssue> : null}{team.length ? <><button type="button" aria-pressed={selectedId === ANY_AVAILABLE} onClick={() => onSelect(ANY_AVAILABLE)} className={`sf-booking-choice w-full rounded-2xl border p-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--sf-accent-strong)] ${selectedId === ANY_AVAILABLE ? "sf-booking-choice--selected border-[var(--sf-jade)] bg-[var(--sf-jade)]/5 shadow-sm" : "border-[var(--sf-jade)]/30 bg-white hover:border-[var(--sf-jade)] hover:shadow-sm"}`}><div className="flex items-start justify-between gap-3"><div><p className="font-semibold">ნებისმიერი თავისუფალი სპეციალისტი</p><p className="mt-1 text-sm text-[var(--sf-muted)]">ხელმისაწვდომობა საბოლოოდ გადამოწმდება დროის არჩევისას.</p></div>{selectedId === ANY_AVAILABLE ? <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[var(--sf-jade)] text-white"><Check className="h-3.5 w-3.5" aria-hidden="true" /></span> : null}</div></button>{team.map(member => <button key={member.id} type="button" aria-pressed={member.id === selectedId} onClick={() => onSelect(member.id)} className={`sf-booking-choice w-full rounded-2xl border p-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--sf-accent-strong)] ${member.id === selectedId ? "sf-booking-choice--selected border-[var(--sf-accent-strong)] bg-[var(--sf-accent-strong)]/5 shadow-sm" : "border-[var(--sf-ink)]/10 bg-white hover:border-[var(--sf-accent-strong)]/60 hover:shadow-sm"}`}><div className="flex items-start justify-between gap-3"><div><p className="font-semibold">{member.name}</p>{member.specialty ? <p className="mt-1 text-sm text-[var(--sf-muted)]">{member.specialty}</p> : null}</div>{member.id === selectedId ? <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[var(--sf-accent-strong)] text-white"><Check className="h-3.5 w-3.5" aria-hidden="true" /></span> : null}</div><p className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-[var(--sf-jade)]"><CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" /> ხელმისაწვდომია ამ სერვისისთვის</p>{member.bio ? <p className="mt-2 text-xs leading-5 text-[var(--sf-muted)]">{member.bio}</p> : null}</button>)}</> : <p className="rounded-xl border border-dashed border-[var(--sf-ink)]/15 bg-white/60 p-4 text-sm leading-6 text-[var(--sf-muted)]">ამ სერვისისთვის ამ ფილიალში აქტიური ონლაინ სპეციალისტი ჯერ არ არის. გთხოვთ აირჩიოთ სხვა სერვისი ან დაუკავშირდეთ სალონს.</p>}</CardContent></Card>;
}

function TimeStep({ slug, serviceId, serviceIds, multiService, staffProfileId, workingHours, timezone, dateTime, onChange, availability, error }: { slug: string; serviceId?: string; serviceIds: string[]; multiService: boolean; staffProfileId?: string; workingHours: Array<{ weekday: number }>; timezone: string; dateTime: string; onChange: (value: string) => void; availability: { isLoading: boolean; isError: boolean; data?: { available: boolean; reason?: string } }; error?: string }) {
  const openWeekdays = useMemo(() => new Set(workingHours.map(hour => hour.weekday)), [workingHours]);
  const today = useMemo(() => dateKeyInTimeZone(new Date(), timezone), [timezone]);
  const days = useMemo(() => Array.from({ length: 14 }, (_, index) => addDaysKey(today, index)), [today]);
  const firstOpen = useMemo(() => days.find(day => openWeekdays.has(schemaWeekdayOf(day))) ?? today, [days, openWeekdays, today]);
  const [selectedDate, setSelectedDate] = useState(firstOpen);
  useEffect(() => { setSelectedDate(firstOpen); }, [firstOpen]);
  const [pageStart, setPageStart] = useState(0);
  const visibleDays = days.slice(pageStart, pageStart + 7);

  const dayIsOpen = openWeekdays.has(schemaWeekdayOf(selectedDate));
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

  const pickDate = (day: string) => { setSelectedDate(day); if (dateTime) onChange(""); };

  return <Card className="border-[var(--sf-ink)]/10"><CardHeader><p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--sf-accent-strong)]">ნაბიჯი 03</p><CardTitle className="mt-2">აირჩიეთ თარიღი და დრო</CardTitle><p className="mt-1 text-sm leading-6 text-muted-foreground">ნაჩვენებია მხოლოდ ის საათები, რომლებიც რეალურად თავისუფალია — დაკავებული დრო არ ჩანს.</p></CardHeader><CardContent className="space-y-5">{error ? <InlineIssue>{error}</InlineIssue> : null}
    <div className="flex items-center gap-2">
      <button type="button" aria-label="წინა დღეები" disabled={pageStart === 0} onClick={() => setPageStart(value => Math.max(0, value - 7))} className="sf-interactive grid size-9 shrink-0 place-items-center rounded-full border border-[var(--sf-line)] bg-[var(--sf-surface)] text-[var(--sf-muted)] disabled:opacity-40 hover:text-[var(--sf-accent-strong)]"><ChevronLeft className="h-4 w-4" aria-hidden="true" /></button>
      <div className="grid flex-1 grid-cols-7 gap-1.5">{visibleDays.map(day => { const open = openWeekdays.has(schemaWeekdayOf(day)); const active = day === selectedDate; return <button key={day} type="button" disabled={!open} aria-pressed={active} onClick={() => pickDate(day)} className={`sf-interactive flex flex-col items-center gap-0.5 rounded-xl border px-1 py-2 text-center ${active ? "border-transparent text-white shadow-[var(--sf-glow-brand)] [background-image:var(--sf-gradient-brand)]" : open ? "border-[var(--sf-line)] bg-[var(--sf-surface)] hover:border-[color-mix(in_srgb,var(--sf-accent-strong)_45%,var(--sf-line))]" : "border-transparent bg-[var(--sf-surface-subtle)] text-[var(--sf-muted)]/50 opacity-60"}`}><span className="text-[0.62rem] font-semibold uppercase tracking-wide">{WEEKDAY_SHORT[schemaWeekdayOf(day)]}</span><span className={`sf-display text-base font-bold ${active ? "" : ""}`}>{dayNumberOf(day)}</span><span className="text-[0.58rem] font-medium opacity-80">{MONTH_SHORT[monthOf(day) - 1]}</span></button>; })}</div>
      <button type="button" aria-label="შემდეგი დღეები" disabled={pageStart + 7 >= days.length} onClick={() => setPageStart(value => Math.min(days.length - 7, value + 7))} className="sf-interactive grid size-9 shrink-0 place-items-center rounded-full border border-[var(--sf-line)] bg-[var(--sf-surface)] text-[var(--sf-muted)] disabled:opacity-40 hover:text-[var(--sf-accent-strong)]"><ChevronRight className="h-4 w-4" aria-hidden="true" /></button>
    </div>
    <div aria-live="polite" className="min-h-24">
      {!dayIsOpen ? <p className="rounded-xl border border-dashed border-[var(--sf-line)] bg-[var(--sf-surface-subtle)] p-4 text-sm leading-6 text-muted-foreground">ამ დღეს სალონი დახურულია. აირჩიეთ სხვა თარიღი.</p>
        : slotsQuery.isLoading ? <p className="flex items-center gap-2 text-sm text-muted-foreground" role="status"><span className="sf-booking-availability-dots" aria-hidden="true"><i /><i /><i /></span>თავისუფალი დრო იტვირთება…</p>
        : slotsQuery.isError ? <Alert>თავისუფალი დროის ჩატვირთვა ვერ მოხერხდა. სცადეთ ხელახლა.</Alert>
        : slots.length ? <div className="grid grid-cols-3 gap-2 sm:grid-cols-4"><>{slots.map(slot => { const active = dateTime === slot.startsAt; return <button key={slot.startsAt} type="button" aria-pressed={active} onClick={() => onChange(slot.startsAt)} className={`sf-interactive rounded-xl border py-2.5 text-sm font-semibold tabular-nums ${active ? "border-transparent text-white shadow-[var(--sf-glow-brand)] [background-image:var(--sf-gradient-brand)]" : "border-[var(--sf-line)] bg-[var(--sf-surface)] text-[var(--sf-ink)] hover:border-[color-mix(in_srgb,var(--sf-accent-strong)_45%,var(--sf-line))] hover:text-[var(--sf-accent-strong)]"}`}>{slot.label}</button>; })}</></div>
        : <div className="rounded-xl border border-dashed border-[var(--sf-line)] bg-[var(--sf-surface-subtle)] p-4 text-sm leading-6 text-muted-foreground"><p>ამ დღეს თავისუფალი დრო აღარ არის.</p><Link href={`/waitlist/${slug}?serviceId=${encodeURIComponent(serviceId ?? "")}&staffProfileId=${encodeURIComponent(staffProfileId ?? "")}&date=${encodeURIComponent(selectedDate)}`} className="mt-3 inline-flex font-semibold text-[var(--sf-terracotta-strong)] underline-offset-4 hover:underline">დამამატეთ waitlist-ში</Link></div>}
    </div>
    {dateTime && availability.isLoading ? <p className="flex items-center gap-2 text-sm text-muted-foreground" role="status"><span className="sf-booking-availability-dots" aria-hidden="true"><i /><i /><i /></span>ხელმისაწვდომობა მოწმდება…</p> : null}
    {dateTime && availability.data?.available ? <p className="flex items-center gap-2 rounded-xl bg-[color-mix(in_srgb,var(--sf-jade)_9%,transparent)] p-3 text-sm font-medium text-[var(--sf-jade)]"><CheckCircle2 className="h-4 w-4" aria-hidden="true" />ეს დრო ხელმისაწვდომია — შეგიძლიათ გააგრძელოთ.</p> : null}
    {dateTime && (availability.isError || availability.data?.available === false) ? <Alert>ეს დრო ახლახან დაიკავეს. აირჩიეთ სხვა თავისუფალი დრო.</Alert> : null}
  </CardContent></Card>;
}

function ContactStep({ firstName, lastName, phone, email, customerNote, termsAccepted, error, onFirstName, onLastName, onPhone, onEmail, onNote, onTerms }: { firstName: string; lastName: string; phone: string; email: string; customerNote: string; termsAccepted: boolean; error?: string; onFirstName: (value: string) => void; onLastName: (value: string) => void; onPhone: (value: string) => void; onEmail: (value: string) => void; onNote: (value: string) => void; onTerms: (value: boolean) => void }) {
  return <Card className="border-[var(--sf-ink)]/10"><CardHeader><p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--sf-accent-strong)]">ნაბიჯი 04</p><CardTitle className="mt-2">თქვენი მონაცემები</CardTitle><p className="mt-1 text-sm leading-6 text-muted-foreground">მონაცემები გამოიყენება მხოლოდ ამ ჯავშნის დამუშავებისა და დადასტურებისთვის.</p></CardHeader><CardContent className="space-y-4">{error ? <InlineIssue>{error}</InlineIssue> : null}<div className="grid gap-3 sm:grid-cols-2"><label className="space-y-2 text-sm font-medium" htmlFor="booking-first-name"><span>სახელი *</span><Input id="booking-first-name" value={firstName} onChange={event => onFirstName(event.target.value)} autoComplete="given-name" required aria-invalid={Boolean(error && !firstName.trim())} /></label><label className="space-y-2 text-sm font-medium" htmlFor="booking-last-name"><span>გვარი</span><Input id="booking-last-name" value={lastName} onChange={event => onLastName(event.target.value)} autoComplete="family-name" /></label></div><label className="block space-y-2 text-sm font-medium" htmlFor="booking-phone"><span>მობილურის ნომერი *</span><Input id="booking-phone" type="tel" value={phone} onChange={event => onPhone(event.target.value)} autoComplete="tel" required aria-invalid={Boolean(error && !phone.trim())} /></label><label className="block space-y-2 text-sm font-medium" htmlFor="booking-email"><span>ელფოსტა</span><Input id="booking-email" type="email" value={email} onChange={event => onEmail(event.target.value)} autoComplete="email" /></label><label className="block space-y-2 text-sm font-medium" htmlFor="booking-note"><span>კომენტარი სალონისთვის</span><Textarea id="booking-note" value={customerNote} onChange={event => onNote(event.target.value)} /></label><label className={`flex items-start gap-3 rounded-xl p-3 text-sm leading-5 text-[var(--sf-muted)] ${error && !termsAccepted ? "border border-destructive/35 bg-destructive/5" : "bg-[var(--sf-surface-hover)]"}`}><Checkbox checked={termsAccepted} onCheckedChange={value => onTerms(value === true)} aria-invalid={Boolean(error && !termsAccepted)} /><span>ვეთანხმები, რომ სალონმა ჩემი მონაცემები გამოიყენოს ამ ჯავშნის დამუშავებისა და დადასტურებისთვის. *</span></label></CardContent></Card>;
}

function BookingSummary({ step, service, staff, staffLabel, startsAt, available, onBack, onContinue, submitting }: { step: number; service?: BookingService; staff?: BookingTeamMember; staffLabel?: string; startsAt: Date | null; available: boolean; onBack: () => void; onContinue: () => void; submitting: boolean }) {
  const { locale } = usePublicLocale();
  const ui = bookingUi[locale];
  const rows = [{ label: ui.service, value: service ? `${service.nameKa} · ${formatGel(service.priceTetri)}` : ui.pending, ready: Boolean(service) }, { label: ui.specialist, value: staffLabel ?? staff?.name ?? ui.selectSpecialist, ready: Boolean(staff || staffLabel) }, { label: ui.time, value: startsAt ? formatKaDateTime(startsAt) : ui.selectTime, ready: Boolean(startsAt && available) }];
  return <div className="space-y-4"><Card className="border-[var(--sf-ink)]/10 bg-white shadow-sm"><CardHeader><div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--sf-accent-strong)]/10 text-[var(--sf-accent-strong)]"><UserRound className="h-5 w-5" aria-hidden="true" /></span><div><CardTitle>{ui.choice}</CardTitle><p className="mt-1 text-xs text-muted-foreground">{ui.summary}</p></div></div></CardHeader><CardContent className="space-y-3">{rows.map(row => <div key={row.label} className="rounded-xl border border-[var(--sf-ink)]/8 bg-[var(--sf-surface-hover)]/65 p-3"><p className="text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-[var(--sf-muted)]">{row.label}</p><p className={`mt-1 text-sm leading-5 ${row.ready ? "font-medium text-[var(--sf-ink)]" : "text-[var(--sf-muted)]"}`}>{row.value}</p></div>)}{step > 0 ? <Button variant="outline" className="w-full border-[var(--sf-ink)]/15" onClick={onBack}>{ui.previous}</Button> : null}<Button className="w-full bg-[var(--sf-accent-strong)] shadow-sm hover:bg-[var(--sf-accent)]" disabled={submitting} onClick={onContinue}>{step < 3 ? ui.continue : submitting ? ui.submitting : ui.submit}</Button></CardContent></Card><Card className="border-[var(--sf-jade)]/20 bg-[var(--sf-jade)]/5"><CardContent className="flex gap-3 p-4 text-sm leading-5 text-[var(--sf-jade)]"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[var(--sf-jade)]" aria-hidden="true" /><p><span className="font-semibold">{ui.protected}</span> {ui.protectedLead}</p></CardContent></Card></div>;
}

function MobileBookingAction({ step, submitting, onContinue }: { step: number; submitting: boolean; onContinue: () => void }) {
  const { locale } = usePublicLocale();
  const ui = bookingUi[locale];
  return <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border/90 bg-background/95 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 shadow-[0_-12px_30px_rgb(0_0_0_/_0.16)] lg:hidden"><div className="mx-auto flex max-w-xl items-center gap-3"><span className="shrink-0 text-xs font-semibold text-muted-foreground">{ui.step} {step + 1} / 4</span><Button className="flex-1" disabled={submitting} onClick={onContinue}>{step < 3 ? ui.continue : submitting ? ui.submitting : ui.submit}</Button></div></div>;
}

export function BookingConfirmation({ confirmationToken, assignedStaffName, serviceName, startsAt, endsAt, locationName, locationAddress }: { confirmationToken: string; assignedStaffName?: string; serviceName: string; startsAt: Date; endsAt: Date; locationName: string; locationAddress?: string | null }) {
  const { locale } = usePublicLocale();
  const ui = bookingUi[locale];
  const calendarDescription = locale === "en" ? `SalonFlow booking. Status: awaiting salon confirmation.${assignedStaffName ? ` Specialist: ${assignedStaffName}.` : ""}` : locale === "ru" ? `Запись SalonFlow. Статус: ожидает подтверждения салоном.${assignedStaffName ? ` Специалист: ${assignedStaffName}.` : ""}` : `SalonFlow ჯავშანი. სტატუსი: სალონის დადასტურებას ელოდება.${assignedStaffName ? ` სპეციალისტი: ${assignedStaffName}.` : ""}`;
  const saveToCalendar = () => downloadBookingCalendar({ startsAt, endsAt, title: `${serviceName} — ${locationName}`, location: locationAddress ?? locationName, description: calendarDescription });
  return <Card role="status" aria-live="polite" className="sf-grain relative mt-8 overflow-hidden border-transparent text-center shadow-[var(--sf-glow-brand)]" style={{ background: "var(--sf-gradient-brand)" }}>
    <span className="sf-blob" style={{ width: "18rem", height: "18rem", top: "-6rem", left: "-4rem", background: "rgba(255,255,255,0.3)", opacity: 0.5, animation: "sf-blob-morph 15s ease-in-out infinite" }} aria-hidden="true" />
    <CardContent className="relative flex flex-col items-center gap-4 px-6 py-10 text-white">
      <span className="grid size-20 place-items-center rounded-full bg-white/20 backdrop-blur-sm" style={{ animation: "sf-celebrate 500ms var(--sf-ease-emphasized) both" }}><span className="grid size-14 place-items-center rounded-full bg-white text-[var(--sf-accent-strong)]"><CheckCircle2 className="h-8 w-8" aria-hidden="true" /></span></span>
      <div><CardTitle className="text-2xl text-white">{ui.received}</CardTitle><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-white/85">{ui.receivedLead}</p></div>
      {assignedStaffName ? <p className="rounded-xl border border-white/25 bg-white/15 px-4 py-2 text-sm text-white"><span className="font-semibold">{ui.assigned}</span> {assignedStaffName}</p> : null}
      <code aria-label={ui.code} className="block max-w-full break-all rounded-lg bg-white/95 px-3 py-2 text-xs font-medium text-[var(--sf-ink)]">{confirmationToken}</code>
      <div className="mt-1 flex flex-col items-center gap-3 sm:flex-row"><Button type="button" variant="outline" className="border-white/45 bg-white/10 text-white hover:bg-white/20 hover:text-white" onClick={saveToCalendar}><CalendarPlus className="size-4" aria-hidden="true" />{ui.calendar}</Button><Link href={`/manage-booking/${confirmationToken}`} className="inline-flex items-center gap-2 rounded-full border border-white/45 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-white/20">{ui.manage}</Link><a href="/book" className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-[var(--sf-accent-strong)] transition hover:-translate-y-0.5">{ui.returnToList}</a></div>
    </CardContent>
  </Card>;
}

function BookingErrorNotice({ issue, errorRef, onRetry }: { issue: BookingValidationIssue; errorRef: React.RefObject<HTMLDivElement | null>; onRetry?: () => void }) {
  return <div ref={errorRef} tabIndex={-1} data-booking-error className="sf-booking-error mt-5 rounded-[var(--sf-radius-control)] border border-destructive/35 bg-destructive/7 p-4 text-destructive outline-none focus-visible:ring-2 focus-visible:ring-destructive"><div className="flex gap-3"><CircleAlert className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" /><div className="min-w-0"><p className="font-semibold">{issue.title}</p><p className="mt-1 text-sm leading-6 text-foreground/78">{issue.description}</p>{onRetry ? <Button variant="outline" size="sm" className="mt-3 border-destructive/35 text-destructive hover:bg-destructive/10" onClick={onRetry}><RefreshCw className="mr-2 h-4 w-4" />კიდევ ერთხელ ცდა</Button> : null}</div></div></div>;
}

function InlineIssue({ children }: { children: ReactNode }) {
  return <p id="booking-time-error" className="sf-booking-inline-error flex gap-2 rounded-xl border border-destructive/25 bg-destructive/5 p-3 text-sm leading-5 text-destructive"><CircleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />{children}</p>;
}

function Alert({ children }: { children: ReactNode }) {
  return <Card role="alert" aria-live="assertive" className="mt-4 border-destructive/30 bg-destructive/5"><CardContent className="flex gap-3 p-4 text-sm text-destructive"><CircleAlert className="h-5 w-5 shrink-0" aria-hidden="true" />{children}</CardContent></Card>;
}
