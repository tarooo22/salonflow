import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { WorkspacePageHeader, WorkspaceState, WorkspaceStatusPill } from "@/components/workspace/WorkspacePrimitives";
import { trpc } from "@/lib/trpc";
import { Check, CircleAlert, MessageSquareText, ShieldAlert } from "lucide-react";
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
    onSuccess: async () => { toast.success("შეფასება გამოქვეყნდა როგორც დასრულებული ვიზიტის უკუკავშირი."); await utils.feedback.listForModeration.invalidate(); },
    onError: error => toast.error(error.message),
  });
  const requestPlatformReview = trpc.feedback.requestPlatformReview.useMutation({
    onSuccess: async () => { toast.success("Platform review მოთხოვნა გაიგზავნა."); setReviewTarget(null); setNote(""); await utils.feedback.listForModeration.invalidate(); },
    onError: error => toast.error(error.message),
  });
  const statusItem = (value: string) => statusCopy[value] ?? statusCopy.PENDING;
  const closeDialog = (open: boolean) => { if (!open && !requestPlatformReview.isPending) setReviewTarget(null); };
  const submitEscalation = () => {
    if (!entry || !reviewTarget) return;
    requestPlatformReview.mutate({ organizationId: entry.organization.id, feedbackId: reviewTarget.id, reason, note: note.trim() || undefined });
  };

  return <DashboardLayout><div className="sf-workspace-page mx-auto w-full max-w-6xl space-y-5"><WorkspacePageHeader eyebrow="საჯარო პროფილი" title="კლიენტების შეფასებები" description="მხოლოდ დასრულებული ვიზიტის კლიენტს შეუძლია შეფასების დატოვება. სალონი აქვეყნებს ნამდვილ უკუკავშირს; დამალვა ან უარყოფა საჭიროებს platform review-ს." actions={<Select value={status} onValueChange={value => setStatus(value as typeof status)}><SelectTrigger className="w-44 bg-card" aria-label="შეფასების სტატუსი"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="PENDING">განხილვაზეა</SelectItem><SelectItem value="APPROVED">საჯაროა</SelectItem><SelectItem value="HIDDEN">დამალულია</SelectItem><SelectItem value="REJECTED">უარყოფილია</SelectItem></SelectContent></Select>} />
    <section className="rounded-2xl border border-primary/15 bg-primary/5 p-4 text-sm text-muted-foreground"><div className="flex gap-3"><ShieldAlert className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" /><p><strong className="text-foreground">რეალური შეფასების პოლიტიკა.</strong> შეფასება არ იქმნება ხელოვნურად და არ რედაქტირდება სალონის მიერ. შეურაცხყოფის, პერსონალური მონაცემის, სპამის ან უსაფრთხოების საკითხისას გადაუგზავნეთ ის SalonFlow-ის platform review queue-ს.</p></div></section>
    {organizations.isLoading ? <WorkspaceState kind="loading" title="მოდერაციის queue იტვირთება…" /> : null}
    {!organizations.isLoading && (!entry || !allowed) ? <WorkspaceState kind="error" title="ამ გვერდის ნახვის უფლება არ გაქვთ" description="შეფასებების გამოქვეყნება და platform review მხოლოდ მფლობელს ან მენეჯერს შეუძლია." /> : null}
    {allowed && list.isLoading ? <WorkspaceState kind="loading" title="შეფასებები იტვირთება…" /> : null}
    {allowed && list.isError ? <WorkspaceState kind="error" title="შეფასებების ჩატვირთვა ვერ მოხერხდა" description="შეამოწმეთ კავშირი და სცადეთ ხელახლა." action={<Button variant="outline" onClick={() => void list.refetch()}>განახლება</Button>} /> : null}
    {allowed && !list.isLoading && !list.isError && !list.data?.length ? <WorkspaceState kind="empty" title="ამ სტატუსით შეფასება არ არის" description="ახალი შეფასება ჩნდება მხოლოდ დასრულებული ვიზიტის კლიენტის რეალური უკუკავშირიდან." /> : null}
    {list.data?.map(item => { const current = statusItem(item.status); return <article key={item.id} className="rounded-2xl border border-border/80 bg-card p-5 shadow-sm"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="font-semibold">{item.locationName}</p><p className="mt-1 text-sm text-muted-foreground">შიდა იდენტიფიკაცია: {item.clientFirstName}</p></div><div className="flex flex-wrap items-center gap-2"><WorkspaceStatusPill tone={current.tone}>{current.label}</WorkspaceStatusPill>{item.platformReviewOpen ? <WorkspaceStatusPill tone="neutral">Platform review-ზეა</WorkspaceStatusPill> : null}</div></div><div className="mt-4 flex items-center gap-1 text-amber-500" aria-label={`${item.rating} / 5`}>{Array.from({ length: 5 }, (_, index) => <span key={index} aria-hidden="true">{index < item.rating ? "★" : "☆"}</span>)}<span className="ml-2 text-sm font-semibold text-foreground">{item.rating}/5</span></div><p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">{item.comment}</p><p className="mt-3 text-xs text-muted-foreground">{new Intl.DateTimeFormat("ka-GE", { dateStyle: "medium", timeStyle: "short" }).format(new Date(item.submittedAt))}</p>{item.moderationNote ? <p className="mt-3 rounded-xl bg-muted/60 p-3 text-xs text-muted-foreground">Platform decision: {item.moderationNote}</p> : null}<div className="mt-5 flex flex-wrap gap-2">{item.status === "PENDING" && !item.platformReviewOpen ? <Button size="sm" onClick={() => publish.mutate({ organizationId: entry!.organization.id, feedbackId: item.id })} disabled={publish.isPending}><Check className="mr-1.5 size-4" />გამოქვეყნება</Button> : null}{!item.platformReviewOpen && item.status !== "REJECTED" ? <Button size="sm" variant="outline" onClick={() => setReviewTarget({ id: item.id, locationName: item.locationName })} disabled={requestPlatformReview.isPending}><MessageSquareText className="mr-1.5 size-4" />Platform review</Button> : null}{item.platformReviewOpen ? <span className="inline-flex min-h-9 items-center gap-1.5 px-1 text-sm text-muted-foreground"><CircleAlert className="size-4" aria-hidden="true" />მოთხოვნა გაგზავნილია</span> : null}</div></article>; })}
  </div><Dialog open={Boolean(reviewTarget)} onOpenChange={closeDialog}><DialogContent><DialogHeader><DialogTitle>Platform review მოთხოვნა</DialogTitle><DialogDescription>{reviewTarget?.locationName} — მიუთითეთ მხოლოდ რეალური moderation მიზეზი. პლატფორმა მიიღებს საბოლოო გადაწყვეტილებას და შეინახავს audit ჩანაწერს.</DialogDescription></DialogHeader><div className="space-y-4"><div className="space-y-2"><Label htmlFor="feedback-escalation-reason">მიზეზი</Label><Select value={reason} onValueChange={value => setReason(value as typeof reason)}><SelectTrigger id="feedback-escalation-reason"><SelectValue /></SelectTrigger><SelectContent>{escalationReasons.map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select></div><div className="space-y-2"><Label htmlFor="feedback-escalation-note">მოკლე განმარტება {reason === "OTHER" ? "(აუცილებელია)" : "(არასავალდებულო)"}</Label><Textarea id="feedback-escalation-note" value={note} onChange={event => setNote(event.target.value)} maxLength={500} placeholder="არ შეიყვანოთ ზედმეტი პირადი ან საბანკო მონაცემი." /></div></div><DialogFooter><Button variant="outline" onClick={() => setReviewTarget(null)} disabled={requestPlatformReview.isPending}>გაუქმება</Button><Button onClick={submitEscalation} disabled={requestPlatformReview.isPending || (reason === "OTHER" && !note.trim())}>{requestPlatformReview.isPending ? "იგზავნება…" : "გაგზავნა"}</Button></DialogFooter></DialogContent></Dialog></DashboardLayout>;
}
