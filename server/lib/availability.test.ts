import { describe, expect, it } from "vitest";
import { generateAvailableSlots, isSlotAvailable } from "./availability";

const at = (time: string) => new Date(`2026-08-12T${time}:00.000Z`);

describe("server-side availability", () => {
  it("rejects service buffers that overlap an existing appointment", () => {
    expect(isSlotAvailable(at("10:00"), at("11:00"), [{ startsAt: at("09:30"), endsAt: at("10:00") }], 15, 0)).toBe(false);
    expect(isSlotAvailable(at("10:15"), at("11:15"), [{ startsAt: at("09:30"), endsAt: at("10:00") }], 15, 0)).toBe(true);
  });

  it("generates only slots inside opening hours and outside occupied time", () => {
    const slots = generateAvailableSlots({
      openingStart: at("09:00"),
      openingEnd: at("11:00"),
      durationMinutes: 60,
      slotIntervalMinutes: 30,
      busyIntervals: [{ startsAt: at("10:00"), endsAt: at("11:00") }],
    });
    expect(slots.map(slot => slot.startsAt.toISOString().slice(11, 16))).toEqual(["09:00"]);
  });
});
