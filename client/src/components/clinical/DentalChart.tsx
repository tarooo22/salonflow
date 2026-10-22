import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { WorkspaceState } from "@/components/workspace/WorkspacePrimitives";
import { conditionLabel, DENTAL_CONDITIONS, type DentalCondition, TOOTH_LAYOUT, TOOTH_SURFACE_OPTIONS, toothAriaLabel } from "@/lib/dentalChart";
import { trpc } from "@/lib/trpc";
import { FormEvent, useState } from "react";
import { toast } from "sonner";

const conditionStyle = (value: string | undefined) => DENTAL_CONDITIONS.find(item => item.value === value);
const formatDate = (value: Date | string) => new Intl.DateTimeFormat("ka-GE", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(value));

export function DentalChart({ organizationId, clientId, appointmentId }: { organizationId: string; clientId: string; appointmentId?: string }) {
  const [primary, setPrimary] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const chart = trpc.dental.chart.useQuery({ organizationId, clientId });
  const byTooth = new Map((chart.data ?? []).map(row => [row.toothCode, row]));
  const layout = TOOTH_LAYOUT[primary ? "primary" : "permanent"];

  const renderArch = (title: string, halves: readonly (readonly string[])[]) => (
    <div role="group" aria-label={title} className="flex items-center gap-2">
      {halves.map((half, index) => (
        <div key={index} className={`flex gap-1 ${index === 0 ? "border-r pr-2" : ""}`}>
          {half.map(code => {
            const record = byTooth.get(code);
            const style = conditionStyle(record?.condition);
            return (
              <button
                key={code}
                type="button"
                onClick={() => setSelected(code)}
                aria-label={toothAriaLabel(code, record?.condition)}
                aria-pressed={selected === code}
                title={toothAriaLabel(code, record?.condition)}
                style={style ? { backgroundColor: style.color, color: style.ink } : undefined}
                className={`flex min-h-11 min-w-11 flex-col items-center justify-center rounded-lg border text-xs font-semibold leading-tight focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${selected === code ? "ring-2 ring-primary" : ""} ${style ? "" : "bg-background text-muted-foreground"}`}
              >
                <span>{code}</span>
                {record?.surfaces ? <span className="text-[10px] font-normal">{record.surfaces}</span> : null}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );

  return <div className="space-y-4">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <p className="text-sm text-muted-foreground">აირჩიეთ კბილი ისტორიის სანახავად და ახალი ჩანაწერის დასამატებლად.</p>
      <Button type="button" variant="outline" size="sm" className="min-h-11" aria-pressed={primary} onClick={() => { setPrimary(value => !value); setSelected(null); }}>{primary ? "მუდმივი კბილები" : "რძის კბილები"}</Button>
    </div>
    {chart.isLoading ? <WorkspaceState kind="loading" title="კბილების ფორმულა იტვირთება…" /> : null}
    {chart.isError ? <WorkspaceState kind="error" title="კბილების ფორმულა ვერ ჩაიტვირთა" description={chart.error.message} /> : null}
    {chart.data ? <>
      <div className="overflow-x-auto rounded-xl border bg-card p-3" tabIndex={0} aria-label="კბილების ფორმულა">
        <div className="mx-auto flex w-max flex-col gap-3">
          <p className="text-center text-[11px] font-medium text-muted-foreground">მარჯვენა · ზედა ყბა · მარცხენა</p>
          {renderArch("ზედა ყბა", layout.upper)}
          {renderArch("ქვედა ყბა", layout.lower)}
          <p className="text-center text-[11px] font-medium text-muted-foreground">მარჯვენა · ქვედა ყბა · მარცხენა</p>
        </div>
      </div>
      <ul className="flex flex-wrap gap-2 text-xs" aria-label="ლეგენდა">
        {DENTAL_CONDITIONS.map(item => <li key={item.value} className="flex items-center gap-1.5 rounded-full border px-2 py-1"><span aria-hidden className="size-3 rounded-sm border" style={{ backgroundColor: item.color }} />{item.label}</li>)}
        <li className="flex items-center gap-1.5 rounded-full border px-2 py-1"><span aria-hidden className="size-3 rounded-sm border bg-background" />ჩანაწერი არ არის</li>
      </ul>
    </> : null}
    {selected ? <ToothPanel key={`${selected}`} organizationId={organizationId} clientId={clientId} appointmentId={appointmentId} toothCode={selected} onClose={() => setSelected(null)} /> : null}
  </div>;
}

function ToothPanel({ organizationId, clientId, appointmentId, toothCode, onClose }: { organizationId: string; clientId: string; appointmentId?: string; toothCode: string; onClose: () => void }) {
  const utils = trpc.useUtils();
  const history = trpc.dental.toothHistory.useQuery({ organizationId, clientId, toothCode });
  const [condition, setCondition] = useState<DentalCondition>("HEALTHY");
  const [surfaces, setSurfaces] = useState<string[]>([]);
  const [note, setNote] = useState("");
  const record = trpc.dental.record.useMutation({
    onSuccess: async () => {
      await Promise.all([utils.dental.chart.invalidate({ organizationId, clientId }), utils.dental.toothHistory.invalidate({ organizationId, clientId, toothCode })]);
      setSurfaces([]); setNote("");
      toast.success(`კბილი ${toothCode}: ჩანაწერი დაემატა.`);
    },
    onError: error => toast.error(error.message || "ჩანაწერის შენახვა ვერ მოხერხდა."),
  });
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    record.mutate({ organizationId, clientId, appointmentId, toothCode, condition, surfaces: surfaces.length ? TOOTH_SURFACE_OPTIONS.filter(item => surfaces.includes(item.value)).map(item => item.value).join("") : undefined, note: note.trim() || undefined });
  };

  return <section className="space-y-4 rounded-xl border bg-muted/15 p-4" aria-label={`კბილი ${toothCode}`}>
    <div className="flex items-center justify-between gap-2"><h3 className="text-base font-semibold">კბილი {toothCode}</h3><Button type="button" variant="ghost" size="sm" className="min-h-11" onClick={onClose}>დახურვა</Button></div>
    <form onSubmit={submit} className="space-y-3">
      <div className="grid gap-1.5"><Label htmlFor="tooth-condition">მდგომარეობა</Label>
        <Select value={condition} onValueChange={value => setCondition(value as DentalCondition)}><SelectTrigger id="tooth-condition" className="min-h-11 w-full"><SelectValue /></SelectTrigger><SelectContent>{DENTAL_CONDITIONS.map(item => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}</SelectContent></Select></div>
      <fieldset className="grid gap-1.5"><legend className="text-sm font-medium">ზედაპირები <span className="font-normal text-muted-foreground">(არასავალდებულო)</span></legend>
        <div className="flex flex-wrap gap-2">{TOOTH_SURFACE_OPTIONS.map(item => <label key={item.value} title={item.hint} className="flex min-h-11 min-w-11 cursor-pointer items-center justify-center gap-2 rounded-lg border bg-background px-3 text-sm font-medium has-[:checked]:border-primary has-[:checked]:bg-primary/10"><input type="checkbox" className="size-4" checked={surfaces.includes(item.value)} onChange={event => setSurfaces(current => event.target.checked ? [...current, item.value] : current.filter(value => value !== item.value))} aria-label={item.hint} />{item.value}</label>)}</div>
        <p className="text-xs text-muted-foreground">M მეზიალური · O ოკლუზიური · D დისტალური · B ბუკალური · L ლინგვალური</p></fieldset>
      <div className="grid gap-1.5"><Label htmlFor="tooth-note">შენიშვნა <span className="font-normal text-muted-foreground">(არასავალდებულო)</span></Label><Textarea id="tooth-note" value={note} onChange={event => setNote(event.target.value)} maxLength={1000} rows={3} /></div>
      <p className="text-xs text-muted-foreground">ჩანაწერები არასოდეს რედაქტირდება. შეცდომის გასასწორებლად დაამატეთ ახალი ჩანაწერი: ბოლო ჩანაწერი ითვლება მიმდინარე მდგომარეობად.</p>
      <Button type="submit" className="min-h-11" disabled={record.isPending}>{record.isPending ? "ინახება…" : "ჩანაწერის დამატება"}</Button>
    </form>
    <div className="space-y-2"><h4 className="text-sm font-semibold">ისტორია</h4>
      {history.isLoading ? <p className="text-sm text-muted-foreground">ისტორია იტვირთება…</p> : null}
      {history.isError ? <p className="text-sm text-destructive">{history.error.message}</p> : null}
      {history.data && !history.data.length ? <p className="text-sm text-muted-foreground">ამ კბილზე ჩანაწერები ჯერ არ არის.</p> : null}
      <ul className="space-y-2">{history.data?.map(row => <li key={row.id} className="rounded-lg border bg-background p-3 text-sm"><p className="font-medium">{conditionLabel(row.condition)}{row.surfaces ? ` · ${row.surfaces}` : ""}</p>{row.note ? <p className="mt-1 whitespace-pre-wrap text-muted-foreground">{row.note}</p> : null}<p className="mt-1 text-xs text-muted-foreground">{formatDate(row.recordedAt)}{row.recordedByName ? ` · ${row.recordedByName}` : ""}</p></li>)}</ul>
    </div>
  </section>;
}
