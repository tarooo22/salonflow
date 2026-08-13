export type AnalyticsAppointment = { id: string; staffProfileId: string; startsAt: Date; status: string; totalTetri: number };
export type AnalyticsService = { appointmentId: string; serviceNameSnapshot: string; priceTetriSnapshot: number };
export type AnalyticsStaff = { id: string; publicDisplayName: string };

export function expensePressureBasisPoints(expensesTetri: number, bookedRevenueTetri: number) {
  return bookedRevenueTetri > 0 ? Math.round((expensesTetri * 10_000) / bookedRevenueTetri) : null;
}

export function summarizeReportingAnalytics(appointments: AnalyticsAppointment[], services: AnalyticsService[], staff: AnalyticsStaff[]) {
  const activeAppointments = appointments.filter(appointment => appointment.status !== "CANCELLED");
  const revenueByDay = new Map<string, number>();
  for (const appointment of activeAppointments) {
    const date = appointment.startsAt.toISOString().slice(0, 10);
    revenueByDay.set(date, (revenueByDay.get(date) ?? 0) + appointment.totalTetri);
  }
  const serviceMix = new Map<string, { serviceName: string; bookingCount: number; revenueTetri: number }>();
  for (const service of services) {
    const appointment = activeAppointments.find(row => row.id === service.appointmentId);
    if (!appointment) continue;
    const current = serviceMix.get(service.serviceNameSnapshot) ?? { serviceName: service.serviceNameSnapshot, bookingCount: 0, revenueTetri: 0 };
    current.bookingCount += 1;
    current.revenueTetri += service.priceTetriSnapshot;
    serviceMix.set(service.serviceNameSnapshot, current);
  }
  const staffMetrics = staff.map(member => {
    const rows = activeAppointments.filter(appointment => appointment.staffProfileId === member.id);
    return { staffProfileId: member.id, publicDisplayName: member.publicDisplayName, completedAppointments: rows.filter(appointment => appointment.status === "COMPLETED").length, bookingCount: rows.length, bookedRevenueTetri: rows.reduce((total, appointment) => total + appointment.totalTetri, 0) };
  }).sort((left, right) => right.bookedRevenueTetri - left.bookedRevenueTetri);
  return {
    revenueTrend: Array.from(revenueByDay, ([date, revenueTetri]) => ({ date, revenueTetri })).sort((a, b) => a.date.localeCompare(b.date)),
    serviceMix: Array.from(serviceMix.values()).sort((a, b) => b.revenueTetri - a.revenueTetri),
    staffMetrics,
  };
}
