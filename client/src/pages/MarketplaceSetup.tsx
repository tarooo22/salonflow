import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { WorkspacePageHeader, WorkspaceSection, WorkspaceState, WorkspaceStatusPill } from "@/components/workspace/WorkspacePrimitives";
import { trpc } from "@/lib/trpc";
import { CheckCircle2, ChevronDown, CircleCheck, LoaderCircle, MapPin, Plus, Search, Send, Tag, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

type CategorySelection = Record<string, string[]>;
type GeocodeCandidate = { placeId: string; formattedAddress: string; latitudeE6: number; longitudeE6: number };

export function marketplaceListingStatusLabel(status: string | null | undefined) {
  return status === "SUBMITTED" ? "განხილვაზეა" : status === "APPROVED" ? "საჯაროა" : status === "HIDDEN" ? "დამალულია" : status === "REJECTED" ? "დასაზუსტებელია" : "მოსამზადებელია";
}

type OnlineService = { service: { id: string; nameKa: string; defaultDurationMinutes: number } };

function CategoryLinks({ name, services, linkedIds, onToggle }: { name: string; services: OnlineService[]; linkedIds: string[]; onToggle: (serviceId: string, checked: boolean) => void }) {
  const [open, setOpen] = useState(false);
  const linked = services.filter(row => linkedIds.includes(row.service.id));
  const available = services.filter(row => !linkedIds.includes(row.service.id));
  return <section className="min-w-0 rounded-xl border border-border p-3" aria-label={name}>
    <div className="flex items-center gap-2"><Tag className="size-4 shrink-0 text-[var(--sf-accent-ink)]" aria-hidden="true" /><h3 className="min-w-0 flex-1 truncate font-semibold">{name}</h3></div>
    {linked.length ? <ul className="mt-2 flex flex-wrap gap-2">{linked.map(row => <li key={row.service.id} className="inline-flex min-w-0 max-w-full items-center gap-1 rounded-full bg-[var(--sf-accent-soft)] py-1 pl-3 pr-1 text-sm text-[var(--sf-accent-ink)]"><span className="truncate">{row.service.nameKa}</span><button type="button" onClick={() => onToggle(row.service.id, false)} aria-label={`მოხსნა: ${row.service.nameKa}`} className="grid size-8 shrink-0 place-items-center rounded-full hover:bg-black/5 focus-visible:outline-2 focus-visible:outline-[var(--sf-focus)] md:size-6"><X className="size-3.5" aria-hidden="true" /></button></li>)}</ul> : <p className="mt-2 text-sm text-muted-foreground">სერვისი მიბმული არ არის.</p>}
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild><Button type="button" variant="outline" size="sm" className="mt-3 max-md:h-11" disabled={!available.length}><Plus className="mr-1.5 size-3.5" aria-hidden="true" />სერვისის მიბმა</Button></PopoverTrigger>
      <PopoverContent align="start" className="w-[min(20rem,calc(100vw-2rem))] p-0">
        <Command><CommandInput placeholder="სერვისის ძებნა…" /><CommandList><CommandEmpty>სერვისი ვერ მოიძებნა.</CommandEmpty><CommandGroup>{available.map(row => <CommandItem key={row.service.id} value={`${row.service.nameKa} ${row.service.id}`} onSelect={() => { onToggle(row.service.id, true); setOpen(false); }}><span className="min-w-0 flex-1 truncate">{row.service.nameKa}</span><span className="font-mono text-xs text-muted-foreground">{row.service.defaultDurationMinutes} წთ</span></CommandItem>)}</CommandGroup></CommandList></Command>
      </PopoverContent>
    </Popover>
  </section>;
}

export default function MarketplaceSetup() {
  const utils = trpc.useUtils();
  const organizations = trpc.organizations.listMine.useQuery();
  const entry = organizations.data?.[0];
  const isOwner = entry?.membership.role === "OWNER";
  const organizationId = entry?.organization.id ?? "";
  const locations = trpc.organizations.listLocations.useQuery({ organizationId }, { enabled: Boolean(organizationId) });
  const categories = trpc.marketplace.categories.useQuery();
  const [locationId, setLocationId] = useState("");
  const selectedLocation = locations.data?.find(location => location.id === locationId);
  const listing = trpc.marketplace.getOwnListing.useQuery({ organizationId, locationId }, { enabled: Boolean(isOwner && organizationId && locationId) });
  const services = trpc.services.list.useQuery({ organizationId, locationId }, { enabled: Boolean(isOwner && organizationId && locationId) });
  const [areaLabelKa, setAreaLabelKa] = useState("");
  const [mapVisibility, setMapVisibility] = useState(false);
  const [categorySelections, setCategorySelections] = useState<CategorySelection>({});
  const [geocodeCandidates, setGeocodeCandidates] = useState<GeocodeCandidate[]>([]);
  const [selectedCandidate, setSelectedCandidate] = useState<GeocodeCandidate | null>(null);
  const [othersOpen, setOthersOpen] = useState(false);

  useEffect(() => {
    if (!locationId && locations.data?.[0]?.id) setLocationId(locations.data[0].id);
  }, [locationId, locations.data]);

  useEffect(() => {
    if (!listing.data) return;
    setAreaLabelKa(listing.data.profile?.areaLabelKa ?? "");
    setMapVisibility(listing.data.profile?.mapVisibility ?? false);
    const grouped = listing.data.categoryServiceLinks.reduce<CategorySelection>((acc, link) => {
      if (link.serviceId) acc[link.categoryId] = [...(acc[link.categoryId] ?? []), link.serviceId];
      return acc;
    }, {});
    setCategorySelections(grouped);
  }, [listing.data]);

  const onlineServices = useMemo(() => (services.data ?? []).filter(row => row.service.onlineBookingEnabled), [services.data]);
  const hasCoordinates = selectedLocation?.latitudeE6 !== null && selectedLocation?.latitudeE6 !== undefined && selectedLocation?.longitudeE6 !== null && selectedLocation?.longitudeE6 !== undefined;
  const hasConfirmedPoint = Boolean(listing.data?.profile?.geocodeConfirmedAt) && hasCoordinates;
  const saveListing = trpc.marketplace.saveOwnListing.useMutation({
    onSuccess: async () => { await Promise.all([utils.marketplace.getOwnListing.invalidate(), utils.organizations.listLocations.invalidate()]); toast.success("კატალოგის მონაცემები შეინახა."); },
    onError: error => toast.error(error.message),
  });
  const submitListing = trpc.marketplace.submitOwnListing.useMutation({
    onSuccess: async () => { await utils.marketplace.getOwnListing.invalidate(); toast.success("პროფილი განხილვაზე გაიგზავნა."); },
    onError: error => toast.error(error.message),
  });
  const geocodeLocation = trpc.marketplace.geocodeOwnLocation.useMutation({
    onSuccess: result => { setGeocodeCandidates(result.candidates); setSelectedCandidate(null); if (!result.candidates.length) toast.message("მისამართისთვის რუკის შედეგი ვერ მოიძებნა."); },
    onError: error => toast.error(error.message),
  });
  const confirmMapPoint = trpc.marketplace.confirmOwnLocationMapPoint.useMutation({
    onSuccess: async () => { setGeocodeCandidates([]); setSelectedCandidate(null); await Promise.all([utils.organizations.listLocations.invalidate(), utils.marketplace.getOwnListing.invalidate()]); toast.success("წერტილი დადასტურდა. რუკაზე გამოჩენის თანხმობა ცალკე შეინახეთ."); },
    onError: error => toast.error(error.message),
  });

  const toggleService = (categoryId: string, serviceId: string, checked: boolean) => {
    setCategorySelections(previous => ({
      ...previous,
      [categoryId]: checked ? ((previous[categoryId] ?? []).includes(serviceId) ? previous[categoryId] : [...(previous[categoryId] ?? []), serviceId]) : (previous[categoryId] ?? []).filter(id => id !== serviceId),
    }));
  };

  const persist = () => {
    if (!organizationId || !locationId) return;
    const categoryServiceLinks = Object.entries(categorySelections).filter(([, serviceIds]) => serviceIds.length).map(([categoryId, serviceIds]) => ({ categoryId, serviceIds }));
    saveListing.mutate({ organizationId, locationId, areaLabelKa: areaLabelKa.trim() || null, mapVisibility, categoryServiceLinks });
  };

  return <DashboardLayout><main className="sf-workspace-page mx-auto w-full max-w-7xl space-y-5">
    <WorkspacePageHeader title="კატალოგის პროფილი" description="კატალოგში გამოჩნდება მხოლოდ განხილვის შემდეგ." />
    {organizations.isLoading ? <WorkspaceState kind="loading" title="იტვირთება…" /> : null}
    {organizations.isError ? <WorkspaceState kind="error" title="მონაცემები მიუწვდომელია" /> : null}
    {!organizations.isLoading && !organizations.isError && !isOwner ? <WorkspaceState kind="empty" title="კატალოგის პროფილს მხოლოდ მფლობელი მართავს" /> : null}
    {isOwner ? <>
      <WorkspaceSection title="ფილიალი">
        <div className="flex flex-wrap items-end gap-3"><div className="min-w-64 flex-1 space-y-2"><Label htmlFor="marketplace-location">ფილიალი</Label><select id="marketplace-location" className="h-10 w-full rounded-md border bg-background px-3 text-sm" value={locationId} onChange={event => { setLocationId(event.target.value); setGeocodeCandidates([]); setSelectedCandidate(null); }}>{locations.data?.map(location => <option key={location.id} value={location.id}>{location.name}</option>)}</select></div>{listing.data ? <WorkspaceStatusPill tone={listing.data.profile?.status === "APPROVED" ? "success" : listing.data.profile?.status === "SUBMITTED" ? "info" : "warning"}>{marketplaceListingStatusLabel(listing.data.profile?.status)}</WorkspaceStatusPill> : null}</div>
      </WorkspaceSection>
      {locationId ? <>
        {listing.data?.launchReadiness ? <WorkspaceSection title="მზადყოფნა"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-sm font-semibold"><span className="font-mono">{listing.data.launchReadiness.completed}/{listing.data.launchReadiness.total}</span> პუნქტი მზადაა</p></div><WorkspaceStatusPill tone={listing.data.launchReadiness.readyForReview ? "success" : "warning"}>{listing.data.launchReadiness.readyForReview ? "მზადაა განსახილველად" : "საჭიროა შევსება"}</WorkspaceStatusPill></div><div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-2">{listing.data.launchReadiness.items.map(item => <article key={item.key} className={`rounded-md border p-3 ${item.complete ? "border-[var(--sf-jade)]/30" : ""}`}><div className="flex items-center gap-2 text-sm font-semibold">{item.complete ? <CircleCheck className="size-4 text-[var(--sf-jade)]" /> : <span className="grid size-4 place-items-center rounded-full border text-[10px] text-muted-foreground" aria-hidden="true">!</span>}{item.label}</div>{!item.complete ? <p className="mt-1 text-xs text-muted-foreground">{item.action}</p> : <p className="mt-1 text-xs text-muted-foreground">მითითებულია</p>}</article>)}</div></WorkspaceSection> : null}
        <WorkspaceSection title="კატეგორიები და სერვისები" description="მონიშნეთ მხოლოდ ის, რასაც ამ ფილიალში ონლაინ ჩაწერით სთავაზობთ.">
          {services.isLoading || categories.isLoading ? <p className="text-sm text-muted-foreground">იტვირთება…</p> : null}
          {!onlineServices.length && !services.isLoading ? <WorkspaceState kind="empty" title="ონლაინ ჩაწერის სერვისი ჯერ არ არის" description="დაამატეთ სერვისი სერვისების გვერდზე." /> : null}
          {(() => {
            const all = categories.data ?? [];
            const withLinks = all.filter(category => categorySelections[category.id]?.length);
            const without = all.filter(category => !categorySelections[category.id]?.length);
            const renderCategory = (category: (typeof all)[number]) => <CategoryLinks key={category.id} name={category.nameKa} services={onlineServices} linkedIds={categorySelections[category.id] ?? []} onToggle={(serviceId, checked) => toggleService(category.id, serviceId, checked)} />;
            const showOthers = othersOpen || !withLinks.length;
            return <div className="space-y-3">
              {withLinks.length ? <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">{withLinks.map(renderCategory)}</div> : null}
              {without.length && withLinks.length ? <Button type="button" variant="ghost" size="sm" className="max-md:h-11" aria-expanded={showOthers} aria-controls="marketplace-other-categories" onClick={() => setOthersOpen(open => !open)}>სხვა კატეგორიები ({without.length})<ChevronDown className={`ml-1.5 size-4 transition-transform ${showOthers ? "rotate-180" : ""}`} aria-hidden="true" /></Button> : null}
              {without.length && showOthers ? <div id="marketplace-other-categories" className="grid grid-cols-1 gap-3 lg:grid-cols-2">{without.map(renderCategory)}</div> : null}
            </div>;
          })()}
        </WorkspaceSection>
        <WorkspaceSection title="ადგილი და რუკა" description="რუკაზე გამოჩნდება მხოლოდ თქვენი თანხმობითა და დადასტურებული წერტილით.">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_auto]"><div className="space-y-2"><Label htmlFor="marketplace-area">ქალაქი / უბანი</Label><Input id="marketplace-area" value={areaLabelKa} onChange={event => setAreaLabelKa(event.target.value)} placeholder="მაგ. თბილისი · ვაკე" maxLength={160} /><p className="text-xs text-muted-foreground">გამოჩნდება კატალოგში; სრული მისამართი არ ქვეყნდება.</p></div><label className="flex max-w-sm items-start gap-3 rounded-md border p-3"><input type="checkbox" disabled={!hasConfirmedPoint} checked={mapVisibility} onChange={event => setMapVisibility(event.target.checked)} className="mt-1 size-4 accent-primary disabled:opacity-45" /><span><span className="flex items-center gap-2 text-sm font-semibold"><MapPin className="size-4 text-primary" />რუკაზე გამოჩენა</span><span className="mt-1 block text-xs text-muted-foreground">{hasConfirmedPoint ? "წერტილი დადასტურებულია." : "ჯერ დაადასტურეთ მისამართი ქვემოთ."}</span></span></label></div>
          <section className="mt-4 rounded-md border p-3" aria-labelledby="marketplace-geocode-title"><div className="flex flex-wrap items-start justify-between gap-3"><div><h2 id="marketplace-geocode-title" className="flex items-center gap-2 text-sm font-semibold"><MapPin className="size-4 text-primary" />მისამართის წერტილის დადასტურება</h2></div>{hasConfirmedPoint ? <span className="inline-flex items-center gap-1.5 rounded-md bg-[color-mix(in_srgb,var(--sf-jade)_16%,transparent)] px-2 py-1 text-xs font-semibold text-[var(--sf-jade)]"><CircleCheck className="size-3.5" />დადასტურებულია</span> : null}</div><div className="mt-3 rounded-md border p-3"><p className="text-xs font-medium text-muted-foreground">ფილიალის მისამართი</p><p className="mt-1 break-words text-sm">{selectedLocation?.address?.trim() || "მისამართი არ არის მითითებული"}</p></div><div className="mt-3 flex flex-wrap items-center gap-3"><Button type="button" variant="outline" onClick={() => geocodeLocation.mutate({ organizationId, locationId })} disabled={!selectedLocation?.address?.trim() || geocodeLocation.isPending}><Search className="mr-2 size-4" />{geocodeLocation.isPending ? "იძებნება…" : "წერტილის მოძებნა"}</Button>{!selectedLocation?.address?.trim() ? <p className="text-xs text-muted-foreground">მისამართს ცვლით პარამეტრებში.</p> : null}</div>{geocodeLocation.isError ? <p className="mt-3 rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive" role="alert">{geocodeLocation.error.message}</p> : null}{geocodeCandidates.length ? <fieldset className="mt-4 space-y-2"><legend className="text-sm font-semibold">აირჩიეთ შესაბამისი შედეგი</legend>{geocodeCandidates.map(candidate => <label key={candidate.placeId} className={`flex cursor-pointer items-start gap-3 rounded-md border p-3 transition ${selectedCandidate?.placeId === candidate.placeId ? "border-primary bg-primary/5" : "hover:border-primary/35"}`}><input type="radio" name="marketplace-geocode-candidate" checked={selectedCandidate?.placeId === candidate.placeId} onChange={() => setSelectedCandidate(candidate)} className="mt-1 size-4 accent-primary" /><span className="min-w-0 text-sm"><span className="block font-medium">{candidate.formattedAddress}</span></span></label>)}</fieldset> : null}{selectedCandidate ? <div className="mt-4 flex flex-wrap items-center gap-3"><Button type="button" onClick={() => confirmMapPoint.mutate({ organizationId, locationId, ...selectedCandidate })} disabled={confirmMapPoint.isPending}>{confirmMapPoint.isPending ? <LoaderCircle className="mr-2 size-4 animate-spin" /> : <CircleCheck className="mr-2 size-4" />}{confirmMapPoint.isPending ? "მოწმდება…" : "ამ წერტილის დადასტურება"}</Button></div> : null}</section>
        </WorkspaceSection>
        <WorkspaceSection title="შენახვა და გაგზავნა" description="ფოტო და აღწერა იმართება „მედიის“ გვერდზე.">
          <div className="flex flex-wrap items-center gap-3"><Button type="button" variant="outline" onClick={persist} disabled={saveListing.isPending}><CheckCircle2 className="mr-2 size-4" />{saveListing.isPending ? "ინახება…" : "ცვლილებების შენახვა"}</Button><Button type="button" onClick={() => submitListing.mutate({ organizationId, locationId })} disabled={submitListing.isPending || !Object.values(categorySelections).some(serviceIds => serviceIds.length)}><Send className="mr-2 size-4" />{submitListing.isPending ? "იგზავნება…" : "განხილვაზე გაგზავნა"}</Button></div>
        </WorkspaceSection>
      </> : null}
    </> : null}
  </main></DashboardLayout>;
}

