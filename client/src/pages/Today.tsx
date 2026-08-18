import DashboardLayout from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { CalendarCheck2, CalendarDays, CircleAlert, Clock3, MapPin, Plus, ReceiptText, Rocket } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { toast } from "sonner";
import { formatTimeInTimeZone } from "@shared/timezones";
import { canManageAppointmentQueue } from "@/lib/appointmentPresentation";
import { AppointmentQuickAction } from "@/components/AppointmentQuickAction";
import { WalkInQuickEntry } from "@/components/WalkInQuickEntry";
import { WorkspaceMetric, WorkspacePageHeader, WorkspaceSection, WorkspaceState, WorkspaceStatusPill } from "@/components/workspace/WorkspacePrimitives";
import { formatGelTetri, formatPaymentState } from "@/lib/presentation";

const statusLabels: Record<string, string> = { PENDING: "დადასტურებას ელოდება", CONFIRMED: "დადასტურებული", CHECKED_IN: "მიღებულია", IN_SERVICE: "მომსახურებაშია", COMPLETED: "დასრულებული", CANCELLED: "გაუქმებული", NO_SHOW: "არ გამოცხადდა" };
const statusTone: Record<string, string> = { PENDING: "border-[var(--sf-amber)]/30 bg-[var(--sf-amber)]/10 text-[var(--sf-amber)]", CONFIRMED: "border-[var(--sf-jade)]/30 bg-[var(--sf-jade)]/10 text-[var(--sf-jade)]", CHECKED_IN: "border-[var(--sf-jade)]/30 bg-[var(--sf-jade)]/10 text-[var(--sf-jade)]", IN_SERVICE: "border-primary/30 bg-primary/10 text-primary", COMPLETED: "border-[var(--sf-muted)]/20 bg-[var(--sf-muted)]/10 text-[var(--sf-muted)]", CANCELLED: "border-destructive/30 bg-destructive/10 text-destructive", NO_SHOW: "border-destructive/30 bg-destructive/10 text-destructive" };

function money(tetri: number) {
  return formatGelTetri(tetri);
}

export default function Today() {
  const utils = trpc.useUtils();
  const organizations = trpc.organizations.listMine.useQuery();
  const organizationEntry = organizations.data?.[0];
  const organization = organizationEntry?.organization;
  const role = organizationEntry?.membership.role;
  const canManageOrganization = role === "OWNER";
  const canConfirmAppointment = ["OWNER", "MANAGER"].includes(role ?? "");
  const canManageCalendar = canManageAppointmentQueue(role);
  const locations = trpc.organizations.listLocations.useQuery({ organizationId: organization?.id ?? "" }, { enabled: Boolean(organization?.id) });
  const [activeLocationId, setActiveLocationId] = useState("");
  const dashboardInput = useMemo(() => ({ organizationId: organization?.id ?? "", locationId: activeLocationId || undefined }), [organization?.id, activeLocationId]);
  const dashboard = trpc.appointments.dashboard.useQuery(dashboardInput, { enabled: Boolean(organization?.id) });
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
    onError: () => toast.error("სტატუსის განახლება ვერ მოხერხდა. სცადეთ ხელახლა."),
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
  const isFreshLaunch = typeof window !== "undefined" && new URLSearchParams(window.location.search).get("setup") === "complete";

  return <DashboardLayout><div className="sf-workspace-page mx-auto w-full max-w-7xl space-y-5">
    <WorkspacePageHeader eyebrow="ოპერაციები" title="დღეს" description={`${dayLabel} · ცოცხალი queue, ფილიალის ბალანსები და შემდეგი მოქმედებები.`} actions={<>{locations.data?.length ? <Select value={activeLocationId || locations.data[0]?.id} onValueChange={setActiveLocationId}><SelectTrigger className="min-w-52 bg-card"><MapPin className="mr-2 h-4 w-4 text-primary" /><SelectValue placeholder="აირჩიეთ ფილიალი" /></SelectTrigger><SelectContent>{locations.data.map(location => <SelectItem key={location.id} value={location.id}>{location.name}</SelectItem>)}</SelectContent></Select> : <Badge variant="outline" className="border-primary/30 bg-primary/5 px-3 py-1 text-primary">{organization?.name ?? "სამუშაო სივრცე"}</Badge>}{organization && canManageOrganization ? <Button onClick={() => { setLocationError(""); setLocationOpen(true); }}><Plus className="mr-2 h-4 w-4" />ფილიალის დამატება</Button> : null}</>} />
    {organizations.isLoading ? <WorkspaceState kind="loading" title="სამუშაო სივრცე იტვირთება…" /> : null}{organizations.isError ? <WorkspaceState kind="error" title="სამუშაო სივრცის მონაცემები მიუწვდომელია" description="გთხოვთ სცადოთ ხელახლა." /> : null}{!organizations.isLoading && !organizations.isError && !organization ? <WorkspaceState kind="empty" title="შექმენით თქვენი პირველი სამუშაო სივრცე" description="დაამატეთ ორგანიზაცია და ფილიალი, შემდეგ კი გუნდი, სერვისები და სამუშაო საათები." action={<Button asChild><Link href="/app/setup">სამუშაო სივრცის შექმნა</Link></Button>} /> : null}
    {organization ? <>{isFreshLaunch && canManageOrganization ? <LaunchChecklist publicSlug={locations.data?.[0]?.publicSlug ?? ""} /> : null}<div className="sf-today-metric-grid grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><WorkspaceMetric icon={CalendarDays} label="დღის ჯავშნები" value={dashboard.isLoading ? "…" : String(appointments.length)} helper="არჩეული ფილიალის სამუშაო დღე" tone="jade" /><WorkspaceMetric icon={Clock3} label="მოლოდინში" value={dashboard.isLoading ? "…" : String((dashboard.data?.counts as Record<string, number> | undefined)?.PENDING ?? 0)} helper="ოპერატორის ყურადღება სჭირდება" tone="terracotta" /><WorkspaceMetric icon={ReceiptText} label="დაგეგმილი თანხა" value={dashboard.isLoading ? "…" : money(metrics.scheduledTetri)} helper="აქტიური ჯავშნების ჯამი" tone="violet" /><WorkspaceMetric icon={CircleAlert} label="დარჩენილი ბალანსი" value={dashboard.isLoading ? "…" : money(metrics.outstandingTetri)} helper={`შეგროვებულია ${money(metrics.collectedTetri)}`} tone="terracotta" /></div>{canManageCalendar && (activeLocationId || locations.data?.[0]?.id) ? <WalkInQuickEntry organizationId={organization.id} locationId={activeLocationId || locations.data?.[0]?.id!} open={walkInMode} onOpenChange={setWalkInMode} /> : null}{locations.isLoading || dashboard.isLoading ? <WorkspaceState kind="loading" title="დღის ოპერაციები იტვირთება…" /> : null}{locations.isError || dashboard.isError ? <WorkspaceState kind="error" title="დღის ოპერაციული მონაცემები ვერ ჩაიტვირთა" description="გთხოვთ სცადოთ ხელახლა." /> : null}{!locations.isLoading && !dashboard.isLoading && !locations.data?.length ? <WorkspaceState kind="empty" title="ჯერ არ არის აქტიური ფილიალი" description="დღის ოპერაციების სანახავად ჯერ დაამატეთ ფილიალი." /> : null}{!dashboard.isLoading && !dashboard.isError && dashboard.data?.location && appointments.length === 0 ? <WorkspaceState kind="empty" title="ამ ფილიალს დღეს ჯავშანი არ აქვს" description="როგორც კი საჯარო ან შიდა ჩაწერა შეიქმნება, დრო, კლიენტი, სერვისი, სტატუსი და ნაშთი აქ გამოჩნდება." action={<Button asChild variant="outline"><Link href="/app/calendar">კალენდრის გახსნა</Link></Button>} /> : null}{!dashboard.isLoading && !dashboard.isError && appointments.length ? <WorkspaceSection title="დღის queue" description={`${dashboard.data?.location?.name} · ${timezone}`} action={<WorkspaceStatusPill tone="info">{appointments.length} ჯავშანი</WorkspaceStatusPill>}><div className="divide-y divide-border/70">{appointments.map(appointment => { const balance = balanceByAppointment.get(appointment.id); const clientName = appointment.client ? `${appointment.client.firstName} ${appointment.client.lastName ?? ""}`.trim() : "კლიენტი არ არის მითითებული"; return <article key={appointment.id} className="sf-queue-item grid gap-3 py-4 lg:grid-cols-[5.25rem_minmax(0,1fr)_auto] lg:items-center"><div className="rounded-lg bg-muted/65 px-2.5 py-2"><p className="font-mono text-base font-semibold text-foreground">{formatTimeInTimeZone(new Date(appointment.startsAt), timezone)}</p><p className="mt-0.5 text-xs text-muted-foreground">{formatTimeInTimeZone(new Date(appointment.endsAt), timezone)}</p></div><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><p className="font-semibold">{clientName}</p><WorkspaceStatusPill tone={appointment.status === "CANCELLED" || appointment.status === "NO_SHOW" ? "danger" : appointment.status === "PENDING" ? "warning" : appointment.status === "IN_SERVICE" ? "violet" : "success"}>{statusLabels[appointment.status] ?? appointment.status}</WorkspaceStatusPill><WorkspaceStatusPill tone={appointment.payment?.state === "PAID" ? "success" : appointment.payment?.state === "PARTIAL" ? "warning" : appointment.payment?.state === "REFUNDED" ? "danger" : "neutral"}>{formatPaymentState(appointment.payment?.state)}</WorkspaceStatusPill></div><p className="mt-1 truncate text-sm text-muted-foreground">{appointment.services.map(service => service.serviceNameSnapshot).join(", ") || "სერვისი არ არის მითითებული"} · {appointment.staff.publicDisplayName}</p><p className="mt-1.5 text-xs text-muted-foreground">ნაშთი <span className="font-semibold text-foreground">{money(balance?.balanceTetri ?? appointment.totalTetri)}</span> · ჯამი <span className="font-semibold text-foreground">{money(appointment.totalTetri)}</span></p></div><div className="flex flex-wrap items-center gap-2 lg:justify-end"><AppointmentQuickAction role={canConfirmAppointment ? role : "STAFF"} status={appointment.status} cardHeight={72} context="today" disabled={updateStatus.isPending} onAction={() => updateStatus.mutate({ organizationId: organization.id, appointmentId: appointment.id, nextStatus: appointment.status === "PENDING" ? "CONFIRMED" : appointment.status === "CONFIRMED" ? "CHECKED_IN" : appointment.status === "CHECKED_IN" ? "IN_SERVICE" : "COMPLETED" })} className="inline-flex h-10 items-center rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:opacity-60" /></div></article>; })}</div></WorkspaceSection> : null}</> : null}
  </div><Dialog open={locationOpen} onOpenChange={setLocationOpen}><DialogContent><DialogHeader><DialogTitle>ფილიალის დამატება</DialogTitle><DialogDescription>ფილიალის საჯარო მისამართი გამოიყენება უსაფრთხო ონლაინ ჩაწერის ბმულში და არ შეიცავს თანმიმდევრულ იდენტიფიკატორს.</DialogDescription></DialogHeader><form onSubmit={submitLocation} className="space-y-4"><div className="space-y-2"><Label htmlFor="new-location-name">ფილიალის სახელი</Label><Input id="new-location-name" value={locationName} onChange={event => setLocationName(event.target.value)} placeholder="მაგ. საბურთალოს ფილიალი" minLength={2} maxLength={160} required /></div><div className="space-y-2"><Label htmlFor="new-location-slug">საჯარო დაჯავშნის მისამართი</Label><Input id="new-location-slug" value={publicSlug} onChange={event => setPublicSlug(event.target.value.toLowerCase())} placeholder="salon-saburtalo" pattern="[a-z0-9]+(-[a-z0-9]+)*" minLength={3} maxLength={96} required /><p className="text-xs text-muted-foreground">/book/{publicSlug || "your-salon"}</p></div><div className="space-y-2"><Label htmlFor="new-location-address">მისამართი <span className="text-muted-foreground">(არასავალდებულო)</span></Label><Input id="new-location-address" value={address} onChange={event => setAddress(event.target.value)} maxLength={1200} /></div><p className="flex items-center gap-2 text-sm text-muted-foreground"><MapPin className="h-4 w-4 text-primary" />დროის სარტყელი: Asia/Tbilisi</p>{locationError ? <p className="text-sm text-destructive">{locationError}</p> : null}<DialogFooter><Button type="submit" disabled={createLocation.isPending}>{createLocation.isPending ? "ინახება…" : "ფილიალის შენახვა"}</Button></DialogFooter></form></DialogContent></Dialog></DashboardLayout>;
}

function LaunchChecklist({ publicSlug }: { publicSlug: string }) { return <Card className="border-primary/25 bg-[linear-gradient(135deg,var(--sf-ivory),var(--sf-paper))]"><CardContent className="p-5 sm:p-6"><div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div><div className="flex items-center gap-2 text-primary"><Rocket className="h-5 w-5" /><p className="font-semibold">თქვენი SalonFlow მზად არის დასაწყებად</p></div><p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">პირველი ფილიალი, საათები, სერვისი და თქვენი owner profile უკვე შეიქმნა. ამ პატარა checklist-ით მოამზადებთ სამუშაო სივრცეს პირველი რეალური ჩაწერისთვის.</p></div>{publicSlug ? <Button asChild variant="outline" className="shrink-0"><Link href={`/book/${publicSlug}`}>ონლაინ ჩაწერის ნახვა</Link></Button> : null}</div><ol className="mt-5 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4"><li className="rounded-xl border border-border bg-card p-3"><span className="font-medium">1. შეამოწმეთ სერვისი</span><p className="mt-1 text-xs leading-5 text-muted-foreground">ფასი, ხანგრძლივობა და ხელმისაწვდომობა.</p><Link className="mt-2 inline-block text-xs font-semibold text-primary" href="/app/services">სერვისები →</Link></li><li className="rounded-xl border border-border bg-card p-3"><span className="font-medium">2. დაამატეთ გუნდი</span><p className="mt-1 text-xs leading-5 text-muted-foreground">მოიწვიეთ თანამშრომელი და მიუთითეთ საათები.</p><Link className="mt-2 inline-block text-xs font-semibold text-primary" href="/app/staff">გუნდი →</Link></li><li className="rounded-xl border border-border bg-card p-3"><span className="font-medium">3. გახსენით კალენდარი</span><p className="mt-1 text-xs leading-5 text-muted-foreground">დარწმუნდით, რომ სამუშაო დრო სწორად ჩანს.</p><Link className="mt-2 inline-block text-xs font-semibold text-primary" href="/app/calendar">კალენდარი →</Link></li><li className="rounded-xl border border-border bg-card p-3"><span className="font-medium">4. გაუზიარეთ ჩაწერა</span><p className="mt-1 text-xs leading-5 text-muted-foreground">ონლაინ მისამართი მზად არის თქვენი კლიენტებისთვის.</p>{publicSlug ? <Link className="mt-2 inline-block text-xs font-semibold text-primary" href={`/book/${publicSlug}`}>საჯარო გვერდი →</Link> : null}</li></ol></CardContent></Card>; }
