import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { trpc } from "@/lib/trpc";
import { Bell, CheckCircle2, CircleAlert, ExternalLink, ReceiptText, X } from "lucide-react";
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
  return <Popover><PopoverTrigger asChild><button type="button" className="relative grid size-11 place-items-center rounded-xl border border-border/75 bg-card text-muted-foreground transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary" aria-label={visible.length ? `${visible.length} მოქმედებას საჭიროებელი შეტყობინება` : "შეტყობინებები"}><Bell className="size-4" aria-hidden="true" />{visible.length ? <span className="absolute -right-1 -top-1 grid min-h-5 min-w-5 place-items-center rounded-full bg-primary px-1 text-[11px] font-bold text-primary-foreground">{visible.length > 9 ? "9+" : visible.length}</span> : null}</button></PopoverTrigger><PopoverContent align="end" className="w-[min(23rem,calc(100vw-2rem))] p-2"><div className="flex items-center justify-between px-2 py-2"><p className="text-sm font-semibold">მოქმედებას საჭიროებს</p><span className="text-xs text-muted-foreground">{visible.length} სიგნალი</span></div>{visible.length ? <div className="space-y-1">{visible.map(notice => <article key={notice.key} className="flex items-start gap-2 rounded-xl p-2 hover:bg-muted/50"><CircleAlert className={`mt-0.5 size-4 shrink-0 ${notice.tone === "warning" ? "text-[var(--sf-amber)]" : "text-primary"}`} aria-hidden="true" /><Link href={notice.href} className="min-w-0 flex-1 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"><p className="text-sm font-semibold text-foreground">{notice.title}</p><p className="mt-0.5 text-xs leading-5 text-muted-foreground">{notice.description}</p></Link><Button type="button" variant="ghost" size="icon" className="size-8" aria-label={`${notice.title} დამალვა`} disabled={save.isPending} onClick={() => dismiss(notice.key)}><X className="size-3.5" /></Button></article>)}</div> : <div className="px-2 py-8 text-center"><CheckCircle2 className="mx-auto size-5 text-[var(--sf-jade)]" aria-hidden="true" /><p className="mt-2 text-sm font-medium">ამჟამად მოქმედებას საჭიროებელი სიგნალი არ არის.</p></div>}</PopoverContent></Popover>;
}

type DailyCloseProps = { organizationId: string; locationId: string; businessDate: string; locationName: string; timezone: string; pendingCount: number; completedCount: number; outstandingLabel: string; outstandingTetri: number; canClose: boolean };
type ChecklistKey = "PENDING" | "COMPLETED" | "OUTSTANDING" | "TOMORROW";
const checklistKeys: ChecklistKey[] = ["PENDING", "COMPLETED", "OUTSTANDING", "TOMORROW"];

export function DayCloseChecklist({ organizationId, locationId, businessDate, locationName, timezone, pendingCount, completedCount, outstandingLabel, outstandingTetri, canClose }: DailyCloseProps) {
  const utils = trpc.useUtils();
  const state = trpc.productivity.dailyCloseState.useQuery({ organizationId, locationId, businessDate }, { enabled: Boolean(organizationId && locationId && canClose) });
  const save = trpc.productivity.saveDailyClose.useMutation({ onSuccess: () => void utils.productivity.dailyCloseState.invalidate({ organizationId, locationId, businessDate }) });
  if (!canClose) return null;
  const completed = (state.data?.completedKeys ?? []).filter((key): key is ChecklistKey => checklistKeys.includes(key as ChecklistKey));
  const rows = [
    { key: "PENDING", title: "მომლოდინე booking-ები", detail: pendingCount ? `${pendingCount} ჩანაწერი გადამოწმებას ელოდება.` : "მომლოდინე booking არ არის.", href: "/app/calendar" },
    { key: "COMPLETED", title: "დასრულებული ვიზიტები", detail: `${completedCount} ვიზიტი მონიშნულია დასრულებულად.`, href: "/app/operations" },
    { key: "OUTSTANDING", title: "დარჩენილი ბალანსი", detail: outstandingTetri ? `${outstandingLabel} გადასამოწმებელია.` : "დარჩენილი ბალანსი არ არის.", href: "/app/reports" },
    { key: "TOMORROW", title: "ხვალინდელი განრიგი", detail: "გადაამოწმეთ შემდეგი სამუშაო დღის პირველი ჩანაწერები.", href: "/app/calendar" },
  ] as const;
  const toggle = (key: typeof rows[number]["key"]) => { const next = completed.includes(key) ? completed.filter(item => item !== key) : [...completed, key]; save.mutate({ organizationId, locationId, businessDate, completedKeys: next }); };
  return <section aria-label="დღის დახურვის სია" className="rounded-2xl border border-border/70 bg-card p-4 shadow-sm"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-primary">დღის დახურვა</p><h2 className="mt-1 text-lg font-semibold tracking-tight">მოკლე შემოწმება</h2><p className="mt-1 text-xs leading-5 text-muted-foreground">{locationName} · {businessDate} · {timezone}</p></div>{state.data?.closedAt ? <span className="inline-flex items-center gap-1 rounded-md bg-[color-mix(in_srgb,var(--sf-jade)_16%,transparent)] px-2 py-1 text-xs font-semibold text-[var(--sf-jade)]"><CheckCircle2 className="size-3.5" />დახურულია</span> : <span className="text-xs text-muted-foreground">{completed.length}/4 დასრულებული</span>}</div><div className="mt-4 grid gap-2 sm:grid-cols-2">{rows.map(row => <label key={row.key} className="flex min-h-16 items-center gap-3 rounded-xl border border-border/70 p-3 transition hover:bg-muted/30"><input type="checkbox" checked={completed.includes(row.key)} disabled={state.isLoading || save.isPending} onChange={() => toggle(row.key)} className="size-4 shrink-0 accent-primary" /><span className="min-w-0 flex-1"><span className="block text-sm font-semibold">{row.title}</span><span className="mt-0.5 block text-xs leading-5 text-muted-foreground">{row.detail}</span></span><Link href={row.href} aria-label={`${row.title} გახსნა`} className="grid size-8 shrink-0 place-items-center rounded-lg text-muted-foreground hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"><ExternalLink className="size-3.5" /></Link></label>)}</div><p className="mt-3 flex items-start gap-2 text-xs leading-5 text-muted-foreground"><ReceiptText className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />ეს არის შიდა ოპერაციული სია და არ წარმოადგენს საბანკო reconciliation-ს.</p></section>;
}
