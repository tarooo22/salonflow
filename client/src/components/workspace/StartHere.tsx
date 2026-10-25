import { Ring } from "@/components/brand/Ring";
import { Button } from "@/components/ui/button";
import { WorkspaceStatusPill } from "@/components/workspace/WorkspacePrimitives";
import { trpc } from "@/lib/trpc";
import { Check, ChevronRight, Clock, Copy, ExternalLink, Info } from "lucide-react";
import React, { useState } from "react";
import { Link } from "wouter";
import { toast } from "sonner";

/* Flags kept on this device only. Storage can be blocked (private mode), so every access is guarded. */
function readFlag(key: string) {
  try { return localStorage.getItem(key) === "1"; } catch { return false; }
}
function writeFlag(key: string) {
  try { localStorage.setItem(key, "1"); } catch { /* not remembered, still works for this visit */ }
}
function useDeviceFlag(key: string) {
  const [value, setValue] = useState(() => readFlag(key));
  return [value, () => { writeFlag(key); setValue(true); }] as const;
}

export const startHereKeys = {
  tried: (organizationId: string) => `chawera.starthere.tried.${organizationId}`,
  hidden: (organizationId: string) => `chawera.starthere.hidden.${organizationId}`,
  staffTip: (organizationId: string) => `chawera.staff.tip.${organizationId}`,
};

async function copyBookingLink(slug: string) {
  try {
    await navigator.clipboard.writeText(`${window.location.origin}/book/${slug}`);
    toast.success("ჩაწერის ბმული დაკოპირდა.");
  } catch {
    toast.error("ბმულის დაკოპირება ვერ მოხერხდა.");
  }
}

type StartHereProps = {
  organizationId: string;
  locationId: string;
  publicSlug?: string | null;
  servicesDone: boolean;
  teamDone: boolean;
  hoursDone: boolean;
};

/** Owner checklist "დაიწყეთ აქ": five steps, always all listed, progress visible. Self-hides once finished and dismissed. */
export function StartHere({ organizationId, locationId, publicSlug, servicesDone, teamDone, hoursDone }: StartHereProps) {
  const [tried, markTried] = useDeviceFlag(startHereKeys.tried(organizationId));
  const [hidden, hide] = useDeviceFlag(startHereKeys.hidden(organizationId));
  const listing = trpc.marketplace.getOwnListing.useQuery({ organizationId, locationId }, { enabled: Boolean(organizationId && locationId) });
  if (hidden || listing.isLoading) return null;

  const listingStatus = listing.data?.profile?.status;
  const catalogDone = listingStatus === "APPROVED";
  const catalogPending = listingStatus === "SUBMITTED";
  const done = [servicesDone, teamDone, hoursDone, tried, catalogDone];
  const doneCount = done.filter(Boolean).length;

  if (doneCount === 5) {
    return <section aria-label="დაიწყეთ აქ" className="cwk-sheet flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3">
      <span className="grid size-7 shrink-0 place-items-center rounded-full bg-[var(--sf-success-soft)] text-[var(--sf-success)]"><Check className="size-4" aria-hidden="true" /></span>
      <p className="min-w-0 flex-1 text-sm font-semibold basis-60">ყველაფერი მზადაა. კლიენტებს უკვე შეუძლიათ ონლაინ ჩაწერა.</p>
      <div className="flex gap-2">
        {publicSlug ? <Button type="button" variant="outline" size="sm" className="max-md:h-11" onClick={() => void copyBookingLink(publicSlug)}><Copy className="size-4" aria-hidden="true" />ბმულის კოპირება</Button> : null}
        <Button type="button" variant="ghost" size="sm" className="max-md:h-11" onClick={hide}>დამალვა</Button>
      </div>
    </section>;
  }

  const rows: Array<{ key: string; title: string; done: boolean; href?: string; pending?: boolean }> = [
    { key: "services", title: "დაამატეთ სერვისები და ფასები", done: servicesDone, href: "/app/services" },
    { key: "team", title: "დაამატეთ გუნდი", done: teamDone, href: "/app/staff" },
    { key: "hours", title: "მიუთითეთ სამუშაო საათები", done: hoursDone, href: "/app/staff" },
    { key: "try", title: "გახსენით ჩაწერის გვერდი და სცადეთ", done: tried },
    { key: "catalog", title: "გამოჩნდით კატალოგში", done: catalogDone, href: "/app/marketplace", pending: catalogPending },
  ];

  return <section aria-label="დაიწყეთ აქ" className="cwk-sheet">
    <div className="cwk-sheet-head">
      <div className="min-w-0"><h2 className="cwk-sheet-title">დაიწყეთ აქ</h2><p className="cwk-sheet-desc">ხუთი ნაბიჯი და კლიენტები ონლაინ ჩაგეწერებიან.</p></div>
      <WorkspaceStatusPill tone="count"><span className="cwk-num">{doneCount} / 5</span>&nbsp;მზადაა</WorkspaceStatusPill>
    </div>
    <ol className="divide-y divide-border">{rows.map((row, index) => <li key={row.key} className="relative flex min-h-14 flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3 transition-colors has-[a.cwk-steplink]:hover:bg-[var(--sf-surface-2)]">
      <span className={`cwk-num relative grid size-7 shrink-0 place-items-center rounded-full text-sm font-bold ${row.done ? "bg-[var(--sf-accent-soft)] text-[var(--sf-accent-ink)]" : "border border-border text-muted-foreground"}`} aria-hidden="true">{index + 1}{row.done ? <Ring variant="square" /> : null}</span>
      <div className="min-w-[7rem] flex-1 basis-0">
        {row.href
          ? <Link href={row.href} className="cwk-steplink block rounded-sm text-sm font-semibold after:absolute after:inset-0 after:content-[''] focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-inset focus-visible:after:ring-[var(--sf-focus)]">{row.title}</Link>
          : <p className="text-sm font-semibold">{row.title}</p>}
      </div>
      {row.done
        ? <WorkspaceStatusPill tone="success"><Check aria-hidden="true" />მზადაა</WorkspaceStatusPill>
        : row.pending
          ? <WorkspaceStatusPill tone="warning"><Clock aria-hidden="true" />განხილვაშია</WorkspaceStatusPill>
          : row.href ? <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" /> : null}
      {row.key === "try" ? (publicSlug
        ? <div className="relative z-10 flex w-full flex-wrap gap-2 pl-10 sm:w-auto sm:pl-0">
            <Button asChild variant="outline" size="sm" className="max-md:h-11"><a href={`/book/${publicSlug}`} target="_blank" rel="noopener noreferrer" onClick={markTried}><ExternalLink className="size-4" aria-hidden="true" />გახსნა</a></Button>
            <Button type="button" variant="ghost" size="sm" className="max-md:h-11" onClick={() => void copyBookingLink(publicSlug)}><Copy className="size-4" aria-hidden="true" />ბმულის კოპირება</Button>
          </div>
        : <div className="relative z-10 flex w-full flex-wrap items-center gap-2 pl-10 sm:w-auto sm:pl-0">
            <Button type="button" variant="outline" size="sm" className="max-md:h-11" disabled>გახსნა</Button>
            <span className="text-xs text-muted-foreground">ბმული ჯერ არ არის. <Link href="/app/settings" className="font-semibold text-foreground underline underline-offset-2">პარამეტრები</Link></span>
          </div>) : null}
    </li>)}</ol>
  </section>;
}

/** One-time hint for STAFF, remembered per organization on this device. */
export function StaffTip({ organizationId }: { organizationId: string }) {
  const [seen, markSeen] = useDeviceFlag(startHereKeys.staffTip(organizationId));
  if (seen) return null;
  return <section aria-label="რჩევა" className="cwk-sheet flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3">
    <Info className="size-4 shrink-0 text-[var(--sf-accent-ink)]" aria-hidden="true" />
    <p className="min-w-0 flex-1 basis-60 text-sm">აქ ჩანს თქვენი დღევანდელი ჯავშნები. სტატუსის შესაცვლელად დააჭირეთ ჯავშანს.</p>
    <Button type="button" variant="outline" size="sm" className="max-md:h-11" onClick={markSeen}>გასაგებია</Button>
  </section>;
}
