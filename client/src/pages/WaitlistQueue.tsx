import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { WorkspacePageHeader, WorkspaceSection, WorkspaceState, WorkspaceStatusPill } from "@/components/workspace/WorkspacePrimitives";
import { formatKaDate } from "@/lib/presentation";
import { trpc } from "@/lib/trpc";
import { CalendarHeart, CheckCircle2, Phone, UserRound } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const labels: Record<string, string> = {
  PENDING: "ახალი",
  CONTACTED: "კონტაქტი შედგა",
  FULFILLED: "შესრულებული",
  CANCELLED: "გაუქმებული",
  EXPIRED: "ვადაგასული",
};

function toneFor(status: string): "warning" | "success" | "neutral" {
  if (status === "PENDING") return "warning";
  if (status === "FULFILLED") return "success";
  return "neutral";
}

export default function WaitlistQueue() {
  const utils = trpc.useUtils();
  const organizations = trpc.organizations.listMine.useQuery();
  const organizationEntry = organizations.data?.[0];
  const organization = organizationEntry?.organization;
  const [status, setStatus] = useState("PENDING");
  const queue = trpc.waitlist.list.useQuery(
    { organizationId: organization?.id ?? "", status: status as "PENDING" },
    { enabled: Boolean(organization?.id) },
  );
  const update = trpc.waitlist.updateStatus.useMutation({
    onSuccess: async () => {
      await utils.waitlist.list.invalidate();
      toast.success("სტატუსი განახლდა.");
    },
    onError: error => toast.error(error.message),
  });
  const canManage = ["OWNER", "MANAGER", "RECEPTIONIST"].includes(organizationEntry?.membership.role ?? "");

  let content: React.ReactNode;
  if (!organization) {
    content = <WorkspaceState kind="empty" title="ჯერ შექმენით სამუშაო სივრცე" />;
  } else if (queue.isLoading) {
    content = <WorkspaceState kind="loading" title="იტვირთება…" />;
  } else if (queue.isError) {
    content = <WorkspaceState kind="error" title="ჩატვირთვა ვერ მოხერხდა" description="შეამოწმეთ კავშირი." />;
  } else {
    content = <WorkspaceSection title={labels[status] ?? status}><div className="space-y-3">{queue.data?.length ? queue.data.map(({ entry, client, location, service, staff }) => <article key={entry.id} className="sf-workspace-record grid gap-4 p-4 lg:grid-cols-[minmax(0,1fr)_auto]"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><WorkspaceStatusPill tone={toneFor(entry.status)}>{labels[entry.status] ?? entry.status}</WorkspaceStatusPill><span className="font-mono text-xs text-[var(--sf-muted)]">{formatKaDate(entry.requestedDate)}</span></div><h2 className="mt-2 text-base font-bold">{service.nameKa} · {location.name}</h2><p className="mt-1 flex items-center gap-2 text-sm text-[var(--sf-muted)]"><UserRound className="size-4" />{client.firstName}{client.lastName ? ` ${client.lastName}` : ""}{staff?.publicDisplayName ? ` · ${staff.publicDisplayName}` : " · ნებისმიერი სპეციალისტი"}</p>{entry.preferredStartLocalTime ? <p className="mt-1 flex items-center gap-2 text-sm text-[var(--sf-muted)]"><CalendarHeart className="size-4" />სასურველი დრო: <span className="font-mono">{entry.preferredStartLocalTime}</span></p> : null}{entry.customerNote ? <p className="mt-3 rounded-md bg-[var(--sf-surface-hover)] p-3 text-sm text-[var(--sf-muted)]">{entry.customerNote}</p> : null}</div><div className="flex flex-wrap items-center gap-2 lg:flex-col lg:items-end"><a className="sf-interactive inline-flex items-center gap-2 rounded-md border border-[var(--sf-line)] px-3 py-2 text-sm font-semibold hover:bg-[var(--sf-surface-hover)]" href={`tel:${client.normalizedPhone ?? ""}`}><Phone className="size-4" />დარეკვა</a>{canManage && entry.status === "PENDING" ? <Button size="sm" variant="publicSecondary" onClick={() => update.mutate({ organizationId: organization.id, id: entry.id, status: "CONTACTED" })} disabled={update.isPending}><CheckCircle2 className="size-4" />დამუშავებაში</Button> : null}</div></article>) : <WorkspaceState kind="empty" title="ამ სტატუსით მოთხოვნა არ არის" />}</div></WorkspaceSection>;
  }

  return <DashboardLayout><div className="sf-workspace-page"><WorkspacePageHeader title="მოლოდინის სია" description="სტატუსის შეცვლა კლიენტს SMS-ს ან წერილს არ უგზავნის." actions={<Select value={status} onValueChange={setStatus}><SelectTrigger className="w-44"><SelectValue /></SelectTrigger><SelectContent>{Object.entries(labels).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select>} />{content}</div></DashboardLayout>;
}
