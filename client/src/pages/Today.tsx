import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AppointmentQuickAction } from "@/components/AppointmentQuickAction";
import { ClinicalRecordsButton } from "@/components/clinical/ClinicalRecordsButton";
import { WalkInQuickEntry } from "@/components/WalkInQuickEntry";
import { WorkspacePageHeader, WorkspaceSection, WorkspaceState, WorkspaceStatusPill } from "@/components/workspace/WorkspacePrimitives";
import { ActionTile, CompactMetricRail, MetricCell, PriorityModule } from "@/components/workspace/DashboardModules";
import { DayCloseChecklist, NotificationCenter } from "@/components/workspace/DailyControl";
import { MetricPreferenceMenu } from "@/components/workspace/MetricPreferenceMenu";
import { trpc } from "@/lib/trpc";
import { dashboardMetricKeys, dashboardQuickActions, nextOperationalAppointment } from "@/lib/dashboardExperience";
import { canManageAppointmentQueue } from "@/lib/appointmentPresentation";
import { formatGelTetri, formatPaymentState } from "@/lib/presentation";
import { DATE_NAMES, schemaWeekdayOf } from "@/components/public/BookingPrimitives";
import { formatTimeInTimeZone } from "@shared/timezones";
import { CalendarCheck2, CalendarDays, CircleAlert, Link2, MapPin, Plus, ReceiptText, Scissors, UserPlus, UsersRound } from "lucide-react";
import React, { FormEvent, useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { toast } from "sonner";

const statusLabels: Record<string, string> = { PENDING: "დადასტურებას ელოდება", CONFIRMED: "დადასტურებული", CHECKED_IN: "მიღებულია", IN_SERVICE: "მომსახურებაშია", COMPLETED: "დასრულებული", CANCELLED: "გაუქმებული", NO_SHOW: "არ გამოცხადდა" };

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
  const quickActions = dashboardQuickActions(role, Boolean(activeLocation));
  const defaultMetricKeys = [...dashboardMetricKeys(role)] as DashboardMetricKey[];
  const metricKeys = useMemo(() => {
    if (role === "STAFF") return [...defaultMetricKeys];
    const priority = (productivityPreferences.data?.metricKeys ?? []).filter((key): key is DashboardMetricKey => defaultMetricKeys.includes(key as DashboardMetricKey)).slice(0, 2);
    return [...priority, ...defaultMetricKeys.filter(key => !priority.includes(key))];
  }, [defaultMetricKeys, productivityPreferences.data?.metricKeys, role]);
  const operationalFocus = nextOperationalAppointment(appointments) as TodayFocus;
  const timelineCue = useMemo(() => {
    const now = Date.now();
    const active = appointments.find(appointment => new Date(appointment.startsAt).getTime() <= now && new Date(appointment.endsAt).getTime() > now && !["CANCELLED", "NO_SHOW", "COMPLETED"].includes(appointment.status));
    const anchor = active ? new Date(active.endsAt).getTime() : now;
    const following = appointments.find(appointment => new Date(appointment.startsAt).getTime() >= anchor && !["CANCELLED", "NO_SHOW", "COMPLETED"].includes(appointment.status));
    if (active) return following ? `შემდეგი: ${formatTimeInTimeZone(new Date(following.startsAt), timezone)}` : "დღეს მეტი ჯავშანი არ არის";
    return following ? `თავისუფალი დრო → ${formatTimeInTimeZone(new Date(following.startsAt), timezone)}` : "დღეს მეტი ჯავშანი არ არის";
  }, [appointments, timezone]);
  const pendingCount = (dashboard.data?.counts as Record<string, number> | undefined)?.PENDING ?? 0;
  const nonStaffAttention = role !== "STAFF";
  const workspaceLocked = Boolean(workspaceStatus.data?.locked);
  const memberWorkspaceLocked = Boolean(!canManageOrganization && workspaceStatus.data?.locked);
  const activeAccessEndsAt = billing.data?.activeEndsAt ? new Date(billing.data.activeEndsAt) : null;
  const activeAccessDaysRemaining = activeAccessEndsAt ? Math.ceil((activeAccessEndsAt.getTime() - Date.now()) / 86_400_000) : null;
  const showAccessExpiryReminder = Boolean(canManageOrganization && activeAccessDaysRemaining != null && activeAccessDaysRemaining > 0 && activeAccessDaysRemaining <= 3 && !workspaceLocked);
  const readinessLoading = services.isLoading || team.isLoading || workingHours.isLoading;
  const readiness = canManageOrganization && !readinessLoading ? [
    { key: "service", complete: Boolean(services.data?.length), title: "სერვისები", detail: "ფასი და ხანგრძლივობა", href: "/app/services", cta: "სერვისები" },
    { key: "team", complete: Boolean(team.data?.length), title: "გუნდი", detail: "სპეციალისტი და ფილიალი", href: "/app/staff", cta: "გუნდი" },
    { key: "hours", complete: Boolean(workingHours.data?.length), title: "სამუშაო საათები", detail: "ჩაწერის დრო", href: "/app/staff", cta: "საათები" },
    { key: "link", complete: Boolean(activeLocation?.publicSlug), title: "ჩაწერის ბმული", detail: "გასაზიარებლად", href: "/app/settings", cta: "ბმული" },
  ].filter(item => !item.complete) : [];
  const completedCount = appointments.filter(appointment => appointment.status === "COMPLETED").length;
  const canCloseDay = role === "OWNER" || role === "MANAGER" || role === "RECEPTIONIST";
  const notifications = [
    pendingCount ? { key: `pending:${dashboard.data?.dateKey ?? "today"}`, title: "მომლოდინე ჯავშნები", description: `${pendingCount} ჯავშანს დადასტურება სჭირდება.`, href: "/app/calendar", tone: "warning" as const } : null,
    nonStaffAttention && metrics.outstandingTetri ? { key: `outstanding:${dashboard.data?.dateKey ?? "today"}`, title: "დარჩენილი ბალანსი", description: `${money(metrics.outstandingTetri)} ჯერ არ არის გადახდილი.`, href: "/app/reports", tone: "warning" as const } : null,
    showAccessExpiryReminder ? { key: `access:${activeAccessEndsAt?.toISOString() ?? ""}`, title: "პაკეტის წვდომა იწურება", description: `დარჩენილია ${activeAccessDaysRemaining} დღე.`, href: "/app/billing", tone: "info" as const } : null,
    canManageOrganization && readiness.length ? { key: `readiness:${readiness.map(item => item.key).join("-")}`, title: "სალონის მზადყოფნა", description: `დასასრულებელია ${readiness.length} ნაბიჯი.`, href: readiness[0]?.href ?? "/app/settings", tone: "info" as const } : null,
  ].filter((notice): notice is { key: string; title: string; description: string; href: string; tone: "warning" | "info" } => Boolean(notice));
  const emptyNextAction = role === "OWNER" && readiness[0] ? { href: readiness[0].href, label: readiness[0].cta } : role === "STAFF" ? { href: "/app/calendar", label: "ჩემი კალენდარი" } : { href: "/app/calendar", label: "კალენდრის გახსნა" };

  if (workspaceLocked && organization) return <DashboardLayout><div className="sf-workspace-page mx-auto w-full max-w-4xl space-y-4"><WorkspacePageHeader title="წვდომა დასრულებულია" description="მონაცემები შენახულია. გასააქტიურებლად ატვირთეთ გადარიცხვის ქვითარი." /><WorkspaceSection title="გააქტიურება"><p className="text-sm text-muted-foreground">სალონის კოდი: <strong className="font-mono text-foreground">{billing.data?.organization.billingCode ?? "—"}</strong></p><Button asChild className="mt-4"><Link href="/app/billing">1-თვიანი პაკეტის გააქტიურება</Link></Button></WorkspaceSection></div></DashboardLayout>;
  if (memberWorkspaceLocked && organization) return <DashboardLayout><div className="sf-workspace-page mx-auto w-full max-w-4xl"><WorkspaceState kind="empty" title="წვდომა დასრულებულია" description="გადახდას მართავს მხოლოდ სალონის მფლობელი. დაუკავშირდით მას." /></div></DashboardLayout>;
  return <DashboardLayout><div className="sf-workspace-page mx-auto w-full max-w-7xl space-y-4">
    <WorkspacePageHeader title="დღეს" actions={<><span className="text-sm font-semibold text-muted-foreground">{dayStamp}</span>{organization ? <NotificationCenter organizationId={organization.id} notices={notifications} /> : null}{organization && role !== "STAFF" ? <MetricPreferenceMenu organizationId={organization.id} allowedKeys={defaultMetricKeys} selectedKeys={metricKeys.slice(0, 2)} /> : null}{locations.data?.length ? <Select value={activeLocationId || locations.data[0]?.id} onValueChange={setActiveLocationId}><SelectTrigger className="min-w-44 bg-card" aria-label="აქტიური ფილიალი"><MapPin className="mr-2 h-4 w-4 text-primary" /><SelectValue placeholder="აირჩიეთ ფილიალი" /></SelectTrigger><SelectContent>{locations.data.map(location => <SelectItem key={location.id} value={location.id}>{location.name}</SelectItem>)}</SelectContent></Select> : null}{organization && canManageOrganization ? <Button variant="outline" onClick={() => { setLocationError(""); setLocationOpen(true); }}><Plus className="mr-2 h-4 w-4" />ფილიალი</Button> : null}</>} />
    {organizations.isLoading ? <WorkspaceState kind="loading" title="იტვირთება…" /> : null}
    {organizations.isError ? <WorkspaceState kind="error" title="მონაცემები მიუწვდომელია" description="სცადეთ ხელახლა." /> : null}
    {!organizations.isLoading && !organizations.isError && !organization ? <WorkspaceState kind="empty" title="შექმენით პირველი სამუშაო სივრცე" action={<Button asChild><Link href="/app/setup">სამუშაო სივრცის შექმნა</Link></Button>} /> : null}
    {organization ? <>
      {locations.isLoading || dashboard.isLoading ? <WorkspaceState kind="loading" title="იტვირთება…" /> : null}
      {locations.isError || dashboard.isError ? <WorkspaceState kind="error" title="დღის მონაცემები ვერ ჩაიტვირთა" description="შეამოწმეთ კავშირი." action={<Button variant="outline" onClick={() => { void dashboard.refetch(); }}>განახლება</Button>} /> : null}
      {!locations.isLoading && !dashboard.isLoading && !locations.data?.length ? <WorkspaceState kind="empty" title="ფილიალი ჯერ არ არის" description="დღის სანახავად დაამატეთ ფილიალი." /> : null}
      {!locations.isLoading && !dashboard.isLoading && locations.data?.length ? <>
        <CompactMetricRail>{metricKeys.map(metricKey => <DashboardMetric key={metricKey} metricKey={metricKey} appointmentCount={appointments.length} pendingCount={pendingCount} scheduledTetri={metrics.scheduledTetri} outstandingTetri={metrics.outstandingTetri} focus={operationalFocus} timezone={timezone} />)}</CompactMetricRail>
        {appointments.length ? <NowNextRow focus={operationalFocus} timezone={timezone} timelineCue={timelineCue} /> : null}
        {!dashboard.isError && dashboard.data?.location && appointments.length === 0 ? <WorkspaceState kind="empty" title="დღეს ჯავშანი არ არის" description={role === "OWNER" ? "ონლაინ ჩაწერის გასაშვებად გააგრძელეთ მომდევნო ნაბიჯით." : undefined} action={<Button asChild variant="outline"><Link href={emptyNextAction.href}>{emptyNextAction.label}</Link></Button>} /> : null}
        {!dashboard.isError && appointments.length ? <WorkspaceSection title="დღის რიგი" description={dashboard.data?.location?.name} action={<WorkspaceStatusPill tone="neutral"><span className="cwk-num">{appointments.length}</span>&nbsp;ჯავშანი</WorkspaceStatusPill>}><div className="divide-y divide-border">{appointments.map(appointment => { const balance = balanceByAppointment.get(appointment.id); const balanceTetri = balance?.balanceTetri ?? appointment.totalTetri; const clientName = appointment.client ? `${appointment.client.firstName} ${appointment.client.lastName ?? ""}`.trim() : "კლიენტი მითითებული არ არის"; return <article key={appointment.id} className="sf-queue-item grid grid-cols-[4.25rem_minmax(0,1fr)] gap-x-3 gap-y-2 py-3 lg:grid-cols-[4.25rem_minmax(0,1fr)_auto] lg:items-center"><div className="font-mono"><p className="text-base font-semibold text-foreground">{formatTimeInTimeZone(new Date(appointment.startsAt), timezone)}</p><p className="text-xs text-muted-foreground">{formatTimeInTimeZone(new Date(appointment.endsAt), timezone)}</p></div><div className="min-w-0"><div className="flex flex-wrap items-center gap-x-2 gap-y-1"><p className="font-semibold">{clientName}</p><StatusPill status={appointment.status} /><WorkspaceStatusPill tone="neutral">{formatPaymentState(appointment.payment?.state)}</WorkspaceStatusPill></div><p className="mt-0.5 text-sm text-muted-foreground">{appointment.services.map(service => service.serviceNameSnapshot).join(", ") || "სერვისი მითითებული არ არის"} · {appointment.staff.publicDisplayName}{role !== "STAFF" ? <> · <span className="cwk-num whitespace-nowrap text-foreground">{money(appointment.totalTetri)}</span>{balanceTetri !== appointment.totalTetri ? <> (ნაშთი <span className="cwk-num whitespace-nowrap">{money(balanceTetri)}</span>)</> : null}</> : null}</p></div><div className="col-span-2 flex flex-wrap items-center gap-2 lg:col-span-1 lg:justify-end"><ClinicalRecordsButton appointment={appointment} /><AppointmentQuickAction role={canConfirmAppointment ? role : "STAFF"} status={appointment.status} cardHeight={72} context="today" disabled={updateStatus.isPending} onAction={() => updateStatus.mutate({ organizationId: organization.id, appointmentId: appointment.id, nextStatus: appointment.status === "PENDING" ? "CONFIRMED" : appointment.status === "CONFIRMED" ? "CHECKED_IN" : appointment.status === "CHECKED_IN" ? "IN_SERVICE" : "COMPLETED" })} className="inline-flex h-10 items-center rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:opacity-60" /></div></article>; })}</div></WorkspaceSection> : null}
        {(showAccessExpiryReminder || (canManageOrganization && readiness.length)) ? <SalonStatusPanel accessDaysRemaining={showAccessExpiryReminder ? activeAccessDaysRemaining : null} readiness={canManageOrganization ? readiness : []} /> : null}
        {organization && dashboard.data?.location && dashboard.data.dateKey ? <DayCloseChecklist organizationId={organization.id} locationId={dashboard.data.location.id} businessDate={dashboard.data.dateKey} locationName={dashboard.data.location.name} timezone={timezone} pendingCount={pendingCount} completedCount={completedCount} outstandingLabel={money(metrics.outstandingTetri)} outstandingTetri={metrics.outstandingTetri} canClose={canCloseDay} /> : null}
        <QuickActions actions={quickActions} onWalkIn={() => setWalkInMode(true)} />
        {canManageCalendar && activeLocation ? <WalkInQuickEntry organizationId={organization.id} locationId={activeLocation.id} open={walkInMode} onOpenChange={setWalkInMode} /> : null}
      </> : null}
    </> : null}
  </div><Dialog open={locationOpen} onOpenChange={setLocationOpen}><DialogContent><DialogHeader><DialogTitle>ფილიალის დამატება</DialogTitle><DialogDescription>საჯარო მისამართი გამოიყენება ჩაწერის ბმულში.</DialogDescription></DialogHeader><form onSubmit={submitLocation} className="space-y-4"><div className="space-y-2"><Label htmlFor="new-location-name">ფილიალის სახელი</Label><Input id="new-location-name" value={locationName} onChange={event => setLocationName(event.target.value)} placeholder="მაგ. საბურთალოს ფილიალი" minLength={2} maxLength={160} required /></div><div className="space-y-2"><Label htmlFor="new-location-slug">საჯარო მისამართი</Label><Input id="new-location-slug" value={publicSlug} onChange={event => setPublicSlug(event.target.value.toLowerCase())} placeholder="salon-saburtalo" pattern="[a-z0-9]+(-[a-z0-9]+)*" minLength={3} maxLength={96} required /><p className="font-mono text-xs text-muted-foreground">/book/{publicSlug || "your-salon"}</p></div><div className="space-y-2"><Label htmlFor="new-location-address">მისამართი <span className="text-muted-foreground">(არასავალდებულო)</span></Label><Input id="new-location-address" value={address} onChange={event => setAddress(event.target.value)} maxLength={1200} /></div><p className="flex items-center gap-2 text-sm text-muted-foreground"><MapPin className="h-4 w-4 text-primary" />დროის სარტყელი: თბილისი</p>{locationError ? <p className="text-sm text-destructive">{locationError}</p> : null}<DialogFooter><Button type="submit" disabled={createLocation.isPending}>{createLocation.isPending ? "ინახება…" : "შენახვა"}</Button></DialogFooter></form></DialogContent></Dialog></DashboardLayout>;
}

function SalonStatusPanel({ accessDaysRemaining, readiness }: { accessDaysRemaining: number | null; readiness: Array<{ key: string; title: string; detail: string; href: string; cta: string }> }) {
  const hasRenewal = accessDaysRemaining != null && accessDaysRemaining > 0;
  return <PriorityModule title={hasRenewal ? `პაკეტის წვდომა იწურება ${accessDaysRemaining} დღეში` : "სალონის მზადყოფნა"} icon={hasRenewal ? ReceiptText : CircleAlert} action={hasRenewal ? <Button asChild variant="outline" size="sm"><Link href="/app/billing">პაკეტის ნახვა</Link></Button> : <WorkspaceStatusPill tone="neutral"><span className="cwk-num">{readiness.length}</span>&nbsp;ნაბიჯი</WorkspaceStatusPill>}>
    {readiness.length ? <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
      {readiness.map(item => <ActionTile key={item.key} icon={CircleAlert} label={item.title} hint={item.detail} href={item.href} />)}
    </div> : null}
  </PriorityModule>;
}

function NowNextRow({ focus, timezone, timelineCue }: { focus: TodayFocus; timezone: string; timelineCue: string }) {
  const appointment = focus?.appointment;
  const clientName = appointment?.client ? `${appointment.client.firstName} ${appointment.client.lastName ?? ""}`.trim() : "კლიენტი მითითებული არ არის";
  return <section aria-label="ახლა და შემდეგი" className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-md border border-border bg-card px-3 py-2.5">
    <span className="text-sm font-extrabold text-primary">{focus?.kind === "NOW" ? "ახლა" : "შემდეგი"}</span>
    {appointment ? <>
      <span className="font-mono text-sm font-semibold">{formatTimeInTimeZone(new Date(appointment.startsAt), timezone)}–{formatTimeInTimeZone(new Date(appointment.endsAt), timezone)}</span>
      <span className="font-semibold">{clientName}</span>
      <StatusPill status={appointment.status} />
      <span className="min-w-0 truncate text-sm text-muted-foreground">{appointment.services.map(service => service.serviceNameSnapshot).join(", ") || "სერვისი მითითებული არ არის"} · {appointment.staff.publicDisplayName}</span>
    </> : <span className="text-sm text-muted-foreground">თავისუფალი დროა</span>}
    <span className="text-xs text-muted-foreground sm:ml-auto">{timelineCue}</span>
  </section>;
}

function DashboardMetric({ metricKey, appointmentCount, pendingCount, scheduledTetri, outstandingTetri, focus, timezone }: { metricKey: ReturnType<typeof dashboardMetricKeys>[number]; appointmentCount: number; pendingCount: number; scheduledTetri: number; outstandingTetri: number; focus: TodayFocus; timezone: string }) {
  if (metricKey === "BOOKINGS") return <MetricCell label="ჯავშნები" value={String(appointmentCount)} />;
  if (metricKey === "PENDING") return <MetricCell label="მოლოდინში" value={String(pendingCount)} />;
  if (metricKey === "SCHEDULED") return <MetricCell label="დაგეგმილი თანხა" value={money(scheduledTetri)} />;
  if (metricKey === "OUTSTANDING") return <MetricCell label="დარჩენილი ბალანსი" value={money(outstandingTetri)} />;
  return <MetricCell label="შემდეგი დრო" value={focus ? formatTimeInTimeZone(new Date(focus.appointment.startsAt), timezone) : "—"} />;
}

function QuickActions({ actions, onWalkIn }: { actions: ReturnType<typeof dashboardQuickActions>; onWalkIn: () => void }) {
  const items = {
    CALENDAR: { label: "კალენდარი", href: "/app/calendar", icon: CalendarDays },
    WALK_IN: { label: "ადგილზე მოსული", href: "", icon: UserPlus },
    CLIENTS: { label: "კლიენტები", href: "/app/clients", icon: UsersRound },
    TEAM: { label: "გუნდი", href: "/app/staff", icon: UsersRound },
    SERVICES: { label: "სერვისები", href: "/app/services", icon: Scissors },
    BOOKING_LINK: { label: "ჩაწერის ბმული", href: "/app/settings", icon: Link2 },
    MY_PROFILE: { label: "ჩემი პროფილი", href: "/app/staff", icon: CalendarCheck2 },
  } as const;
  return <nav aria-label="სწრაფი მოქმედებები" className="flex flex-wrap gap-2">{actions.map(action => { const item = items[action]; return <ActionTile key={action} icon={item.icon} label={item.label} href={action === "WALK_IN" ? undefined : item.href} onClick={action === "WALK_IN" ? onWalkIn : undefined} />; })}</nav>;
}

function StatusPill({ status }: { status: string }) {
  const tone = status === "CANCELLED" || status === "NO_SHOW" ? "danger" : status === "PENDING" ? "warning" : status === "CONFIRMED" ? "info" : status === "CHECKED_IN" || status === "IN_SERVICE" ? "violet" : "success";
  return <WorkspaceStatusPill tone={tone}>{statusLabels[status] ?? status}</WorkspaceStatusPill>;
}
