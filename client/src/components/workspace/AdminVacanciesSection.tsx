import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { WorkspaceSection, WorkspaceState, WorkspaceStatusPill } from "@/components/workspace/WorkspacePrimitives";
import { dateToLocalInput, localInputToDate, vacancyStatusInfo } from "@/lib/catalogPanel";
import { formatKaDateTime } from "@/lib/presentation";
import { trpc } from "@/lib/trpc";
import { Star } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

/** Platform-admin only: the parent renders it behind the `users.role === "admin"` check; the server enforces adminProcedure. */
export function AdminVacanciesSection() {
  const utils = trpc.useUtils();
  const [vipOnly, setVipOnly] = useState(false);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const list = trpc.vacancies.adminList.useQuery({ limit: 100, offset: 0, vipOnly });
  const setVip = trpc.vacancies.setVip.useMutation({
    onSuccess: async () => { await Promise.all([utils.vacancies.adminList.invalidate(), utils.vacancies.publicVipList.invalidate(), utils.vacancies.publicList.invalidate()]); toast.success("VIP ვადა განახლდა."); },
    onError: error => toast.error(error.message),
  });
  const defaultValue = (days: number) => dateToLocalInput(new Date(Date.now() + days * 24 * 60 * 60 * 1000));

  return (
    <WorkspaceSection title="ვაკანსიები: VIP განთავსება" description="VIP ვაკანსია კატალოგში გამოყოფილია მითითებულ თარიღამდე." action={<Button size="sm" variant={vipOnly ? "default" : "outline"} aria-pressed={vipOnly} onClick={() => setVipOnly(value => !value)}>მხოლოდ VIP</Button>}>
      {list.isLoading ? <WorkspaceState kind="loading" title="იტვირთება…" /> : null}
      {list.isError ? <WorkspaceState kind="error" title="ჩატვირთვა ვერ მოხერხდა" /> : null}
      {list.data?.length === 0 ? <WorkspaceState kind="empty" title="ვაკანსია ვერ მოიძებნა" /> : null}
      <div className="divide-y divide-border">
        {list.data?.map(v => {
          const status = vacancyStatusInfo({ status: v.status, isExpired: v.status === "PUBLISHED" && !!v.expiresAt && new Date(v.expiresAt) <= new Date() });
          const value = drafts[v.id] ?? (v.isVip && v.vipUntil ? dateToLocalInput(new Date(v.vipUntil)) : defaultValue(30));
          const date = localInputToDate(value);
          return <article key={v.id} className="grid gap-3 py-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2"><p className="font-semibold">{v.title}</p><WorkspaceStatusPill tone={status.tone}>{status.label}</WorkspaceStatusPill>{v.isVip ? <WorkspaceStatusPill tone="violet"><Star className="mr-1 inline h-3 w-3" />VIP</WorkspaceStatusPill> : null}</div>
              <p className="mt-1 text-sm text-muted-foreground">{v.businessName} · {v.locationName}{v.isVip && v.vipUntil ? ` · VIP: ${formatKaDateTime(new Date(v.vipUntil))}` : ""}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Input type="datetime-local" aria-label={`VIP ვადა: ${v.title}`} className="w-full sm:w-52" value={value} onChange={event => setDrafts(current => ({ ...current, [v.id]: event.target.value }))} />
              <Button size="sm" disabled={setVip.isPending || !date} onClick={() => date && setVip.mutate({ id: v.id, vipUntil: date })}>VIP-ის მითითება</Button>
              {v.vipUntil ? <Button size="sm" variant="outline" disabled={setVip.isPending} onClick={() => setVip.mutate({ id: v.id, vipUntil: null })}>გაუქმება</Button> : null}
            </div>
          </article>;
        })}
      </div>
    </WorkspaceSection>
  );
}
