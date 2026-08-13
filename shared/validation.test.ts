import { describe, expect, it } from "vitest";
import { calendarRangeSchema } from "./validation";

const scope = {
  organizationId: "organization_2026_abcd",
  locationId: "location_2026_abcdefgh",
  staffProfileId: "staff_2026_abcdefghijk",
};

describe("calendar range validation", () => {
  it("accepts an organization-scoped location and specialist filter", () => {
    const parsed = calendarRangeSchema.parse({ ...scope, startsAt: "2026-08-10T00:00:00.000Z", endsAt: "2026-08-17T00:00:00.000Z" });
    expect(parsed.locationId).toBe(scope.locationId);
    expect(parsed.staffProfileId).toBe(scope.staffProfileId);
  });

  it("rejects ranges greater than fourteen days", () => {
    expect(() => calendarRangeSchema.parse({ ...scope, startsAt: "2026-08-01T00:00:00.000Z", endsAt: "2026-08-16T00:00:00.000Z" })).toThrow("Calendar range must be 14 days or fewer");
  });
});
