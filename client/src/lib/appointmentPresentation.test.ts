import { describe, expect, it } from "vitest";
import { canManageAppointmentQueue, nextAppointmentAction, shouldShowCalendarQuickAction } from "./appointmentPresentation";

describe("appointment presentation policy", () => {
  it("offers only the next permitted operator action for active statuses", () => {
    expect(nextAppointmentAction("PENDING")).toEqual({ status: "CONFIRMED", label: "დადასტურება" });
    expect(nextAppointmentAction("IN_SERVICE")).toEqual({ status: "COMPLETED", label: "დასრულება" });
    expect(nextAppointmentAction("COMPLETED")).toBeUndefined();
    expect(nextAppointmentAction("CANCELLED")).toBeUndefined();
  });

  it("limits queue controls to calendar-management roles", () => {
    expect(canManageAppointmentQueue("OWNER")).toBe(true);
    expect(canManageAppointmentQueue("RECEPTIONIST")).toBe(true);
    expect(canManageAppointmentQueue("STAFF")).toBe(false);
    expect(canManageAppointmentQueue(undefined)).toBe(false);
  });

  it("shows Calendar card actions only when role, status, and card space allow it", () => {
    expect(shouldShowCalendarQuickAction("MANAGER", "CONFIRMED", 85)).toBe(true);
    expect(shouldShowCalendarQuickAction("STAFF", "CONFIRMED", 85)).toBe(false);
    expect(shouldShowCalendarQuickAction("OWNER", "COMPLETED", 85)).toBe(false);
    expect(shouldShowCalendarQuickAction("RECEPTIONIST", "PENDING", 64)).toBe(false);
  });
});
