import { CalendarDays, Minus, TrendingDown, TrendingUp } from "lucide-react";
import React, { Fragment } from "react";
import { formatGelTetri } from "@/lib/presentation";

type WeekComparison = { current: { bookingCount: number; bookedRevenueTetri: number; completedCount: number }; previous: { bookingCount: number; bookedRevenueTetri: number; completedCount: number }; bookedRevenueDeltaTetri: number; bookingCountDelta: number; currentWeekStartDate: string; currentWeekEndDate: string };
type Cohort = { cohortMonth: string; clients: number; returningClients: number; retentionBasisPoints: number };
type Heatmap = { hours: number[]; maxBookingCount: number; rows: Array<{ weekday: number; counts: number[] }> };
type Forecast = { days: Array<{ date: string; appointmentCount: number; scheduledTetri: number; expectedCollectionTetri: number }>; scheduledTetri: number; expectedCollectionTetri: number };

const weekdayLabels = ["კვ", "ორ", "სა", "ოთ", "ხუ", "პა", "შა"];
const heatTone = (count: number, max: number) => {
  if (!count || !max) return "bg-muted/25 text-muted-foreground";
  const ratio = count / max;
  if (ratio > 0.72) return "bg-[var(--sf-fuchsia)] text-white";
  if (ratio > 0.38) return "bg-primary/55 text-primary-foreground";
  return "bg-primary/20 text-foreground";
};
const monthLabel = (month: string) => new Intl.DateTimeFormat("ka-GE", { month: "short", year: "numeric" }).format(new Date(`${month}-01T12:00:00Z`));
const dateLabel = (date: string) => new Intl.DateTimeFormat("ka-GE", { weekday: "short", day: "2-digit", month: "short" }).format(new Date(`${date}T12:00:00Z`));

function Delta({ value, unit = "₾" }: { value: number; unit?: string }) {
  const Icon = value > 0 ? TrendingUp : value < 0 ? TrendingDown : Minus;
  const tone = value > 0 ? "text-[var(--sf-jade)]" : value < 0 ? "text-destructive" : "text-muted-foreground";
  return <span className={`inline-flex items-center gap-1 text-xs font-semibold ${tone}`}><Icon className="size-3.5" />{value > 0 ? "+" : ""}{unit === "₾" ? formatGelTetri(value) : `${value} ${unit}`}</span>;
}

export function WeekComparisonPanel({ data }: { data: WeekComparison }) {
  return <div className="grid gap-3 sm:grid-cols-2"><article className="rounded-xl border bg-muted/20 p-4"><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">ეს კვირა vs წინა</p><p className="mt-2 text-2xl font-semibold">{formatGelTetri(data.current.bookedRevenueTetri)}</p><div className="mt-2 flex items-center justify-between gap-3"><Delta value={data.bookedRevenueDeltaTetri} /><span className="text-xs text-muted-foreground">{data.current.bookingCount} ჯავშანი</span></div><p className="mt-3 text-xs leading-5 text-muted-foreground">ჯავშნის ღირებულება (გაუქმებულის გამოკლებით); ეს არ არის მიღებული გადახდის ანგარიში.</p></article><article className="rounded-xl border bg-muted/20 p-4"><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">ჯავშნების ცვლილება</p><p className="mt-2 text-2xl font-semibold">{data.current.bookingCount}</p><div className="mt-2 flex items-center justify-between gap-3"><Delta value={data.bookingCountDelta} unit="ჯავშანი" /><span className="text-xs text-muted-foreground">{data.current.completedCount} დასრულებული</span></div><p className="mt-3 text-xs leading-5 text-muted-foreground">მიმდინარე კვირა: {dateLabel(data.currentWeekStartDate)} – {dateLabel(data.currentWeekEndDate)}.</p></article></div>;
}

export function RetentionCohortPanel({ data }: { data: Cohort[] }) {
  if (!data.length) return <p className="rounded-xl border border-dashed p-5 text-sm text-muted-foreground">Cohort retention-ისთვის საჭიროა მინიმუმ ერთი დასრულებული კლიენტური ვიზიტი.</p>;
  return <div className="overflow-x-auto rounded-xl border"><table className="w-full min-w-[450px] text-left text-sm"><thead className="bg-muted/55 text-xs text-muted-foreground"><tr><th className="px-3 py-2.5 font-semibold">პირველი ვიზიტის თვე</th><th className="px-3 py-2.5 text-right font-semibold">კლიენტები</th><th className="px-3 py-2.5 text-right font-semibold">დაბრუნდნენ</th><th className="px-3 py-2.5 text-right font-semibold">Retention</th></tr></thead><tbody className="divide-y">{data.map(row => <tr key={row.cohortMonth}><td className="px-3 py-3 font-medium">{monthLabel(row.cohortMonth)}</td><td className="px-3 py-3 text-right">{row.clients}</td><td className="px-3 py-3 text-right">{row.returningClients}</td><td className="px-3 py-3 text-right font-semibold">{(row.retentionBasisPoints / 100).toFixed(2)}%</td></tr>)}</tbody></table></div>;
}

export function PeakHourHeatmapPanel({ data }: { data: Heatmap }) {
  if (!data.hours.length) return <p className="rounded-xl border border-dashed p-5 text-sm text-muted-foreground">არჩეულ პერიოდში აქტიური ჯავშნების დროითი პატერნი ჯერ არ არის.</p>;
  const weekdayOrder = [1, 2, 3, 4, 5, 6, 0];
  return <div className="space-y-3"><div className="overflow-x-auto"><div className="grid min-w-[520px] gap-1" style={{ gridTemplateColumns: `54px repeat(${data.hours.length}, minmax(42px, 1fr))` }}><span className="p-2 text-xs text-muted-foreground">დღე/საათი</span>{data.hours.map(hour => <span key={hour} className="p-2 text-center text-xs font-medium text-muted-foreground">{String(hour).padStart(2, "0")}:00</span>)}{weekdayOrder.map(weekday => { const row = data.rows.find(item => item.weekday === weekday); return <Fragment key={weekday}><span className="flex items-center px-2 text-xs font-semibold text-muted-foreground">{weekdayLabels[weekday]}</span>{data.hours.map((hour, index) => { const count = row?.counts[index] ?? 0; return <span key={`${weekday}-${hour}`} tabIndex={0} role="img" aria-label={`${weekdayLabels[weekday]}, ${String(hour).padStart(2, "0")}:00 — ${count} ჯავშანი`} className={`grid min-h-10 place-items-center rounded-md text-xs font-semibold outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring ${heatTone(count, data.maxBookingCount)}`}>{count || "—"}</span>; })}</Fragment>; })}</div></div><div className="flex items-center gap-2 text-xs text-muted-foreground"><span>ნაკლები</span><span className="size-3 rounded bg-muted/25" /><span className="size-3 rounded bg-primary/20" /><span className="size-3 rounded bg-primary/55" /><span className="size-3 rounded bg-[var(--sf-fuchsia)]" /><span>მეტი</span></div></div>;
}

export function BookingForecastPanel({ data }: { data: Forecast }) {
  return <div className="space-y-4"><div className="grid gap-3 sm:grid-cols-2"><div className="rounded-xl border bg-primary/7 p-4"><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">7 დღის ჯავშნების ღირებულება</p><p className="mt-2 text-xl font-semibold">{formatGelTetri(data.scheduledTetri)}</p></div><div className="rounded-xl border bg-[var(--sf-amber)]/10 p-4"><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">ჯერ მოსალოდნელი მიღება</p><p className="mt-2 text-xl font-semibold">{formatGelTetri(data.expectedCollectionTetri)}</p></div></div><div className="overflow-x-auto rounded-xl border"><table className="w-full min-w-[530px] text-left text-sm"><thead className="bg-muted/55 text-xs text-muted-foreground"><tr><th className="px-3 py-2.5 font-semibold">თარიღი</th><th className="px-3 py-2.5 text-right font-semibold">ჯავშანი</th><th className="px-3 py-2.5 text-right font-semibold">დაგეგმილი ღირებულება</th><th className="px-3 py-2.5 text-right font-semibold">ჯერ მოსალოდნელი</th></tr></thead><tbody className="divide-y">{data.days.map(day => <tr key={day.date}><td className="px-3 py-3 font-medium">{dateLabel(day.date)}</td><td className="px-3 py-3 text-right">{day.appointmentCount}</td><td className="px-3 py-3 text-right">{formatGelTetri(day.scheduledTetri)}</td><td className="px-3 py-3 text-right font-semibold">{formatGelTetri(day.expectedCollectionTetri)}</td></tr>)}</tbody></table></div><p className="flex gap-2 rounded-lg border border-[var(--sf-amber)]/25 bg-[var(--sf-amber)]/10 p-3 text-xs leading-5 text-muted-foreground"><CalendarDays className="mt-0.5 size-4 shrink-0 text-[var(--sf-amber)]" />ეს არის booking-based forecast: მოიცავს მხოლოდ მომდევნო 7 დღის pending/confirmed/in-service ჯავშნების დარჩენილ თანხას. არ არის გარანტირებული cash collection და არ მოიცავს გაუქმებულ, no-show ან უკვე სრულად გადახდილ თანხას.</p></div>;
}
