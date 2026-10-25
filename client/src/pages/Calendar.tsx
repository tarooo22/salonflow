import DashboardLayout from "@/components/DashboardLayout";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { useLocation, useSearch } from "wouter";
import { Bookmark, CalendarCheck, CalendarClock, Check, ChevronLeft, ChevronRight, Clock, MapPin, Plus, UserCheck, X, type LucideIcon } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { DragEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { dateKeyInTimeZone, formatTimeInTimeZone, zonedDateTimeToUtc } from "@shared/timezones";
import { toast } from "sonner";
import { nextAppointmentAction } from "@/lib/appointmentPresentation";
import { AppointmentQuickAction } from "@/components/AppointmentQuickAction";
import { ClinicalRecordsButton } from "@/components/clinical/ClinicalRecordsButton";
import { WalkInQuickEntry } from "@/components/WalkInQuickEntry";
import { WorkspacePageHeader, WorkspaceState } from "@/components/workspace/WorkspacePrimitives";
import { SavedViewMenu, type SavedViewPayload } from "@/components/workspace/SavedViewMenu";
import { RescheduleDialog, type RescheduleTarget } from "@/components/workspace/RescheduleDialog";
import { DATE_NAMES } from "@/components/public/BookingPrimitives";
import { useIsMobile } from "@/hooks/useMobile";

const statusLabels: Record<string, string> = { PENDING: "დასადასტურებელი", CONFIRMED: "დადასტურებული", CHECKED_IN: "მიღებულია", IN_SERVICE: "მომსახურებაშია", COMPLETED: "დასრულებული", CANCELLED: "გაუქმებული", NO_SHOW: "არ გამოცხადდა" };
const statusIcons: Record<string, LucideIcon> = { PENDING: Clock, CONFIRMED: CalendarCheck, CHECKED_IN: UserCheck, IN_SERVICE: UserCheck, COMPLETED: Check, CANCELLED: X, NO_SHOW: X };
const FIRST_HOUR = 8;
const LAST_HOUR = 21;
// Fallback opening hour when the location has no opening hours for the shown days (or they have not loaded).
const WORK_START_HOUR = 9;
const hours = Array.from({ length: LAST_HOUR - FIRST_HOUR }, (_, index) => FIRST_HOUR + index);
const names = DATE_NAMES.ka;

type View = "day" | "week";
type AppointmentEntry = {
  id: string;
  clientId: string | null;
  staffProfileId: string;
  startsAt: Date;
  endsAt: Date;
  status: string;
  client: { firstName: string; lastName: string | null } | null;
  staff: { id: string; publicDisplayName: string; color: string };
  services: Array<{ id: string; serviceNameSnapshot: string; durationMinutesSnapshot: number; priceTetriSnapshot: number }>;
  payment?: { state: string };
};
type BoardColumn = { key: string; day: Date; label: string; dot?: string; sub: React.ReactNode; staffProfileId?: string; appointments: AppointmentEntry[] };

// A "day" is a Date at UTC midnight carrying the calendar y/m/d of the location, so arithmetic never drifts with the browser zone.
function keyToDay(key: string) { const [y, m, d] = key.split("-").map(Number) as [number, number, number]; return new Date(Date.UTC(y, m - 1, d)); }
function dayKey(day: Date) { return day.toISOString().slice(0, 10); }
function addDays(value: Date, days: number) { const date = new Date(value); date.setUTCDate(date.getUTCDate() + days); return date; }
function startOfWeek(value: Date) { return addDays(value, -((value.getUTCDay() + 6) % 7)); }
function weekdayIndex(day: Date) { return (day.getUTCDay() + 6) % 7; }
function dayStart(value: Date, timezone: string) { return zonedDateTimeToUtc({ year: value.getUTCFullYear(), month: value.getUTCMonth() + 1, day: value.getUTCDate(), hour: 0, minute: 0, second: 0 }, timezone); }
function minuteOfDay(value: Date, timezone: string) { const parts = new Intl.DateTimeFormat("en-CA", { timeZone: timezone, hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(value); return Number(parts.find(part => part.type === "hour")?.value ?? 0) * 60 + Number(parts.find(part => part.type === "minute")?.value ?? 0); }
function dropSlot(event: DragEvent<HTMLDivElement>, day: Date, timezone: string, pixelsPerMinute: number) { const rect = event.currentTarget.getBoundingClientRect(); const rawMinutes = FIRST_HOUR * 60 + Math.round((event.clientY - rect.top) / (15 * pixelsPerMinute)) * 15; const minutes = Math.max(FIRST_HOUR * 60, Math.min((LAST_HOUR - 1) * 60 + 45, rawMinutes)); return zonedDateTimeToUtc({ year: day.getUTCFullYear(), month: day.getUTCMonth() + 1, day: day.getUTCDate(), hour: Math.floor(minutes / 60), minute: minutes % 60, second: 0 }, timezone); }

const Num = ({ children }: { children: React.ReactNode }) => <span className="cwk-num">{children}</span>;
/** "პარასკევი, 23 ოქტომბერი" with the numerals in mono. The browser has no ka-GE names, so the words come from our own table. */
function DayStamp({ day, withYear, short }: { day: Date; withYear?: boolean; short?: boolean }) {
  if (short) return <>{names.weekdayShort[weekdayIndex(day)]}, <Num>{day.getUTCDate()}</Num> {names.monthShort[day.getUTCMonth()]}</>;
  return <>{names.weekdayFull[weekdayIndex(day)]}, <Num>{day.getUTCDate()}</Num> {names.monthFull[day.getUTCMonth()]}{withYear ? <> <Num>{day.getUTCFullYear()}</Num></> : null}</>;
}
function RangeStamp({ first, last }: { first: Date; last: Date }) {
  if (first.getUTCMonth() === last.getUTCMonth()) return <><Num>{first.getUTCDate()}</Num> – <Num>{last.getUTCDate()}</Num> {names.monthFull[last.getUTCMonth()]}</>;
  return <><Num>{first.getUTCDate()}</Num> {names.monthShort[first.getUTCMonth()]} – <Num>{last.getUTCDate()}</Num> {names.monthShort[last.getUTCMonth()]}</>;
}

/** Earliest opening minute among the shown days ("HH:mm[:ss]" local times, weekday 0 = Monday); falls back to WORK_START_HOUR. */
export function openingStartMinute(openingHours: Array<{ weekday: number; opensAt: string }> | undefined, shownWeekdays: number[]) {
  const starts = (openingHours ?? []).filter(row => shownWeekdays.includes(row.weekday)).map(row => { const [h, m] = row.opensAt.split(":").map(Number); return (h ?? 0) * 60 + (m ?? 0); });
  return starts.length ? Math.max(FIRST_HOUR * 60, Math.min(...starts)) : WORK_START_HOUR * 60;
}

/** Minute of day the board opens at: 30 min before the first booking shown, else an hour before now (today, inside hours), else just before opening. */
export function boardScrollTargetMinute({ earliestBooking, isToday, nowMinute, workStartMinute }: { earliestBooking: number; isToday: boolean; nowMinute: number; workStartMinute: number }) {
  if (Number.isFinite(earliestBooking)) return earliestBooking - 30;
  if (isToday && nowMinute >= workStartMinute && nowMinute < LAST_HOUR * 60) return nowMinute - 60;
  return workStartMinute - 15;
}

/** Next quarter hour after `now`, as a UTC instant; presets "+ ჯავშანი" from ?create=1. */
export function nextQuarterHour(now: Date) {
  const step = 15 * 60_000;
  return new Date(Math.ceil((now.getTime() + 1) / step) * step);
}

export function canUseCalendarSpecialistFilter(role?: string) {
  return role === "OWNER" || role === "MANAGER";
}

/** The server rejects a move outside working/opening hours with PRECONDITION_FAILED; owners and managers may then resubmit with the override. */
export function isOutsideHoursError(error: { data?: { code?: string } | null } | null | undefined) {
  return error?.data?.code === "PRECONDITION_FAILED";
}

export default function Calendar() {
  const organizations = trpc.organizations.listMine.useQuery();
  const organizationEntry = organizations.data?.[0];
  const organization = organizationEntry?.organization;
  const isStaff = organizationEntry?.membership.role === "STAFF";
  const canManageCalendar = canUseCalendarSpecialistFilter(organizationEntry?.membership.role);
  const utils = trpc.useUtils();
  const isMobile = useIsMobile();
  const locations = trpc.organizations.listLocations.useQuery({ organizationId: organization?.id ?? "" }, { enabled: Boolean(organization?.id) });
  const [activeLocationId, setActiveLocationId] = useState("");
  const selectedLocation = locations.data?.find(location => location.id === activeLocationId) ?? locations.data?.[0];
  const timezone = selectedLocation?.timezone ?? organization?.defaultTimezone ?? "Asia/Tbilisi";
  const [view, setView] = useState<View>("day");
  // null = follow "today" in the location's timezone; the day view opens on today, the week view on that week's Monday.
  const [cursorKey, setCursorKey] = useState<string | null>(null);
  const [staffFilter, setStaffFilter] = useState("ALL");
  const [walkInOpen, setWalkInOpen] = useState(false);
  const [walkInStart, setWalkInStart] = useState<Date | undefined>(undefined);
  const [viewsOpen, setViewsOpen] = useState(false);
  const walkInRef = useRef<HTMLDivElement>(null);
  const search = useSearch();
  const [, navigate] = useLocation();
  const [mobileKey, setMobileKey] = useState("");
  const [now, setNow] = useState(() => new Date());
  const todayKey = dateKeyInTimeZone(now, timezone);
  const cursor = keyToDay(cursorKey ?? todayKey);
  const pixelsPerMinute = isMobile ? 1.5 : 1.1;

  useEffect(() => { if (!activeLocationId && locations.data?.[0]) setActiveLocationId(locations.data[0].id); }, [activeLocationId, locations.data]);
  useEffect(() => { const timer = setInterval(() => setNow(new Date()), 60_000); return () => clearInterval(timer); }, []);

  // ?create=1 (Today's "+ ჯავშანი") opens the existing walk-in form once, then drops the parameter so a refresh does not reopen it.
  useEffect(() => {
    if (new URLSearchParams(search).get("create") !== "1" || !organization || !selectedLocation) return;
    if (canManageCalendar) { setWalkInStart(nextQuarterHour(new Date())); setWalkInOpen(true); }
    navigate("/app/calendar", { replace: true });
  }, [search, organization, selectedLocation, canManageCalendar, navigate]);
  useEffect(() => { if (walkInOpen) walkInRef.current?.scrollIntoView({ block: "nearest" }); }, [walkInOpen, walkInStart]);

  const days = useMemo(() => view === "week" ? Array.from({ length: 7 }, (_, index) => addDays(startOfWeek(cursor), index)) : [cursor], [cursor.getTime(), view]);
  const range = useMemo(() => ({ startsAt: dayStart(days[0], timezone), endsAt: dayStart(addDays(days[days.length - 1], 1), timezone) }), [days, timezone]);
  const calendarInput = useMemo(() => ({ organizationId: organization?.id ?? "", locationId: selectedLocation?.id, ...range, staffProfileId: staffFilter === "ALL" ? undefined : staffFilter }), [organization?.id, range, selectedLocation?.id, staffFilter]);
  const appointments = trpc.appointments.listRange.useQuery(calendarInput, { enabled: Boolean(organization?.id && selectedLocation?.id) });
  const staff = trpc.staff.list.useQuery({ organizationId: organization?.id ?? "", locationId: selectedLocation?.id }, { enabled: Boolean(organization?.id && selectedLocation?.id) });
  const openingHours = trpc.organizations.listLocationOpeningHours.useQuery({ organizationId: organization?.id ?? "", locationId: selectedLocation?.id ?? "" }, { enabled: Boolean(organization?.id && selectedLocation?.id) });
  const [rescheduleTarget, setRescheduleTarget] = useState<RescheduleTarget | null>(null);
  const invalidate = () => Promise.all([utils.appointments.listRange.invalidate(), utils.appointments.dashboard.invalidate()]);
  const updateStatus = trpc.appointments.updateStatus.useMutation({ onSuccess: async () => { await invalidate(); toast.success("ჯავშნის სტატუსი განახლდა."); }, onError: () => toast.error("სტატუსის განახლება ვერ მოხერხდა.") });
  const reschedule = trpc.appointments.reschedule.useMutation({ onSuccess: async () => { await invalidate(); toast.success("ჯავშანი კალენდარში განახლდა."); }, onError: error => toast.error(error.message || "ჯავშნის გადატანა ვერ მოხერხდა.") });
  // Same mutation and invalidation as the drag path; the error stays in the dialog instead of a toast.
  const rescheduleFromDialog = trpc.appointments.reschedule.useMutation({ onSuccess: async () => { await invalidate(); setRescheduleTarget(null); toast.success("ჯავშანი კალენდარში განახლდა."); } });
  const visibleStaff = useMemo(() => {
    const all = staff.data ?? [];
    if (isStaff) return all.filter(item => item.membership.id === organizationEntry?.membership.id);
    if (staffFilter !== "ALL") return all.filter(item => item.profile.id === staffFilter);
    return all;
  }, [isStaff, organizationEntry?.membership.id, staff.data, staffFilter]);
  const calendarAppointments = (appointments.data ?? []) as AppointmentEntry[];
  const move = (direction: -1 | 1) => setCursorKey(dayKey(addDays(cursor, direction * (view === "week" ? 7 : 1))));
  const switchView = (next: View) => setView(next);
  const applySavedView = useCallback((payload: SavedViewPayload) => {
    if (payload.view) switchView(payload.view);
    if (payload.locationId && locations.data?.some(location => location.id === payload.locationId)) setActiveLocationId(payload.locationId);
    if (payload.staffFilter && (payload.staffFilter === "ALL" || staff.data?.some(item => item.profile.id === payload.staffFilter))) setStaffFilter(payload.staffFilter);
  }, [locations.data, staff.data]);

  const advance = (appointment: AppointmentEntry) => { const action = nextAppointmentAction(appointment.status); if (action) updateStatus.mutate({ organizationId: organization!.id, appointmentId: appointment.id, nextStatus: action.status }); };
  const moveAppointment = (appointment: AppointmentEntry, startsAt: Date, staffProfileId?: string) => { if (!organization || !canManageCalendar) return; reschedule.mutate({ organizationId: organization.id, appointmentId: appointment.id, startsAt, staffProfileId, reason: "CALENDAR_DRAG_DROP" }); };

  const columns: BoardColumn[] = useMemo(() => {
    const inDay = (day: Date) => calendarAppointments.filter(appointment => dateKeyInTimeZone(new Date(appointment.startsAt), timezone) === dayKey(day));
    if (view === "week") return days.map(day => { const list = inDay(day); return { key: dayKey(day), day, label: names.weekdayFull[weekdayIndex(day)], sub: <><Num>{day.getUTCDate()}</Num> {names.monthShort[day.getUTCMonth()]} · <Num>{list.length}</Num></>, appointments: list }; });
    const list = inDay(days[0]);
    return visibleStaff.map(member => { const own = list.filter(appointment => appointment.staffProfileId === member.profile.id); return { key: member.profile.id, day: days[0], label: member.profile.publicDisplayName, dot: member.profile.color, sub: <><Num>{own.length}</Num> ჯავშანი</>, staffProfileId: member.profile.id, appointments: own }; });
  }, [calendarAppointments, days, timezone, view, visibleStaff]);
  const activeKey = columns.some(column => column.key === mobileKey) ? mobileKey : (columns.find(column => column.key === todayKey) ?? columns[0])?.key ?? "";

  const openReschedule = (appointment: AppointmentEntry) => {
    if (!canManageCalendar) return;
    rescheduleFromDialog.reset();
    setRescheduleTarget({ id: appointment.id, staffProfileId: appointment.staffProfileId, startsAt: new Date(appointment.startsAt), clientName: appointment.client ? `${appointment.client.firstName} ${appointment.client.lastName ?? ""}`.trim() : "კლიენტი", service: appointment.services.map(item => item.serviceNameSnapshot).join(", ") || "სერვისი" });
  };
  const busy = updateStatus.isPending || reschedule.isPending || rescheduleFromDialog.isPending;
  const loading = locations.isLoading || appointments.isLoading || staff.isLoading;
  const failed = locations.isError || appointments.isError || staff.isError;
  const showBoard = Boolean(organization && selectedLocation && !loading && !failed && columns.length);
  const isToday = days.some(day => dayKey(day) === todayKey);
  const nowMinute = minuteOfDay(now, timezone);
  const boardRef = useRef<HTMLDivElement>(null);
  const rangeKey = `${view}:${dayKey(days[0])}`;
  const workStartMinute = openingStartMinute(openingHours.data, days.map(weekdayIndex));
  // Open the board at the first booking of the shown range; with none, 1h before now (today, inside working hours); otherwise at opening time.
  useEffect(() => {
    if (!showBoard || !boardRef.current) return;
    const earliestBooking = calendarAppointments.reduce((min, appointment) => Math.min(min, minuteOfDay(new Date(appointment.startsAt), timezone)), Infinity);
    const target = boardScrollTargetMinute({ earliestBooking, isToday, nowMinute, workStartMinute });
    boardRef.current.scrollTop = Math.max(0, (target - FIRST_HOUR * 60) * pixelsPerMinute);
  }, [showBoard, rangeKey, pixelsPerMinute, workStartMinute]); // eslint-disable-line react-hooks/exhaustive-deps

  const dateControls = <div className="flex min-w-0 items-center gap-1 max-md:order-2 max-md:w-full">
    <div className="flex min-w-0 flex-1 items-center gap-1 md:flex-none">
      <button type="button" className="cwk-datebtn" onClick={() => move(-1)} aria-label="წინა პერიოდი"><ChevronLeft className="size-4" aria-hidden="true" /></button>
      <span className="cwk-datestamp" aria-live="polite">{view === "week" ? <RangeStamp first={days[0]} last={days[6]} /> : <DayStamp day={days[0]} short withYear={days[0].getUTCFullYear() !== now.getUTCFullYear()} />}</span>
      <button type="button" className="cwk-datebtn" onClick={() => move(1)} aria-label="შემდეგი პერიოდი"><ChevronRight className="size-4" aria-hidden="true" /></button>
    </div>
    <button type="button" className="cwk-datebtn" onClick={() => setCursorKey(null)}>დღეს</button>
  </div>;
  const emptyRange = showBoard && !calendarAppointments.length;
  const toggleCreate = () => { if (walkInOpen) { setWalkInOpen(false); return; } setWalkInStart(undefined); setWalkInOpen(true); };
  // A tap on empty board space presets the walk-in form to that quarter hour; the server still validates the booking on submit.
  const createAt = (startsAt: Date) => { if (!canManageCalendar || !selectedLocation) return; setWalkInStart(startsAt); setWalkInOpen(true); };

  return <DashboardLayout><div className="sf-workspace-page mx-auto w-full max-w-[96rem] space-y-4">
    <WorkspacePageHeader title="კალენდარი" description={canManageCalendar ? "ყველა ჯავშანი სპეციალისტების მიხედვით. ახალი ჯავშნისთვის დააჭირეთ თავისუფალ დროს." : "თქვენი ჯავშნები დროის მიხედვით."} className="cwk-head--split" moreActions={organization ? <DropdownMenuItem onSelect={() => setViewsOpen(true)}><Bookmark className="size-4" aria-hidden="true" />შენახული ხედები</DropdownMenuItem> : undefined} actions={organization ? <>
      {dateControls}
      <div className="flex items-center gap-2 max-md:order-3 max-md:w-full">
        <div className="cwk-seg" role="group" aria-label="ხედი"><button type="button" aria-pressed={view === "day"} onClick={() => switchView("day")}>დღე</button><button type="button" aria-pressed={view === "week"} onClick={() => switchView("week")}>კვირა</button></div>
        {(locations.data?.length ?? 0) > 1 ? <Select value={activeLocationId || locations.data![0]?.id} onValueChange={setActiveLocationId}><SelectTrigger aria-label="ფილიალი" className="cwk-loc h-9 w-44 bg-card max-md:h-11 max-md:w-auto"><MapPin className="mr-1 size-4 shrink-0 text-[var(--cwk-ink-soft)]" aria-hidden="true" /><SelectValue placeholder="ფილიალი" /></SelectTrigger><SelectContent>{locations.data!.map(location => <SelectItem key={location.id} value={location.id}>{location.name}</SelectItem>)}</SelectContent></Select> : null}
        {canManageCalendar ? <Select value={staffFilter} onValueChange={setStaffFilter}><SelectTrigger aria-label="სპეციალისტი" className="cwk-off h-9 w-auto min-w-44 bg-card"><SelectValue placeholder="ყველა სპეციალისტი" /></SelectTrigger><SelectContent><SelectItem value="ALL">ყველა სპეციალისტი</SelectItem>{staff.data?.map(item => <SelectItem key={item.profile.id} value={item.profile.id}>{item.profile.publicDisplayName}</SelectItem>)}</SelectContent></Select> : null}
        <SavedViewMenu organizationId={organization.id} route="/app/calendar" filterPayload={{ view, locationId: selectedLocation?.id, ...(staffFilter !== "ALL" ? { staffFilter } : {}) }} onApply={applySavedView} open={viewsOpen} onOpenChange={setViewsOpen} hideTrigger />
      </div>
      {canManageCalendar && selectedLocation ? <button type="button" className="cwk-stampbtn ml-auto" aria-expanded={walkInOpen} onClick={toggleCreate}><Plus className="size-4" aria-hidden="true" />ჯავშანი</button> : null}
    </> : null} />
    {organizations.isLoading ? <WorkspaceState kind="loading" title="სამუშაო სივრცე იტვირთება…" /> : null}
    {organizations.isError ? <WorkspaceState kind="error" title="სამუშაო სივრცის მონაცემები მიუწვდომელია" /> : null}
    {!organizations.isLoading && !organizations.isError && !organization ? <WorkspaceState kind="empty" title="ჯერ შექმენით სამუშაო სივრცე" description="კალენდარი გამოჩნდება პირველი ფილიალის შექმნის შემდეგ." /> : null}
    {organization && selectedLocation && canManageCalendar && walkInOpen ? <div ref={walkInRef}><WalkInQuickEntry key={walkInStart?.getTime() ?? "now"} defaultStartsAt={walkInStart} organizationId={organization.id} locationId={selectedLocation.id} timeZone={selectedLocation.timezone} open={walkInOpen} onOpenChange={setWalkInOpen} /></div> : null}
    {organization && canManageCalendar && rescheduleTarget ? <RescheduleDialog key={rescheduleTarget.id} target={rescheduleTarget} timezone={timezone} staff={(staff.data ?? []).map(item => ({ id: item.profile.id, name: item.profile.publicDisplayName }))} firstHour={FIRST_HOUR} lastHour={LAST_HOUR} pending={rescheduleFromDialog.isPending} error={rescheduleFromDialog.error ? rescheduleFromDialog.error.message || "ჯავშნის გადატანა ვერ მოხერხდა." : undefined} outsideHours={isOutsideHoursError(rescheduleFromDialog.error)} canOverrideHours={canManageCalendar} onClose={() => setRescheduleTarget(null)} onSubmit={(startsAt, staffProfileId, allowOutsideHours) => rescheduleFromDialog.mutate({ organizationId: organization.id, appointmentId: rescheduleTarget.id, startsAt, staffProfileId, reason: "CALENDAR_RESCHEDULE_DIALOG", allowOutsideHours })} /> : null}
    {organization ? <>
      {loading ? <WorkspaceState kind="loading" title="კალენდარი იტვირთება…" /> : null}
      {failed ? <WorkspaceState kind="error" title="კალენდრის მონაცემები ვერ ჩაიტვირთა" /> : null}
      {!locations.isLoading && !locations.data?.length ? <WorkspaceState kind="empty" title="ჯერ არ არის აქტიური ფილიალი" /> : null}
      {!loading && !failed && selectedLocation && !columns.length ? <WorkspaceState kind="empty" title="ფილიალზე სპეციალისტი არ არის" description="დაამატეთ სპეციალისტი გუნდის გვერდზე." /> : null}
      {showBoard ? <>
        <div className="cwk-strip" role="group" aria-label={view === "week" ? "დღე" : "სპეციალისტი"}>{columns.map(column => <button key={column.key} type="button" aria-pressed={column.key === activeKey} onClick={() => setMobileKey(column.key)}>{column.dot ? <span className="cwk-dot" style={{ backgroundColor: column.dot }} aria-hidden="true" /> : null}{view === "week" ? <>{names.weekdayShort[weekdayIndex(column.day)]} <Num>{column.day.getUTCDate()}</Num></> : column.label}</button>)}</div>
        <div className="relative">
          <Board innerRef={boardRef} columns={columns} activeKey={activeKey} timezone={timezone} pixelsPerMinute={pixelsPerMinute} weekView={view === "week"} todayKey={todayKey} nowMinute={nowMinute} canManageCalendar={canManageCalendar} busy={busy} onAdvance={advance} onMove={moveAppointment} onReschedule={openReschedule} onCreateAt={canManageCalendar ? createAt : undefined} />
          {emptyRange ? <div className="pointer-events-none absolute inset-0 z-20 grid place-items-center p-2">
            <div className="pointer-events-auto w-full max-w-sm overflow-hidden rounded-[1.25rem] border border-[var(--cwk-rule)] bg-card shadow-sm">
              <WorkspaceState kind="empty" title={view === "week" ? "ამ კვირაში ჯავშანი არ არის." : "ამ დღეს ჯავშანი არ არის."} description={canManageCalendar ? "ახალი ჯავშნისთვის დააჭირეთ თავისუფალ დროს." : undefined} action={canManageCalendar ? <button type="button" className="cwk-stampbtn" onClick={() => { setWalkInStart(undefined); setWalkInOpen(true); }}><Plus className="size-4" aria-hidden="true" />ჯავშანი</button> : undefined} />
            </div>
          </div> : null}
        </div>
      </> : null}
    </> : null}
  </div></DashboardLayout>;
}

type PlacedTicket = { appointment: AppointmentEntry; start: number; end: number; lane: number; lanes: number };

/** Greedy lane assignment so overlapping bookings sit side by side instead of on top of each other. */
export function placeTickets(items: Array<{ appointment: AppointmentEntry; start: number; end: number }>): PlacedTicket[] {
  const sorted = [...items].sort((a, b) => a.start - b.start || a.end - b.end);
  const placed: PlacedTicket[] = [];
  let cluster: PlacedTicket[] = [];
  let laneEnds: number[] = [];
  let clusterEnd = -1;
  const flush = () => { cluster.forEach(ticket => { ticket.lanes = laneEnds.length; }); placed.push(...cluster); cluster = []; laneEnds = []; clusterEnd = -1; };
  for (const item of sorted) {
    if (cluster.length && item.start >= clusterEnd) flush();
    let lane = laneEnds.findIndex(end => end <= item.start);
    if (lane === -1) { lane = laneEnds.length; laneEnds.push(item.end); } else laneEnds[lane] = item.end;
    cluster.push({ ...item, lane, lanes: 1 });
    clusterEnd = Math.max(clusterEnd, item.end);
  }
  flush();
  return placed;
}

function Board({ innerRef, columns, activeKey, timezone, pixelsPerMinute, weekView, todayKey, nowMinute, canManageCalendar, busy, onAdvance, onMove, onReschedule, onCreateAt }: { innerRef: React.Ref<HTMLDivElement>; columns: BoardColumn[]; activeKey: string; timezone: string; pixelsPerMinute: number; weekView: boolean; todayKey: string; nowMinute: number; canManageCalendar: boolean; busy: boolean; onAdvance: (appointment: AppointmentEntry) => void; onMove: (appointment: AppointmentEntry, startsAt: Date, staffProfileId?: string) => void; onReschedule: (appointment: AppointmentEntry) => void; onCreateAt?: (startsAt: Date) => void }) {
  const hourHeight = 60 * pixelsPerMinute;
  const bodyHeight = (LAST_HOUR - FIRST_HOUR) * hourHeight;
  const nowTop = (nowMinute - FIRST_HOUR * 60) * pixelsPerMinute;
  const nowVisible = nowTop >= 0 && nowTop <= bodyHeight && columns.some(column => dayKey(column.day) === todayKey);
  const ruling = { backgroundImage: "linear-gradient(to bottom, var(--cwk-rule) 1px, transparent 1px), linear-gradient(to bottom, color-mix(in srgb, var(--cwk-rule) 45%, transparent) 1px, transparent 1px)", backgroundSize: `100% ${hourHeight}px, 100% ${hourHeight / 2}px`, height: bodyHeight } as const;
  const hidden = (key: string) => (key === activeKey ? "" : "cwk-off");
  return <div ref={innerRef} className="cwk-board" role="region" aria-label="ჯავშნების დაფა" tabIndex={0}>
    <div className="cwk-board-grid" style={{ "--cwk-cols": `3.5rem repeat(${columns.length}, minmax(${weekView ? "9.5rem" : "11rem"}, 1fr))` } as React.CSSProperties}>
      <div className="cwk-corner" />
      {columns.map(column => <div key={column.key} className={`cwk-colhead ${hidden(column.key)}`}>
        <p className="cwk-colhead-name">{column.dot ? <span className="cwk-dot" style={{ backgroundColor: column.dot }} aria-hidden="true" /> : null}<span>{column.label}</span></p>
        <p className="cwk-colhead-sub">{column.sub}</p>
      </div>)}
      <div className="cwk-gutter" style={{ height: bodyHeight }}>
        {hours.map((hour, index) => <span key={hour} className="cwk-hour cwk-num" style={{ top: index * hourHeight, ...(index === 0 ? { transform: "none" } : {}) }}>{String(hour).padStart(2, "0")}:00</span>)}
        {nowVisible ? <span className="cwk-now-tag" style={{ position: "absolute", top: nowTop - 9, right: 4, left: "auto", zIndex: 7 }}>ახლა</span> : null}
      </div>
      {columns.map(column => {
        const items = column.appointments.map(appointment => ({ appointment, start: minuteOfDay(new Date(appointment.startsAt), timezone), end: minuteOfDay(new Date(appointment.endsAt), timezone) }));
        const isTodayColumn = dayKey(column.day) === todayKey;
        const drop = (event: DragEvent<HTMLDivElement>) => {
          event.preventDefault();
          if (!canManageCalendar || busy) return;
          const encoded = event.dataTransfer.getData("application/x-salonflow-appointment");
          if (!encoded) return;
          try { onMove(JSON.parse(encoded) as AppointmentEntry, dropSlot(event, column.day, timezone, pixelsPerMinute), column.staffProfileId); } catch { /* malformed drag payload is ignored */ }
        };
        return <div key={column.key} className={`cwk-col ${hidden(column.key)}`} style={ruling} onDragOver={event => { if (canManageCalendar) event.preventDefault(); }} onDrop={drop} onClick={event => { if (onCreateAt && event.target === event.currentTarget) onCreateAt(dropSlot(event as unknown as DragEvent<HTMLDivElement>, column.day, timezone, pixelsPerMinute)); }}>
          {placeTickets(items).map(ticket => <Ticket key={ticket.appointment.id} ticket={ticket} timezone={timezone} pixelsPerMinute={pixelsPerMinute} showStaff={weekView} canManageCalendar={canManageCalendar} busy={busy} onAdvance={onAdvance} onReschedule={onReschedule} />)}
          {nowVisible && isTodayColumn ? <div className="cwk-now" style={{ top: nowTop }} aria-hidden="true" /> : null}
        </div>;
      })}
    </div>
  </div>;
}

function Ticket({ ticket, timezone, pixelsPerMinute, showStaff, canManageCalendar, busy, onAdvance, onReschedule }: { ticket: PlacedTicket; timezone: string; pixelsPerMinute: number; showStaff: boolean; canManageCalendar: boolean; busy: boolean; onAdvance: (appointment: AppointmentEntry) => void; onReschedule: (appointment: AppointmentEntry) => void }) {
  const { appointment, start, end, lane, lanes } = ticket;
  const minutes = Math.max(end - start, 15);
  const top = Math.max(0, (start - FIRST_HOUR * 60) * pixelsPerMinute) + 1;
  const height = Math.max(26, Math.min((LAST_HOUR - FIRST_HOUR) * 60 * pixelsPerMinute - top - 1, minutes * pixelsPerMinute - 2));
  const short = minutes <= 30;
  const clientName = appointment.client ? `${appointment.client.firstName} ${appointment.client.lastName ?? ""}`.trim() : "კლიენტი";
  const service = appointment.services.map(item => item.serviceNameSnapshot).join(", ") || "სერვისი";
  const time = `${formatTimeInTimeZone(new Date(appointment.startsAt), timezone)}–${formatTimeInTimeZone(new Date(appointment.endsAt), timezone)}`;
  const draggable = canManageCalendar && (appointment.status === "PENDING" || appointment.status === "CONFIRMED");
  const StatusIcon = statusIcons[appointment.status] ?? Clock;
  const state = statusLabels[appointment.status] ?? appointment.status;
  const [pressed, setPressed] = useState(false);
  const lastStatus = useRef(appointment.status);
  // A status change recolours the stub with a short stamp press (skipped on first render).
  useEffect(() => { if (lastStatus.current === appointment.status) return; lastStatus.current = appointment.status; setPressed(true); const timer = setTimeout(() => setPressed(false), 260); return () => clearTimeout(timer); }, [appointment.status]);
  const action = (className: string) => <AppointmentQuickAction role={canManageCalendar ? "RECEPTIONIST" : "STAFF"} status={appointment.status} cardHeight={height >= 40 ? 70 : 0} context="calendar" disabled={busy} onAction={() => onAdvance(appointment)} className={className} />;
  return <article
    draggable={draggable}
    onDragStart={event => { event.dataTransfer.effectAllowed = "move"; event.dataTransfer.setData("application/x-salonflow-appointment", JSON.stringify(appointment)); }}
    title={draggable ? `${clientName} · ${service} · ${time} — გადათრიეთ სხვა დროზე ან სპეციალისტზე` : `${clientName} · ${service} · ${time}`}
    className="cwk-ticket group"
    data-status={appointment.status}
    data-short={short}
    style={{ top, height, left: `calc(${(lane / lanes) * 100}% + 2px)`, width: `calc(${100 / lanes}% - 4px)` }}
    aria-label={`${time} ${clientName}, ${service}, ${state}`}
  >
    <span className="cwk-stub" data-pressed={pressed} aria-hidden="true" />
    <div className="cwk-tbody" data-line={short}>
      {short ? <>
        <span className="cwk-tname"><StatusIcon className="cwk-ticon mr-1 inline align-[-1px]" aria-hidden="true" />{clientName}</span>
        <span className="cwk-ttime cwk-num">{formatTimeInTimeZone(new Date(appointment.startsAt), timezone)}</span>
      </> : <>
        <span className="cwk-tname"><StatusIcon className="cwk-ticon mr-1 inline align-[-1px]" aria-hidden="true" />{showStaff ? <span className="cwk-dot mr-1.5 inline-block" style={{ backgroundColor: appointment.staff.color }} aria-hidden="true" /> : null}{clientName}</span>
        {height >= 60 ? <span className="cwk-tsvc">{service}</span> : null}
        <span className="cwk-ttime cwk-num">{time}</span>
        {height >= 76 ? <span className="cwk-tstate">{state}</span> : null}
        {lanes > 1 && height >= 64 ? action("cwk-tact cwk-tact-flow") : null}
        {height >= 96 && lanes === 1 ? <div className="mt-1 empty:hidden"><ClinicalRecordsButton appointment={appointment} className="h-7 px-2 text-xs" /></div> : null}
      </>}
    </div>
    {draggable ? <button type="button" aria-label={`გადატანა: ${clientName}, ${time}`} title="გადატანა" disabled={busy} onClick={() => onReschedule(appointment)} className="mr-1 grid size-7 shrink-0 self-center place-items-center rounded-md text-[var(--cwk-ink-soft)] hover:bg-[var(--sf-surface-2)] hover:text-[var(--cwk-ink)] focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--sf-focus)] disabled:opacity-40 group-focus-within:opacity-100 group-hover:opacity-100 md:opacity-0 max-md:size-9"><CalendarClock className="size-4" aria-hidden="true" /></button> : null}
    {lanes === 1 ? action("cwk-tact") : null}
  </article>;
}
