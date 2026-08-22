import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { WorkspacePageHeader, WorkspaceSection, WorkspaceState, WorkspaceStatusPill } from "@/components/workspace/WorkspacePrimitives";
import { trpc } from "@/lib/trpc";
import { BadgeCheck, Ban, CalendarClock, CreditCard, EyeOff, ShieldCheck, Star, XCircle } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

type ListingStatus = "DRAFT" | "SUBMITTED" | "APPROVED" | "HIDDEN" | "REJECTED";
type PromotionDraft = { tier: "RECOMMENDED" | "VIP"; startsAt: string; endsAt: string };

function formatLocalInput(date: Date) {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

function formatDate(value: Date | string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleString("ka-GE", { dateStyle: "medium", timeStyle: "short" });
}

function listingStatusLabel(status: ListingStatus) {
  return status === "SUBMITTED" ? "განხილვაზეა" : status === "APPROVED" ? "დამტკიცებულია" : status === "HIDDEN" ? "დამალულია" : status === "REJECTED" ? "დასაზუსტებელია" : "მოსამზადებელია";
}

function listingStatusTone(status: ListingStatus) {
  return status === "APPROVED" ? "success" : status === "SUBMITTED" ? "info" : status === "REJECTED" ? "warning" : "neutral";
}

function newPromotionDraft(): PromotionDraft {
  const now = new Date();
  const ends = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  return { tier: "RECOMMENDED", startsAt: formatLocalInput(now), endsAt: formatLocalInput(ends) };
}

export default function MarketplaceAdmin() {
  const { user, loading } = useAuth();
  const utils = trpc.useUtils();
  const [status, setStatus] = useState<ListingStatus | undefined>();
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [promotionDrafts, setPromotionDrafts] = useState<Record<string, PromotionDraft>>({});
  const queueInput = useMemo(() => ({ limit: 100, offset: 0, status }), [status]);
  const queue = trpc.marketplace.adminListings.useQuery(queueInput, { enabled: user?.role === "admin" });
  const refresh = async () => { await Promise.all([utils.marketplace.adminListings.invalidate(), utils.marketplace.directory.invalidate(), utils.marketplace.mapResults.invalidate()]); };
  const review = trpc.marketplace.adminReviewListing.useMutation({ onSuccess: async () => { await refresh(); toast.success("Listing-ის სტატუსი განახლდა."); }, onError: error => toast.error(error.message) });
  const schedule = trpc.marketplace.schedulePromotion.useMutation({ onSuccess: async () => { await refresh(); toast.success("Promotion დაიგეგმა. თანხა არ ჩამოჭრილა."); }, onError: error => toast.error(error.message) });
  const cancelPromotion = trpc.marketplace.cancelPromotion.useMutation({ onSuccess: async () => { await refresh(); toast.success("Promotion გაუქმდა."); }, onError: error => toast.error(error.message) });
  const getDraft = (locationId: string) => promotionDrafts[locationId] ?? newPromotionDraft();
  const updateDraft = (locationId: string, patch: Partial<PromotionDraft>) => setPromotionDrafts(current => ({ ...current, [locationId]: { ...getDraft(locationId), ...patch } }));

  return <DashboardLayout><main className="sf-workspace-page mx-auto w-full max-w-7xl space-y-5"><WorkspacePageHeader eyebrow="PLATFORM ADMIN" title="Marketplace moderation" description="ეს კონსოლი ეკუთვნის მხოლოდ SalonFlow-ის platform admin-ს. salon OWNER ვერ ამტკიცებს საკუთარ listing-ს, ვერ ირჩევს VIP-ს და ვერ მართავს promotion-ს." />{loading ? <WorkspaceState kind="loading" title="წვდომა მოწმდება…" /> : null}{!loading && user?.role !== "admin" ? <WorkspaceState kind="empty" title="Platform admin წვდომა აუცილებელია" description="ეს კონტროლები არ არის salon workspace-ის მფლობელის ფუნქცია. დაუბრუნდით Marketplace listing-ს და გაგზავნეთ ინფორმაცია review-ზე." /> : null}{user?.role === "admin" ? <><WorkspaceSection title="უსაფრთხოების ზღვარი" description="Review და promotion არის ადმინისტრაციული ოპერაცია. გადახდა, recurring subscription, ფასის გამოთვლა და თანხის ჩამოჭრა ამ კონსოლში განზრახ არ არსებობს."><div className="grid gap-3 md:grid-cols-3"><AdminFact icon={<ShieldCheck />} title="ცალკე platform role" body="`users.role=admin` საჭიროა; salon OWNER საკმარისი არ არის." /><AdminFact icon={<CreditCard />} title="გადახდა გამორთულია" body="სქემა ინახავს მხოლოდ audit-ready reference ველებს. checkout და capture არ იძახება." /><AdminFact icon={<CalendarClock />} title="დროის ზღვარი" body="Public highlight ჩანს მხოლოდ აქტიური date range-ისას; ვადაგასული promotion არ ჩანს." /></div></WorkspaceSection><WorkspaceSection title="Listing review queue" description="გამოიყენეთ მოკლე, ფაქტობრივი review note. listing-ის approval არ ცვლის მისამართს ან map consent-ს."><div className="flex flex-wrap items-center gap-3"><Label htmlFor="admin-marketplace-status" className="text-sm">სტატუსი</Label><select id="admin-marketplace-status" className="h-10 rounded-md border bg-background px-3 text-sm" value={status ?? "ALL"} onChange={event => setStatus(event.target.value === "ALL" ? undefined : event.target.value as ListingStatus)}><option value="ALL">ყველა სტატუსი</option><option value="SUBMITTED">განხილვაზეა</option><option value="APPROVED">დამტკიცებულია</option><option value="REJECTED">დასაზუსტებელია</option><option value="HIDDEN">დამალულია</option><option value="DRAFT">მოსამზადებელია</option></select><span className="text-xs text-muted-foreground">{queue.data?.items.length ?? 0} ჩანაწერი</span></div>{queue.isLoading ? <WorkspaceState kind="loading" title="Review queue იტვირთება…" /> : null}{queue.isError ? <WorkspaceState kind="error" title="Review queue ახლა მიუწვდომელია" description="სცადეთ მოგვიანებით." /> : null}{!queue.isLoading && !queue.isError && !queue.data?.items.length ? <WorkspaceState kind="empty" title="ამ სტატუსით listing არ არის" /> : null}<div className="mt-4 grid gap-4">{queue.data?.items.map(listing => { const draft = getDraft(listing.locationId); return <article key={listing.locationId} className="rounded-2xl border bg-muted/10 p-4"><div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start"><div><div className="flex flex-wrap items-center gap-2"><h2 className="font-semibold">{listing.locationName}</h2><WorkspaceStatusPill tone={listingStatusTone(listing.listingStatus as ListingStatus)}>{listingStatusLabel(listing.listingStatus as ListingStatus)}</WorkspaceStatusPill>{listing.mapVisibility ? <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">რუკის consent</span> : null}</div><p className="mt-1 text-sm text-muted-foreground">{listing.organizationName} · /salon/{listing.publicSlug}</p><p className="mt-1 text-xs text-muted-foreground">გაგზავნილია: {formatDate(listing.ownerSubmittedAt)} · დამტკიცებულია: {formatDate(listing.approvedAt)}</p></div></div><div className="mt-4 grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto]"><Input value={notes[listing.locationId] ?? listing.reviewNoteKa ?? ""} onChange={event => setNotes(current => ({ ...current, [listing.locationId]: event.target.value }))} placeholder="მოკლე review შენიშვნა (არასავალდებულო)" maxLength={500} /><div className="flex flex-wrap gap-2"><Button size="sm" onClick={() => review.mutate({ locationId: listing.locationId, status: "APPROVED", reviewNoteKa: notes[listing.locationId] || undefined })} disabled={review.isPending}><BadgeCheck className="mr-1.5 size-4" />დამტკიცება</Button><Button size="sm" variant="outline" onClick={() => review.mutate({ locationId: listing.locationId, status: "HIDDEN", reviewNoteKa: notes[listing.locationId] || undefined })} disabled={review.isPending}><EyeOff className="mr-1.5 size-4" />დამალვა</Button><Button size="sm" variant="outline" onClick={() => review.mutate({ locationId: listing.locationId, status: "REJECTED", reviewNoteKa: notes[listing.locationId] || undefined })} disabled={review.isPending}><XCircle className="mr-1.5 size-4" />დასაზუსტებელი</Button></div></div>{listing.listingStatus === "APPROVED" ? <div className="mt-5 rounded-xl border bg-background/60 p-3"><div className="flex flex-wrap items-center justify-between gap-3"><div><h3 className="flex items-center gap-2 text-sm font-semibold"><Star className="size-4 text-[var(--sf-amber)]" />Recommendation / VIP schedule</h3><p className="mt-1 text-xs text-muted-foreground">საჯარო label ყოველთვის არის „რეკომენდებული“ ან „VIP / რეკლამა“. იგი არ ნიშნავს რეიტინგს; ერთი სალონის გადაფარული პერიოდები იკრძალება.</p></div></div><div className="mt-3 grid gap-3 md:grid-cols-3"><label className="space-y-1"><span className="text-xs font-medium">განთავსება</span><select className="h-10 w-full rounded-md border bg-background px-3 text-sm" value={draft.tier} onChange={event => updateDraft(listing.locationId, { tier: event.target.value as PromotionDraft["tier"] })}><option value="RECOMMENDED">რეკომენდებული</option><option value="VIP">VIP / რეკლამა</option></select></label><label className="space-y-1"><span className="text-xs font-medium">დაწყება</span><Input type="datetime-local" value={draft.startsAt} onChange={event => updateDraft(listing.locationId, { startsAt: event.target.value })} /></label><label className="space-y-1"><span className="text-xs font-medium">დასრულება</span><Input type="datetime-local" value={draft.endsAt} onChange={event => updateDraft(listing.locationId, { endsAt: event.target.value })} /></label></div><div className="mt-3 flex flex-wrap items-center gap-3"><Button size="sm" onClick={() => schedule.mutate({ locationId: listing.locationId, tier: draft.tier, startsAt: new Date(draft.startsAt), endsAt: new Date(draft.endsAt) })} disabled={schedule.isPending || !draft.startsAt || !draft.endsAt}><CalendarClock className="mr-1.5 size-4" />{schedule.isPending ? "ინახება…" : "დაგეგმვა"}</Button><span className="text-xs text-muted-foreground">არ არსებობს payment form ან pricing control.</span></div>{listing.promotions.length ? <div className="mt-4 space-y-2">{listing.promotions.map(promotion => <div key={promotion.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-muted/20 px-3 py-2 text-sm"><span><strong>{promotion.displayDisclosure}</strong> · {formatDate(promotion.startsAt)} — {formatDate(promotion.endsAt)} · <span className="text-muted-foreground">{promotion.effectiveStatus}</span></span>{promotion.effectiveStatus === "SCHEDULED" || promotion.effectiveStatus === "ACTIVE" ? <Button type="button" size="sm" variant="outline" onClick={() => cancelPromotion.mutate({ promotionId: promotion.id })} disabled={cancelPromotion.isPending}><Ban className="mr-1.5 size-3.5" />გაუქმება</Button> : null}</div>)}</div> : null}</div> : null}</article>; })}</div></WorkspaceSection></> : null}</main></DashboardLayout>;
}

function AdminFact({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) { return <article className="rounded-2xl border bg-muted/10 p-4"><span className="text-primary">{icon}</span><h2 className="mt-3 text-sm font-semibold">{title}</h2><p className="mt-1 text-sm leading-6 text-muted-foreground">{body}</p></article>; }
