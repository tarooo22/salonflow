import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { CheckCircle2, ChevronLeft, CircleAlert, Clock3, MapPin, UserRound } from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";
import { Link, useRoute } from "wouter";

const steps = ["სერვისი", "სპეციალისტი", "თარიღი და დრო", "თქვენი მონაცემები"];

export default function BookingFlow() {
  const [, params] = useRoute("/book/:slug");
  const slug = params?.slug ?? "";
  const catalog = trpc.public.bookingCatalog.useQuery(slug, { enabled: Boolean(slug) });
  const [step, setStep] = useState(0);
  const [serviceId, setServiceId] = useState<string>();
  const [staffProfileId, setStaffProfileId] = useState<string>();
  const [dateTime, setDateTime] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [customerNote, setCustomerNote] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [idempotencyKey] = useState(() => crypto.randomUUID());
  const [confirmationToken, setConfirmationToken] = useState<string>();
  const startsAt = useMemo(() => (dateTime ? new Date(dateTime) : null), [dateTime]);
  const availabilityInput = useMemo(() => ({
    slug,
    serviceId: serviceId ?? "pending-service",
    staffProfileId: staffProfileId ?? "pending-specialist",
    startsAt: startsAt ?? new Date(0),
  }), [slug, serviceId, staffProfileId, startsAt]);
  const availability = trpc.public.checkAvailability.useQuery(availabilityInput, { enabled: Boolean(serviceId && staffProfileId && startsAt && step >= 2) });
  const commitBooking = trpc.public.commitBooking.useMutation({ onSuccess: result => setConfirmationToken(result.confirmationToken) });
  const selectedService = catalog.data?.catalog.find(item => item.service.id === serviceId)?.service;
  const eligibleTeam = catalog.data?.team.filter(member => member.eligibleServiceIds.includes(serviceId ?? "")) ?? [];

  const submitBooking = () => {
    if (!serviceId || !staffProfileId || !startsAt || !firstName.trim() || !phone.trim() || !termsAccepted) return;
    commitBooking.mutate({ slug, serviceId, staffProfileId, startsAt, firstName, lastName: lastName || undefined, phone, email: email || undefined, customerNote: customerNote || undefined, bookingTermsConsent: true, idempotencyKey });
  };

  return <main className="min-h-screen bg-[#F7F4EF] px-5 py-8 text-[#1E2824] sm:px-8"><div className="mx-auto max-w-3xl">
    <Link href="/book" className="inline-flex items-center gap-2 text-sm font-medium text-[#516159]"><ChevronLeft className="h-4 w-4" /> ფილიალების სია</Link>
    <header className="mt-10"><p className="text-sm font-semibold text-[#B85C3D]">ონლაინ ჩაწერა · 4 ნაბიჯი</p><h1 className="mt-3 font-serif text-4xl font-semibold tracking-tight">დაჯავშნეთ სასურველი დრო</h1>{catalog.data ? <p className="mt-2 text-sm text-[#516159]">{catalog.data.location.name} · {catalog.data.location.timezone}</p> : null}</header>
    <ol className="mt-8 grid gap-2 sm:grid-cols-4">{steps.map((label, index) => <li key={label} className={`rounded-xl border px-3 py-3 text-sm ${index === step ? "border-[#B85C3D] bg-[#B85C3D]/10 font-semibold text-[#743A27]" : index < step ? "border-[#17826A]/20 bg-[#17826A]/5 text-[#216451]" : "border-[#1E2824]/10 bg-white text-[#69756e]"}`}><span className="mr-2 text-xs">0{index + 1}</span>{label}</li>)}</ol>
    {catalog.isLoading ? <Card className="mt-8 border-[#1E2824]/10"><CardContent className="p-6 text-sm text-muted-foreground">ჩაწერის კატალოგი იტვირთება…</CardContent></Card> : null}
    {catalog.isError ? <Alert>ჩაწერის მონაცემები დროებით მიუწვდომელია. სცადეთ მოგვიანებით.</Alert> : null}
    {catalog.data === null ? <Card className="mt-8 border-[#1E2824]/10"><CardHeader><CardTitle>ეს ჩაწერის ბმული აღარ არის აქტიური</CardTitle></CardHeader><CardContent className="text-sm leading-6 text-muted-foreground">ფილიალი შესაძლოა გათიშულია ან ბმული არასწორია. დაბრუნდით ფილიალების სიაში და აირჩიეთ აქტიური ფილიალი.</CardContent></Card> : null}
    {catalog.data && confirmationToken ? <Card className="mt-8 border-[#17826A]/30 bg-[#17826A]/5"><CardHeader><CheckCircle2 className="h-7 w-7 text-[#17826A]" /><CardTitle className="mt-3">თქვენი მოთხოვნა მიღებულია</CardTitle></CardHeader><CardContent className="space-y-3 text-sm leading-6 text-[#355747]"><p>ჯავშანი ელოდება სალონის დადასტურებას. საჭიროების შემთხვევაში შეინახეთ ეს დადასტურების კოდი.</p><code className="block break-all rounded-lg bg-white px-3 py-2 text-xs text-[#1E2824]">{confirmationToken}</code><Link href="/book" className="inline-flex font-medium text-[#B85C3D]">ფილიალების სიაში დაბრუნება</Link></CardContent></Card> : null}
    {catalog.data && !confirmationToken ? <div className="mt-8 grid gap-5 lg:grid-cols-[1fr_0.82fr]"><section className="space-y-4">
      <Card className="border-[#1E2824]/10"><CardHeader><p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#B85C3D]">ფილიალი</p><CardTitle className="mt-2">{catalog.data.location.name}</CardTitle></CardHeader><CardContent className="flex items-center gap-2 text-sm text-muted-foreground"><MapPin className="h-4 w-4" />{catalog.data.location.address || catalog.data.location.timezone}</CardContent></Card>
      {step === 0 ? <ServiceStep catalog={catalog.data.catalog} selectedId={serviceId} onSelect={setServiceId} /> : null}
      {step === 1 ? <StaffStep team={eligibleTeam} selectedId={staffProfileId} onSelect={setStaffProfileId} /> : null}
      {step === 2 ? <TimeStep dateTime={dateTime} onChange={setDateTime} availability={availability} /> : null}
      {step === 3 ? <ContactStep firstName={firstName} lastName={lastName} phone={phone} email={email} customerNote={customerNote} termsAccepted={termsAccepted} onFirstName={setFirstName} onLastName={setLastName} onPhone={setPhone} onEmail={setEmail} onNote={setCustomerNote} onTerms={setTermsAccepted} /> : null}
    </section><aside><Card className="border-[#1E2824]/10"><CardHeader><UserRound className="h-5 w-5 text-[#B85C3D]" /><CardTitle className="mt-3">თქვენი არჩევანი</CardTitle></CardHeader><CardContent className="space-y-4 text-sm leading-6 text-muted-foreground"><p>{selectedService ? `${selectedService.nameKa} · ${selectedService.defaultDurationMinutes} წთ` : "აირჩიეთ სერვისი, რათა გააგრძელოთ."}</p><p>{staffProfileId ? catalog.data.team.find(item => item.id === staffProfileId)?.name : "შემდეგ აირჩიეთ სპეციალისტი."}</p><p>{startsAt ? startsAt.toLocaleString("ka-GE", { dateStyle: "medium", timeStyle: "short" }) : "შემდეგ აირჩიეთ თქვენთვის სასურველი დრო."}</p>{step > 0 ? <Button variant="outline" className="w-full" onClick={() => setStep(current => Math.max(0, current - 1))}>წინა ნაბიჯი</Button> : null}{step < 3 ? <Button className="w-full bg-[#B85C3D] hover:bg-[#9F4C32]" disabled={(step === 0 && !serviceId) || (step === 1 && !staffProfileId) || (step === 2 && (!startsAt || availability.isLoading || availability.data?.available !== true))} onClick={() => setStep(current => Math.min(current + 1, 3))}>გაგრძელება</Button> : <Button className="w-full bg-[#B85C3D] hover:bg-[#9F4C32]" disabled={!firstName.trim() || !phone.trim() || !termsAccepted || commitBooking.isPending} onClick={submitBooking}>{commitBooking.isPending ? "იგზავნება…" : "ჯავშნის გაგზავნა"}</Button>}{commitBooking.isError ? <p className="text-xs text-destructive">{commitBooking.error.message || "ჯავშანი ვერ გაიგზავნა. სცადეთ ხელახლა."}</p> : null}</CardContent></Card></aside></div> : null}
  </div></main>;
}

function ServiceStep({ catalog, selectedId, onSelect }: { catalog: Array<{ service: { id: string; nameKa: string; defaultDurationMinutes: number; priceTetri: number }; category: { nameKa: string } }>; selectedId?: string; onSelect: (id: string) => void }) {
  return <Card className="border-[#1E2824]/10"><CardHeader><CardTitle>აირჩიეთ სერვისი</CardTitle></CardHeader><CardContent className="space-y-3">{catalog.length ? catalog.map(({ service, category }) => <button key={service.id} type="button" onClick={() => onSelect(service.id)} className={`w-full rounded-xl border px-4 py-4 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B85C3D] ${service.id === selectedId ? "border-[#B85C3D] bg-[#B85C3D]/5" : "border-[#1E2824]/10 bg-white hover:border-[#B85C3D]"}`}><p className="text-xs font-medium text-[#B85C3D]">{category.nameKa}</p><div className="mt-1 flex items-start justify-between gap-3"><p className="font-semibold">{service.nameKa}</p><p className="text-sm text-[#516159]">{service.defaultDurationMinutes} წთ</p></div><p className="mt-1 text-sm text-[#516159]">{(service.priceTetri / 100).toFixed(2)} ₾</p></button>) : <p className="text-sm leading-6 text-muted-foreground">ამ ფილიალისთვის ჯერ არ არის ხელმისაწვდომი ონლაინ სერვისები.</p>}</CardContent></Card>;
}

function StaffStep({ team, selectedId, onSelect }: { team: Array<{ id: string; name: string; specialty: string | null; bio: string | null; eligibleServiceIds: string[] }>; selectedId?: string; onSelect: (id: string) => void }) {
  return <Card className="border-[#1E2824]/10"><CardHeader><CardTitle>აირჩიეთ სპეციალისტი</CardTitle></CardHeader><CardContent className="space-y-3">{team.length ? team.map(member => <button key={member.id} type="button" onClick={() => onSelect(member.id)} className={`w-full rounded-xl border px-4 py-4 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B85C3D] ${member.id === selectedId ? "border-[#B85C3D] bg-[#B85C3D]/5" : "border-[#1E2824]/10 bg-white hover:border-[#B85C3D]"}`}><p className="font-semibold">{member.name}</p>{member.specialty ? <p className="mt-1 text-sm text-[#516159]">{member.specialty}</p> : null}{member.bio ? <p className="mt-2 text-xs leading-5 text-[#69756e]">{member.bio}</p> : null}</button>) : <p className="rounded-xl border border-dashed border-[#1E2824]/15 bg-white/60 p-4 text-sm leading-6 text-[#516159]">ამ სერვისისთვის ამ ფილიალში აქტიური ონლაინ სპეციალისტი ჯერ არ არის. გთხოვთ აირჩიოთ სხვა სერვისი ან დაუკავშირდეთ სალონს.</p>}</CardContent></Card>;
}

function TimeStep({ dateTime, onChange, availability }: { dateTime: string; onChange: (value: string) => void; availability: { isLoading: boolean; isError: boolean; data?: { available: boolean; reason?: string } } }) {
  return <Card className="border-[#1E2824]/10"><CardHeader><Clock3 className="h-5 w-5 text-[#B85C3D]" /><CardTitle className="mt-3">აირჩიეთ თარიღი და დრო</CardTitle></CardHeader><CardContent className="space-y-4"><Input type="datetime-local" value={dateTime} min={new Date().toISOString().slice(0, 16)} onChange={event => onChange(event.target.value)} />{dateTime && availability.isLoading ? <p className="text-sm text-muted-foreground">ხელმისაწვდომობა მოწმდება…</p> : null}{dateTime && availability.data?.available ? <p className="text-sm font-medium text-[#17826A]">ეს დრო ხელმისაწვდომია.</p> : null}{dateTime && (availability.isError || availability.data?.available === false) ? <Alert>{availability.data?.reason === "OUTSIDE_BOOKING_WINDOW" ? "არჩეული დრო დაჯავშნების დაშვებულ ვადას სცდება." : "ეს დრო აღარ არის ხელმისაწვდომი. აირჩიეთ სხვა დრო."}</Alert> : null}</CardContent></Card>;
}

function ContactStep({ firstName, lastName, phone, email, customerNote, termsAccepted, onFirstName, onLastName, onPhone, onEmail, onNote, onTerms }: { firstName: string; lastName: string; phone: string; email: string; customerNote: string; termsAccepted: boolean; onFirstName: (value: string) => void; onLastName: (value: string) => void; onPhone: (value: string) => void; onEmail: (value: string) => void; onNote: (value: string) => void; onTerms: (value: boolean) => void }) {
  return <Card className="border-[#1E2824]/10"><CardHeader><CardTitle>თქვენი მონაცემები</CardTitle></CardHeader><CardContent className="space-y-4"><div className="grid gap-3 sm:grid-cols-2"><Input placeholder="სახელი *" value={firstName} onChange={event => onFirstName(event.target.value)} /><Input placeholder="გვარი" value={lastName} onChange={event => onLastName(event.target.value)} /></div><Input type="tel" placeholder="მობილურის ნომერი *" value={phone} onChange={event => onPhone(event.target.value)} /><Input type="email" placeholder="ელფოსტა" value={email} onChange={event => onEmail(event.target.value)} /><Textarea placeholder="კომენტარი სალონისთვის" value={customerNote} onChange={event => onNote(event.target.value)} /><label className="flex items-start gap-3 text-sm leading-5 text-[#516159]"><Checkbox checked={termsAccepted} onCheckedChange={value => onTerms(value === true)} /><span>ვეთანხმები, რომ სალონმა ჩემი მონაცემები გამოიყენოს ამ ჯავშნის დამუშავებისა და დადასტურებისთვის. *</span></label></CardContent></Card>;
}

function Alert({ children }: { children: ReactNode }) {
  return <Card className="mt-8 border-destructive/30 bg-destructive/5"><CardContent className="flex gap-3 p-6 text-sm text-destructive"><CircleAlert className="h-5 w-5 shrink-0" />{children}</CardContent></Card>;
}
