import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import React, { type ReactNode } from "react";
import { ArrowRight, CircleAlert } from "lucide-react";
import { Link } from "wouter";

export function WorkspaceContextBar({ title, detail, action, className }: { eyebrow?: string; title: string; detail?: string; action?: ReactNode; className?: string }) {
  return <section aria-label={title} className={cn("flex flex-col gap-3 border-b-[1.5px] border-foreground pb-3 sm:flex-row sm:items-end sm:justify-between", className)}>
    <div className="min-w-0">
      <h1 className="truncate text-2xl font-extrabold tracking-tight text-foreground">{title}</h1>
      {detail ? <p className="mt-0.5 text-sm text-muted-foreground">{detail}</p> : null}
    </div>
    {action ? <div className="shrink-0">{action}</div> : null}
  </section>;
}

/** Flat panel with a rule head; `label` is kept for callers but no longer rendered as an eyebrow. */
export function PriorityModule({ title, description, icon: Icon, action, children, className }: { label?: string; title: string; description?: string; icon: LucideIcon; action?: ReactNode; children?: ReactNode; className?: string }) {
  return <section aria-label={title} className={cn("rounded-md border border-border bg-card p-3 sm:p-4", className)}>
    <div className="flex items-start gap-3">
      <Icon className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <h2 className="text-base font-bold tracking-tight text-foreground">{title}</h2>
        {description ? <p className="mt-0.5 text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
    {children ? <div className="mt-3 border-t border-border pt-3">{children}</div> : null}
  </section>;
}

export function AttentionRow({ title, description, value, href, tone = "warning" }: { title: string; description: string; value?: ReactNode; href: string; tone?: "warning" | "info" | "success" }) {
  const toneClasses = { warning: "text-[var(--sf-amber)]", info: "text-primary", success: "text-[var(--sf-jade)]" } as const;
  return <Link href={href} className="group flex min-h-12 items-center gap-3 rounded-md border border-border bg-card px-3 py-2 transition hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2">
    <CircleAlert className={cn("size-4 shrink-0", toneClasses[tone])} aria-hidden="true" />
    <span className="min-w-0 flex-1"><span className="block text-sm font-semibold text-foreground">{title}</span><span className="block truncate text-xs text-muted-foreground">{description}</span></span>
    {value ? <strong className="shrink-0 font-mono text-sm text-foreground">{value}</strong> : null}
    <ArrowRight className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
  </Link>;
}

/** One compact ledger row of figures; children are `MetricCell`s. */
export function CompactMetricRail({ children, className, label = "დღის მოკლე მაჩვენებლები" }: { children: ReactNode; className?: string; label?: string }) {
  return <section aria-label={label} className={cn("grid grid-cols-2 overflow-hidden rounded-md border border-border bg-card sm:grid-flow-col sm:auto-cols-fr", className)}>{children}</section>;
}

export function MetricCell({ label, value }: { label: string; value: ReactNode }) {
  return <div className="min-w-0 border-b border-r border-border px-3 py-2 last:border-r-0 sm:border-b-0"><p className="truncate text-xs text-muted-foreground">{label}</p><p className="truncate font-mono text-lg font-semibold leading-tight text-foreground">{value}</p></div>;
}

export function ActionTile({ icon: Icon, label, hint, href, onClick, className }: { icon: LucideIcon; label: string; hint?: string; href?: string; onClick?: () => void; className?: string }) {
  const content = <><Icon className="size-4 shrink-0 text-primary" aria-hidden="true" /><span className="min-w-0 flex-1"><span className="block text-sm font-semibold text-foreground">{label}</span>{hint ? <span className="block truncate text-xs text-muted-foreground">{hint}</span> : null}</span></>;
  const classes = cn("flex min-h-11 items-center gap-2.5 rounded-md border border-border bg-card px-3 py-2 text-left transition hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2", className);
  if (href) return <Link href={href} className={classes}>{content}</Link>;
  return <button type="button" onClick={onClick} className={classes}>{content}</button>;
}
