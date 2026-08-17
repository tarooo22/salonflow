import { RevenueTrendChart, CommissionDistributionChart } from "@/components/reports/ReportsCharts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { WorkspaceFilterBar, WorkspaceMetric, WorkspacePageHeader, WorkspaceSection, WorkspaceState, WorkspaceStatusPill } from "@/components/workspace/WorkspacePrimitives";
import { gelInputToTetri } from "@/lib/money";
import { formatGelTetri, formatPaymentMethod } from "@/lib/presentation";
import { trpc } from "@/lib/trpc";
import { ChevronLeft, ChevronRight, Download, Percent, PlayCircle, Plus, ReceiptText, Trash2, TrendingUp, Wallet, WalletCards } from "lucide-react";
import { FormEvent, useMemo, useState } from "react";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayout";

const HISTORY_PAGE_SIZE = 10;

const statusLabels: Record<string, string> = { PENDING: "მოლოდინში", CONFIRMED: "დადასტურებული", CHECKED_IN: "მიღებულია", IN_SERVICE: "მომსახურებაში", COMPLETED: "დასრულებული", CANCELLED: "გაუქმებული", NO_SHOW: "არ გამოცხადდა" };
const statusStyles: Record<string, string> = { PENDING: "bg-amber-100 text-amber-800", CONFIRMED: "bg-emerald-100 text-emerald-800", CHECKED_IN: "bg-sky-100 text-sky-800", IN_SERVICE: "bg-violet-100 text-violet-800", COMPLETED: "bg-emerald-100 text-emerald-800", CANCELLED: "bg-rose-100 text-rose-800", NO_SHOW: "bg-slate-200 text-slate-700" };

const gel = (value: number) => formatGelTetri(value);
const formatAppointmentDate = (value: Date) => new Intl.DateTimeFormat("ka-GE", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(value);
const formatExpenseDate = (value: Date) => new Intl.DateTimeFormat("ka-GE", { day: "2-digit", month: "short", year: "numeric" }).format(value);

function SectionLoading({ title }: { title: string }) { return <WorkspaceState kind="loading" title={title} />; }
function SectionEmpty({ title }: { title: string }) { return <WorkspaceState kind="empty" title={title} />; }

export default function Reports() {
  const utils = trpc.useUtils();
  const organizations = trpc.organizations.listMine.useQuery();
  const organizationEntry = organizations.data?.[0];
  const organization = organizationEntry?.organization;
  const canManageFinance = ["OWNER", "MANAGER"].includes(organizationEntry?.membership.role ?? "");
  const [offset, setOffset] = useState(0);
  const [expenseOpen, setExpenseOpen] = useState(false);
  const [ruleOpen, setRuleOpen] = useState(false);
  const [expenseLocationId, setExpenseLocationId] = useState("");
  const [expenseCategory, setExpenseCategory] = useState("");
  const [expenseAmount, setExpenseAmount] = useState("");
  const [expenseDate, setExpenseDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [expenseDescription, setExpenseDescription] = useState("");
  const [expenseFormError, setExpenseFormError] = useState("");
  const [ruleType, setRuleType] = useState<"PERCENTAGE" | "FIXED">("PERCENTAGE");
  const [ruleValue, setRuleValue] = useState("");
  const [ruleStaffId, setRuleStaffId] = useState("");
  const [ruleServiceId, setRuleServiceId] = useState("");
  const [ruleLocationId, setRuleLocationId] = useState("");
  const [ruleError, setRuleError] = useState("");
  const [range, setRange] = useState(() => {
    const endsAt = new Date();
    const startsAt = new Date(endsAt);
    startsAt.setDate(startsAt.getDate() - 30);
    return { startsAt, endsAt };
  });

  const reportInput = useMemo(() => ({ organizationId: organization?.id ?? "", ...range }), [organization?.id, range]);
  const bookingHistoryInput = useMemo(() => ({ ...reportInput, limit: HISTORY_PAGE_SIZE, offset }), [offset, reportInput]);
  const report = trpc.reporting.revenueSummary.useQuery(reportInput, { enabled: Boolean(organization?.id) });
  const analytics = trpc.reporting.analytics.useQuery(reportInput, { enabled: Boolean(organization?.id) });
  const bookingHistory = trpc.reporting.bookingHistory.useQuery(bookingHistoryInput, { enabled: Boolean(organization?.id) });
  const commissions = trpc.reporting.commissionSummary.useQuery(reportInput, { enabled: Boolean(organization?.id) && canManageFinance });
  const commissionRules = trpc.finance.listCommissionRules.useQuery({ organizationId: organization?.id ?? "" }, { enabled: Boolean(organization?.id) && canManageFinance });
  const staffList = trpc.staff.list.useQuery({ organizationId: organization?.id ?? "" }, { enabled: Boolean(organization?.id) && canManageFinance });
  const catalog = trpc.services.list.useQuery({ organizationId: organization?.id ?? "" }, { enabled: Boolean(organization?.id) && canManageFinance });
  const locations = trpc.organizations.listLocations.useQuery({ organizationId: organization?.id ?? "" }, { enabled: Boolean(organization?.id) });
  const expenses = trpc.finance.listExpenses.useQuery({ organizationId: organization?.id ?? "" }, { enabled: Boolean(organization?.id) && canManageFinance });
  const csvExport = trpc.reporting.exportCsv.useQuery(reportInput, { enabled: false });

  const createRule = trpc.finance.createCommissionRule.useMutation({
    onSuccess: async () => { await commissionRules.refetch(); setRuleOpen(false); setRuleValue(""); setRuleStaffId(""); setRuleServiceId(""); setRuleLocationId(""); toast.success("კომისიის წესი დაემატა."); },
    onError: error => setRuleError(error.message || "წესის შენახვა ვერ მოხერხდა."),
  });
  const deleteRule = trpc.finance.deleteCommissionRule.useMutation({
    onSuccess: async () => { await commissionRules.refetch(); toast.success("წესი წაიშალა."); },
    onError: error => toast.error(error.message || "წესის წაშლა ვერ მოხერხდა."),
  });
  const runBackfill = trpc.finance.runCommissionBackfill.useMutation({
    onSuccess: async result => { await Promise.all([commissions.refetch(), utils.reporting.commissionSummary.invalidate()]); toast.success(result.created ? `დაემატა ${result.created} ჩანაწერი.` : "ახალი ჩანაწერი არ იყო შესაქმნელი."); },
    onError: error => toast.error(error.message || "დარიცხვა ვერ განხორციელდა."),
  });
  const createExpense = trpc.finance.createExpense.useMutation({
    onSuccess: async () => { await Promise.all([utils.finance.listExpenses.invalidate(), utils.reporting.revenueSummary.invalidate(), utils.reporting.analytics.invalidate()]); setExpenseLocationId(""); setExpenseCategory(""); setExpenseAmount(""); setExpenseDescription(""); setExpenseFormError(""); setExpenseOpen(false); toast.success("ხარჯი დაემატა."); },
    onError: error => setExpenseFormError(error.message || "ხარჯის დამატება ვერ მოხერხდა."),
  });

  const submitRule = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!organization) return;
    setRuleError("");
    const value = ruleType === "PERCENTAGE" ? Math.round(Number(ruleValue) * 100) : gelInputToTetri(ruleValue);
    if (value === null || Number.isNaN(value) || value < 0) { setRuleError(ruleType === "PERCENTAGE" ? "მიუთითეთ პროცენტი 0-დან 100-მდე." : "მიუთითეთ თანხა ლარში."); return; }
    if (ruleType === "PERCENTAGE" && value > 10_000) { setRuleError("პროცენტი არ უნდა აღემატებოდეს 100-ს."); return; }
    createRule.mutate({ organizationId: organization.id, type: ruleType, valueTetri: value, staffProfileId: ruleStaffId || undefined, serviceId: ruleServiceId || undefined, locationId: ruleLocationId || undefined });
  };

  const submitExpense = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!organization || !expenseLocationId) { setExpenseFormError("აირჩიეთ აქტიური ფილიალი."); return; }
    const amountTetri = gelInputToTetri(expenseAmount);
    if (amountTetri === null || amountTetri <= 0) { setExpenseFormError("მიუთითეთ დადებითი თანხა ლარში ორი ათწილადის სიზუსტით."); return; }
    setExpenseFormError("");
    createExpense.mutate({ organizationId: organization.id, locationId: expenseLocationId, category: expenseCategory, amountTetri, expenseDate: new Date(`${expenseDate}T12:00:00`), description: expenseDescription || undefined });
  };

  const download = async () => {
    const result = await csvExport.refetch();
    if (!result.data) return;
    const url = URL.createObjectURL(new Blob([result.data.csv], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = result.data.filename;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const summary = report.data?.summary;
  const history = bookingHistory.data;
  const pageStart = history?.total ? offset + 1 : 0;
  const pageEnd = Math.min(offset + HISTORY_PAGE_SIZE, history?.total ?? 0);
  const revenueTrend = analytics.data?.revenueTrend ?? [];
  const commissionData = commissions.data?.specialists ?? [];

  return (
    <DashboardLayout>
      <div className="sf-workspace-page mx-auto w-full max-w-7xl space-y-5">
        <WorkspacePageHeader
          eyebrow="ფინანსური მიმოხილვა"
          title="ანგარიშები"
          description="არჩეული პერიოდის ჯავშნები, შემოსავლები, საკომისიოები, ხარჯები და CSV ექსპორტი."
          actions={<>{organization && canManageFinance ? <Button onClick={() => { setExpenseFormError(""); setExpenseOpen(true); }}><Plus className="mr-2 size-4" />ხარჯის დამატება</Button> : null}<Button variant="outline" disabled={!organization || csvExport.isFetching} onClick={download}><Download className="mr-2 size-4" />{csvExport.isFetching ? "ექსპორტი მზადდება…" : "CSV ექსპორტი"}</Button></>}
        />

        <WorkspaceFilterBar>
          <label className="grid gap-1 text-xs font-medium text-muted-foreground">დაწყება<Input type="date" value={range.startsAt.toISOString().slice(0, 10)} onChange={event => setRange(current => ({ ...current, startsAt: new Date(`${event.target.value}T00:00:00.000Z`) }))} /></label>
          <label className="grid gap-1 text-xs font-medium text-muted-foreground">დასრულება<Input type="date" value={range.endsAt.toISOString().slice(0, 10)} onChange={event => setRange(current => ({ ...current, endsAt: new Date(`${event.target.value}T23:59:59.999Z`) }))} /></label>
          <WorkspaceStatusPill tone="info">{new Intl.DateTimeFormat("ka-GE", { dateStyle: "medium" }).format(range.startsAt)} – {new Intl.DateTimeFormat("ka-GE", { dateStyle: "medium" }).format(range.endsAt)}</WorkspaceStatusPill>
        </WorkspaceFilterBar>

        {report.isError ? <WorkspaceState kind="error" title="ანგარიშის მონაცემები დროებით მიუწვდომელია" /> : null}
        {!organization && !organizations.isLoading ? <WorkspaceState kind="empty" title="ჯერ შექმენით სამუშაო სივრცე" /> : null}

        {organization ? <>
          <div className="grid gap-3 sm:grid-cols-3">
            <WorkspaceMetric icon={TrendingUp} label="აკუმულირებული შემოსავალი" value={report.isLoading ? "…" : gel(summary?.collectedRevenueTetri ?? 0)} helper="დარიცხული გადახდები მინუს დაბრუნებები" tone="jade" />
            <WorkspaceMetric icon={WalletCards} label="დარჩენილი ბალანსი" value={report.isLoading ? "…" : gel(summary?.unpaidBalanceTetri ?? 0)} helper="ჯავშნებზე გადასახდელი თანხა" tone="terracotta" />
            <WorkspaceMetric icon={ReceiptText} label="ხარჯები" value={report.isLoading ? "…" : gel(summary?.expensesTetri ?? 0)} helper="აქტიური ხარჯები არჩეულ პერიოდში" tone="violet" />
          </div>

          <WorkspaceSection title="გადახდის მეთოდები" description="მიღებული გადახდების განაწილება არჩეულ პერიოდში.">
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
              {Object.entries(report.data?.paymentMethods ?? { CASH: 0, CARD_TERMINAL: 0, BANK_TRANSFER: 0, ONLINE: 0, OTHER: 0 }).map(([method, amount]) => <div key={method} className="rounded-xl border bg-muted/20 p-3"><p className="text-xs font-medium text-muted-foreground">{formatPaymentMethod(method)}</p><p className="mt-1 text-base font-semibold">{gel(amount)}</p></div>)}
            </div>
          </WorkspaceSection>

          <div className="grid gap-4 xl:grid-cols-[1.15fr_.85fr]">
            <WorkspaceSection title="შემოსავალი" description="გაარკვიეთ რომელი დღეები ქმნის ფინანსურ მოძრაობას.">
              {analytics.isLoading ? <SectionLoading title="შემოსავლის გრაფიკი იტვირთება…" /> : null}
              {!analytics.isLoading && !revenueTrend.length ? <SectionEmpty title="არჩეულ პერიოდში შემოსავლის მონაცემი არ არის" /> : null}
              {!analytics.isLoading && revenueTrend.length ? <RevenueTrendChart data={revenueTrend} /> : null}
            </WorkspaceSection>

            <WorkspaceSection title="გუნდის შედეგები" description="არჩეული პერიოდის სპეციალისტის მაჩვენებლები.">
              {analytics.isLoading ? <SectionLoading title="გუნდის შედეგები იტვირთება…" /> : null}
              {!analytics.isLoading && !analytics.data?.staffMetrics.length ? <SectionEmpty title="სპეციალისტის მონაცემი არ არის" /> : null}
              <div className="space-y-2">{analytics.data?.staffMetrics.slice(0, 5).map(staff => <div key={staff.staffProfileId} className="rounded-lg border px-3 py-2 text-sm"><div className="flex items-center justify-between gap-3"><p className="font-medium">{staff.publicDisplayName}</p><p className="font-semibold">{gel(staff.bookedRevenueTetri)}</p></div><p className="text-xs text-muted-foreground">{staff.completedAppointments} დასრულებული · {staff.bookingCount} მომსახურება</p></div>)}</div>
              {!analytics.isLoading ? <div className="mt-3 rounded-lg bg-muted/35 p-3 text-sm"><p className="text-muted-foreground">ხარჯების წნეხი ჯავშნის შემოსავალზე</p><p className="mt-1 text-lg font-semibold">{analytics.data?.expensePressureBasisPoints === null ? "—" : `${((analytics.data?.expensePressureBasisPoints ?? 0) / 100).toFixed(2)}%`}</p><p className="mt-1 text-xs text-muted-foreground">ხარჯი {gel(analytics.data?.expensesTetri ?? 0)} · ჯავშნები {gel(analytics.data?.bookedRevenueTetri ?? 0)}</p></div> : null}
            </WorkspaceSection>
          </div>

          <div className="grid gap-4 xl:grid-cols-[.9fr_1.1fr]">
            <WorkspaceSection title="სერვისების მიქსი" description="სერვისების ჯავშნის მოცულობა და შემოსავალი.">
              {analytics.isLoading ? <SectionLoading title="სერვისების მიქსი იტვირთება…" /> : null}
              {!analytics.isLoading && !analytics.data?.serviceMix.length ? <SectionEmpty title="სერვისების ისტორიული მონაცემი არ არის" /> : null}
              <div className="space-y-2">{analytics.data?.serviceMix.slice(0, 6).map(service => <div key={service.serviceName} className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2 text-sm"><div><p className="font-medium">{service.serviceName}</p><p className="text-xs text-muted-foreground">{service.bookingCount} მომსახურება</p></div><p className="font-semibold">{gel(service.revenueTetri)}</p></div>)}</div>
            </WorkspaceSection>

            {canManageFinance ? <WorkspaceSection title="კომისიოები" description="დარიცხული და გადახდილი საკომისიოების სტრუქტურა.">
              {commissions.isLoading ? <SectionLoading title="კომისიების გრაფიკი იტვირთება…" /> : null}
              {commissions.isError ? <WorkspaceState kind="error" title="კომისიების მონაცემები დროებით მიუწვდომელია" /> : null}
              {!commissions.isLoading && !commissions.isError && !commissionData.length ? <SectionEmpty title="არჩეულ პერიოდში კომისიის ჩანაწერი ჯერ არ არის" /> : null}
              {!commissions.isLoading && !commissions.isError && commissionData.length ? <CommissionDistributionChart data={commissionData} /> : null}
            </WorkspaceSection> : <WorkspaceSection title="საკომისიოები" description="საკომისიოების დეტალები ხელმისაწვდომია მფლობელისა და მენეჯერისთვის."><WorkspaceState kind="empty" title="ამ მონაცემზე წვდომა არ გაქვთ" /></WorkspaceSection>}
          </div>

          {canManageFinance ? <>
            <Card><CardHeader className="flex flex-row items-center justify-between gap-4"><div><CardTitle className="flex items-center gap-2"><Percent className="size-4 text-primary" />კომისიის წესები</CardTitle><p className="mt-1 text-sm text-muted-foreground">დარიცხვის წესები ვრცელდება სპეციალისტზე, სერვისსა და ფილიალზე.</p></div><div className="flex flex-wrap gap-2"><Button variant="outline" size="sm" disabled={runBackfill.isPending || !commissionRules.data?.length} onClick={() => organization && runBackfill.mutate(reportInput)}><PlayCircle className="mr-2 size-4" />{runBackfill.isPending ? "მიმდინარეობს…" : "პერიოდის დარიცხვა"}</Button><Button size="sm" onClick={() => { setRuleError(""); setRuleOpen(true); }}><Plus className="mr-2 size-4" />წესის დამატება</Button></div></CardHeader><CardContent>{commissionRules.isLoading ? <p className="text-sm text-muted-foreground">იტვირთება…</p> : null}{!commissionRules.isLoading && !commissionRules.data?.length ? <p className="rounded-xl border border-dashed p-5 text-sm text-muted-foreground">კომისიის წესი ჯერ არ არის. დაამატეთ ერთი, რომ დარიცხვა ავტომატურად შედგეს.</p> : null}<div className="space-y-2">{commissionRules.data?.map(row => <div key={row.rule.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border p-3"><div className="min-w-0 flex-1"><p className="font-medium">{row.rule.type === "PERCENTAGE" ? `${(row.rule.valueTetri / 100).toFixed(2)}%` : gel(row.rule.valueTetri)} <span className="text-sm text-muted-foreground">— {row.staff?.publicDisplayName ?? "ყველა სპეც."} · {row.service?.nameKa ?? "ყველა სერვისი"}{row.location?.name ? ` · ${row.location.name}` : ""}</span></p></div><Button variant="ghost" size="sm" onClick={() => organization && deleteRule.mutate({ organizationId: organization.id, id: row.rule.id })} disabled={deleteRule.isPending} aria-label="კომისიის წესის წაშლა"><Trash2 className="size-4 text-destructive" /></Button></div>)}</div></CardContent></Card>
            <div className="grid gap-4 xl:grid-cols-2">
              <Card><CardHeader><CardTitle>კომისიების მიმოხილვა</CardTitle></CardHeader><CardContent>{commissions.isLoading ? <p className="text-sm text-muted-foreground">კომისიები იტვირთება…</p> : null}{!commissions.isLoading ? <><div className="grid gap-3 sm:grid-cols-2"><div className="rounded-xl bg-primary/5 p-4"><p className="text-sm text-muted-foreground">დარიცხული კომისია</p><p className="mt-2 text-xl font-semibold">{gel(commissions.data?.totalTetri ?? 0)}</p></div><div className="rounded-xl bg-primary/5 p-4"><p className="text-sm text-muted-foreground">გადახდილი კომისია</p><p className="mt-2 text-xl font-semibold">{gel(commissions.data?.paidTetri ?? 0)}</p></div></div></> : null}</CardContent></Card>
              <Card><CardHeader className="flex flex-row items-center justify-between gap-4"><CardTitle>ბოლო ხარჯები</CardTitle><span className="text-sm text-muted-foreground">{expenses.data?.length ?? 0} აქტიური ჩანაწერი</span></CardHeader><CardContent><div className="space-y-3">{expenses.isLoading ? <p className="text-sm text-muted-foreground">ხარჯები იტვირთება…</p> : null}{expenses.isError ? <p className="text-sm text-destructive">ხარჯების ჩატვირთვა ვერ მოხერხდა.</p> : null}{!expenses.isLoading && !expenses.isError && !expenses.data?.length ? <p className="rounded-xl border border-dashed p-5 text-sm text-muted-foreground">აქტიური ხარჯი ჯერ არ არის. პირველი ჩანაწერი შეგიძლიათ ზემოთ დაამატოთ.</p> : null}{expenses.data?.slice(0, 5).map(expense => <div key={expense.id} className="flex flex-col gap-1 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-medium">{expense.category}</p><p className="mt-1 text-sm text-muted-foreground">{formatExpenseDate(expense.expenseDate)}{expense.description ? ` · ${expense.description}` : ""}</p></div><p className="font-semibold">{gel(expense.amountTetri)}</p></div>)}</div></CardContent></Card>
            </div>
          </> : null}

          <Card><CardHeader className="flex flex-row items-center justify-between gap-4"><div><CardTitle>ჯავშნების ისტორია</CardTitle><p className="mt-1 text-sm text-muted-foreground">არჩეული პერიოდის ჯავშნები, ახალი ჩანაწერიდან ძველისკენ.</p></div><span className="shrink-0 text-sm text-muted-foreground">{history?.total ?? 0} ჩანაწერი</span></CardHeader><CardContent>{bookingHistory.isError ? <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-5 text-sm text-destructive">ჯავშნების ისტორია დროებით მიუწვდომელია.</div> : null}{bookingHistory.isLoading ? <div className="rounded-xl border border-dashed p-5 text-sm text-muted-foreground">ჯავშნების ისტორია იტვირთება…</div> : null}{!bookingHistory.isLoading && !bookingHistory.isError && !history?.items.length ? <div className="rounded-xl border border-dashed p-6 text-sm text-muted-foreground">ამ პერიოდში ჯავშანი ჯერ არ არის.</div> : null}{!bookingHistory.isLoading && !bookingHistory.isError && history?.items.length ? <><div className="overflow-x-auto rounded-xl border"><table className="w-full min-w-[670px] text-left text-sm"><thead className="bg-muted/60 text-xs font-semibold uppercase tracking-wide text-muted-foreground"><tr><th className="px-4 py-3">რეფერენსი</th><th className="px-4 py-3">თარიღი და დრო</th><th className="px-4 py-3">სტატუსი</th><th className="px-4 py-3 text-right">ჯამი</th></tr></thead><tbody className="divide-y">{history.items.map(appointment => <tr key={appointment.id} className="transition-colors hover:bg-muted/40"><td className="px-4 py-3 font-mono text-xs font-medium">#{appointment.id.slice(-8).toUpperCase()}</td><td className="px-4 py-3 text-muted-foreground">{formatAppointmentDate(appointment.startsAt)}</td><td className="px-4 py-3"><span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyles[appointment.status] ?? "bg-muted text-muted-foreground"}`}>{statusLabels[appointment.status] ?? appointment.status}</span></td><td className="px-4 py-3 text-right font-semibold">{gel(appointment.totalTetri)}</td></tr>)}</tbody></table></div><div className="mt-4 flex flex-col gap-3 text-sm sm:flex-row sm:items-center sm:justify-between"><p className="text-muted-foreground">ნაჩვენებია {pageStart}–{pageEnd} {history.total}-დან</p><div className="flex gap-2"><Button variant="outline" size="sm" onClick={() => setOffset(current => Math.max(0, current - HISTORY_PAGE_SIZE))} disabled={offset === 0}><ChevronLeft className="mr-1 size-4" />წინა</Button><Button variant="outline" size="sm" onClick={() => setOffset(current => current + HISTORY_PAGE_SIZE)} disabled={offset + HISTORY_PAGE_SIZE >= history.total}>შემდეგი<ChevronRight className="ml-1 size-4" /></Button></div></div></> : null}</CardContent></Card>
        </> : null}
      </div>

      <Dialog open={ruleOpen} onOpenChange={setRuleOpen}><DialogContent><DialogHeader><DialogTitle>კომისიის წესის დამატება</DialogTitle><DialogDescription>თუ ველი ცარიელია, წესი ვრცელდება ყველა შესაბამის სპეციალისტზე/სერვისზე/ფილიალზე.</DialogDescription></DialogHeader><form onSubmit={submitRule} className="space-y-4"><div className="grid gap-3 sm:grid-cols-2"><div className="space-y-2"><Label>ტიპი</Label><Select value={ruleType} onValueChange={value => setRuleType(value as "PERCENTAGE" | "FIXED")}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="PERCENTAGE">პროცენტი</SelectItem><SelectItem value="FIXED">ფიქსირებული (₾)</SelectItem></SelectContent></Select></div><div className="space-y-2"><Label>{ruleType === "PERCENTAGE" ? "პროცენტი" : "თანხა (₾)"}</Label><Input value={ruleValue} onChange={event => setRuleValue(event.target.value)} inputMode="decimal" placeholder={ruleType === "PERCENTAGE" ? "მაგ. 40" : "მაგ. 25.00"} required /></div></div><div className="grid gap-3 sm:grid-cols-2"><div className="space-y-2"><Label>სპეციალისტი (არასავალდ.)</Label><Select value={ruleStaffId || "all"} onValueChange={value => setRuleStaffId(value === "all" ? "" : value)}><SelectTrigger><SelectValue placeholder="ყველა" /></SelectTrigger><SelectContent><SelectItem value="all">ყველა სპეციალისტი</SelectItem>{staffList.data?.map(item => <SelectItem key={item.profile.id} value={item.profile.id}>{item.profile.publicDisplayName}</SelectItem>)}</SelectContent></Select></div><div className="space-y-2"><Label>სერვისი (არასავალდ.)</Label><Select value={ruleServiceId || "all"} onValueChange={value => setRuleServiceId(value === "all" ? "" : value)}><SelectTrigger><SelectValue placeholder="ყველა" /></SelectTrigger><SelectContent><SelectItem value="all">ყველა სერვისი</SelectItem>{catalog.data?.map(item => <SelectItem key={item.service.id} value={item.service.id}>{item.service.nameKa}</SelectItem>)}</SelectContent></Select></div></div>{locations.data?.length ? <div className="space-y-2"><Label>ფილიალი (არასავალდ.)</Label><Select value={ruleLocationId || "all"} onValueChange={value => setRuleLocationId(value === "all" ? "" : value)}><SelectTrigger><SelectValue placeholder="ყველა" /></SelectTrigger><SelectContent><SelectItem value="all">ყველა ფილიალი</SelectItem>{locations.data.map(location => <SelectItem key={location.id} value={location.id}>{location.name}</SelectItem>)}</SelectContent></Select></div> : null}{ruleError ? <p className="text-sm text-destructive">{ruleError}</p> : null}<DialogFooter><Button type="submit" disabled={createRule.isPending}><Wallet className="mr-2 size-4" />{createRule.isPending ? "ინახება…" : "წესის შენახვა"}</Button></DialogFooter></form></DialogContent></Dialog>
      <Dialog open={expenseOpen} onOpenChange={setExpenseOpen}><DialogContent><DialogHeader><DialogTitle>ხარჯის დამატება</DialogTitle><DialogDescription>თანხა გადაიყვანება მთელ თეთრებში და არჩეული ფილიალი სერვერზე მოწმდება თქვენი ორგანიზაციის ფარგლებში.</DialogDescription></DialogHeader><form onSubmit={submitExpense} className="space-y-4"><div className="space-y-2"><Label htmlFor="expense-location">ფილიალი</Label><Select value={expenseLocationId} onValueChange={setExpenseLocationId}><SelectTrigger id="expense-location"><SelectValue placeholder="აირჩიეთ ფილიალი" /></SelectTrigger><SelectContent>{locations.data?.map(location => <SelectItem key={location.id} value={location.id}>{location.name}</SelectItem>)}</SelectContent></Select></div><div className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><Label htmlFor="expense-category">კატეგორია</Label><Input id="expense-category" value={expenseCategory} onChange={event => setExpenseCategory(event.target.value)} placeholder="მაგ. ქირა" minLength={2} maxLength={100} required /></div><div className="space-y-2"><Label htmlFor="expense-amount">თანხა (₾)</Label><Input id="expense-amount" value={expenseAmount} onChange={event => setExpenseAmount(event.target.value)} inputMode="decimal" placeholder="120.00" required /></div></div><div className="space-y-2"><Label htmlFor="expense-date">თარიღი</Label><Input id="expense-date" type="date" value={expenseDate} onChange={event => setExpenseDate(event.target.value)} required /></div><div className="space-y-2"><Label htmlFor="expense-description">შენიშვნა <span className="text-muted-foreground">(არასავალდებულო)</span></Label><Input id="expense-description" value={expenseDescription} onChange={event => setExpenseDescription(event.target.value)} maxLength={5000} /></div>{expenseFormError ? <p className="text-sm text-destructive">{expenseFormError}</p> : null}<DialogFooter><Button type="submit" disabled={createExpense.isPending}>{createExpense.isPending ? "ინახება…" : "ხარჯის შენახვა"}</Button></DialogFooter></form></DialogContent></Dialog>
    </DashboardLayout>
  );
}
