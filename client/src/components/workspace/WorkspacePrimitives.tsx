import { cn } from "@/lib/utils";
import React from "react";
import { AlertCircle, Inbox, LoaderCircle } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";
import "./panel.css";

type WorkspacePageHeaderProps = {
  /** Kept for compatibility; the panel no longer prints eyebrows. */
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
};

/** One compact head row on the page ground: condensed title left, actions right, 1.5px ink rule under it. */
export function WorkspacePageHeader({ title, description, actions, className }: WorkspacePageHeaderProps) {
  return (
    <header className={cn("cwk-head", className)}>
      <div className="cwk-head-text">
        <h1 className="cwk-title cwk-display">{title}</h1>
        {description ? <p className="cwk-desc" title={description}>{description}</p> : null}
      </div>
      {actions ? <div className="cwk-actions">{actions}</div> : null}
    </header>
  );
}

/** Sheet-white count tile: caption, mono value. `tone` is kept for compatibility and no longer colours the tile. */
export function WorkspaceMetric({ label, value, helper, icon: Icon }: {
  label: string;
  value: ReactNode;
  helper?: string;
  icon?: (props: ComponentProps<"svg">) => ReactNode;
  tone?: "neutral" | "jade" | "terracotta" | "violet" | "fuchsia" | "amber";
}) {
  return (
    <div className="cwk-metric">
      <p className="cwk-metric-label"><span>{label}</span>{Icon ? <Icon className="size-4 shrink-0" aria-hidden="true" /> : null}</p>
      <p className="cwk-metric-value cwk-num">{value}</p>
      {helper ? <p className="cwk-metric-helper">{helper}</p> : null}
    </div>
  );
}

export function WorkspaceSection({ title, description, action, children, className }: { title: string; description?: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cn("cwk-sheet", className)}>
      <div className="cwk-sheet-head">
        <div className="min-w-0"><h2 className="cwk-sheet-title">{title}</h2>{description ? <p className="cwk-sheet-desc">{description}</p> : null}</div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}

export function WorkspaceState({ kind, title, description, action }: { kind: "loading" | "error" | "empty"; title: string; description?: string; action?: ReactNode }) {
  const Icon = kind === "loading" ? LoaderCircle : kind === "error" ? AlertCircle : Inbox;
  return (
    <div className="cwk-state" data-kind={kind} role={kind === "error" ? "alert" : undefined}>
      <Icon className={cn("mb-1 size-5", kind === "loading" && "animate-spin motion-reduce:animate-none")} aria-hidden="true" />
      <p className="text-sm font-bold">{title}</p>
      {description ? <p className="max-w-xl text-sm leading-6 text-[var(--cwk-ink-soft)]">{description}</p> : null}
      {action ? <div className="mt-3">{action}</div> : null}
    </div>
  );
}

export function WorkspaceStatusPill({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "success" | "warning" | "danger" | "info" | "violet" | "count" }) {
  return <span className="cwk-mark" data-tone={tone}>{children}</span>;
}

export function WorkspaceFilterBar({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("cwk-toolbar", className)}>{children}</div>;
}
