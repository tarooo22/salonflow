import { useEffect, useMemo, useState } from "react";
import { Building2, Eye, EyeOff, LockKeyhole, RefreshCw, Search, ShieldAlert, UnlockKeyhole } from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { WorkspacePageHeader, WorkspaceSection, WorkspaceState } from "@/components/workspace/WorkspacePrimitives";
import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { formatKaDateTime } from "@/lib/presentation";

function formatDate(value: Date | string | null | undefined) {
  return value ? formatKaDateTime(new Date(value)) : "—";
}

const actionLabels: Record<string, string> = { SUSPEND: "წვდომა შეიზღუდა", RESTORE: "წვდომა აღდგა", HIDE_PUBLIC: "საჯაროდ დამალვა", SHOW_PUBLIC: "საჯაროდ გამოჩენა", GRANT_DAYS: "ვადის დამატება" };

function statusLabel(status: string) {
  return status === "SUSPENDED" ? "შეჩერებული" : status === "ARCHIVED" ? "არქივირებული" : "აქტიური";
}

export default function OrganizationGovernance() {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();
  const [searchText, setSearchText] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [reasons, setReasons] = useState<Record<string, string>>({});
  const [days, setDays] = useState<Record<string, string>>({});
  const queryInput = useMemo(() => ({ limit: 100, offset: 0, search: searchText.trim() || undefined }), [searchText]);
  const list = trpc.governance.listOrganizations.useQuery(queryInput, { enabled: user?.role === "admin" });
  const audit = trpc.governance.audit.useQuery({ organizationId: selectedId ?? "invalid-organization", limit: 30 }, { enabled: Boolean(selectedId) && user?.role === "admin" });
  const action = trpc.governance.act.useMutation({
    onSuccess: async result => {
      await Promise.all([utils.governance.listOrganizations.invalidate(), selectedId ? utils.governance.audit.invalidate({ organizationId: selectedId }) : Promise.resolve()]);
      toast.success("ცვლილება შენახულია", { description: result.action === "GRANT_DAYS" ? `ვადა განახლდა ${formatDate(result.grantEndsAt)}-მდე.` : "სალონის სტატუსი განახლდა." });
    },
    onError: error => toast.error(error.message),
  });

  useEffect(() => {
    if (!loading && user && user.role !== "admin") setLocation("/app/today");
  }, [loading, setLocation, user]);

  if (loading || !user || user.role !== "admin") {
    return <DashboardLayout><main className="sf-workspace-page mx-auto w-full max-w-7xl"><WorkspaceState kind="loading" title="ადმინისტრატორის პანელი იტვირთება…" /></main></DashboardLayout>;
  }

  const runAction = (organizationId: string, actionName: "SUSPEND" | "RESTORE" | "HIDE_PUBLIC" | "SHOW_PUBLIC" | "GRANT_DAYS") => {
    const reasonKa = reasons[organizationId]?.trim();
    if (!reasonKa) {
      toast.error("მიუთითეთ მიზეზი", { description: "ყველა ცვლილებას სჭირდება მოკლე განმარტება." });
      return;
    }
    const parsedDays = Number(days[organizationId]);
    if (actionName === "GRANT_DAYS" && (!Number.isInteger(parsedDays) || parsedDays < 1 || parsedDays > 365)) {
      toast.error("მიუთითეთ დღეების რაოდენობა", { description: "ვადის დამატება შესაძლებელია 1-დან 365 დღემდე." });
      return;
    }
    action.mutate({ organizationId, action: actionName, reasonKa, days: actionName === "GRANT_DAYS" ? parsedDays : undefined });
  };

  return <DashboardLayout><main className="sf-workspace-page mx-auto w-full max-w-7xl space-y-5">
    <WorkspacePageHeader title="სალონების კონტროლი" description="შეჩერება მონაცემებს არ შლის — ის მხოლოდ კეტავს წვდომას და საჯარო ჩაწერას." />
    <WorkspaceSection title="სალონები">
      <div className="relative max-w-xl"><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" /><Input value={searchText} onChange={event => setSearchText(event.target.value)} placeholder="სალონის სახელი, კოდი ან გადახდის ID" aria-label="სალონის ძებნა" className="h-11 pl-9" /></div>
      {list.isLoading ? <WorkspaceState kind="loading" title="იტვირთება…" /> : null}
      {list.isError ? <WorkspaceState kind="error" title="სალონების სია ვერ ჩაიტვირთა" description="სცადეთ თავიდან." /> : null}
      <p className="mt-4 text-sm text-muted-foreground" aria-live="polite">ნაპოვნია {list.data?.total ?? 0} სალონი</p>
      <div className="mt-4 grid grid-cols-1 gap-3">
        {list.data?.items.map(item => {
          const suspended = item.accessStatus === "SUSPENDED";
          const publicHidden = !item.publicVisible;
          const isAuditOpen = selectedId === item.id;
          return <article key={item.id} className={`rounded-md border p-3 ${suspended ? "border-destructive/40" : ""}`}>
            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2"><Building2 className="size-5 text-primary" aria-hidden="true" /><h2 className="text-lg font-semibold">{item.name}</h2><span className={`rounded-md border px-2 py-0.5 text-xs font-semibold ${suspended ? "border-destructive/40 text-destructive" : "border-[color-mix(in_srgb,var(--sf-jade)_40%,transparent)] text-[var(--sf-jade)]"}`}>{statusLabel(item.accessStatus)}</span>{publicHidden ? <span className="rounded-md border border-[var(--sf-amber)]/40 px-2 py-0.5 text-xs font-semibold text-[var(--sf-amber)]">საჯაროდ დამალული</span> : null}</div>
                <p className="mt-2 text-sm text-muted-foreground">კოდი: <span className="font-mono">{item.slug}</span>{item.billingCode ? <> · გადახდის ID: <span className="font-mono">{item.billingCode}</span></> : null}</p>
                <p className="mt-1 text-sm text-muted-foreground">მფლობელი: {item.ownerName ?? "უცნობია"} · {item.ownerEmail ?? "ელფოსტა არ არის მითითებული"}</p>
                <p className="mt-1 text-xs text-muted-foreground">შექმნა: {formatDate(item.createdAt)} · მოქმედი ვადა: {formatDate(item.activeGrantEndsAt)}</p>
                <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">{item.locations.map(location => <span key={location.id} className="rounded-md border px-2 py-1">{location.name} · {location.bookingEnabled ? "ჩაწერა ჩართულია" : "ჩაწერა გამორთულია"}</span>)}</div>
              </div>
              <div className="w-full max-w-xl space-y-3 xl:min-w-[34rem]">
                <label className="grid gap-1 text-sm font-medium"><span>მოქმედების მიზეზი</span><Input value={reasons[item.id] ?? ""} onChange={event => setReasons(current => ({ ...current, [item.id]: event.target.value }))} placeholder="მაგ. დოკუმენტაციის შემოწმება დასრულდა" maxLength={500} aria-label={`${item.name}: მოქმედების მიზეზი`} /></label>
                <div className="flex flex-wrap gap-2">
                  {suspended ? <Button size="sm" onClick={() => runAction(item.id, "RESTORE")} disabled={action.isPending}><UnlockKeyhole className="mr-1.5 size-4" />წვდომის აღდგენა</Button> : <Button size="sm" variant="destructive" onClick={() => runAction(item.id, "SUSPEND")} disabled={action.isPending}><LockKeyhole className="mr-1.5 size-4" />დროებით გათიშვა</Button>}
                  {publicHidden ? <Button size="sm" variant="outline" onClick={() => runAction(item.id, "SHOW_PUBLIC")} disabled={action.isPending}><Eye className="mr-1.5 size-4" />საჯაროდ გამოჩენა</Button> : <Button size="sm" variant="outline" onClick={() => runAction(item.id, "HIDE_PUBLIC")} disabled={action.isPending}><EyeOff className="mr-1.5 size-4" />საჯაროდ დამალვა</Button>}
                  <div className="flex items-center gap-2"><Input className="h-9 w-20" inputMode="numeric" type="number" min={1} max={365} value={days[item.id] ?? ""} onChange={event => setDays(current => ({ ...current, [item.id]: event.target.value }))} placeholder="დღე" aria-label={`${item.name}-ისთვის დასამატებელი დღეები`} /><Button size="sm" variant="outline" onClick={() => runAction(item.id, "GRANT_DAYS")} disabled={action.isPending}><RefreshCw className="mr-1.5 size-4" />ვადის დამატება</Button></div>
                  <Button size="sm" variant="ghost" onClick={() => setSelectedId(isAuditOpen ? null : item.id)}><ShieldAlert className="mr-1.5 size-4" />{isAuditOpen ? "ისტორიის დამალვა" : "ისტორია"}</Button>
                </div>
              </div>
            </div>
            {isAuditOpen ? <div className="mt-3 rounded-md border p-3"><h3 className="text-sm font-semibold">ცვლილებების ისტორია</h3>{audit.isLoading ? <p className="mt-2 text-sm text-muted-foreground">იტვირთება…</p> : audit.data?.length ? <div className="mt-3 grid gap-2">{audit.data.map(row => <div key={row.event.id} className="flex flex-col gap-1 border-l border-primary/30 pl-3 text-sm sm:flex-row sm:items-center sm:justify-between"><div><p className="font-medium">{actionLabels[row.event.eventType] ?? row.event.eventType}</p><p className="text-xs text-muted-foreground">{row.event.metadata && typeof row.event.metadata === "object" && "reasonKa" in row.event.metadata ? String(row.event.metadata.reasonKa) : "მიზეზი არ არის მითითებული"}</p></div><span className="text-xs text-muted-foreground">{formatDate(row.event.createdAt)} · {row.actorName ?? row.actorEmail ?? "ადმინისტრატორი"}</span></div>)}</div> : <p className="mt-2 text-sm text-muted-foreground">ამ სალონს ცვლილების ისტორია ჯერ არ აქვს.</p>}</div> : null}
          </article>;
        })}
      </div>
      {!list.isLoading && !list.data?.items.length ? <WorkspaceState kind="empty" title="სალონი ვერ მოიძებნა" description="შეცვალეთ ძებნის სიტყვა." /> : null}
    </WorkspaceSection>
  </main></DashboardLayout>;
}
