import { ChevronLeft, ChevronRight, CircleAlert, CircleCheck } from "lucide-react";
import { Ring } from "@/components/brand/Ring";
import { type PublicLocale, usePublicLocale } from "@/contexts/PublicLocaleContext";
import React, { useEffect, useMemo, useState, type KeyboardEvent, type ReactNode, type Ref } from "react";
import "../catalog/booking.css";

export type BookingSlot = { startsAt: string; label: string; unavailable?: boolean };

export const WEEKDAY_FULL = ["ორშაბათი", "სამშაბათი", "ოთხშაბათი", "ხუთშაბათი", "პარასკევი", "შაბათი", "კვირა"];
const WEEKDAY_SHORT = ["ორშ", "სამ", "ოთხ", "ხუთ", "პარ", "შაბ", "კვ"];
const MONTH_SHORT = ["იან", "თებ", "მარ", "აპრ", "მაი", "ივნ", "ივლ", "აგვ", "სექ", "ოქტ", "ნოე", "დეკ"];
const MONTH_FULL = ["იანვარი", "თებერვალი", "მარტი", "აპრილი", "მაისი", "ივნისი", "ივლისი", "აგვისტო", "სექტემბერი", "ოქტომბერი", "ნოემბერი", "დეკემბერი"];

// Weekday and month names per language; Russian months are in the genitive because they follow a day number.
export const DATE_NAMES = {
  ka: { weekdayFull: WEEKDAY_FULL, weekdayShort: WEEKDAY_SHORT, monthShort: MONTH_SHORT, monthFull: MONTH_FULL },
  en: {
    weekdayFull: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
    weekdayShort: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    monthShort: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
    monthFull: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
  },
  ru: {
    weekdayFull: ["Понедельник", "Вторник", "Среда", "Четверг", "Пятница", "Суббота", "Воскресенье"],
    weekdayShort: ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"],
    monthShort: ["янв", "фев", "мар", "апр", "мая", "июн", "июл", "авг", "сен", "окт", "ноя", "дек"],
    monthFull: ["января", "февраля", "марта", "апреля", "мая", "июня", "июля", "августа", "сентября", "октября", "ноября", "декабря"],
  },
} as const;

export const ui = {
  ka: { step: "ნაბიჯი", done: " — შესრულებულია", hours: (title: string) => `${title} საათები`, date: "თარიღი", prevWeek: "წინა კვირა", nextWeek: "შემდეგი კვირა", today: "დღეს", todayLong: ", დღეს", past: ", გასულია", closed: ", დახურულია", full: ", სავსეა", closedMark: "დაკეტ.", fullMark: "სავსეა" },
  en: { step: "Step", done: " — completed", hours: (title: string) => `${title} times`, date: "Date", prevWeek: "Previous week", nextWeek: "Next week", today: "Today", todayLong: ", today", past: ", past", closed: ", closed", full: ", fully booked", closedMark: "Closed", fullMark: "Full" },
  ru: { step: "Шаг", done: " — завершено", hours: (title: string) => `Время: ${title}`, date: "Дата", prevWeek: "Предыдущая неделя", nextWeek: "Следующая неделя", today: "Сегодня", todayLong: ", сегодня", past: ", прошёл", closed: ", закрыто", full: ", занято", closedMark: "Закр.", fullMark: "Занято" },
} as const;

// Date keys are "YYYY-MM-DD" strings in the location's timezone; arithmetic happens in UTC so it never drifts.
export function addDaysKey(key: string, days: number) {
  const [y, m, d] = key.split("-").map(Number) as [number, number, number];
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}
// Schema weekday: 0 = Monday ... 6 = Sunday.
export function schemaWeekdayOf(key: string) {
  const [y, m, d] = key.split("-").map(Number) as [number, number, number];
  return (new Date(Date.UTC(y, m - 1, d)).getUTCDay() + 6) % 7;
}
export function formatDateKeyLong(key: string, locale: PublicLocale = "ka") {
  const [, m, d] = key.split("-").map(Number) as [number, number, number];
  const names = DATE_NAMES[locale];
  return `${names.weekdayFull[schemaWeekdayOf(key)]}, ${d} ${names.monthFull[m - 1]}`;
}

export function BookingStepHeader({ title, description, headingRef }: { title: string; description?: string; headingRef?: Ref<HTMLHeadingElement> }) {
  return <header>
    <h1 ref={headingRef} tabIndex={-1} className="cwb-step-title">{title}</h1>
    {description ? <p className="cwb-step-lede">{description}</p> : null}
  </header>;
}

// Four-segment progress bar with "ნაბიჯი X / 4" and the current step's name.
export function BookingRail({ steps, current, label }: { steps: string[]; current: number; label: string }) {
  const text = ui[usePublicLocale().locale];
  return <div className="cwb-progress" role="group" aria-label={label}>
    <ol className="cwb-progress-bar" aria-hidden="true">{steps.map((name, index) => <li key={name} data-state={index < current ? "done" : index === current ? "current" : "todo"} />)}</ol>
    <p className="cwb-progress-text"><span>{text.step} <span className="cw-num">{current + 1} / {steps.length}</span></span><span className="cwb-progress-name">{steps[current]}</span></p>
  </div>;
}

export function BookingBusinessStrip({ name, address, action, children }: { name: string; address?: string | null; action?: ReactNode; children?: ReactNode }) {
  return <>
    <div className="cwb-biz">
      <span className="cwb-biz-thumb" aria-hidden="true">{name.trim().charAt(0).toLocaleUpperCase() || "·"}</span>
      <div className="min-w-0">
        <p className="cwb-biz-name">{name}</p>
        {address ? <p className="cwb-biz-address">{address}</p> : null}
      </div>
      {action}
    </div>
    {children}
  </>;
}

// One row of a multi-select (checkbox) or single-select (radio) list. The input is native, so the
// keyboard path (Space, arrow keys inside a radio group) and screen-reader semantics come for free.
export function BookingChoiceCard({ selected, onSelect, children, label, conversionEvent, kind = "checkbox", name, leading }: { selected: boolean; onSelect: () => void; children: ReactNode; label: string; conversionEvent?: string; kind?: "checkbox" | "radio"; name?: string; leading?: ReactNode }) {
  return <label className="cwb-row" data-checked={selected}>
    <input type={kind} className="cwb-check" name={name} checked={selected} onChange={onSelect} aria-label={label} data-conversion-event={conversionEvent} />
    {leading}
    <span className="cwb-row-body">{children}</span>
  </label>;
}

// Specialist card: the whole card is one radio. Photo (or the initial / `icon` as a fallback) wears the square ring when selected.
export function BookingStaffCard({ selected, onSelect, name, meta, extra, photoUrl, icon, label, conversionEvent }: { selected: boolean; onSelect: () => void; name: string; meta?: string | null; extra?: ReactNode; photoUrl?: string | null; icon?: ReactNode; label: string; conversionEvent?: string }) {
  return <button type="button" role="radio" className="cwb-staff" aria-checked={selected} aria-label={label} data-conversion-event={conversionEvent} onClick={onSelect}>
    <span className="cwb-staff-photo">
      <span className="cwb-staff-disc">{photoUrl ? <img src={photoUrl} alt={name} loading="lazy" /> : icon ?? (name.trim().charAt(0).toLocaleUpperCase() || "·")}</span>
      <Ring variant="square" draw={selected} />
    </span>
    <span className="cwb-staff-name">{name}</span>
    {meta ? <span className="cwb-staff-meta">{meta}</span> : null}
    {extra}
  </button>;
}

// Radio semantics for a row of buttons: arrow keys move focus between the enabled radios of the same group (Space/Enter still selects).
export function moveRadioFocus(event: KeyboardEvent<HTMLElement>) {
  if (!["ArrowRight", "ArrowDown", "ArrowLeft", "ArrowUp"].includes(event.key)) return;
  const group = (event.target as HTMLElement).closest('[role="radiogroup"]');
  if (!group) return;
  const radios = Array.from(group.querySelectorAll<HTMLElement>('[role="radio"]:not(:disabled)'));
  const index = radios.indexOf(event.target as HTMLElement);
  if (index < 0) return;
  event.preventDefault();
  const forward = event.key === "ArrowRight" || event.key === "ArrowDown";
  radios[(index + (forward ? 1 : -1) + radios.length) % radios.length]?.focus();
}

export function BookingSlotGroup({ title, slots, selectedStartsAt, onSelect, conversionEvent }: { title: string; slots: BookingSlot[]; selectedStartsAt: string; onSelect: (startsAt: string) => void; conversionEvent?: string }) {
  const text = ui[usePublicLocale().locale];
  if (!slots.length) return null;
  return <section className="cwb-slot-group">
    <h3 className="cwb-slot-title">{title}</h3>
    <div className="cwb-slots" role="radiogroup" aria-label={text.hours(title)} onKeyDown={moveRadioFocus}>{slots.map(slot => {
      const active = selectedStartsAt === slot.startsAt;
      return <button key={slot.startsAt} type="button" role="radio" className="cwb-slot" data-conversion-event={conversionEvent} aria-checked={active} disabled={slot.unavailable} onClick={() => onSelect(slot.startsAt)}>{slot.label}<Ring variant="wide" draw={active} /></button>;
    })}</div>
  </section>;
}

export type BookingDay = { key: string; closed?: boolean; full?: boolean };

const weekStartOf = (key: string) => addDaysKey(key, -schemaWeekdayOf(key));

// Compact week strip (Monday to Sunday): month label, round previous/next-week buttons and seven day circles.
// Days outside `days` (before today, past the booking window) and closed days are disabled; the selected day is a filled accent circle.
export function BookingDateStrip({ days, selected, todayKey, onSelect, label, selectableUnavailable }: { days: BookingDay[]; selected: string; todayKey: string; onSelect: (key: string) => void; label?: string; selectableUnavailable?: boolean }) {
  const { locale } = usePublicLocale();
  const text = ui[locale];
  const names = DATE_NAMES[locale];
  const [weekStart, setWeekStart] = useState(() => weekStartOf(selected || days[0]?.key || todayKey));
  const [direction, setDirection] = useState<1 | -1 | 0>(0);
  const byKey = useMemo(() => new Map(days.map(day => [day.key, day])), [days]);
  const lastKey = days[days.length - 1]?.key ?? todayKey;
  const go = (target: string) => { setDirection(target > weekStart ? 1 : -1); setWeekStart(target); };
  // A selection made elsewhere (for example "next day") that lands in another week brings that week into view.
  useEffect(() => {
    if (!selected) return;
    const target = weekStartOf(selected);
    if (target !== weekStart) { setDirection(target > weekStart ? 1 : -1); setWeekStart(target); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected]);
  const prevDisabled = addDaysKey(weekStart, -1) < todayKey;
  const nextDisabled = addDaysKey(weekStart, 7) > lastKey;
  const week = Array.from({ length: 7 }, (_, index) => addDaysKey(weekStart, index));
  const [startYear, startMonth] = weekStart.split("-").map(Number) as [number, number];
  const [endYear, endMonth] = week[6]!.split("-").map(Number) as [number, number];
  const monthLabel = startMonth === endMonth ? `${names.monthFull[startMonth - 1]} ${startYear}` : `${names.monthShort[startMonth - 1]} – ${names.monthShort[endMonth - 1]} ${endYear}`;
  return <div className="cwb-week" role="group" aria-label={label ?? text.date}>
    <div className="cwb-week-head">
      <p className="cwb-week-month" aria-live="polite">{monthLabel}</p>
      <div className="cwb-week-nav">
        <button type="button" className="cwb-week-btn" aria-label={text.prevWeek} disabled={prevDisabled} onClick={() => go(addDaysKey(weekStart, -7))}><ChevronLeft className="size-4" aria-hidden="true" /></button>
        <button type="button" className="cwb-week-btn" aria-label={text.nextWeek} disabled={nextDisabled} onClick={() => go(addDaysKey(weekStart, 7))}><ChevronRight className="size-4" aria-hidden="true" /></button>
      </div>
    </div>
    <div className="cwb-week-days" key={weekStart} data-dir={direction} role="radiogroup" aria-label={label ?? text.date} onKeyDown={moveRadioFocus}>{week.map(key => {
      const day = byKey.get(key);
      const [, month, dayNumber] = key.split("-").map(Number) as [number, number, number];
      const past = key < todayKey;
      const disabled = past || !day || (Boolean(day.closed) && !selectableUnavailable);
      const mark = !past && day ? day.closed ? text.closedMark : day.full ? text.fullMark : null : null;
      const isToday = key === todayKey;
      const weekday = schemaWeekdayOf(key);
      const full = `${names.weekdayFull[weekday]}, ${dayNumber} ${names.monthFull[month - 1]}${isToday ? text.todayLong : ""}${past ? text.past : day?.closed ? text.closed : day?.full ? text.full : ""}`;
      return <button key={key} type="button" role="radio" className="cwb-day" data-today={isToday} data-mark={mark ? "true" : undefined} disabled={disabled} aria-checked={key === selected} aria-label={full} onClick={() => onSelect(key)}>
        <span className="cwb-day-weekday" aria-hidden="true">{names.weekdayShort[weekday]}</span>
        <span className="cwb-day-num" aria-hidden="true">{dayNumber}<Ring variant="square" draw={key === selected} /></span>
        {mark ? <span className="cwb-day-mark" aria-hidden="true">{mark}</span> : null}
      </button>;
    })}</div>
  </div>;
}

export function BookingNotice({ tone = "info", title, children, noticeRef, role }: { tone?: "info" | "error" | "ok"; title?: string; children?: ReactNode; noticeRef?: React.RefObject<HTMLDivElement | null>; role?: "alert" | "status" }) {
  const Icon = tone === "ok" ? CircleCheck : CircleAlert;
  return <div ref={noticeRef} tabIndex={noticeRef ? -1 : undefined} role={role ?? (tone === "error" ? "alert" : undefined)} data-tone={tone} className="cwb-notice">
    <Icon className="size-5" aria-hidden="true" />
    <div className="min-w-0">{title ? <p className="cwb-notice-title">{title}</p> : null}{children ? <div>{children}</div> : null}</div>
  </div>;
}

// Sticky bottom bar. Phones: the left side is a button (two lines: services, then time or duration) that opens the
// summary drawer; the primary sits on the right. From 1024px the summary lives in the side card, so only the primary stays.
// The primary uses aria-disabled (not disabled) so it stays focusable and its reason is announced via the hint.
export function BookingBar({ summary, detail, label, blocked, hint, onClick, conversionEvent, summaryOpen, onOpenSummary, summaryLabel }: { summary?: string; detail?: string; label: string; blocked: boolean; hint?: string; onClick: () => void; conversionEvent?: string; summaryOpen?: boolean; onOpenSummary?: () => void; summaryLabel?: string }) {
  return <div className="cwb-bar" data-bare={!summary}>
    {summary ? <button type="button" className="cwb-bar-open" aria-expanded={Boolean(summaryOpen)} aria-haspopup="dialog" aria-label={summaryLabel ? `${summaryLabel}: ${summary}${detail ? `, ${detail}` : ""}` : undefined} onClick={onOpenSummary}>
      <span className="cwb-bar-sum">{summary}</span>
      {detail ? <span className="cwb-bar-detail">{detail}</span> : null}
    </button> : null}
    <button type="button" className="cwb-btn cwb-btn-primary" aria-disabled={blocked} aria-describedby={hint ? "booking-bar-hint" : undefined} data-conversion-event={blocked ? undefined : conversionEvent} onClick={onClick}>{label}</button>
    {hint ? <p id="booking-bar-hint" className="sr-only">{hint}</p> : null}
  </div>;
}
