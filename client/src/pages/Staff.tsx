import DashboardLayout from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { BriefcaseBusiness, MapPin, Plus, UsersRound } from "lucide-react";
import { FormEvent, useState } from "react";
import { toast } from "sonner";

const roleLabel: Record<string, string> = {
  OWNER: "მფლობელი",
  MANAGER: "მენეჯერი",
  RECEPTIONIST: "ადმინისტრატორი",
  STAFF: "სპეციალისტი",
};

const weekdayLabel: Record<string, string> = { "0": "ორშაბათი", "1": "სამშაბათი", "2": "ოთხშაბათი", "3": "ხუთშაბათი", "4": "პარასკევი", "5": "შაბათი", "6": "კვირა" };

export default function Staff() {
  const utils = trpc.useUtils();
  const organizations = trpc.organizations.listMine.useQuery();
  const organizationEntry = organizations.data?.[0];
  const organization = organizationEntry?.organization;
  const staff = trpc.staff.list.useQuery({ organizationId: organization?.id ?? "" }, { enabled: Boolean(organization?.id) });
  const locations = trpc.organizations.listLocations.useQuery({ organizationId: organization?.id ?? "" }, { enabled: Boolean(organization?.id) });
  const canManage = ["OWNER", "MANAGER"].includes(organizationEntry?.membership.role ?? "");
  const hasOwnProfile = Boolean(staff.data?.some(item => item.membership.id === organizationEntry?.membership.id));
  const [createOpen, setCreateOpen] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [selectedLocationIds, setSelectedLocationIds] = useState<string[]>([]);
  const [formError, setFormError] = useState("");
  const [hoursOpen, setHoursOpen] = useState(false);
  const [hoursProfileId, setHoursProfileId] = useState("");
  const [hoursLocationId, setHoursLocationId] = useState("");
  const [hoursWeekday, setHoursWeekday] = useState("0");
  const [hoursStart, setHoursStart] = useState("09:00");
  const [hoursEnd, setHoursEnd] = useState("18:00");
  const [hoursError, setHoursError] = useState("");
  const createProfile = trpc.staff.createProfile.useMutation({
    onSuccess: async () => {
      await utils.staff.list.invalidate();
      setDisplayName("");
      setJobTitle("");
      setSelectedLocationIds([]);
      setFormError("");
      setCreateOpen(false);
    },
  });
  const addWorkingHours = trpc.staff.addWorkingHours.useMutation({
    onSuccess: () => {
      setHoursError("");
      setHoursOpen(false);
      toast.success("სამუშაო საათები დაემატა.");
    },
    onError: () => setHoursError("სამუშაო საათების დამატება ვერ მოხერხდა. შეამოწმეთ ფილიალი და დრო."),
  });

  const toggleLocation = (locationId: string) => {
    setSelectedLocationIds(current => current.includes(locationId) ? current.filter(id => id !== locationId) : [...current, locationId]);
  };
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!organization || !organizationEntry) return;
    if (!selectedLocationIds.length) {
      setFormError("აირჩიეთ მინიმუმ ერთი აქტიური ფილიალი.");
      return;
    }
    setFormError("");
    createProfile.mutate({
      organizationId: organization.id,
      membershipId: organizationEntry.membership.id,
      publicDisplayName: displayName,
      jobTitle: jobTitle || undefined,
      onlineBookingVisible: true,
      color: "#17826A",
      locationIds: selectedLocationIds,
    });
  };
  const submitWorkingHours = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!organization || !hoursProfileId || !hoursLocationId) {
      setHoursError("აირჩიეთ სპეციალისტი და ფილიალი.");
      return;
    }
    if (hoursStart >= hoursEnd) {
      setHoursError("სამუშაო დღის დასრულება დაწყებაზე გვიან უნდა იყოს.");
      return;
    }
    setHoursError("");
    addWorkingHours.mutate({ organizationId: organization.id, staffProfileId: hoursProfileId, locationId: hoursLocationId, weekday: Number(hoursWeekday), startLocalTime: hoursStart, endLocalTime: hoursEnd });
  };

  return (
    <DashboardLayout>
      <div className="mx-auto w-full max-w-7xl space-y-6">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-sm font-medium text-primary">გუნდის სამუშაო სივრცე</p><h1 className="mt-1 text-3xl font-semibold tracking-tight">გუნდი</h1><p className="mt-2 text-sm text-muted-foreground">სპეციალისტების როლები, საჯარო პროფილები და ფილიალების აქტიური ქსელი.</p></div><div className="flex flex-wrap items-center gap-2"><Badge variant="outline" className="w-fit border-primary/30 bg-primary/5 px-3 py-1 text-primary">{organization?.name ?? "სამუშაო სივრცე"}</Badge>{organization && canManage && !hasOwnProfile ? <Button onClick={() => { setFormError(""); setCreateOpen(true); }}><Plus className="mr-2 h-4 w-4" />ჩემი პროფილის დამატება</Button> : null}</div></header>
        {organizations.isLoading ? <StateCard text="გუნდის სამუშაო სივრცე იტვირთება…" /> : null}
        {organizations.isError ? <StateCard text="სამუშაო სივრცის მონაცემები დროებით მიუწვდომელია." error /> : null}
        {!organizations.isLoading && !organizations.isError && !organization ? <StateCard text="გუნდის გვერდის სანახავად ჯერ შექმენით სამუშაო სივრცე." /> : null}
        {organization ? <><div className="grid gap-4 md:grid-cols-3"><Metric icon={UsersRound} label="აქტიური პროფილები" value={staff.isLoading ? "…" : String(staff.data?.length ?? 0)} hint="ორგანიზაციის აქტიური თანამშრომლები" /><Metric icon={MapPin} label="აქტიური ფილიალები" value={locations.isLoading ? "…" : String(locations.data?.length ?? 0)} hint="ფილიალები, სადაც გუნდი განთავსდება" /><Metric icon={BriefcaseBusiness} label="ონლაინ პროფილები" value={staff.isLoading ? "…" : String(staff.data?.filter(item => item.profile.onlineBookingVisible).length ?? 0)} hint="საჯარო ჩაწერაში ხილული სპეციალისტები" /></div><Card><CardHeader><CardTitle>აქტიური გუნდი</CardTitle></CardHeader><CardContent><div className="grid gap-4 lg:grid-cols-2">{staff.isLoading ? <p className="text-sm text-muted-foreground">გუნდის პროფილები იტვირთება…</p> : null}{staff.isError ? <p className="text-sm text-destructive">გუნდის მონაცემების ჩატვირთვა ვერ მოხერხდა.</p> : null}{!staff.isLoading && !staff.isError && staff.data?.length === 0 ? <div className="rounded-xl border border-dashed p-6 text-sm leading-6 text-muted-foreground"><p>აქ გამოჩნდება გუნდის პროფილები, როგორც კი ფილიალში პირველი სპეციალისტი დაემატება.</p>{canManage ? <Button variant="outline" size="sm" className="mt-4" onClick={() => setCreateOpen(true)}><Plus className="mr-1.5 h-4 w-4" />პირველი პროფილის დამატება</Button> : null}</div> : null}{staff.data?.map(item => <div key={item.profile.id} className="rounded-2xl border bg-card p-5 shadow-sm"><div className="flex items-start justify-between gap-3"><div><h2 className="text-lg font-semibold tracking-tight">{item.profile.publicDisplayName}</h2><p className="mt-1 text-sm text-muted-foreground">{item.profile.jobTitle || item.profile.specialty || "როლი და სპეციალიზაცია დაემატება აქ"}</p></div><Badge variant="outline" className="border-primary/20 bg-primary/5 text-primary">{roleLabel[item.membership.role] ?? item.membership.role}</Badge></div><div className="mt-4 space-y-2 text-sm text-muted-foreground"><p>საჯარო პროფილი: {item.profile.onlineBookingVisible ? "აქტიურია" : "დამალულია"}</p><p>წევრობის სტატუსი: {item.membership.status}</p><p>ფერი: <span className="font-medium text-foreground">{item.profile.color}</span></p></div>{canManage ? <Button variant="outline" size="sm" className="mt-4" onClick={() => { setHoursProfileId(item.profile.id); setHoursLocationId(""); setHoursError(""); setHoursOpen(true); }}>სამუშაო საათები</Button> : null}</div>)}</div></CardContent></Card></> : null}
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}><DialogContent><DialogHeader><DialogTitle>ჩემი სპეციალისტის პროფილი</DialogTitle><DialogDescription>პროფილი უკავშირდება თქვენს მიმდინარე წევრობას. დამატებითი თანამშრომლებისთვის ჯერ საჭიროა მათი მოწვევა და აქტიური წევრობის შექმნა.</DialogDescription></DialogHeader><form onSubmit={submit} className="space-y-4"><div className="space-y-2"><Label htmlFor="staff-display-name">საჯარო სახელი</Label><Input id="staff-display-name" value={displayName} onChange={event => setDisplayName(event.target.value)} placeholder="მაგ. ლელა ბერიძე" minLength={2} maxLength={160} required /></div><div className="space-y-2"><Label htmlFor="staff-title">როლი ან სპეციალიზაცია <span className="text-muted-foreground">(არასავალდებულო)</span></Label><Input id="staff-title" value={jobTitle} onChange={event => setJobTitle(event.target.value)} placeholder="მაგ. თმის სტილისტი" maxLength={160} /></div><fieldset className="space-y-2"><legend className="text-sm font-medium">ფილიალები</legend>{locations.isLoading ? <p className="text-sm text-muted-foreground">ფილიალები იტვირთება…</p> : null}{!locations.isLoading && !locations.data?.length ? <p className="rounded-xl border border-dashed p-3 text-sm text-muted-foreground">პროფილის დამატებამდე საჭიროა მინიმუმ ერთი აქტიური ფილიალი.</p> : null}{locations.data?.map(location => <label key={location.id} className="flex cursor-pointer items-center gap-3 rounded-xl border p-3 text-sm"><input type="checkbox" checked={selectedLocationIds.includes(location.id)} onChange={() => toggleLocation(location.id)} className="h-4 w-4 accent-primary" /><span>{location.name}</span></label>)}</fieldset>{formError ? <p className="text-sm text-destructive">{formError}</p> : null}{createProfile.error ? <p className="text-sm text-destructive">პროფილის დამატება ვერ მოხერხდა. სცადეთ ხელახლა.</p> : null}<DialogFooter><Button type="submit" disabled={createProfile.isPending || !locations.data?.length}>{createProfile.isPending ? "ინახება…" : "პროფილის შენახვა"}</Button></DialogFooter></form></DialogContent></Dialog>
      <Dialog open={hoursOpen} onOpenChange={setHoursOpen}><DialogContent><DialogHeader><DialogTitle>სამუშაო საათების დამატება</DialogTitle><DialogDescription>საათები დაემატება მხოლოდ იმ აქტიური ფილიალისთვის, სადაც სპეციალისტი უკვე არის მინიჭებული.</DialogDescription></DialogHeader><form onSubmit={submitWorkingHours} className="space-y-4"><div className="space-y-2"><Label htmlFor="hours-location">ფილიალი</Label><Select value={hoursLocationId} onValueChange={setHoursLocationId}><SelectTrigger id="hours-location"><SelectValue placeholder="აირჩიეთ ფილიალი" /></SelectTrigger><SelectContent>{locations.data?.map(location => <SelectItem key={location.id} value={location.id}>{location.name}</SelectItem>)}</SelectContent></Select></div><div className="space-y-2"><Label htmlFor="hours-weekday">დღე</Label><Select value={hoursWeekday} onValueChange={setHoursWeekday}><SelectTrigger id="hours-weekday"><SelectValue /></SelectTrigger><SelectContent>{Object.entries(weekdayLabel).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select></div><div className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><Label htmlFor="hours-start">დაწყება</Label><Input id="hours-start" type="time" value={hoursStart} onChange={event => setHoursStart(event.target.value)} required /></div><div className="space-y-2"><Label htmlFor="hours-end">დასრულება</Label><Input id="hours-end" type="time" value={hoursEnd} onChange={event => setHoursEnd(event.target.value)} required /></div></div>{hoursError ? <p className="text-sm text-destructive">{hoursError}</p> : null}<DialogFooter><Button type="submit" disabled={addWorkingHours.isPending}>{addWorkingHours.isPending ? "ინახება…" : "საათების შენახვა"}</Button></DialogFooter></form></DialogContent></Dialog>
    </DashboardLayout>
  );
}

function Metric({ icon: Icon, label, value, hint }: { icon: typeof UsersRound; label: string; value: string; hint: string }) {
  return <Card><CardContent className="p-5"><Icon className="h-5 w-5 text-primary" /><p className="mt-4 text-sm text-muted-foreground">{label}</p><p className="mt-2 text-2xl font-semibold">{value}</p><p className="mt-3 text-xs text-muted-foreground">{hint}</p></CardContent></Card>;
}

function StateCard({ text, error = false }: { text: string; error?: boolean }) {
  return <Card className={error ? "border-destructive/30 bg-destructive/5" : ""}><CardContent className={`p-8 text-sm ${error ? "text-destructive" : "text-muted-foreground"}`}>{text}</CardContent></Card>;
}
