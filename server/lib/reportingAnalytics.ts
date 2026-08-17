import { dateKeyInTimeZone, zonedDateTimeToUtc } from "../../shared/timezones";

export type AnalyticsAppointment = { id: string; staffProfileId: string; clientId?: string | null; startsAt: Date; status: string; totalTetri: number };
export type AnalyticsService = { appointmentId: string; serviceNameSnapshot: string; priceTetriSnapshot: number };
export type AnalyticsStaff = { id: string; publicDisplayName: string };
export type AnalyticsPayment = { appointmentId: string; amountTetri: number; refundedTetri: number; status: string };

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

const activeBookingStatuses = new Set(["PENDING", "CONFIRMED", "CHECKED_IN", "IN_SERVICE", "COMPLETED", "NO_SHOW"]);
const forecastStatuses = new Set(["PENDING", "CONFIRMED", "CHECKED_IN", "IN_SERVICE"]);
const paidPaymentStatuses = new Set(["PAID", "PARTIALLY_REFUNDED"]);

type LocalDate = { year: number; month: number; day: number };

function localParts(value: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", hourCycle: "h23" }).formatToParts(value);
  const read = (type: Intl.DateTimeFormatPartTypes) => Number(parts.find(part => part.type === type)?.value ?? 0);
  return { year: read("year"), month: read("month"), day: read("day"), hour: read("hour") };
}

function dateFromLocal(date: LocalDate, deltaDays = 0): LocalDate {
  const value = new Date(Date.UTC(date.year, date.month - 1, date.day + deltaDays));
  return { year: value.getUTCFullYear(), month: value.getUTCMonth() + 1, day: value.getUTCDate() };
}

function localKey(date: LocalDate) { return `${date.year}-${String(date.month).padStart(2, "0")}-${String(date.day).padStart(2, "0")}`; }
function localMonthKey(value: Date, timeZone: string) { const date = localParts(value, timeZone); return `${date.year}-${String(date.month).padStart(2, "0")}`; }
function localDayOfWeek(value: Date, timeZone: string) { const date = localParts(value, timeZone); return new Date(Date.UTC(date.year, date.month - 1, date.day)).getUTCDay(); }

export function localWeekRange(timeZone: string, reference = new Date()) {
  const today = localParts(reference, timeZone);
  const dayOfWeek = new Date(Date.UTC(today.year, today.month - 1, today.day)).getUTCDay();
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const start = dateFromLocal(today, mondayOffset);
  const nextStart = dateFromLocal(start, 7);
  return {
    startsAt: zonedDateTimeToUtc({ ...start, hour: 0, minute: 0, second: 0 }, timeZone),
    endsAt: zonedDateTimeToUtc({ ...nextStart, hour: 0, minute: 0, second: 0 }, timeZone),
    startDateKey: localKey(start),
    endDateKey: localKey(dateFromLocal(nextStart, -1)),
  };
}

export function nextSevenDaysRange(timeZone: string, reference = new Date()) {
  const start = localParts(reference, timeZone);
  const end = dateFromLocal(start, 7);
  return {
    startsAt: reference,
    endsAt: zonedDateTimeToUtc({ ...end, hour: 0, minute: 0, second: 0 }, timeZone),
    dateKeys: Array.from({ length: 7 }, (_, index) => localKey(dateFromLocal(start, index))),
  };
}

export function summarizeAdvancedReportingAnalytics(input: {
  selectedRangeAppointments: AnalyticsAppointment[];
  weeklyAppointments: AnalyticsAppointment[];
  cohortAppointments: AnalyticsAppointment[];
  futureAppointments: AnalyticsAppointment[];
  futurePayments: AnalyticsPayment[];
  timeZone: string;
  reference?: Date;
}) {
  const reference = input.reference ?? new Date();
  const currentWeek = localWeekRange(input.timeZone, reference);
  const previousWeekStart = new Date(currentWeek.startsAt);
  previousWeekStart.setUTCDate(previousWeekStart.getUTCDate() - 7);
  const currentRows = input.weeklyAppointments.filter(appointment => appointment.startsAt >= currentWeek.startsAt && appointment.startsAt < currentWeek.endsAt && activeBookingStatuses.has(appointment.status));
  const previousRows = input.weeklyAppointments.filter(appointment => appointment.startsAt >= previousWeekStart && appointment.startsAt < currentWeek.startsAt && activeBookingStatuses.has(appointment.status));
  const summarizeWeek = (rows: AnalyticsAppointment[]) => ({ bookingCount: rows.length, bookedRevenueTetri: rows.reduce((sum, appointment) => sum + appointment.totalTetri, 0), completedCount: rows.filter(appointment => appointment.status === "COMPLETED").length });
  const current = summarizeWeek(currentRows);
  const previous = summarizeWeek(previousRows);

  const completedByClient = new Map<string, AnalyticsAppointment[]>();
  for (const appointment of input.cohortAppointments.filter(appointment => appointment.status === "COMPLETED" && appointment.clientId && appointment.startsAt <= reference)) {
    const rows = completedByClient.get(appointment.clientId!) ?? [];
    rows.push(appointment);
    completedByClient.set(appointment.clientId!, rows);
  }
  const cohortMap = new Map<string, { cohortMonth: string; clients: number; returningClients: number }>();
  for (const visits of Array.from(completedByClient.values())) {
    visits.sort((left, right) => left.startsAt.getTime() - right.startsAt.getTime());
    const first = visits[0];
    const cohortMonth = localMonthKey(first.startsAt, input.timeZone);
    const currentCohort = cohortMap.get(cohortMonth) ?? { cohortMonth, clients: 0, returningClients: 0 };
    currentCohort.clients += 1;
    if (visits.some(visit => localMonthKey(visit.startsAt, input.timeZone) > cohortMonth)) currentCohort.returningClients += 1;
    cohortMap.set(cohortMonth, currentCohort);
  }
  const retentionCohorts = Array.from(cohortMap.values()).sort((left, right) => right.cohortMonth.localeCompare(left.cohortMonth)).slice(0, 6).reverse().map(cohort => ({ ...cohort, retentionBasisPoints: cohort.clients ? Math.round((cohort.returningClients * 10_000) / cohort.clients) : 0 }));

  const heatmapRows = Array.from({ length: 7 }, (_, weekday) => ({ weekday, hours: new Map<number, number>() }));
  const observedHours = new Set<number>();
  for (const appointment of input.selectedRangeAppointments.filter(appointment => activeBookingStatuses.has(appointment.status))) {
    const weekday = localDayOfWeek(appointment.startsAt, input.timeZone);
    const hour = localParts(appointment.startsAt, input.timeZone).hour;
    observedHours.add(hour);
    heatmapRows[weekday].hours.set(hour, (heatmapRows[weekday].hours.get(hour) ?? 0) + 1);
  }
  const hours = Array.from(observedHours).sort((left, right) => left - right);
  const peakHourHeatmap = { hours, maxBookingCount: Math.max(0, ...heatmapRows.flatMap(row => Array.from(row.hours.values()))), rows: heatmapRows.map(row => ({ weekday: row.weekday, counts: hours.map(hour => row.hours.get(hour) ?? 0) })) };

  const forecastRange = nextSevenDaysRange(input.timeZone, reference);
  const paidByAppointment = new Map<string, number>();
  for (const payment of input.futurePayments) if (paidPaymentStatuses.has(payment.status)) paidByAppointment.set(payment.appointmentId, (paidByAppointment.get(payment.appointmentId) ?? 0) + Math.max(0, payment.amountTetri - payment.refundedTetri));
  const forecastByDate = new Map(forecastRange.dateKeys.map(date => [date, { date, appointmentCount: 0, scheduledTetri: 0, expectedCollectionTetri: 0 }]));
  for (const appointment of input.futureAppointments.filter(appointment => appointment.startsAt >= reference && forecastStatuses.has(appointment.status))) {
    const date = dateKeyInTimeZone(appointment.startsAt, input.timeZone);
    const day = forecastByDate.get(date);
    if (!day) continue;
    day.appointmentCount += 1;
    day.scheduledTetri += appointment.totalTetri;
    day.expectedCollectionTetri += Math.max(0, appointment.totalTetri - (paidByAppointment.get(appointment.id) ?? 0));
  }
  const bookingForecast = Array.from(forecastByDate.values());
  return {
    weekComparison: {
      current,
      previous,
      bookedRevenueDeltaTetri: current.bookedRevenueTetri - previous.bookedRevenueTetri,
      bookingCountDelta: current.bookingCount - previous.bookingCount,
      currentWeekStartDate: currentWeek.startDateKey,
      currentWeekEndDate: currentWeek.endDateKey,
    },
    retentionCohorts,
    peakHourHeatmap,
    bookingForecast: { days: bookingForecast, scheduledTetri: bookingForecast.reduce((sum, day) => sum + day.scheduledTetri, 0), expectedCollectionTetri: bookingForecast.reduce((sum, day) => sum + day.expectedCollectionTetri, 0) },
  };
}
