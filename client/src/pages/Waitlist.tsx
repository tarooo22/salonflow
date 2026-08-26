import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { PublicFooter, PublicHeader } from "@/components/public/PublicPrimitives";
import { GeorgianDatePicker, GeorgianTimePicker } from "@/components/public/GeorgianDateTimePicker";
import { trpc } from "@/lib/trpc";
import { dateKeyInTimeZone } from "@shared/timezones";
import { CalendarHeart, CheckCircle2, Clock3, UserRound } from "lucide-react";
import { FormEvent, useMemo, useState } from "react";
import { Link, useRoute } from "wouter";

function defaultDate() { return dateKeyInTimeZone(new Date(), "Asia/Tbilisi"); }

export default function Waitlist() {
  const [, params] = useRoute("/waitlist/:slug");
  const slug = params?.slug ?? "";
  const catalog = trpc.public.bookingCatalog.useQuery(slug, { enabled: Boolean(slug) });
  const query = useMemo(() => new URLSearchParams(window.location.search), []);
  const [serviceId, setServiceId] = useState(query.get("serviceId") ?? "");
  const [staffProfileId, setStaffProfileId] = useState(query.get("staffProfileId") ?? "ANY");
  const [requestedDate, setRequestedDate] = useState(query.get("date") ?? defaultDate());
  const [preferredStartLocalTime, setPreferredStartLocalTime] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [note, setNote] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [idempotencyKey] = useState(() => crypto.randomUUID());
  const selectedService = catalog.data?.catalog.find(item => item.service.id === serviceId)?.service;
  const eligibleTeam = (catalog.data?.team ?? []).filter(member => member.eligibleServiceIds.includes(serviceId));
  const join = trpc.public.joinWaitlist.useMutation({ onSuccess: () => setSubmitted(true), onError: cause => setError(cause.message) });
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setError("");
    if (!serviceId || !firstName.trim() || !phone.trim() || !accepted) { setError("შეავსეთ სერვისი, სახელი, მობილურის ნომერი და დაადასტურეთ პირობები."); return; }
    join.mutate({ slug, serviceId, staffProfileId: staffProfileId === "ANY" ? undefined : staffProfileId, requestedDate, preferredStartLocalTime: preferredStartLocalTime || undefined, firstName, lastName: lastName || undefined, phone, email: email || undefined, customerNote: note || undefined, bookingTermsConsent: true, idempotencyKey });
  };

  return <div className="sf-public-page"><PublicHeader /><main id="main-content" tabIndex={-1} className="sf-public-container py-10 sm:py-14"><Link href={`/book/${slug}`} className="sf-interactive inline-flex min-h-11 items-center rounded-lg px-1 py-2 text-sm font-semibold text-[var(--sf-muted)] hover:text-[var(--sf-ink)]">← ჩაწერაზე დაბრუნება</Link><div className="mx-auto mt-5 max-w-3xl"><header className="sf-grain rounded-[var(--sf-radius-hero)] p-6 text-white shadow-[var(--sf-glow-brand)]" style={{ background: "var(--sf-gradient-brand)" }}><p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/75">Waitlist · მოთხოვნა</p><h1 className="sf-display mt-3 text-4xl font-semibold">დარჩით მოლოდინის სიაში.</h1><p className="mt-3 max-w-xl text-sm leading-6 text-white/85">თუ სასურველი დრო გათავისუფლდება, თქვენი მოთხოვნა სალონის გუნდს დაეხმარება პრიორიტეტების ნახვაში. ეს არ არის დადასტურებული ჩაწერა და შეტყობინება ჯერ ავტომატურად არ იგზავნება.</p></header>{catalog.isLoading ? <Card className="mt-6"><CardContent className="sf-skeleton p-8" role="status">მონაცემები იტვირთება…</CardContent></Card> : null}{catalog.isError || catalog.data === null ? <Card className="mt-6"><CardContent className="p-7 text-sm text-[var(--sf-muted)]">ამ ფილიალის waitlist ახლა მიუწვდომელია. დაბრუნდით ჩაწერის გვერდზე.</CardContent></Card> : null}{catalog.data && submitted ? <Card role="status" aria-live="polite" className="mt-6 border-[color-mix(in_srgb,var(--sf-jade)_35%,transparent)]"><CardContent className="flex flex-col items-center gap-3 p-9 text-center"><CheckCircle2 className="size-11 text-[var(--sf-jade)]" /><h2 className="text-xl font-bold">Waitlist მოთხოვნა მიღებულია</h2><p className="max-w-lg text-sm leading-6 text-[var(--sf-muted)]">სალონის გუნდს თქვენი სასურველი დრო დაემატა. ეს არ წარმოადგენს დადასტურებულ ჯავშანს და ავტომატური შეტყობინება არ იგზავნება.</p><Button asChild variant="public" className="min-h-11"><Link href={`/book/${slug}`}>ჩაწერის გვერდზე დაბრუნება</Link></Button></CardContent></Card> : null}{catalog.data && !submitted ? <Card className="mt-6"><CardHeader><CardTitle>თქვენი სასურველი ვიზიტი</CardTitle><p className="text-sm leading-6 text-muted-foreground">აირჩიეთ თარიღი ქართულ კალენდარში. წარსული დღეები და მიმდინარე დღის გასული საათები მიუწვდომელია.</p></CardHeader><CardContent><form data-conversion-event="BOOKING_WAITLIST_SUBMIT" className="space-y-5" onSubmit={submit}><div className="grid gap-4 sm:grid-cols-2"><Field label="სერვისი"><Select value={serviceId} onValueChange={value => { setServiceId(value); setStaffProfileId("ANY"); }}><SelectTrigger><SelectValue placeholder="აირჩიეთ სერვისი" /></SelectTrigger><SelectContent>{catalog.data.catalog.map(({ service }) => <SelectItem key={service.id} value={service.id}>{service.nameKa}</SelectItem>)}</SelectContent></Select></Field><Field label="სპეციალისტი"><Select value={staffProfileId} onValueChange={setStaffProfileId}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="ANY">ნებისმიერი თავისუფალი სპეციალისტი</SelectItem>{eligibleTeam.map(member => <SelectItem key={member.id} value={member.id}>{member.name}</SelectItem>)}</SelectContent></Select></Field><Field label="სასურველი თარიღი"><GeorgianDatePicker value={requestedDate} onChange={value => { setRequestedDate(value); setPreferredStartLocalTime(""); }} /></Field><Field label="სასურველი დრო (არასავალდებულო)"><GeorgianTimePicker dateKey={requestedDate} value={preferredStartLocalTime} onChange={setPreferredStartLocalTime} /></Field></div>{selectedService ? <p className="rounded-xl bg-[var(--sf-surface-hover)] p-3 text-sm text-[var(--sf-muted)]"><CalendarHeart className="mr-2 inline size-4 text-[var(--sf-terracotta)]" />არჩეული სერვისი: <span className="font-semibold text-[var(--sf-ink)]">{selectedService.nameKa}</span></p> : null}<div className="grid gap-4 sm:grid-cols-2"><Field label="სახელი"><Input value={firstName} onChange={event => setFirstName(event.target.value)} autoComplete="given-name" required /></Field><Field label="გვარი"><Input value={lastName} onChange={event => setLastName(event.target.value)} autoComplete="family-name" /></Field><Field label="მობილურის ნომერი"><Input value={phone} onChange={event => setPhone(event.target.value)} autoComplete="tel" inputMode="tel" type="tel" placeholder="მაგ. 555 12 34 56" aria-describedby="waitlist-phone-help" required /><span id="waitlist-phone-help" className="block text-xs leading-5 text-muted-foreground">ფორმატი: 5XX XX XX XX ან +995 5XX XX XX XX.</span></Field><Field label="ელფოსტა"><Input value={email} onChange={event => setEmail(event.target.value)} autoComplete="email" type="email" /></Field></div><Field label="კომენტარი სალონისთვის"><Textarea value={note} onChange={event => setNote(event.target.value)} /></Field><label className="flex items-start gap-3 rounded-xl bg-[var(--sf-surface-hover)] p-3 text-sm leading-5 text-[var(--sf-muted)]"><Checkbox checked={accepted} onCheckedChange={value => setAccepted(value === true)} /><span>ვეთანხმები, რომ სალონმა ეს მონაცემები გამოიყენოს მხოლოდ waitlist მოთხოვნის დამუშავებისთვის. *</span></label>{error ? <p role="alert" className="rounded-xl border border-[color-mix(in_srgb,var(--sf-danger)_35%,transparent)] bg-[color-mix(in_srgb,var(--sf-danger)_7%,transparent)] p-3 text-sm text-[var(--sf-danger)]">{error}</p> : null}<Button type="submit" variant="public" className="min-h-11 w-full" disabled={join.isPending}>{join.isPending ? "იგზავნება…" : "Waitlist მოთხოვნის გაგზავნა"}</Button></form></CardContent></Card> : null}</div></main><PublicFooter /></div>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="space-y-2"><Label>{label}</Label>{children}</label>; }
