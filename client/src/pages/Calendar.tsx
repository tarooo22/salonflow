import DashboardLayout from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarDays, Clock3, UsersRound } from "lucide-react";
import { trpc } from "@/lib/trpc";

const statusLabels: Record<string, string> = {
  PENDING: "დადასტურებას ელოდება",
  CONFIRMED: "დადასტურებული",
  CHECKED_IN: "მოსულია",
  IN_SERVICE: "მომსახურებაშია",
  COMPLETED: "დასრულებული",
  CANCELLED: "გაუქმებული",
  NO_SHOW: "არ გამოცხადდა",
};

const statusTone: Record<string, string> = {
  PENDING: "border-[#D69A43]/30 bg-[#D69A43]/10 text-[#855B12]",
  CONFIRMED: "border-[#17826A]/30 bg-[#17826A]/10 text-[#216451]",
  CHECKED_IN: "border-[#17826A]/30 bg-[#17826A]/10 text-[#216451]",
  IN_SERVICE: "border-primary/30 bg-primary/10 text-primary",
  COMPLETED: "border-[#516159]/20 bg-[#516159]/10 text-[#516159]",
  CANCELLED: "border-destructive/30 bg-destructive/10 text-destructive",
  NO_SHOW: "border-destructive/30 bg-destructive/10 text-destructive",
};

export default function Calendar() {
  const organizations = trpc.organizations.listMine.useQuery();
  const organization = organizations.data?.[0]?.organization;
  const appointments = trpc.appointments.listToday.useQuery({ organizationId: organization?.id ?? "" }, { enabled: Boolean(organization?.id) });
  const dayLabel = new Intl.DateTimeFormat("ka-GE", { weekday: "long", day: "numeric", month: "long" }).format(new Date());

  return <DashboardLayout><div className="mx-auto w-full max-w-7xl space-y-6"><header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-sm font-medium text-primary">გუნდის ოპერაციები</p><h1 className="mt-1 text-3xl font-semibold tracking-tight">კალენდარი</h1><p className="mt-2 text-sm text-muted-foreground">{dayLabel} · დღევანდელი ჯავშნების ცოცხალი სია.</p></div><Badge variant="outline" className="w-fit border-primary/30 bg-primary/5 px-3 py-1 text-primary">{organization?.name ?? "სამუშაო სივრცე"}</Badge></header>
    {organizations.isLoading ? <CalendarState text="სამუშაო სივრცე იტვირთება…" /> : null}
    {organizations.isError ? <CalendarState error text="სამუშაო სივრცის მონაცემები დროებით მიუწვდომელია." /> : null}
    {!organizations.isLoading && !organizations.isError && !organization ? <CalendarState text="კალენდრის სანახავად ჯერ შექმენით თქვენი პირველი სამუშაო სივრცე." /> : null}
    {organization ? <div className="grid gap-4 lg:grid-cols-[0.8fr_1.8fr]"><Card className="h-fit"><CardHeader><CalendarDays className="h-5 w-5 text-primary" /><CardTitle className="mt-3">დღის მიმოხილვა</CardTitle></CardHeader><CardContent className="space-y-4"><div><p className="text-3xl font-semibold">{appointments.isLoading ? "…" : appointments.data?.length ?? 0}</p><p className="mt-1 text-sm text-muted-foreground">სულ ჯავშანი</p></div><div className="rounded-xl bg-primary/5 p-4 text-sm leading-6 text-muted-foreground"><UsersRound className="mb-2 h-4 w-4 text-primary" />ახალი და სტატუსშეცვლილი ჯავშნები ავტომატურად გამოჩნდება ამ სიაში.</div></CardContent></Card><Card><CardHeader><div className="flex items-center justify-between"><CardTitle>დღის განრიგი</CardTitle><Clock3 className="h-5 w-5 text-primary" /></div></CardHeader><CardContent><div className="space-y-3">{appointments.isLoading ? <p className="py-8 text-center text-sm text-muted-foreground">ჯავშნები იტვირთება…</p> : null}{appointments.isError ? <p className="py-8 text-center text-sm text-destructive">ჯავშნების ჩატვირთვა ვერ მოხერხდა.</p> : null}{!appointments.isLoading && !appointments.isError && appointments.data?.length === 0 ? <p className="rounded-xl border border-dashed p-8 text-center text-sm leading-6 text-muted-foreground">დღეს ჯავშნები ჯერ არ არის. ახალი საჯარო ან შიდა ჩაწერა აქ ავტომატურად გამოჩნდება.</p> : null}{appointments.data?.map(appointment => <div key={appointment.id} className="flex flex-col gap-3 rounded-xl border bg-card p-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-semibold">{new Intl.DateTimeFormat("ka-GE", { hour: "2-digit", minute: "2-digit" }).format(appointment.startsAt)} – {new Intl.DateTimeFormat("ka-GE", { hour: "2-digit", minute: "2-digit" }).format(appointment.endsAt)}</p><p className="mt-1 text-xs text-muted-foreground">რეფერენსი: {appointment.id}</p></div><Badge variant="outline" className={statusTone[appointment.status] ?? ""}>{statusLabels[appointment.status] ?? appointment.status}</Badge></div>)}</div></CardContent></Card></div> : null}
  </div></DashboardLayout>;
}

function CalendarState({ text, error = false }: { text: string; error?: boolean }) {
  return <Card className={error ? "border-destructive/30 bg-destructive/5" : ""}><CardContent className={`p-8 text-sm ${error ? "text-destructive" : "text-muted-foreground"}`}>{text}</CardContent></Card>;
}
