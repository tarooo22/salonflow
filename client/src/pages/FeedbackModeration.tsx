import DashboardLayout from "@/components/DashboardLayout";
import { OnlinePageTabs } from "@/components/workspace/OnlinePageTabs";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { WorkspacePageHeader, WorkspaceState, WorkspaceStatusPill } from "@/components/workspace/WorkspacePrimitives";
import { trpc } from "@/lib/trpc";
import { formatKaDateTime } from "@/lib/presentation";
import { Check, CircleAlert, MessageSquareText } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const statusCopy: Record<string, { label: string; tone: "warning" | "success" | "neutral" | "danger" }> = {
  PENDING: { label: "განხილვაზეა", tone: "warning" }, APPROVED: { label: "საჯაროა", tone: "success" }, HIDDEN: { label: "დამალულია", tone: "neutral" }, REJECTED: { label: "უარყოფილია", tone: "danger" },
};

const escalationReasons = [
  ["HARASSMENT_OR_HATE", "შეურაცხყოფა ან სიძულვილის ენა"],
  ["PERSONAL_DATA", "პირადი მონაცემის გამჟღავნება"],
  ["SPAM_OR_PROMOTION", "სპამი ან გარე რეკლამა"],
  ["CONFLICT_OF_INTEREST", "ინტერესთა კონფლიქტი"],
  ["LEGAL_OR_SAFETY", "სამართლებრივი ან უსაფრთხოების საკითხი"],
  ["OTHER", "სხვა მიზეზი"],
] as const;

type ReviewTarget = { id: string; locationName: string } | null;

export default function FeedbackModeration() {
  const utils = trpc.useUtils();
  const organizations = trpc.organizations.listMine.useQuery();
  const entry = organizations.data?.[0];
  const allowed = entry?.membership.role === "OWNER" || entry?.membership.role === "MANAGER";
  const [status, setStatus] = useState<"PENDING" | "APPROVED" | "HIDDEN" | "REJECTED">("PENDING");
  const [reviewTarget, setReviewTarget] = useState<ReviewTarget>(null);
  const [reason, setReason] = useState<(typeof escalationReasons)[number][0]>("HARASSMENT_OR_HATE");
  const [note, setNote] = useState("");
  const list = trpc.feedback.listForModeration.useQuery({ organizationId: entry?.organization.id ?? "pending-org", status, limit: 100, offset: 0 }, { enabled: Boolean(entry && allowed) });
  const publish = trpc.feedback.publish.useMutation({
    onSuccess: async () => { toast.success("შეფასება გამოქვეყნდა."); await utils.feedback.listForModeration.invalidate(); },
    onError: error => toast.error(error.message),
  });
  const requestPlatformReview = trpc.feedback.requestPlatformReview.useMutation({
    onSuccess: async () => { toast.success("მოთხოვნა პლატფორმას გაეგზავნა."); setReviewTarget(null); setNote(""); await utils.feedback.listForModeration.invalidate(); },
    onError: error => toast.error(error.message),
  });
  const statusItem = (value: string) => statusCopy[value] ?? statusCopy.PENDING;
  const closeDialog = (open: boolean) => { if (!open && !requestPlatformReview.isPending) setReviewTarget(null); };
  const submitEscalation = () => {
    if (!entry || !reviewTarget) return;
    requestPlatformReview.mutate({ organizationId: entry.organization.id, feedbackId: reviewTarget.id, reason, note: note.trim() || undefined });
  };

  return <DashboardLayout><div className="sf-workspace-page mx-auto w-full max-w-6xl space-y-5"><WorkspacePageHeader title="შეფასებები" description="კლიენტების შეფასებები ვიზიტის შემდეგ." actions={<Select value={status} onValueChange={value => setStatus(value as typeof status)}><SelectTrigger className="w-44 bg-card" aria-label="შეფასების სტატუსი"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="PENDING">განხილვაზეა</SelectItem><SelectItem value="APPROVED">საჯაროა</SelectItem><SelectItem value="HIDDEN">დამალულია</SelectItem><SelectItem value="REJECTED">უარყოფილია</SelectItem></SelectContent></Select>} />
      <OnlinePageTabs />
    {organizations.isLoading ? <WorkspaceState kind="loading" title="იტვირთება…" /> : null}
    {!organizations.isLoading && (!entry || !allowed) ? <WorkspaceState kind="error" title="ამ გვერდის ნახვის უფლება არ გაქვთ" description="ხელმისაწვდომია მფლობელისა და მენეჯერისთვის." /> : null}
    {allowed && list.isLoading ? <WorkspaceState kind="loading" title="იტვირთება…" /> : null}
    {allowed && list.isError ? <WorkspaceState kind="error" title="ჩატვირთვა ვერ მოხერხდა" description="შეამოწმეთ კავშირი." action={<Button variant="outline" onClick={() => void list.refetch()}>განახლება</Button>} /> : null}
    {allowed && !list.isLoading && !list.isError && !list.data?.length ? <WorkspaceState kind="empty" title="ამ სტატუსით შეფასება არ არის" /> : null}
    {list.data?.map(item => { const current = statusItem(item.status); return <article key={item.id} className="rounded-md border border-border bg-card p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="font-semibold">{item.locationName}</p><p className="mt-1 text-sm text-muted-foreground">კლიენტი: {item.clientFirstName}</p></div><div className="flex flex-wrap items-center gap-2"><WorkspaceStatusPill tone={current.tone}>{current.label}</WorkspaceStatusPill>{item.platformReviewOpen ? <WorkspaceStatusPill tone="neutral">პლატფორმას გადაეცა</WorkspaceStatusPill> : null}</div></div><div className="mt-3 flex items-center gap-1 text-[var(--sf-amber)]" aria-label={`${item.rating} / 5`}>{Array.from({ length: 5 }, (_, index) => <span key={index} aria-hidden="true">{index < item.rating ? "★" : "☆"}</span>)}<span className="ml-2 text-sm font-semibold text-foreground">{item.rating}/5</span></div><p className="mt-2 max-w-3xl text-sm text-muted-foreground">{item.comment}</p><p className="mt-2 font-mono text-xs text-muted-foreground">{formatKaDateTime(new Date(item.submittedAt))}</p>{item.moderationNote ? <p className="mt-3 rounded-md bg-muted/60 p-3 text-xs text-muted-foreground">პლატფორმის გადაწყვეტილება: {item.moderationNote}</p> : null}<div className="mt-4 flex flex-wrap gap-2">{item.status === "PENDING" && !item.platformReviewOpen ? <Button size="sm" onClick={() => publish.mutate({ organizationId: entry!.organization.id, feedbackId: item.id })} disabled={publish.isPending}><Check className="mr-1.5 size-4" />გამოქვეყნება</Button> : null}{!item.platformReviewOpen && item.status !== "REJECTED" ? <Button size="sm" variant="outline" onClick={() => setReviewTarget({ id: item.id, locationName: item.locationName })} disabled={requestPlatformReview.isPending}><MessageSquareText className="mr-1.5 size-4" />პლატფორმას გადაცემა</Button> : null}{item.platformReviewOpen ? <span className="inline-flex min-h-9 items-center gap-1.5 px-1 text-sm text-muted-foreground"><CircleAlert className="size-4" aria-hidden="true" />მოთხოვნა გაგზავნილია</span> : null}</div></article>; })}
  </div><Dialog open={Boolean(reviewTarget)} onOpenChange={closeDialog}><DialogContent><DialogHeader><DialogTitle>გადაცემა პლატფორმას</DialogTitle><DialogDescription>{reviewTarget?.locationName} — მიუთითეთ რეალური მიზეზი.</DialogDescription></DialogHeader><div className="space-y-4"><div className="space-y-2"><Label htmlFor="feedback-escalation-reason">მიზეზი</Label><Select value={reason} onValueChange={value => setReason(value as typeof reason)}><SelectTrigger id="feedback-escalation-reason"><SelectValue /></SelectTrigger><SelectContent>{escalationReasons.map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select></div><div className="space-y-2"><Label htmlFor="feedback-escalation-note">მოკლე განმარტება {reason === "OTHER" ? "(აუცილებელია)" : "(არასავალდებულო)"}</Label><Textarea id="feedback-escalation-note" value={note} onChange={event => setNote(event.target.value)} maxLength={500} placeholder="პირადი ან საბანკო მონაცემი არ ჩაწეროთ." /></div></div><DialogFooter><Button variant="outline" onClick={() => setReviewTarget(null)} disabled={requestPlatformReview.isPending}>გაუქმება</Button><Button onClick={submitEscalation} disabled={requestPlatformReview.isPending || (reason === "OTHER" && !note.trim())}>{requestPlatformReview.isPending ? "იგზავნება…" : "გაგზავნა"}</Button></DialogFooter></DialogContent></Dialog></DashboardLayout>;
}
