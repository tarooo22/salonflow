import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { Clock3, UserPlus } from "lucide-react";
import { FormEvent, useMemo, useState } from "react";
import { toast } from "sonner";

export function WalkInQuickEntry({ organizationId, locationId, open, onOpenChange }: { organizationId: string; locationId: string; open: boolean; onOpenChange: (value: boolean) => void }) {
  const utils = trpc.useUtils();
  const options = trpc.appointments.walkInOptions.useQuery({ organizationId, locationId }, { enabled: open });
  const [assignment, setAssignment] = useState("");
  const [startsAt, setStartsAt] = useState(() => new Date().toISOString().slice(0, 16));
  const [note, setNote] = useState("");
  const create = trpc.appointments.createWalkIn.useMutation({ onSuccess: async () => { await Promise.all([utils.appointments.dashboard.invalidate(), utils.appointments.listRange.invalidate()]); setAssignment(""); setNote(""); onOpenChange(false); toast.success("ადგილზე მოსულის ჩაწერა დაემატა კალენდარში."); }, onError: error => toast.error(error.message || "ადგილზე მოსულის ჩაწერა ვერ დაემატა.") });
  const choices = useMemo(() => (options.data ?? []).map(item => ({ key: `${item.staffProfileId}:${item.serviceId}`, ...item })), [options.data]);
  const submit = (event: FormEvent) => { event.preventDefault(); const selected = choices.find(item => item.key === assignment); if (!selected || !startsAt) return; create.mutate({ organizationId, locationId, staffProfileId: selected.staffProfileId, serviceId: selected.serviceId, startsAt: new Date(startsAt), internalNote: note || undefined }); };
  return <section className="cwk-sheet" aria-label="ადგილზე მოსულის ჩაწერა">
    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-3">
      <p className="flex min-w-0 items-center gap-2 text-sm text-muted-foreground"><UserPlus className="size-4 shrink-0 text-primary" aria-hidden="true" /><span>სწრაფად დაამატეთ ადგილზე მოსული კლიენტი.</span></p>
      <Button type="button" variant="outline" aria-expanded={open} onClick={() => onOpenChange(!open)}>{open ? "დახურვა" : "ადგილზე მოსულის ჩაწერა"}</Button>
    </div>
    {open ? <form onSubmit={submit} className="grid gap-3 border-t border-border p-4 lg:grid-cols-[minmax(0,1fr)_14rem_minmax(0,1fr)_auto] lg:items-end"><label className="space-y-1.5 text-sm font-medium"><span>სპეციალისტი და სერვისი</span><Select value={assignment} onValueChange={setAssignment}><SelectTrigger><SelectValue placeholder={options.isLoading ? "იტვირთება…" : "აირჩიეთ წყვილი"} /></SelectTrigger><SelectContent>{choices.map(item => <SelectItem key={item.key} value={item.key}>{item.staffName} · {item.serviceName}</SelectItem>)}</SelectContent></Select></label><label className="space-y-1.5 text-sm font-medium"><span>დრო</span><Input type="datetime-local" value={startsAt} onChange={event => setStartsAt(event.target.value)} required /></label><label className="space-y-1.5 text-sm font-medium"><span>შიდა შენიშვნა</span><span className="block text-xs font-normal text-[var(--sf-muted)]">(არასავალდებულო)</span><Input value={note} onChange={event => setNote(event.target.value)} maxLength={2000} placeholder="მაგ. ადგილზე მოვიდა" /></label>{options.isError ? <p role="alert" className="text-sm text-destructive lg:col-span-4">სპეციალისტების სია ვერ ჩაიტვირთა. სცადეთ ხელახლა.</p> : null}<Button type="submit" disabled={!assignment || create.isPending || options.isLoading}><Clock3 className="size-4" aria-hidden="true" />{create.isPending ? "ინახება…" : "ჩაწერის დამატება"}</Button></form> : null}
  </section>;
}
