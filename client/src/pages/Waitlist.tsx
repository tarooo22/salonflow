import { CatalogFooter, CatalogHeader } from "@/components/catalog/CatalogChrome";
import "@/components/catalog/discovery.css";
import { cssVars } from "@/components/catalog/Tickets";
import { GeorgianDatePicker, GeorgianTimePicker } from "@/components/public/GeorgianDateTimePicker";
import { usePublicMeta } from "@/components/public/PublicMeta";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { BRAND } from "@shared/brand";
import { dateKeyInTimeZone } from "@shared/timezones";
import { CalendarHeart, CheckCircle2 } from "lucide-react";
import { FormEvent, useMemo, useState } from "react";
import { Link, useRoute } from "wouter";

function defaultDate() { return dateKeyInTimeZone(new Date(), "Asia/Tbilisi"); }

export default function Waitlist() {
  const [, params] = useRoute("/waitlist/:slug");
  const slug = params?.slug ?? "";
  usePublicMeta({ title: `მოლოდინის სია | ${BRAND.name}`, description: "დატოვეთ მოთხოვნა მოლოდინის სიაში — თუ სასურველი დრო გათავისუფლდება, ადგილის გუნდი ამას დაინახავს.", canonicalPath: `/waitlist/${slug}`, robots: "noindex,nofollow" });
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
    event.preventDefault();
    setError("");
    if (!serviceId || !firstName.trim() || !phone.trim() || !accepted) { setError("შეავსეთ სერვისი, სახელი, მობილურის ნომერი და დაადასტურეთ პირობები."); return; }
    join.mutate({ slug, serviceId, staffProfileId: staffProfileId === "ANY" ? undefined : staffProfileId, requestedDate, preferredStartLocalTime: preferredStartLocalTime || undefined, firstName, lastName: lastName || undefined, phone, email: email || undefined, customerNote: note || undefined, bookingTermsConsent: true, idempotencyKey });
  };

  return <div className="cw min-h-screen">
    <CatalogHeader />
    <main id="main-content" tabIndex={-1}>
      <section className="cw-desk pb-12 pt-6 sm:pb-16 sm:pt-8" aria-labelledby="waitlist-title">
        <div className="cw-container max-w-3xl">
          <Link href={`/book/${slug}`} className="cw-navlink -ml-2 inline-flex min-h-11 items-center">← ჩაწერაზე დაბრუნება</Link>
          <p className="cw-caption mt-6">მოლოდინის სია · მოთხოვნა</p>
          <h1 id="waitlist-title" className="cw-display mt-3 text-[clamp(1.95rem,4.6vw,3.4rem)]">დარჩით მოლოდინის სიაში.</h1>
          <p className="cw-lede mt-4">თუ სასურველი დრო გათავისუფლდება, თქვენი მოთხოვნა გუნდს დაეხმარება პრიორიტეტების ნახვაში. ეს არ არის დადასტურებული ჩაწერა და შეტყობინება ჯერ ავტომატურად არ იგზავნება.</p>
        </div>
      </section>

      <section className="py-10 sm:py-14" aria-label="მოლოდინის სიის ფორმა">
        <div className="cw-container max-w-3xl">
          {catalog.isLoading ? <div className="h-48 animate-pulse rounded-[4px] border-[1.5px] border-[var(--cw-rule)] bg-white p-8" role="status">მონაცემები იტვირთება…</div> : null}
          {catalog.isError || catalog.data === null ? <div className="cw-notice" role="alert">
            <p className="font-extrabold">ამ ფილიალის მოლოდინის სია ახლა მიუწვდომელია.</p>
            <p className="mt-2 text-sm text-[var(--cw-ink-soft)]">დაბრუნდით ჩაწერის გვერდზე.</p>
            <Link href={`/book/${slug}`} className="cw-btn cw-btn-line mt-4 min-h-11">ჩაწერის გვერდი</Link>
          </div> : null}

          {catalog.data && submitted ? <div role="status" aria-live="polite" className="cw-ledger">
            <div className="cw-ledger-head" style={cssVars({ "--ledger-bg": "var(--cw-paper)", "--ledger-ink": "var(--cw-ink)" })}>
              <span className="flex items-center gap-2 text-lg font-extrabold [font-stretch:85%]"><CheckCircle2 className="size-5 text-[var(--cw-stamp)]" aria-hidden="true" />მოთხოვნა მიღებულია</span>
            </div>
            <div className="p-6 sm:p-8">
              <p className="max-w-lg leading-7 text-[var(--cw-ink-soft)]">თქვენი სასურველი დრო მოლოდინის სიას დაემატა. ეს არ წარმოადგენს დადასტურებულ ჯავშანს და ავტომატური შეტყობინება არ იგზავნება.</p>
              <Link href={`/book/${slug}`} className="cw-btn cw-btn-stamp mt-5">ჩაწერის გვერდზე დაბრუნება</Link>
            </div>
          </div> : null}

          {catalog.data && !submitted ? <form data-conversion-event="BOOKING_WAITLIST_SUBMIT" className="cw-ledger" onSubmit={submit}>
            <div className="cw-ledger-head" style={cssVars({ "--ledger-bg": "var(--cw-paper)", "--ledger-ink": "var(--cw-ink)" })}>
              <span className="text-lg font-extrabold [font-stretch:85%]">თქვენი სასურველი ვიზიტი</span>
              <span className="cw-num text-xs">* სავალდებულო</span>
            </div>
            <div className="grid gap-6 p-4 sm:p-6">
              <p className="text-sm leading-6 text-[var(--cw-ink-soft)]">აირჩიეთ თარიღი ქართულ კალენდარში. წარსული დღეები და მიმდინარე დღის გასული საათები მიუწვდომელია.</p>

              <fieldset className="grid gap-4">
                <legend className="cw-form-step mb-3"><span className="cw-num grid size-9 place-items-center rounded-[3px] border-[1.5px] border-[var(--cw-ink)] text-sm font-semibold">1</span><span className="text-lg font-extrabold [font-stretch:85%]">სერვისი და დრო</span></legend>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="სერვისი" required>
                    <Select value={serviceId} onValueChange={value => { setServiceId(value); setStaffProfileId("ANY"); }}>
                      <SelectTrigger><SelectValue placeholder="აირჩიეთ სერვისი" /></SelectTrigger>
                      <SelectContent>{catalog.data.catalog.map(({ service }) => <SelectItem key={service.id} value={service.id}>{service.nameKa}</SelectItem>)}</SelectContent>
                    </Select>
                  </Field>
                  <Field label="სპეციალისტი">
                    <Select value={staffProfileId} onValueChange={setStaffProfileId}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ANY">ნებისმიერი თავისუფალი სპეციალისტი</SelectItem>
                        {eligibleTeam.map(member => <SelectItem key={member.id} value={member.id}>{member.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field label="სასურველი თარიღი">
                    <GeorgianDatePicker value={requestedDate} onChange={value => { setRequestedDate(value); setPreferredStartLocalTime(""); }} />
                  </Field>
                  <Field label="სასურველი დრო (არასავალდებულო)">
                    <GeorgianTimePicker dateKey={requestedDate} value={preferredStartLocalTime} onChange={setPreferredStartLocalTime} />
                  </Field>
                </div>
                {selectedService ? <p className="flex items-center gap-2 rounded-[3px] border border-[var(--cw-rule)] bg-[var(--cw-paper)] p-3 text-sm text-[var(--cw-ink-soft)]"><CalendarHeart className="size-4 shrink-0" aria-hidden="true" />არჩეული სერვისი: <span className="font-extrabold text-[var(--cw-ink)]">{selectedService.nameKa}</span></p> : null}
              </fieldset>

              <fieldset className="grid gap-4 border-t-[1.5px] border-[var(--cw-ink)] pt-6">
                <legend className="cw-form-step mb-3"><span className="cw-num grid size-9 place-items-center rounded-[3px] border-[1.5px] border-[var(--cw-ink)] text-sm font-semibold">2</span><span className="text-lg font-extrabold [font-stretch:85%]">თქვენი მონაცემები</span></legend>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="სახელი" required><input value={firstName} onChange={event => setFirstName(event.target.value)} autoComplete="given-name" required /></Field>
                  <Field label="გვარი"><input value={lastName} onChange={event => setLastName(event.target.value)} autoComplete="family-name" /></Field>
                  <Field label="მობილურის ნომერი" required hint="ფორმატი: 5XX XX XX XX ან +995 5XX XX XX XX." hintId="waitlist-phone-help">
                    <input value={phone} onChange={event => setPhone(event.target.value)} autoComplete="tel" inputMode="tel" type="tel" placeholder="მაგ. 555 12 34 56" aria-describedby="waitlist-phone-help" required />
                  </Field>
                  <Field label="ელფოსტა"><input value={email} onChange={event => setEmail(event.target.value)} autoComplete="email" type="email" /></Field>
                </div>
                <Field label="კომენტარი ადგილისთვის"><textarea value={note} onChange={event => setNote(event.target.value)} /></Field>
                <label className="cw-check"><Checkbox checked={accepted} onCheckedChange={value => setAccepted(value === true)} /><span>ვეთანხმები, რომ ბიზნესმა ეს მონაცემები გამოიყენოს მხოლოდ მოლოდინის სიის მოთხოვნის დამუშავებისთვის. *</span></label>
              </fieldset>

              {error ? <p role="alert" className="cw-notice cw-notice-error text-sm">{error}</p> : null}
              <button type="submit" className="cw-btn cw-btn-stamp w-full" disabled={join.isPending}>{join.isPending ? "იგზავნება…" : "მოთხოვნის გაგზავნა"}</button>
            </div>
          </form> : null}
        </div>
      </section>
    </main>
    <CatalogFooter />
  </div>;
}

function Field({ label, children, required, hint, hintId }: { label: string; children: React.ReactNode; required?: boolean; hint?: string; hintId?: string }) {
  return <label className="cw-field">
    <span className="cw-caption">{label}{required ? <span aria-hidden="true"> *</span> : null}</span>
    {children}
    {hint ? <span id={hintId} className="cw-field-hint">{hint}</span> : null}
  </label>;
}
