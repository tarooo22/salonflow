import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { WorkspacePageHeader, WorkspaceSection, WorkspaceState, WorkspaceStatusPill } from "@/components/workspace/WorkspacePrimitives";
import { buildVacancyInput, emptyVacancyForm, employmentTypeLabel, vacancyStatusInfo, type EmploymentType, type VacancyForm } from "@/lib/catalogPanel";
import { formatGelTetri, formatKaDateTime } from "@/lib/presentation";
import { trpc } from "@/lib/trpc";
import { DEFAULT_VACANCY_DAYS } from "@shared/validation";
import { Pencil, Plus, Send, Star, XCircle } from "lucide-react";
import { FormEvent, useState } from "react";
import { toast } from "sonner";

const NO_CATEGORY = "none";

function salaryText(from: number | null, to: number | null) {
  if (from == null && to == null) return "ანაზღაურება არ არის მითითებული";
  if (from != null && to != null) return `${formatGelTetri(from)} – ${formatGelTetri(to)}`;
  return from != null ? `${formatGelTetri(from)}-დან` : `${formatGelTetri(to as number)}-მდე`;
}

export default function PanelVacancies() {
  const utils = trpc.useUtils();
  const organizations = trpc.organizations.listMine.useQuery();
  const entry = organizations.data?.[0];
  const organization = entry?.organization;
  const canManage = ["OWNER", "MANAGER"].includes(entry?.membership.role ?? "");
  const enabled = Boolean(organization?.id && canManage);
  const organizationId = organization?.id ?? "";
  const vacancies = trpc.vacancies.list.useQuery({ organizationId, limit: 100, offset: 0 }, { enabled });
  const locations = trpc.organizations.listLocations.useQuery({ organizationId }, { enabled });
  const categories = trpc.marketplace.categories.useQuery(undefined, { enabled });
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<VacancyForm>(emptyVacancyForm);
  const [error, setError] = useState("");
  const set = <K extends keyof VacancyForm>(key: K, value: VacancyForm[K]) => setForm(current => ({ ...current, [key]: value }));

  const done = async (message: string) => { await utils.vacancies.list.invalidate(); toast.success(message); };
  const fail = (e: { message: string }) => toast.error(e.message || "ოპერაცია ვერ შესრულდა. სცადეთ ხელახლა.");
  const create = trpc.vacancies.create.useMutation({ onSuccess: async () => { await done("ვაკანსია მონახაზად შეინახა. გამოსაქვეყნებლად დააჭირეთ „გამოქვეყნებას“."); setOpen(false); }, onError: e => setError(e.message) });
  const update = trpc.vacancies.update.useMutation({ onSuccess: async () => { await done("ვაკანსია განახლდა."); setOpen(false); }, onError: e => setError(e.message) });
  const publish = trpc.vacancies.publish.useMutation({ onSuccess: () => done(`ვაკანსია გამოქვეყნდა ${DEFAULT_VACANCY_DAYS} დღით.`), onError: fail });
  const close = trpc.vacancies.close.useMutation({ onSuccess: () => done("ვაკანსია დაიხურა."), onError: fail });

  const openCreate = () => { setEditingId(null); setForm({ ...emptyVacancyForm, locationId: locations.data?.length === 1 ? locations.data[0].id : "" }); setError(""); setOpen(true); };
  const openEdit = (v: NonNullable<typeof vacancies.data>[number]) => {
    setEditingId(v.id);
    setForm({ locationId: v.locationId, title: v.title, roleCategory: v.roleCategory ?? "", employmentType: v.employmentType as EmploymentType, salaryFromGel: v.salaryFromTetri == null ? "" : (v.salaryFromTetri / 100).toFixed(2), salaryToGel: v.salaryToTetri == null ? "" : (v.salaryToTetri / 100).toFixed(2), description: v.description, contactPhone: v.contactPhone ?? "", contactEmail: v.contactEmail ?? "" });
    setError("");
    setOpen(true);
  };
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!organization) return;
    const parsed = buildVacancyInput(form);
    if (!parsed.ok) { setError(parsed.error); return; }
    setError("");
    if (editingId) update.mutate({ organizationId: organization.id, id: editingId, ...parsed.value });
    else create.mutate({ organizationId: organization.id, publish: false, durationDays: DEFAULT_VACANCY_DAYS, ...parsed.value });
  };
  const pending = create.isPending || update.isPending;

  return (
    <DashboardLayout>
      <div className="sf-workspace-page mx-auto w-full max-w-7xl space-y-5">
        <WorkspacePageHeader title="ვაკანსიები" description="განცხადებები სამუშაოს შესახებ, რომლებიც კატალოგში ჩანს." actions={<>{enabled ? <Button onClick={openCreate}><Plus className="mr-2 h-4 w-4" />ვაკანსიის დამატება</Button> : null}</>} />
        {organizations.isLoading ? <WorkspaceState kind="loading" title="იტვირთება…" /> : null}
        {organizations.isError ? <WorkspaceState kind="error" title="მონაცემები მიუწვდომელია" /> : null}
        {organization && !canManage ? <WorkspaceState kind="empty" title="წვდომა მხოლოდ მფლობელს და მენეჯერს აქვს" /> : null}
        {enabled ? <WorkspaceSection title="ჩემი ვაკანსიები">
          <div className="divide-y divide-border">
            {vacancies.isLoading ? <WorkspaceState kind="loading" title="იტვირთება…" /> : null}
            {vacancies.isError ? <WorkspaceState kind="error" title="ჩატვირთვა ვერ მოხერხდა" /> : null}
            {vacancies.data?.length === 0 ? <WorkspaceState kind="empty" title="ვაკანსია ჯერ არ გაქვთ" /> : null}
            {vacancies.data?.map(v => {
              const status = vacancyStatusInfo(v);
              return <article key={v.id} className="grid gap-3 py-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold">{v.title}</p>
                    <WorkspaceStatusPill tone={status.tone}>{status.label}</WorkspaceStatusPill>
                    {v.isVip ? <WorkspaceStatusPill tone="accent"><Star className="mr-1 inline h-3 w-3" />VIP</WorkspaceStatusPill> : null}
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{v.locationName} · {employmentTypeLabel[v.employmentType as EmploymentType]} · {salaryText(v.salaryFromTetri, v.salaryToTetri)}</p>
                  {v.status === "PUBLISHED" && v.expiresAt ? <p className="mt-1 text-xs text-muted-foreground">{v.isExpired ? "ვადა გაუვიდა" : "მოქმედებს"}: {formatKaDateTime(new Date(v.expiresAt))}</p> : null}
                </div>
                <div className="flex flex-wrap gap-1 lg:justify-end">
                  <Button variant="ghost" size="sm" onClick={() => openEdit(v)}><Pencil className="mr-1.5 h-3.5 w-3.5" />რედაქტირება</Button>
                  {v.status !== "PUBLISHED" || v.isExpired ? <Button variant="outline" size="sm" disabled={publish.isPending} onClick={() => publish.mutate({ organizationId, id: v.id, durationDays: DEFAULT_VACANCY_DAYS })}><Send className="mr-1.5 h-3.5 w-3.5" />{v.status === "DRAFT" ? "გამოქვეყნება" : "ხელახლა გამოქვეყნება"} ({DEFAULT_VACANCY_DAYS} დღე)</Button> : null}
                  {v.status === "PUBLISHED" && !v.isExpired ? <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-destructive" disabled={close.isPending} onClick={() => { if (window.confirm(`„${v.title}“ დაიხუროს? ვაკანსია კატალოგიდან გაქრება.`)) close.mutate({ organizationId, id: v.id }); }}><XCircle className="mr-1.5 h-3.5 w-3.5" />დახურვა</Button> : null}
                </div>
              </article>;
            })}
          </div>
        </WorkspaceSection> : null}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editingId ? "ვაკანსიის რედაქტირება" : "ვაკანსიის დამატება"}</DialogTitle><DialogDescription>ტელეფონი და ელფოსტა საჯაროდ გამოჩნდება გამოქვეყნების შემდეგ.</DialogDescription></DialogHeader>
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-2"><Label htmlFor="vac-title">პოზიცია</Label><Input id="vac-title" value={form.title} onChange={e => set("title", e.target.value)} placeholder="მაგ. თმის სტილისტი" minLength={3} maxLength={160} required /></div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2"><Label htmlFor="vac-location">ფილიალი</Label><Select value={form.locationId} onValueChange={v => set("locationId", v)}><SelectTrigger id="vac-location"><SelectValue placeholder="აირჩიეთ ფილიალი" /></SelectTrigger><SelectContent>{locations.data?.map(l => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-2"><Label htmlFor="vac-type">დასაქმების ტიპი</Label><Select value={form.employmentType} onValueChange={v => set("employmentType", v as EmploymentType)}><SelectTrigger id="vac-type"><SelectValue /></SelectTrigger><SelectContent>{(Object.keys(employmentTypeLabel) as EmploymentType[]).map(k => <SelectItem key={k} value={k}>{employmentTypeLabel[k]}</SelectItem>)}</SelectContent></Select></div>
            </div>
            <div className="space-y-2"><Label htmlFor="vac-category">კატეგორია (არასავალდებულო)</Label><Select value={form.roleCategory || NO_CATEGORY} onValueChange={v => set("roleCategory", v === NO_CATEGORY ? "" : v)}><SelectTrigger id="vac-category"><SelectValue /></SelectTrigger><SelectContent><SelectItem value={NO_CATEGORY}>კატეგორიის გარეშე</SelectItem>{categories.data?.map(c => <SelectItem key={c.id} value={c.slug}>{c.nameKa}</SelectItem>)}</SelectContent></Select></div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2"><Label htmlFor="vac-from">ანაზღაურება: დან (₾)</Label><Input id="vac-from" inputMode="decimal" value={form.salaryFromGel} onChange={e => set("salaryFromGel", e.target.value)} placeholder="1500" /></div>
              <div className="space-y-2"><Label htmlFor="vac-to">ანაზღაურება: მდე (₾)</Label><Input id="vac-to" inputMode="decimal" value={form.salaryToGel} onChange={e => set("salaryToGel", e.target.value)} placeholder="2500" /></div>
            </div>
            <div className="space-y-2"><Label htmlFor="vac-desc">აღწერა</Label><Textarea id="vac-desc" value={form.description} onChange={e => set("description", e.target.value)} rows={5} minLength={10} maxLength={4000} required /></div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2"><Label htmlFor="vac-phone">საკონტაქტო ტელეფონი</Label><Input id="vac-phone" type="tel" value={form.contactPhone} onChange={e => set("contactPhone", e.target.value)} placeholder="+995 5XX XX XX XX" maxLength={32} /></div>
              <div className="space-y-2"><Label htmlFor="vac-email">საკონტაქტო ელფოსტა</Label><Input id="vac-email" type="email" value={form.contactEmail} onChange={e => set("contactEmail", e.target.value)} maxLength={320} /></div>
            </div>
            {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}
            <DialogFooter><Button type="submit" disabled={pending}>{pending ? "ინახება…" : "შენახვა"}</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
