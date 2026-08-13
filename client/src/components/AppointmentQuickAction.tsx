import { nextAppointmentAction, shouldShowCalendarQuickAction } from "@/lib/appointmentPresentation";
import React from "react";

export function AppointmentQuickAction({ role, status, cardHeight, disabled = false, onAction, context = "calendar", className }: { role: string | undefined; status: string; cardHeight: number; disabled?: boolean; onAction: () => void; context?: "calendar" | "today"; className?: string }) {
  const action = nextAppointmentAction(status);
  if (!action || !shouldShowCalendarQuickAction(role, status, cardHeight)) return null;
  return <button type="button" data-appointment-action-context={context} onClick={onAction} disabled={disabled} className={className ?? "mt-1 rounded border border-current/25 bg-background/70 px-1.5 py-0.5 text-[10px] font-medium transition hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-60"}>{action.label}</button>;
}
