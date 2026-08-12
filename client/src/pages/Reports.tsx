import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, ReceiptText, TrendingUp, WalletCards } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useState } from "react";

function gel(value: number) {
  return new Intl.NumberFormat("ka-GE", { style: "currency", currency: "GEL" }).format(value / 100);
}

export default function Reports() {
  const organizations = trpc.organizations.listMine.useQuery();
  const organization = organizations.data?.[0]?.organization;
  const [range] = useState(() => {
    const endsAt = new Date();
    const startsAt = new Date(endsAt);
    startsAt.setDate(startsAt.getDate() - 30);
    return { startsAt, endsAt };
  });
  const report = trpc.reporting.revenueSummary.useQuery({ organizationId: organization?.id ?? "", ...range }, { enabled: Boolean(organization?.id) });
  const csvExport = trpc.reporting.exportCsv.useQuery({ organizationId: organization?.id ?? "", ...range }, { enabled: false });
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
  return <DashboardLayout><div className="mx-auto w-full max-w-7xl space-y-6"><header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-sm font-medium text-primary">ფინანსური მიმოხილვა</p><h1 className="mt-1 text-3xl font-semibold tracking-tight">ანგარიშები</h1><p className="mt-2 text-sm text-muted-foreground">ბოლო 30 დღის ჯავშნები, შემოსავლები და გადახდების განაწილება.</p></div><Button variant="outline" disabled={!organization || csvExport.isFetching} onClick={download}><Download className="mr-2 h-4 w-4" />{csvExport.isFetching ? "ექსპორტი მზადდება…" : "CSV ექსპორტი"}</Button></header>
    {report.isError ? <Card className="border-destructive/30 bg-destructive/5"><CardContent className="p-6 text-sm text-destructive">ანგარიშის მონაცემები დროებით მიუწვდომელია.</CardContent></Card> : null}
    {!organization && !organizations.isLoading ? <Card><CardContent className="p-8 text-sm text-muted-foreground">ანგარიშების სანახავად ჯერ შექმენით სამუშაო სივრცე.</CardContent></Card> : null}
    {organization ? <><div className="grid gap-4 md:grid-cols-3"><Metric icon={TrendingUp} label="აკუმულირებული შემოსავალი" value={report.isLoading ? "…" : gel(summary?.collectedRevenueTetri ?? 0)} hint="დარიცხული გადახდები მინუს დაბრუნებები" /><Metric icon={WalletCards} label="დარჩენილი ბალანსი" value={report.isLoading ? "…" : gel(summary?.unpaidBalanceTetri ?? 0)} hint="ჯავშნებზე გადასახდელი თანხა" /><Metric icon={ReceiptText} label="ხარჯები" value={report.isLoading ? "…" : gel(summary?.expensesTetri ?? 0)} hint="აქტიური ხარჯები არჩეულ პერიოდში" /></div><Card><CardHeader><CardTitle>გადახდის მეთოდები</CardTitle></CardHeader><CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">{Object.entries(report.data?.paymentMethods ?? { CASH: 0, CARD_TERMINAL: 0, BANK_TRANSFER: 0, ONLINE: 0, OTHER: 0 }).map(([method, amount]) => <div key={method} className="rounded-xl bg-primary/5 p-4"><p className="text-xs font-medium text-muted-foreground">{method}</p><p className="mt-2 text-lg font-semibold">{gel(amount)}</p></div>)}</CardContent></Card></> : null}
  </div></DashboardLayout>;
}

function Metric({ icon: Icon, label, value, hint }: { icon: typeof TrendingUp; label: string; value: string; hint: string }) {
  return <Card><CardContent className="p-5"><Icon className="h-5 w-5 text-primary" /><p className="mt-4 text-sm text-muted-foreground">{label}</p><p className="mt-2 text-2xl font-semibold">{value}</p><p className="mt-3 text-xs text-muted-foreground">{hint}</p></CardContent></Card>;
}
