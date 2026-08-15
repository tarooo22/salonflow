import DashboardLayout from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { gelInputToTetri } from "@/lib/money";
import { trpc } from "@/lib/trpc";
import { Archive, Clock3, Layers3, Pencil, Plus, Sparkles } from "lucide-react";
import { FormEvent, useMemo, useState } from "react";
import { toast } from "sonner";
import { formatGelTetri } from "@/lib/presentation";
import { WorkspaceMetric, WorkspacePageHeader, WorkspaceSection, WorkspaceState, WorkspaceStatusPill } from "@/components/workspace/WorkspacePrimitives";

export default function Services() {
  const utils = trpc.useUtils();
  const organizations = trpc.organizations.listMine.useQuery();
  const organizationEntry = organizations.data?.[0];
  const organization = organizationEntry?.organization;
  const canManage = ["OWNER", "MANAGER"].includes(organizationEntry?.membership.role ?? "");
  const categories = trpc.services.listCategories.useQuery({ organizationId: organization?.id ?? "" }, { enabled: Boolean(organization?.id) });
  const services = trpc.services.list.useQuery({ organizationId: organization?.id ?? "" }, { enabled: Boolean(organization?.id) });
  const staff = trpc.staff.list.useQuery({ organizationId: organization?.id ?? "" }, { enabled: Boolean(organization?.id) && canManage });
  const [serviceOpen, setServiceOpen] = useState(false);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [categoryId, setCategoryId] = useState("");
  const [categoryName, setCategoryName] = useState("");
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editingCategoryName, setEditingCategoryName] = useState("");
  const [serviceName, setServiceName] = useState("");
  const [duration, setDuration] = useState("60");
  const [priceGel, setPriceGel] = useState("");
  const [formError, setFormError] = useState("");
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [editCategoryId, setEditCategoryId] = useState("");
  const [editName, setEditName] = useState("");
  const [editDuration, setEditDuration] = useState("60");
  const [editPriceGel, setEditPriceGel] = useState("");
  const [editError, setEditError] = useState("");
  const [eligibilityServiceId, setEligibilityServiceId] = useState<string | null>(null);
  const eligibilityInput = useMemo(() => ({ organizationId: organization?.id ?? "", serviceId: eligibilityServiceId ?? "service_eligibility_01" }), [eligibilityServiceId, organization?.id]);
  const eligibility = trpc.services.listStaffEligibility.useQuery(eligibilityInput, { enabled: Boolean(organization?.id && eligibilityServiceId && canManage) });
  const createCategory = trpc.services.createCategory.useMutation({
    onSuccess: async result => {
      await utils.services.listCategories.invalidate();
      setCategoryId(result.id);
      setCategoryName("");
      setCategoryOpen(false);
      setServiceOpen(true);
    },
  });
  const updateCategory = trpc.services.updateCategory.useMutation({
    onSuccess: async () => {
      await Promise.all([utils.services.listCategories.invalidate(), utils.services.list.invalidate()]);
      setEditingCategoryId(null);
      setEditingCategoryName("");
      toast.success("კატეგორია განახლდა.");
    },
    onError: () => toast.error("კატეგორიის განახლება ვერ მოხერხდა. სცადეთ ხელახლა."),
  });
  const createService = trpc.services.create.useMutation({
    onSuccess: async () => {
      await utils.services.list.invalidate();
      setServiceName("");
      setDuration("60");
      setPriceGel("");
      setFormError("");
      setServiceOpen(false);
    },
  });
  const updateService = trpc.services.update.useMutation({
    onSuccess: async () => {
      await utils.services.list.invalidate();
      setEditingServiceId(null);
      toast.success("სერვისის მონაცემები განახლდა.");
    },
    onError: () => setEditError("სერვისის განახლება ვერ მოხერხდა. შეამოწმეთ მონაცემები და სცადეთ ხელახლა."),
  });
  const archiveService = trpc.services.archive.useMutation({
    onSuccess: async () => {
      await utils.services.list.invalidate();
      toast.success("სერვისი არქივში გადავიდა. ისტორიული ჩანაწერები უცვლელი დარჩა.");
    },
    onError: () => toast.error("სერვისის არქივში გადატანა ვერ მოხერხდა. სცადეთ ხელახლა."),
  });
  const setStaffEligibility = trpc.services.setStaffEligibility.useMutation({
    onSuccess: async () => {
      await utils.services.listStaffEligibility.invalidate();
      toast.success("სპეციალისტის ხელმისაწვდომობა განახლდა.");
    },
    onError: () => toast.error("ხელმისაწვდომობის განახლება ვერ მოხერხდა. სცადეთ ხელახლა."),
  });

  const submitCategory = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!organization) return;
    createCategory.mutate({ organizationId: organization.id, nameKa: categoryName, sortOrder: categories.data?.length ?? 0 });
  };
  const submitService = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!organization || !categoryId) {
      setFormError("აირჩიეთ კატეგორია, სანამ სერვისს დაამატებთ.");
      return;
    }
    const priceTetri = gelInputToTetri(priceGel);
    const defaultDurationMinutes = Number(duration);
    if (priceTetri === null || priceTetri < 0 || !Number.isInteger(defaultDurationMinutes) || defaultDurationMinutes < 5 || defaultDurationMinutes > 720) {
      setFormError("მიუთითეთ ფასი ლარში ორი ათწილადის სიზუსტით და ხანგრძლივობა 5–720 წუთის დიაპაზონში.");
      return;
    }
    setFormError("");
    createService.mutate({
      organizationId: organization.id,
      categoryId,
      nameKa: serviceName,
      defaultDurationMinutes,
      bufferBeforeMinutes: 0,
      bufferAfterMinutes: 0,
      priceTetri,
      isFromPrice: false,
      onlineBookingEnabled: true,
      sortOrder: services.data?.length ?? 0,
    });
  };
  const submitEdit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!organization || !editingServiceId || !editCategoryId) return;
    const priceTetri = gelInputToTetri(editPriceGel);
    const defaultDurationMinutes = Number(editDuration);
    if (priceTetri === null || priceTetri < 0 || !Number.isInteger(defaultDurationMinutes) || defaultDurationMinutes < 5 || defaultDurationMinutes > 720) {
      setEditError("მიუთითეთ ფასი ლარში ორი ათწილადის სიზუსტით და ხანგრძლივობა 5–720 წუთის დიაპაზონში.");
      return;
    }
    setEditError("");
    updateService.mutate({ organizationId: organization.id, serviceId: editingServiceId, categoryId: editCategoryId, nameKa: editName, defaultDurationMinutes, priceTetri });
  };

  return (
    <DashboardLayout>
      <div className="sf-workspace-page mx-auto w-full max-w-7xl space-y-5">
        <WorkspacePageHeader eyebrow="კატალოგის მართვა" title="სერვისები" description="აქტიური კატეგორიები, ხანგრძლივობები, ფასები და სპეციალისტის ხელმისაწვდომობა." actions={<>{organization ? <WorkspaceStatusPill tone="info">{organization.name}</WorkspaceStatusPill> : null}{organization && canManage ? <Button onClick={() => { setFormError(""); setServiceOpen(true); }}><Plus className="mr-2 h-4 w-4" />სერვისის დამატება</Button> : null}</>} />
        {organizations.isLoading ? <WorkspaceState kind="loading" title="სერვისების სივრცე იტვირთება…" /> : null}
        {organizations.isError ? <WorkspaceState kind="error" title="სამუშაო სივრცის მონაცემები მიუწვდომელია" /> : null}
        {!organizations.isLoading && !organizations.isError && !organization ? <WorkspaceState kind="empty" title="ჯერ შექმენით სამუშაო სივრცე" /> : null}
        {organization ? <>
          <div className="grid gap-3 sm:grid-cols-3"><WorkspaceMetric icon={Sparkles} label="აქტიური სერვისები" value={services.isLoading ? "…" : String(services.data?.length ?? 0)} helper="ხელმისაწვდომი მომსახურებები" tone="jade" /><WorkspaceMetric icon={Layers3} label="კატეგორიები" value={categories.isLoading ? "…" : String(categories.data?.length ?? 0)} helper="კატალოგის ჯგუფები" tone="violet" /><WorkspaceMetric icon={Clock3} label="ონლაინ ხილული" value={services.isLoading ? "…" : String(services.data?.filter(item => item.service.onlineBookingEnabled).length ?? 0)} helper="საჯარო ჩაწერაში გამოჩენილი" tone="terracotta" /></div>
          <WorkspaceSection title="აქტიური კატალოგი" description="ფასი და ხანგრძლივობა ინახება სერვერზე integer tetri/minutes მნიშვნელობებით." action={canManage && categories.data?.length ? <Button variant="outline" size="sm" onClick={() => setCategoryOpen(true)}><Plus className="mr-1.5 h-4 w-4" />კატეგორია</Button> : null}><div className="divide-y divide-border/70">{services.isLoading ? <WorkspaceState kind="loading" title="სერვისები იტვირთება…" /> : null}{services.isError ? <WorkspaceState kind="error" title="სერვისების ჩატვირთვა ვერ მოხერხდა" /> : null}{!services.isLoading && !services.isError && services.data?.length === 0 ? <WorkspaceState kind="empty" title="პირველი სერვისი ჯერ არ არის" description="ისტორიული ჩანაწერები არქივირებისას დაცულად რჩება." action={canManage ? <Button variant="outline" size="sm" onClick={() => setServiceOpen(true)}><Plus className="mr-1.5 h-4 w-4" />პირველი სერვისის დამატება</Button> : null} /> : null}{services.data?.map(({ service, category }) => <article key={service.id} className="grid gap-3 py-3 lg:grid-cols-[minmax(0,1fr)_auto_auto] lg:items-center"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><p className="font-semibold">{service.nameKa}</p><WorkspaceStatusPill tone={service.onlineBookingEnabled ? "success" : "neutral"}>{service.onlineBookingEnabled ? "ონლაინ ხილული" : "შიდა"}</WorkspaceStatusPill></div><p className="mt-1 text-sm text-muted-foreground">{category.nameKa} · ბუფერი {service.bufferBeforeMinutes}/{service.bufferAfterMinutes} წთ</p></div><div className="flex gap-5 text-sm"><span><span className="block text-xs text-muted-foreground">ხანგრძლივობა</span><strong>{service.defaultDurationMinutes} წთ</strong></span><span><span className="block text-xs text-muted-foreground">ფასი</span><strong>{formatGelTetri(service.priceTetri)}</strong></span></div>{canManage ? <div className="flex flex-wrap gap-1 lg:justify-end"><Button variant="ghost" size="sm" onClick={() => { setEditingServiceId(service.id); setEditCategoryId(service.categoryId); setEditName(service.nameKa); setEditDuration(String(service.defaultDurationMinutes)); setEditPriceGel((service.priceTetri / 100).toFixed(2)); setEditError(""); }}><Pencil className="mr-1.5 h-3.5 w-3.5" />რედაქტირება</Button><Button variant="ghost" size="sm" onClick={() => setEligibilityServiceId(service.id)}>სპეციალისტები</Button><Button variant="ghost" size="sm" className="text-muted-foreground hover:text-destructive" disabled={archiveService.isPending} onClick={() => { if (window.confirm(`„${service.nameKa}“ არქივში გადაიტანოთ? ისტორიული ჯავშნები უცვლელი დარჩება.`)) archiveService.mutate({ organizationId: organization.id, serviceId: service.id }); }}><Archive className="mr-1.5 h-3.5 w-3.5" />არქივი</Button></div> : null}</article>)}</div></WorkspaceSection>
        </> : null}
      </div>

      <Dialog open={serviceOpen} onOpenChange={setServiceOpen}><DialogContent><DialogHeader><DialogTitle>სერვისის დამატება</DialogTitle><DialogDescription>ფასი უსაფრთხოდ გარდაიქმნება მთელ თეთრებში და არასოდეს ინახება ათწილადი თანხის სახით.</DialogDescription></DialogHeader><form onSubmit={submitService} className="space-y-4"><div className="space-y-2"><div className="flex items-center justify-between gap-3"><Label htmlFor="service-category">კატეგორია</Label><Button type="button" variant="link" size="sm" className="h-auto px-0" onClick={() => setCategoryOpen(true)}>ახალი კატეგორია</Button></div><Select value={categoryId} onValueChange={setCategoryId}><SelectTrigger id="service-category"><SelectValue placeholder="აირჩიეთ კატეგორია" /></SelectTrigger><SelectContent>{categories.data?.map(category => <SelectItem key={category.id} value={category.id}>{category.nameKa}</SelectItem>)}</SelectContent></Select></div><div className="space-y-2"><Label htmlFor="service-name">სერვისის სახელი</Label><Input id="service-name" value={serviceName} onChange={event => setServiceName(event.target.value)} placeholder="მაგ. თმის შეჭრა" minLength={2} maxLength={160} required /></div><div className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><Label htmlFor="service-duration">ხანგრძლივობა (წთ)</Label><Input id="service-duration" type="number" value={duration} onChange={event => setDuration(event.target.value)} min={5} max={720} step={5} required /></div><div className="space-y-2"><Label htmlFor="service-price">ფასი (₾)</Label><Input id="service-price" inputMode="decimal" value={priceGel} onChange={event => setPriceGel(event.target.value)} placeholder="50.00" required /></div></div>{formError ? <p className="text-sm text-destructive">{formError}</p> : null}{createService.error ? <p className="text-sm text-destructive">სერვისის დამატება ვერ მოხერხდა. შეამოწმეთ კატეგორია და სცადეთ ხელახლა.</p> : null}<DialogFooter><Button type="submit" disabled={createService.isPending}>{createService.isPending ? "ინახება…" : "სერვისის შენახვა"}</Button></DialogFooter></form></DialogContent></Dialog>
      <Dialog open={Boolean(editingServiceId)} onOpenChange={open => { if (!open) setEditingServiceId(null); }}><DialogContent><DialogHeader><DialogTitle>სერვისის რედაქტირება</DialogTitle><DialogDescription>ისტორიული ჯავშნების სერვისის სურათები უცვლელი დარჩება; შეიცვლება მხოლოდ აქტიური კატალოგი.</DialogDescription></DialogHeader><form onSubmit={submitEdit} className="space-y-4"><div className="space-y-2"><Label htmlFor="edit-service-category">კატეგორია</Label><Select value={editCategoryId} onValueChange={setEditCategoryId}><SelectTrigger id="edit-service-category"><SelectValue placeholder="აირჩიეთ კატეგორია" /></SelectTrigger><SelectContent>{categories.data?.map(category => <SelectItem key={category.id} value={category.id}>{category.nameKa}</SelectItem>)}</SelectContent></Select></div><div className="space-y-2"><Label htmlFor="edit-service-name">სერვისის სახელი</Label><Input id="edit-service-name" value={editName} onChange={event => setEditName(event.target.value)} minLength={2} maxLength={160} required /></div><div className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><Label htmlFor="edit-service-duration">ხანგრძლივობა (წთ)</Label><Input id="edit-service-duration" type="number" value={editDuration} onChange={event => setEditDuration(event.target.value)} min={5} max={720} step={5} required /></div><div className="space-y-2"><Label htmlFor="edit-service-price">ფასი (₾)</Label><Input id="edit-service-price" inputMode="decimal" value={editPriceGel} onChange={event => setEditPriceGel(event.target.value)} required /></div></div>{editError ? <p className="text-sm text-destructive">{editError}</p> : null}<DialogFooter><Button type="submit" disabled={updateService.isPending}>{updateService.isPending ? "ინახება…" : "ცვლილებების შენახვა"}</Button></DialogFooter></form></DialogContent></Dialog>
      <Dialog open={categoryOpen} onOpenChange={setCategoryOpen}><DialogContent><DialogHeader><DialogTitle>კატეგორიების მართვა</DialogTitle><DialogDescription>კატეგორიები ეხმარება გუნდს და კლიენტებს სწორად იპოვონ სერვისები.</DialogDescription></DialogHeader>{categories.data?.length ? <div className="space-y-2">{categories.data.map(category => <div key={category.id} className="flex items-center justify-between gap-3 rounded-xl border p-3 text-sm"><span className="font-medium">{category.nameKa}</span><Button variant="ghost" size="sm" onClick={() => { setEditingCategoryId(category.id); setEditingCategoryName(category.nameKa); }}>რედაქტირება</Button></div>)}</div> : null}<form onSubmit={submitCategory} className="space-y-4 border-t pt-4"><div className="space-y-2"><Label htmlFor="category-name">ახალი კატეგორიის სახელი</Label><Input id="category-name" value={categoryName} onChange={event => setCategoryName(event.target.value)} placeholder="მაგ. თმის მოვლა" minLength={2} maxLength={160} required /></div>{createCategory.error ? <p className="text-sm text-destructive">კატეგორიის დამატება ვერ მოხერხდა. სცადეთ ხელახლა.</p> : null}<DialogFooter><Button type="submit" disabled={createCategory.isPending}>{createCategory.isPending ? "ინახება…" : "კატეგორიის შენახვა"}</Button></DialogFooter></form>{editingCategoryId ? <form onSubmit={event => { event.preventDefault(); if (organization && editingCategoryName.trim()) updateCategory.mutate({ organizationId: organization.id, categoryId: editingCategoryId, nameKa: editingCategoryName.trim() }); }} className="space-y-4 border-t pt-4"><div className="space-y-2"><Label htmlFor="edit-category-name">კატეგორიის რედაქტირება</Label><Input id="edit-category-name" value={editingCategoryName} onChange={event => setEditingCategoryName(event.target.value)} minLength={2} maxLength={160} required /></div><DialogFooter><Button type="button" variant="outline" onClick={() => setEditingCategoryId(null)}>გაუქმება</Button><Button type="submit" disabled={updateCategory.isPending}>{updateCategory.isPending ? "ინახება…" : "ცვლილების შენახვა"}</Button></DialogFooter></form> : null}</DialogContent></Dialog>
      <Dialog open={Boolean(eligibilityServiceId)} onOpenChange={open => { if (!open) setEligibilityServiceId(null); }}><DialogContent><DialogHeader><DialogTitle>სერვისის სპეციალისტები</DialogTitle><DialogDescription>{services.data?.find(item => item.service.id === eligibilityServiceId)?.service.nameKa ?? "სერვისი"} გამოჩნდება ონლაინ ჩაწერაში მხოლოდ მონიშნული სპეციალისტებისთვის.</DialogDescription></DialogHeader><div className="space-y-3">{staff.isLoading || eligibility.isLoading ? <p className="text-sm text-muted-foreground">სპეციალისტები იტვირთება…</p> : null}{eligibility.isError ? <p className="text-sm text-destructive">ხელმისაწვდომობის მონაცემები ვერ ჩაიტვირთა.</p> : null}{!staff.isLoading && !staff.data?.length ? <p className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">ჯერ შექმენით მინიმუმ ერთი აქტიური სპეციალისტის პროფილი.</p> : null}{staff.data?.map(item => { const canPerform = Boolean(eligibility.data?.find(row => row.staffProfileId === item.profile.id)?.canPerform); return <label key={item.profile.id} className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border p-3 text-sm"><span><span className="block font-medium">{item.profile.publicDisplayName}</span><span className="mt-1 block text-xs text-muted-foreground">{item.profile.jobTitle || item.profile.specialty || "სპეციალისტი"}</span></span><input type="checkbox" checked={canPerform} disabled={setStaffEligibility.isPending || eligibility.isLoading} onChange={event => { if (organization && eligibilityServiceId) setStaffEligibility.mutate({ organizationId: organization.id, serviceId: eligibilityServiceId, staffProfileId: item.profile.id, canPerform: event.target.checked }); }} className="h-4 w-4 accent-primary" /></label>; })}</div><DialogFooter><Button variant="outline" onClick={() => setEligibilityServiceId(null)}>დახურვა</Button></DialogFooter></DialogContent></Dialog>
    </DashboardLayout>
  );
}
