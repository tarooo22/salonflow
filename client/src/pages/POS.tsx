import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CompactMetricRail, MetricCell } from "@/components/workspace/DashboardModules";
import { WorkspacePageHeader, WorkspaceSection, WorkspaceState, WorkspaceStatusPill } from "@/components/workspace/WorkspacePrimitives";
import { formatGelTetri, formatPaymentMethod } from "@/lib/presentation";
import { trpc } from "@/lib/trpc";
import { Minus, PackagePlus, Plus, ReceiptText } from "lucide-react";
import React, { FormEvent, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

const methods = ["CASH", "CARD_TERMINAL", "BANK_TRANSFER", "ONLINE", "OTHER"] as const;

/** Label with a reserved hint line, so every field of a row shares the same label baseline. */
function FormField({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return <label className="grid gap-1.5 text-sm font-medium"><span className="grid"><span>{label}</span><span className="min-h-4 text-xs font-normal text-[var(--sf-muted)]">{hint}</span></span>{children}</label>;
}

export default function POS() {
  const utils = trpc.useUtils();
  const organizations = trpc.organizations.listMine.useQuery();
  const entry = organizations.data?.[0];
  const organization = entry?.organization;
  const role = entry?.membership.role;
  const locations = trpc.organizations.listLocations.useQuery({ organizationId: organization?.id ?? "" }, { enabled: Boolean(organization?.id) });
  const [locationId, setLocationId] = useState("");
  const resolvedLocationId = locationId || locations.data?.[0]?.id || "";
  useEffect(() => { if (!locationId && locations.data?.[0]) setLocationId(locations.data[0].id); }, [locationId, locations.data]);
  const inventory = trpc.pos.listInventory.useQuery({ organizationId: organization?.id ?? "", locationId: resolvedLocationId }, { enabled: Boolean(organization?.id && resolvedLocationId) });
  const clients = trpc.clients.list.useQuery({ organizationId: organization?.id ?? "", limit: 25, offset: 0, status: "ACTIVE" }, { enabled: Boolean(organization?.id) });
  const [cart, setCart] = useState<Record<string, number>>({});
  const [clientId, setClientId] = useState("NONE");
  const [method, setMethod] = useState<(typeof methods)[number]>("CASH");
  const [note, setNote] = useState("");
  const [newName, setNewName] = useState("");
  const [newSku, setNewSku] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [newQty, setNewQty] = useState("0");
  const [newReorder, setNewReorder] = useState("0");
  const [productError, setProductError] = useState("");
  const [saleError, setSaleError] = useState("");
  const productErrorRef = useRef<HTMLParagraphElement>(null);
  useEffect(() => { if (productError) productErrorRef.current?.focus(); }, [productError]);
  const canCreateProduct = ["OWNER", "MANAGER"].includes(role ?? "");
  const sale = trpc.pos.createSale.useMutation({
    onSuccess: async data => { await Promise.all([utils.pos.listInventory.invalidate(), utils.pos.listSales.invalidate()]); setCart({}); setNote(""); setSaleError(""); toast.success(`გაყიდვა დაფიქსირდა · ${formatGelTetri(data.totalTetri)}`); },
    onError: error => setSaleError(error.message || "გაყიდვის დაფიქსირება ვერ მოხერხდა. სცადეთ ხელახლა."),
  });
  const createProduct = trpc.pos.createProduct.useMutation({
    onSuccess: async () => { await utils.pos.listInventory.invalidate(); setNewName(""); setNewSku(""); setNewPrice(""); setNewQty("0"); setNewReorder("0"); setProductError(""); toast.success("პროდუქტი დაემატა."); },
    onError: error => setProductError(error.message || "პროდუქტის დამატება ვერ მოხერხდა. სცადეთ ხელახლა."),
  });
  const stockRows = inventory.data ?? [];
  const selected = stockRows.filter(row => (cart[row.product.id] ?? 0) > 0);
  const total = selected.reduce((sum, row) => sum + row.product.retailPriceTetri * (cart[row.product.id] ?? 0), 0);
  const lowStock = stockRows.filter(row => (row.stock?.currentQuantity ?? 0) <= (row.stock?.reorderLevel ?? 0));
  const quantity = (id: string, max: number, delta: number) => setCart(current => { const next = Math.max(0, Math.min(max, (current[id] ?? 0) + delta)); const copy = { ...current }; if (next) copy[id] = next; else delete copy[id]; return copy; });
  const submitSale = () => { if (!organization || !resolvedLocationId || !selected.length) return; setSaleError(""); sale.mutate({ organizationId: organization.id, locationId: resolvedLocationId, clientId: clientId === "NONE" ? undefined : clientId, lines: selected.map(row => ({ productId: row.product.id, quantity: cart[row.product.id] })), method, note: note || undefined }); };
  const submitProduct = (event: FormEvent) => {
    event.preventDefault();
    if (!organization || !resolvedLocationId) return;
    const price = Math.round(Number(newPrice.replace(",", ".")) * 100);
    const qty = Number(newQty);
    const reorder = Number(newReorder);
    if (!newName.trim()) { setProductError("მიუთითეთ პროდუქტის სახელი."); return; }
    if (!Number.isFinite(price) || price <= 0) { setProductError("მიუთითეთ ფასი ლარში, მაგ. 25.00."); return; }
    if (!Number.isInteger(qty) || qty < 0 || !Number.isInteger(reorder) || reorder < 0) { setProductError("მარაგი უნდა იყოს მთელი რიცხვი, 0 ან მეტი."); return; }
    setProductError("");
    createProduct.mutate({ organizationId: organization.id, locationId: resolvedLocationId, nameKa: newName, sku: newSku || undefined, retailPriceTetri: price, openingQuantity: qty, reorderLevel: reorder });
  };
  const emptyCart = !selected.length;
  return <DashboardLayout><div className="sf-workspace-page mx-auto w-full max-w-7xl space-y-5">
    <WorkspacePageHeader title="სალარო" actions={locations.data?.length ? <Select value={resolvedLocationId} onValueChange={setLocationId}><SelectTrigger className="w-full bg-card sm:w-auto sm:min-w-48" aria-label="ფილიალი"><SelectValue /></SelectTrigger><SelectContent>{locations.data.map(location => <SelectItem key={location.id} value={location.id}>{location.name}</SelectItem>)}</SelectContent></Select> : null} />
    {!organization ? <WorkspaceState kind="empty" title="ჯერ შექმენით სამუშაო სივრცე" /> : <>
      {inventory.isLoading ? <WorkspaceState kind="loading" title="იტვირთება…" /> : null}
      {inventory.isError ? <WorkspaceState kind="error" title="პროდუქტების სია ვერ ჩაიტვირთა" description="შეამოწმეთ კავშირი და სცადეთ ხელახლა." action={<Button variant="outline" onClick={() => { void inventory.refetch(); }}>თავიდან ცდა</Button>} /> : null}
      <CompactMetricRail label="სალაროს მაჩვენებლები"><MetricCell label="პროდუქტები" value={String(stockRows.length)} /><MetricCell label="კალათის ჯამი" value={formatGelTetri(total)} /><MetricCell label="მარაგი მცირეა" value={String(lowStock.length)} /></CompactMetricRail>
      {canCreateProduct ? <WorkspaceSection title="პროდუქტის დამატება"><form onSubmit={submitProduct} noValidate className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_9rem_7rem_8rem_10.5rem_auto] lg:items-start">
        <FormField label="სახელი"><Input value={newName} onChange={event => setNewName(event.target.value)} maxLength={160} placeholder="მაგ. დამცავი შამპუნი" required /></FormField>
        <FormField label="არტიკული" hint="(არასავალდებულო)"><Input value={newSku} onChange={event => setNewSku(event.target.value)} maxLength={96} spellCheck={false} autoComplete="off" autoCapitalize="none" /></FormField>
        <FormField label="ფასი (₾)"><Input inputMode="decimal" value={newPrice} onChange={event => setNewPrice(event.target.value)} required /></FormField>
        <FormField label="საწყისი მარაგი"><Input type="number" inputMode="numeric" min="0" value={newQty} onChange={event => setNewQty(event.target.value)} required /></FormField>
        <FormField label="მინიმალური მარაგი"><Input type="number" inputMode="numeric" min="0" value={newReorder} onChange={event => setNewReorder(event.target.value)} required /></FormField>
        <Button type="submit" className="lg:self-end" disabled={createProduct.isPending}><PackagePlus className="size-4" aria-hidden="true" />{createProduct.isPending ? "ინახება…" : "დამატება"}</Button>
        {productError ? <p ref={productErrorRef} tabIndex={-1} role="alert" className="text-sm text-destructive outline-none lg:col-span-6">{productError}</p> : null}
      </form></WorkspaceSection> : null}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <WorkspaceSection title="პროდუქტები"><div className="divide-y divide-border">{stockRows.map(row => {
          const available = row.stock?.currentQuantity ?? 0;
          const selectedQty = cart[row.product.id] ?? 0;
          return <div key={row.product.id} className="flex flex-wrap items-center gap-x-3 gap-y-2 py-3 first:pt-0 last:pb-0">
            <div className="min-w-0 flex-1 basis-40"><p className="truncate font-semibold">{row.product.nameKa}</p><p className="truncate text-xs text-[var(--sf-muted)]">{row.product.sku ? <><span className="cwk-num">{row.product.sku}</span> · </> : null}მარაგი: <span className="cwk-num">{available}</span></p></div>
            {available <= (row.stock?.reorderLevel ?? 0) ? <WorkspaceStatusPill tone="warning">მცირეა</WorkspaceStatusPill> : null}
            <p className="cwk-num font-semibold">{formatGelTetri(row.product.retailPriceTetri)}</p>
            <div className="flex items-center gap-2"><Button size="icon" variant="outline" onClick={() => quantity(row.product.id, available, -1)} disabled={!selectedQty} aria-label={`${row.product.nameKa}: რაოდენობის შემცირება`}><Minus className="size-4" aria-hidden="true" /></Button><span className="cwk-num w-6 text-center font-semibold" aria-live="polite">{selectedQty}</span><Button size="icon" variant="outline" onClick={() => quantity(row.product.id, available, 1)} disabled={selectedQty >= available} aria-label={`${row.product.nameKa}: რაოდენობის დამატება`}><Plus className="size-4" aria-hidden="true" /></Button></div>
          </div>;
        })}</div>{!inventory.isLoading && !inventory.isError && !stockRows.length ? <WorkspaceState kind="empty" title="პროდუქტი ჯერ არ არის" description={canCreateProduct ? undefined : "პროდუქტს ამატებს მფლობელი ან მენეჯერი."} /> : null}</WorkspaceSection>
        <WorkspaceSection title="კალათა" className="h-fit xl:sticky xl:top-5"><div className="space-y-4">
          <div className="space-y-2">{selected.length ? selected.map(row => <div key={row.product.id} className="flex justify-between gap-2 text-sm"><span className="min-w-0 truncate">{row.product.nameKa} × <span className="cwk-num">{cart[row.product.id]}</span></span><span className="cwk-num font-semibold">{formatGelTetri(row.product.retailPriceTetri * cart[row.product.id])}</span></div>) : <p className="text-sm text-[var(--sf-muted)]">კალათა ჯერ ცარიელია.</p>}</div>
          <div className="border-t border-border pt-3"><div className="flex justify-between font-semibold"><span>სულ</span><span className="cwk-num">{formatGelTetri(total)}</span></div></div>
          <FormField label="კლიენტი" hint="(არასავალდებულო)"><Select value={clientId} onValueChange={setClientId}><SelectTrigger className="w-full"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="NONE">კლიენტის გარეშე</SelectItem>{clients.data?.items.map(client => <SelectItem key={client.id} value={client.id}>{client.firstName} {client.lastName ?? ""}</SelectItem>)}</SelectContent></Select></FormField>
          <FormField label="გადახდის მეთოდი"><Select value={method} onValueChange={value => setMethod(value as (typeof methods)[number])}><SelectTrigger className="w-full"><SelectValue /></SelectTrigger><SelectContent>{methods.map(value => <SelectItem key={value} value={value}>{formatPaymentMethod(value)}</SelectItem>)}</SelectContent></Select></FormField>
          <FormField label="შენიშვნა" hint="(არასავალდებულო)"><Input value={note} onChange={event => setNote(event.target.value)} maxLength={2000} /></FormField>
          <div className="space-y-2">
            <Button className="w-full" disabled={emptyCart || sale.isPending} onClick={submitSale} aria-describedby={emptyCart ? "pos-checkout-help" : undefined}><ReceiptText className="size-4" aria-hidden="true" />{sale.isPending ? "ფიქსირდება…" : "გაყიდვის დაფიქსირება"}</Button>
            {emptyCart ? <p id="pos-checkout-help" className="text-sm text-[var(--sf-muted)]">ჯერ კალათაში დაამატეთ პროდუქტი.</p> : null}
            {saleError ? <p role="alert" className="text-sm text-destructive">{saleError}</p> : null}
            <p className="text-xs text-[var(--sf-muted)]">შიდა აღრიცხვაა — ბარათიდან თანხა არ ჩამოიჭრება.</p>
          </div>
        </div></WorkspaceSection>
      </div>
    </>}
  </div></DashboardLayout>;
}
