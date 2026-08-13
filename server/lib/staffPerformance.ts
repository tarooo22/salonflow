export type StaffPerformanceAppointment = { staffProfileId: string; status: string; totalTetri: number };

export function summarizeStaffPerformance(staffProfileIds: string[], appointments: StaffPerformanceAppointment[]) {
  return staffProfileIds.map(staffProfileId => {
    const rows = appointments.filter(appointment => appointment.staffProfileId === staffProfileId);
    const activeRows = rows.filter(appointment => appointment.status !== "CANCELLED");
    return {
      staffProfileId,
      completedAppointments: rows.filter(appointment => appointment.status === "COMPLETED").length,
      serviceVolume: activeRows.length,
      bookedRevenueTetri: activeRows.reduce((total, appointment) => total + appointment.totalTetri, 0),
    };
  });
}
