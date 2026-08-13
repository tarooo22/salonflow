import React from "react";
import { CalendarDays, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

type SalonFlowBrandProps = {
  className?: string;
  compact?: boolean;
  inverted?: boolean;
};

/** A shared calendar-and-care mark that connects SalonFlow's booking and hospitality voice. */
export function SalonFlowBrand({ className, compact = false, inverted = false }: SalonFlowBrandProps) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <span aria-hidden="true" className={cn("relative flex h-8 w-8 shrink-0 items-center justify-center rounded-[0.72rem] border", inverted ? "border-[#E7B49E]/45 bg-[#F7F4EF]/10 text-[#F5C3AD]" : "border-[#B85C3D]/25 bg-[#B85C3D]/10 text-[#A94E32]") }>
        <CalendarDays className="h-4 w-4 stroke-[1.8]" />
        <Sparkles className={cn("absolute -right-1.5 -top-1.5 h-3.5 w-3.5", inverted ? "text-[#F5C3AD]" : "text-[#B85C3D]")} />
      </span>
      {!compact ? <span className={cn("font-serif text-[1.17rem] font-semibold tracking-[-0.035em]", inverted ? "text-[#F7F4EF]" : "text-[#1E2824]")}>Salon<span className={inverted ? "text-[#F5C3AD]" : "text-[#B85C3D]"}>Flow</span></span> : null}
    </span>
  );
}
