import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AppointmentQuickAction } from "@/components/AppointmentQuickAction";
import { WalkInQuickEntry } from "@/components/WalkInQuickEntry";
import { WorkspaceMetric, WorkspacePageHeader, WorkspaceSection, WorkspaceState, WorkspaceStatusPill } from "@/components/workspace/WorkspacePrimitives";
import { ActionTile, AttentionRow, CompactMetricRail, PriorityModule, WorkspaceContextBar } from "@/components/workspace/DashboardModules";
import { DayCloseChecklist, NotificationCenter } from "@/components/workspace/DailyControl";
import { MetricPreferenceMenu } from "@/components/workspace/MetricPreferenceMenu";
import { trpc } from "@/lib/trpc";
import { dashboardMetricKeys, dashboardQuickActions, nextOperationalAppointment } from "@/lib/dashboardExperience";
import { canManageAppointmentQueue } from "@/lib/appointmentPresentation";
import { formatGelTetri, formatPaymentState } from "@/lib/presentation";
import { formatTimeInTimeZone } from "@shared/timezones";
import { ArrowRight, CalendarCheck2, CalendarClock, CalendarDays, CircleAlert, Clock3, Link2, MapPin, Plus, ReceiptText, Scissors, UserPlus, UsersRound } from "lucide-react";
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

function roleHeading(role?: string) {
  if (role === "OWNER") return "დღის მართვის მოკლე სურათი, სალონის მზადყოფნა და შემდეგი გადაწყვეტილება.";
  if (role === "MANAGER") return "ჯერ იმოქმედეთ booking-ებზე, რომლებსაც დღეს ყურადღება სჭირდება.";
  if (role === "RECEPTIONIST") return "დღის queue, სტუმრების მიღება და სწრაფი ჩაწერა ერთ ადგილას.";
  if (role === "STAFF") return "თქვენი დღევანდელი დრო, შემდეგი კლიენტი და პირადი სამუშაო სივრცე.";
  return "დღის ოპერაციები, booking-ები და შემდეგი მოქმედებები.";
}

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
  const dayLabel = dashboard.data?.dateKey ? new Intl.DateTimeFormat("ka-GE", { timeZone: timezone, weekday: "long", day: "numeric", month: "long" }).format(new Date()) : "მიმდინარე სამუშაო დღე";
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
    if (active) return following ? `შემდეგი: ${formatTimeInTimeZone(new Date(following.startsAt), timezone)}` : "დღის შემდეგი booking აღარ არის";
    return following ? `თავისუფალი დრო → ${formatTimeInTimeZone(new Date(following.startsAt), timezone)}` : "დღეს დამატებითი booking აღარ არის";
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
    { key: "service", complete: Boolean(services.data?.length), title: "სერვისები", detail: "დაამატეთ ფასი და ხანგრძლივობა." , href: "/app/services", cta: "სერვისები" },
    { key: "team", complete: Boolean(team.data?.length), title: "გუნდი", detail: "დაამატეთ სპეციალისტი და ფილიალი.", href: "/app/staff", cta: "გუნდი" },
    { key: "hours", complete: Boolean(workingHours.data?.length), title: "სამუშაო საათები", detail: "დააყენეთ ჩაწერის დრო.", href: "/app/staff", cta: "საათები" },
    { key: "link", complete: Boolean(activeLocation?.publicSlug), title: "ონლაინ ჩაწერის ბმული", detail: "გააზიარეთ მხოლოდ მზადყოფნის შემდეგ.", href: "/app/settings", cta: "ბმული" },
  ].filter(item => !item.complete) : [];
  const completedCount = appointments.filter(appointment => appointment.status === "COMPLETED").length;
  const canCloseDay = role === "OWNER" || role === "MANAGER" || role === "RECEPTIONIST";
  const notifications = [
    pendingCount ? { key: `pending:${dashboard.data?.dateKey ?? "today"}`, title: "მომლოდინე booking-ები", description: `${pendingCount} ჩანაწერს დადასტურება ან გადამოწმება სჭირდება.`, href: "/app/calendar", tone: "warning" as const } : null,
    nonStaffAttention && metrics.outstandingTetri ? { key: `outstanding:${dashboard.data?.dateKey ?? "today"}`, title: "დარჩენილი ბალანსი", description: `${money(metrics.outstandingTetri)} გადასამოწმებელია დღიური ანგარიშის მიხედვით.`, href: "/app/reports", tone: "warning" as const } : null,
    showAccessExpiryReminder ? { key: `access:${activeAccessEndsAt?.toISOString() ?? ""}`, title: "პაკეტის წვდომა იწურება", description: `${activeAccessDaysRemaining} დღეში გახსენით 1-თვიანი პაკეტის ინსტრუქცია.`, href: "/app/billing", tone: "info" as const } : null,
    canManageOrganization && readiness.length ? { key: `readiness:${readiness.map(item => item.key).join("-")}`, title: "სალონის მზადყოფნა", description: `${readiness.length} setup ნაბიჯი ჯერ დასასრულებელია.`, href: readiness[0]?.href ?? "/app/settings", tone: "info" as const } : null,
  ].filter((notice): notice is { key: string; title: string; description: string; href: string; tone: "warning" | "info" } => Boolean(notice));
  const emptyNextAction = role === "OWNER" && readiness[0] ? { href: readiness[0].href, label: readiness[0].cta } : role === "STAFF" ? { href: "/app/calendar", label: "ჩემი კალენდარი" } : { href: "/app/calendar", label: "კალენდრის გახსნა" };

  if (workspaceLocked && organization) return <DashboardLayout><div className="sf-workspace-page mx-auto w-full max-w-4xl space-y-5"><WorkspacePageHeader eyebrow="წვდომის სტატუსი" title="სამუშაო სივრცის წვდომა დასრულებულია" description="თქვენი სალონის მონაცემები შენახულია. 1-თვიანი პაკეტის ხელით გასააქტიურებლად ატვირთეთ ბანკის გადარიცხვის ქვითარი." /><WorkspaceSection title="გააქტიურება" description="გადახდის ინსტრუქცია და ქვითრის გაგზავნა ხელმისაწვდომია მხოლოდ მფლობელისთვის."><div className="rounded-2xl border border-[color-mix(in_srgb,var(--sf-salon-warm)_38%,transparent)] bg-[color-mix(in_srgb,var(--sf-salon-warm)_8%,transparent)] p-5"><p className="text-sm text-muted-foreground">სალონის ID: <strong className="font-mono text-foreground">{billing.data?.organization.billingCode ?? "—"}</strong></p><p className="mt-3 text-sm leading-6 text-muted-foreground">გადახდის workflow-ის სრულ გვერდზე გადასასვლელად გამოიყენეთ ქვემოთ მოცემული მოქმედება.</p><Button asChild className="mt-5"><Link href="/app/billing">1-თვიანი პაკეტის გააქტიურება</Link></Button></div></WorkspaceSection></div></DashboardLayout>;
  if (memberWorkspaceLocked && organization) return <DashboardLayout><div className="sf-workspace-page mx-auto w-full max-w-4xl"><WorkspaceState kind="empty" title="სამუშაო სივრცის წვდომა დასრულებულია" description="გადახდისა და ხელახალი გააქტიურების მართვა შეუძლია მხოლოდ სალონის მფლობელს. დაუკავშირდით მფლობელს." /></div></DashboardLayout>;
  return <DashboardLayout><div className="sf-workspace-page mx-auto w-full max-w-7xl space-y-5">
    <WorkspaceContextBar eyebrow="დღის ოპერაციები" title="დღეს" detail={`${dayLabel} · ${roleHeading(role)}`} action={<div className="flex flex-wrap gap-2">{organization ? <NotificationCenter organizationId={organization.id} notices={notifications} /> : null}{organization && role !== "STAFF" ? <MetricPreferenceMenu organizationId={organization.id} allowedKeys={defaultMetricKeys} selectedKeys={metricKeys.slice(0, 2)} /> : null}{locations.data?.length ? <Select value={activeLocationId || locations.data[0]?.id} onValueChange={setActiveLocationId}><SelectTrigger className="min-w-52 bg-card" aria-label="აქტიური ფილიალი"><MapPin className="mr-2 h-4 w-4 text-primary" /><SelectValue placeholder="აირჩიეთ ფილიალი" /></SelectTrigger><SelectContent>{locations.data.map(location => <SelectItem key={location.id} value={location.id}>{location.name}</SelectItem>)}</SelectContent></Select> : null}{organization && canManageOrganization ? <Button onClick={() => { setLocationError(""); setLocationOpen(true); }}><Plus className="mr-2 h-4 w-4" />ფილიალი</Button> : null}</div>} />
    {organizations.isLoading ? <WorkspaceState kind="loading" title="სამუშაო სივრცე იტვირთება…" /> : null}
    {organizations.isError ? <WorkspaceState kind="error" title="სამუშაო სივრცის მონაცემები მიუწვდომელია" description="გთხოვთ სცადოთ ხელახლა." /> : null}
    {!organizations.isLoading && !organizations.isError && !organization ? <WorkspaceState kind="empty" title="შექმენით თქვენი პირველი სამუშაო სივრცე" description="დაამატეთ ორგანიზაცია და ფილიალი, შემდეგ კი გუნდი, სერვისები და სამუშაო საათები." action={<Button asChild><Link href="/app/setup">სამუშაო სივრცის შექმნა</Link></Button>} /> : null}
    {organization ? <>
      {locations.isLoading || dashboard.isLoading ? <WorkspaceState kind="loading" title="დღის ოპერაციები იტვირთება…" /> : null}
      {locations.isError || dashboard.isError ? <WorkspaceState kind="error" title="დღის ოპერაციული მონაცემები ვერ ჩაიტვირთა" description="კავშირი შეამოწმეთ და სცადეთ ხელახლა." action={<Button variant="outline" onClick={() => { void dashboard.refetch(); }}>განახლება</Button>} /> : null}
      {!locations.isLoading && !dashboard.isLoading && !locations.data?.length ? <WorkspaceState kind="empty" title="ჯერ არ არის აქტიური ფილიალი" description="დღის ოპერაციების სანახავად ჯერ დაამატეთ ფილიალი." /> : null}
      {!locations.isLoading && !dashboard.isLoading && locations.data?.length ? <>
        <section aria-label="დღის გადაწყვეტილების ზედაპირი" className="grid gap-4 xl:grid-cols-[minmax(0,1.25fr)_minmax(20rem,0.75fr)]">
          <OperationalFocusCard focus={operationalFocus} timezone={timezone} timelineCue={timelineCue} onOpenCalendar={() => undefined} />
          {nonStaffAttention ? <AttentionCard pendingCount={pendingCount} outstandingTetri={metrics.outstandingTetri} collectedTetri={metrics.collectedTetri} /> : <StaffDayCard appointmentCount={appointments.length} focus={operationalFocus} timezone={timezone} />}
        </section>
        <CompactMetricRail>{metricKeys.map(metricKey => <DashboardMetric key={metricKey} metricKey={metricKey} appointmentCount={appointments.length} pendingCount={pendingCount} scheduledTetri={metrics.scheduledTetri} outstandingTetri={metrics.outstandingTetri} focus={operationalFocus} timezone={timezone} />)}</CompactMetricRail>
        <QuickActions actions={quickActions} onWalkIn={() => setWalkInMode(true)} />
        {canManageCalendar && activeLocation ? <WalkInQuickEntry organizationId={organization.id} locationId={activeLocation.id} open={walkInMode} onOpenChange={setWalkInMode} /> : null}
        {(showAccessExpiryReminder || (canManageOrganization && readiness.length)) ? <SalonStatusPanel accessDaysRemaining={showAccessExpiryReminder ? activeAccessDaysRemaining : null} readiness={canManageOrganization ? readiness : []} /> : null}
        {organization && dashboard.data?.location && dashboard.data.dateKey ? <DayCloseChecklist organizationId={organization.id} locationId={dashboard.data.location.id} businessDate={dashboard.data.dateKey} locationName={dashboard.data.location.name} timezone={timezone} pendingCount={pendingCount} completedCount={completedCount} outstandingLabel={money(metrics.outstandingTetri)} outstandingTetri={metrics.outstandingTetri} canClose={canCloseDay} /> : null}
        {!dashboard.isError && dashboard.data?.location && appointments.length === 0 ? <WorkspaceState kind="empty" title="ამ ფილიალს დღეს ჯავშანი არ აქვს" description={role === "OWNER" ? "აირჩიეთ ერთი შემდეგი ნაბიჯი, რომ ონლაინ ჩაწერისთვის მზადყოფნა გაზარდოთ." : "როგორც კი საჯარო ან შიდა ჩაწერა შეიქმნება, ის აქ გამოჩნდება."} action={<Button asChild variant="outline"><Link href={emptyNextAction.href}>{emptyNextAction.label}</Link></Button>} /> : null}
        {!dashboard.isError && appointments.length ? <WorkspaceSection title="დღის სრული queue" description={`${dashboard.data?.location?.name} · ${timezone}`} action={<WorkspaceStatusPill tone="info">{appointments.length} ჯავშანი</WorkspaceStatusPill>}><div className="divide-y divide-border/70">{appointments.map(appointment => { const balance = balanceByAppointment.get(appointment.id); const clientName = appointment.client ? `${appointment.client.firstName} ${appointment.client.lastName ?? ""}`.trim() : "კლიენტი არ არის მითითებული"; return <article key={appointment.id} className="sf-queue-item grid gap-3 py-4 lg:grid-cols-[5.25rem_minmax(0,1fr)_auto] lg:items-center"><div className="rounded-lg bg-muted/65 px-2.5 py-2"><p className="font-mono text-base font-semibold text-foreground">{formatTimeInTimeZone(new Date(appointment.startsAt), timezone)}</p><p className="mt-0.5 text-xs text-muted-foreground">{formatTimeInTimeZone(new Date(appointment.endsAt), timezone)}</p></div><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><p className="font-semibold">{clientName}</p><StatusPill status={appointment.status} /><WorkspaceStatusPill tone={appointment.payment?.state === "PAID" ? "success" : appointment.payment?.state === "PARTIAL" ? "warning" : appointment.payment?.state === "REFUNDED" ? "danger" : "neutral"}>{formatPaymentState(appointment.payment?.state)}</WorkspaceStatusPill></div><p className="mt-1 truncate text-sm text-muted-foreground">{appointment.services.map(service => service.serviceNameSnapshot).join(", ") || "სერვისი არ არის მითითებული"} · {appointment.staff.publicDisplayName}</p>{role !== "STAFF" ? <p className="mt-1.5 text-xs text-muted-foreground">ნაშთი <span className="font-semibold text-foreground">{money(balance?.balanceTetri ?? appointment.totalTetri)}</span> · ჯამი <span className="font-semibold text-foreground">{money(appointment.totalTetri)}</span></p> : null}</div><div className="flex flex-wrap items-center gap-2 lg:justify-end"><AppointmentQuickAction role={canConfirmAppointment ? role : "STAFF"} status={appointment.status} cardHeight={72} context="today" disabled={updateStatus.isPending} onAction={() => updateStatus.mutate({ organizationId: organization.id, appointmentId: appointment.id, nextStatus: appointment.status === "PENDING" ? "CONFIRMED" : appointment.status === "CONFIRMED" ? "CHECKED_IN" : appointment.status === "CHECKED_IN" ? "IN_SERVICE" : "COMPLETED" })} className="inline-flex h-10 items-center rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:opacity-60" /></div></article>; })}</div></WorkspaceSection> : null}
      </> : null}
    </> : null}
  </div><Dialog open={locationOpen} onOpenChange={setLocationOpen}><DialogContent><DialogHeader><DialogTitle>ფილიალის დამატება</DialogTitle><DialogDescription>ფილიალის საჯარო მისამართი გამოიყენება უსაფრთხო ონლაინ ჩაწერის ბმულში და არ შეიცავს თანმიმდევრულ იდენტიფიკატორს.</DialogDescription></DialogHeader><form onSubmit={submitLocation} className="space-y-4"><div className="space-y-2"><Label htmlFor="new-location-name">ფილიალის სახელი</Label><Input id="new-location-name" value={locationName} onChange={event => setLocationName(event.target.value)} placeholder="მაგ. საბურთალოს ფილიალი" minLength={2} maxLength={160} required /></div><div className="space-y-2"><Label htmlFor="new-location-slug">საჯარო დაჯავშნის მისამართი</Label><Input id="new-location-slug" value={publicSlug} onChange={event => setPublicSlug(event.target.value.toLowerCase())} placeholder="salon-saburtalo" pattern="[a-z0-9]+(-[a-z0-9]+)*" minLength={3} maxLength={96} required /><p className="text-xs text-muted-foreground">/book/{publicSlug || "your-salon"}</p></div><div className="space-y-2"><Label htmlFor="new-location-address">მისამართი <span className="text-muted-foreground">(არასავალდებულო)</span></Label><Input id="new-location-address" value={address} onChange={event => setAddress(event.target.value)} maxLength={1200} /></div><p className="flex items-center gap-2 text-sm text-muted-foreground"><MapPin className="h-4 w-4 text-primary" />დროის სარტყელი: Asia/Tbilisi</p>{locationError ? <p className="text-sm text-destructive">{locationError}</p> : null}<DialogFooter><Button type="submit" disabled={createLocation.isPending}>{createLocation.isPending ? "ინახება…" : "ფილიალის შენახვა"}</Button></DialogFooter></form></DialogContent></Dialog></DashboardLayout>;
}

function SalonStatusPanel({ accessDaysRemaining, readiness }: { accessDaysRemaining: number | null; readiness: Array<{ key: string; title: string; detail: string; href: string; cta: string }> }) {
  const hasRenewal = accessDaysRemaining != null && accessDaysRemaining > 0;
  return <PriorityModule label="სალონის სტატუსი" title={hasRenewal ? `პაკეტის წვდომა იწურება ${accessDaysRemaining} დღეში` : "სალონის მზადყოფნა"} description={hasRenewal ? "გადაამოწმეთ პაკეტის ინსტრუქცია წინასწარ, რათა სამუშაო პროცესი არ შეწყდეს." : "შეასრულეთ მხოლოდ ის ნაბიჯები, რომლებიც ონლაინ ჩაწერისთვის ჯერ აუცილებელია."} icon={hasRenewal ? ReceiptText : CircleAlert} action={hasRenewal ? <Button asChild variant="outline" size="sm"><Link href="/app/billing">პაკეტის ნახვა</Link></Button> : <WorkspaceStatusPill tone="warning">{readiness.length} ნაბიჯი</WorkspaceStatusPill>}>
    <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
      {readiness.map(item => <ActionTile key={item.key} icon={CircleAlert} label={item.title} hint={item.detail} href={item.href} />)}
    </div>
  </PriorityModule>;
}

function OperationalFocusCard({ focus, timezone, timelineCue }: { focus: TodayFocus; timezone: string; timelineCue: string; onOpenCalendar: () => void }) {
  const appointment = focus?.appointment;
  const clientName = appointment?.client ? `${appointment.client.firstName} ${appointment.client.lastName ?? ""}`.trim() : "კლიენტი არ არის მითითებული";
  return <PriorityModule label={focus?.kind === "NOW" ? "ახლა მიმდინარეობს" : "დღის ფოკუსი"} title={appointment ? clientName : "ახლა თავისუფალი დროა"} description={appointment ? `${appointment.services.map(service => service.serviceNameSnapshot).join(", ") || "სერვისი არ არის მითითებული"} · ${appointment.staff.publicDisplayName}` : "ახალი booking ან Walk-in რომ დაემატება, ის აქ გამოჩნდება."} icon={CalendarClock} action={<Button asChild variant="outline" size="sm"><Link href="/app/calendar">კალენდარი<ArrowRight className="ml-1.5 size-3.5" /></Link></Button>}><div className="flex flex-wrap items-center justify-between gap-3"><div className="flex flex-wrap items-center gap-2">{appointment ? <StatusPill status={appointment.status} /> : <WorkspaceStatusPill tone="success">თავისუფალი დრო</WorkspaceStatusPill>}<p className="text-sm font-medium text-foreground">{appointment ? `${formatTimeInTimeZone(new Date(appointment.startsAt), timezone)}–${formatTimeInTimeZone(new Date(appointment.endsAt), timezone)}` : "დღის queue მზად არის"}</p></div><p className="rounded-md bg-muted/60 px-2 py-1 text-xs font-medium text-muted-foreground">{timelineCue}</p></div></PriorityModule>;
}

function AttentionCard({ pendingCount, outstandingTetri, collectedTetri }: { pendingCount: number; outstandingTetri: number; collectedTetri: number }) {
  const hasAttention = pendingCount > 0 || outstandingTetri > 0;
  return <PriorityModule label="ყურადღება" title={hasAttention ? "დღის მოქმედებები" : "ყველაფერი კონტროლშია"} description={hasAttention ? "აქ მხოლოდ ის სიგნალებია, რომლებსაც ახლა კონკრეტული მოქმედება სჭირდება." : "დღის მნიშვნელოვანი სიგნალები დამატებით მოქმედებას არ მოითხოვს."} icon={CircleAlert} action={<WorkspaceStatusPill tone={hasAttention ? "warning" : "success"}>{hasAttention ? "მოქმედება" : "კარგია"}</WorkspaceStatusPill>}><div className="grid gap-2"><AttentionRow title="დადასტურებას ელოდება" description="გახსენით კალენდარი და დაამუშავეთ მომლოდინე booking-ები." href="/app/calendar" value={pendingCount} tone={pendingCount ? "warning" : "success"} /><AttentionRow title="დარჩენილი ბალანსი" description={`შეგროვებულია ${money(collectedTetri)}. დეტალი იხილეთ ანგარიშებში.`} href="/app/reports" value={money(outstandingTetri)} tone={outstandingTetri ? "warning" : "success"} /></div></PriorityModule>;
}

function StaffDayCard({ appointmentCount, focus, timezone }: { appointmentCount: number; focus: TodayFocus; timezone: string }) {
  return <PriorityModule label="ჩემი დღე" title={`${appointmentCount} booking`} description={focus ? `${focus.kind === "NOW" ? "ახლა" : "შემდეგი"}: ${formatTimeInTimeZone(new Date(focus.appointment.startsAt), timezone)}` : "შემდეგი booking ჯერ არ არის."} icon={CalendarCheck2} action={<Button asChild variant="outline" size="sm"><Link href="/app/calendar">ჩემი კალენდარი</Link></Button>} />;
}

function DashboardMetric({ metricKey, appointmentCount, pendingCount, scheduledTetri, outstandingTetri, focus, timezone }: { metricKey: ReturnType<typeof dashboardMetricKeys>[number]; appointmentCount: number; pendingCount: number; scheduledTetri: number; outstandingTetri: number; focus: TodayFocus; timezone: string }) {
  if (metricKey === "BOOKINGS") return <WorkspaceMetric icon={CalendarDays} label="დღის booking-ები" value={String(appointmentCount)} helper="არჩეული ფილიალის სამუშაო დღე" tone="jade" />;
  if (metricKey === "PENDING") return <WorkspaceMetric icon={CircleAlert} label="მოლოდინში" value={String(pendingCount)} helper="დადასტურებას ელოდება" tone="amber" />;
  if (metricKey === "SCHEDULED") return <WorkspaceMetric icon={ReceiptText} label="დაგეგმილი თანხა" value={money(scheduledTetri)} helper="აქტიური booking-ების ჯამი" tone="violet" />;
  if (metricKey === "OUTSTANDING") return <WorkspaceMetric icon={CircleAlert} label="დარჩენილი ბალანსი" value={money(outstandingTetri)} helper="ჯერ არ არის შეგროვებული" tone="terracotta" />;
  return <WorkspaceMetric icon={Clock3} label="შემდეგი დრო" value={focus ? formatTimeInTimeZone(new Date(focus.appointment.startsAt), timezone) : "—"} helper={focus ? "თქვენი მომდევნო booking" : "დღეს მომდევნო booking არ არის"} tone="violet" />;
}

function QuickActions({ actions, onWalkIn }: { actions: ReturnType<typeof dashboardQuickActions>; onWalkIn: () => void }) {
  const items = {
    CALENDAR: { label: "კალენდარი", hint: "დღის სრული გეგმა", href: "/app/calendar", icon: CalendarDays },
    WALK_IN: { label: "Walk-in", hint: "ადგილზე მოსული კლიენტი", href: "", icon: UserPlus },
    CLIENTS: { label: "კლიენტები", hint: "ძიება და ისტორია", href: "/app/clients", icon: UsersRound },
    TEAM: { label: "გუნდი", hint: "პროფილი და გრაფიკი", href: "/app/staff", icon: UsersRound },
    SERVICES: { label: "სერვისები", hint: "ფასი და ხელმისაწვდომობა", href: "/app/services", icon: Scissors },
    BOOKING_LINK: { label: "Booking ბმული", hint: "გაზიარების მზადყოფნა", href: "/app/settings", icon: Link2 },
    MY_PROFILE: { label: "ჩემი პროფილი", hint: "ავატარი და სპეციალიზაცია", href: "/app/staff", icon: CalendarCheck2 },
  } as const;
  return <WorkspaceSection title="სწრაფი მოქმედებები" description="მხოლოდ თქვენი როლისთვის ხელმისაწვდომი მოქმედებები."><div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{actions.map(action => { const item = items[action]; return <ActionTile key={action} icon={item.icon} label={item.label} hint={item.hint} href={action === "WALK_IN" ? undefined : item.href} onClick={action === "WALK_IN" ? onWalkIn : undefined} />; })}</div></WorkspaceSection>;
}

function StatusPill({ status }: { status: string }) {
  const tone = status === "CANCELLED" || status === "NO_SHOW" ? "danger" : status === "PENDING" ? "warning" : status === "IN_SERVICE" ? "violet" : "success";
  return <WorkspaceStatusPill tone={tone}>{statusLabels[status] ?? status}</WorkspaceStatusPill>;
}
