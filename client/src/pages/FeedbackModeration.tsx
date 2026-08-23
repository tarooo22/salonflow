import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { WorkspacePageHeader, WorkspaceState, WorkspaceStatusPill } from "@/components/workspace/WorkspacePrimitives";
import { trpc } from "@/lib/trpc";
import { Check, EyeOff, MessageSquareText, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const statusCopy: Record<string, { label: string; tone: "warning" | "success" | "neutral" | "danger" }> = {
  PENDING: { label: "განხილვაზეა", tone: "warning" }, APPROVED: { label: "საჯაროა", tone: "success" }, HIDDEN: { label: "დამალულია", tone: "neutral" }, REJECTED: { label: "უარყოფილია", tone: "danger" },
};

export default function FeedbackModeration() {
  const utils = trpc.useUtils();
  const organizations = trpc.organizations.listMine.useQuery();
  const entry = organizations.data?.[0];
  const allowed = entry?.membership.role === "OWNER" || entry?.membership.role === "MANAGER";
  const [status, setStatus] = useState<"PENDING" | "APPROVED" | "HIDDEN" | "REJECTED">("PENDING");
  const list = trpc.feedback.listForModeration.useQuery({ organizationId: entry?.organization.id ?? "pending-org", status, limit: 100, offset: 0 }, { enabled: Boolean(entry && allowed) });
  const moderate = trpc.feedback.moderate.useMutation({
    onSuccess: async () => { toast.success("შეფასების სტატუსი განახლდა."); await utils.feedback.listForModeration.invalidate(); },
    onError: error => toast.error(error.message),
  });
  const statusItem = (value: string) => statusCopy[value] ?? statusCopy.PENDING;

  return <DashboardLayout><div className="sf-workspace-page mx-auto w-full max-w-6xl space-y-5"><WorkspacePageHeader eyebrow="საჯარო პროფილი" title="კლიენტების შეფასებები" description="აქ ჩანს მხოლოდ დასრულებული ვიზიტიდან მიღებული უკუკავშირი. გამოქვეყნებამდე ყველა ჩანაწერი უნდა განიხილოთ." actions={<Select value={status} onValueChange={value => setStatus(value as typeof status)}><SelectTrigger className="w-44 bg-card" aria-label="შეფასების სტატუსი"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="PENDING">განხილვაზეა</SelectItem><SelectItem value="APPROVED">საჯაროა</SelectItem><SelectItem value="HIDDEN">დამალულია</SelectItem><SelectItem value="REJECTED">უარყოფილია</SelectItem></SelectContent></Select>} />
    {organizations.isLoading ? <WorkspaceState kind="loading" title="მოდერაციის queue იტვირთება…" /> : null}
    {!organizations.isLoading && (!entry || !allowed) ? <WorkspaceState kind="error" title="ამ გვერდის ნახვის უფლება არ გაქვთ" description="შეფასებების მოდერაცია მხოლოდ მფლობელს ან მენეჯერს შეუძლია." /> : null}
    {allowed && list.isLoading ? <WorkspaceState kind="loading" title="შეფასებები იტვირთება…" /> : null}
    {allowed && list.isError ? <WorkspaceState kind="error" title="შეფასებების ჩატვირთვა ვერ მოხერხდა" description="შეამოწმეთ კავშირი და სცადეთ ხელახლა." action={<Button variant="outline" onClick={() => void list.refetch()}>განახლება</Button>} /> : null}
    {allowed && !list.isLoading && !list.isError && !list.data?.length ? <WorkspaceState kind="empty" title="ამ სტატუსით შეფასება არ არის" description="ახალი შეფასება ჩნდება მხოლოდ დასრულებული ვიზიტის კლიენტის რეალური უკუკავშირიდან." /> : null}
    {list.data?.map(item => { const current = statusItem(item.status); return <article key={item.id} className="rounded-2xl border border-border/80 bg-card p-5 shadow-sm"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="font-semibold">{item.locationName}</p><p className="mt-1 text-sm text-muted-foreground">შიდა იდენტიფიკაცია: {item.clientFirstName}</p></div><WorkspaceStatusPill tone={current.tone}>{current.label}</WorkspaceStatusPill></div><div className="mt-4 flex items-center gap-1 text-amber-500" aria-label={`${item.rating} / 5`}>{Array.from({ length: 5 }, (_, index) => <span key={index} aria-hidden="true">{index < item.rating ? "★" : "☆"}</span>)}<span className="ml-2 text-sm font-semibold text-foreground">{item.rating}/5</span></div><p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">{item.comment}</p><p className="mt-3 text-xs text-muted-foreground">{new Intl.DateTimeFormat("ka-GE", { dateStyle: "medium", timeStyle: "short" }).format(new Date(item.submittedAt))}</p><div className="mt-5 flex flex-wrap gap-2"><Button size="sm" onClick={() => moderate.mutate({ organizationId: entry!.organization.id, feedbackId: item.id, status: "APPROVED" })} disabled={moderate.isPending}><Check className="mr-1.5 size-4" />გამოქვეყნება</Button><Button size="sm" variant="outline" onClick={() => moderate.mutate({ organizationId: entry!.organization.id, feedbackId: item.id, status: "HIDDEN" })} disabled={moderate.isPending}><EyeOff className="mr-1.5 size-4" />დამალვა</Button><Button size="sm" variant="outline" className="border-destructive/35 text-destructive hover:bg-destructive/10" onClick={() => moderate.mutate({ organizationId: entry!.organization.id, feedbackId: item.id, status: "REJECTED" })} disabled={moderate.isPending}><X className="mr-1.5 size-4" />უარყოფა</Button></div></article>; })}
  </div></DashboardLayout>;
}
