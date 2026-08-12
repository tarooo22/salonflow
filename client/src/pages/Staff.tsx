import DashboardLayout from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { BriefcaseBusiness, MapPin, UsersRound } from "lucide-react";

const roleLabel: Record<string, string> = {
  OWNER: "მფლობელი",
  MANAGER: "მენეჯერი",
  RECEPTIONIST: "ადმინისტრატორი",
  STAFF: "სპეციალისტი",
};

export default function Staff() {
  const organizations = trpc.organizations.listMine.useQuery();
  const organization = organizations.data?.[0]?.organization;
  const staff = trpc.staff.list.useQuery({ organizationId: organization?.id ?? "" }, { enabled: Boolean(organization?.id) });
  const locations = trpc.organizations.listLocations.useQuery({ organizationId: organization?.id ?? "" }, { enabled: Boolean(organization?.id) });

  return <DashboardLayout><div className="mx-auto w-full max-w-7xl space-y-6"><header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-sm font-medium text-primary">გუნდის სამუშაო სივრცე</p><h1 className="mt-1 text-3xl font-semibold tracking-tight">გუნდი</h1><p className="mt-2 text-sm text-muted-foreground">სპეციალისტების როლები, საჯარო პროფილები და ფილიალების აქტიური ქსელი.</p></div><Badge variant="outline" className="w-fit border-primary/30 bg-primary/5 px-3 py-1 text-primary">{organization?.name ?? "სამუშაო სივრცე"}</Badge></header>
    {organizations.isLoading ? <StateCard text="გუნდის სამუშაო სივრცე იტვირთება…" /> : null}
    {organizations.isError ? <StateCard text="სამუშაო სივრცის მონაცემები დროებით მიუწვდომელია." error /> : null}
    {!organizations.isLoading && !organizations.isError && !organization ? <StateCard text="გუნდის გვერდის სანახავად ჯერ შექმენით სამუშაო სივრცე." /> : null}
    {organization ? <><div className="grid gap-4 md:grid-cols-3"><Metric icon={UsersRound} label="აქტიური პროფილები" value={staff.isLoading ? "…" : String(staff.data?.length ?? 0)} hint="ორგანიზაციის აქტიური თანამშრომლები" /><Metric icon={MapPin} label="აქტიური ფილიალები" value={locations.isLoading ? "…" : String(locations.data?.length ?? 0)} hint="ფილიალები, სადაც გუნდი განთავსდება" /><Metric icon={BriefcaseBusiness} label="ონლაინ პროფილები" value={staff.isLoading ? "…" : String(staff.data?.filter(item => item.profile.onlineBookingVisible).length ?? 0)} hint="საჯარო ჩაწერაში ხილული სპეციალისტები" /></div><Card><CardHeader><CardTitle>აქტიური გუნდი</CardTitle></CardHeader><CardContent><div className="grid gap-4 lg:grid-cols-2">{staff.isLoading ? <p className="text-sm text-muted-foreground">გუნდის პროფილები იტვირთება…</p> : null}{staff.isError ? <p className="text-sm text-destructive">გუნდის მონაცემების ჩატვირთვა ვერ მოხერხდა.</p> : null}{!staff.isLoading && !staff.isError && staff.data?.length === 0 ? <p className="rounded-xl border border-dashed p-6 text-sm leading-6 text-muted-foreground">აქ გამოჩნდება გუნდის პროფილები, როგორც კი ფილიალში პირველი სპეციალისტი დაემატება.</p> : null}{staff.data?.map(item => <div key={item.profile.id} className="rounded-2xl border bg-card p-5 shadow-sm"><div className="flex items-start justify-between gap-3"><div><h2 className="text-lg font-semibold tracking-tight">{item.profile.publicDisplayName}</h2><p className="mt-1 text-sm text-muted-foreground">{item.profile.jobTitle || item.profile.specialty || "როლი და სპეციალიზაცია დაემატება აქ"}</p></div><Badge variant="outline" className="border-primary/20 bg-primary/5 text-primary">{roleLabel[item.membership.role] ?? item.membership.role}</Badge></div><div className="mt-4 space-y-2 text-sm text-muted-foreground"><p>საჯარო პროფილი: {item.profile.onlineBookingVisible ? "აქტიურია" : "დამალულია"}</p><p>წევრობის სტატუსი: {item.membership.status}</p><p>ფერი: <span className="font-medium text-foreground">{item.profile.color}</span></p></div></div>)}</div></CardContent></Card></> : null}
  </div></DashboardLayout>;
}

function Metric({ icon: Icon, label, value, hint }: { icon: typeof UsersRound; label: string; value: string; hint: string }) {
  return <Card><CardContent className="p-5"><Icon className="h-5 w-5 text-primary" /><p className="mt-4 text-sm text-muted-foreground">{label}</p><p className="mt-2 text-2xl font-semibold">{value}</p><p className="mt-3 text-xs text-muted-foreground">{hint}</p></CardContent></Card>;
}

function StateCard({ text, error = false }: { text: string; error?: boolean }) {
  return <Card className={error ? "border-destructive/30 bg-destructive/5" : ""}><CardContent className={`p-8 text-sm ${error ? "text-destructive" : "text-muted-foreground"}`}>{text}</CardContent></Card>;
}
