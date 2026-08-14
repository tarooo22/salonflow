import { cn } from "@/lib/utils";
import { AlertCircle, Inbox, LoaderCircle } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";

type WorkspacePageHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
};

export function WorkspacePageHeader({ eyebrow, title, description, actions, className }: WorkspacePageHeaderProps) {
  return (
    <header className={cn("flex flex-col gap-4 border-b border-border/70 pb-5 lg:flex-row lg:items-end lg:justify-between", className)}>
      <div className="min-w-0">
        {eyebrow ? <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">{eyebrow}</p> : null}
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">{title}</h1>
        {description ? <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2 lg:justify-end">{actions}</div> : null}
    </header>
  );
}

export function WorkspaceMetric({ label, value, helper, icon: Icon, tone = "neutral" }: {
  label: string;
  value: ReactNode;
  helper?: string;
  icon?: (props: ComponentProps<"svg">) => ReactNode;
  tone?: "neutral" | "jade" | "terracotta" | "violet";
}) {
  const tones = {
    neutral: "bg-muted text-foreground",
    jade: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
    terracotta: "bg-primary/10 text-primary",
    violet: "bg-violet-500/10 text-violet-700 dark:text-violet-300",
  } as const;
  return (
    <div className="min-w-0 rounded-xl border border-border/75 bg-card px-4 py-3 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0"><p className="text-xs font-medium text-muted-foreground">{label}</p><p className="mt-1 truncate text-xl font-semibold tracking-tight text-foreground">{value}</p></div>
        {Icon ? <span className={cn("grid h-9 w-9 shrink-0 place-items-center rounded-lg", tones[tone])}><Icon className="h-4 w-4" /></span> : null}
      </div>
      {helper ? <p className="mt-2 text-xs leading-5 text-muted-foreground">{helper}</p> : null}
    </div>
  );
}

export function WorkspaceSection({ title, description, action, children, className }: { title: string; description?: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cn("rounded-xl border border-border/75 bg-card shadow-sm", className)}>
      <div className="flex flex-col gap-2 border-b border-border/70 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div><h2 className="text-sm font-semibold text-foreground">{title}</h2>{description ? <p className="mt-1 text-xs leading-5 text-muted-foreground">{description}</p> : null}</div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}

export function WorkspaceState({ kind, title, description, action }: { kind: "loading" | "error" | "empty"; title: string; description?: string; action?: ReactNode }) {
  const Icon = kind === "loading" ? LoaderCircle : kind === "error" ? AlertCircle : Inbox;
  const tone = kind === "error" ? "text-destructive bg-destructive/10" : "text-primary bg-primary/10";
  return (
    <div className="flex min-h-32 flex-col items-start justify-center rounded-xl border border-dashed border-border bg-muted/25 p-5">
      <span className={cn("mb-3 grid h-9 w-9 place-items-center rounded-lg", tone)}><Icon className={cn("h-4 w-4", kind === "loading" && "animate-spin")} /></span>
      <p className="text-sm font-semibold text-foreground">{title}</p>
      {description ? <p className="mt-1 max-w-xl text-sm leading-6 text-muted-foreground">{description}</p> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

export function WorkspaceStatusPill({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "success" | "warning" | "danger" | "info" | "violet" }) {
  const tones = {
    neutral: "bg-muted text-muted-foreground",
    success: "bg-emerald-500/10 text-emerald-800 dark:text-emerald-300",
    warning: "bg-amber-500/10 text-amber-900 dark:text-amber-200",
    danger: "bg-destructive/10 text-destructive",
    info: "bg-sky-500/10 text-sky-800 dark:text-sky-300",
    violet: "bg-violet-500/10 text-violet-800 dark:text-violet-300",
  } as const;
  return <span className={cn("inline-flex min-h-6 items-center rounded-md px-2 py-0.5 text-xs font-semibold", tones[tone])}>{children}</span>;
}

export function WorkspaceFilterBar({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("flex flex-col gap-3 rounded-xl border border-border/75 bg-card p-3 shadow-sm sm:flex-row sm:flex-wrap sm:items-end", className)}>{children}</div>;
}
