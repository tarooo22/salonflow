import { describe, expect, it } from "vitest";
import { roleCan } from "./access";

describe("SalonFlow role-action policy", () => {
  it("keeps owner control across every protected workspace management action", () => {
    for (const action of ["organization:manage", "team:manage", "services:manage", "clients:manage", "calendar:manage", "appointments:confirm", "finance:manage", "reports:view", "media:manage", "booking-link:view"]) {
      expect(roleCan("OWNER", action)).toBe(true);
    }
  });

  it("allows manager confirmation but not organization/team/catalog ownership", () => {
    expect(roleCan("MANAGER", "appointments:confirm")).toBe(true);
    expect(roleCan("MANAGER", "clients:manage")).toBe(true);
    expect(roleCan("MANAGER", "team:manage")).toBe(false);
    expect(roleCan("MANAGER", "services:manage")).toBe(false);
    expect(roleCan("MANAGER", "booking-link:view")).toBe(false);
  });

  it("keeps specialist access to own operational work and away from organization management", () => {
    expect(roleCan("STAFF", "calendar:own")).toBe(true);
    expect(roleCan("STAFF", "attendance:own")).toBe(true);
    expect(roleCan("STAFF", "calendar:manage")).toBe(false);
    expect(roleCan("STAFF", "clients:manage")).toBe(false);
    expect(roleCan("STAFF", "reports:view")).toBe(false);
  });
});
