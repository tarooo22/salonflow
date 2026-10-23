import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { WorkspacePageHeader, WorkspaceSection, WorkspaceState, WorkspaceStatusPill } from "@/components/workspace/WorkspacePrimitives";
import { AdminVacanciesSection } from "@/components/workspace/AdminVacanciesSection";
import { trpc } from "@/lib/trpc";
import { formatKaDateTime } from "@/lib/presentation";
import { BadgeCheck, Ban, CalendarClock, EyeOff, Star, XCircle } from "lucide-react";
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
  return formatKaDateTime(new Date(value));
}

function listingStatusLabel(status: ListingStatus) {
  return status === "SUBMITTED" ? "განხილვაზეა" : status === "APPROVED" ? "დამტკიცებულია" : status === "HIDDEN" ? "დამალულია" : status === "REJECTED" ? "დასაზუსტებელია" : "მოსამზადებელია";
}

function listingStatusTone(status: ListingStatus) {
  return status === "APPROVED" ? "success" : status === "SUBMITTED" ? "info" : status === "REJECTED" ? "warning" : "neutral";
}

function newPromotionDraft(): PromotionDraft {
  const now = new Date();
  return { tier: "RECOMMENDED", startsAt: formatLocalInput(now), endsAt: formatLocalInput(new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)) };
}

function mediaReadinessLabel(state: string) {
  return state === "COVER_MISSING"
    ? "ტიტულური ფოტო არ არის მითითებული"
    : state === "ALT_MISSING"
      ? "ტიტულური ფოტოს აღწერა არ არის"
      : "ტიტულური ფოტო მითითებულია — გადაამოწმეთ საჯარო გვერდზე";
}

export default function MarketplaceAdmin() {
  const { user, loading } = useAuth();
  const utils = trpc.useUtils();
  const [status, setStatus] = useState<ListingStatus | undefined>();
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [promotionDrafts, setPromotionDrafts] = useState<Record<string, PromotionDraft>>({});
  const queueInput = useMemo(() => ({ limit: 100, offset: 0, status }), [status]);
  const queue = trpc.marketplace.adminListings.useQuery(queueInput, { enabled: user?.role === "admin" });

  const refresh = async () => {
    await Promise.all([
      utils.marketplace.adminListings.invalidate(),
      utils.marketplace.directory.invalidate(),
      utils.marketplace.mapResults.invalidate(),
    ]);
  };
  const review = trpc.marketplace.adminReviewListing.useMutation({
    onSuccess: async () => { await refresh(); toast.success("სტატუსი განახლდა."); },
    onError: error => toast.error(error.message),
  });
  const schedule = trpc.marketplace.schedulePromotion.useMutation({
    onSuccess: async () => { await refresh(); toast.success("განთავსება დაიგეგმა. თანხა არ ჩამოჭრილა."); },
    onError: error => toast.error(error.message),
  });
  const cancelPromotion = trpc.marketplace.cancelPromotion.useMutation({
    onSuccess: async () => { await refresh(); toast.success("განთავსება გაუქმდა."); },
    onError: error => toast.error(error.message),
  });
  const getDraft = (locationId: string) => promotionDrafts[locationId] ?? newPromotionDraft();
  const updateDraft = (locationId: string, patch: Partial<PromotionDraft>) => {
    setPromotionDrafts(current => ({ ...current, [locationId]: { ...getDraft(locationId), ...patch } }));
  };

  return (
    <DashboardLayout>
      <main className="sf-workspace-page mx-auto w-full max-w-7xl space-y-5">
        <WorkspacePageHeader title="კატალოგის მოდერაცია" />
        {loading ? <WorkspaceState kind="loading" title="წვდომა მოწმდება…" /> : null}
        {!loading && user?.role !== "admin" ? <WorkspaceState kind="empty" title="საჭიროა პლატფორმის ადმინისტრატორის წვდომა" /> : null}

        {user?.role === "admin" ? <>
          <AdminVacanciesSection />

          <WorkspaceSection title="პროფილების განხილვა">
            <div className="flex flex-wrap items-center gap-3">
              <Label htmlFor="admin-marketplace-status" className="text-sm">სტატუსი</Label>
              <select id="admin-marketplace-status" className="h-10 rounded-md border bg-background px-3 text-sm" value={status ?? "ALL"} onChange={event => setStatus(event.target.value === "ALL" ? undefined : event.target.value as ListingStatus)}>
                <option value="ALL">ყველა სტატუსი</option>
                <option value="SUBMITTED">განხილვაზეა</option>
                <option value="APPROVED">დამტკიცებულია</option>
                <option value="REJECTED">დასაზუსტებელია</option>
                <option value="HIDDEN">დამალულია</option>
                <option value="DRAFT">მოსამზადებელია</option>
              </select>
              <span className="font-mono text-xs text-muted-foreground">{queue.data?.items.length ?? 0}</span>
            </div>
            {queue.isLoading ? <WorkspaceState kind="loading" title="იტვირთება…" /> : null}
            {queue.isError ? <WorkspaceState kind="error" title="სია მიუწვდომელია" description="სცადეთ მოგვიანებით." /> : null}
            {!queue.isLoading && !queue.isError && !queue.data?.items.length ? <WorkspaceState kind="empty" title="ამ სტატუსით პროფილი არ არის" /> : null}

            <div className="mt-4 grid gap-4">
              {queue.data?.items.map(listing => {
                const draft = getDraft(listing.locationId);
                const mediaIsDeclared = listing.mediaReadiness === "DECLARED";
                return (
                  <article key={listing.locationId} className="rounded-md border p-3">
                    <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="font-semibold">{listing.locationName}</h2>
                          <WorkspaceStatusPill tone={listingStatusTone(listing.listingStatus as ListingStatus)}>{listingStatusLabel(listing.listingStatus as ListingStatus)}</WorkspaceStatusPill>
                          {listing.mapVisibility ? <span className="rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">რუკის თანხმობა</span> : null}
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">{listing.organizationName} · /salon/{listing.publicSlug}</p>
                        <p className="mt-1 text-xs text-muted-foreground">გაგზავნილია: {formatDate(listing.ownerSubmittedAt)} · დამტკიცებულია: {formatDate(listing.approvedAt)}</p>
                      </div>
                    </div>

                    <div className={`mt-3 rounded-md border p-3 ${mediaIsDeclared && listing.publicProfileReady ? "border-[var(--sf-jade)]/30" : "border-[var(--sf-amber)]/40"}`}>
                      <p className="text-xs font-semibold">საჯარო პროფილის მზადყოფნა</p>
                      <p className="mt-1 text-xs text-muted-foreground">მედია: {mediaReadinessLabel(listing.mediaReadiness)}</p>
                      <p className="mt-1 text-xs text-muted-foreground">აღწერა და ჩაწერა: {listing.publicProfileReady ? "მითითებულია" : "ერთ-ერთი ჯერ დასასრულებელია"}</p>
                    </div>

                    <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto]">
                      <Input value={notes[listing.locationId] ?? listing.reviewNoteKa ?? ""} onChange={event => setNotes(current => ({ ...current, [listing.locationId]: event.target.value }))} placeholder="მოკლე შენიშვნა (არასავალდებულო)" maxLength={500} />
                      <div className="flex flex-wrap gap-2">
                        <Button size="sm" onClick={() => review.mutate({ locationId: listing.locationId, status: "APPROVED", reviewNoteKa: notes[listing.locationId] || undefined })} disabled={review.isPending}><BadgeCheck className="mr-1.5 size-4" />დამტკიცება</Button>
                        <Button size="sm" variant="outline" onClick={() => review.mutate({ locationId: listing.locationId, status: "HIDDEN", reviewNoteKa: notes[listing.locationId] || undefined })} disabled={review.isPending}><EyeOff className="mr-1.5 size-4" />დამალვა</Button>
                        <Button size="sm" variant="outline" onClick={() => review.mutate({ locationId: listing.locationId, status: "REJECTED", reviewNoteKa: notes[listing.locationId] || undefined })} disabled={review.isPending}><XCircle className="mr-1.5 size-4" />დასაზუსტებელი</Button>
                      </div>
                    </div>

                    {listing.listingStatus === "APPROVED" ? <div className="mt-4 rounded-md border p-3">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <h3 className="flex items-center gap-2 text-sm font-semibold"><Star className="size-4 text-[var(--sf-amber)]" />რეკომენდაცია / VIP გრაფიკი</h3>
                          <p className="mt-1 text-xs text-muted-foreground">საჯარო ნიშანი: „რეკომენდებული“ ან „VIP / რეკლამა“. პერიოდები არ უნდა გადაიფაროს.</p>
                        </div>
                      </div>
                      <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
                        <label className="space-y-1"><span className="text-xs font-medium">განთავსება</span><select className="h-10 w-full rounded-md border bg-background px-3 text-sm" value={draft.tier} onChange={event => updateDraft(listing.locationId, { tier: event.target.value as PromotionDraft["tier"] })}><option value="RECOMMENDED">რეკომენდებული</option><option value="VIP">VIP / რეკლამა</option></select></label>
                        <label className="space-y-1"><span className="text-xs font-medium">დაწყება</span><Input type="datetime-local" value={draft.startsAt} onChange={event => updateDraft(listing.locationId, { startsAt: event.target.value })} /></label>
                        <label className="space-y-1"><span className="text-xs font-medium">დასრულება</span><Input type="datetime-local" value={draft.endsAt} onChange={event => updateDraft(listing.locationId, { endsAt: event.target.value })} /></label>
                      </div>
                      <div className="mt-3 flex flex-wrap items-center gap-3"><Button size="sm" onClick={() => schedule.mutate({ locationId: listing.locationId, tier: draft.tier, startsAt: new Date(draft.startsAt), endsAt: new Date(draft.endsAt) })} disabled={schedule.isPending || !draft.startsAt || !draft.endsAt}><CalendarClock className="mr-1.5 size-4" />{schedule.isPending ? "ინახება…" : "დაგეგმვა"}</Button></div>
                      {listing.promotions.length ? <div className="mt-4 space-y-2">{listing.promotions.map(promotion => <div key={promotion.id} className="flex flex-wrap items-center justify-between gap-3 rounded-md border px-3 py-2 text-sm"><span><strong>{promotion.displayDisclosure}</strong> · {formatDate(promotion.startsAt)} — {formatDate(promotion.endsAt)} · <span className="text-muted-foreground">{({ SCHEDULED: "დაგეგმილია", ACTIVE: "აქტიურია", EXPIRED: "ვადაგასულია", CANCELLED: "გაუქმებულია" } as Record<string, string>)[promotion.effectiveStatus] ?? promotion.effectiveStatus}</span></span>{promotion.effectiveStatus === "SCHEDULED" || promotion.effectiveStatus === "ACTIVE" ? <Button type="button" size="sm" variant="outline" onClick={() => cancelPromotion.mutate({ promotionId: promotion.id })} disabled={cancelPromotion.isPending}><Ban className="mr-1.5 size-3.5" />გაუქმება</Button> : null}</div>)}</div> : null}
                    </div> : null}
                  </article>
                );
              })}
            </div>
          </WorkspaceSection>
        </> : null}
      </main>
    </DashboardLayout>
  );
}

