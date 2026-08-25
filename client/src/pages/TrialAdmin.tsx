import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { WorkspacePageHeader, WorkspaceSection, WorkspaceState } from "@/components/workspace/WorkspacePrimitives";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { BadgeCheck, CheckCircle2, MessageCircle, Search, ShieldCheck, XCircle } from "lucide-react";
import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useLocation } from "wouter";

type TrialStatus = "PENDING" | "APPROVED" | "REJECTED" | "EXPIRED" | "CANCELLED";
type ApprovalFeedback = { expiresAt: Date | null };
function formatDate(value: Date | null) { return value ? new Date(value).toLocaleString("ka-GE", { dateStyle: "medium", timeStyle: "short" }) : "—"; }
function label(status: TrialStatus) { return status === "PENDING" ? "მოლოდინში" : status === "APPROVED" ? "აქტიური" : status === "REJECTED" ? "უარყოფილი" : status === "EXPIRED" ? "ვადაგასული" : "გაუქმებული"; }

export default function TrialAdmin() {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();
  const [status, setStatus] = useState<TrialStatus | undefined>("PENDING");
  const [searchText, setSearchText] = useState("");
  const deferredSearch = useDeferredValue(searchText.trim());
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [approvalFeedback, setApprovalFeedback] = useState<ApprovalFeedback | null>(null);
  const input = useMemo(() => ({ limit: 100, offset: 0, status, search: deferredSearch || undefined }), [deferredSearch, status]);
  const queue = trpc.trialAccess.adminList.useQuery(input, { enabled: user?.role === "admin" });
  const decide = trpc.trialAccess.adminDecide.useMutation({
    onSuccess: async outcome => {
      await utils.trialAccess.adminList.invalidate();
      if (outcome.status === "APPROVED") {
        setApprovalFeedback({ expiresAt: outcome.expiresAt });
        toast.success("7-დღიანი საცდელი წვდომა გააქტიურდა.", { description: `წვდომა აქტიურია ${formatDate(outcome.expiresAt)}-მდე.` });
      } else {
        toast.success("მოთხოვნა უარყოფილია.");
      }
    },
    onError: error => toast.error(error.message),
  });
  const hasFilters = Boolean(deferredSearch || status);
  useEffect(() => {
    if (!loading && user && user.role !== "admin") setLocation("/app/today");
  }, [loading, setLocation, user]);
  if (loading || !user || user.role !== "admin") return <DashboardLayout><main className="sf-workspace-page mx-auto w-full max-w-6xl"><WorkspaceState kind="loading" title="თქვენს სამუშაო სივრცეში გადამისამართება…" /></main></DashboardLayout>;
  return <DashboardLayout><main className="sf-workspace-page mx-auto w-full max-w-6xl space-y-5"><WorkspacePageHeader eyebrow="PLATFORM ADMIN" title="საცდელი წვდომის მოთხოვნები" description="ეს queue ეკუთვნის მხოლოდ SalonFlow platform admin-ს. განაცხადი ავტომატურად არ მოწმდება და approval ქმნის მხოლოდ 7-დღიან საცდელ entitlement-ს." /><WorkspaceSection title="უსაფრთხო წესები" description="Facebook-ზე წერილი შეიძლება დაგეხმაროთ განაცხადის იდენტიფიცირებაში, მაგრამ მხოლოდ თქვენ იღებთ გადაწყვეტილებას კონსოლში."><div className="grid gap-3 md:grid-cols-3"><Fact icon={<ShieldCheck />} title="არ არის ავტომატური ვერიფიკაცია" body="Pending სტატუსი არ ხსნის workspace-ს." /><Fact icon={<BadgeCheck />} title="ზუსტად 7 დღე" body="Approve ღილაკი ითვლის 7 დღეს მიმდინარე მომენტიდან." /><Fact icon={<MessageCircle />} title="Facebook contact" body={queue.data?.facebookContactUrl ?? "კონტაქტის ბმული იტვირთება…"} /></div></WorkspaceSection>{approvalFeedback ? <section role="status" aria-live="polite" className="flex flex-col gap-3 rounded-2xl border border-[color-mix(in_srgb,var(--sf-jade)_45%,transparent)] bg-[color-mix(in_srgb,var(--sf-jade)_10%,transparent)] p-4 text-sm sm:flex-row sm:items-center sm:justify-between"><div className="flex items-start gap-3"><CheckCircle2 className="mt-0.5 size-5 shrink-0 text-[var(--sf-jade)]" aria-hidden="true" /><div><p className="font-semibold text-foreground">7-დღიანი საცდელი წვდომა წარმატებით გააქტიურდა.</p><p className="mt-1 leading-6 text-muted-foreground">წვდომა აქტიურია {formatDate(approvalFeedback.expiresAt)}-მდე. განმცხადებელს ახლა შეუძლია workspace-ის შექმნა.</p></div></div><Button size="sm" variant="outline" onClick={() => setApprovalFeedback(null)}>დახურვა</Button></section> : null}<WorkspaceSection title="განაცხადების queue" description="მოძებნეთ განმცხადებლის სახელით, ელფოსტით, სალონის სახელით ან კოდით და შემდეგ მიიღეთ ხელით გადაწყვეტილება."><div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_13rem_auto] md:items-end"><label className="grid gap-2 text-sm font-medium" htmlFor="trial-request-search"><span>ძებნა</span><div className="relative"><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" /><Input id="trial-request-search" value={searchText} onChange={event => setSearchText(event.target.value)} className="h-10 pl-9" placeholder="სახელი, ელფოსტა ან სალონის კოდი" /></div></label><label className="grid gap-2 text-sm font-medium" htmlFor="trial-request-status"><span>სტატუსი</span><select id="trial-request-status" className="h-10 rounded-md border bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" value={status ?? "ALL"} onChange={event => setStatus(event.target.value === "ALL" ? undefined : event.target.value as TrialStatus)}><option value="PENDING">მოლოდინში</option><option value="APPROVED">აქტიური</option><option value="REJECTED">უარყოფილი</option><option value="EXPIRED">ვადაგასული</option><option value="CANCELLED">გაუქმებული</option><option value="ALL">ყველა</option></select></label>{hasFilters ? <Button type="button" variant="outline" onClick={() => { setSearchText(""); setStatus(undefined); }}>ფილტრების გასუფთავება</Button> : <span className="text-xs text-muted-foreground">{queue.data?.items.length ?? 0} ჩანაწერი</span>}</div><p className="mt-3 text-xs text-muted-foreground" aria-live="polite">{queue.isFetching ? "ძებნა ახლდება…" : `ნაპოვნია ${queue.data?.items.length ?? 0} ჩანაწერი`}</p>{queue.isLoading ? <WorkspaceState kind="loading" title="განაცხადები იტვირთება…" /> : null}{queue.isError ? <WorkspaceState kind="error" title="Queue ახლა მიუწვდომელია" description="სცადეთ მოგვიანებით." /> : null}<div className="mt-4 grid gap-4">{queue.data?.items.map(item => <article key={item.id} className="rounded-2xl border bg-muted/10 p-4"><div className="flex flex-col justify-between gap-3 sm:flex-row"><div><h2 className="font-semibold">{item.requestedSalonName}</h2><p className="mt-1 text-sm text-muted-foreground">{item.applicantName ?? "სახელი არ არის მითითებული"} · {item.applicantEmail ?? "ელფოსტა არ არის მითითებული"}</p><p className="mt-1 text-xs text-muted-foreground">კოდი: <span className="font-mono">{item.requestedSalonSlug}</span> · მოთხოვნა: {formatDate(item.createdAt)}</p>{item.expiresAt ? <p className="mt-1 text-xs text-muted-foreground">ვადა: {formatDate(item.expiresAt)}</p> : null}</div><span className="h-fit rounded-full border px-2.5 py-1 text-xs font-semibold">{label(item.status as TrialStatus)}</span></div>{item.status === "PENDING" ? <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto]"><Input value={notes[item.id] ?? ""} onChange={event => setNotes(current => ({ ...current, [item.id]: event.target.value }))} placeholder="მოკლე შენიშვნა (არასავალდებულო)" maxLength={500} aria-label={`${item.requestedSalonName}-ის შენიშვნა`} /><div className="flex flex-wrap gap-2"><Button size="sm" onClick={() => decide.mutate({ trialRequestId: item.id, decision: "APPROVE", reviewNoteKa: notes[item.id] || undefined })} disabled={decide.isPending}><BadgeCheck className="mr-1.5 size-4" />{decide.isPending ? "მუშავდება…" : "7 დღით დამტკიცება"}</Button><Button size="sm" variant="outline" onClick={() => decide.mutate({ trialRequestId: item.id, decision: "REJECT", reviewNoteKa: notes[item.id] || undefined })} disabled={decide.isPending}><XCircle className="mr-1.5 size-4" />უარყოფა</Button></div></div> : null}</article>)}{!queue.isLoading && !queue.data?.items.length ? <WorkspaceState kind="empty" title={hasFilters ? "ამ ძებნით ან სტატუსით მოთხოვნა არ არის" : "ამ სტატუსით მოთხოვნა არ არის"} description={hasFilters ? "შეცვალეთ ძებნის სიტყვა ან გაასუფთავეთ ფილტრები." : undefined} /> : null}</div></WorkspaceSection></main></DashboardLayout>;
}

function Fact({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) { return <article className="rounded-2xl border bg-muted/10 p-4"><span className="text-primary">{icon}</span><h2 className="mt-3 text-sm font-semibold">{title}</h2><p className="mt-1 break-all text-sm leading-6 text-muted-foreground">{body}</p></article>; }
