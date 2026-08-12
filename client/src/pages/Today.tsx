import DashboardLayout from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CalendarDays, CircleAlert, MapPin, Plus, UsersRound } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { FormEvent, useState } from "react";
import { Link } from "wouter";
import { toast } from "sonner";

export default function Today() {
  const utils = trpc.useUtils();
  const organizations = trpc.organizations.listMine.useQuery();
  const organizationEntry = organizations.data?.[0];
  const organization = organizationEntry?.organization;
  const hasOrganization = Boolean(organization);
  const canManageOrganization = ["OWNER", "MANAGER"].includes(organizationEntry?.membership.role ?? "");
  const dashboard = trpc.appointments.dashboard.useQuery({ organizationId: organization?.id ?? "" }, { enabled: Boolean(organization?.id) });
  const [locationOpen, setLocationOpen] = useState(false);
  const [locationName, setLocationName] = useState("");
  const [publicSlug, setPublicSlug] = useState("");
  const [address, setAddress] = useState("");
  const [locationError, setLocationError] = useState("");
  const createLocation = trpc.organizations.createLocation.useMutation({
    onSuccess: async () => { await utils.organizations.listLocations.invalidate(); setLocationName(""); setPublicSlug(""); setAddress(""); setLocationError(""); setLocationOpen(false); toast.success("ახალი ფილიალი დაემატა."); },
    onError: () => setLocationError("ფილიალის დამატება ვერ მოხერხდა. შეამოწმეთ, რომ საჯარო მისამართი უნიკალურია."),
  });
  const submitLocation = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); if (!organization) return; setLocationError(""); createLocation.mutate({ organizationId: organization.id, name: locationName, publicSlug, timezone: "Asia/Tbilisi", address: address || undefined, bookingEnabled: true, slotIntervalMinutes: 15, minimumNoticeMinutes: 60, maximumAdvanceDays: 60, cancellationCutoffMinutes: 120 }); };
  const appointmentCount = dashboard.data?.appointments.length ?? 0;
  const pendingCount = dashboard.data?.counts.PENDING ?? 0;
  const unpaidCount = dashboard.data?.balances.filter(item => item.totals.balanceTetri > 0).length ?? 0;

  return <DashboardLayout><div className="mx-auto w-full max-w-7xl space-y-6"><header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-sm font-medium text-primary">ოპერაციების მიმოხილვა</p><h1 className="mt-1 text-3xl font-semibold tracking-tight">დღეს</h1><p className="mt-2 text-sm text-muted-foreground">დღის ჯავშნები, სტატუსები და გუნდის დატვირთვა ერთ სივრცეში.</p></div><div className="flex flex-wrap items-center gap-2"><Badge variant="outline" className="w-fit border-primary/30 bg-primary/5 px-3 py-1 text-primary">{organization?.name ?? "Asia/Tbilisi"}</Badge>{organization && canManageOrganization ? <Button onClick={() => { setLocationError(""); setLocationOpen(true); }}><Plus className="mr-2 h-4 w-4" />ფილიალის დამატება</Button> : null}</div></header>
    {organizations.isLoading ? <div className="rounded-2xl border bg-card p-8 text-sm text-muted-foreground">სამუშაო სივრცე იტვირთება…</div> : null}{organizations.isError ? <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6 text-sm text-destructive">სამუშაო სივრცის მონაცემები დროებით მიუწვდომელია. გთხოვთ სცადოთ ხელახლა.</div> : null}{!organizations.isLoading && !organizations.isError && !hasOrganization ? <Card className="border-primary/20 bg-[linear-gradient(135deg,hsl(var(--card)),hsl(var(--primary)/0.06))]"><CardHeader><CardTitle>მზად არის თქვენი სალონის სამუშაო სივრცე</CardTitle></CardHeader><CardContent className="space-y-4 text-sm text-muted-foreground"><p>დაიწყეთ ორგანიზაციისა და პირველი ფილიალის შექმნით. შემდეგ შეძლებთ დაამატოთ გუნდი, სერვისები და სამუშაო საათები.</p><Button asChild><Link href="/app/setup">სამუშაო სივრცის შექმნა</Link></Button></CardContent></Card> : null}
    {hasOrganization ? <><div className="grid gap-4 md:grid-cols-3"><Metric icon={CalendarDays} label="დღევანდელი ჯავშნები" value={dashboard.isLoading ? "…" : String(appointmentCount)} hint={appointmentCount ? "ყველა სტატუსის ჯავშანი დღევანდელი სამუშაო დღისათვის" : "დღეს დაგეგმილი ჯავშნები ჯერ არ არის"} /><Metric icon={UsersRound} label="დასადასტურებელი" value={dashboard.isLoading ? "…" : String(pendingCount)} hint={pendingCount ? "საჯარო დაჯავშნები ელოდება თქვენი გუნდის გადაწყვეტილებას" : "დასადასტურებელი ჯავშნები არ არის"} /><Metric icon={CircleAlert} label="გადასახდელი" value={dashboard.isLoading ? "…" : String(unpaidCount)} hint={unpaidCount ? "ჯავშნებზე დარჩენილი ბალანსი საჭიროებს ყურადღებას" : "დღეს დარჩენილი ბალანსი არ არის"} /></div>{dashboard.isError ? <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-5 text-sm text-destructive">დღის ოპერაციული მონაცემები დროებით ვერ ჩაიტვირთა. გთხოვთ სცადოთ ხელახლა.</div> : null}{!dashboard.isLoading && !dashboard.isError && appointmentCount === 0 ? <div className="rounded-2xl border border-dashed bg-card/50 p-6 text-sm text-muted-foreground">როდესაც პირველი ჯავშანი შეიქმნება, აქ იხილავთ დღის სტატუსებსა და გადახდების საჭიროებებს.</div> : null}</> : null}
  </div><Dialog open={locationOpen} onOpenChange={setLocationOpen}><DialogContent><DialogHeader><DialogTitle>ფილიალის დამატება</DialogTitle><DialogDescription>ფილიალის საჯარო მისამართი გამოიყენება უსაფრთხო ონლაინ ჩაწერის ბმულში და არ შეიცავს თანმიმდევრულ იდენტიფიკატორს.</DialogDescription></DialogHeader><form onSubmit={submitLocation} className="space-y-4"><div className="space-y-2"><Label htmlFor="new-location-name">ფილიალის სახელი</Label><Input id="new-location-name" value={locationName} onChange={event => setLocationName(event.target.value)} placeholder="მაგ. საბურთალოს ფილიალი" minLength={2} maxLength={160} required /></div><div className="space-y-2"><Label htmlFor="new-location-slug">საჯარო დაჯავშნის მისამართი</Label><Input id="new-location-slug" value={publicSlug} onChange={event => setPublicSlug(event.target.value.toLowerCase())} placeholder="salon-saburtalo" pattern="[a-z0-9]+(-[a-z0-9]+)*" minLength={3} maxLength={96} required /><p className="text-xs text-muted-foreground">/book/{publicSlug || "your-salon"}</p></div><div className="space-y-2"><Label htmlFor="new-location-address">მისამართი <span className="text-muted-foreground">(არასავალდებულო)</span></Label><Input id="new-location-address" value={address} onChange={event => setAddress(event.target.value)} maxLength={1200} /></div><p className="flex items-center gap-2 text-sm text-muted-foreground"><MapPin className="h-4 w-4 text-primary" />დროის სარტყელი: Asia/Tbilisi</p>{locationError ? <p className="text-sm text-destructive">{locationError}</p> : null}<DialogFooter><Button type="submit" disabled={createLocation.isPending}>{createLocation.isPending ? "ინახება…" : "ფილიალის შენახვა"}</Button></DialogFooter></form></DialogContent></Dialog></DashboardLayout>;
}

function Metric({ icon: Icon, label, value, hint }: { icon: typeof CalendarDays; label: string; value: string; hint: string }) { return <Card><CardContent className="p-5"><div className="flex items-start justify-between"><div><p className="text-sm text-muted-foreground">{label}</p><p className="mt-3 text-3xl font-semibold tracking-tight">{value}</p></div><Icon className="h-5 w-5 text-primary" /></div><p className="mt-4 text-xs leading-relaxed text-muted-foreground">{hint}</p></CardContent></Card>; }
