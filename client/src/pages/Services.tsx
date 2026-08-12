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
import { Clock3, Layers3, Plus, Sparkles } from "lucide-react";
import { FormEvent, useState } from "react";

export default function Services() {
  const utils = trpc.useUtils();
  const organizations = trpc.organizations.listMine.useQuery();
  const organizationEntry = organizations.data?.[0];
  const organization = organizationEntry?.organization;
  const canManage = ["OWNER", "MANAGER"].includes(organizationEntry?.membership.role ?? "");
  const categories = trpc.services.listCategories.useQuery({ organizationId: organization?.id ?? "" }, { enabled: Boolean(organization?.id) });
  const services = trpc.services.list.useQuery({ organizationId: organization?.id ?? "" }, { enabled: Boolean(organization?.id) });
  const [serviceOpen, setServiceOpen] = useState(false);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [categoryId, setCategoryId] = useState("");
  const [categoryName, setCategoryName] = useState("");
  const [serviceName, setServiceName] = useState("");
  const [duration, setDuration] = useState("60");
  const [priceGel, setPriceGel] = useState("");
  const [formError, setFormError] = useState("");
  const createCategory = trpc.services.createCategory.useMutation({
    onSuccess: async result => {
      await utils.services.listCategories.invalidate();
      setCategoryId(result.id);
      setCategoryName("");
      setCategoryOpen(false);
      setServiceOpen(true);
    },
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

  return (
    <DashboardLayout>
      <div className="mx-auto w-full max-w-7xl space-y-6">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div><p className="text-sm font-medium text-primary">კატალოგის მართვა</p><h1 className="mt-1 text-3xl font-semibold tracking-tight">სერვისები</h1><p className="mt-2 text-sm text-muted-foreground">აქტიური კატეგორიები, ხანგრძლივობები, ფასები და ონლაინ ხილვადობა.</p></div>
          <div className="flex flex-wrap items-center gap-2"><Badge variant="outline" className="w-fit border-primary/30 bg-primary/5 px-3 py-1 text-primary">{organization?.name ?? "სამუშაო სივრცე"}</Badge>{organization && canManage ? <Button onClick={() => { setFormError(""); setServiceOpen(true); }}><Plus className="mr-2 h-4 w-4" />სერვისის დამატება</Button> : null}</div>
        </header>
        {organizations.isLoading ? <State text="სერვისების სამუშაო სივრცე იტვირთება…" /> : null}
        {organizations.isError ? <State text="სამუშაო სივრცის მონაცემები დროებით მიუწვდომელია." error /> : null}
        {!organizations.isLoading && !organizations.isError && !organization ? <State text="სერვისების სანახავად ჯერ შექმენით სამუშაო სივრცე." /> : null}
        {organization ? <>
          <div className="grid gap-4 md:grid-cols-3"><Metric icon={Sparkles} label="აქტიური სერვისები" value={services.isLoading ? "…" : String(services.data?.length ?? 0)} hint="ხელმისაწვდომი მომსახურებების რაოდენობა" /><Metric icon={Layers3} label="კატეგორიები" value={categories.isLoading ? "…" : String(categories.data?.length ?? 0)} hint="კატალოგის აქტიური ჯგუფები" /><Metric icon={Clock3} label="ონლაინ ხილული" value={services.isLoading ? "…" : String(services.data?.filter(item => item.service.onlineBookingEnabled).length ?? 0)} hint="საჯარო ჩაწერაში გამოჩენილი სერვისები" /></div>
          <Card><CardHeader className="flex flex-row items-center justify-between gap-4"><CardTitle>აქტიური კატალოგი</CardTitle>{canManage && categories.data?.length ? <Button variant="outline" size="sm" onClick={() => setCategoryOpen(true)}><Plus className="mr-1.5 h-4 w-4" />კატეგორია</Button> : null}</CardHeader><CardContent><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{services.isLoading ? <p className="text-sm text-muted-foreground">სერვისები იტვირთება…</p> : null}{services.isError ? <p className="text-sm text-destructive">სერვისების ჩატვირთვა ვერ მოხერხდა.</p> : null}{!services.isLoading && !services.isError && services.data?.length === 0 ? <div className="rounded-xl border border-dashed p-6 text-sm leading-6 text-muted-foreground"><p>პირველი სერვისი აქ გამოჩნდება დამატების შემდეგ. ისტორიული ჩანაწერები არქივირებისას დაცულად რჩება.</p>{canManage ? <Button variant="outline" size="sm" className="mt-4" onClick={() => setServiceOpen(true)}><Plus className="mr-1.5 h-4 w-4" />პირველი სერვისის დამატება</Button> : null}</div> : null}{services.data?.map(({ service, category }) => <div key={service.id} className="rounded-2xl border bg-card p-5 shadow-sm"><p className="text-xs font-medium text-primary">{category.nameKa}</p><div className="mt-2 flex items-start justify-between gap-3"><h2 className="font-semibold">{service.nameKa}</h2><Badge variant="outline" className={service.onlineBookingEnabled ? "border-[#17826A]/30 bg-[#17826A]/10 text-[#216451]" : ""}>{service.onlineBookingEnabled ? "ონლაინ" : "შიდა"}</Badge></div><div className="mt-4 flex items-center justify-between text-sm text-muted-foreground"><span>{service.defaultDurationMinutes} წთ</span><span>{(service.priceTetri / 100).toFixed(2)} ₾</span></div><p className="mt-3 text-xs text-muted-foreground">ბუფერი: {service.bufferBeforeMinutes} / {service.bufferAfterMinutes} წთ</p></div>)}</div></CardContent></Card>
        </> : null}
      </div>

      <Dialog open={serviceOpen} onOpenChange={setServiceOpen}><DialogContent><DialogHeader><DialogTitle>სერვისის დამატება</DialogTitle><DialogDescription>ფასი უსაფრთხოდ გარდაიქმნება მთელ თეთრებში და არასოდეს ინახება ათწილადი თანხის სახით.</DialogDescription></DialogHeader><form onSubmit={submitService} className="space-y-4"><div className="space-y-2"><div className="flex items-center justify-between gap-3"><Label htmlFor="service-category">კატეგორია</Label><Button type="button" variant="link" size="sm" className="h-auto px-0" onClick={() => setCategoryOpen(true)}>ახალი კატეგორია</Button></div><Select value={categoryId} onValueChange={setCategoryId}><SelectTrigger id="service-category"><SelectValue placeholder="აირჩიეთ კატეგორია" /></SelectTrigger><SelectContent>{categories.data?.map(category => <SelectItem key={category.id} value={category.id}>{category.nameKa}</SelectItem>)}</SelectContent></Select></div><div className="space-y-2"><Label htmlFor="service-name">სერვისის სახელი</Label><Input id="service-name" value={serviceName} onChange={event => setServiceName(event.target.value)} placeholder="მაგ. თმის შეჭრა" minLength={2} maxLength={160} required /></div><div className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><Label htmlFor="service-duration">ხანგრძლივობა (წთ)</Label><Input id="service-duration" type="number" value={duration} onChange={event => setDuration(event.target.value)} min={5} max={720} step={5} required /></div><div className="space-y-2"><Label htmlFor="service-price">ფასი (₾)</Label><Input id="service-price" inputMode="decimal" value={priceGel} onChange={event => setPriceGel(event.target.value)} placeholder="50.00" required /></div></div>{formError ? <p className="text-sm text-destructive">{formError}</p> : null}{createService.error ? <p className="text-sm text-destructive">სერვისის დამატება ვერ მოხერხდა. შეამოწმეთ კატეგორია და სცადეთ ხელახლა.</p> : null}<DialogFooter><Button type="submit" disabled={createService.isPending}>{createService.isPending ? "ინახება…" : "სერვისის შენახვა"}</Button></DialogFooter></form></DialogContent></Dialog>
      <Dialog open={categoryOpen} onOpenChange={setCategoryOpen}><DialogContent><DialogHeader><DialogTitle>კატეგორიის დამატება</DialogTitle><DialogDescription>კატეგორიები ეხმარება გუნდს და კლიენტებს სწორად იპოვონ სერვისები.</DialogDescription></DialogHeader><form onSubmit={submitCategory} className="space-y-4"><div className="space-y-2"><Label htmlFor="category-name">კატეგორიის სახელი</Label><Input id="category-name" value={categoryName} onChange={event => setCategoryName(event.target.value)} placeholder="მაგ. თმის მოვლა" minLength={2} maxLength={160} required /></div>{createCategory.error ? <p className="text-sm text-destructive">კატეგორიის დამატება ვერ მოხერხდა. სცადეთ ხელახლა.</p> : null}<DialogFooter><Button type="submit" disabled={createCategory.isPending}>{createCategory.isPending ? "ინახება…" : "კატეგორიის შენახვა"}</Button></DialogFooter></form></DialogContent></Dialog>
    </DashboardLayout>
  );
}

function Metric({ icon: Icon, label, value, hint }: { icon: typeof Sparkles; label: string; value: string; hint: string }) { return <Card><CardContent className="p-5"><Icon className="h-5 w-5 text-primary" /><p className="mt-4 text-sm text-muted-foreground">{label}</p><p className="mt-2 text-2xl font-semibold">{value}</p><p className="mt-3 text-xs text-muted-foreground">{hint}</p></CardContent></Card>; }
function State({ text, error = false }: { text: string; error?: boolean }) { return <Card className={error ? "border-destructive/30 bg-destructive/5" : ""}><CardContent className={`p-8 text-sm ${error ? "text-destructive" : "text-muted-foreground"}`}>{text}</CardContent></Card>; }
