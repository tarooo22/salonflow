export type AppointmentAction = {
  status: "CONFIRMED" | "CHECKED_IN" | "IN_SERVICE" | "COMPLETED";
  label: string;
};

const nextActions: Record<string, AppointmentAction | undefined> = {
  PENDING: { status: "CONFIRMED", label: "დადასტურება" },
  CONFIRMED: { status: "CHECKED_IN", label: "მიღება" },
  CHECKED_IN: { status: "IN_SERVICE", label: "დაწყება" },
  IN_SERVICE: { status: "COMPLETED", label: "დასრულება" },
};

export function nextAppointmentAction(status: string): AppointmentAction | undefined {
  return nextActions[status];
}

export function canManageAppointmentQueue(role: string | undefined): boolean {
  return role === "OWNER" || role === "MANAGER" || role === "RECEPTIONIST";
}

export function shouldShowCalendarQuickAction(role: string | undefined, status: string, cardHeight: number): boolean {
  return canManageAppointmentQueue(role) && Boolean(nextAppointmentAction(status)) && cardHeight >= 70;
}
