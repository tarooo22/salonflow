import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GeorgianDatePicker } from "@/components/public/GeorgianDateTimePicker";
import { localInputToUtc, timeKeyInTimeZone, dateKeyInTimeZone } from "@shared/timezones";

export type RescheduleTarget = { id: string; staffProfileId: string; startsAt: Date; clientName: string; service: string };

/** 15-minute start times between the board's first and last row, plus the current start if it falls outside that grid. */
function timeOptions(firstHour: number, lastHour: number, current: string) {
  const options = Array.from({ length: (lastHour - firstHour) * 4 }, (_, index) => { const minutes = firstHour * 60 + index * 15; return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`; });
  return options.includes(current) ? options : [...options, current].sort();
}

/**
 * Moves a booking without dragging. The server re-checks availability in the reschedule transaction; its message is shown here and the dialog stays open.
 * When the only problem is working hours (`outsideHours`) and the user may override, a secondary action resubmits the same time with the override.
 */
export function RescheduleDialog({ target, timezone, staff, firstHour, lastHour, pending, error, outsideHours = false, canOverrideHours = false, onSubmit, onClose }: {
  target: RescheduleTarget;
  timezone: string;
  staff: Array<{ id: string; name: string }>;
  firstHour: number;
  lastHour: number;
  pending: boolean;
  error?: string;
  outsideHours?: boolean;
  canOverrideHours?: boolean;
  onSubmit: (startsAt: Date, staffProfileId: string, allowOutsideHours?: boolean) => void;
  onClose: () => void;
}) {
  const initialDate = dateKeyInTimeZone(target.startsAt, timezone);
  const initialTime = timeKeyInTimeZone(target.startsAt, timezone);
  const [date, setDate] = useState(initialDate);
  const [time, setTime] = useState(initialTime);
  const [staffId, setStaffId] = useState(target.staffProfileId);
  const times = useMemo(() => timeOptions(firstHour, lastHour, initialTime), [firstHour, lastHour, initialTime]);
  const startsAt = localInputToUtc(`${date}T${time}`, timezone);
  const changed = date !== initialDate || time !== initialTime || staffId !== target.staffProfileId;
  const canSubmit = changed && !pending && !Number.isNaN(startsAt.getTime());
  // The override applies only to the exact time and specialist the server just rejected for hours.
  const [submittedKey, setSubmittedKey] = useState("");
  const currentKey = `${date}T${time}|${staffId}`;
  const offerOverride = outsideHours && canOverrideHours && canSubmit && submittedKey === currentKey;
  const submit = (allowOutsideHours?: boolean) => { setSubmittedKey(currentKey); onSubmit(startsAt, staffId, allowOutsideHours); };
  return <Dialog open onOpenChange={open => { if (!open && !pending) onClose(); }}>
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>ჯავშნის გადატანა</DialogTitle>
        <DialogDescription>{target.clientName} · {target.service}</DialogDescription>
      </DialogHeader>
      <form className="grid gap-4" onSubmit={event => { event.preventDefault(); if (canSubmit) submit(); }}>
        <div className="grid gap-1.5 text-sm font-medium"><span id="reschedule-date-label">თარიღი</span><GeorgianDatePicker value={date} onChange={setDate} timeZone={timezone} disabled={pending} /></div>
        <div className="grid gap-1.5 text-sm font-medium"><span id="reschedule-time-label">დაწყების დრო</span>
          <Select value={time} onValueChange={setTime} disabled={pending}><SelectTrigger aria-labelledby="reschedule-time-label" className="min-h-11 w-full bg-card"><SelectValue /></SelectTrigger><SelectContent>{times.map(item => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select>
        </div>
        <div className="grid gap-1.5 text-sm font-medium"><span id="reschedule-staff-label">სპეციალისტი</span>
          <Select value={staffId} onValueChange={setStaffId} disabled={pending}><SelectTrigger aria-labelledby="reschedule-staff-label" className="min-h-11 w-full bg-card"><SelectValue /></SelectTrigger><SelectContent>{staff.map(item => <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>)}</SelectContent></Select>
        </div>
        {error ? <p role="alert" className="rounded-lg border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm font-medium text-destructive">{error}</p> : null}
        <DialogFooter className="gap-2 max-sm:flex-col-reverse">
          <Button type="button" variant="outline" className="min-h-11" disabled={pending} onClick={onClose}>დახურვა</Button>
          {offerOverride ? <Button type="button" variant="secondary" className="min-h-11" onClick={() => submit(true)}>მაინც გადატანა</Button> : null}
          <Button type="submit" className="min-h-11" disabled={!canSubmit}>{pending ? "გადააქვს…" : "გადატანა"}</Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>;
}
