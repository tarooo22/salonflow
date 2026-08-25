import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import React, { type ReactNode } from "react";
import { ArrowRight, CircleAlert } from "lucide-react";
import { Link } from "wouter";

export function WorkspaceContextBar({ eyebrow, title, detail, action, className }: { eyebrow?: string; title: string; detail?: string; action?: ReactNode; className?: string }) {
  return <section aria-label={title} className={cn("rounded-2xl border border-border/70 bg-card p-4 shadow-sm sm:flex sm:items-center sm:justify-between", className)}>
    <div className="min-w-0">
      {eyebrow ? <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-primary">{eyebrow}</p> : null}
      <h1 className="mt-1 truncate text-xl font-semibold tracking-tight text-foreground sm:text-2xl">{title}</h1>
      {detail ? <p className="mt-1 text-sm text-muted-foreground">{detail}</p> : null}
    </div>
    {action ? <div className="mt-3 shrink-0 sm:mt-0">{action}</div> : null}
  </section>;
}

export function PriorityModule({ label, title, description, icon: Icon, action, children, className }: { label: string; title: string; description?: string; icon: LucideIcon; action?: ReactNode; children?: ReactNode; className?: string }) {
  return <section aria-label={title} className={cn("relative overflow-hidden rounded-2xl border border-border/70 bg-card p-4 shadow-sm sm:p-5", className)}>
    <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary via-[var(--sf-fuchsia)] to-[var(--sf-violet)]" aria-hidden="true" />
    <div className="flex items-start gap-3">
      <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"><Icon className="size-5" aria-hidden="true" /></span>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-primary">{label}</p>
        <h2 className="mt-1 text-lg font-semibold tracking-tight text-foreground">{title}</h2>
        {description ? <p className="mt-1 text-sm leading-6 text-muted-foreground">{description}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
    {children ? <div className="mt-4 border-t border-border/60 pt-4">{children}</div> : null}
  </section>;
}

export function AttentionRow({ title, description, value, href, tone = "warning" }: { title: string; description: string; value?: ReactNode; href: string; tone?: "warning" | "info" | "success" }) {
  const toneClasses = { warning: "text-[var(--sf-amber)]", info: "text-primary", success: "text-[var(--sf-jade)]" } as const;
  return <Link href={href} className="group flex min-h-16 items-center gap-3 rounded-xl border border-border/70 bg-card px-3 py-2.5 transition hover:border-primary/35 hover:bg-primary/[0.025] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2">
    <CircleAlert className={cn("size-4 shrink-0", toneClasses[tone])} aria-hidden="true" />
    <span className="min-w-0 flex-1"><span className="block text-sm font-semibold text-foreground">{title}</span><span className="mt-0.5 block truncate text-xs text-muted-foreground">{description}</span></span>
    {value ? <strong className="shrink-0 text-sm text-foreground">{value}</strong> : null}
    <ArrowRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 motion-reduce:transform-none motion-reduce:transition-none" aria-hidden="true" />
  </Link>;
}

export function CompactMetricRail({ children, className }: { children: ReactNode; className?: string }) {
  return <section aria-label="დღის მოკლე მაჩვენებლები" className={cn("grid gap-3 sm:grid-cols-2 xl:grid-cols-4", className)}>{children}</section>;
}

export function ActionTile({ icon: Icon, label, hint, href, onClick, className }: { icon: LucideIcon; label: string; hint: string; href?: string; onClick?: () => void; className?: string }) {
  const content = <><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"><Icon className="size-4" aria-hidden="true" /></span><span className="min-w-0 flex-1"><span className="block text-sm font-semibold text-foreground">{label}</span><span className="mt-0.5 block truncate text-xs text-muted-foreground">{hint}</span></span><ArrowRight className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" /></>;
  const classes = cn("group flex min-h-[4.5rem] items-center gap-3 rounded-xl border border-border/70 bg-card p-3 text-left transition hover:border-primary/35 hover:bg-primary/[0.025] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2", className);
  if (href) return <Link href={href} className={classes}>{content}</Link>;
  return <button type="button" onClick={onClick} className={classes}>{content}</button>;
}
