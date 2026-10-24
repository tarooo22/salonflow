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
  ka: { step: "ნაბიჯი", done: " — შესრულებულია", hours: (title: string) => `${title} საათები`, date: "თარიღი", prevDays: "წინა დღეები", nextDays: "შემდეგი დღეები", today: "დღეს", todayLong: ", დღეს", past: ", გასულია", closed: ", დახურულია", closedShort: "დაკეტ." },
  en: { step: "Step", done: " — completed", hours: (title: string) => `${title} times`, date: "Date", prevDays: "Previous days", nextDays: "Next days", today: "Today", todayLong: ", today", past: ", past", closed: ", closed", closedShort: "Closed" },
  ru: { step: "Шаг", done: " — завершено", hours: (title: string) => `Время: ${title}`, date: "Дата", prevDays: "Предыдущие дни", nextDays: "Следующие дни", today: "Сегодня", todayLong: ", сегодня", past: ", прошёл", closed: ", закрыто", closedShort: "Закр." },
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

export type BookingChoice = { id: string; text: string; onChange?: () => void; changeLabel?: string; changeAria?: string };

// Sticky strip under the card header: what has been chosen so far. Chips with onChange carry a "შეცვლა" button.
export function BookingChoiceStrip({ choices, label }: { choices: BookingChoice[]; label: string }) {
  if (!choices.length) return null;
  return <div className="cwb-choices" role="group" aria-label={label}>{choices.map(choice => <span key={choice.id} className={choice.onChange ? "cwb-chip" : "cwb-chip cwb-chip-fixed"}>
    <span className="cwb-chip-text">{choice.text}</span>
    {choice.onChange ? <button type="button" className="cwb-chip-change" aria-label={choice.changeAria} onClick={choice.onChange}>{choice.changeLabel}</button> : null}
  </span>)}</div>;
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

export function BookingSlotGroup({ title, slots, selectedStartsAt, onSelect, conversionEvent }: { title: string; slots: BookingSlot[]; selectedStartsAt: string; onSelect: (startsAt: string) => void; conversionEvent?: string }) {
  const text = ui[usePublicLocale().locale];
  if (!slots.length) return null;
  return <section className="cwb-slot-group" aria-label={text.hours(title)}>
    <h3 className="cwb-slot-title">{title}</h3>
    <div className="cwb-slots">{slots.map(slot => {
      const active = selectedStartsAt === slot.startsAt;
      return <button key={slot.startsAt} type="button" className="cwb-slot" data-conversion-event={conversionEvent} aria-pressed={active} onClick={() => onSelect(slot.startsAt)}>{active ? <Check className="size-4 shrink-0" aria-hidden="true" /> : null}{slot.label}</button>;
    })}</div>
  </section>;
}

export type BookingDay = { key: string; closed?: boolean };

// Horizontal date strip of 56 x 64 day cards: weekday, day number, and "today" or "closed" underneath. Past and closed days are disabled.
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
  return <div className="cwb-dates-wrap" role="group" aria-label={label ?? text.date}>
    <button type="button" className="cwb-date-nav" aria-label={text.prevDays} onClick={() => scrollBy(-1)}><ChevronLeft className="size-5" aria-hidden="true" /></button>
    <div className="cwb-dates" ref={scroller}>{days.map(day => {
      const [, month, dayNumber] = day.key.split("-").map(Number) as [number, number, number];
      const past = day.key < todayKey;
      const disabled = past || Boolean(day.closed);
      const isToday = day.key === todayKey;
      const weekday = schemaWeekdayOf(day.key);
      const full = `${names.weekdayFull[weekday]}, ${dayNumber} ${names.monthFull[month - 1]}${isToday ? text.todayLong : ""}${past ? text.past : day.closed ? text.closed : ""}`;
      return <button key={day.key} type="button" className="cwb-date" disabled={disabled} aria-pressed={day.key === selected} aria-label={full} onClick={() => onSelect(day.key)}>
        <span className="cwb-date-weekday" aria-hidden="true">{names.weekdayShort[weekday]}</span>
        <span className="cwb-date-day" aria-hidden="true">{dayNumber}</span>
        <span className="cwb-date-sub" aria-hidden="true">{day.closed ? text.closedShort : isToday ? text.today : " "}</span>
      </button>;
    })}</div>
    <button type="button" className="cwb-date-nav" aria-label={text.nextDays} onClick={() => scrollBy(1)}><ChevronRight className="size-5" aria-hidden="true" /></button>
  </div>;
}

export function BookingNotice({ tone = "info", title, children, noticeRef, role }: { tone?: "info" | "error" | "ok"; title?: string; children?: ReactNode; noticeRef?: React.RefObject<HTMLDivElement | null>; role?: "alert" | "status" }) {
  const Icon = tone === "ok" ? CircleCheck : CircleAlert;
  return <div ref={noticeRef} tabIndex={noticeRef ? -1 : undefined} role={role ?? (tone === "error" ? "alert" : undefined)} data-tone={tone} className="cwb-notice">
    <Icon className="size-5" aria-hidden="true" />
    <div className="min-w-0">{title ? <p className="cwb-notice-title">{title}</p> : null}{children ? <div>{children}</div> : null}</div>
  </div>;
}

// Sticky bottom bar: running summary + total, and the one primary button. The button uses
// aria-disabled (not disabled) so it stays focusable and its reason is announced via the hint.
export function BookingBar({ summary, total, label, blocked, hint, onClick, conversionEvent }: { summary?: string; total?: string; label: string; blocked: boolean; hint?: string; onClick: () => void; conversionEvent?: string }) {
  // Nothing chosen yet: the bar is just the disabled button, no empty summary or 0,00 total.
  return <div className="cwb-bar" data-bare={!summary}>
    {summary ? <div>
      <p className="cwb-bar-sum">{summary}</p>
      <p className="cwb-bar-total">{total}</p>
    </div> : null}
    <button type="button" className="cwb-btn cwb-btn-primary" aria-disabled={blocked} aria-describedby={hint ? "booking-bar-hint" : undefined} data-conversion-event={blocked ? undefined : conversionEvent} onClick={onClick}>{label}</button>
    {hint ? <p id="booking-bar-hint" className="cwb-bar-hint">{hint}</p> : null}
  </div>;
}
