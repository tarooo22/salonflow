import { cn } from "@/lib/utils";
import React from "react";
import { motion, useReducedMotionConfig } from "framer-motion";
import { AlertCircle, CalendarCheck, Check, Clock, Inbox, LoaderCircle, MoreHorizontal, UserCheck, X } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import "./panel.css";

type WorkspacePageHeaderProps = {
  /** Kept for compatibility; the panel no longer prints eyebrows. */
  eyebrow?: string;
  title: string;
  description?: string;
  /** At most one primary and one secondary button. */
  actions?: ReactNode;
  /** Everything else: DropdownMenuItem children, shown under a "მეტი მოქმედება" kebab after `actions`. */
  moreActions?: ReactNode;
  className?: string;
};

/** One compact head row on the page ground: title left, actions right, 1px rule under it. */
export function WorkspacePageHeader({ title, description, actions, moreActions, className }: WorkspacePageHeaderProps) {
  return (
    <header className={cn("cwk-head", className)}>
      <div className="cwk-head-text">
        <h1 className="cwk-title cwk-display">{title}</h1>
        {description ? <p className="cwk-desc" title={description}>{description}</p> : null}
      </div>
      {actions || moreActions ? (
        <div className="cwk-actions">
          {actions}
          {moreActions ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button type="button" variant="outline" size="icon" aria-label="მეტი მოქმედება"><MoreHorizontal className="size-4" aria-hidden="true" /></Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">{moreActions}</DropdownMenuContent>
            </DropdownMenu>
          ) : null}
        </div>
      ) : null}
    </header>
  );
}

/** Count tile: caption, tabular value. `tone` is kept for compatibility and no longer colours the tile. */
export function WorkspaceMetric({ label, value, helper, icon: Icon }: {
  label: string;
  value: ReactNode;
  helper?: string;
  icon?: (props: ComponentProps<"svg">) => ReactNode;
  tone?: "neutral" | "jade" | "terracotta" | "accent" | "fuchsia" | "amber";
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
    <div className="cwk-state" data-kind={kind} role={kind === "error" ? "alert" : kind === "loading" ? "status" : undefined} aria-live={kind === "loading" ? "polite" : undefined}>
      <span className="cwk-state-icon"><Icon className={cn(kind === "loading" && "animate-spin motion-reduce:animate-none")} aria-hidden="true" /></span>
      <p className="cwk-state-title">{title}</p>
      {description ? <p className="cwk-state-desc">{description}</p> : null}
      {action ? <div className="mt-3">{action}</div> : null}
    </div>
  );
}

/** Appointment status marks: icon + word, never colour alone. */
const STATUS_MARKS = {
  PENDING: { tone: "warning", icon: Clock, label: "დასადასტურებელი" },
  CONFIRMED: { tone: "info", icon: CalendarCheck, label: "დადასტურებული" },
  CHECKED_IN: { tone: "accent", icon: UserCheck, label: "მიღებულია" },
  IN_SERVICE: { tone: "accent", icon: UserCheck, label: "მომსახურებაშია" },
  COMPLETED: { tone: "success", icon: Check, label: "დასრულებული" },
  CANCELLED: { tone: "muted", icon: X, label: "გაუქმებული" },
  NO_SHOW: { tone: "muted", icon: X, label: "არ გამოცხადდა" },
} as const;
export type WorkspaceStatus = keyof typeof STATUS_MARKS;

type WorkspaceStatusPillProps = {
  children?: ReactNode;
  tone?: "neutral" | "success" | "warning" | "danger" | "info" | "accent" | "muted" | "count";
  /** Appointment status: sets tone and icon, and the Georgian word unless `children` is given. */
  status?: WorkspaceStatus;
};

export function WorkspaceStatusPill({ children, tone = "neutral", status }: WorkspaceStatusPillProps) {
  const mark = status ? STATUS_MARKS[status] : undefined;
  const Icon = mark?.icon;
  return <span className="cwk-mark" data-tone={mark?.tone ?? tone}>{Icon ? <Icon aria-hidden="true" /> : null}{children ?? mark?.label}</span>;
}

/* List reveal on first load. Wrap a list once in <WorkspaceRevealScope>, give each row <WorkspaceRevealItem index={i}>.
   Rows that mount within 600ms of the scope's first row fade/rise in (stagger for the first 8); rows that appear later
   (refetch, new data, pagination) render still. Reduced motion (OS or the Settings toggle) renders the plain element. */
const RevealScope = React.createContext<{ firstAt: number } | null>(null);
const REVEAL_WINDOW_MS = 600;
const revealTags = { div: motion.div, li: motion.li, tr: motion.tr, article: motion.article } as const;

export function WorkspaceRevealScope({ children }: { children: ReactNode }) {
  const scope = React.useRef({ firstAt: 0 });
  return <RevealScope.Provider value={scope.current}>{children}</RevealScope.Provider>;
}

export function WorkspaceRevealItem({ index = 0, as = "div", className, children }: { index?: number; as?: keyof typeof revealTags; className?: string; children: ReactNode }) {
  const reduce = useReducedMotionConfig();
  const scope = React.useContext(RevealScope);
  const [animate] = React.useState(() => {
    if (!scope) return false;
    const now = Date.now();
    if (!scope.firstAt) scope.firstAt = now;
    return now - scope.firstAt < REVEAL_WINDOW_MS;
  });
  if (reduce || !animate) return React.createElement(as, { className }, children);
  const Tag = revealTags[as];
  return <Tag className={className} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.26, ease: [0.2, 0, 0, 1], delay: Math.min(index, 7) * 0.04 }}>{children}</Tag>;
}

export function WorkspaceFilterBar({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("cwk-toolbar", className)}>{children}</div>;
}
