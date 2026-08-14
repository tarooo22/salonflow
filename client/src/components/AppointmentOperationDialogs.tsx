import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { formatGelTetri } from "@/lib/presentation";
import { trpc } from "@/lib/trpc";
import { zonedDateTimeToUtc } from "@shared/timezones";
import { CalendarPlus2, Clock3, MoveRight } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

function datetimeLocalValue(value: Date, timezone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(value);
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find(item => item.type === type)?.value ?? "00";
  return `${part("year")}-${part("month")}-${part("day")}T${part("hour")}:${part("minute")}`;
}

function toUtc(value: string, timezone: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value);
  if (!match) return null;
  return zonedDateTimeToUtc({ year: Number(match[1]), month: Number(match[2]), day: Number(match[3]), hour: Number(match[4]), minute: Number(match[5]), second: 0 }, timezone);
}

export function WalkInDialog({ organizationId, locationId, timezone, enabled }: { organizationId: string; locationId: string; timezone: string; enabled: boolean }) {
  const utils = trpc.useUtils();
  const [open, setOpen] = useState(false);
  const [staffProfileId, setStaffProfileId] = useState("");
  const [serviceId, setServiceId] = useState("");
  const [clientId, setClientId] = useState("NONE");
  const [startsAtLocal, setStartsAtLocal] = useState(() => datetimeLocalValue(new Date(), timezone));
  const [internalNote, setInternalNote] = useState("");
  const [error, setError] = useState("");
  const options = trpc.appointments.walkInOptions.useQuery({ organizationId, locationId }, { enabled: Boolean(enabled && open && organizationId && locationId) });
  const clients = trpc.clients.list.useQuery({ organizationId, limit: 100, offset: 0, status: "ACTIVE" }, { enabled: Boolean(enabled && open && organizationId) });
  const staffOptions = useMemo(() => Array.from(new Map((options.data ?? []).map(item => [item.staffProfileId, item.staffName])).entries()).map(([id, name]) => ({ id, name })), [options.data]);
  const serviceOptions = useMemo(() => (options.data ?? []).filter(item => item.staffProfileId === staffProfileId), [options.data, staffProfileId]);
  const selectedOption = serviceOptions.find(item => item.serviceId === serviceId);
  const createWalkIn = trpc.appointments.createWalkIn.useMutation({
    onSuccess: async result => {
      await Promise.all([utils.appointments.dashboard.invalidate(), utils.appointments.listRange.invalidate()]);
      toast.success(`შიდა ჩაწერა შეიქმნა · ${formatGelTetri(result.totalTetri)}`);
      setOpen(false); setInternalNote(""); setError("");
    },
    onError: cause => setError(cause.message || "შიდა ჩაწერა ვერ შეიქმნა."),
  });
  useEffect(() => {
    if (open) setStartsAtLocal(datetimeLocalValue(new Date(), timezone));
  }, [open, timezone]);
  useEffect(() => {
    if (!staffProfileId && staffOptions[0]) setStaffProfileId(staffOptions[0].id);
  }, [staffOptions, staffProfileId]);
  useEffect(() => {
    if (staffProfileId && !serviceOptions.some(item => item.serviceId === serviceId)) setServiceId(serviceOptions[0]?.serviceId ?? "");
  }, [serviceId, serviceOptions, staffProfileId]);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const startsAt = toUtc(startsAtLocal, timezone);
    if (!startsAt || !staffProfileId || !serviceId) { setError("აირჩიეთ სპეციალისტი, სერვისი და დრო."); return; }
    createWalkIn.mutate({ organizationId, locationId, staffProfileId, serviceId, startsAt, clientId: clientId === "NONE" ? undefined : clientId, internalNote: internalNote.trim() || undefined });
  };

  if (!enabled) return null;
  const duration = selectedOption ? (selectedOption.durationMinutes ?? selectedOption.defaultDurationMinutes) : null;
  const price = selectedOption ? (selectedOption.priceTetri ?? selectedOption.defaultPriceTetri) : null;
  return <Dialog open={open} onOpenChange={setOpen}><DialogTrigger asChild><Button type="button"><CalendarPlus2 className="mr-2 h-4 w-4" />შიდა ჩაწერა</Button></DialogTrigger><DialogContent className="max-h-[90vh] overflow-y-auto"><DialogHeader><DialogTitle>Walk-in ჩაწერა</DialogTitle><DialogDescription>არჩეული სერვისის ფასი და ხანგრძლივობა განისაზღვრება სერვერზე. დაკავებული დრო ვერ შეინახება.</DialogDescription></DialogHeader><form className="space-y-4" onSubmit={submit}><div className="space-y-2"><Label htmlFor="walkin-staff">სპეციალისტი</Label><Select value={staffProfileId} onValueChange={setStaffProfileId}><SelectTrigger id="walkin-staff"><SelectValue placeholder="აირჩიეთ სპეციალისტი" /></SelectTrigger><SelectContent>{staffOptions.map(item => <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>)}</SelectContent></Select></div><div className="space-y-2"><Label htmlFor="walkin-service">სერვისი</Label><Select value={serviceId} onValueChange={setServiceId}><SelectTrigger id="walkin-service"><SelectValue placeholder="აირჩიეთ სერვისი" /></SelectTrigger><SelectContent>{serviceOptions.map(item => <SelectItem key={item.serviceId} value={item.serviceId}>{item.serviceName}</SelectItem>)}</SelectContent></Select></div>{selectedOption ? <div className="flex flex-wrap gap-2"><Badge variant="outline" className="border-primary/25 bg-primary/5 text-primary">{formatGelTetri(price ?? 0)}</Badge><Badge variant="outline"><Clock3 className="mr-1 h-3.5 w-3.5" />{duration} წთ</Badge></div> : null}<div className="space-y-2"><Label htmlFor="walkin-client">კლიენტი <span className="text-muted-foreground">(არასავალდებულო)</span></Label><Select value={clientId} onValueChange={setClientId}><SelectTrigger id="walkin-client"><SelectValue placeholder="კლიენტი არ არის მითითებული" /></SelectTrigger><SelectContent><SelectItem value="NONE">კლიენტი არ არის მითითებული</SelectItem>{clients.data?.items.map(client => <SelectItem key={client.id} value={client.id}>{client.firstName} {client.lastName ?? ""}</SelectItem>)}</SelectContent></Select></div><div className="space-y-2"><Label htmlFor="walkin-start">დრო</Label><Input id="walkin-start" type="datetime-local" value={startsAtLocal} onChange={event => setStartsAtLocal(event.target.value)} required /></div><div className="space-y-2"><Label htmlFor="walkin-note">შიდა ჩანიშვნა <span className="text-muted-foreground">(არასავალდებულო)</span></Label><Textarea id="walkin-note" value={internalNote} onChange={event => setInternalNote(event.target.value)} maxLength={2000} /></div>{options.isLoading ? <p className="text-sm text-muted-foreground">ხელმისაწვდომი კომბინაციები იტვირთება…</p> : null}{!options.isLoading && !staffOptions.length ? <p className="rounded-lg border border-dashed p-3 text-sm text-muted-foreground">ამ ფილიალზე შიდა ჩაწერისთვის აქტიური სპეციალისტი–სერვისი ჯერ არ არის კონფიგურირებული.</p> : null}{error ? <p role="alert" className="rounded-lg border border-destructive/25 bg-destructive/5 p-3 text-sm text-destructive">{error}</p> : null}<DialogFooter><Button type="submit" disabled={createWalkIn.isPending || !selectedOption}>{createWalkIn.isPending ? "ინახება…" : "ჩაწერის შექმნა"}</Button></DialogFooter></form></DialogContent></Dialog>;
}

export function RescheduleAppointmentButton({ organizationId, appointmentId, startsAt, timezone, enabled, onSaved }: { organizationId: string; appointmentId: string; startsAt: Date; timezone: string; enabled: boolean; onSaved?: () => Promise<unknown> | void }) {
  const [open, setOpen] = useState(false);
  const [startsAtLocal, setStartsAtLocal] = useState(() => datetimeLocalValue(new Date(startsAt), timezone));
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const reschedule = trpc.appointments.reschedule.useMutation({ onSuccess: async () => { await onSaved?.(); toast.success("ჯავშნის დრო განახლდა."); setOpen(false); setError(""); }, onError: cause => setError(cause.message || "ჯავშნის გადატანა ვერ მოხერხდა.") });
  useEffect(() => { if (open) setStartsAtLocal(datetimeLocalValue(new Date(startsAt), timezone)); }, [open, startsAt, timezone]);
  if (!enabled) return null;
  const submit = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); const next = toUtc(startsAtLocal, timezone); if (!next) { setError("აირჩიეთ სწორი დრო."); return; } reschedule.mutate({ organizationId, appointmentId, startsAt: next, reason: reason.trim() || undefined }); };
  return <Dialog open={open} onOpenChange={setOpen}><DialogTrigger asChild><Button type="button" variant="outline" size="sm"><MoveRight className="mr-1.5 h-3.5 w-3.5" />გადატანა</Button></DialogTrigger><DialogContent><DialogHeader><DialogTitle>ჯავშნის გადატანა</DialogTitle><DialogDescription>ხანგრძლივობა შენარჩუნდება. ახალი დრო დამოწმდება სერვერზე დაზუსტებული კონფლიქტის შემოწმებით.</DialogDescription></DialogHeader><form className="space-y-4" onSubmit={submit}><div className="space-y-2"><Label htmlFor={`reschedule-${appointmentId}`}>ახალი დრო</Label><Input id={`reschedule-${appointmentId}`} type="datetime-local" value={startsAtLocal} onChange={event => setStartsAtLocal(event.target.value)} required /></div><div className="space-y-2"><Label htmlFor={`reschedule-reason-${appointmentId}`}>მიზეზი <span className="text-muted-foreground">(არასავალდებულო)</span></Label><Textarea id={`reschedule-reason-${appointmentId}`} value={reason} onChange={event => setReason(event.target.value)} maxLength={255} /></div>{error ? <p role="alert" className="rounded-lg border border-destructive/25 bg-destructive/5 p-3 text-sm text-destructive">{error}</p> : null}<DialogFooter><Button type="submit" disabled={reschedule.isPending}>{reschedule.isPending ? "მოწმდება…" : "ახალი დროის შენახვა"}</Button></DialogFooter></form></DialogContent></Dialog>;
}
