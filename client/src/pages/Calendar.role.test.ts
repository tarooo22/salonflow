import { describe, expect, it } from "vitest";
import { canUseCalendarSpecialistFilter } from "./Calendar";

describe("Calendar specialist filter access", () => {
  it("shows the team filter to owners and managers", () => {
    expect(canUseCalendarSpecialistFilter("OWNER")).toBe(true);
    expect(canUseCalendarSpecialistFilter("MANAGER")).toBe(true);
  });

  it("does not expose a cross-specialist filter to receptionists or staff", () => {
    expect(canUseCalendarSpecialistFilter("RECEPTIONIST")).toBe(false);
    expect(canUseCalendarSpecialistFilter("STAFF")).toBe(false);
    expect(canUseCalendarSpecialistFilter()).toBe(false);
  });
});
