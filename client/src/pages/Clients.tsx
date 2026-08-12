import DashboardLayout from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { Plus, Search, ShieldCheck, UsersRound } from "lucide-react";
import { FormEvent, useMemo, useState } from "react";

export default function Clients() {
  const utils = trpc.useUtils();
  const organizations = trpc.organizations.listMine.useQuery();
  const organizationEntry = organizations.data?.[0];
  const organization = organizationEntry?.organization;
  const canManageClients = ["OWNER", "MANAGER", "RECEPTIONIST"].includes(organizationEntry?.membership.role ?? "");
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [bookingConsent, setBookingConsent] = useState(false);
  const [formError, setFormError] = useState("");
  const input = useMemo(() => ({ organizationId: organization?.id ?? "", limit: 25, offset: 0, status: "ACTIVE" as const, search: search || undefined }), [organization?.id, search]);
  const clients = trpc.clients.list.useQuery(input, { enabled: Boolean(organization?.id) });
  const createClient = trpc.clients.create.useMutation({
    onSuccess: async () => {
      await utils.clients.list.invalidate();
      setFirstName("");
      setLastName("");
      setPhone("");
      setEmail("");
      setBookingConsent(false);
      setFormError("");
      setCreateOpen(false);
    },
  });

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!organization) return;
    if (!bookingConsent) {
      setFormError("კლიენტის დამატებამდე საჭიროა დაჯავშნის პირობებზე თანხმობა.");
      return;
    }
    setFormError("");
    createClient.mutate({
      organizationId: organization.id,
      firstName,
      lastName: lastName || undefined,
      phone,
      email: email || undefined,
      bookingTermsConsent: true,
      marketingSmsConsent: false,
      marketingEmailConsent: false,
    });
  };

  return (
    <DashboardLayout>
      <div className="mx-auto w-full max-w-7xl space-y-6">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-sm font-medium text-primary">კლიენტების ურთიერთობა</p><h1 className="mt-1 text-3xl font-semibold tracking-tight">კლიენტები</h1><p className="mt-2 text-sm text-muted-foreground">დაცული კლიენტების რეესტრი, კონტაქტები და დაჯავშნების ისტორიის საფუძველი.</p></div><div className="flex flex-wrap items-center gap-2"><Badge variant="outline" className="w-fit border-primary/30 bg-primary/5 px-3 py-1 text-primary">{organization?.name ?? "სამუშაო სივრცე"}</Badge>{organization && canManageClients ? <Button onClick={() => { setFormError(""); setCreateOpen(true); }}><Plus className="mr-2 h-4 w-4" />კლიენტის დამატება</Button> : null}</div></header>
        {organizations.isLoading ? <State text="კლიენტების რეესტრი იტვირთება…" /> : null}
        {organizations.isError ? <State text="სამუშაო სივრცის მონაცემები დროებით მიუწვდომელია." error /> : null}
        {!organizations.isLoading && !organizations.isError && !organization ? <State text="კლიენტების სანახავად ჯერ შექმენით სამუშაო სივრცე." /> : null}
        {organization ? <><div className="grid gap-4 md:grid-cols-[0.7fr_1.3fr]"><Card><CardContent className="p-5"><UsersRound className="h-5 w-5 text-primary" /><p className="mt-4 text-sm text-muted-foreground">აქტიური კლიენტები</p><p className="mt-2 text-2xl font-semibold">{clients.isLoading ? "…" : clients.data?.total ?? 0}</p></CardContent></Card><Card><CardContent className="p-5"><ShieldCheck className="h-5 w-5 text-primary" /><p className="mt-4 text-sm text-muted-foreground">მონაცემები დაცულია ორგანიზაციის როლებით და თითოეული კლიენტის თანხმობის ისტორიით.</p></CardContent></Card></div><Card><CardHeader><div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><CardTitle>აქტიური რეესტრი</CardTitle><div className="relative w-full sm:w-72"><Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" /><Input className="pl-9" placeholder="მოძებნეთ სახელით" value={search} onChange={event => setSearch(event.target.value)} /></div></div></CardHeader><CardContent><div className="divide-y">{clients.isLoading ? <p className="py-8 text-sm text-muted-foreground">კლიენტები იტვირთება…</p> : null}{clients.isError ? <p className="py-8 text-sm text-destructive">კლიენტების ჩატვირთვა ვერ მოხერხდა.</p> : null}{!clients.isLoading && !clients.isError && clients.data?.items.length === 0 ? <div className="rounded-xl border border-dashed p-6 text-sm leading-6 text-muted-foreground"><p>ამ ძიებისთვის კლიენტები ვერ მოიძებნა. ახალი საჯარო ან შიდა ჯავშნები რეესტრს ავტომატურად შეავსებს.</p>{canManageClients ? <Button variant="outline" size="sm" className="mt-4" onClick={() => setCreateOpen(true)}><Plus className="mr-1.5 h-4 w-4" />პირველი კლიენტის დამატება</Button> : null}</div> : null}{clients.data?.items.map(client => <div key={client.id} className="flex flex-col gap-2 py-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-semibold">{client.firstName} {client.lastName ?? ""}</p><p className="mt-1 text-sm text-muted-foreground">{client.normalizedPhone || client.email || "საკონტაქტო ინფორმაცია არ არის"}</p></div><Badge variant="outline" className="w-fit border-primary/20 bg-primary/5 text-primary">{client.source === "PUBLIC_WEB" ? "ონლაინ ჩაწერა" : "შიდა"}</Badge></div>)}</div></CardContent></Card></> : null}
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}><DialogContent><DialogHeader><DialogTitle>კლიენტის დამატება</DialogTitle><DialogDescription>შიდა ჩანაწერისას დაჯავშნის პირობებზე თანხმობა ინახება კლიენტის თანხმობის ისტორიაში.</DialogDescription></DialogHeader><form onSubmit={submit} className="space-y-4"><div className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><Label htmlFor="client-first-name">სახელი</Label><Input id="client-first-name" value={firstName} onChange={event => setFirstName(event.target.value)} minLength={1} maxLength={100} required /></div><div className="space-y-2"><Label htmlFor="client-last-name">გვარი <span className="text-muted-foreground">(არასავალდებულო)</span></Label><Input id="client-last-name" value={lastName} onChange={event => setLastName(event.target.value)} maxLength={100} /></div></div><div className="space-y-2"><Label htmlFor="client-phone">ტელეფონი</Label><Input id="client-phone" value={phone} onChange={event => setPhone(event.target.value)} placeholder="+995 5XX XX XX XX" minLength={6} maxLength={32} required /></div><div className="space-y-2"><Label htmlFor="client-email">ელფოსტა <span className="text-muted-foreground">(არასავალდებულო)</span></Label><Input id="client-email" type="email" value={email} onChange={event => setEmail(event.target.value)} maxLength={320} /></div><label className="flex cursor-pointer items-start gap-3 rounded-xl border p-3 text-sm"><input id="client-booking-consent" type="checkbox" checked={bookingConsent} onChange={event => setBookingConsent(event.target.checked)} className="mt-0.5 h-4 w-4 accent-primary" /><span>კლიენტმა დაადასტურა დაჯავშნის პირობებზე თანხმობა. ეს ჩანაწერი შეინახება თანხმობის ისტორიაში.</span></label>{formError ? <p className="text-sm text-destructive">{formError}</p> : null}{createClient.error ? <p className="text-sm text-destructive">კლიენტის დამატება ვერ მოხერხდა. შეამოწმეთ საკონტაქტო მონაცემები და სცადეთ ხელახლა.</p> : null}<DialogFooter><Button type="submit" disabled={createClient.isPending}>{createClient.isPending ? "ინახება…" : "კლიენტის შენახვა"}</Button></DialogFooter></form></DialogContent></Dialog>
    </DashboardLayout>
  );
}

function State({ text, error = false }: { text: string; error?: boolean }) { return <Card className={error ? "border-destructive/30 bg-destructive/5" : ""}><CardContent className={`p-8 text-sm ${error ? "text-destructive" : "text-muted-foreground"}`}>{text}</CardContent></Card>; }
