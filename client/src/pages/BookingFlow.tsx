import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { formatGelTetri, formatKaDateTime } from "@/lib/presentation";
import { trpc } from "@/lib/trpc";
import { CalendarClock, Check, CheckCircle2, ChevronLeft, CircleAlert, Clock3, Mail, MapPin, Phone, RefreshCw, ShieldCheck, Sparkles, UserRound } from "lucide-react";
import React, { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Link, useRoute } from "wouter";

const steps = ["სერვისი", "სპეციალისტი", "თარიღი და დრო", "თქვენი მონაცემები"];
const ANY_AVAILABLE = "ANY_AVAILABLE";

export type BookingTeamMember = { id: string; name: string; specialty: string | null; bio: string | null; eligibleServiceIds: string[] };
type BookingService = { id: string; nameKa: string; defaultDurationMinutes: number; priceTetri: number };
type BookingLocation = { name: string; timezone: string; address: string | null; phone: string | null; email: string | null; publicDescription: string | null; workingHours: Array<{ weekday: number; startLocalTime: string; endLocalTime: string }> };
type BookingIssueKind = "service" | "staff" | "time" | "contact" | "submit";
export type BookingValidationIssue = { kind: BookingIssueKind; title: string; description: string };

export function getEligibleTeam(team: BookingTeamMember[], serviceId?: string) {
  return team.filter(member => member.eligibleServiceIds.includes(serviceId ?? ""));
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
  const slug = params?.slug ?? "";
  const catalog = trpc.public.bookingCatalog.useQuery(slug, { enabled: Boolean(slug) });
  const [step, setStep] = useState(0);
  const [serviceId, setServiceId] = useState<string>();
  const [staffProfileId, setStaffProfileId] = useState<string>();
  const [dateTime, setDateTime] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [customerNote, setCustomerNote] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [idempotencyKey] = useState(() => crypto.randomUUID());
  const [confirmation, setConfirmation] = useState<{ token: string; assignedStaffName?: string }>();
  const [interactionError, setInteractionError] = useState<BookingValidationIssue | null>(null);
  const errorRef = useRef<HTMLDivElement>(null);
  const startsAt = useMemo(() => (dateTime ? new Date(dateTime) : null), [dateTime]);
  const availabilityInput = useMemo(() => ({ slug, serviceId: serviceId ?? "pending-service", staffProfileId: staffProfileId ?? "pending-specialist", startsAt: startsAt ?? new Date(0) }), [slug, serviceId, staffProfileId, startsAt]);
  const availability = trpc.public.checkAvailability.useQuery(availabilityInput, { enabled: Boolean(serviceId && staffProfileId && startsAt && step >= 2) });
  const commitBooking = trpc.public.commitBooking.useMutation({
    onSuccess: result => {
      setInteractionError(null);
      setConfirmation({ token: result.confirmationToken, assignedStaffName: result.assignedStaffName });
    },
    onError: () => setInteractionError({ kind: "submit", title: "ჯავშნის მოთხოვნა ვერ გაიგზავნა", description: "მონაცემები არ დაგვიკარგავს. შეამოწმეთ კავშირი და სცადეთ ხელახლა." }),
  });
  const selectedService = catalog.data?.catalog.find(item => item.service.id === serviceId)?.service;
  const selectedStaff = catalog.data?.team.find(member => member.id === staffProfileId);
  const eligibleTeam = getEligibleTeam(catalog.data?.team ?? [], serviceId);

  useEffect(() => {
    if (!interactionError) return;
    const frame = requestAnimationFrame(() => errorRef.current?.focus());
    return () => cancelAnimationFrame(frame);
  }, [interactionError]);

  const clearIssue = (kind?: BookingIssueKind) => setInteractionError(current => !kind || current?.kind === kind ? null : current);
  const selectService = (value: string) => { setServiceId(value); setStaffProfileId(undefined); clearIssue("service"); };
  const selectStaff = (value: string) => { setStaffProfileId(value); clearIssue("staff"); };
  const selectDateTime = (value: string) => { setDateTime(value); clearIssue("time"); };
  const currentValidation = () => getBookingValidationIssue({ step, serviceId, staffProfileId, startsAt, available: availability.data?.available, firstName, phone, termsAccepted });
  const submitBooking = () => {
    if (!serviceId || !staffProfileId || !startsAt) return;
    commitBooking.mutate({ slug, serviceId, staffProfileId, startsAt, firstName, lastName: lastName || undefined, phone, email: email || undefined, customerNote: customerNote || undefined, bookingTermsConsent: true, idempotencyKey });
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
    <Link href="/book" className="sf-interactive inline-flex items-center gap-2 rounded-lg px-1 py-2 text-sm font-semibold text-[var(--sf-muted)] hover:text-[var(--sf-ink)]"><ChevronLeft className="h-4 w-4" /> ფილიალების სია</Link>
    <header className="mt-5 overflow-hidden rounded-[var(--sf-radius-hero)] border border-sidebar-border/90 bg-sidebar px-6 py-7 text-sidebar-foreground shadow-[var(--sf-shadow-lg)] sm:px-8 sm:py-9"><div className="flex flex-wrap items-center justify-between gap-3"><p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--sf-terracotta-strong)]"><Sparkles className="h-3.5 w-3.5" aria-hidden="true" /> ონლაინ ჩაწერა · 4 ნაბიჯი</p><span className="rounded-full border border-sidebar-border/90 bg-sidebar-accent/50 px-3 py-1.5 text-xs font-semibold text-sidebar-foreground/76">დაცული მოთხოვნა</span></div><h1 className="sf-display mt-5 max-w-2xl text-4xl font-semibold leading-tight sm:text-5xl">დაჯავშნეთ თქვენი მშვიდი დრო.</h1>{catalog.data ? <p className="mt-3 text-sm text-sidebar-foreground/68">{catalog.data.location.name} · {catalog.data.location.timezone}</p> : <p className="mt-3 text-sm text-sidebar-foreground/68">აირჩიეთ სერვისი და დაგეგმეთ ვიზიტი რამდენიმე მარტივ ნაბიჯში.</p>}</header>
    <ol className="sf-booking-progress mt-5 grid gap-2 sm:grid-cols-4" aria-label="ჯავშნის პროგრესი">{steps.map((label, index) => <li key={label} aria-current={index === step ? "step" : undefined} className={`sf-booking-progress__step flex items-center gap-2 rounded-[var(--sf-radius-control)] border px-3 py-3 text-sm ${index === step ? "is-current border-[var(--sf-terracotta)] bg-[color-mix(in_srgb,var(--sf-terracotta)_9%,transparent)] font-semibold text-[var(--sf-terracotta-strong)]" : index < step ? "is-complete border-[color-mix(in_srgb,var(--sf-jade)_28%,transparent)] bg-[color-mix(in_srgb,var(--sf-jade)_6%,transparent)] text-[var(--sf-jade)]" : "border-[var(--sf-line)] bg-[var(--sf-surface)] text-[var(--sf-muted)]"}`}><span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-current/25 text-[0.65rem]">{index < step ? <Check className="h-3 w-3" aria-hidden="true" /> : `0${index + 1}`}</span>{label}</li>)}</ol>
    {interactionError ? <BookingErrorNotice issue={interactionError} errorRef={errorRef} onRetry={interactionError.kind === "submit" ? submitBooking : undefined} /> : null}
    {catalog.isLoading ? <Card className="mt-8 border-border"><CardContent className="sf-skeleton p-6 text-sm text-muted-foreground" role="status" aria-live="polite">ჩაწერის კატალოგი იტვირთება…</CardContent></Card> : null}
    {catalog.isError ? <Alert>ჩაწერის მონაცემები დროებით მიუწვდომელია. შეამოწმეთ კავშირი და სცადეთ მოგვიანებით.</Alert> : null}
    {catalog.data === null ? <Card className="mt-8 border-[#1E2824]/10"><CardHeader><CardTitle>ეს ჩაწერის ბმული აღარ არის აქტიური</CardTitle></CardHeader><CardContent className="text-sm leading-6 text-muted-foreground">ფილიალი შესაძლოა გათიშულია ან ბმული არასწორია. დაბრუნდით ფილიალების სიაში და აირჩიეთ აქტიური ფილიალი.</CardContent></Card> : null}
    {catalog.data && confirmation ? <BookingConfirmation confirmationToken={confirmation.token} assignedStaffName={confirmation.assignedStaffName} /> : null}
    {catalog.data && !confirmation ? <div className="mt-7 grid gap-5 lg:grid-cols-[minmax(0,1fr)_21rem]"><section className="space-y-4"><LocationContext location={catalog.data.location} /><div key={step} className="sf-booking-step-pane">{step === 0 ? <ServiceStep catalog={catalog.data.catalog} selectedId={serviceId} onSelect={selectService} error={interactionError?.kind === "service" ? interactionError.description : undefined} /> : null}{step === 1 ? <StaffStep team={eligibleTeam} selectedId={staffProfileId} onSelect={selectStaff} error={interactionError?.kind === "staff" ? interactionError.description : undefined} /> : null}{step === 2 ? <TimeStep dateTime={dateTime} onChange={selectDateTime} availability={availability} error={interactionError?.kind === "time" ? interactionError.description : undefined} /> : null}{step === 3 ? <ContactStep firstName={firstName} lastName={lastName} phone={phone} email={email} customerNote={customerNote} termsAccepted={termsAccepted} error={interactionError?.kind === "contact" ? interactionError.description : undefined} onFirstName={value => { setFirstName(value); clearIssue("contact"); }} onLastName={setLastName} onPhone={value => { setPhone(value); clearIssue("contact"); }} onEmail={setEmail} onNote={setCustomerNote} onTerms={value => { setTermsAccepted(value); clearIssue("contact"); }} /> : null}</div></section><aside className="lg:sticky lg:top-6 lg:self-start"><BookingSummary step={step} service={selectedService} staff={selectedStaff} staffLabel={staffProfileId === ANY_AVAILABLE ? (availability.data?.staffName ? `${availability.data.staffName} (ავტომატურად შეირჩა)` : "ნებისმიერი თავისუფალი სპეციალისტი") : undefined} startsAt={startsAt} available={availability.data?.available === true} onBack={stepBack} onContinue={advanceBooking} submitting={commitBooking.isPending} /></aside><MobileBookingAction step={step} submitting={commitBooking.isPending} onContinue={advanceBooking} /></div> : null}
  </div></main>;
}

export function LocationContext({ location }: { location: BookingLocation }) {
  return <Card className="border-[#1E2824]/10 bg-white/80"><CardHeader className="pb-3"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#B85C3D]">ფილიალი</p><CardTitle className="mt-2">{location.name}</CardTitle>{location.publicDescription ? <p className="mt-2 text-sm leading-6 text-muted-foreground">{location.publicDescription}</p> : null}</CardHeader><CardContent className="space-y-3 text-sm text-muted-foreground"><p className="flex items-center gap-2"><MapPin className="h-4 w-4 shrink-0 text-[#B85C3D]" aria-hidden="true" />{location.address || location.timezone}</p>{location.workingHours.length ? <div className="rounded-xl bg-[#F7F4EF] p-3"><p className="flex items-center gap-2 font-medium text-[#1E2824]"><CalendarClock className="h-4 w-4 text-[#B85C3D]" aria-hidden="true" />ხელმისაწვდომი სპეციალისტების საათები</p><div className="mt-2 grid gap-1 text-xs">{location.workingHours.map(rule => <p key={rule.weekday}>{weekdayName(rule.weekday)} · {rule.startLocalTime}–{rule.endLocalTime}</p>)}</div></div> : <p className="rounded-xl border border-dashed p-3 text-xs leading-5">სამუშაო საათები ჯერ არ არის მითითებული. დროის არჩევისას ხელმისაწვდომობა მაინც ავტომატურად შემოწმდება.</p>}{location.phone ? <a href={`tel:${location.phone}`} className="flex items-center gap-2 font-medium text-[#1E2824] hover:text-[#B85C3D]"><Phone className="h-4 w-4 text-[#B85C3D]" aria-hidden="true" />{location.phone}</a> : null}{location.email ? <a href={`mailto:${location.email}`} className="flex items-center gap-2 font-medium text-[#1E2824] hover:text-[#B85C3D]"><Mail className="h-4 w-4 text-[#B85C3D]" aria-hidden="true" />{location.email}</a> : null}</CardContent></Card>;
}

export function weekdayName(day: number) { return ["ორშაბათი", "სამშაბათი", "ოთხშაბათი", "ხუთშაბათი", "პარასკევი", "შაბათი", "კვირა"][day] ?? "დღე"; }

function ServiceStep({ catalog, selectedId, onSelect, error }: { catalog: Array<{ service: BookingService; category: { nameKa: string } }>; selectedId?: string; onSelect: (id: string) => void; error?: string }) {
  return <Card className="border-[#1E2824]/10"><CardHeader><p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#B85C3D]">ნაბიჯი 01</p><CardTitle className="mt-2">აირჩიეთ სერვისი</CardTitle><p className="mt-1 text-sm leading-6 text-muted-foreground">გამოიყენეთ მომსახურების ხანგრძლივობა და ფასი თქვენი დროის შესარჩევად.</p></CardHeader><CardContent className="space-y-3">{error ? <InlineIssue>{error}</InlineIssue> : null}{catalog.length ? catalog.map(({ service, category }) => <button key={service.id} type="button" aria-pressed={service.id === selectedId} onClick={() => onSelect(service.id)} className={`sf-booking-choice w-full rounded-2xl border p-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B85C3D] ${service.id === selectedId ? "sf-booking-choice--selected border-[#B85C3D] bg-[#B85C3D]/5 shadow-sm" : "border-[#1E2824]/10 bg-white hover:border-[#B85C3D]/60 hover:shadow-sm"}`}><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-semibold text-[#B85C3D]">{category.nameKa}</p><p className="mt-1 text-base font-semibold">{service.nameKa}</p></div>{service.id === selectedId ? <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#B85C3D] text-white"><Check className="h-3.5 w-3.5" aria-hidden="true" /></span> : null}</div><div className="mt-4 flex flex-wrap gap-2 text-xs font-medium text-[#516159]"><span className="rounded-full bg-[#F2EEE7] px-2.5 py-1"><Clock3 className="mr-1 inline h-3.5 w-3.5 text-[#B85C3D]" aria-hidden="true" />{service.defaultDurationMinutes} წუთი</span><span className="rounded-full bg-[#F2EEE7] px-2.5 py-1">{formatGel(service.priceTetri)}</span></div></button>) : <p className="rounded-xl border border-dashed border-[#1E2824]/15 bg-white/60 p-4 text-sm leading-6 text-muted-foreground">ამ ფილიალისთვის ჯერ არ არის ხელმისაწვდომი ონლაინ სერვისები.</p>}</CardContent></Card>;
}

export function StaffStep({ team, selectedId, onSelect, error }: { team: BookingTeamMember[]; selectedId?: string; onSelect: (id: string) => void; error?: string }) {
  return <Card className="border-[#1E2824]/10"><CardHeader><p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#B85C3D]">ნაბიჯი 02</p><CardTitle className="mt-2">აირჩიეთ სპეციალისტი</CardTitle><p className="mt-1 text-sm leading-6 text-muted-foreground">ნაჩვენებია მხოლოდ ამ სერვისისთვის ხელმისაწვდომი სპეციალისტები. სურვილის შემთხვევაში სისტემა თავისუფალ სპეციალისტს თავად შეარჩევს.</p></CardHeader><CardContent className="space-y-3">{error ? <InlineIssue>{error}</InlineIssue> : null}{team.length ? <><button type="button" aria-pressed={selectedId === ANY_AVAILABLE} onClick={() => onSelect(ANY_AVAILABLE)} className={`sf-booking-choice w-full rounded-2xl border p-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B85C3D] ${selectedId === ANY_AVAILABLE ? "sf-booking-choice--selected border-[#17826A] bg-[#17826A]/5 shadow-sm" : "border-[#17826A]/30 bg-white hover:border-[#17826A] hover:shadow-sm"}`}><div className="flex items-start justify-between gap-3"><div><p className="font-semibold">ნებისმიერი თავისუფალი სპეციალისტი</p><p className="mt-1 text-sm text-[#516159]">ხელმისაწვდომობა საბოლოოდ გადამოწმდება დროის არჩევისას.</p></div>{selectedId === ANY_AVAILABLE ? <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#17826A] text-white"><Check className="h-3.5 w-3.5" aria-hidden="true" /></span> : null}</div></button>{team.map(member => <button key={member.id} type="button" aria-pressed={member.id === selectedId} onClick={() => onSelect(member.id)} className={`sf-booking-choice w-full rounded-2xl border p-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B85C3D] ${member.id === selectedId ? "sf-booking-choice--selected border-[#B85C3D] bg-[#B85C3D]/5 shadow-sm" : "border-[#1E2824]/10 bg-white hover:border-[#B85C3D]/60 hover:shadow-sm"}`}><div className="flex items-start justify-between gap-3"><div><p className="font-semibold">{member.name}</p>{member.specialty ? <p className="mt-1 text-sm text-[#516159]">{member.specialty}</p> : null}</div>{member.id === selectedId ? <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#B85C3D] text-white"><Check className="h-3.5 w-3.5" aria-hidden="true" /></span> : null}</div><p className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-[#216451]"><CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" /> ხელმისაწვდომია ამ სერვისისთვის</p>{member.bio ? <p className="mt-2 text-xs leading-5 text-[#69756e]">{member.bio}</p> : null}</button>)}</> : <p className="rounded-xl border border-dashed border-[#1E2824]/15 bg-white/60 p-4 text-sm leading-6 text-[#516159]">ამ სერვისისთვის ამ ფილიალში აქტიური ონლაინ სპეციალისტი ჯერ არ არის. გთხოვთ აირჩიოთ სხვა სერვისი ან დაუკავშირდეთ სალონს.</p>}</CardContent></Card>;
}

function TimeStep({ dateTime, onChange, availability, error }: { dateTime: string; onChange: (value: string) => void; availability: { isLoading: boolean; isError: boolean; data?: { available: boolean; reason?: string } }; error?: string }) {
  return <Card className="border-[#1E2824]/10"><CardHeader><p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#B85C3D]">ნაბიჯი 03</p><Clock3 className="mt-3 h-5 w-5 text-[#B85C3D]" aria-hidden="true" /><CardTitle className="mt-3">აირჩიეთ თარიღი და დრო</CardTitle></CardHeader><CardContent className="space-y-4">{error ? <InlineIssue>{error}</InlineIssue> : null}<label className="space-y-2 text-sm font-medium" htmlFor="booking-date-time"><span>სასურველი თარიღი და დრო</span><Input id="booking-date-time" type="datetime-local" value={dateTime} min={new Date().toISOString().slice(0, 16)} onChange={event => onChange(event.target.value)} aria-invalid={Boolean(error)} aria-describedby={error ? "booking-time-error" : undefined} /></label><div aria-live="polite">{dateTime && availability.isLoading ? <p className="sf-booking-availability flex items-center gap-2 text-sm text-muted-foreground" role="status"><span className="sf-booking-availability-dots" aria-hidden="true"><i /><i /><i /></span>ხელმისაწვდომობა მოწმდება…</p> : null}{dateTime && availability.data?.available ? <p className="rounded-xl bg-[#17826A]/5 p-3 text-sm font-medium text-[#17826A]">ეს დრო ხელმისაწვდომია. შეგიძლიათ გააგრძელოთ.</p> : null}{dateTime && (availability.isError || availability.data?.available === false) ? <Alert>{availability.data?.reason === "OUTSIDE_BOOKING_WINDOW" ? "არჩეული დრო დაჯავშნების დაშვებულ ვადას სცდება. აირჩიეთ უფრო ახლო თარიღი." : "ეს დრო აღარ არის ხელმისაწვდომი. აირჩიეთ სხვა დრო."}</Alert> : null}</div></CardContent></Card>;
}

function ContactStep({ firstName, lastName, phone, email, customerNote, termsAccepted, error, onFirstName, onLastName, onPhone, onEmail, onNote, onTerms }: { firstName: string; lastName: string; phone: string; email: string; customerNote: string; termsAccepted: boolean; error?: string; onFirstName: (value: string) => void; onLastName: (value: string) => void; onPhone: (value: string) => void; onEmail: (value: string) => void; onNote: (value: string) => void; onTerms: (value: boolean) => void }) {
  return <Card className="border-[#1E2824]/10"><CardHeader><p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#B85C3D]">ნაბიჯი 04</p><CardTitle className="mt-2">თქვენი მონაცემები</CardTitle><p className="mt-1 text-sm leading-6 text-muted-foreground">მონაცემები გამოიყენება მხოლოდ ამ ჯავშნის დამუშავებისა და დადასტურებისთვის.</p></CardHeader><CardContent className="space-y-4">{error ? <InlineIssue>{error}</InlineIssue> : null}<div className="grid gap-3 sm:grid-cols-2"><label className="space-y-2 text-sm font-medium" htmlFor="booking-first-name"><span>სახელი *</span><Input id="booking-first-name" value={firstName} onChange={event => onFirstName(event.target.value)} autoComplete="given-name" required aria-invalid={Boolean(error && !firstName.trim())} /></label><label className="space-y-2 text-sm font-medium" htmlFor="booking-last-name"><span>გვარი</span><Input id="booking-last-name" value={lastName} onChange={event => onLastName(event.target.value)} autoComplete="family-name" /></label></div><label className="block space-y-2 text-sm font-medium" htmlFor="booking-phone"><span>მობილურის ნომერი *</span><Input id="booking-phone" type="tel" value={phone} onChange={event => onPhone(event.target.value)} autoComplete="tel" required aria-invalid={Boolean(error && !phone.trim())} /></label><label className="block space-y-2 text-sm font-medium" htmlFor="booking-email"><span>ელფოსტა</span><Input id="booking-email" type="email" value={email} onChange={event => onEmail(event.target.value)} autoComplete="email" /></label><label className="block space-y-2 text-sm font-medium" htmlFor="booking-note"><span>კომენტარი სალონისთვის</span><Textarea id="booking-note" value={customerNote} onChange={event => onNote(event.target.value)} /></label><label className={`flex items-start gap-3 rounded-xl p-3 text-sm leading-5 text-[#516159] ${error && !termsAccepted ? "border border-destructive/35 bg-destructive/5" : "bg-[#F7F4EF]"}`}><Checkbox checked={termsAccepted} onCheckedChange={value => onTerms(value === true)} aria-invalid={Boolean(error && !termsAccepted)} /><span>ვეთანხმები, რომ სალონმა ჩემი მონაცემები გამოიყენოს ამ ჯავშნის დამუშავებისა და დადასტურებისთვის. *</span></label></CardContent></Card>;
}

function BookingSummary({ step, service, staff, staffLabel, startsAt, available, onBack, onContinue, submitting }: { step: number; service?: BookingService; staff?: BookingTeamMember; staffLabel?: string; startsAt: Date | null; available: boolean; onBack: () => void; onContinue: () => void; submitting: boolean }) {
  const rows = [{ label: "სერვისი", value: service ? `${service.nameKa} · ${formatGel(service.priceTetri)}` : "ჯერ არ არის არჩეული", ready: Boolean(service) }, { label: "სპეციალისტი", value: staffLabel ?? staff?.name ?? "შემდეგ აირჩიეთ სპეციალისტი", ready: Boolean(staff || staffLabel) }, { label: "დრო", value: startsAt ? formatKaDateTime(startsAt) : "შემდეგ აირჩიეთ თქვენთვის სასურველი დრო", ready: Boolean(startsAt && available) }];
  return <div className="space-y-4"><Card className="border-[#1E2824]/10 bg-white shadow-sm"><CardHeader><div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#B85C3D]/10 text-[#B85C3D]"><UserRound className="h-5 w-5" aria-hidden="true" /></span><div><CardTitle>თქვენი არჩევანი</CardTitle><p className="mt-1 text-xs text-muted-foreground">შეჯამება განახლდება თითოეულ ნაბიჯზე.</p></div></div></CardHeader><CardContent className="space-y-3">{rows.map(row => <div key={row.label} className="rounded-xl border border-[#1E2824]/8 bg-[#F7F4EF]/65 p-3"><p className="text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-[#8A766C]">{row.label}</p><p className={`mt-1 text-sm leading-5 ${row.ready ? "font-medium text-[#1E2824]" : "text-[#69756e]"}`}>{row.value}</p></div>)}{step > 0 ? <Button variant="outline" className="w-full border-[#1E2824]/15" onClick={onBack}>წინა ნაბიჯი</Button> : null}<Button className="w-full bg-[#B85C3D] shadow-sm hover:bg-[#9F4C32]" disabled={submitting} onClick={onContinue}>{step < 3 ? "გაგრძელება" : submitting ? "იგზავნება…" : "ჯავშნის გაგზავნა"}</Button></CardContent></Card><Card className="border-[#17826A]/20 bg-[#17826A]/5"><CardContent className="flex gap-3 p-4 text-sm leading-5 text-[#355747]"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#17826A]" aria-hidden="true" /><p><span className="font-semibold">დაცული ონლაინ მოთხოვნა.</span> არჩევანი გადამოწმდება ხელმისაწვდომობასთან, ხოლო საბოლოო დადასტურებას მიიღებთ სალონისგან.</p></CardContent></Card></div>;
}

function MobileBookingAction({ step, submitting, onContinue }: { step: number; submitting: boolean; onContinue: () => void }) {
  return <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border/90 bg-background/95 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 shadow-[0_-12px_30px_rgb(0_0_0_/_0.16)] lg:hidden"><div className="mx-auto flex max-w-xl items-center gap-3"><span className="shrink-0 text-xs font-semibold text-muted-foreground">ნაბიჯი {step + 1} / 4</span><Button className="flex-1" disabled={submitting} onClick={onContinue}>{step < 3 ? "გაგრძელება" : submitting ? "იგზავნება…" : "ჯავშნის გაგზავნა"}</Button></div></div>;
}

export function BookingConfirmation({ confirmationToken, assignedStaffName }: { confirmationToken: string; assignedStaffName?: string }) {
  return <Card role="status" aria-live="polite" className="mt-8 border-[#17826A]/30 bg-[#17826A]/5"><CardHeader><CheckCircle2 className="h-7 w-7 text-[#17826A]" aria-hidden="true" /><CardTitle className="mt-3">თქვენი მოთხოვნა მიღებულია</CardTitle></CardHeader><CardContent className="space-y-3 text-sm leading-6 text-[#355747]"><p>ჯავშანი ელოდება სალონის დადასტურებას. საჭიროების შემთხვევაში შეინახეთ ეს დადასტურების კოდი.</p>{assignedStaffName ? <p className="rounded-xl border border-[#17826A]/20 bg-white/70 p-3"><span className="font-semibold">თქვენი სპეციალისტი:</span> {assignedStaffName}</p> : null}<code aria-label="ჯავშნის დადასტურების კოდი" className="block break-all rounded-lg bg-white px-3 py-2 text-xs text-[#1E2824]">{confirmationToken}</code><a href="/book" className="inline-flex font-medium text-[#B85C3D]">ფილიალების სიაში დაბრუნება</a></CardContent></Card>;
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
