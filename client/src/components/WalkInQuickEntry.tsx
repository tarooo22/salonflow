import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  const create = trpc.appointments.createWalkIn.useMutation({ onSuccess: async () => { await Promise.all([utils.appointments.dashboard.invalidate(), utils.appointments.listRange.invalidate()]); setAssignment(""); setNote(""); onOpenChange(false); toast.success("Walk-in ჩაწერა დაემატა კალენდარში."); }, onError: error => toast.error(error.message || "Walk-in ჩაწერა ვერ დაემატა.") });
  const choices = useMemo(() => (options.data ?? []).map(item => ({ key: `${item.staffProfileId}:${item.serviceId}`, ...item })), [options.data]);
  const submit = (event: FormEvent) => { event.preventDefault(); const selected = choices.find(item => item.key === assignment); if (!selected || !startsAt) return; create.mutate({ organizationId, locationId, staffProfileId: selected.staffProfileId, serviceId: selected.serviceId, startsAt: new Date(startsAt), internalNote: note || undefined }); };
  return <Card className="border-[var(--sf-terracotta)]/25 bg-[color-mix(in_srgb,var(--sf-terracotta)_7%,var(--sf-surface))]"><CardContent className="p-4"><label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm font-semibold"><Checkbox checked={open} onCheckedChange={value => onOpenChange(value === true)} /><span className="inline-flex items-center gap-2"><UserPlus className="size-4 text-[var(--sf-terracotta-strong)]" />Walk-in ჩაწერა</span><span className="font-normal text-[var(--sf-muted)]">— სწრაფად დაამატეთ ადგილზე მოსული კლიენტი</span></label>{open ? <form onSubmit={submit} className="mt-4 grid gap-3 lg:grid-cols-[minmax(0,1fr)_14rem_minmax(0,1fr)_auto] lg:items-end"><label className="space-y-1.5 text-sm font-medium"><span>სპეციალისტი და სერვისი</span><Select value={assignment} onValueChange={setAssignment}><SelectTrigger><SelectValue placeholder={options.isLoading ? "იტვირთება…" : "აირჩიეთ წყვილი"} /></SelectTrigger><SelectContent>{choices.map(item => <SelectItem key={item.key} value={item.key}>{item.staffName} · {item.serviceName}</SelectItem>)}</SelectContent></Select></label><label className="space-y-1.5 text-sm font-medium"><span>დრო</span><Input type="datetime-local" value={startsAt} onChange={event => setStartsAt(event.target.value)} required /></label><label className="space-y-1.5 text-sm font-medium"><span>შიდა შენიშვნა <span className="font-normal text-[var(--sf-muted)]">(არასავალდებულო)</span></span><Input value={note} onChange={event => setNote(event.target.value)} maxLength={2000} placeholder="მაგ. ადგილზე მოვიდა" /></label><Button type="submit" disabled={!assignment || create.isPending || options.isLoading}><Clock3 className="size-4" />{create.isPending ? "ინახება…" : "Walk-in დამატება"}</Button></form> : null}</CardContent></Card>;
}
