import DashboardLayout from "@/components/DashboardLayout";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { gelInputToTetri } from "@/lib/money";
import { trpc } from "@/lib/trpc";
import { MoreHorizontal, Pencil, Plus } from "lucide-react";
import { FormEvent, useMemo, useState } from "react";
import { toast } from "sonner";
import { formatGelTetri } from "@/lib/presentation";
import { WorkspacePageHeader, WorkspaceRevealItem, WorkspaceRevealScope, WorkspaceSection, WorkspaceState, WorkspaceStatusPill } from "@/components/workspace/WorkspacePrimitives";

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
    onError: () => setEditError("განახლება ვერ მოხერხდა. შეამოწმეთ მონაცემები."),
  });
  const archiveService = trpc.services.archive.useMutation({
    onSuccess: async () => {
      await utils.services.list.invalidate();
      toast.success("სერვისი არქივშია.");
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
      setFormError("ფასი — ლარში, ხანგრძლივობა — 5–720 წუთი.");
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
      setEditError("ფასი — ლარში, ხანგრძლივობა — 5–720 წუთი.");
      return;
    }
    setEditError("");
    updateService.mutate({ organizationId: organization.id, serviceId: editingServiceId, categoryId: editCategoryId, nameKa: editName, defaultDurationMinutes, priceTetri });
  };

  const openEdit = (service: NonNullable<typeof services.data>[number]["service"]) => { setEditingServiceId(service.id); setEditCategoryId(service.categoryId); setEditName(service.nameKa); setEditDuration(String(service.defaultDurationMinutes)); setEditPriceGel((service.priceTetri / 100).toFixed(2)); setEditError(""); };
  const serviceMenu = (service: NonNullable<typeof services.data>[number]["service"]) => <DropdownMenu><DropdownMenuTrigger asChild><Button type="button" variant="ghost" size="icon" aria-label={`${service.nameKa}: მეტი მოქმედება`}><MoreHorizontal className="size-4" aria-hidden="true" /></Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem onSelect={() => setEligibilityServiceId(service.id)}>სპეციალისტები</DropdownMenuItem><DropdownMenuItem variant="destructive" disabled={archiveService.isPending} onSelect={() => { if (organization && window.confirm(`„${service.nameKa}“ არქივში გადაიტანოთ? ისტორიული ჯავშნები უცვლელი დარჩება.`)) archiveService.mutate({ organizationId: organization.id, serviceId: service.id }); }}>არქივში გადატანა</DropdownMenuItem></DropdownMenuContent></DropdownMenu>;

  return (
    <DashboardLayout>
      <div className="sf-workspace-page mx-auto w-full max-w-7xl space-y-5">
        <WorkspacePageHeader title="სერვისები" actions={<>{organization && canManage ? <Button onClick={() => { setFormError(""); setServiceOpen(true); }}><Plus className="mr-2 h-4 w-4" aria-hidden="true" />სერვისის დამატება</Button> : null}</>} />
        {organizations.isLoading ? <WorkspaceState kind="loading" title="იტვირთება…" /> : null}
        {organizations.isError ? <WorkspaceState kind="error" title="მონაცემები მიუწვდომელია" /> : null}
        {!organizations.isLoading && !organizations.isError && !organization ? <WorkspaceState kind="empty" title="ჯერ შექმენით სამუშაო სივრცე" /> : null}
        {organization ? <>
          <WorkspaceSection title="აქტიური სერვისები" description={services.isLoading || categories.isLoading ? undefined : `${services.data?.length ?? 0} სერვისი · ${categories.data?.length ?? 0} კატეგორია`} action={canManage && categories.data?.length ? <Button variant="outline" size="sm" className="max-md:h-11" onClick={() => setCategoryOpen(true)}><Plus className="mr-1.5 h-4 w-4" aria-hidden="true" />კატეგორია</Button> : null}><div className="-m-4 overflow-hidden rounded-b-[12px]">
            {services.isLoading ? <div className="p-4"><WorkspaceState kind="loading" title="იტვირთება…" /></div> : null}
            {services.isError ? <div className="p-4"><WorkspaceState kind="error" title="ჩატვირთვა ვერ მოხერხდა" description="შეამოწმეთ კავშირი და სცადეთ ხელახლა." action={<Button variant="outline" onClick={() => { void services.refetch(); }}>თავიდან ცდა</Button>} /></div> : null}
            {!services.isLoading && !services.isError && services.data?.length === 0 ? <div className="p-4"><WorkspaceState kind="empty" title="სერვისი ჯერ არ არის" action={canManage ? <Button variant="outline" onClick={() => setServiceOpen(true)}><Plus className="mr-1.5 h-4 w-4" aria-hidden="true" />სერვისის დამატება</Button> : null} /></div> : null}
            {services.data?.length ? <>
              <div className="hidden overflow-x-auto md:block"><table className="w-full text-left text-sm"><thead className="bg-[var(--sf-surface-2)] text-[13px] text-muted-foreground"><tr className="h-10"><th scope="col" className="px-4 font-semibold">სერვისი</th><th scope="col" className="px-4 font-semibold">კატეგორია</th><th scope="col" className="px-4 font-semibold">ხანგრძლივობა</th><th scope="col" className="px-4 text-right font-semibold">ფასი</th>{canManage ? <th scope="col" className="px-4 text-right font-semibold"><span className="sr-only">მოქმედება</span></th> : null}</tr></thead><tbody className="divide-y divide-border">{services.data.map(({ service, category }) => <tr key={service.id} className={canManage ? "h-[52px] cursor-pointer hover:bg-[var(--sf-surface-2)]" : "h-[52px]"} onClick={canManage ? () => openEdit(service) : undefined}><td className="px-4 font-semibold"><span className="flex items-center gap-2">{canManage ? <button type="button" className="rounded-sm text-left hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--sf-focus)]" onClick={event => { event.stopPropagation(); openEdit(service); }}>{service.nameKa}</button> : service.nameKa}{service.onlineBookingEnabled ? null : <WorkspaceStatusPill tone="neutral">ონლაინ დამალულია</WorkspaceStatusPill>}</span></td><td className="px-4 text-muted-foreground">{category.nameKa}{service.bufferBeforeMinutes || service.bufferAfterMinutes ? <span className="cwk-num"> · ბუფერი {service.bufferBeforeMinutes}/{service.bufferAfterMinutes} წთ</span> : null}</td><td className="cwk-num px-4">{service.defaultDurationMinutes} წთ</td><td className="cwk-num px-4 text-right font-semibold">{formatGelTetri(service.priceTetri)}</td>{canManage ? <td className="px-4 text-right" onClick={event => event.stopPropagation()}><div className="inline-flex items-center gap-1"><Button type="button" variant="ghost" size="icon-sm" aria-label={`${service.nameKa}: რედაქტირება`} onClick={() => openEdit(service)}><Pencil className="size-4" aria-hidden="true" /></Button>{serviceMenu(service)}</div></td> : null}</tr>)}</tbody></table></div>
              <ul className="divide-y divide-border md:hidden"><WorkspaceRevealScope>{services.data.map(({ service, category }, index) => <WorkspaceRevealItem key={service.id} index={index} as="li" className={canManage ? "flex items-center gap-1 pl-4 pr-2" : "px-4"}>{canManage ? <button type="button" className="min-h-14 min-w-0 flex-1 py-2 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--sf-focus)]" onClick={() => openEdit(service)}><span className="flex items-center gap-2"><span className="truncate font-semibold">{service.nameKa}</span>{service.onlineBookingEnabled ? null : <WorkspaceStatusPill tone="neutral">ონლაინ დამალულია</WorkspaceStatusPill>}</span><span className="cwk-num mt-0.5 block truncate text-sm text-muted-foreground">{category.nameKa} · {service.defaultDurationMinutes} წთ · {formatGelTetri(service.priceTetri)}</span></button> : <div className="min-h-14 py-2"><span className="flex items-center gap-2"><span className="truncate font-semibold">{service.nameKa}</span>{service.onlineBookingEnabled ? null : <WorkspaceStatusPill tone="neutral">ონლაინ დამალულია</WorkspaceStatusPill>}</span><span className="cwk-num mt-0.5 block truncate text-sm text-muted-foreground">{category.nameKa} · {service.defaultDurationMinutes} წთ · {formatGelTetri(service.priceTetri)}</span></div>}{canManage ? serviceMenu(service) : null}</WorkspaceRevealItem>)}</WorkspaceRevealScope></ul>
            </> : null}
          </div></WorkspaceSection>
        </> : null}
      </div>

      <Dialog open={serviceOpen} onOpenChange={setServiceOpen}><DialogContent><DialogHeader><DialogTitle>სერვისის დამატება</DialogTitle></DialogHeader><form onSubmit={submitService} className="space-y-4"><div className="space-y-2"><div className="flex items-center justify-between gap-3"><Label htmlFor="service-category">კატეგორია</Label><Button type="button" variant="link" size="sm" className="h-auto min-h-11 px-0 md:min-h-0" onClick={() => setCategoryOpen(true)}>ახალი კატეგორია</Button></div><Select value={categoryId} onValueChange={setCategoryId}><SelectTrigger id="service-category"><SelectValue placeholder="აირჩიეთ კატეგორია" /></SelectTrigger><SelectContent>{categories.data?.map(category => <SelectItem key={category.id} value={category.id}>{category.nameKa}</SelectItem>)}</SelectContent></Select></div><div className="space-y-2"><Label htmlFor="service-name">სერვისის სახელი</Label><Input id="service-name" value={serviceName} onChange={event => setServiceName(event.target.value)} placeholder="მაგ. თმის შეჭრა" minLength={2} maxLength={160} required /></div><div className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><Label htmlFor="service-duration">ხანგრძლივობა (წთ)</Label><Input id="service-duration" type="number" value={duration} onChange={event => setDuration(event.target.value)} min={5} max={720} step={5} required /></div><div className="space-y-2"><Label htmlFor="service-price">ფასი (₾)</Label><Input id="service-price" inputMode="decimal" value={priceGel} onChange={event => setPriceGel(event.target.value)} placeholder="50.00" required /></div></div>{formError ? <p role="alert" className="text-sm text-destructive">{formError}</p> : null}{createService.error ? <p role="alert" className="text-sm text-destructive">სერვისის დამატება ვერ მოხერხდა. შეამოწმეთ კატეგორია.</p> : null}<DialogFooter><Button type="submit" disabled={createService.isPending}>{createService.isPending ? "ინახება…" : "შენახვა"}</Button></DialogFooter></form></DialogContent></Dialog>
      <Dialog open={Boolean(editingServiceId)} onOpenChange={open => { if (!open) setEditingServiceId(null); }}><DialogContent><DialogHeader><DialogTitle>სერვისის რედაქტირება</DialogTitle><DialogDescription>ძველი ჯავშნები უცვლელი დარჩება.</DialogDescription></DialogHeader><form onSubmit={submitEdit} className="space-y-4"><div className="space-y-2"><Label htmlFor="edit-service-category">კატეგორია</Label><Select value={editCategoryId} onValueChange={setEditCategoryId}><SelectTrigger id="edit-service-category"><SelectValue placeholder="აირჩიეთ კატეგორია" /></SelectTrigger><SelectContent>{categories.data?.map(category => <SelectItem key={category.id} value={category.id}>{category.nameKa}</SelectItem>)}</SelectContent></Select></div><div className="space-y-2"><Label htmlFor="edit-service-name">სერვისის სახელი</Label><Input id="edit-service-name" value={editName} onChange={event => setEditName(event.target.value)} minLength={2} maxLength={160} required /></div><div className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><Label htmlFor="edit-service-duration">ხანგრძლივობა (წთ)</Label><Input id="edit-service-duration" type="number" value={editDuration} onChange={event => setEditDuration(event.target.value)} min={5} max={720} step={5} required /></div><div className="space-y-2"><Label htmlFor="edit-service-price">ფასი (₾)</Label><Input id="edit-service-price" inputMode="decimal" value={editPriceGel} onChange={event => setEditPriceGel(event.target.value)} required /></div></div>{editError ? <p role="alert" className="text-sm text-destructive">{editError}</p> : null}<DialogFooter><Button type="submit" disabled={updateService.isPending}>{updateService.isPending ? "ინახება…" : "ცვლილებების შენახვა"}</Button></DialogFooter></form></DialogContent></Dialog>
      <Dialog open={categoryOpen} onOpenChange={setCategoryOpen}><DialogContent><DialogHeader><DialogTitle>კატეგორიების მართვა</DialogTitle></DialogHeader>{categories.data?.length ? <div className="space-y-2">{categories.data.map(category => <div key={category.id} className="flex items-center justify-between gap-3 rounded-md border p-3 text-sm"><span className="font-medium">{category.nameKa}</span><Button variant="ghost" size="sm" className="max-md:h-11" aria-label={`${category.nameKa}: რედაქტირება`} onClick={() => { setEditingCategoryId(category.id); setEditingCategoryName(category.nameKa); }}>რედაქტირება</Button></div>)}</div> : null}<form onSubmit={submitCategory} className="space-y-4 border-t pt-4"><div className="space-y-2"><Label htmlFor="category-name">ახალი კატეგორიის სახელი</Label><Input id="category-name" value={categoryName} onChange={event => setCategoryName(event.target.value)} placeholder="მაგ. თმის მოვლა" minLength={2} maxLength={160} required /></div>{createCategory.error ? <p role="alert" className="text-sm text-destructive">კატეგორიის დამატება ვერ მოხერხდა. სცადეთ ხელახლა.</p> : null}<DialogFooter><Button type="submit" disabled={createCategory.isPending}>{createCategory.isPending ? "ინახება…" : "დამატება"}</Button></DialogFooter></form>{editingCategoryId ? <form onSubmit={event => { event.preventDefault(); if (organization && editingCategoryName.trim()) updateCategory.mutate({ organizationId: organization.id, categoryId: editingCategoryId, nameKa: editingCategoryName.trim() }); }} className="space-y-4 border-t pt-4"><div className="space-y-2"><Label htmlFor="edit-category-name">კატეგორიის რედაქტირება</Label><Input id="edit-category-name" value={editingCategoryName} onChange={event => setEditingCategoryName(event.target.value)} minLength={2} maxLength={160} required /></div><DialogFooter><Button type="button" variant="outline" onClick={() => setEditingCategoryId(null)}>გაუქმება</Button><Button type="submit" disabled={updateCategory.isPending}>{updateCategory.isPending ? "ინახება…" : "ცვლილების შენახვა"}</Button></DialogFooter></form> : null}</DialogContent></Dialog>
      <Dialog open={Boolean(eligibilityServiceId)} onOpenChange={open => { if (!open) setEligibilityServiceId(null); }}><DialogContent><DialogHeader><DialogTitle>სერვისის სპეციალისტები</DialogTitle><DialogDescription>{services.data?.find(item => item.service.id === eligibilityServiceId)?.service.nameKa ?? "სერვისი"} — ონლაინ ჩაწერაში მხოლოდ მონიშნულ სპეციალისტებთან.</DialogDescription></DialogHeader><div className="space-y-3">{staff.isLoading || eligibility.isLoading ? <p className="text-sm text-muted-foreground">სპეციალისტები იტვირთება…</p> : null}{eligibility.isError ? <p role="alert" className="text-sm text-destructive">ხელმისაწვდომობის მონაცემები ვერ ჩაიტვირთა.</p> : null}{!staff.isLoading && !staff.data?.length ? <p className="rounded-xl bg-[var(--sf-surface-2)] p-4 text-sm text-muted-foreground">ჯერ შექმენით მინიმუმ ერთი აქტიური სპეციალისტის პროფილი.</p> : null}{staff.data?.map(item => { const canPerform = Boolean(eligibility.data?.find(row => row.staffProfileId === item.profile.id)?.canPerform); return <label key={item.profile.id} className="flex min-h-11 cursor-pointer items-center justify-between gap-3 rounded-lg border p-3 text-sm"><span><span className="block font-medium">{item.profile.publicDisplayName}</span><span className="mt-1 block text-xs text-muted-foreground">{item.profile.jobTitle || item.profile.specialty || "სპეციალისტი"}</span></span><input type="checkbox" checked={canPerform} disabled={setStaffEligibility.isPending || eligibility.isLoading} onChange={event => { if (organization && eligibilityServiceId) setStaffEligibility.mutate({ organizationId: organization.id, serviceId: eligibilityServiceId, staffProfileId: item.profile.id, canPerform: event.target.checked }); }} className="h-4 w-4 accent-primary" /></label>; })}</div><DialogFooter><Button variant="outline" onClick={() => setEligibilityServiceId(null)}>დახურვა</Button></DialogFooter></DialogContent></Dialog>
    </DashboardLayout>
  );
}
