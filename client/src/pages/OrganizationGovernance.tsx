import { useEffect, useMemo, useState } from "react";
import { Building2, CheckCircle2, Eye, EyeOff, LockKeyhole, RefreshCw, Search, ShieldAlert, UnlockKeyhole } from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { WorkspacePageHeader, WorkspaceSection, WorkspaceState } from "@/components/workspace/WorkspacePrimitives";
import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";

function formatDate(value: Date | string | null | undefined) {
  return value ? new Date(value).toLocaleString("ka-GE", { dateStyle: "medium", timeStyle: "short" }) : "—";
}

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
      toast.success("ცვლილება შენახულია", { description: result.action === "GRANT_DAYS" ? `ვადა განახლდა ${formatDate(result.grantEndsAt)}-მდე.` : "სალონის governance სტატუსი განახლდა." });
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
      toast.error("მიუთითეთ მიზეზი", { description: "ყველა governance ცვლილებას სჭირდება მოკლე ქართული განმარტება." });
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
    <WorkspacePageHeader eyebrow="PLATFORM ADMIN" title="სალონების კონტროლი" description="ყველა რეგისტრირებული სალონის ცენტრალური governance. მონაცემები არ იშლება — admin აკონტროლებს წვდომას, public visibility-ს და ვადებს audit trail-ით." />
    <WorkspaceSection title="სალონების კატალოგი" description="მოძებნეთ სახელით, კოდით ან billing ID-ით. მოქმედება შეასრულეთ მხოლოდ დასაბუთებული მიზეზით.">
      <div className="relative max-w-xl"><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" /><Input value={searchText} onChange={event => setSearchText(event.target.value)} placeholder="სალონის სახელი, კოდი ან billing ID" aria-label="სალონის ძებნა" className="h-11 pl-9" /></div>
      {list.isLoading ? <WorkspaceState kind="loading" title="სალონები იტვირთება…" /> : null}
      {list.isError ? <WorkspaceState kind="error" title="სალონების სია ვერ ჩაიტვირთა" description="შეამოწმეთ database და სცადეთ თავიდან." /> : null}
      <p className="mt-4 text-sm text-muted-foreground" aria-live="polite">ნაპოვნია {list.data?.total ?? 0} სალონი</p>
      <div className="mt-4 grid gap-4">
        {list.data?.items.map(item => {
          const suspended = item.accessStatus === "SUSPENDED";
          const publicHidden = !item.publicVisible;
          const isAuditOpen = selectedId === item.id;
          return <article key={item.id} className={`rounded-2xl border p-4 ${suspended ? "border-destructive/40 bg-destructive/[0.04]" : "bg-muted/10"}`}>
            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2"><Building2 className="size-5 text-primary" aria-hidden="true" /><h2 className="text-lg font-semibold">{item.name}</h2><span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${suspended ? "border-destructive/40 text-destructive" : "border-[color-mix(in_srgb,var(--sf-jade)_40%,transparent)] text-[var(--sf-jade)]"}`}>{statusLabel(item.accessStatus)}</span>{publicHidden ? <span className="rounded-full border border-amber-500/40 px-2.5 py-1 text-xs font-semibold text-amber-700">საჯაროდ დამალული</span> : null}</div>
                <p className="mt-2 text-sm text-muted-foreground">კოდი: <span className="font-mono">{item.slug}</span>{item.billingCode ? <> · Billing ID: <span className="font-mono">{item.billingCode}</span></> : null}</p>
                <p className="mt-1 text-sm text-muted-foreground">მფლობელი: {item.ownerName ?? "უცნობია"} · {item.ownerEmail ?? "ელფოსტა არ არის მითითებული"}</p>
                <p className="mt-1 text-xs text-muted-foreground">შექმნა: {formatDate(item.createdAt)} · მოქმედი ვადა: {formatDate(item.activeGrantEndsAt)}</p>
                <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">{item.locations.map(location => <span key={location.id} className="rounded-full border px-2 py-1">{location.name} · {location.bookingEnabled ? "ბუქინგი ჩართულია" : "ბუქინგი გამორთულია"}</span>)}</div>
              </div>
              <div className="w-full max-w-xl space-y-3 xl:min-w-[34rem]">
                <label className="grid gap-1 text-sm font-medium"><span>მოქმედების მიზეზი</span><Input value={reasons[item.id] ?? ""} onChange={event => setReasons(current => ({ ...current, [item.id]: event.target.value }))} placeholder="მაგ. დოკუმენტაციის შემოწმება დასრულდა" maxLength={500} aria-label={`${item.name}-ის governance მიზეზი`} /></label>
                <div className="flex flex-wrap gap-2">
                  {suspended ? <Button size="sm" onClick={() => runAction(item.id, "RESTORE")} disabled={action.isPending}><UnlockKeyhole className="mr-1.5 size-4" />წვდომის აღდგენა</Button> : <Button size="sm" variant="destructive" onClick={() => runAction(item.id, "SUSPEND")} disabled={action.isPending}><LockKeyhole className="mr-1.5 size-4" />დროებით გათიშვა</Button>}
                  {publicHidden ? <Button size="sm" variant="outline" onClick={() => runAction(item.id, "SHOW_PUBLIC")} disabled={action.isPending}><Eye className="mr-1.5 size-4" />საჯაროდ გამოჩენა</Button> : <Button size="sm" variant="outline" onClick={() => runAction(item.id, "HIDE_PUBLIC")} disabled={action.isPending}><EyeOff className="mr-1.5 size-4" />საჯაროდ დამალვა</Button>}
                  <div className="flex items-center gap-2"><Input className="h-9 w-20" inputMode="numeric" type="number" min={1} max={365} value={days[item.id] ?? ""} onChange={event => setDays(current => ({ ...current, [item.id]: event.target.value }))} placeholder="დღე" aria-label={`${item.name}-ისთვის დასამატებელი დღეები`} /><Button size="sm" variant="outline" onClick={() => runAction(item.id, "GRANT_DAYS")} disabled={action.isPending}><RefreshCw className="mr-1.5 size-4" />ვადის დამატება</Button></div>
                  <Button size="sm" variant="ghost" onClick={() => setSelectedId(isAuditOpen ? null : item.id)}><ShieldAlert className="mr-1.5 size-4" />{isAuditOpen ? "Audit-ის დამალვა" : "Audit ისტორია"}</Button>
                </div>
              </div>
            </div>
            {isAuditOpen ? <div className="mt-4 rounded-xl border bg-background/70 p-3"><h3 className="text-sm font-semibold">ცვლილებების ისტორია</h3>{audit.isLoading ? <p className="mt-2 text-sm text-muted-foreground">იტვირთება…</p> : audit.data?.length ? <div className="mt-3 grid gap-2">{audit.data.map(row => <div key={row.event.id} className="flex flex-col gap-1 border-l-2 border-primary/30 pl-3 text-sm sm:flex-row sm:items-center sm:justify-between"><div><p className="font-medium">{row.event.eventType}</p><p className="text-xs text-muted-foreground">{row.event.metadata && typeof row.event.metadata === "object" && "reasonKa" in row.event.metadata ? String(row.event.metadata.reasonKa) : "მიზეზი არ არის მითითებული"}</p></div><span className="text-xs text-muted-foreground">{formatDate(row.event.createdAt)} · {row.actorName ?? row.actorEmail ?? "admin"}</span></div>)}</div> : <p className="mt-2 text-sm text-muted-foreground">ამ სალონს ჯერ audit ჩანაწერი არ აქვს.</p>}</div> : null}
          </article>;
        })}
      </div>
      {!list.isLoading && !list.data?.items.length ? <WorkspaceState kind="empty" title="სალონი ვერ მოიძებნა" description="შეცვალეთ ძებნის სიტყვა ან დაელოდეთ პირველი workspace-ის შექმნას." /> : null}
    </WorkspaceSection>
    <section className="flex items-start gap-3 rounded-2xl border border-primary/20 bg-primary/[0.05] p-4 text-sm"><CheckCircle2 className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" /><p className="leading-6 text-muted-foreground">შეჩერება არ შლის სალონს, თანამშრომლებს, ჯავშნებს ან ფინანსურ ისტორიას. ის მხოლოდ კეტავს protected workspace access-ს და public discovery/booking-ს, სანამ admin არ აღადგენს წვდომას.</p></section>
  </main></DashboardLayout>;
}
