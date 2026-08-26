import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { WorkspacePageHeader, WorkspaceState, WorkspaceStatusPill } from "@/components/workspace/WorkspacePrimitives";
import { trpc } from "@/lib/trpc";
import { Check, EyeOff, ShieldCheck, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const reasonCopy: Record<string, string> = {
  HARASSMENT_OR_HATE: "შეურაცხყოფა ან სიძულვილის ენა",
  PERSONAL_DATA: "პირადი მონაცემის გამჟღავნება",
  SPAM_OR_PROMOTION: "სპამი ან გარე რეკლამა",
  CONFLICT_OF_INTEREST: "ინტერესთა კონფლიქტი",
  LEGAL_OR_SAFETY: "სამართლებრივი ან უსაფრთხოების საკითხი",
  OTHER: "სხვა მიზეზი",
};
type DecisionStatus = "APPROVED" | "HIDDEN" | "REJECTED";
type QueueItem = { id: string; organizationName: string; locationName: string; rating: number; comment: string; platformReviewReason: string | null; platformReviewNote: string | null; platformReviewRequestedAt: Date | null } | null;

export default function FeedbackAdmin() {
  const { user, loading } = useAuth();
  const utils = trpc.useUtils();
  const [target, setTarget] = useState<QueueItem>(null);
  const [decision, setDecision] = useState<DecisionStatus>("APPROVED");
  const [note, setNote] = useState("");
  const queue = trpc.feedback.listForPlatformModeration.useQuery({ openOnly: true, limit: 100, offset: 0 }, { enabled: user?.role === "admin" });
  const decide = trpc.feedback.platformDecide.useMutation({
    onSuccess: async () => { toast.success("Platform review გადაწყვეტილება შენახულია."); setTarget(null); setNote(""); await utils.feedback.listForPlatformModeration.invalidate(); },
    onError: error => toast.error(error.message),
  });
  const submit = () => { if (target) decide.mutate({ feedbackId: target.id, status: decision, moderationNote: note.trim() || undefined }); };
  const openDecision = (item: NonNullable<QueueItem>, value: DecisionStatus) => { setTarget(item); setDecision(value); setNote(""); };

  return <DashboardLayout><div className="sf-workspace-page mx-auto w-full max-w-6xl space-y-5"><WorkspacePageHeader eyebrow="Platform ადმინისტრაცია" title="Review moderation" description="Queue შეიცავს მხოლოდ სალონის მიერ დასაბუთებულ escalation-ს დასრულებული ვიზიტის რეალური შეფასებიდან. საბოლოო გადაწყვეტილება audit trail-ში ინახება." />
    {loading ? <WorkspaceState kind="loading" title="Platform წვდომა მოწმდება…" /> : null}
    {!loading && user?.role !== "admin" ? <WorkspaceState kind="error" title="ამ გვერდის ნახვის უფლება არ გაქვთ" description="Review moderation queue ხელმისაწვდომია მხოლოდ SalonFlow platform admin-ისთვის." /> : null}
    {user?.role === "admin" && queue.isLoading ? <WorkspaceState kind="loading" title="Review queue იტვირთება…" /> : null}
    {user?.role === "admin" && queue.isError ? <WorkspaceState kind="error" title="Review queue ვერ ჩაიტვირთა" description="შეამოწმეთ კავშირი და სცადეთ ხელახლა." action={<Button variant="outline" onClick={() => void queue.refetch()}>განახლება</Button>} /> : null}
    {user?.role === "admin" && !queue.isLoading && !queue.isError && !queue.data?.length ? <WorkspaceState kind="empty" title="ღია review მოთხოვნა არ არის" description="ახალი ჩანაწერი ჩნდება მხოლოდ მაშინ, როცა salon owner/manager დასრულებული ვიზიტის ნამდვილ შეფასებას platform review-ზე აგზავნის." /> : null}
    {queue.data?.map(item => <article key={item.id} className="rounded-2xl border border-border/80 bg-card p-5 shadow-sm"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="font-semibold">{item.organizationName}</p><p className="mt-1 text-sm text-muted-foreground">{item.locationName}</p></div><WorkspaceStatusPill tone="warning">გადაწყვეტილება საჭიროა</WorkspaceStatusPill></div><div className="mt-4 flex items-center gap-1 text-amber-500" aria-label={`${item.rating} / 5`}>{Array.from({ length: 5 }, (_, index) => <span key={index} aria-hidden="true">{index < item.rating ? "★" : "☆"}</span>)}<span className="ml-2 text-sm font-semibold text-foreground">{item.rating}/5</span></div><p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">{item.comment}</p><div className="mt-4 rounded-xl border border-border/70 bg-muted/45 p-3 text-sm"><p><strong>მიზეზი:</strong> {reasonCopy[item.platformReviewReason ?? ""] ?? "არ არის მითითებული"}</p>{item.platformReviewNote ? <p className="mt-1 text-muted-foreground">განმარტება: {item.platformReviewNote}</p> : null}</div><div className="mt-5 flex flex-wrap gap-2"><Button size="sm" onClick={() => openDecision(item, "APPROVED")}><Check className="mr-1.5 size-4" />გამოქვეყნებული დარჩეს</Button><Button size="sm" variant="outline" onClick={() => openDecision(item, "HIDDEN")}><EyeOff className="mr-1.5 size-4" />დამალვა</Button><Button size="sm" variant="outline" className="border-destructive/35 text-destructive hover:bg-destructive/10" onClick={() => openDecision(item, "REJECTED")}><X className="mr-1.5 size-4" />უარყოფა</Button></div></article>)}
  </div><Dialog open={Boolean(target)} onOpenChange={open => { if (!open && !decide.isPending) setTarget(null); }}><DialogContent><DialogHeader><DialogTitle>Platform review გადაწყვეტილება</DialogTitle><DialogDescription>დამალვა ან უარყოფა მოითხოვს მოკლე, ფაქტობრივ დასაბუთებას. ეს ტექსტი audit trail-ში შეინახება; საჯარო პროფილზე არ გამოჩნდება.</DialogDescription></DialogHeader><div className="space-y-4"><div className="flex items-center gap-2"><ShieldCheck className="size-5 text-primary" aria-hidden="true" /><span className="text-sm font-medium">გადაწყვეტილება: {decision === "APPROVED" ? "გამოქვეყნებული დარჩეს" : decision === "HIDDEN" ? "დამალვა" : "უარყოფა"}</span></div><div className="space-y-2"><Label htmlFor="platform-review-note">დასაბუთება {decision !== "APPROVED" ? "(აუცილებელია)" : "(არასავალდებულო)"}</Label><Textarea id="platform-review-note" value={note} onChange={event => setNote(event.target.value)} maxLength={500} placeholder="მიუთითეთ მხოლოდ ფაქტობრივი moderation საფუძველი." /></div></div><DialogFooter><Button variant="outline" onClick={() => setTarget(null)} disabled={decide.isPending}>გაუქმება</Button><Button onClick={submit} disabled={decide.isPending || (decision !== "APPROVED" && !note.trim())}>{decide.isPending ? "ინახება…" : "გადაწყვეტილების შენახვა"}</Button></DialogFooter></DialogContent></Dialog></DashboardLayout>;
}
