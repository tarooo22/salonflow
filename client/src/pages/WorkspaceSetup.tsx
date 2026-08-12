import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { Building2, CheckCircle2, MapPin } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { useLocation } from "wouter";

const defaultTimezone = "Asia/Tbilisi";

export default function WorkspaceSetup() {
  const [, setRoute] = useLocation();
  const utils = trpc.useUtils();
  const organizations = trpc.organizations.listMine.useQuery();
  const [organizationName, setOrganizationName] = useState("");
  const [organizationSlug, setOrganizationSlug] = useState("");
  const [locationName, setLocationName] = useState("");
  const [publicSlug, setPublicSlug] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const createWorkspace = trpc.organizations.createWorkspace.useMutation({
    onSuccess: async () => {
      await utils.organizations.listMine.invalidate();
      setRoute("/app/today");
    },
  });

  useEffect(() => {
    if (organizations.data?.length) setRoute("/app/today");
  }, [organizations.data?.length, setRoute]);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    createWorkspace.mutate({
      organization: {
        name: organizationName,
        slug: organizationSlug,
        timezone: defaultTimezone,
        contactPhone: phone || undefined,
        contactEmail: email || undefined,
      },
      location: {
        name: locationName,
        publicSlug,
        timezone: defaultTimezone,
        address: address || undefined,
        phone: phone || undefined,
        email: email || undefined,
        bookingEnabled: true,
        slotIntervalMinutes: 15,
        minimumNoticeMinutes: 60,
        maximumAdvanceDays: 60,
        cancellationCutoffMinutes: 120,
      },
    });
  };

  if (organizations.data?.length) return null;

  return (
    <DashboardLayout>
      <div className="mx-auto w-full max-w-4xl space-y-6 py-2 sm:py-8">
        <header className="max-w-2xl">
          <p className="text-sm font-medium text-primary">პირველი ნაბიჯი</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">შექმენით თქვენი სამუშაო სივრცე</h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">ერთი ფორმით იქმნება სალონის ორგანიზაცია, თქვენი მფლობელის წვდომა და პირველი ფილიალი. ფილიალის მისამართი გამოყენებული იქნება საჯარო დაჯავშნის უსაფრთხო ბმულში.</p>
        </header>

        <form onSubmit={submit} className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3"><div className="rounded-xl bg-primary/10 p-2 text-primary"><Building2 className="h-5 w-5" /></div><div><CardTitle>ორგანიზაცია</CardTitle><CardDescription>ეს სახელწოდება გამოჩნდება თქვენს დაცულ სამუშაო სივრცეში.</CardDescription></div></div>
            </CardHeader>
            <CardContent className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2"><Label htmlFor="organization-name">სალონის ან ბიზნესის სახელი</Label><Input id="organization-name" value={organizationName} onChange={event => setOrganizationName(event.target.value)} placeholder="მაგ. Lela Beauty Studio" minLength={2} maxLength={160} required /></div>
              <div className="space-y-2"><Label htmlFor="organization-slug">სამუშაო სივრცის კოდი</Label><Input id="organization-slug" value={organizationSlug} onChange={event => setOrganizationSlug(event.target.value.toLowerCase())} placeholder="lela-beauty" pattern="[a-z0-9]+(-[a-z0-9]+)*" minLength={3} maxLength={96} required /><p className="text-xs text-muted-foreground">გამოიყენეთ ლათინური ასოები, ციფრები და დეფისი.</p></div>
              <div className="space-y-2"><Label htmlFor="timezone">დროის სარტყელი</Label><Input id="timezone" value={defaultTimezone} readOnly aria-readonly="true" className="bg-muted" /><p className="text-xs text-muted-foreground">პირველი სივრცისთვის მითითებულია თბილისი.</p></div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-3"><div className="rounded-xl bg-primary/10 p-2 text-primary"><MapPin className="h-5 w-5" /></div><div><CardTitle>პირველი ფილიალი</CardTitle><CardDescription>ფილიალის სახელწოდება და საჯარო ბმული გამოიყენება ონლაინ ჩაწერისთვის.</CardDescription></div></div>
            </CardHeader>
            <CardContent className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2"><Label htmlFor="location-name">ფილიალის სახელი</Label><Input id="location-name" value={locationName} onChange={event => setLocationName(event.target.value)} placeholder="მაგ. ვაკის ფილიალი" minLength={2} maxLength={160} required /></div>
              <div className="space-y-2"><Label htmlFor="public-slug">საჯარო დაჯავშნის მისამართი</Label><Input id="public-slug" value={publicSlug} onChange={event => setPublicSlug(event.target.value.toLowerCase())} placeholder="lela-vake" pattern="[a-z0-9]+(-[a-z0-9]+)*" minLength={3} maxLength={96} required /><p className="text-xs text-muted-foreground">თქვენი კლიენტები გამოიყენებენ: /book/{publicSlug || "your-salon"}</p></div>
              <div className="space-y-2 sm:col-span-2"><Label htmlFor="address">მისამართი <span className="text-muted-foreground">(არასავალდებულო)</span></Label><Input id="address" value={address} onChange={event => setAddress(event.target.value)} placeholder="თბილისი, ქუჩა და ნომერი" maxLength={1200} /></div>
              <div className="space-y-2"><Label htmlFor="phone">ტელეფონი <span className="text-muted-foreground">(არასავალდებულო)</span></Label><Input id="phone" value={phone} onChange={event => setPhone(event.target.value)} placeholder="+995 5XX XX XX XX" maxLength={32} /></div>
              <div className="space-y-2"><Label htmlFor="email">ელფოსტა <span className="text-muted-foreground">(არასავალდებულო)</span></Label><Input id="email" type="email" value={email} onChange={event => setEmail(event.target.value)} placeholder="hello@example.com" maxLength={320} /></div>
            </CardContent>
          </Card>

          {createWorkspace.error ? <Card className="border-destructive/30 bg-destructive/5"><CardContent className="p-4 text-sm text-destructive">სამუშაო სივრცის შექმნა ვერ მოხერხდა. შეამოწმეთ, რომ სამუშაო სივრცისა და საჯარო ბმულის კოდები უნიკალურია, შემდეგ სცადეთ ხელახლა.</CardContent></Card> : null}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><p className="flex items-center gap-2 text-sm text-muted-foreground"><CheckCircle2 className="h-4 w-4 text-primary" />შემდეგ შეძლებთ გუნდის, სერვისებისა და სამუშაო საათების დამატებას.</p><Button type="submit" size="lg" disabled={createWorkspace.isPending}>{createWorkspace.isPending ? "სამუშაო სივრცე იქმნება…" : "სამუშაო სივრცის შექმნა"}</Button></div>
        </form>
      </div>
    </DashboardLayout>
  );
}
