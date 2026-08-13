import { describe, expect, it } from "vitest";
import { formatGel, getEligibleTeam } from "./BookingFlow";

describe("public booking conversion helpers", () => {
  it("limits specialist choices to the selected service", () => {
    const team = [
      { id: "staff-1", name: "ანა", specialty: null, bio: null, eligibleServiceIds: ["service-a"] },
      { id: "staff-2", name: "ნინო", specialty: null, bio: null, eligibleServiceIds: ["service-b"] },
    ];
    expect(getEligibleTeam(team, "service-a").map(member => member.id)).toEqual(["staff-1"]);
  });

  it("formats service price from integer tetri for the decision card", () => {
    expect(formatGel(4050)).toBe("40.50 ₾");
  });
});
