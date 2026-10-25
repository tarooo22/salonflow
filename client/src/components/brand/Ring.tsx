import React from "react";
import { cn } from "@/lib/utils";

/** Hand-drawn open ring whose tail overshoots its start. Rule: the ring marks your choice. */
export const RING_PATHS = {
  wide: { viewBox: "0 0 120 48", d: "M14 30 C8 18 30 6 62 6 C96 6 116 14 113 26 C110 39 82 44 56 43 C28 42 8 36 10 24 C12 16 26 10 40 9" },
  square: { viewBox: "0 0 64 64", d: "M10 36 C6 18 22 6 36 7 C52 8 60 22 57 36 C54 50 40 58 28 56 C14 54 7 44 9 32 C10 24 16 17 24 13" },
} as const;

export type RingVariant = keyof typeof RING_PATHS;
/** ink: accent-ink (default; follows dark mode). band: on the dark band/rail. photo: white on photos. */
export type RingTone = "ink" | "band" | "photo";

export type RingProps = {
  variant?: RingVariant;
  /**
   * undefined: static, always visible (empty states, category tiles).
   * true: draws in (on mount or when it turns true). false: fades out in 120ms.
   * Pair with `{selected}` on an always-mounted Ring so deselect can fade.
   */
  draw?: boolean;
  tone?: RingTone;
  className?: string;
};

function prefersReducedMotion() {
  if (typeof window === "undefined") return false;
  try {
    if (typeof document !== "undefined" && document.documentElement?.getAttribute("data-reduce-motion") === "true") return true;
    return window.matchMedia?.("(prefers-reduced-motion: reduce)").matches === true;
  } catch {
    return false;
  }
}

/** Parent must be `position: relative`. Decorative: never the only cue for a state. */
export function Ring({ variant = "wide", draw, tone = "ink", className }: RingProps) {
  const shape = RING_PATHS[variant];
  const animate = draw === true && !prefersReducedMotion();
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      className={cn("cw-ring", `cw-ring--${variant}`, tone !== "ink" && `cw-ring--${tone}`, animate && "cw-ring--draw", className)}
      data-ring={variant}
      data-state={draw === undefined ? "static" : draw ? "on" : "off"}
      viewBox={shape.viewBox}
      preserveAspectRatio="none"
      fill="none"
    >
      <path d={shape.d} pathLength={1} fill="none" stroke="currentColor" strokeWidth={2.25} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
