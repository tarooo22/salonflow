import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { trpc } from "@/lib/trpc";
import { Bell, CheckCircle2, CircleAlert, ExternalLink, X } from "lucide-react";
import React from "react";
import { Link } from "wouter";

type Notice = { key: string; title: string; description: string; href: string; tone: "warning" | "info" };

export function NotificationCenter({ organizationId, notices }: { organizationId: string; notices: Notice[] }) {
  const utils = trpc.useUtils();
  const preferences = trpc.productivity.preferences.useQuery({ organizationId }, { enabled: Boolean(organizationId) });
  const save = trpc.productivity.savePreferences.useMutation({ onSuccess: () => void utils.productivity.preferences.invalidate({ organizationId }) });
  const dismissed = preferences.data?.dismissedNotificationKeys ?? [];
  const visible = notices.filter(notice => !dismissed.includes(notice.key));
  const dismiss = (key: string) => save.mutate({ organizationId, dismissedNotificationKeys: [...dismissed, key].slice(-40) });
  return <Popover><PopoverTrigger asChild><button type="button" className="relative grid size-11 place-items-center rounded-md border border-border bg-card text-muted-foreground transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary" aria-label={visible.length ? `შეტყობინებები: ${visible.length}` : "შეტყობინებები"}><Bell className="size-4" aria-hidden="true" />{visible.length ? <span className="absolute -right-1 -top-1 grid min-h-5 min-w-5 place-items-center rounded-full bg-primary px-1 font-mono text-[11px] font-bold text-primary-foreground">{visible.length > 9 ? "9+" : visible.length}</span> : null}</button></PopoverTrigger><PopoverContent align="end" className="w-[min(23rem,calc(100vw-2rem))] p-2"><div className="flex items-center justify-between px-2 py-2"><p className="text-sm font-semibold">მოქმედებას საჭიროებს</p><span className="font-mono text-xs text-muted-foreground">{visible.length}</span></div>{visible.length ? <div className="space-y-1">{visible.map(notice => <article key={notice.key} className="flex items-start gap-2 rounded-md p-2 hover:bg-muted/50"><CircleAlert className={`mt-0.5 size-4 shrink-0 ${notice.tone === "warning" ? "text-[var(--sf-amber)]" : "text-primary"}`} aria-hidden="true" /><Link href={notice.href} className="min-w-0 flex-1 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"><p className="text-sm font-semibold text-foreground">{notice.title}</p><p className="mt-0.5 text-xs leading-5 text-muted-foreground">{notice.description}</p></Link><Button type="button" variant="ghost" size="icon" className="size-8" aria-label={`${notice.title} დამალვა`} disabled={save.isPending} onClick={() => dismiss(notice.key)}><X className="size-3.5" /></Button></article>)}</div> : <div className="px-2 py-8 text-center"><CheckCircle2 className="mx-auto size-5 text-[var(--sf-jade)]" aria-hidden="true" /><p className="mt-2 text-sm font-medium">ახალი შეტყობინება არ არის.</p></div>}</PopoverContent></Popover>;
}

type DailyCloseProps = { organizationId: string; locationId: string; businessDate: string; locationName: string; timezone: string; pendingCount: number; completedCount: number; outstandingLabel: string; outstandingTetri: number; canClose: boolean };
type ChecklistKey = "PENDING" | "COMPLETED" | "OUTSTANDING" | "TOMORROW";
const checklistKeys: ChecklistKey[] = ["PENDING", "COMPLETED", "OUTSTANDING", "TOMORROW"];

export function DayCloseChecklist({ organizationId, locationId, businessDate, locationName, pendingCount, completedCount, outstandingLabel, outstandingTetri, canClose }: DailyCloseProps) {
  const utils = trpc.useUtils();
  const state = trpc.productivity.dailyCloseState.useQuery({ organizationId, locationId, businessDate }, { enabled: Boolean(organizationId && locationId && canClose) });
  const save = trpc.productivity.saveDailyClose.useMutation({ onSuccess: () => void utils.productivity.dailyCloseState.invalidate({ organizationId, locationId, businessDate }) });
  if (!canClose) return null;
  const completed = (state.data?.completedKeys ?? []).filter((key): key is ChecklistKey => checklistKeys.includes(key as ChecklistKey));
  const rows = [
    { key: "PENDING", title: "მომლოდინე ჯავშნები", detail: pendingCount ? `${pendingCount} ჯავშანი გადასამოწმებელია` : "მომლოდინე ჯავშანი არ არის", href: "/app/calendar" },
    { key: "COMPLETED", title: "დასრულებული ვიზიტები", detail: `დასრულებულია ${completedCount}`, href: "/app/operations" },
    { key: "OUTSTANDING", title: "დარჩენილი ბალანსი", detail: outstandingTetri ? `${outstandingLabel} გადასამოწმებელია` : "ბალანსი დახურულია", href: "/app/reports" },
    { key: "TOMORROW", title: "ხვალინდელი განრიგი", detail: "შემდეგი დღის პირველი ჩანაწერები", href: "/app/calendar" },
  ] as const;
  const toggle = (key: typeof rows[number]["key"]) => { const next = completed.includes(key) ? completed.filter(item => item !== key) : [...completed, key]; save.mutate({ organizationId, locationId, businessDate, completedKeys: next }); };
  return <section aria-label="დღის დახურვის სია" className="rounded-md border border-border bg-card p-3 sm:p-4"><div className="flex flex-wrap items-center justify-between gap-2"><div className="flex flex-wrap items-baseline gap-x-3"><h2 className="text-base font-bold tracking-tight">დღის დახურვა</h2><p className="font-mono text-xs text-muted-foreground">{locationName} · {businessDate}</p></div>{state.data?.closedAt ? <span className="inline-flex items-center gap-1 rounded-md bg-[color-mix(in_srgb,var(--sf-jade)_16%,transparent)] px-2 py-1 text-xs font-semibold text-[var(--sf-jade)]"><CheckCircle2 className="size-3.5" />დახურულია</span> : <span className="font-mono text-xs text-muted-foreground">{completed.length}/4</span>}</div><div className="mt-3 grid gap-2 sm:grid-cols-2">{rows.map(row => <label key={row.key} className="flex min-h-12 items-center gap-3 rounded-md border border-border p-2.5 transition hover:bg-muted/40"><input type="checkbox" checked={completed.includes(row.key)} disabled={state.isLoading || save.isPending} onChange={() => toggle(row.key)} className="size-4 shrink-0 accent-primary" /><span className="min-w-0 flex-1"><span className="block text-sm font-semibold">{row.title}</span><span className="block text-xs text-muted-foreground">{row.detail}</span></span><Link href={row.href} aria-label={`${row.title} გახსნა`} className="grid size-8 shrink-0 place-items-center rounded-md text-muted-foreground hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"><ExternalLink className="size-3.5" /></Link></label>)}</div></section>;
}
