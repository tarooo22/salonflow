import { Check, ChevronLeft, ChevronRight, CircleAlert, CircleCheck } from "lucide-react";
import { type PublicLocale, usePublicLocale } from "@/contexts/PublicLocaleContext";
import React, { useRef, type ReactNode, type Ref } from "react";
import "../catalog/booking.css";

export type BookingSlot = { startsAt: string; label: string };

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
  ka: { step: "ნაბიჯი", done: " — შესრულებულია", hours: (title: string) => `${title} საათები`, date: "თარიღი", prevDays: "წინა დღეები", nextDays: "შემდეგი დღეები", today: "დღეს", todayLong: ", დღეს", past: ", გასულია", closed: ", დახურულია" },
  en: { step: "Step", done: " — completed", hours: (title: string) => `${title} times`, date: "Date", prevDays: "Previous days", nextDays: "Next days", today: "Today", todayLong: ", today", past: ", past", closed: ", closed" },
  ru: { step: "Шаг", done: " — завершено", hours: (title: string) => `Время: ${title}`, date: "Дата", prevDays: "Предыдущие дни", nextDays: "Следующие дни", today: "Сегодня", todayLong: ", сегодня", past: ", прошёл", closed: ", закрыто" },
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

export function BookingStepHeader({ step, total = 4, title, description, headingRef }: { step: number; total?: number; title: string; description?: string; headingRef?: Ref<HTMLHeadingElement> }) {
  const text = ui[usePublicLocale().locale];
  return <header>
    <span className="cw-caption cw-step-eyebrow">{text.step} <span className="cw-num">{step} / {total}</span></span>
    <h1 ref={headingRef} tabIndex={-1} className="cw-step-title">{title}</h1>
    {description ? <p className="cw-step-lede">{description}</p> : null}
  </header>;
}

export function BookingRail({ steps, current, onGo, label }: { steps: string[]; current: number; onGo?: (index: number) => void; label: string }) {
  const text = ui[usePublicLocale().locale];
  return <ol className="cw-rail" aria-label={label}>{steps.map((name, index) => {
    const state = index < current ? "done" : index === current ? "current" : "todo";
    const inner = <>
      <span className="cw-rail-box" aria-hidden="true">{state === "done" ? <Check className="size-4" /> : index + 1}</span>
      <span className="cw-rail-label">{name}<span className="sr-only">{state === "done" ? text.done : ""}</span></span>
    </>;
    return <li key={name} className="cw-rail-item" data-state={state} aria-current={state === "current" ? "step" : undefined}>
      {state === "done" && onGo ? <button type="button" className="cw-rail-step" onClick={() => onGo(index)}>{inner}</button> : <span className="cw-rail-step">{inner}</span>}
    </li>;
  })}</ol>;
}

export function BookingBusinessStrip({ name, address, children }: { name: string; address?: string | null; children?: ReactNode }) {
  return <>
    <div className="cw-biz">
      <span className="cw-biz-thumb" aria-hidden="true">{name.trim().charAt(0).toUpperCase() || "·"}</span>
      <div className="min-w-0">
        <p className="cw-biz-name">{name}</p>
        {address ? <p className="mt-0.5 text-sm text-[var(--cw-ink-soft)]">{address}</p> : null}
      </div>
    </div>
    {children}
  </>;
}

// One row of a multi-select (checkbox) or single-select (radio) list. The input is native, so the
// keyboard path (Space, arrow keys inside a radio group) and screen-reader semantics come for free.
export function BookingChoiceCard({ selected, onSelect, children, label, conversionEvent, kind = "checkbox", name }: { selected: boolean; onSelect: () => void; children: ReactNode; label: string; conversionEvent?: string; kind?: "checkbox" | "radio"; name?: string }) {
  return <label className="cw-choice" data-checked={selected}>
    <input type={kind} className="cw-check" name={name} checked={selected} onChange={onSelect} aria-label={label} data-conversion-event={conversionEvent} />
    <span className="min-w-0">{children}</span>
  </label>;
}

export function BookingSlotGroup({ title, slots, selectedStartsAt, onSelect, conversionEvent }: { title: string; slots: BookingSlot[]; selectedStartsAt: string; onSelect: (startsAt: string) => void; conversionEvent?: string }) {
  const text = ui[usePublicLocale().locale];
  if (!slots.length) return null;
  return <section className="cw-slot-group" aria-label={text.hours(title)}>
    <h3 className="cw-caption">{title}</h3>
    <div className="cw-slots">{slots.map(slot => {
      const active = selectedStartsAt === slot.startsAt;
      return <button key={slot.startsAt} type="button" className="cw-slot" data-conversion-event={conversionEvent} aria-pressed={active} onClick={() => onSelect(slot.startsAt)}>{slot.label}</button>;
    })}</div>
  </section>;
}

export type BookingDay = { key: string; closed?: boolean };

// Horizontal date strip: weekday, day number, month. Today is marked, past and closed days are disabled.
export function BookingDateStrip({ days, selected, todayKey, onSelect, label }: { days: BookingDay[]; selected: string; todayKey: string; onSelect: (key: string) => void; label?: string }) {
  const { locale } = usePublicLocale();
  const text = ui[locale];
  const names = DATE_NAMES[locale];
  const scroller = useRef<HTMLDivElement>(null);
  const scrollBy = (direction: 1 | -1) => {
    const element = scroller.current;
    if (!element) return;
    const reduced = typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    element.scrollBy({ left: direction * element.clientWidth * 0.8, behavior: reduced ? "auto" : "smooth" });
  };
  return <div className="cw-dates-wrap" role="group" aria-label={label ?? text.date}>
    <button type="button" className="cw-date-nav" aria-label={text.prevDays} onClick={() => scrollBy(-1)}><ChevronLeft className="size-5" aria-hidden="true" /></button>
    <div className="cw-dates" ref={scroller}>{days.map(day => {
      const [, month, dayNumber] = day.key.split("-").map(Number) as [number, number, number];
      const past = day.key < todayKey;
      const disabled = past || Boolean(day.closed);
      const isToday = day.key === todayKey;
      const weekday = schemaWeekdayOf(day.key);
      const full = `${names.weekdayFull[weekday]}, ${dayNumber} ${names.monthFull[month - 1]}${isToday ? text.todayLong : ""}${past ? text.past : day.closed ? text.closed : ""}`;
      return <button key={day.key} type="button" className="cw-date" disabled={disabled} aria-pressed={day.key === selected} aria-label={full} data-today={isToday} onClick={() => onSelect(day.key)}>
        <span className="cw-date-weekday" aria-hidden="true">{names.weekdayShort[weekday]}</span>
        <span className="cw-date-day" aria-hidden="true">{dayNumber}</span>
        <span className="cw-date-month" aria-hidden="true">{names.monthShort[month - 1]}</span>
        {isToday ? <span className="cw-date-today" aria-hidden="true">{text.today}</span> : null}
      </button>;
    })}</div>
    <button type="button" className="cw-date-nav" aria-label={text.nextDays} onClick={() => scrollBy(1)}><ChevronRight className="size-5" aria-hidden="true" /></button>
  </div>;
}

export function BookingNotice({ tone = "info", title, children, noticeRef, role }: { tone?: "info" | "error" | "ok"; title?: string; children?: ReactNode; noticeRef?: React.RefObject<HTMLDivElement | null>; role?: "alert" | "status" }) {
  const Icon = tone === "ok" ? CircleCheck : CircleAlert;
  return <div ref={noticeRef} tabIndex={noticeRef ? -1 : undefined} role={role ?? (tone === "error" ? "alert" : undefined)} data-tone={tone} className="cw-notice">
    <Icon className="size-5" aria-hidden="true" />
    <div className="min-w-0">{title ? <p className="cw-notice-title">{title}</p> : null}{children ? <div>{children}</div> : null}</div>
  </div>;
}

// Sticky bottom bar: running summary + total, and the one primary stamp button. The button uses
// aria-disabled (not disabled) so it stays focusable and its reason is announced via the hint.
export function BookingBar({ summary, total, label, blocked, hint, onClick, conversionEvent }: { summary: string; total: string; label: string; blocked: boolean; hint?: string; onClick: () => void; conversionEvent?: string }) {
  return <div className="cw-bar">
    <div>
      <p className="cw-bar-sum">{summary}</p>
      <p className="cw-bar-total">{total}</p>
    </div>
    <button type="button" className="cw-btn cw-btn-stamp" aria-disabled={blocked} aria-describedby={hint ? "booking-bar-hint" : undefined} data-conversion-event={blocked ? undefined : conversionEvent} onClick={onClick}>{label}</button>
    {hint ? <p id="booking-bar-hint" className="cw-bar-hint">{hint}</p> : null}
  </div>;
}
