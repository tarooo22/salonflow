import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { gelTextToTetri } from "@/lib/moneyInput";
import { trpc } from "@/lib/trpc";
import { Building2, CalendarClock, CheckCircle2, ChevronLeft, ChevronRight, MapPin, Scissors, UserRound } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";

const TIMEZONES = ["Asia/Tbilisi", "Europe/London", "Europe/Berlin", "America/New_York"];
const WEEKDAYS = [
  { weekday: 1, label: "ორშაბათი" }, { weekday: 2, label: "სამშაბათი" }, { weekday: 3, label: "ოთხშაბათი" },
  { weekday: 4, label: "ხუთშაბათი" }, { weekday: 5, label: "პარასკევი" }, { weekday: 6, label: "შაბათი" }, { weekday: 0, label: "კვირა" },
];

type HoursRow = { weekday: number; enabled: boolean; startLocalTime: string; endLocalTime: string };

const initialHours: HoursRow[] = WEEKDAYS.map(({ weekday }) => ({ weekday, enabled: weekday >= 1 && weekday <= 5, startLocalTime: "10:00", endLocalTime: "18:00" }));

export default function WorkspaceSetup() {
  const [, setRoute] = useLocation();
  const utils = trpc.useUtils();
  const organizations = trpc.organizations.listMine.useQuery();
  const currentUser = trpc.auth.me.useQuery();
  const [step, setStep] = useState(1);
  const [organizationName, setOrganizationName] = useState("");
  const [organizationSlug, setOrganizationSlug] = useState("");
  const [locationName, setLocationName] = useState("");
  const [publicSlug, setPublicSlug] = useState("");
  const [timezone, setTimezone] = useState("Asia/Tbilisi");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [openingHours, setOpeningHours] = useState(initialHours);
  const [categoryName, setCategoryName] = useState("ძირითადი სერვისები");
  const [serviceName, setServiceName] = useState("");
  const [durationMinutes, setDurationMinutes] = useState("60");
  const [priceGel, setPriceGel] = useState("");
  const [onlineBookingEnabled, setOnlineBookingEnabled] = useState(true);
  const [ownerDisplayName, setOwnerDisplayName] = useState("");
  const [ownerJobTitle, setOwnerJobTitle] = useState("მფლობელი");
  const [ownerAvailable, setOwnerAvailable] = useState(false);
  const [formError, setFormError] = useState("");
  const completed = trpc.onboarding.complete.useMutation({
    onSuccess: async () => {
      await utils.organizations.listMine.invalidate();
      setRoute("/app/today?setup=complete");
    },
    onError: error => {
      const isCodeConflict = error.message.includes("კოდი") || error.message.includes("მისამართი");
      setFormError(error.message || "სამუშაო სივრცის შექმნა დროებით ვერ მოხერხდა. სცადეთ ხელახლა.");
      if (isCodeConflict) setStep(1);
    },
  });

  useEffect(() => {
    if (organizations.data?.length) setRoute("/app/today");
  }, [organizations.data?.length, setRoute]);

  useEffect(() => {
    if (currentUser.data?.name && !ownerDisplayName) setOwnerDisplayName(currentUser.data.name);
  }, [currentUser.data?.name, ownerDisplayName]);

  const priceTetri = useMemo(() => gelTextToTetri(priceGel), [priceGel]);

  const canAdvance = useMemo(() => {
    if (step === 1) return organizationName.trim().length >= 2 && organizationSlug.length >= 3 && locationName.trim().length >= 2 && publicSlug.length >= 3;
    if (step === 2) return openingHours.some(hour => hour.enabled && hour.startLocalTime < hour.endLocalTime);
    if (step === 3) return categoryName.trim().length >= 2 && serviceName.trim().length >= 2 && Number(durationMinutes) >= 5 && priceTetri !== null;
    return ownerDisplayName.trim().length >= 2;
  }, [categoryName, durationMinutes, locationName, openingHours, organizationName, organizationSlug, ownerDisplayName, priceTetri, publicSlug, serviceName, step]);

  const updateHour = (weekday: number, patch: Partial<HoursRow>) => setOpeningHours(hours => hours.map(hour => hour.weekday === weekday ? { ...hour, ...patch } : hour));

  const nextStep = () => {
    if (!canAdvance) {
      setFormError(step === 3 ? "შეავსეთ სერვისის ფასი, ხანგრძლივობა და დასახელება სწორი ფორმატით." : "სანამ გააგრძელებთ, შეავსეთ ყველა სავალდებულო ველი.");
      return;
    }
    setFormError("");
    setStep(current => Math.min(4, current + 1));
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canAdvance || priceTetri === null) {
      setFormError("შეამოწმეთ სავალდებულო ველები და ფასი.");
      return;
    }
    completed.mutate({
      organization: {
        name: organizationName,
        slug: organizationSlug,
        timezone,
        contactPhone: phone || undefined,
        contactEmail: email || undefined,
      },
      location: {
        name: locationName,
        publicSlug,
        timezone,
        address: address || undefined,
        phone: phone || undefined,
        email: email || undefined,
        bookingEnabled: true,
        slotIntervalMinutes: 15,
        minimumNoticeMinutes: 60,
        maximumAdvanceDays: 60,
        cancellationCutoffMinutes: 120,
      },
      openingHours,
      owner: { publicDisplayName: ownerDisplayName, jobTitle: ownerJobTitle || undefined, onlineBookingVisible: ownerAvailable },
      services: [{ categoryNameKa: categoryName, nameKa: serviceName, defaultDurationMinutes: Number(durationMinutes), priceTetri, onlineBookingEnabled }],
    });
  };

  if (organizations.data?.length) return null;

  return (
    <DashboardLayout>
      <div className="mx-auto w-full max-w-4xl space-y-6 py-2 sm:py-8">
        <header className="max-w-2xl">
          <p className="text-sm font-medium text-primary">დაწყების გზამკვლევი · ნაბიჯი {step}/4</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">შექმენით თქვენი სამუშაო სივრცე</h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">რამდენიმე მოკლე ნაბიჯით გავამზადებთ თქვენს სალონს, პირველ ფილიალს, სამუშაო საათებს, სერვისს და ონლაინ ჩაწერის საფუძველს.</p>
        </header>

        <ol className="grid grid-cols-2 gap-2 sm:grid-cols-4" aria-label="საწყისი გამართვის პროგრესი">
          {["სალონი", "საათები", "სერვისები", "გაშვება"].map((label, index) => <li key={label} className={`rounded-xl border px-3 py-2 text-xs font-medium ${step === index + 1 ? "border-primary bg-primary/10 text-primary" : step > index + 1 ? "border-accent bg-accent text-accent-foreground" : "border-border bg-card text-muted-foreground"}`}>{index + 1}. {label}</li>)}
        </ol>

        <form onSubmit={submit} className="space-y-6">
          {step === 1 ? <Card>
            <CardHeader>
              <div className="flex items-center gap-3"><div className="rounded-xl bg-primary/10 p-2 text-primary"><Building2 className="h-5 w-5" /></div><div><CardTitle>სალონი და პირველი ფილიალი</CardTitle><CardDescription>ეს მონაცემები ქმნის თქვენს დაცულ სივრცეს და საჯარო ონლაინ ჩაწერის მისამართს.</CardDescription></div></div>
            </CardHeader>
            <CardContent className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2"><Label htmlFor="organization-name">სალონის ან ბიზნესის სახელი</Label><Input id="organization-name" value={organizationName} onChange={event => setOrganizationName(event.target.value)} placeholder="მაგ. Lela Beauty Studio" minLength={2} maxLength={160} required /></div>
              <div className="space-y-2"><Label htmlFor="organization-slug">სამუშაო სივრცის კოდი</Label><Input id="organization-slug" value={organizationSlug} onChange={event => setOrganizationSlug(event.target.value.toLowerCase())} placeholder="lela-beauty" pattern="[a-z0-9]+(-[a-z0-9]+)*" minLength={3} maxLength={96} required /><p className="text-xs text-muted-foreground">გამოიყენეთ ლათინური ასოები, ციფრები და დეფისი.</p></div>
              <div className="space-y-2"><Label htmlFor="timezone">დროის სარტყელი</Label><select id="timezone" value={timezone} onChange={event => setTimezone(event.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"><option value="" disabled>აირჩიეთ დროის სარტყელი</option>{TIMEZONES.map(item => <option key={item} value={item}>{item}</option>)}</select><p className="text-xs text-muted-foreground">კალენდარი და თავისუფალი დროები ამ დროის სარტყელს დაეფუძნება.</p></div>
              <div className="space-y-2"><Label htmlFor="location-name">ფილიალის სახელი</Label><Input id="location-name" value={locationName} onChange={event => setLocationName(event.target.value)} placeholder="მაგ. ვაკის ფილიალი" minLength={2} maxLength={160} required /></div>
              <div className="space-y-2"><Label htmlFor="public-slug">საჯარო დაჯავშნის მისამართი</Label><Input id="public-slug" value={publicSlug} onChange={event => setPublicSlug(event.target.value.toLowerCase())} placeholder="lela-vake" pattern="[a-z0-9]+(-[a-z0-9]+)*" minLength={3} maxLength={96} required /><p className="text-xs text-muted-foreground">თქვენი კლიენტები გამოიყენებენ: /book/{publicSlug || "your-salon"}</p></div>
              <div className="space-y-2 sm:col-span-2"><Label htmlFor="address">მისამართი <span className="text-muted-foreground">(არასავალდებულო)</span></Label><Input id="address" value={address} onChange={event => setAddress(event.target.value)} placeholder="თბილისი, ქუჩა და ნომერი" maxLength={1200} /></div>
              <div className="space-y-2"><Label htmlFor="phone">ტელეფონი <span className="text-muted-foreground">(არასავალდებულო)</span></Label><Input id="phone" value={phone} onChange={event => setPhone(event.target.value)} placeholder="+995 5XX XX XX XX" maxLength={32} /></div>
              <div className="space-y-2"><Label htmlFor="email">ელფოსტა <span className="text-muted-foreground">(არასავალდებულო)</span></Label><Input id="email" type="email" value={email} onChange={event => setEmail(event.target.value)} placeholder="hello@example.com" maxLength={320} /></div>
            </CardContent>
          </Card> : null}

          {step === 2 ? <Card>
            <CardHeader><div className="flex items-center gap-3"><div className="rounded-xl bg-primary/10 p-2 text-primary"><CalendarClock className="h-5 w-5" /></div><div><CardTitle>სამუშაო საათები და გამონაკლისები</CardTitle><CardDescription>მონიშნეთ დღეები, როდესაც ფილიალი და თქვენი საწყისი სპეციალისტი ხელმისაწვდომია.</CardDescription></div></div></CardHeader>
            <CardContent className="space-y-3">{WEEKDAYS.map(day => { const hour = openingHours.find(item => item.weekday === day.weekday)!; return <div key={day.weekday} className="grid grid-cols-[1fr_auto_auto] items-center gap-3 rounded-xl border border-border p-3"><label className="flex min-h-11 items-center gap-3 text-sm font-medium"><input type="checkbox" checked={hour.enabled} onChange={event => updateHour(day.weekday, { enabled: event.target.checked })} />{day.label}</label><Input aria-label={`${day.label} დაწყება`} type="time" value={hour.startLocalTime} onChange={event => updateHour(day.weekday, { startLocalTime: event.target.value })} disabled={!hour.enabled} className="w-28" /><Input aria-label={`${day.label} დასრულება`} type="time" value={hour.endLocalTime} onChange={event => updateHour(day.weekday, { endLocalTime: event.target.value })} disabled={!hour.enabled} className="w-28" /></div>; })}<p className="rounded-xl bg-muted p-3 text-xs leading-5 text-muted-foreground">პირველი გამონაკლისი (შვებულება, პაუზა ან დახურვა) სურვილისამებრ შეგიძლიათ დაამატოთ გუნდის გვერდიდან სამუშაო სივრცის შექმნის შემდეგ.</p></CardContent>
          </Card> : null}

          {step === 3 ? <Card>
            <CardHeader><div className="flex items-center gap-3"><div className="rounded-xl bg-primary/10 p-2 text-primary"><Scissors className="h-5 w-5" /></div><div><CardTitle>პირველი სერვისი და ფასი</CardTitle><CardDescription>ეს სერვისი შევა თქვენს კატალოგში და სურვილისამებრ გამოჩნდება ონლაინ ჩაწერაში.</CardDescription></div></div></CardHeader>
            <CardContent className="grid gap-5 sm:grid-cols-2"><div className="space-y-2"><Label htmlFor="category-name">კატეგორია</Label><Input id="category-name" value={categoryName} onChange={event => setCategoryName(event.target.value)} maxLength={160} /></div><div className="space-y-2"><Label htmlFor="service-name">სერვისის დასახელება</Label><Input id="service-name" value={serviceName} onChange={event => setServiceName(event.target.value)} placeholder="მაგ. თმის შეჭრა" maxLength={160} /></div><div className="space-y-2"><Label htmlFor="duration">ხანგრძლივობა</Label><select id="duration" value={durationMinutes} onChange={event => setDurationMinutes(event.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">{[30, 45, 60, 75, 90, 120].map(minutes => <option key={minutes} value={minutes}>{minutes} წუთი</option>)}</select></div><div className="space-y-2"><Label htmlFor="price">ფასი (₾)</Label><Input id="price" inputMode="decimal" value={priceGel} onChange={event => setPriceGel(event.target.value)} placeholder="მაგ. 75.00" aria-describedby="price-help" /><p id="price-help" className="text-xs text-muted-foreground">სერვერზე თანხა შეინახება მხოლოდ მთელ თეთრებში.</p></div><label className="flex min-h-11 items-center gap-3 text-sm font-medium sm:col-span-2"><input type="checkbox" checked={onlineBookingEnabled} onChange={event => setOnlineBookingEnabled(event.target.checked)} />ეს სერვისი ხელმისაწვდომია ონლაინ ჩაწერისთვის</label></CardContent>
          </Card> : null}

          {step === 4 ? <Card>
            <CardHeader><div className="flex items-center gap-3"><div className="rounded-xl bg-primary/10 p-2 text-primary"><UserRound className="h-5 w-5" /></div><div><CardTitle>მფლობელი და გაშვება</CardTitle><CardDescription>შექმნით თქვენს პირველ staff profile-ს და მიიღებთ უსაფრთხო საჯარო ჩაწერის მისამართს.</CardDescription></div></div></CardHeader>
            <CardContent className="space-y-5"><div className="grid gap-5 sm:grid-cols-2"><div className="space-y-2"><Label htmlFor="owner-name">საჯარო სახელი</Label><Input id="owner-name" value={ownerDisplayName} onChange={event => setOwnerDisplayName(event.target.value)} placeholder="მაგ. მარი კ." maxLength={160} /></div><div className="space-y-2"><Label htmlFor="owner-role">როლი <span className="text-muted-foreground">(არასავალდებულო)</span></Label><Input id="owner-role" value={ownerJobTitle} onChange={event => setOwnerJobTitle(event.target.value)} maxLength={160} /></div></div><label className="flex min-h-11 items-center gap-3 text-sm font-medium"><input type="checkbox" checked={ownerAvailable} onChange={event => setOwnerAvailable(event.target.checked)} />მე ვასრულებ ამ სერვისს და მინდა გამოჩნდეს ონლაინ ჩაწერაში</label><div className="rounded-xl border border-accent bg-accent/40 p-4 text-sm text-accent-foreground"><p className="font-semibold">თქვენი საჯარო მისამართი</p><p className="mt-1 break-all">/book/{publicSlug || "your-salon"}</p><p className="mt-2 text-xs">შექმნის შემდეგ შეძლებთ დაამატოთ მეტი სერვისი, თანამშრომელი, გამონაკლისი და ფილიალი.</p></div></CardContent>
          </Card> : null}

          {formError || completed.error ? <Card className="border-destructive/30 bg-destructive/5"><CardContent className="p-4 text-sm text-destructive">{formError || completed.error?.message || "სამუშაო სივრცის შექმნა დროებით ვერ მოხერხდა. სცადეთ ხელახლა."}</CardContent></Card> : null}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><p className="flex items-center gap-2 text-sm text-muted-foreground"><CheckCircle2 className="h-4 w-4 text-primary" />თქვენი მონაცემები შეიქმნება მხოლოდ ბოლო ნაბიჯზე, ერთ უსაფრთხო ტრანზაქციაში.</p><div className="flex gap-2"><Button type="button" variant="outline" onClick={() => { setFormError(""); setStep(current => Math.max(1, current - 1)); }} disabled={step === 1 || completed.isPending}><ChevronLeft className="h-4 w-4" />უკან</Button>{step < 4 ? <Button type="button" onClick={nextStep}><ChevronRight className="h-4 w-4" />გაგრძელება</Button> : <Button type="submit" disabled={completed.isPending}>{completed.isPending ? "სამუშაო სივრცე იქმნება…" : "სამუშაო სივრცის გაშვება"}</Button>}</div></div>
        </form>
      </div>
    </DashboardLayout>
  );
}
