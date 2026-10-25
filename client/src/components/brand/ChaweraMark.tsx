import React from "react";
import { cn } from "@/lib/utils";
import { RING_PATHS } from "./Ring";

/**
 * The Chawera mark: the signature ring (square path) plus a dot where the pen came to rest.
 * Sits left of the "ჩაწერა" wordmark. Decorative by default (the wordmark carries the name).
 * Colour: accent-ink, #F48A9B inside `.cw-on-band` or dark mode (token flips); override with `className`.
 */
export function ChaweraMark({ size = 24, className }: { size?: number; className?: string }) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      className={cn("cw-mark", className)}
      width={size}
      height={size}
      viewBox={RING_PATHS.square.viewBox}
      fill="none"
    >
      <path d={RING_PATHS.square.d} stroke="currentColor" strokeWidth={3.6} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={29} cy={26} r={5} fill="currentColor" />
    </svg>
  );
}
