import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { StaffTip, StartHere } from "@/components/workspace/StartHere";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AppointmentQuickAction } from "@/components/AppointmentQuickAction";
import { ClinicalRecordsButton } from "@/components/clinical/ClinicalRecordsButton";
import { WalkInQuickEntry } from "@/components/WalkInQuickEntry";
import { WorkspacePageHeader, WorkspaceRevealItem, WorkspaceRevealScope, WorkspaceSection, WorkspaceState, WorkspaceStatusPill, type WorkspaceStatus } from "@/components/workspace/WorkspacePrimitives";
import { CompactMetricRail, MetricCell, PriorityModule } from "@/components/workspace/DashboardModules";
import { DayCloseChecklist, NotificationCenter } from "@/components/workspace/DailyControl";
import { MetricPreferenceMenu } from "@/components/workspace/MetricPreferenceMenu";
import { ReceivePaymentDialog, canReceivePayment, type ReceivePaymentTarget } from "@/components/workspace/ReceivePaymentDialog";
import { trpc } from "@/lib/trpc";
import { dashboardMetricKeys, nextOperationalAppointment } from "@/lib/dashboardExperience";
import { canManageAppointmentQueue } from "@/lib/appointmentPresentation";
import { formatGelTetri, formatPaymentState } from "@/lib/presentation";
import { DATE_NAMES, schemaWeekdayOf } from "@/components/public/BookingPrimitives";
import { formatTimeInTimeZone } from "@shared/timezones";
import { Link2, MapPin, Plus, ReceiptText, UserPlus, Wallet } from "lucide-react";
import React, { FormEvent, useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { toast } from "sonner";

type TodayAppointment = {
  status: string;
  startsAt: Date | string;
  endsAt: Date | string;
  client: { firstName: string; lastName: string | null } | null;
  services: Array<{ serviceNameSnapshot: string }>;
  staff: { publicDisplayName: string };
};
type TodayFocus = { appointment: TodayAppointment; kind: "NOW" | "NEXT" } | null;
type DashboardMetricKey = "BOOKINGS" | "PENDING" | "SCHEDULED" | "OUTSTANDING" | "UP_NEXT";

const ADD_LOCATION = "__add_location__";
function money(tetri: number) { return formatGelTetri(tetri); }

export default function Today() {
  const utils = trpc.useUtils();
  const organizations = trpc.organizations.listMine.useQuery();
  const organizationEntry = organizations.data?.[0];
  const organization = organizationEntry?.organization;
  const role = organizationEntry?.membership.role;
  const canManageOrganization = role === "OWNER";
  const billing = trpc.billing.ownerStatus.useQuery({ organizationId: organization?.id ?? "" }, { enabled: Boolean(organization?.id && canManageOrganization) });
  const workspaceStatus = trpc.billing.workspaceStatus.useQuery({ organizationId: organization?.id ?? "" }, { enabled: Boolean(organization?.id) });
  const productivityPreferences = trpc.productivity.preferences.useQuery({ organizationId: organization?.id ?? "" }, { enabled: Boolean(organization?.id && role !== "STAFF") });
  const canConfirmAppointment = role === "OWNER" || role === "MANAGER";
  const canManageCalendar = canManageAppointmentQueue(role);
  const locations = trpc.organizations.listLocations.useQuery({ organizationId: organization?.id ?? "" }, { enabled: Boolean(organization?.id) });
  const [activeLocationId, setActiveLocationId] = useState("");
  const dashboardInput = useMemo(() => ({ organizationId: organization?.id ?? "", locationId: activeLocationId || undefined }), [organization?.id, activeLocationId]);
  const dashboard = trpc.appointments.dashboard.useQuery(dashboardInput, { enabled: Boolean(organization?.id) });
  const services = trpc.services.list.useQuery({ organizationId: organization?.id ?? "" }, { enabled: Boolean(organization?.id && canManageOrganization) });
  const team = trpc.staff.list.useQuery({ organizationId: organization?.id ?? "" }, { enabled: Boolean(organization?.id && canManageOrganization) });
  const workingHours = trpc.staff.listWorkingHours.useQuery({ organizationId: organization?.id ?? "" }, { enabled: Boolean(organization?.id && canManageOrganization) });
  const [locationOpen, setLocationOpen] = useState(false);
  const [locationName, setLocationName] = useState("");
  const [publicSlug, setPublicSlug] = useState("");
  const [address, setAddress] = useState("");
  const [locationError, setLocationError] = useState("");
  const [walkInMode, setWalkInMode] = useState(false);
  const [paymentTarget, setPaymentTarget] = useState<ReceivePaymentTarget | null>(null);

  useEffect(() => {
    if (!activeLocationId && locations.data?.[0]) setActiveLocationId(locations.data[0].id);
  }, [activeLocationId, locations.data]);

  const createLocation = trpc.organizations.createLocation.useMutation({
    onSuccess: async () => {
      await utils.organizations.listLocations.invalidate();
      setLocationName(""); setPublicSlug(""); setAddress(""); setLocationError(""); setLocationOpen(false);
      toast.success("ახალი ფილიალი დაემატა.");
    },
    onError: () => setLocationError("ფილიალის დამატება ვერ მოხერხდა. შეამოწმეთ, რომ საჯარო მისამართი უნიკალურია."),
  });
  const updateStatus = trpc.appointments.updateStatus.useMutation({
    onSuccess: async () => {
      await Promise.all([utils.appointments.dashboard.invalidate(), utils.appointments.listRange.invalidate()]);
      toast.success("ჯავშნის სტატუსი განახლდა.");
    },
    onError: () => toast.error("ჯავშნის სტატუსის განახლება ვერ მოხერხდა. სცადეთ ხელახლა."),
  });
  const submitLocation = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!organization) return;
    setLocationError("");
    createLocation.mutate({ organizationId: organization.id, name: locationName, publicSlug, timezone: "Asia/Tbilisi", address: address || undefined, bookingEnabled: true, slotIntervalMinutes: 15, minimumNoticeMinutes: 60, maximumAdvanceDays: 60, cancellationCutoffMinutes: 120 });
  };

  const appointments = dashboard.data?.appointments ?? [];
  const balanceByAppointment = new Map((dashboard.data?.balances ?? []).map(item => [item.appointmentId, item.totals]));
  const metrics = dashboard.data?.metrics ?? { scheduledTetri: 0, collectedTetri: 0, outstandingTetri: 0 };
  const timezone = dashboard.data?.location?.timezone ?? "Asia/Tbilisi";
  const dayStamp = dashboard.data?.dateKey ? (() => { const [, m, d] = dashboard.data.dateKey.split("-").map(Number) as [number, number, number]; return <>{DATE_NAMES.ka.weekdayFull[schemaWeekdayOf(dashboard.data.dateKey)]}, <span className="cwk-num">{d}</span> {DATE_NAMES.ka.monthFull[m - 1]}</>; })() : "მიმდინარე სამუშაო დღე";
  const activeLocation = locations.data?.find(location => location.id === (activeLocationId || locations.data?.[0]?.id));
  const defaultMetricKeys = [...dashboardMetricKeys(role)] as DashboardMetricKey[];
  const metricKeys = useMemo(() => {
    if (role === "STAFF") return [...defaultMetricKeys];
    const priority = (productivityPreferences.data?.metricKeys ?? []).filter((key): key is DashboardMetricKey => defaultMetricKeys.includes(key as DashboardMetricKey)).slice(0, 2);
    return [...priority, ...defaultMetricKeys.filter(key => !priority.includes(key))];
  }, [defaultMetricKeys, productivityPreferences.data?.metricKeys, role]);
  const operationalFocus = nextOperationalAppointment(appointments) as TodayFocus;
  // The next appointment is already shown in the NOW/NEXT row, so the cue only says when the day is done.
  const timelineCue = useMemo(() => {
    const now = Date.now();
    const active = appointments.find(appointment => new Date(appointment.startsAt).getTime() <= now && new Date(appointment.endsAt).getTime() > now && !["CANCELLED", "NO_SHOW", "COMPLETED"].includes(appointment.status));
    const anchor = active ? new Date(active.endsAt).getTime() : now;
    const following = appointments.find(appointment => new Date(appointment.startsAt).getTime() >= anchor && !["CANCELLED", "NO_SHOW", "COMPLETED"].includes(appointment.status));
    return following ? null : "დღეს მეტი ჯავშანი აღარ არის.";
  }, [appointments]);
  const pendingCount = (dashboard.data?.counts as Record<string, number> | undefined)?.PENDING ?? 0;
  const nonStaffAttention = role !== "STAFF";
  const workspaceLocked = Boolean(workspaceStatus.data?.locked);
  const memberWorkspaceLocked = Boolean(!canManageOrganization && workspaceStatus.data?.locked);
  const activeAccessEndsAt = billing.data?.activeEndsAt ? new Date(billing.data.activeEndsAt) : null;
  const activeAccessDaysRemaining = activeAccessEndsAt ? Math.ceil((activeAccessEndsAt.getTime() - Date.now()) / 86_400_000) : null;
  const showAccessExpiryReminder = Boolean(canManageOrganization && activeAccessDaysRemaining != null && activeAccessDaysRemaining > 0 && activeAccessDaysRemaining <= 3 && !workspaceLocked);
  const readinessLoading = services.isLoading || team.isLoading || workingHours.isLoading;
  const completedCount = appointments.filter(appointment => appointment.status === "COMPLETED").length;
  const canCloseDay = role === "OWNER" || role === "MANAGER" || role === "RECEPTIONIST";
  const notifications = [
    pendingCount ? { key: `pending:${dashboard.data?.dateKey ?? "today"}`, title: "მომლოდინე ჯავშნები", description: `${pendingCount} ჯავშანს დადასტურება სჭირდება.`, href: "/app/calendar", tone: "warning" as const } : null,
    nonStaffAttention && metrics.outstandingTetri ? { key: `outstanding:${dashboard.data?.dateKey ?? "today"}`, title: "დარჩენილი ბალანსი", description: `${money(metrics.outstandingTetri)} ჯერ არ არის გადახდილი.`, href: canManageOrganization ? "/app/reports" : "/app/pos", tone: "warning" as const } : null,
    showAccessExpiryReminder ? { key: `access:${activeAccessEndsAt?.toISOString() ?? ""}`, title: "პაკეტის წვდომა იწურება", description: `დარჩენილია ${activeAccessDaysRemaining} დღე.`, href: "/app/billing", tone: "info" as const } : null,
  ].filter((notice): notice is { key: string; title: string; description: string; href: string; tone: "warning" | "info" } => Boolean(notice));
  const copyBookingLink = async () => {
    if (!activeLocation?.publicSlug) return;
    try { await navigator.clipboard.writeText(`${window.location.origin}/book/${activeLocation.publicSlug}`); toast.success("ჩაწერის ბმული დაკოპირდა."); } catch { toast.error("ბმულის დაკოპირება ვერ მოხერხდა."); }
  };
  const canWalkIn = Boolean(canManageCalendar && activeLocation);
  const pageTitle = role === "STAFF" ? "ჩემი დღე" : "დღეს";

  if (workspaceLocked && organization) return <DashboardLayout><div className="sf-workspace-page mx-auto w-full max-w-4xl space-y-4"><WorkspacePageHeader title="წვდომა დასრულებულია" description="მონაცემები შენახულია. გასააქტიურებლად ატვირთეთ გადარიცხვის ქვითარი." /><WorkspaceSection title="გააქტიურება"><p className="text-sm text-muted-foreground">სალონის კოდი: <strong className="cwk-num text-foreground">{billing.data?.organization.billingCode ?? "—"}</strong></p><Button asChild className="mt-4"><Link href="/app/billing">1-თვიანი პაკეტის გააქტიურება</Link></Button></WorkspaceSection></div></DashboardLayout>;
  if (memberWorkspaceLocked && organization) return <DashboardLayout><div className="sf-workspace-page mx-auto w-full max-w-4xl"><WorkspaceState kind="empty" title="წვდომა დასრულებულია" description="გადახდას მართავს მხოლოდ სალონის მფლობელი. დაუკავშირდით მას." /></div></DashboardLayout>;
  return <DashboardLayout><div className="sf-workspace-page mx-auto w-full max-w-7xl space-y-4">
    <WorkspacePageHeader title={pageTitle} description="დღის ჯავშნები, გადასახდელი და ის, რასაც ყურადღება სჭირდება." moreActions={activeLocation?.publicSlug && role !== "STAFF" ? <DropdownMenuItem onSelect={() => { void copyBookingLink(); }}><Link2 className="size-4" aria-hidden="true" />ჩაწერის ბმულის კოპირება</DropdownMenuItem> : undefined} actions={<>
      <span className="hidden text-sm font-semibold text-muted-foreground sm:inline">{dayStamp}</span>
      {organization ? <NotificationCenter organizationId={organization.id} notices={notifications} /> : null}
      {organization && role !== "STAFF" ? <MetricPreferenceMenu organizationId={organization.id} allowedKeys={defaultMetricKeys} selectedKeys={metricKeys.slice(0, 2)} /> : null}
      {locations.data?.length ? <Select value={activeLocationId || locations.data[0]?.id} onValueChange={value => { if (value === ADD_LOCATION) { setLocationError(""); setLocationOpen(true); } else setActiveLocationId(value); }}><SelectTrigger className="min-w-0 flex-1 bg-card sm:w-auto sm:min-w-44 sm:flex-none" aria-label="აქტიური ფილიალი"><MapPin className="mr-2 h-4 w-4 shrink-0 text-[var(--sf-accent-ink)]" aria-hidden="true" /><SelectValue placeholder="აირჩიეთ ფილიალი" /></SelectTrigger><SelectContent>{locations.data.map(location => <SelectItem key={location.id} value={location.id}>{location.name}</SelectItem>)}{organization && canManageOrganization ? <SelectItem value={ADD_LOCATION}>+ ფილიალის დამატება</SelectItem> : null}</SelectContent></Select> : organization && canManageOrganization && !locations.isLoading ? <Button variant="outline" onClick={() => { setLocationError(""); setLocationOpen(true); }}><Plus className="mr-2 h-4 w-4" aria-hidden="true" />ფილიალი</Button> : null}
      {canWalkIn ? <Button type="button" variant="outline" aria-expanded={walkInMode} onClick={() => setWalkInMode(open => !open)} className="max-sm:min-h-11"><UserPlus className="size-4" aria-hidden="true" />ადგილზე მოსულის ჩაწერა</Button> : null}
      {canManageCalendar ? <Button asChild className="max-sm:order-first max-sm:min-h-12 max-sm:w-full"><Link href="/app/calendar?create=1"><Plus className="size-4" aria-hidden="true" />ჯავშანი</Link></Button> : null}
    </>} />
    <p className="-mt-2 text-sm font-semibold text-muted-foreground sm:hidden">{dayStamp}</p>
    {showAccessExpiryReminder ? <AccessExpiryNotice daysRemaining={activeAccessDaysRemaining} /> : null}
    {organizations.isLoading ? <WorkspaceState kind="loading" title="იტვირთება…" /> : null}
    {organizations.isError ? <WorkspaceState kind="error" title="მონაცემები მიუწვდომელია" description="სცადეთ ხელახლა." /> : null}
    {!organizations.isLoading && !organizations.isError && !organization ? <WorkspaceState kind="empty" title="შექმენით პირველი სამუშაო სივრცე" action={<Button asChild><Link href="/app/setup">სამუშაო სივრცის შექმნა</Link></Button>} /> : null}
    {organization ? <>
      {locations.isLoading || dashboard.isLoading ? <WorkspaceState kind="loading" title="იტვირთება…" /> : null}
      {locations.isError || dashboard.isError ? <WorkspaceState kind="error" title="დღის მონაცემები ვერ ჩაიტვირთა" description="შეამოწმეთ კავშირი." action={<Button variant="outline" onClick={() => { void dashboard.refetch(); }}>განახლება</Button>} /> : null}
      {!locations.isLoading && !dashboard.isLoading && !locations.data?.length ? <WorkspaceState kind="empty" title="ფილიალი ჯერ არ არის" description="დღის სანახავად დაამატეთ ფილიალი." /> : null}
      {!locations.isLoading && !dashboard.isLoading && locations.data?.length ? <>
        {canWalkIn && walkInMode && activeLocation ? <WalkInQuickEntry organizationId={organization.id} locationId={activeLocation.id} timeZone={activeLocation.timezone} open={walkInMode} onOpenChange={setWalkInMode} /> : null}
        {canManageOrganization && !readinessLoading && activeLocation ? <StartHere organizationId={organization.id} locationId={activeLocation.id} publicSlug={activeLocation.publicSlug} servicesDone={Boolean(services.data?.length)} teamDone={Boolean(team.data?.length)} hoursDone={Boolean(workingHours.data?.length)} /> : null}
        {role === "STAFF" ? <StaffTip organizationId={organization.id} /> : null}
        <CompactMetricRail>{metricKeys.map(metricKey => <DashboardMetric key={metricKey} metricKey={metricKey} appointmentCount={appointments.length} pendingCount={pendingCount} scheduledTetri={metrics.scheduledTetri} outstandingTetri={metrics.outstandingTetri} focus={operationalFocus} timezone={timezone} />)}</CompactMetricRail>
        {appointments.length ? <NowNextRow focus={operationalFocus} timezone={timezone} timelineCue={timelineCue} /> : null}
        {!dashboard.isError && dashboard.data?.location && appointments.length === 0 ? <WorkspaceState kind="empty" title="დღეს ჯავშანი არ არის" description={canManageCalendar ? "ახალი ჯავშნისთვის დააჭირეთ „+ ჯავშანი“-ს." : "ჯავშნები აქ გამოჩნდება."} action={role === "STAFF" ? <Button asChild variant="outline"><Link href="/app/calendar">ჩემი კალენდარი</Link></Button> : undefined} /> : null}
        {!dashboard.isError && appointments.length ? <WorkspaceSection title="დღის ჯავშნები" description={dashboard.data?.location?.name} action={<WorkspaceStatusPill tone="count"><span className="cwk-num">{appointments.length}</span>&nbsp;ჯავშანი</WorkspaceStatusPill>}><WorkspaceRevealScope><div className="divide-y divide-border">{appointments.map((appointment, index) => { const balance = balanceByAppointment.get(appointment.id); const balanceTetri = balance?.balanceTetri ?? appointment.totalTetri; const clientName = appointment.client ? `${appointment.client.firstName} ${appointment.client.lastName ?? ""}`.trim() : "კლიენტი მითითებული არ არის"; return <WorkspaceRevealItem key={appointment.id} index={index} as="article" className="sf-queue-item grid grid-cols-[4.25rem_minmax(0,1fr)] gap-x-3 gap-y-2 py-3 lg:grid-cols-[4.25rem_minmax(0,1fr)_auto] lg:items-center"><div className="cwk-num"><p className="text-base font-semibold text-foreground">{formatTimeInTimeZone(new Date(appointment.startsAt), timezone)}</p><p className="text-xs text-muted-foreground">{formatTimeInTimeZone(new Date(appointment.endsAt), timezone)}</p></div><div className="min-w-0"><div className="flex flex-wrap items-center gap-x-2 gap-y-1"><p className="font-semibold">{clientName}</p><StatusPill status={appointment.status} /><WorkspaceStatusPill tone="neutral">{(appointment.payment?.state ?? "UNPAID") === "UNPAID" ? <Wallet aria-hidden="true" /> : null}{formatPaymentState(appointment.payment?.state)}</WorkspaceStatusPill></div><p className="mt-0.5 text-sm text-muted-foreground">{appointment.services.map(service => service.serviceNameSnapshot).join(", ") || "სერვისი მითითებული არ არის"} · {appointment.staff.publicDisplayName}{role !== "STAFF" ? <> · <span className="cwk-num whitespace-nowrap text-foreground">{money(appointment.totalTetri)}</span>{balanceTetri !== appointment.totalTetri ? <> (ნაშთი <span className="cwk-num whitespace-nowrap">{money(balanceTetri)}</span>)</> : null}</> : null}</p></div><div className="col-span-2 flex flex-wrap items-center gap-2 lg:col-span-1 lg:justify-end"><ClinicalRecordsButton appointment={appointment} /><AppointmentQuickAction role={canConfirmAppointment ? role : "STAFF"} status={appointment.status} cardHeight={72} context="today" disabled={updateStatus.isPending} onAction={() => updateStatus.mutate({ organizationId: organization.id, appointmentId: appointment.id, nextStatus: appointment.status === "PENDING" ? "CONFIRMED" : appointment.status === "CONFIRMED" ? "CHECKED_IN" : appointment.status === "CHECKED_IN" ? "IN_SERVICE" : "COMPLETED" })} className="cwk-stampbtn max-md:min-h-11 disabled:cursor-not-allowed disabled:opacity-60" />{canReceivePayment(role, appointment.status, balanceTetri) ? <Button type="button" variant="outline" size="sm" className="max-md:min-h-11" onClick={() => setPaymentTarget({ id: appointment.id, clientName, detail: appointment.services.map(service => service.serviceNameSnapshot).join(", ") || undefined, totalTetri: appointment.totalTetri, balanceTetri })}><Wallet className="size-4" aria-hidden="true" />გადახდის მიღება</Button> : null}</div></WorkspaceRevealItem>; })}</div></WorkspaceRevealScope></WorkspaceSection> : null}
        {organization && dashboard.data?.location && dashboard.data.dateKey ? <DayCloseChecklist organizationId={organization.id} locationId={dashboard.data.location.id} businessDate={dashboard.data.dateKey} locationName={dashboard.data.location.name} timezone={timezone} pendingCount={pendingCount} completedCount={completedCount} outstandingLabel={money(metrics.outstandingTetri)} outstandingTetri={metrics.outstandingTetri} canClose={canCloseDay} /> : null}
      </> : null}
    </> : null}
  </div>{organization && paymentTarget ? <ReceivePaymentDialog key={paymentTarget.id} organizationId={organization.id} target={paymentTarget} onClose={() => setPaymentTarget(null)} /> : null}<Dialog open={locationOpen} onOpenChange={setLocationOpen}><DialogContent><DialogHeader><DialogTitle>ფილიალის დამატება</DialogTitle><DialogDescription>საჯარო მისამართი გამოიყენება ჩაწერის ბმულში.</DialogDescription></DialogHeader><form onSubmit={submitLocation} className="space-y-4"><div className="space-y-2"><Label htmlFor="new-location-name">ფილიალის სახელი</Label><Input id="new-location-name" value={locationName} onChange={event => setLocationName(event.target.value)} placeholder="მაგ. საბურთალოს ფილიალი" minLength={2} maxLength={160} required /></div><div className="space-y-2"><Label htmlFor="new-location-slug">საჯარო მისამართი</Label><Input id="new-location-slug" value={publicSlug} onChange={event => setPublicSlug(event.target.value.toLowerCase())} placeholder="salon-saburtalo" spellCheck={false} autoComplete="off" autoCapitalize="none" aria-describedby="new-location-slug-hint" pattern="[a-z0-9]+(-[a-z0-9]+)*" minLength={3} maxLength={96} required /><p id="new-location-slug-hint" className="text-xs text-muted-foreground">მხოლოდ ლათინური პატარა ასოები, ციფრები და ტირე. ბმული: <span className="cwk-num">/book/{publicSlug || "სალონის-მისამართი"}</span></p></div><div className="space-y-2"><Label htmlFor="new-location-address">მისამართი <span className="text-muted-foreground">(არასავალდებულო)</span></Label><Input id="new-location-address" value={address} onChange={event => setAddress(event.target.value)} maxLength={1200} /></div><p className="flex items-center gap-2 text-sm text-muted-foreground"><MapPin className="h-4 w-4 text-primary" />დროის სარტყელი: თბილისი</p>{locationError ? <p role="alert" className="text-sm text-destructive">{locationError}</p> : null}<DialogFooter><Button type="submit" disabled={createLocation.isPending}>{createLocation.isPending ? "ინახება…" : "შენახვა"}</Button></DialogFooter></form></DialogContent></Dialog></DashboardLayout>;
}

function AccessExpiryNotice({ daysRemaining }: { daysRemaining: number | null }) {
  return <PriorityModule title={`პაკეტის წვდომა იწურება ${daysRemaining} დღეში`} icon={ReceiptText} action={<Button asChild variant="outline" size="sm" className="max-md:h-11"><Link href="/app/billing">პაკეტის ნახვა</Link></Button>} />;
}

function NowNextRow({ focus, timezone, timelineCue }: { focus: TodayFocus; timezone: string; timelineCue: string | null }) {
  const appointment = focus?.appointment;
  const clientName = appointment?.client ? `${appointment.client.firstName} ${appointment.client.lastName ?? ""}`.trim() : "კლიენტი მითითებული არ არის";
  return <section aria-label="ახლა და შემდეგი" className="cwk-sheet flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-3">
    <span className="text-sm font-extrabold text-[var(--sf-accent-ink)]">{focus?.kind === "NOW" ? "ახლა" : "შემდეგი ჯავშანი"}</span>
    {appointment ? <>
      <span className="cwk-num text-sm font-semibold">{formatTimeInTimeZone(new Date(appointment.startsAt), timezone)}–{formatTimeInTimeZone(new Date(appointment.endsAt), timezone)}</span>
      <span className="font-semibold">{clientName}</span>
      <StatusPill status={appointment.status} />
      <span className="min-w-0 truncate text-sm text-muted-foreground">{appointment.services.map(service => service.serviceNameSnapshot).join(", ") || "სერვისი მითითებული არ არის"} · {appointment.staff.publicDisplayName}</span>
    </> : <span className="text-sm text-muted-foreground">თავისუფალი დროა</span>}
    {timelineCue ? <span className="text-xs text-muted-foreground sm:ml-auto">{timelineCue}</span> : null}
  </section>;
}

function DashboardMetric({ metricKey, appointmentCount, pendingCount, scheduledTetri, outstandingTetri, focus, timezone }: { metricKey: ReturnType<typeof dashboardMetricKeys>[number]; appointmentCount: number; pendingCount: number; scheduledTetri: number; outstandingTetri: number; focus: TodayFocus; timezone: string }) {
  if (metricKey === "BOOKINGS") return <MetricCell label="ჯავშნები" value={String(appointmentCount)} />;
  if (metricKey === "PENDING") return <MetricCell label="მოლოდინში" value={String(pendingCount)} />;
  if (metricKey === "SCHEDULED") return <MetricCell label="დაგეგმილი თანხა" value={money(scheduledTetri)} />;
  if (metricKey === "OUTSTANDING") return <MetricCell label="დარჩენილი ბალანსი" value={money(outstandingTetri)} />;
  return <MetricCell label="შემდეგი დრო" value={focus ? formatTimeInTimeZone(new Date(focus.appointment.startsAt), timezone) : "—"} />;
}

function StatusPill({ status }: { status: string }) {
  return <WorkspaceStatusPill status={status as WorkspaceStatus} />;
}
