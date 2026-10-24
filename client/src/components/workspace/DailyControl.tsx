import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { formatKaDayKey } from "@/lib/presentation";
import { trpc } from "@/lib/trpc";
import { Bell, ChevronRight, CheckCircle2, Check, Circle, CircleAlert, X } from "lucide-react";
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
  return <Popover><PopoverTrigger asChild><button type="button" className="cwk-topbtn relative md:size-10" aria-label={visible.length ? `შეტყობინებები: ${visible.length}` : "შეტყობინებები"}><Bell className="size-4" aria-hidden="true" />{visible.length ? <span aria-hidden="true" className="cwk-num absolute -right-1 -top-1 grid min-h-5 min-w-5 place-items-center rounded-full bg-primary px-1 text-[11px] font-bold text-primary-foreground">{visible.length > 9 ? "9+" : visible.length}</span> : null}</button></PopoverTrigger><PopoverContent align="end" className="w-[min(23rem,calc(100vw-2rem))] p-2"><div className="flex items-center justify-between px-2 py-2"><p className="text-sm font-semibold">მოქმედებას საჭიროებს</p><span className="cwk-num text-xs text-muted-foreground">{visible.length}</span></div>{visible.length ? <div className="space-y-1">{visible.map(notice => <article key={notice.key} className="flex items-start gap-2 rounded-lg p-2 hover:bg-[var(--sf-surface-2)]"><CircleAlert className={`mt-0.5 size-4 shrink-0 ${notice.tone === "warning" ? "text-[var(--sf-warning)]" : "text-primary"}`} aria-hidden="true" /><Link href={notice.href} className="min-w-0 flex-1 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"><p className="text-sm font-semibold text-foreground">{notice.title}</p><p className="mt-0.5 text-xs leading-5 text-muted-foreground">{notice.description}</p></Link><Button type="button" variant="ghost" size="icon" className="size-11 md:size-8" aria-label={`${notice.title} დამალვა`} disabled={save.isPending} onClick={() => dismiss(notice.key)}><X className="size-3.5" aria-hidden="true" /></Button></article>)}</div> : <div className="px-2 py-8 text-center"><CheckCircle2 className="mx-auto size-5 text-[var(--sf-success)]" aria-hidden="true" /><p className="mt-2 text-sm font-medium">ახალი შეტყობინება არ არის.</p></div>}</PopoverContent></Popover>;
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
  return <section aria-label="დღის დახურვის სია" className="cwk-sheet">
    <div className="cwk-sheet-head">
      <div className="min-w-0"><h2 className="cwk-sheet-title">დღის დახურვა</h2><p className="cwk-sheet-desc"><span>{locationName}</span> · <span>{formatKaDayKey(businessDate)}</span></p></div>
      {state.data?.closedAt ? <span className="cwk-mark" data-tone="success"><CheckCircle2 aria-hidden="true" />დახურულია</span> : <span className="cwk-mark" data-tone="count"><span className="cwk-num">{completed.length}/4</span></span>}
    </div>
    <ul className="divide-y divide-border">{rows.map(row => {
      const done = completed.includes(row.key);
      return <li key={row.key} className="relative flex min-h-14 items-center gap-3 px-4 py-2 transition-colors hover:bg-[var(--sf-surface-2)]">
        <Link href={row.href} className="group min-w-0 flex-1 rounded-sm py-1 after:absolute after:inset-0 after:content-[''] focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-inset focus-visible:after:ring-[var(--sf-focus)]"><span className="block text-sm font-semibold">{row.title}</span><span className="block text-xs text-muted-foreground">{row.detail}</span></Link>
        <button type="button" aria-pressed={done} aria-label={`${row.title}: ${done ? "შესრულებულია" : "ჯერ არ არის შესრულებული"}`} disabled={state.isLoading || save.isPending} onClick={() => toggle(row.key)} className="relative z-10 inline-flex shrink-0 cursor-pointer items-center rounded-full max-md:min-h-11 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--sf-focus)]"><span className="cwk-mark" data-tone={done ? "success" : undefined}>{done ? <Check aria-hidden="true" /> : <Circle aria-hidden="true" />}{done ? "შესრულებულია" : "მონიშვნა"}</span></button>
        <ChevronRight className="size-4 shrink-0 text-muted-foreground max-md:hidden" aria-hidden="true" />
      </li>;
    })}</ul>
  </section>;
}
