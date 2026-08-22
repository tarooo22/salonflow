export type WorkspaceRole = "OWNER" | "MANAGER" | "RECEPTIONIST" | "STAFF" | undefined;

export type DashboardQuickAction = "CALENDAR" | "WALK_IN" | "CLIENTS" | "TEAM" | "SERVICES" | "BOOKING_LINK" | "MY_PROFILE";

export function dashboardQuickActions(role: WorkspaceRole, hasActiveLocation: boolean): DashboardQuickAction[] {
  if (role === "OWNER") return ["CALENDAR", ...(hasActiveLocation ? ["WALK_IN"] as const : []), "TEAM", "SERVICES", "BOOKING_LINK"];
  if (role === "MANAGER" || role === "RECEPTIONIST") return ["CALENDAR", ...(hasActiveLocation ? ["WALK_IN"] as const : []), "CLIENTS"];
  if (role === "STAFF") return ["CALENDAR", "MY_PROFILE"];
  return [];
}

export function dashboardMetricKeys(role: WorkspaceRole) {
  if (role === "STAFF") return ["BOOKINGS", "UP_NEXT"] as const;
  if (role === "RECEPTIONIST") return ["BOOKINGS", "PENDING", "OUTSTANDING"] as const;
  return ["BOOKINGS", "PENDING", "SCHEDULED", "OUTSTANDING"] as const;
}

export function nextOperationalAppointment<T extends { status: string; startsAt: Date | string; endsAt: Date | string }>(appointments: T[], now = Date.now()) {
  const active = appointments.find(appointment => {
    const startsAt = new Date(appointment.startsAt).getTime();
    const endsAt = new Date(appointment.endsAt).getTime();
    return appointment.status === "IN_SERVICE" || (startsAt <= now && endsAt > now && !["CANCELLED", "NO_SHOW", "COMPLETED"].includes(appointment.status));
  });
  if (active) return { appointment: active, kind: "NOW" as const };
  const next = appointments.find(appointment => new Date(appointment.startsAt).getTime() >= now && !["CANCELLED", "NO_SHOW", "COMPLETED"].includes(appointment.status));
  return next ? { appointment: next, kind: "NEXT" as const } : null;
}
