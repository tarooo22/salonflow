import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FilePicker } from "@/components/ui/file-picker";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { WorkspacePageHeader, WorkspaceSection, WorkspaceState, WorkspaceStatusPill } from "@/components/workspace/WorkspacePrimitives";
import { fileToImageDataUrl } from "@/lib/imageUpload";
import { gelInputToTetri } from "@/lib/money";
import { formatGelTetri } from "@/lib/presentation";
import { trpc } from "@/lib/trpc";
import { Archive, ImagePlus, Pencil, Plus, RotateCcw } from "lucide-react";
import { FormEvent, useState } from "react";
import { toast } from "sonner";

type ProductForm = { locationId: string; name: string; brand: string; description: string; priceGel: string; inStock: boolean; sortOrder: number; imageDataUrl: string; imageAltKa: string; removeImage: boolean };
const emptyForm: ProductForm = { locationId: "", name: "", brand: "", description: "", priceGel: "", inStock: true, sortOrder: 0, imageDataUrl: "", imageAltKa: "", removeImage: false };

export default function PanelProducts() {
  const utils = trpc.useUtils();
  const organizations = trpc.organizations.listMine.useQuery();
  const entry = organizations.data?.[0];
  const organization = entry?.organization;
  const canManage = ["OWNER", "MANAGER"].includes(entry?.membership.role ?? "");
  const enabled = Boolean(organization?.id && canManage);
  const organizationId = organization?.id ?? "";
  const products = trpc.products.list.useQuery({ organizationId, includeArchived: true }, { enabled });
  const locations = trpc.organizations.listLocations.useQuery({ organizationId }, { enabled });
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<NonNullable<typeof products.data>[number] | null>(null);
  const [form, setForm] = useState<ProductForm>(emptyForm);
  const [error, setError] = useState("");
  const set = <K extends keyof ProductForm>(key: K, value: ProductForm[K]) => setForm(current => ({ ...current, [key]: value }));

  const onError = (e: { message: string }) => toast.error(e.message || "ოპერაცია ვერ შესრულდა. სცადეთ ხელახლა.");
  const done = async (message: string) => { await utils.products.list.invalidate(); toast.success(message); };
  const create = trpc.products.create.useMutation({ onSuccess: async () => { await done("პროდუქტი დაემატა."); setOpen(false); }, onError: e => setError(e.message) });
  const update = trpc.products.update.useMutation({ onSuccess: async () => { await done("პროდუქტი განახლდა."); setOpen(false); }, onError: e => setError(e.message) });
  const toggle = trpc.products.update.useMutation({ onSuccess: () => done("პროდუქტი განახლდა."), onError });

  const openCreate = () => { setEditing(null); setForm({ ...emptyForm, locationId: locations.data?.length === 1 ? locations.data[0].id : "", sortOrder: products.data?.length ?? 0 }); setError(""); setOpen(true); };
  const openEdit = (p: NonNullable<typeof products.data>[number]) => {
    setEditing(p);
    setForm({ locationId: p.locationId, name: p.name, brand: p.brand ?? "", description: p.description ?? "", priceGel: (p.priceTetri / 100).toFixed(2), inStock: p.inStock, sortOrder: p.sortOrder, imageDataUrl: "", imageAltKa: p.imageAltKa ?? "", removeImage: false });
    setError("");
    setOpen(true);
  };
  const chooseFile = async (file: File | undefined) => {
    if (!file) return;
    try { set("imageDataUrl", await fileToImageDataUrl(file)); setError(""); } catch (e) { setError(e instanceof Error ? e.message : "ფოტოს წაკითხვა ვერ მოხერხდა."); }
  };
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!organization) return;
    const priceTetri = gelInputToTetri(form.priceGel);
    if (priceTetri === null) { setError("მიუთითეთ ფასი ლარში, მაგ. 25.50."); return; }
    if (!form.locationId) { setError("აირჩიეთ ფილიალი."); return; }
    if (form.imageDataUrl && !form.imageAltKa.trim()) { setError("ფოტოს მოკლე აღწერა აუცილებელია."); return; }
    setError("");
    const base = { organizationId: organization.id, locationId: form.locationId, name: form.name.trim(), brand: form.brand.trim() || null, description: form.description.trim() || null, priceTetri, inStock: form.inStock, sortOrder: form.sortOrder };
    const image = form.imageDataUrl ? { imageDataUrl: form.imageDataUrl, imageAltKa: form.imageAltKa.trim() } : {};
    if (editing) update.mutate({ ...base, id: editing.id, ...image, removeImage: form.removeImage && !form.imageDataUrl });
    else create.mutate({ ...base, ...image });
  };
  const pending = create.isPending || update.isPending;
  const preview = form.imageDataUrl || (editing?.imageUrl && !form.removeImage ? editing.imageUrl : "");

  return (
    <DashboardLayout>
      <div className="sf-workspace-page mx-auto w-full max-w-7xl space-y-5">
        <WorkspacePageHeader title="პროდუქტები" description="პროდუქტები, რომლებსაც სალონში ან კატალოგში ყიდით." actions={<>{enabled ? <Button onClick={openCreate}><Plus className="mr-2 h-4 w-4" />პროდუქტის დამატება</Button> : null}</>} />
        {organizations.isLoading ? <WorkspaceState kind="loading" title="იტვირთება…" /> : null}
        {organizations.isError ? <WorkspaceState kind="error" title="მონაცემები მიუწვდომელია" /> : null}
        {organization && !canManage ? <WorkspaceState kind="empty" title="წვდომა მხოლოდ მფლობელს და მენეჯერს აქვს" /> : null}
        {enabled ? <WorkspaceSection title="ჩემი პროდუქტები">
          <div className="divide-y divide-border">
            {products.isLoading ? <WorkspaceState kind="loading" title="იტვირთება…" /> : null}
            {products.isError ? <WorkspaceState kind="error" title="ჩატვირთვა ვერ მოხერხდა" /> : null}
            {products.data?.length === 0 ? <WorkspaceState kind="empty" title="პროდუქტი ჯერ არ გაქვთ" action={<Button variant="outline" size="sm" onClick={openCreate}><Plus className="mr-1.5 h-4 w-4" />პროდუქტის დამატება</Button>} /> : null}
            {products.data?.map(p => {
              const archived = p.status === "ARCHIVED";
              return <article key={p.id} className="grid gap-3 py-3 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center">
                {p.imageUrl ? <img src={p.imageUrl} alt={p.imageAltKa ?? p.name} className="h-14 w-14 rounded-md border object-cover" /> : <span className="grid h-14 w-14 place-items-center rounded-md border bg-muted text-muted-foreground" aria-hidden="true"><ImagePlus className="h-5 w-5" /></span>}
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2"><p className="font-semibold">{p.name}</p>{archived ? <WorkspaceStatusPill>არქივში</WorkspaceStatusPill> : null}</div>
                  <p className="mt-1 text-sm text-muted-foreground">{[p.brand, p.locationName].filter(Boolean).join(" · ")} · <strong className="font-mono text-foreground">{formatGelTetri(p.priceTetri)}</strong></p>
                </div>
                <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                  <label className="flex items-center gap-2 text-sm"><Switch checked={p.inStock} disabled={archived || toggle.isPending} aria-label={`${p.name}: მარაგშია`} onCheckedChange={checked => toggle.mutate({ organizationId, id: p.id, inStock: checked })} />{p.inStock ? "მარაგშია" : "არ არის მარაგში"}</label>
                  <Button variant="ghost" size="sm" onClick={() => openEdit(p)}><Pencil className="mr-1.5 h-3.5 w-3.5" />რედაქტირება</Button>
                  {archived
                    ? <Button variant="outline" size="sm" disabled={toggle.isPending} onClick={() => toggle.mutate({ organizationId, id: p.id, status: "ACTIVE" })}><RotateCcw className="mr-1.5 h-3.5 w-3.5" />აღდგენა</Button>
                    : <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-destructive" disabled={toggle.isPending} onClick={() => { if (window.confirm(`„${p.name}“ არქივში გადაიტანოთ? საჯარო კატალოგიდან გაქრება.`)) toggle.mutate({ organizationId, id: p.id, status: "ARCHIVED" }); }}><Archive className="mr-1.5 h-3.5 w-3.5" />არქივი</Button>}
                </div>
              </article>;
            })}
          </div>
        </WorkspaceSection> : null}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? "პროდუქტის რედაქტირება" : "პროდუქტის დამატება"}</DialogTitle></DialogHeader>
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-2"><Label htmlFor="prod-name">დასახელება</Label><Input id="prod-name" value={form.name} onChange={e => set("name", e.target.value)} minLength={2} maxLength={160} required /></div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2"><Label htmlFor="prod-brand">ბრენდი (არასავალდებულო)</Label><Input id="prod-brand" value={form.brand} onChange={e => set("brand", e.target.value)} maxLength={120} /></div>
              <div className="space-y-2"><Label htmlFor="prod-price">ფასი (₾)</Label><Input id="prod-price" inputMode="decimal" value={form.priceGel} onChange={e => set("priceGel", e.target.value)} placeholder="25.00" required /></div>
            </div>
            <div className="space-y-2"><Label htmlFor="prod-location">ფილიალი</Label><Select value={form.locationId} onValueChange={v => set("locationId", v)}><SelectTrigger id="prod-location"><SelectValue placeholder="აირჩიეთ ფილიალი" /></SelectTrigger><SelectContent>{locations.data?.map(l => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-2"><Label htmlFor="prod-desc">აღწერა (არასავალდებულო)</Label><Textarea id="prod-desc" value={form.description} onChange={e => set("description", e.target.value)} rows={3} maxLength={600} /></div>
            <label className="flex items-center justify-between gap-3 rounded-md border p-3 text-sm"><span className="font-medium">მარაგშია</span><Switch checked={form.inStock} onCheckedChange={v => set("inStock", v)} /></label>
            <div className="space-y-2 rounded-md border p-3">
              <Label htmlFor="prod-image">ფოტო (არასავალდებულო, JPEG/PNG/WebP, 5 MB-მდე)</Label>
              {preview ? <img src={preview} alt="არჩეული ფოტოს გადახედვა" className="h-24 w-24 rounded-md border object-cover" /> : null}
              <FilePicker id="prod-image" accept="image/jpeg,image/png,image/webp" onChange={file => { void chooseFile(file ?? undefined); }} />
              {form.imageDataUrl || (editing?.imageUrl && !form.removeImage) ? <div className="space-y-2"><Label htmlFor="prod-alt">ფოტოს მოკლე აღწერა</Label><Input id="prod-alt" value={form.imageAltKa} onChange={e => set("imageAltKa", e.target.value)} placeholder="მაგ. შამპუნის ცისფერი ბოთლი" maxLength={160} /></div> : null}
              {editing?.imageUrl && !form.imageDataUrl ? <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.removeImage} onChange={e => set("removeImage", e.target.checked)} className="h-4 w-4 accent-primary" />ამჟამინდელი ფოტოს წაშლა</label> : null}
            </div>
            {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}
            <DialogFooter><Button type="submit" disabled={pending}>{pending ? "ინახება…" : "შენახვა"}</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
