import { RevenueTrendChart, CommissionDistributionChart } from "@/components/reports/ReportsCharts";
import { BookingForecastPanel, PeakHourHeatmapPanel, RetentionCohortPanel, WeekComparisonPanel } from "@/components/reports/AdvancedAnalyticsPanels";
import { FeedbackConsentInsights } from "@/components/reports/FeedbackConsentInsights";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CompactMetricRail, MetricCell } from "@/components/workspace/DashboardModules";
import { WorkspaceFilterBar, WorkspacePageHeader, WorkspaceSection, WorkspaceState, WorkspaceStatusPill, type WorkspaceStatus } from "@/components/workspace/WorkspacePrimitives";
import { SavedViewMenu, type SavedViewPayload } from "@/components/workspace/SavedViewMenu";
import { gelInputToTetri } from "@/lib/money";
import { formatGelTetri, formatKaDate, formatKaDateTime, formatPaymentMethod } from "@/lib/presentation";
import { trpc } from "@/lib/trpc";
import { ChevronLeft, ChevronRight, Download, PlayCircle, Plus, Trash2, Wallet } from "lucide-react";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { dateKeyInTimeZone, localInputToUtc } from "@shared/timezones";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayout";

const HISTORY_PAGE_SIZE = 10;


const gel = (value: number) => formatGelTetri(value);

const keyToDisplay = (key: string) => { const [y, m, d] = key.split("-"); return `${d}.${m}.${y}`; };
function parseDisplayDate(text: string) {
  const match = /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/.exec(text.trim());
  if (!match) return null;
  const [d, m, y] = [Number(match[1]), Number(match[2]), Number(match[3])] as [number, number, number];
  const check = new Date(Date.UTC(y, m - 1, d));
  if (check.getUTCFullYear() !== y || check.getUTCMonth() !== m - 1 || check.getUTCDate() !== d) return null;
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}
// Georgian DD.MM.YYYY text field: the native date input prints the browser's locale (US MM/DD/YYYY).
function DateKeyInput({ label, value, onCommit }: { label: string; value: string; onCommit: (key: string) => void }) {
  const [text, setText] = useState(keyToDisplay(value));
  useEffect(() => setText(keyToDisplay(value)), [value]);
  const commit = () => { const key = parseDisplayDate(text); if (key) onCommit(key); else setText(keyToDisplay(value)); };
  return <label className="grid gap-1 text-xs font-medium text-muted-foreground">{label}<Input value={text} inputMode="numeric" placeholder="დდ.თთ.წწწწ" maxLength={10} className="cwk-num w-36" onChange={event => setText(event.target.value)} onBlur={commit} onKeyDown={event => { if (event.key === "Enter") { event.preventDefault(); commit(); } }} /></label>;
}
const feedbackHasData = (data: { feedback: { total: number }; consent: { currentOptIns: { marketingSms: number; marketingEmail: number; bookingTerms: number }; activity: { granted: number; withdrawn: number } } }) => data.feedback.total > 0 || data.consent.currentOptIns.marketingSms + data.consent.currentOptIns.marketingEmail + data.consent.currentOptIns.bookingTerms + data.consent.activity.granted + data.consent.activity.withdrawn > 0;

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
  const feedbackInsights = trpc.reporting.feedbackInsights.useQuery(reportInput, { enabled: Boolean(organization?.id) });
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
    if (amountTetri === null || amountTetri <= 0) { setExpenseFormError("მიუთითეთ თანხა ლარში."); return; }
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

  const rangeTimeZone = locations.data?.[0]?.timezone ?? "Asia/Tbilisi";
  const summary = report.data?.summary;
  const history = bookingHistory.data;
  const pageStart = history?.total ? offset + 1 : 0;
  const pageEnd = Math.min(offset + HISTORY_PAGE_SIZE, history?.total ?? 0);
  const revenueTrend = analytics.data?.revenueTrend ?? [];
  const commissionData = commissions.data?.specialists ?? [];
  const currentPeriod: "7d" | "30d" | "90d" = Math.abs(Math.round((range.endsAt.getTime() - range.startsAt.getTime()) / 86_400_000)) <= 8 ? "7d" : Math.abs(Math.round((range.endsAt.getTime() - range.startsAt.getTime()) / 86_400_000)) <= 31 ? "30d" : "90d";
  const applySavedView = useCallback((payload: SavedViewPayload) => {
    if (!payload.period) return;
    const endsAt = new Date();
    const startsAt = new Date(endsAt);
    startsAt.setDate(startsAt.getDate() - (payload.period === "7d" ? 7 : payload.period === "30d" ? 30 : 90));
    setRange({ startsAt, endsAt });
    setOffset(0);
  }, []);

  return (
    <DashboardLayout>
      <div className="sf-workspace-page mx-auto w-full max-w-7xl space-y-5">
        <WorkspacePageHeader
          title="ანგარიშები"
          actions={<>{organization && canManageFinance ? <Button onClick={() => { setExpenseFormError(""); setExpenseOpen(true); }}><Plus className="mr-2 size-4" aria-hidden="true" />ხარჯი</Button> : null}<Button variant="outline" disabled={!organization || csvExport.isFetching} onClick={download} title="CSV ფაილად ჩამოტვირთვა"><Download className="mr-2 size-4" />{csvExport.isFetching ? "მზადდება…" : "ექსპორტი"}</Button></>}
        />

        <WorkspaceFilterBar>
          <DateKeyInput label="დაწყება" value={dateKeyInTimeZone(range.startsAt, rangeTimeZone)} onCommit={key => { const startsAt = localInputToUtc(`${key}T00:00`, rangeTimeZone); setRange(current => ({ ...current, startsAt })); setOffset(0); }} />
          <DateKeyInput label="დასრულება" value={dateKeyInTimeZone(range.endsAt, rangeTimeZone)} onCommit={key => { const endsAt = new Date(localInputToUtc(`${key}T00:00`, rangeTimeZone).getTime() + 86_400_000 - 1); setRange(current => ({ ...current, endsAt })); setOffset(0); }} />
          {organization ? <SavedViewMenu organizationId={organization.id} route="/app/reports" filterPayload={{ period: currentPeriod }} onApply={applySavedView} /> : null}
        </WorkspaceFilterBar>

        {report.isError ? <WorkspaceState kind="error" title="მონაცემები მიუწვდომელია" /> : null}
        {!organization && !organizations.isLoading ? <WorkspaceState kind="empty" title="ჯერ შექმენით სამუშაო სივრცე" /> : null}

        {organization ? <>
          <CompactMetricRail label="ფინანსური მაჩვენებლები"><MetricCell label="შემოსავალი" value={report.isLoading ? "…" : gel(summary?.collectedRevenueTetri ?? 0)} /><MetricCell label="დარჩენილი ბალანსი" value={report.isLoading ? "…" : gel(summary?.unpaidBalanceTetri ?? 0)} /><MetricCell label="ხარჯები" value={report.isLoading ? "…" : gel(summary?.expensesTetri ?? 0)} /></CompactMetricRail>


          <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-[.9fr_1.1fr]">
            <WorkspaceSection title="კვირის შედარება">
              {analytics.isLoading ? <SectionLoading title="იტვირთება…" /> : null}
              {!analytics.isLoading && analytics.data ? <WeekComparisonPanel data={analytics.data.weekComparison} /> : null}
            </WorkspaceSection>
            <WorkspaceSection title="პროგნოზი: მომდევნო 7 დღე">
              {analytics.isLoading ? <SectionLoading title="იტვირთება…" /> : null}
              {!analytics.isLoading && analytics.data ? <BookingForecastPanel data={analytics.data.bookingForecast} /> : null}
            </WorkspaceSection>
          </div>

          <WorkspaceSection title="გადახდის მეთოდები">
            <dl className="divide-y divide-border">
              {Object.entries(report.data?.paymentMethods ?? { CASH: 0, CARD_TERMINAL: 0, BANK_TRANSFER: 0, ONLINE: 0, OTHER: 0 }).map(([method, amount]) => <div key={method} className="flex items-center justify-between gap-3 py-2 text-sm"><dt className="text-muted-foreground">{formatPaymentMethod(method)}</dt><dd className="cwk-num font-semibold">{gel(amount)}</dd></div>)}
            </dl>
          </WorkspaceSection>

          <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-[1.15fr_.85fr]">
            <WorkspaceSection title="შემოსავალი დღეების მიხედვით">
              {analytics.isLoading ? <SectionLoading title="იტვირთება…" /> : null}
              {!analytics.isLoading && !revenueTrend.length ? <SectionEmpty title="ამ პერიოდში შემოსავალი არ არის" /> : null}
              {!analytics.isLoading && revenueTrend.length ? <RevenueTrendChart data={revenueTrend} /> : null}
            </WorkspaceSection>

            <WorkspaceSection title="გუნდი">
              {analytics.isLoading ? <SectionLoading title="იტვირთება…" /> : null}
              {!analytics.isLoading && !analytics.data?.staffMetrics.length ? <SectionEmpty title="მონაცემი არ არის" /> : null}
              <div className="divide-y divide-border">{analytics.data?.staffMetrics.slice(0, 5).map(staff => <div key={staff.staffProfileId} className="flex items-center justify-between gap-3 py-2 text-sm"><div className="min-w-0"><p className="truncate font-medium">{staff.publicDisplayName}</p><p className="text-xs text-muted-foreground">შესრულებული: <span className="cwk-num">{staff.completedAppointments}</span> · სერვისები: <span className="cwk-num">{staff.bookingCount}</span></p></div><p className="cwk-num shrink-0 font-semibold">{gel(staff.bookedRevenueTetri)}</p></div>)}</div>
              {!analytics.isLoading ? <div className="mt-3 border-t border-border pt-3 text-sm"><p className="text-muted-foreground">ხარჯი / ჯავშნების თანხა</p><p className="mt-1 cwk-num text-lg font-semibold">{analytics.data?.expensePressureBasisPoints === null ? "—" : `${((analytics.data?.expensePressureBasisPoints ?? 0) / 100).toFixed(2)}%`}</p><p className="mt-1 cwk-num text-xs text-muted-foreground">{gel(analytics.data?.expensesTetri ?? 0)} / {gel(analytics.data?.bookedRevenueTetri ?? 0)}</p></div> : null}
            </WorkspaceSection>
          </div>

          <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-[.9fr_1.1fr]">
            <WorkspaceSection title="სერვისები">
              {analytics.isLoading ? <SectionLoading title="იტვირთება…" /> : null}
              {!analytics.isLoading && !analytics.data?.serviceMix.length ? <SectionEmpty title="მონაცემი არ არის" /> : null}
              <div className="divide-y divide-border">{analytics.data?.serviceMix.slice(0, 6).map(service => <div key={service.serviceName} className="flex items-center justify-between gap-3 py-2 text-sm"><div className="min-w-0"><p className="truncate font-medium">{service.serviceName}</p><p className="cwk-num text-xs text-muted-foreground">{service.bookingCount}</p></div><p className="cwk-num shrink-0 font-semibold">{gel(service.revenueTetri)}</p></div>)}</div>
            </WorkspaceSection>

            {canManageFinance ? <WorkspaceSection title="კომისიები">
              {commissions.isLoading ? <SectionLoading title="იტვირთება…" /> : null}
              {commissions.isError ? <WorkspaceState kind="error" title="მონაცემები მიუწვდომელია" /> : null}
              {!commissions.isLoading && !commissions.isError && !commissionData.length ? <SectionEmpty title="ამ პერიოდში კომისია არ არის" /> : null}
              {!commissions.isLoading && !commissions.isError && commissionData.length ? <CommissionDistributionChart data={commissionData} /> : null}
            </WorkspaceSection> : <WorkspaceSection title="კომისიები"><WorkspaceState kind="empty" title="წვდომა არ გაქვთ" description="ხელმისაწვდომია მფლობელისა და მენეჯერისთვის." /></WorkspaceSection>}
          </div>

          <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-[1.05fr_.95fr]">
            <WorkspaceSection title="კლიენტების დაბრუნება">
              {analytics.isLoading ? <SectionLoading title="იტვირთება…" /> : null}
              {!analytics.isLoading && analytics.data ? <RetentionCohortPanel data={analytics.data.retentionCohorts} /> : null}
            </WorkspaceSection>
            <WorkspaceSection title="დატვირთვა დღისა და საათის მიხედვით">
              {analytics.isLoading ? <SectionLoading title="იტვირთება…" /> : null}
              {!analytics.isLoading && analytics.data ? <PeakHourHeatmapPanel data={analytics.data.peakHourHeatmap} /> : null}
            </WorkspaceSection>
          </div>

          {feedbackInsights.isLoading ? <SectionLoading title="იტვირთება…" /> : feedbackInsights.isError ? <WorkspaceState kind="error" title="მონაცემები მიუწვდომელია" /> : feedbackInsights.data && !feedbackHasData(feedbackInsights.data) ? <p className="rounded-xl bg-[var(--sf-surface-2)] px-4 py-3 text-sm text-muted-foreground">შეფასებები და თანხმობები: ამ პერიოდში მონაცემი არ არის.</p> : feedbackInsights.data ? <WorkspaceSection title="შეფასებები და თანხმობები"><FeedbackConsentInsights data={feedbackInsights.data} /></WorkspaceSection> : null}

          {canManageFinance ? <>
            <WorkspaceSection title="კომისიის წესები" action={<div className="flex flex-wrap gap-2"><Button variant="outline" size="sm" className="max-md:h-11" disabled={runBackfill.isPending || !commissionRules.data?.length} onClick={() => organization && runBackfill.mutate(reportInput)}><PlayCircle className="mr-2 size-4" />{runBackfill.isPending ? "მიმდინარეობს…" : "პერიოდის დარიცხვა"}</Button><Button size="sm" className="max-md:h-11" onClick={() => { setRuleError(""); setRuleOpen(true); }}><Plus className="mr-2 size-4" aria-hidden="true" />წესი</Button></div>}>{commissionRules.isLoading ? <WorkspaceState kind="loading" title="იტვირთება…" /> : null}{!commissionRules.isLoading && !commissionRules.data?.length ? <p className="rounded-xl bg-[var(--sf-surface-2)] p-4 text-sm text-muted-foreground">კომისიის წესი ჯერ არ არის.</p> : null}<div className="space-y-2">{commissionRules.data?.map(row => <div key={row.rule.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border p-3"><div className="min-w-0 flex-1"><p className="font-medium"><span className="cwk-num">{row.rule.type === "PERCENTAGE" ? `${(row.rule.valueTetri / 100).toFixed(2)}%` : gel(row.rule.valueTetri)}</span> <span className="text-sm text-muted-foreground">— {row.staff?.publicDisplayName ?? "ყველა სპეციალისტი"} · {row.service?.nameKa ?? "ყველა სერვისი"}{row.location?.name ? ` · ${row.location.name}` : ""}</span></p></div><Button variant="ghost" size="icon" onClick={() => organization && deleteRule.mutate({ organizationId: organization.id, id: row.rule.id })} disabled={deleteRule.isPending} aria-label="კომისიის წესის წაშლა"><Trash2 className="size-4 text-destructive" /></Button></div>)}</div></WorkspaceSection>
            <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-2">
              <WorkspaceSection title="კომისიები">{commissions.isLoading ? <WorkspaceState kind="loading" title="იტვირთება…" /> : null}{!commissions.isLoading ? <CompactMetricRail label="კომისიები"><MetricCell label="დარიცხული" value={gel(commissions.data?.totalTetri ?? 0)} /><MetricCell label="გადახდილი" value={gel(commissions.data?.paidTetri ?? 0)} /></CompactMetricRail> : null}</WorkspaceSection>
              <WorkspaceSection title="ბოლო ხარჯები" action={<span className="cwk-num text-sm text-muted-foreground">{expenses.data?.length ?? 0}</span>}><div className="space-y-2">{expenses.isLoading ? <WorkspaceState kind="loading" title="იტვირთება…" /> : null}{expenses.isError ? <WorkspaceState kind="error" title="ჩატვირთვა ვერ მოხერხდა" /> : null}{!expenses.isLoading && !expenses.isError && !expenses.data?.length ? <p className="rounded-xl bg-[var(--sf-surface-2)] p-4 text-sm text-muted-foreground">ხარჯი ჯერ არ არის.</p> : null}{expenses.data?.slice(0, 5).map(expense => <div key={expense.id} className="flex items-center justify-between gap-3 rounded-lg border border-border p-3"><div className="min-w-0"><p className="truncate font-medium">{expense.category}</p><p className="truncate text-sm text-muted-foreground"><span className="cwk-num">{formatKaDate(expense.expenseDate)}</span>{expense.description ? ` · ${expense.description}` : ""}</p></div><p className="shrink-0 cwk-num font-semibold">{gel(expense.amountTetri)}</p></div>)}</div></WorkspaceSection>
            </div>
          </> : null}

          <WorkspaceSection title="ჯავშნების ისტორია" action={<span className="cwk-num text-sm text-muted-foreground">{history?.total ?? 0}</span>}>{bookingHistory.isError ? <WorkspaceState kind="error" title="ისტორია მიუწვდომელია" description="შეამოწმეთ კავშირი და სცადეთ ხელახლა." action={<Button variant="outline" onClick={() => { void bookingHistory.refetch(); }}>თავიდან ცდა</Button>} /> : null}{bookingHistory.isLoading ? <WorkspaceState kind="loading" title="იტვირთება…" /> : null}{!bookingHistory.isLoading && !bookingHistory.isError && !history?.items.length ? <WorkspaceState kind="empty" title="ამ პერიოდში ჯავშანი არ არის" /> : null}{!bookingHistory.isLoading && !bookingHistory.isError && history?.items.length ? <><div className="overflow-x-auto rounded-xl border border-border"><table className="w-full min-w-[30rem] text-left text-sm"><thead className="bg-[var(--sf-surface-2)] text-[13px] font-semibold text-muted-foreground"><tr><th className="px-4 py-2.5">ნომერი</th><th className="px-4 py-2.5">თარიღი და დრო</th><th className="px-4 py-2.5">სტატუსი</th><th className="px-4 py-2.5 text-right">ჯამი</th></tr></thead><tbody className="divide-y">{history.items.map(appointment => <tr key={appointment.id} className="transition-colors hover:bg-muted/40"><td className="px-4 py-2.5 cwk-num text-xs font-medium">#{appointment.id.slice(-8).toUpperCase()}</td><td className="px-4 py-2.5 cwk-num text-muted-foreground">{formatKaDateTime(new Date(appointment.startsAt))}</td><td className="px-4 py-2.5"><WorkspaceStatusPill status={appointment.status as WorkspaceStatus} /></td><td className="px-4 py-2.5 text-right cwk-num font-semibold">{gel(appointment.totalTetri)}</td></tr>)}</tbody></table></div><div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-sm"><p className="cwk-num text-muted-foreground">{pageStart}–{pageEnd} / {history.total}</p><div className="flex gap-2"><Button variant="outline" size="sm" className="max-md:h-11" onClick={() => setOffset(current => Math.max(0, current - HISTORY_PAGE_SIZE))} disabled={offset === 0}><ChevronLeft className="mr-1 size-4" />წინა</Button><Button variant="outline" size="sm" className="max-md:h-11" onClick={() => setOffset(current => current + HISTORY_PAGE_SIZE)} disabled={offset + HISTORY_PAGE_SIZE >= history.total}>შემდეგი<ChevronRight className="ml-1 size-4" /></Button></div></div></> : null}</WorkspaceSection>
        </> : null}
      </div>

      <Dialog open={ruleOpen} onOpenChange={setRuleOpen}><DialogContent><DialogHeader><DialogTitle>კომისიის წესის დამატება</DialogTitle><DialogDescription>ცარიელი ველი — წესი ყველასთვის მოქმედებს.</DialogDescription></DialogHeader><form onSubmit={submitRule} className="space-y-4"><div className="grid gap-3 sm:grid-cols-2"><div className="space-y-2"><Label htmlFor="rule-type">ტიპი</Label><Select value={ruleType} onValueChange={value => setRuleType(value as "PERCENTAGE" | "FIXED")}><SelectTrigger id="rule-type"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="PERCENTAGE">პროცენტი</SelectItem><SelectItem value="FIXED">ფიქსირებული (₾)</SelectItem></SelectContent></Select></div><div className="space-y-2"><Label htmlFor="rule-value">{ruleType === "PERCENTAGE" ? "პროცენტი" : "თანხა (₾)"}</Label><Input id="rule-value" value={ruleValue} onChange={event => setRuleValue(event.target.value)} inputMode="decimal" placeholder={ruleType === "PERCENTAGE" ? "მაგ. 40" : "მაგ. 25.00"} required /></div></div><div className="grid gap-3 sm:grid-cols-2"><div className="space-y-2"><Label htmlFor="rule-staff">სპეციალისტი <span className="font-normal text-muted-foreground">(არასავალდებულო)</span></Label><Select value={ruleStaffId || "all"} onValueChange={value => setRuleStaffId(value === "all" ? "" : value)}><SelectTrigger id="rule-staff"><SelectValue placeholder="ყველა" /></SelectTrigger><SelectContent><SelectItem value="all">ყველა სპეციალისტი</SelectItem>{staffList.data?.map(item => <SelectItem key={item.profile.id} value={item.profile.id}>{item.profile.publicDisplayName}</SelectItem>)}</SelectContent></Select></div><div className="space-y-2"><Label htmlFor="rule-service">სერვისი <span className="font-normal text-muted-foreground">(არასავალდებულო)</span></Label><Select value={ruleServiceId || "all"} onValueChange={value => setRuleServiceId(value === "all" ? "" : value)}><SelectTrigger id="rule-service"><SelectValue placeholder="ყველა" /></SelectTrigger><SelectContent><SelectItem value="all">ყველა სერვისი</SelectItem>{catalog.data?.map(item => <SelectItem key={item.service.id} value={item.service.id}>{item.service.nameKa}</SelectItem>)}</SelectContent></Select></div></div>{locations.data?.length ? <div className="space-y-2"><Label htmlFor="rule-location">ფილიალი <span className="font-normal text-muted-foreground">(არასავალდებულო)</span></Label><Select value={ruleLocationId || "all"} onValueChange={value => setRuleLocationId(value === "all" ? "" : value)}><SelectTrigger id="rule-location"><SelectValue placeholder="ყველა" /></SelectTrigger><SelectContent><SelectItem value="all">ყველა ფილიალი</SelectItem>{locations.data.map(location => <SelectItem key={location.id} value={location.id}>{location.name}</SelectItem>)}</SelectContent></Select></div> : null}{ruleError ? <p role="alert" className="text-sm text-destructive">{ruleError}</p> : null}<DialogFooter><Button type="submit" disabled={createRule.isPending}><Wallet className="mr-2 size-4" />{createRule.isPending ? "ინახება…" : "შენახვა"}</Button></DialogFooter></form></DialogContent></Dialog>
      <Dialog open={expenseOpen} onOpenChange={setExpenseOpen}><DialogContent><DialogHeader><DialogTitle>ხარჯის დამატება</DialogTitle></DialogHeader><form onSubmit={submitExpense} className="space-y-4"><div className="space-y-2"><Label htmlFor="expense-location">ფილიალი</Label><Select value={expenseLocationId} onValueChange={setExpenseLocationId}><SelectTrigger id="expense-location"><SelectValue placeholder="აირჩიეთ ფილიალი" /></SelectTrigger><SelectContent>{locations.data?.map(location => <SelectItem key={location.id} value={location.id}>{location.name}</SelectItem>)}</SelectContent></Select></div><div className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><Label htmlFor="expense-category">კატეგორია</Label><Input id="expense-category" value={expenseCategory} onChange={event => setExpenseCategory(event.target.value)} placeholder="მაგ. ქირა" minLength={2} maxLength={100} required /></div><div className="space-y-2"><Label htmlFor="expense-amount">თანხა (₾)</Label><Input id="expense-amount" value={expenseAmount} onChange={event => setExpenseAmount(event.target.value)} inputMode="decimal" placeholder="120.00" required /></div></div><div className="space-y-2"><Label htmlFor="expense-date">თარიღი</Label><Input id="expense-date" type="date" value={expenseDate} onChange={event => setExpenseDate(event.target.value)} required /></div><div className="space-y-2"><Label htmlFor="expense-description">შენიშვნა <span className="text-muted-foreground">(არასავალდებულო)</span></Label><Input id="expense-description" value={expenseDescription} onChange={event => setExpenseDescription(event.target.value)} maxLength={5000} /></div>{expenseFormError ? <p role="alert" className="text-sm text-destructive">{expenseFormError}</p> : null}<DialogFooter><Button type="submit" disabled={createExpense.isPending}>{createExpense.isPending ? "ინახება…" : "შენახვა"}</Button></DialogFooter></form></DialogContent></Dialog>
    </DashboardLayout>
  );
}
