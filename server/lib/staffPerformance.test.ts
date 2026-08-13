import { describe, expect, it } from "vitest";
import { summarizeStaffPerformance } from "./staffPerformance";

describe("staff performance aggregation", () => {
  it("uses only real non-cancelled appointment totals and preserves integer tetri", () => {
    expect(summarizeStaffPerformance(["staff_a", "staff_b"], [
      { staffProfileId: "staff_a", status: "COMPLETED", totalTetri: 12_500 },
      { staffProfileId: "staff_a", status: "CONFIRMED", totalTetri: 8_000 },
      { staffProfileId: "staff_a", status: "CANCELLED", totalTetri: 7_000 },
      { staffProfileId: "staff_b", status: "COMPLETED", totalTetri: 9_999 },
    ])).toEqual([
      { staffProfileId: "staff_a", completedAppointments: 1, serviceVolume: 2, bookedRevenueTetri: 20_500 },
      { staffProfileId: "staff_b", completedAppointments: 1, serviceVolume: 1, bookedRevenueTetri: 9_999 },
    ]);
  });
});
