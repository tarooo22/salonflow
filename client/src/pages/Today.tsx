import DashboardLayout from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarDays, CircleAlert, UsersRound } from "lucide-react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";

export default function Today() {
  const organizations = trpc.organizations.listMine.useQuery();
  const organizationEntry = organizations.data?.[0];
  const organization = organizationEntry?.organization;
  const hasOrganization = Boolean(organization);
  const dashboard = trpc.appointments.dashboard.useQuery(
    { organizationId: organization?.id ?? "" },
    { enabled: Boolean(organization?.id) },
  );
  const appointmentCount = dashboard.data?.appointments.length ?? 0;
  const pendingCount = dashboard.data?.counts.PENDING ?? 0;
  const unpaidCount = dashboard.data?.balances.filter(item => item.totals.balanceTetri > 0).length ?? 0;

  return (
    <DashboardLayout>
      <div className="mx-auto w-full max-w-7xl space-y-6">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium text-primary">ოპერაციების მიმოხილვა</p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight">დღეს</h1>
            <p className="mt-2 text-sm text-muted-foreground">დღის ჯავშნები, სტატუსები და გუნდის დატვირთვა ერთ სივრცეში.</p>
          </div>
          <Badge variant="outline" className="w-fit border-primary/30 bg-primary/5 px-3 py-1 text-primary">{organization?.name ?? "Asia/Tbilisi"}</Badge>
        </header>

        {organizations.isLoading ? <div className="rounded-2xl border bg-card p-8 text-sm text-muted-foreground">სამუშაო სივრცე იტვირთება…</div> : null}
        {organizations.isError ? <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6 text-sm text-destructive">სამუშაო სივრცის მონაცემები დროებით მიუწვდომელია. გთხოვთ სცადოთ ხელახლა.</div> : null}
        {!organizations.isLoading && !organizations.isError && !hasOrganization ? (
          <Card className="border-primary/20 bg-[linear-gradient(135deg,hsl(var(--card)),hsl(var(--primary)/0.06))]">
            <CardHeader><CardTitle>მზად არის თქვენი სალონის სამუშაო სივრცე</CardTitle></CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
              <p>დაიწყეთ ორგანიზაციისა და პირველი ფილიალის შექმნით. შემდეგ შეძლებთ დაამატოთ გუნდი, სერვისები და სამუშაო საათები.</p>
              <Button asChild><Link href="/app/staff">გუნდის მართვაზე გადასვლა</Link></Button>
            </CardContent>
          </Card>
        ) : null}

        {hasOrganization ? <>
          <div className="grid gap-4 md:grid-cols-3">
            <Metric icon={CalendarDays} label="დღევანდელი ჯავშნები" value={dashboard.isLoading ? "…" : String(appointmentCount)} hint={appointmentCount ? "ყველა სტატუსის ჯავშანი დღევანდელი სამუშაო დღისათვის" : "დღეს დაგეგმილი ჯავშნები ჯერ არ არის"} />
            <Metric icon={UsersRound} label="დასადასტურებელი" value={dashboard.isLoading ? "…" : String(pendingCount)} hint={pendingCount ? "საჯარო დაჯავშნები ელოდება თქვენი გუნდის გადაწყვეტილებას" : "დასადასტურებელი ჯავშნები არ არის"} />
            <Metric icon={CircleAlert} label="გადასახდელი" value={dashboard.isLoading ? "…" : String(unpaidCount)} hint={unpaidCount ? "ჯავშნებზე დარჩენილი ბალანსი საჭიროებს ყურადღებას" : "დღეს დარჩენილი ბალანსი არ არის"} />
          </div>
          {dashboard.isError ? <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-5 text-sm text-destructive">დღის ოპერაციული მონაცემები დროებით ვერ ჩაიტვირთა. გთხოვთ სცადოთ ხელახლა.</div> : null}
          {!dashboard.isLoading && !dashboard.isError && appointmentCount === 0 ? <div className="rounded-2xl border border-dashed bg-card/50 p-6 text-sm text-muted-foreground">როდესაც პირველი ჯავშანი შეიქმნება, აქ იხილავთ დღის სტატუსებსა და გადახდების საჭიროებებს.</div> : null}
        </> : null}
      </div>
    </DashboardLayout>
  );
}

function Metric({ icon: Icon, label, value, hint }: { icon: typeof CalendarDays; label: string; value: string; hint: string }) {
  return <Card><CardContent className="p-5"><div className="flex items-start justify-between"><div><p className="text-sm text-muted-foreground">{label}</p><p className="mt-3 text-3xl font-semibold tracking-tight">{value}</p></div><Icon className="h-5 w-5 text-primary" /></div><p className="mt-4 text-xs leading-relaxed text-muted-foreground">{hint}</p></CardContent></Card>;
}
