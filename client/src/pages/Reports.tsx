import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronLeft, ChevronRight, Download, ReceiptText, TrendingUp, WalletCards } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useMemo, useState } from "react";

const HISTORY_PAGE_SIZE = 10;

const statusLabels: Record<string, string> = {
  PENDING: "მოლოდინში",
  CONFIRMED: "დადასტურებული",
  CHECKED_IN: "მიღებულია",
  IN_SERVICE: "მომსახურებაში",
  COMPLETED: "დასრულებული",
  CANCELLED: "გაუქმებული",
  NO_SHOW: "არ გამოცხადდა",
};

const statusStyles: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-800",
  CONFIRMED: "bg-emerald-100 text-emerald-800",
  CHECKED_IN: "bg-sky-100 text-sky-800",
  IN_SERVICE: "bg-violet-100 text-violet-800",
  COMPLETED: "bg-emerald-100 text-emerald-800",
  CANCELLED: "bg-rose-100 text-rose-800",
  NO_SHOW: "bg-slate-200 text-slate-700",
};

function gel(value: number) {
  return new Intl.NumberFormat("ka-GE", { style: "currency", currency: "GEL" }).format(value / 100);
}

function formatAppointmentDate(value: Date) {
  return new Intl.DateTimeFormat("ka-GE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(value);
}

export default function Reports() {
  const organizations = trpc.organizations.listMine.useQuery();
  const organization = organizations.data?.[0]?.organization;
  const [offset, setOffset] = useState(0);
  const [range] = useState(() => {
    const endsAt = new Date();
    const startsAt = new Date(endsAt);
    startsAt.setDate(startsAt.getDate() - 30);
    return { startsAt, endsAt };
  });
  const reportInput = useMemo(() => ({ organizationId: organization?.id ?? "", ...range }), [organization?.id, range]);
  const bookingHistoryInput = useMemo(() => ({ ...reportInput, limit: HISTORY_PAGE_SIZE, offset }), [offset, reportInput]);
  const report = trpc.reporting.revenueSummary.useQuery(reportInput, { enabled: Boolean(organization?.id) });
  const bookingHistory = trpc.reporting.bookingHistory.useQuery(bookingHistoryInput, { enabled: Boolean(organization?.id) });
  const csvExport = trpc.reporting.exportCsv.useQuery(reportInput, { enabled: false });

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

  return (
    <DashboardLayout>
      <div className="mx-auto w-full max-w-7xl space-y-6">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium text-primary">ფინანსური მიმოხილვა</p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight">ანგარიშები</h1>
            <p className="mt-2 text-sm text-muted-foreground">ბოლო 30 დღის ჯავშნები, შემოსავლები და გადახდების განაწილება.</p>
          </div>
          <Button variant="outline" disabled={!organization || csvExport.isFetching} onClick={download}>
            <Download className="mr-2 h-4 w-4" />
            {csvExport.isFetching ? "ექსპორტი მზადდება…" : "CSV ექსპორტი"}
          </Button>
        </header>

        {report.isError ? <Card className="border-destructive/30 bg-destructive/5"><CardContent className="p-6 text-sm text-destructive">ანგარიშის მონაცემები დროებით მიუწვდომელია.</CardContent></Card> : null}
        {!organization && !organizations.isLoading ? <Card><CardContent className="p-8 text-sm text-muted-foreground">ანგარიშების სანახავად ჯერ შექმენით სამუშაო სივრცე.</CardContent></Card> : null}

        {organization ? (
          <>
            <div className="grid gap-4 md:grid-cols-3">
              <Metric icon={TrendingUp} label="აკუმულირებული შემოსავალი" value={report.isLoading ? "…" : gel(summary?.collectedRevenueTetri ?? 0)} hint="დარიცხული გადახდები მინუს დაბრუნებები" />
              <Metric icon={WalletCards} label="დარჩენილი ბალანსი" value={report.isLoading ? "…" : gel(summary?.unpaidBalanceTetri ?? 0)} hint="ჯავშნებზე გადასახდელი თანხა" />
              <Metric icon={ReceiptText} label="ხარჯები" value={report.isLoading ? "…" : gel(summary?.expensesTetri ?? 0)} hint="აქტიური ხარჯები არჩეულ პერიოდში" />
            </div>

            <Card>
              <CardHeader><CardTitle>გადახდის მეთოდები</CardTitle></CardHeader>
              <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                {Object.entries(report.data?.paymentMethods ?? { CASH: 0, CARD_TERMINAL: 0, BANK_TRANSFER: 0, ONLINE: 0, OTHER: 0 }).map(([method, amount]) => (
                  <div key={method} className="rounded-xl bg-primary/5 p-4">
                    <p className="text-xs font-medium text-muted-foreground">{method}</p>
                    <p className="mt-2 text-lg font-semibold">{gel(amount)}</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-4">
                <div>
                  <CardTitle>ჯავშნების ისტორია</CardTitle>
                  <p className="mt-1 text-sm text-muted-foreground">არჩეული 30-დღიანი პერიოდის ჯავშნები, ახალი ჩანაწერიდან ძველისკენ.</p>
                </div>
                <span className="shrink-0 text-sm text-muted-foreground">{history?.total ?? 0} ჩანაწერი</span>
              </CardHeader>
              <CardContent>
                {bookingHistory.isError ? <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-5 text-sm text-destructive">ჯავშნების ისტორია დროებით მიუწვდომელია.</div> : null}
                {bookingHistory.isLoading ? <div className="rounded-xl border border-dashed p-5 text-sm text-muted-foreground">ჯავშნების ისტორია იტვირთება…</div> : null}
                {!bookingHistory.isLoading && !bookingHistory.isError && !history?.items.length ? <div className="rounded-xl border border-dashed p-6 text-sm text-muted-foreground">ამ პერიოდში ჯავშანი ჯერ არ არის.</div> : null}
                {!bookingHistory.isLoading && !bookingHistory.isError && history?.items.length ? (
                  <>
                    <div className="overflow-x-auto rounded-xl border">
                      <table className="w-full min-w-[670px] text-left text-sm">
                        <thead className="bg-muted/60 text-xs font-semibold uppercase tracking-wide text-muted-foreground"><tr><th className="px-4 py-3">რეფერენსი</th><th className="px-4 py-3">თარიღი და დრო</th><th className="px-4 py-3">სტატუსი</th><th className="px-4 py-3 text-right">ჯამი</th></tr></thead>
                        <tbody className="divide-y">
                          {history.items.map(appointment => (
                            <tr key={appointment.id} className="transition-colors hover:bg-muted/40">
                              <td className="px-4 py-3 font-mono text-xs font-medium">#{appointment.id.slice(-8).toUpperCase()}</td>
                              <td className="px-4 py-3 text-muted-foreground">{formatAppointmentDate(appointment.startsAt)}</td>
                              <td className="px-4 py-3"><span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyles[appointment.status] ?? "bg-muted text-muted-foreground"}`}>{statusLabels[appointment.status] ?? appointment.status}</span></td>
                              <td className="px-4 py-3 text-right font-semibold">{gel(appointment.totalTetri)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="mt-4 flex flex-col gap-3 text-sm sm:flex-row sm:items-center sm:justify-between">
                      <p className="text-muted-foreground">ნაჩვენებია {pageStart}–{pageEnd} {history.total}-დან</p>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => setOffset(current => Math.max(0, current - HISTORY_PAGE_SIZE))} disabled={offset === 0}><ChevronLeft className="mr-1 h-4 w-4" />წინა</Button>
                        <Button variant="outline" size="sm" onClick={() => setOffset(current => current + HISTORY_PAGE_SIZE)} disabled={offset + HISTORY_PAGE_SIZE >= history.total}>შემდეგი<ChevronRight className="ml-1 h-4 w-4" /></Button>
                      </div>
                    </div>
                  </>
                ) : null}
              </CardContent>
            </Card>
          </>
        ) : null}
      </div>
    </DashboardLayout>
  );
}

function Metric({ icon: Icon, label, value, hint }: { icon: typeof TrendingUp; label: string; value: string; hint: string }) {
  return <Card><CardContent className="p-5"><Icon className="h-5 w-5 text-primary" /><p className="mt-4 text-sm text-muted-foreground">{label}</p><p className="mt-2 text-2xl font-semibold">{value}</p><p className="mt-3 text-xs text-muted-foreground">{hint}</p></CardContent></Card>;
}
