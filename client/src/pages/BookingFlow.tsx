import { CatalogFooter, CatalogHeader } from "@/components/catalog/CatalogChrome";
import { BookingBar, BookingBusinessStrip, BookingChoiceCard, BookingDateStrip, BookingNotice, BookingRail, BookingSlotGroup, BookingStepHeader, WEEKDAY_FULL, addDaysKey, formatDateKeyLong, schemaWeekdayOf } from "@/components/public/BookingPrimitives";
import { usePublicMeta } from "@/components/public/PublicMeta";
import { usePublicLocale } from "@/contexts/PublicLocaleContext";
import { downloadBookingCalendar } from "@/lib/bookingCalendar";
import { formatGelTetri, formatKaDateTime } from "@/lib/presentation";
import { trpc } from "@/lib/trpc";
import { BRAND } from "@shared/brand";
import { MAX_SELECTED_SERVICES } from "@shared/validation";
import { dateKeyInTimeZone } from "@shared/timezones";
import { CalendarClock, CalendarPlus, ChevronLeft, Mail, Phone, RefreshCw, X } from "lucide-react";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useRoute, useSearch } from "wouter";
import "@/components/catalog/booking.css";

const bookingUi = {
  ka: { loading: "ჩაწერის კატალოგი იტვირთება…", unavailable: "ჩაწერის მონაცემები დროებით მიუწვდომელია. შეამოწმეთ კავშირი და სცადეთ მოგვიანებით.", inactive: "ეს ჩაწერის ბმული აღარ არის აქტიური", inactiveLead: "ფილიალი შესაძლოა გათიშულია ან ბმული არასწორია. დაბრუნდით კატალოგში და აირჩიეთ აქტიური ფილიალი.", trialPaused: "ონლაინ ჩაწერა ამ სალონისთვის დროებით მიუწვდომელია", trialPausedLead: "სალონის საჯარო ინფორმაცია არ წაშლილა, თუმცა ამ ეტაპზე ახალი ონლაინ ჯავშანი ვერ მიიღება. დეტალებისთვის დაუკავშირდით სალონს.", viewSalon: "სალონის გვერდის ნახვა", received: "მოთხოვნა მიღებულია — ელოდება სალონის დადასტურებას", receivedLead: "თქვენი მოთხოვნა სალონმა უნდა დაადასტუროს. საჭიროების შემთხვევაში შეინახეთ დადასტურების კოდი და გამოიყენეთ დაცული მართვის ბმული.", assigned: "თქვენი სპეციალისტი:", code: "ჯავშნის დადასტურების კოდი", calendar: "კალენდარში დამატება", manage: "ჯავშნის მართვა", returnToList: "კატალოგში დაბრუნება" },
  en: { loading: "Loading booking catalog…", unavailable: "Booking data is temporarily unavailable. Check your connection and try again.", inactive: "This booking link is no longer active", inactiveLead: "The location may be inactive or the link may be incorrect. Return to the catalog and choose an active business.", trialPaused: "Online booking is temporarily unavailable", trialPausedLead: "This salon profile remains available, but it is not accepting new online bookings at this time. Please contact the salon for details.", viewSalon: "View salon profile", received: "Booking request received!", receivedLead: "Your booking is awaiting salon confirmation. Save the confirmation code if needed.", assigned: "Your specialist:", code: "Booking confirmation code", calendar: "Add to calendar", manage: "Manage booking", returnToList: "Back to the catalog" },
  ru: { loading: "Загрузка каталога записи…", unavailable: "Данные записи временно недоступны. Проверьте подключение и попробуйте снова.", inactive: "Эта ссылка для записи больше не активна", inactiveLead: "Филиал может быть неактивен или ссылка неверна. Вернитесь в каталог и выберите активный.", trialPaused: "Онлайн-запись временно недоступна", trialPausedLead: "Профиль салона остаётся доступным, но новые онлайн-записи сейчас не принимаются. Свяжитесь с салоном для деталей.", viewSalon: "Страница салона", received: "Заявка на запись принята!", receivedLead: "Запись ожидает подтверждения салоном. При необходимости сохраните код подтверждения.", assigned: "Ваш специалист:", code: "Код подтверждения", calendar: "Добавить в календарь", manage: "Управление записью", returnToList: "Вернуться в каталог" },
} as const;

const ANY_AVAILABLE = "ANY_AVAILABLE";
const STEP_NAMES = ["სერვისი", "სპეციალისტი", "დრო", "დადასტურება"];
const STEP_COPY = [
  { title: "რა გსურთ დღეს?", lede: "აირჩიეთ ერთი ან რამდენიმე სერვისი. შემდეგ ეტაპზე გამოჩნდება მხოლოდ ყველა არჩეული სერვისისთვის შესაბამისი სპეციალისტი." },
  { title: "ვინ მოგემსახუროთ?", lede: "აირჩიეთ კონკრეტული სპეციალისტი ან ნებისმიერი თავისუფალი." },
  { title: "რომელი დრო გერგებათ?", lede: "ნაჩვენებია მხოლოდ რეალურად თავისუფალი საათები. არჩეული დრო დაჯავშნისას კვლავ გადამოწმდება." },
  { title: "გადაამოწმეთ და დაადასტურეთ", lede: "მიუთითეთ საკონტაქტო მონაცემები. ჯავშანს სალონი დაგიდასტურებთ." },
];

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
  if (input.step === 2 && !input.startsAt) return { kind: "time", title: "დაამატეთ სასურველი თარიღი და დრო", description: `დროის არჩევის შემდეგ ${BRAND.nameKa} ავტომატურად გადაამოწმებს ხელმისაწვდომობას.` };
  if (input.step === 2 && input.available !== true) return { kind: "time", title: "ეს დრო ჯერ არ დადასტურებულა", description: "აირჩიეთ სხვა დრო ან დაელოდეთ ხელმისაწვდომობის შემოწმების დასრულებას." };
  if (input.step === 3 && !input.firstName.trim()) return { kind: "contact", title: "მიუთითეთ სახელი", description: "სახელი საჭიროა ჯავშნის მოთხოვნის დასადასტურებლად." };
  if (input.step === 3 && !input.phone.trim()) return { kind: "contact", title: "მიუთითეთ მობილურის ნომერი", description: "მობილურის ნომერი საჭიროა სალონთან თქვენი მოთხოვნის დასაკავშირებლად." };
  if (input.step === 3 && !input.termsAccepted) return { kind: "contact", title: "დაადასტურეთ ჯავშნის პირობები", description: "გაგრძელებამდე საჭიროა მონაცემების დამუშავებაზე თანხმობა." };
  return null;
}

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
  const slug = params?.slug ?? "";
  const catalog = trpc.public.bookingCatalog.useQuery(slug, { enabled: Boolean(slug) });
  usePublicMeta({
    title: catalog.data ? `ჩაწერა — ${catalog.data.location.name} | ${BRAND.name}` : `ონლაინ ჩაწერა | ${BRAND.name}`,
    description: "აირჩიეთ სერვისი, სპეციალისტი და თავისუფალი დრო და დაჯავშნეთ ონლაინ.",
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
  const errorRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const focusTitle = useRef(false);

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
  const submitting = commitBooking.isPending || commitMultiBooking.isPending;
  const selectedServices = catalog.data?.catalog.filter(item => serviceIds.includes(item.service.id)).map(item => item.service) ?? [];
  const totalMinutes = selectedServices.reduce((sum, service) => sum + service.defaultDurationMinutes, 0);
  const totalTetri = selectedServices.reduce((sum, service) => sum + service.priceTetri, 0);
  const selectedStaff = catalog.data?.team.find(member => member.id === staffProfileId);
  const eligibleTeam = getEligibleTeam(catalog.data?.team ?? [], serviceIds);
  const staffLabel = staffProfileId === ANY_AVAILABLE ? (availability.data?.staffName ? `${availability.data.staffName} (ავტომატურად შეირჩა)` : "ნებისმიერი თავისუფალი სპეციალისტი") : selectedStaff?.name;

  useEffect(() => {
    if (!interactionError) return;
    const frame = requestAnimationFrame(() => errorRef.current?.focus());
    return () => cancelAnimationFrame(frame);
  }, [interactionError]);

  // After the user moves between steps, put focus on the new step title so screen-reader and keyboard users land on it.
  useEffect(() => {
    if (!focusTitle.current) return;
    focusTitle.current = false;
    titleRef.current?.focus();
  }, [step]);

  const goToStep = (target: number) => { focusTitle.current = true; setInteractionError(null); setStep(target); };
  const clearIssue = (kind?: BookingIssueKind) => setInteractionError(current => !kind || current?.kind === kind ? null : current);
  const selectService = (value: string) => { setServiceIds(current => current.includes(value) ? current.filter(item => item !== value) : [...current, value]); setStaffProfileId(undefined); setDateTime(""); clearIssue("service"); };
  const selectStaff = (value: string) => { setStaffProfileId(value); setDateTime(""); clearIssue("staff"); };
  const selectDateTime = (value: string) => { setDateTime(value); clearIssue("time"); };
  const currentValidation = () => getBookingValidationIssue({ step, serviceId, staffProfileId, startsAt, available: availability.data?.available, firstName, phone, termsAccepted });
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
      <main id="main-content" tabIndex={-1} className="cw-book">
        <BookingConfirmation confirmationToken={confirmation.token} assignedStaffName={confirmation.assignedStaffName} serviceName={selectedServices.map(service => service.nameKa).join(" + ")} services={selectedServices.map(service => ({ name: service.nameKa, priceTetri: service.priceTetri }))} totalTetri={totalTetri} startsAt={startsAt} endsAt={confirmation.endsAt} locationName={catalog.data.location.name} locationAddress={catalog.data.location.address} timeZone={catalog.data.location.timezone} />
      </main>
      <CatalogFooter />
    </div>;
  }

  const blockedIssue = catalog.data && available ? currentValidation() : null;
  const barBlocked = Boolean(blockedIssue) || submitting;

  return <div className="cw min-h-screen">
    <CatalogHeader />
    <main id="main-content" tabIndex={-1} className="cw-book">
      <div className="cw-form">
        <div className="cw-form-band" aria-hidden="true" />
        <div className="cw-form-head">
          {step > 0 && catalog.data && available ? <button type="button" className="cw-btn cw-btn-line" onClick={() => goToStep(step - 1)}><ChevronLeft className="size-4" aria-hidden="true" />უკან</button>
            : <Link href={profileHref} className="cw-btn cw-btn-line"><ChevronLeft className="size-4" aria-hidden="true" />{catalog.data ? "პროფილი" : "კატალოგი"}</Link>}
          <div className="cw-form-head-title"><span className="cw-caption">ონლაინ ჩაწერა</span>{catalog.data && available ? <span className="cw-num text-xs font-semibold">{step + 1} / 4</span> : null}</div>
          <Link href={profileHref} className="cw-btn cw-btn-line" aria-label="ჩაწერის დახურვა"><X className="size-4" aria-hidden="true" /></Link>
        </div>

        {catalog.isLoading ? <div className="cw-step"><p role="status" className="cw-empty">{ui.loading}</p></div> : null}
        {catalog.isError ? <div className="cw-step"><BookingNotice tone="error" title={ui.unavailable} /></div> : null}
        {catalog.data === null ? <div className="cw-step"><div className="cw-empty"><strong>{ui.inactive}</strong>{ui.inactiveLead}</div><div className="cw-actions mt-4"><Link href="/salons" className="cw-btn cw-btn-stamp">{ui.returnToList}</Link></div></div> : null}
        {catalog.data && !available ? <div className="cw-step">
          <div className="cw-empty"><strong>{ui.trialPaused}</strong>{ui.trialPausedLead}</div>
          <div className="cw-actions mt-4"><Link href={`/salon/${slug}`} className="cw-btn cw-btn-stamp">{ui.viewSalon}</Link></div>
        </div> : null}

        {catalog.data && available ? <>
          <BookingRail steps={STEP_NAMES} current={step} onGo={goToStep} label="ჯავშნის პროგრესი" />
          <BookingBusinessStrip name={catalog.data.location.name} address={catalog.data.location.address} />
          <details className="cw-biz-more"><summary>სამუშაო საათები და კონტაქტი</summary><LocationContext location={catalog.data.location} /></details>
          {interactionError ? <div className="cw-form-pad"><BookingErrorNotice issue={interactionError} errorRef={errorRef} onRetry={interactionError.kind === "submit" ? submitBooking : undefined} /></div> : null}
          <div className="cw-step" key={step}>
            <BookingStepHeader step={step + 1} title={STEP_COPY[step]!.title} description={STEP_COPY[step]!.lede} headingRef={titleRef} />
            <div className="mt-4">
              {step === 0 ? <ServiceStep catalog={catalog.data.catalog} selectedIds={serviceIds} onSelect={selectService} /> : null}
              {step === 1 ? <StaffStep team={eligibleTeam} selectedId={staffProfileId} onSelect={selectStaff} onEditServices={() => goToStep(0)} /> : null}
              {step === 2 ? <TimeStep slug={slug} serviceId={serviceId} serviceIds={serviceIds} multiService={isMultiService} staffProfileId={staffProfileId} workingHours={catalog.data.location.workingHours} timezone={catalog.data.location.timezone} dateTime={dateTime} durationMinutes={totalMinutes} onChange={selectDateTime} availability={availability} /> : null}
              {step === 3 ? <ConfirmStep location={catalog.data.location} services={selectedServices} staffLabel={staffLabel} startsAt={startsAt} totalMinutes={totalMinutes} totalTetri={totalTetri} onEdit={goToStep} contactError={interactionError?.kind === "contact"} firstName={firstName} lastName={lastName} phone={phone} email={email} customerNote={customerNote} termsAccepted={termsAccepted} onFirstName={value => { setFirstName(value); clearIssue("contact"); }} onLastName={setLastName} onPhone={value => { setPhone(value); clearIssue("contact"); }} onEmail={setEmail} onNote={setCustomerNote} onTerms={value => { setTermsAccepted(value); clearIssue("contact"); }} /> : null}
            </div>
          </div>
          <BookingBar
            summary={selectedServices.length ? `${selectedServices.length} სერვისი · ${totalMinutes} წთ` : "სერვისი არ არის არჩეული"}
            total={formatGel(totalTetri)}
            label={step < 3 ? "შემდეგი" : submitting ? "იგზავნება…" : "დაჯავშნა"}
            blocked={barBlocked}
            hint={blockedIssue?.title}
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
  return <div className="cw-biz-more-body">
    {location.publicDescription ? <p>{location.publicDescription}</p> : null}
    {location.workingHours.length ? <div>
      <p className="cw-caption flex items-center gap-2"><CalendarClock className="size-4" aria-hidden="true" />ხელმისაწვდომი სპეციალისტების საათები</p>
      <ul className="mt-2 grid gap-1">{location.workingHours.map(rule => <li key={rule.weekday}>{weekdayName(rule.weekday)} · <span className="cw-num text-[0.8rem]">{rule.startLocalTime}–{rule.endLocalTime}</span></li>)}</ul>
    </div> : <p className="cw-empty text-sm">სამუშაო საათები ჯერ არ არის მითითებული. დროის არჩევისას ხელმისაწვდომობა მაინც ავტომატურად შემოწმდება.</p>}
    {location.phone ? <a href={`tel:${location.phone}`} className="inline-flex min-h-11 items-center gap-2 font-bold text-[var(--cw-ink)] underline underline-offset-4"><Phone className="size-4" aria-hidden="true" /><span className="cw-num text-[0.85rem]">{location.phone}</span></a> : null}
    {location.email ? <a href={`mailto:${location.email}`} className="inline-flex min-h-11 items-center gap-2 font-bold text-[var(--cw-ink)] underline underline-offset-4"><Mail className="size-4" aria-hidden="true" />{location.email}</a> : null}
  </div>;
}

export function weekdayName(day: number) { return WEEKDAY_FULL[day] ?? "დღე"; }

function ServiceStep({ catalog, selectedIds, onSelect }: { catalog: Array<{ service: BookingService; category: { nameKa: string } }>; selectedIds: string[]; onSelect: (id: string) => void }) {
  const groups = useMemo(() => {
    const map = new Map<string, BookingService[]>();
    for (const { service, category } of catalog) map.set(category.nameKa, [...(map.get(category.nameKa) ?? []), service]);
    return Array.from(map, ([name, items]) => ({ name, items }));
  }, [catalog]);
  if (!groups.length) return <div className="cw-empty"><strong>ონლაინ სერვისი ჯერ არ არის</strong>ამ ფილიალში ონლაინ ჩასაწერი სერვისები ჯერ არ არის. დაუკავშირდით სალონს.</div>;
  return <div className="grid gap-4">{groups.map((group, index) => {
    const picked = group.items.filter(service => selectedIds.includes(service.id)).length;
    return <div key={group.name} className="cw-ledger" role="group" aria-labelledby={`booking-group-${index}`}>
      <div className="cw-ledger-head"><h2 id={`booking-group-${index}`}>{group.name}</h2><span className="cw-num text-xs font-semibold">{picked ? `${picked} / ${group.items.length}` : group.items.length}</span></div>
      {group.items.map(service => <BookingChoiceCard key={service.id} conversionEvent="BOOKING_SERVICE_SELECTED" label={`${service.nameKa} არჩევა`} selected={selectedIds.includes(service.id)} onSelect={() => onSelect(service.id)}>
        <span className="cw-choice-row"><span className="cw-choice-name">{service.nameKa}</span><span className="cw-choice-price">{formatGel(service.priceTetri)}</span></span>
        <span className="cw-choice-meta block"><span className="cw-num">{service.defaultDurationMinutes} წთ</span></span>
      </BookingChoiceCard>)}
    </div>;
  })}</div>;
}

export function StaffStep({ team, selectedId, onSelect, onEditServices }: { team: BookingTeamMember[]; selectedId?: string; onSelect: (id: string) => void; onEditServices?: () => void }) {
  if (!team.length) return <div className="cw-empty"><strong>სპეციალისტი ვერ მოიძებნა</strong>არჩეული სერვისების ერთობლიობისთვის ამ ფილიალში აქტიური ონლაინ სპეციალისტი ჯერ არ არის. აირჩიეთ სხვა სერვისი ან დაუკავშირდით სალონს.{onEditServices ? <div className="mt-3"><button type="button" className="cw-btn cw-btn-line" onClick={onEditServices}>სერვისების შეცვლა</button></div> : null}</div>;
  return <div className="cw-choice-list" role="radiogroup" aria-label="სპეციალისტი">
    <BookingChoiceCard kind="radio" name="booking-specialist" conversionEvent="BOOKING_ANY_AVAILABLE_SELECTED" label="ნებისმიერი თავისუფალი სპეციალისტის არჩევა" selected={selectedId === ANY_AVAILABLE} onSelect={() => onSelect(ANY_AVAILABLE)}>
      <span className="cw-choice-name block">ნებისმიერი თავისუფალი სპეციალისტი</span>
      <span className="cw-choice-meta block">სისტემა დროის არჩევისას მოძებნის მხოლოდ არჩეული სერვისებისთვის რეალურად თავისუფალ სპეციალისტს.</span>
    </BookingChoiceCard>
    {team.map(member => <BookingChoiceCard key={member.id} kind="radio" name="booking-specialist" conversionEvent="BOOKING_SPECIALIST_SELECTED" label={`${member.name} არჩევა`} selected={member.id === selectedId} onSelect={() => onSelect(member.id)}>
      <span className="cw-choice-name block">{member.name}</span>
      {member.specialty ? <span className="cw-choice-meta block">{member.specialty}</span> : null}
      {member.bio ? <span className="cw-choice-meta block">{member.bio}</span> : null}
    </BookingChoiceCard>)}
  </div>;
}

const DAYS_AHEAD = 14;

function TimeStep({ slug, serviceId, serviceIds, multiService, staffProfileId, workingHours, timezone, dateTime, durationMinutes, onChange, availability }: { slug: string; serviceId?: string; serviceIds: string[]; multiService: boolean; staffProfileId?: string; workingHours: Array<{ weekday: number }>; timezone: string; dateTime: string; durationMinutes: number; onChange: (value: string) => void; availability: { isLoading: boolean; isError: boolean; data?: { available: boolean; reason?: string } } }) {
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

  const pickDate = (day: string) => { setSelectedDate(day); if (dateTime) onChange(""); };

  return <div className="grid gap-4">
    <BookingDateStrip days={days} selected={selectedDate} todayKey={today} onSelect={pickDate} />
    <p className="cw-duration"><span>{formatDateKeyLong(selectedDate)}</span><span>ხანგრძლივობა: <strong>{durationMinutes} წთ</strong></span></p>
    <div aria-live="polite" className="min-h-24">
      {!dayIsOpen ? <p className="cw-empty text-sm">ამ დღეს სალონი დახურულია. აირჩიეთ სხვა თარიღი.</p>
        : slotsQuery.isLoading ? <p role="status" className="text-sm text-[var(--cw-ink-soft)]">თავისუფალი დრო იტვირთება…</p>
        : slotsQuery.isError ? <BookingNotice tone="error" role="alert" title="თავისუფალი დროის ჩატვირთვა ვერ მოხერხდა. სცადეთ ხელახლა." />
        : slots.length ? <div>
          <BookingSlotGroup conversionEvent="BOOKING_TIME_SELECTED" title="დილა" slots={slotsByPeriod.დილა} selectedStartsAt={dateTime} onSelect={onChange} />
          <BookingSlotGroup conversionEvent="BOOKING_TIME_SELECTED" title="შუადღე" slots={slotsByPeriod.შუადღე} selectedStartsAt={dateTime} onSelect={onChange} />
          <BookingSlotGroup conversionEvent="BOOKING_TIME_SELECTED" title="საღამო" slots={slotsByPeriod.საღამო} selectedStartsAt={dateTime} onSelect={onChange} />
        </div>
        : <div className="cw-empty text-sm"><strong>ამ დღისთვის თავისუფალი დრო აღარ არის.</strong>შეგიძლიათ აირჩიოთ სხვა დღე ან დატოვოთ waitlist მოთხოვნა. ეს არ არის დადასტურებული ჯავშანი და ავტომატური შეტყობინება ჯერ არ იგზავნება.<div className="mt-2"><Link href={`/waitlist/${slug}?serviceId=${encodeURIComponent(serviceId ?? "")}&staffProfileId=${encodeURIComponent(staffProfileId ?? "")}&date=${encodeURIComponent(selectedDate)}`} data-conversion-event="BOOKING_WAITLIST_HANDOFF" className="cw-link">Waitlist მოთხოვნა</Link></div></div>}
    </div>
    {dateTime && availability.isLoading ? <p role="status" className="text-sm text-[var(--cw-ink-soft)]">ხელმისაწვდომობა მოწმდება…</p> : null}
    {dateTime && availability.data?.available ? <BookingNotice tone="ok" role="status">ეს დრო ხელმისაწვდომია — შეგიძლიათ გააგრძელოთ.</BookingNotice> : null}
    {dateTime && (availability.isError || availability.data?.available === false) ? <BookingNotice tone="error" role="alert">ეს დრო ახლახან დაიკავეს. აირჩიეთ სხვა თავისუფალი დრო.</BookingNotice> : null}
  </div>;
}

function ConfirmStep({ location, services, staffLabel, startsAt, totalMinutes, totalTetri, onEdit, contactError, firstName, lastName, phone, email, customerNote, termsAccepted, onFirstName, onLastName, onPhone, onEmail, onNote, onTerms }: { location: BookingLocation; services: BookingService[]; staffLabel?: string; startsAt: Date | null; totalMinutes: number; totalTetri: number; onEdit: (step: number) => void; contactError: boolean; firstName: string; lastName: string; phone: string; email: string; customerNote: string; termsAccepted: boolean; onFirstName: (value: string) => void; onLastName: (value: string) => void; onPhone: (value: string) => void; onEmail: (value: string) => void; onNote: (value: string) => void; onTerms: (value: boolean) => void }) {
  const edit = (label: string, target: number) => <button type="button" className="cw-link" aria-label={`${label} — შეცვლა`} onClick={() => onEdit(target)}>შეცვლა</button>;
  return <div className="grid gap-5">
    <div className="cw-ledger"><table className="cw-review"><caption className="sr-only">ჯავშნის შეჯამება</caption><tbody>
      <tr><th scope="row">ბიზნესი</th><td colSpan={2}>{location.name}{location.address ? <span className="block text-sm font-normal text-[var(--cw-ink-soft)]">{location.address}</span> : null}</td></tr>
      <tr><th scope="row">თარიღი და დრო</th><td className="cw-num text-[0.9rem]">{startsAt ? formatKaDateTime(startsAt, location.timezone) : "—"}</td><td className="cw-review-edit">{edit("თარიღი და დრო", 2)}</td></tr>
      <tr><th scope="row">სპეციალისტი</th><td>{staffLabel ?? "—"}</td><td className="cw-review-edit">{edit("სპეციალისტი", 1)}</td></tr>
      <tr><th scope="row">ხანგრძლივობა</th><td colSpan={2} className="cw-num text-[0.9rem]">{totalMinutes} წთ</td></tr>
      <tr><th scope="row">სერვისები</th><td><ul className="cw-review-services">{services.map(service => <li key={service.id}><span>{service.nameKa}</span><span className="cw-choice-price">{formatGel(service.priceTetri)}</span></li>)}</ul></td><td className="cw-review-edit">{edit("სერვისები", 0)}</td></tr>
      <tr className="cw-review-total"><th scope="row">ჯამი</th><td colSpan={2} className="cw-num">{formatGel(totalTetri)}</td></tr>
    </tbody></table></div>
    <div className="cw-fields">
      <div className="cw-fields cw-fields-two">
        <label className="cw-field" data-invalid={contactError && !firstName.trim()}><span className="cw-caption">სახელი *</span><input id="booking-first-name" value={firstName} onChange={event => onFirstName(event.target.value)} autoComplete="given-name" aria-required="true" aria-invalid={contactError && !firstName.trim()} /></label>
        <label className="cw-field"><span className="cw-caption">გვარი <span className="cw-field-optional">(არასავალდებულო)</span></span><input id="booking-last-name" value={lastName} onChange={event => onLastName(event.target.value)} autoComplete="family-name" /></label>
      </div>
      <div>
        <label className="cw-field" data-invalid={contactError && !phone.trim()}><span className="cw-caption">მობილურის ნომერი *</span><input id="booking-phone" type="tel" value={phone} onChange={event => onPhone(event.target.value)} autoComplete="tel" inputMode="tel" placeholder="მაგ. 555 12 34 56" aria-required="true" aria-invalid={contactError && !phone.trim()} aria-describedby="booking-phone-help" /></label>
        <p id="booking-phone-help" className="cw-help">ფორმატი: 5XX XX XX XX ან +995 5XX XX XX XX. ნომერი გამოყენებული იქნება მხოლოდ ამ მოთხოვნისთვის.</p>
      </div>
      <label className="cw-field"><span className="cw-caption">ელფოსტა <span className="cw-field-optional">(არასავალდებულო)</span></span><input id="booking-email" type="email" value={email} onChange={event => onEmail(event.target.value)} autoComplete="email" /></label>
      <label className="cw-field"><span className="cw-caption">კომენტარი სალონისთვის <span className="cw-field-optional">(არასავალდებულო)</span></span><textarea id="booking-note" value={customerNote} onChange={event => onNote(event.target.value)} /></label>
      <label className="cw-consent" data-invalid={contactError && !termsAccepted}>
        <input type="checkbox" className="cw-check" checked={termsAccepted} onChange={event => onTerms(event.target.checked)} aria-required="true" aria-invalid={contactError && !termsAccepted} />
        <span>ვეთანხმები, რომ სალონმა ჩემი მონაცემები გამოიყენოს მხოლოდ ამ ჯავშნის მოთხოვნის დამუშავებისა და დადასტურებისთვის. *</span>
      </label>
    </div>
  </div>;
}

export function BookingConfirmation({ confirmationToken, assignedStaffName, serviceName, services, totalTetri, startsAt, endsAt, locationName, locationAddress, timeZone }: { confirmationToken: string; assignedStaffName?: string; serviceName: string; services?: Array<{ name: string; priceTetri: number }>; totalTetri?: number; startsAt: Date; endsAt: Date; locationName: string; locationAddress?: string | null; timeZone?: string }) {
  const { locale } = usePublicLocale();
  const ui = bookingUi[locale];
  const titleRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => { titleRef.current?.focus(); }, []);
  const calendarDescription = locale === "en" ? `${BRAND.name} booking. Status: awaiting salon confirmation.${assignedStaffName ? ` Specialist: ${assignedStaffName}.` : ""}` : locale === "ru" ? `Запись ${BRAND.name}. Статус: ожидает подтверждения салоном.${assignedStaffName ? ` Специалист: ${assignedStaffName}.` : ""}` : `${BRAND.name} ჯავშანი. სტატუსი: სალონის დადასტურებას ელოდება.${assignedStaffName ? ` სპეციალისტი: ${assignedStaffName}.` : ""}`;
  const saveToCalendar = () => downloadBookingCalendar({ startsAt, endsAt, title: `${serviceName} — ${locationName}`, location: locationAddress ?? locationName, description: calendarDescription });
  const stubDate = new Intl.DateTimeFormat("ka-GE", { day: "2-digit", month: "2-digit", ...(timeZone ? { timeZone } : {}) }).format(startsAt);
  return <div className="cw-done cw-confirm">
    <div className="cw-ticket cw-ticket-done">
      <div className="cw-ticket-stub" aria-hidden="true">
        <span className="cw-num">{stubDate}</span>
        <span className="text-[0.72rem] font-extrabold [writing-mode:vertical-rl] rotate-180">{BRAND.nameKa}</span>
      </div>
      <div className="cw-ticket-done-body">
        <span className="cw-stamp-mark cw-stamp-big">ჩაწერილია</span>
        <div>
          <h1 ref={titleRef} tabIndex={-1} className="outline-none">{ui.received}</h1>
          <p className="cw-step-lede">{ui.receivedLead}</p>
        </div>
        <table className="cw-review cw-review-flat"><caption className="sr-only">ჯავშნის დეტალები</caption><tbody>
          <tr><th scope="row">ბიზნესი</th><td>{locationName}{locationAddress ? <span className="block text-sm font-normal text-[var(--cw-ink-soft)]">{locationAddress}</span> : null}</td></tr>
          <tr><th scope="row">თარიღი და დრო</th><td className="cw-num text-[0.9rem]">{formatKaDateTime(startsAt, timeZone)}</td></tr>
          {assignedStaffName ? <tr><th scope="row">სპეციალისტი</th><td><span className="sr-only">{ui.assigned} </span>{assignedStaffName}</td></tr> : null}
          <tr><th scope="row">სერვისები</th><td>{services?.length ? <ul className="cw-review-services">{services.map(service => <li key={service.name}><span>{service.name}</span><span className="cw-choice-price">{formatGel(service.priceTetri)}</span></li>)}</ul> : serviceName}</td></tr>
          {totalTetri !== undefined ? <tr className="cw-review-total"><th scope="row">ჯამი</th><td className="cw-num">{formatGel(totalTetri)}</td></tr> : null}
        </tbody></table>
        <div>
          <p className="cw-caption">{ui.code}</p>
          <code aria-label={ui.code} className="cw-code mt-1">{confirmationToken}</code>
        </div>
        <div className="cw-actions">
          <Link href={`/manage-booking/${confirmationToken}`} className="cw-btn cw-btn-stamp">{ui.manage}</Link>
          <button type="button" className="cw-btn cw-btn-line" onClick={saveToCalendar}><CalendarPlus className="size-4" aria-hidden="true" />{ui.calendar}</button>
          <Link href="/salons" className="cw-btn cw-btn-line">{ui.returnToList}</Link>
        </div>
      </div>
    </div>
  </div>;
}

function BookingErrorNotice({ issue, errorRef, onRetry }: { issue: BookingValidationIssue; errorRef: React.RefObject<HTMLDivElement | null>; onRetry?: () => void }) {
  return <BookingNotice tone="error" role="alert" noticeRef={errorRef} title={issue.title}>
    <p>{issue.description}</p>
    {onRetry ? <button type="button" className="cw-btn cw-btn-danger mt-3 min-h-11 text-sm" onClick={onRetry}><RefreshCw className="size-4" aria-hidden="true" />კიდევ ერთხელ ცდა</button> : null}
  </BookingNotice>;
}
