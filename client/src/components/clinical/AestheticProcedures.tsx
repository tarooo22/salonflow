import { formatKaDateTime } from "@/lib/presentation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { WorkspaceState } from "@/components/workspace/WorkspacePrimitives";
import { DOSE_UNITS, type DoseUnit, formatDose, parseDoseToHundredths } from "@/lib/clinicalDose";
import { trpc } from "@/lib/trpc";
import { FormEvent, useState } from "react";
import { toast } from "sonner";

const NO_PRACTITIONER = "none";
const formatDateTime = (value: Date | string) => formatKaDateTime(new Date(value));
const emptyForm = { procedureName: "", productName: "", batchNumber: "", productExpiry: "", dose: "", doseUnit: "UNITS" as DoseUnit, staffProfileId: NO_PRACTITIONER, treatmentAreas: "", notes: "", performedAt: "" };

export function AestheticProcedures({ organizationId, clientId, appointmentId, ownProfileOnly = false }: { organizationId: string; clientId: string; appointmentId?: string; ownProfileOnly?: boolean }) {
  const utils = trpc.useUtils();
  const list = trpc.aesthetic.list.useQuery({ organizationId, clientId });
  const staff = trpc.staff.list.useQuery({ organizationId });
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState("");
  const [voidId, setVoidId] = useState<string | null>(null);
  const [voidReason, setVoidReason] = useState("");
  const set = <K extends keyof typeof emptyForm>(key: K, value: (typeof emptyForm)[K]) => setForm(current => ({ ...current, [key]: value }));

  const create = trpc.aesthetic.create.useMutation({
    onSuccess: async () => { await utils.aesthetic.list.invalidate({ organizationId, clientId }); setForm(emptyForm); setFormOpen(false); toast.success("პროცედურა დაემატა."); },
    onError: error => setFormError(error.message || "ჩანაწერის შენახვა ვერ მოხერხდა."),
  });
  const voidRecord = trpc.aesthetic.void.useMutation({
    onSuccess: async () => { await utils.aesthetic.list.invalidate({ organizationId, clientId }); setVoidId(null); setVoidReason(""); toast.success("ჩანაწერი გაუქმდა."); },
    onError: error => toast.error(error.message || "ჩანაწერის გაუქმება ვერ მოხერხდა."),
  });

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const hasDose = form.dose.trim() !== "";
    const hundredths = hasDose ? parseDoseToHundredths(form.dose) : null;
    if (hasDose && hundredths === null) { setFormError("დოზა უნდა იყოს დადებითი რიცხვი არაუმეტეს ორი ათწილადისა, მაგ. 12.5."); return; }
    setFormError("");
    create.mutate({
      organizationId, clientId, appointmentId,
      procedureName: form.procedureName,
      productName: form.productName || undefined,
      batchNumber: form.batchNumber || undefined,
      productExpiry: form.productExpiry || undefined,
      doseHundredths: hundredths ?? undefined,
      doseUnit: hundredths === null ? undefined : form.doseUnit,
      staffProfileId: ownProfileOnly || form.staffProfileId === NO_PRACTITIONER ? undefined : form.staffProfileId,
      treatmentAreas: form.treatmentAreas || undefined,
      notes: form.notes || undefined,
      performedAt: form.performedAt ? new Date(form.performedAt) : undefined,
    });
  };

  const staffName = (id: string | null) => staff.data?.find(item => item.profile.id === id)?.profile.publicDisplayName;

  return <div className="space-y-4">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <p className="text-sm text-muted-foreground">ჩანაწერები არ რედაქტირდება: შეცდომის შემთხვევაში გააუქმეთ ჩანაწერი და დაამატეთ ახალი.</p>
      <Button type="button" className="min-h-11" onClick={() => { setFormError(""); setFormOpen(true); }}>ახალი ჩანაწერი</Button>
    </div>
    {list.isLoading ? <WorkspaceState kind="loading" title="პროცედურები იტვირთება…" /> : null}
    {list.isError ? <WorkspaceState kind="error" title="პროცედურები ვერ ჩაიტვირთა" description={list.error.message} /> : null}
    {list.data && !list.data.length ? <WorkspaceState kind="empty" title="პროცედურები ჯერ არ არის" description="პირველი ჩანაწერის დასამატებლად დააჭირეთ „ახალი ჩანაწერი“." /> : null}
    <ul className="space-y-3">
      {list.data?.map(row => <li key={row.id} className="rounded-md border bg-card p-3 text-sm">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div><p className={`font-semibold ${row.isVoided ? "line-through text-muted-foreground" : ""}`}>{row.procedureName}</p><p className="text-xs text-muted-foreground">{formatDateTime(row.performedAt)}{staffName(row.staffProfileId) ? ` · ${staffName(row.staffProfileId)}` : ""}</p></div>
          {row.isVoided ? <Badge variant="outline">გაუქმებული</Badge> : <Button type="button" variant="outline" size="sm" className="min-h-11" onClick={() => { setVoidReason(""); setVoidId(row.id); }}>გაუქმება</Button>}
        </div>
        <dl className={`mt-3 grid gap-x-4 gap-y-1 sm:grid-cols-2 ${row.isVoided ? "line-through text-muted-foreground" : ""}`}>
          {row.productName ? <Detail label="პრეპარატი" value={row.productName} /> : null}
          {row.batchNumber ? <Detail label="სერია / ლოტი" value={row.batchNumber} /> : null}
          {row.productExpiry ? <Detail label="ვადა" value={String(row.productExpiry)} /> : null}
          {row.doseHundredths != null ? <Detail label="დოზა" value={formatDose(row.doseHundredths, row.doseUnit)} /> : null}
          {row.treatmentAreas ? <Detail label="უბნები" value={row.treatmentAreas} /> : null}
          {row.notes ? <Detail label="შენიშვნა" value={row.notes} /> : null}
        </dl>
        {row.isVoided ? <p className="mt-2 text-xs text-destructive">გაუქმების მიზეზი: {row.voidReason}</p> : null}
        {row.recordedByName ? <p className="mt-2 text-xs text-muted-foreground">დაამატა: {row.recordedByName}</p> : null}
      </li>)}
    </ul>

    <Dialog open={formOpen} onOpenChange={setFormOpen}><DialogContent className="max-h-[90vh] overflow-y-auto"><DialogHeader><DialogTitle>ახალი პროცედურა</DialogTitle><DialogDescription>ჩანაწერი შენახვის შემდეგ აღარ რედაქტირდება.</DialogDescription></DialogHeader>
      <form onSubmit={submit} className="grid gap-3">
        <Field id="proc-name" label="პროცედურა"><Input id="proc-name" value={form.procedureName} onChange={event => set("procedureName", event.target.value)} minLength={2} maxLength={160} required /></Field>
        <Field id="proc-product" label="პრეპარატი / პროდუქტი"><Input id="proc-product" value={form.productName} onChange={event => set("productName", event.target.value)} maxLength={160} /></Field>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field id="proc-batch" label="სერია / ლოტი"><Input id="proc-batch" value={form.batchNumber} onChange={event => set("batchNumber", event.target.value)} maxLength={80} /></Field>
          <Field id="proc-expiry" label="ვარგისიანობის ვადა"><Input id="proc-expiry" type="date" value={form.productExpiry} onChange={event => set("productExpiry", event.target.value)} /></Field>
          <Field id="proc-dose" label="დოზა"><Input id="proc-dose" inputMode="decimal" value={form.dose} onChange={event => set("dose", event.target.value)} placeholder="მაგ. 12.5" /></Field>
          <Field id="proc-unit" label="საზომი ერთეული"><Select value={form.doseUnit} onValueChange={value => set("doseUnit", value as DoseUnit)}><SelectTrigger id="proc-unit" className="min-h-11 w-full"><SelectValue /></SelectTrigger><SelectContent>{DOSE_UNITS.map(unit => <SelectItem key={unit.value} value={unit.value}>{unit.label}</SelectItem>)}</SelectContent></Select></Field>
        </div>
        {ownProfileOnly ? null : <Field id="proc-staff" label="შემსრულებელი"><Select value={form.staffProfileId} onValueChange={value => set("staffProfileId", value)}><SelectTrigger id="proc-staff" className="min-h-11 w-full"><SelectValue /></SelectTrigger><SelectContent><SelectItem value={NO_PRACTITIONER}>არ არის მითითებული</SelectItem>{staff.data?.map(item => <SelectItem key={item.profile.id} value={item.profile.id}>{item.profile.publicDisplayName}</SelectItem>)}</SelectContent></Select></Field>}
        <Field id="proc-areas" label="დამუშავებული უბნები"><Input id="proc-areas" value={form.treatmentAreas} onChange={event => set("treatmentAreas", event.target.value)} maxLength={500} /></Field>
        <Field id="proc-performed" label="შესრულების დრო (ცარიელი ნიშნავს ახლა)"><Input id="proc-performed" type="datetime-local" value={form.performedAt} onChange={event => set("performedAt", event.target.value)} /></Field>
        <Field id="proc-notes" label="შენიშვნა"><Textarea id="proc-notes" value={form.notes} onChange={event => set("notes", event.target.value)} maxLength={2000} rows={3} /></Field>
        {formError ? <p role="alert" className="text-sm text-destructive">{formError}</p> : null}
        <DialogFooter><Button type="button" variant="outline" className="min-h-11" onClick={() => setFormOpen(false)}>გაუქმება</Button><Button type="submit" className="min-h-11" disabled={create.isPending}>{create.isPending ? "ინახება…" : "შენახვა"}</Button></DialogFooter>
      </form></DialogContent></Dialog>

    <Dialog open={Boolean(voidId)} onOpenChange={open => { if (!open) setVoidId(null); }}><DialogContent><DialogHeader><DialogTitle>ჩანაწერის გაუქმება</DialogTitle><DialogDescription>ჩანაწერი არ წაიშლება: ის დარჩება გადახაზულად, მიზეზით. სწორი ინფორმაცია დაამატეთ ახალ ჩანაწერად.</DialogDescription></DialogHeader>
      <Field id="void-reason" label="გაუქმების მიზეზი"><Textarea id="void-reason" value={voidReason} onChange={event => setVoidReason(event.target.value)} minLength={3} maxLength={300} rows={3} required /></Field>
      <DialogFooter><Button type="button" variant="outline" className="min-h-11" onClick={() => setVoidId(null)}>დახურვა</Button><Button type="button" variant="destructive" className="min-h-11" disabled={voidReason.trim().length < 3 || voidRecord.isPending} onClick={() => voidId && voidRecord.mutate({ organizationId, id: voidId, reason: voidReason })}>{voidRecord.isPending ? "მიმდინარეობს…" : "ჩანაწერის გაუქმება"}</Button></DialogFooter></DialogContent></Dialog>
  </div>;
}

function Detail({ label, value }: { label: string; value: string }) { return <div className="flex gap-2"><dt className="text-muted-foreground">{label}:</dt><dd className="min-w-0 break-words">{value}</dd></div>; }
function Field({ id, label, children }: { id: string; label: string; children: React.ReactNode }) { return <div className="grid gap-1.5"><Label htmlFor={id}>{label}</Label>{children}</div>; }
