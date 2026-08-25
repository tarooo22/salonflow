import { describe, expect, it } from "vitest";
import { guidedTourSteps } from "./GuidedHelpTour";

describe("guidedTourSteps", () => {
  it("gives owners booking setup guidance without exposing it to staff", () => {
    expect(guidedTourSteps("OWNER").map(step => step.path)).toEqual(["/app/today", "/app/calendar", "/app/services", "/app/settings"]);
    expect(guidedTourSteps("STAFF").map(step => step.path)).toEqual(["/app/today", "/app/calendar", "/app/staff"]);
    expect(guidedTourSteps("STAFF").map(step => step.description).join(" ")).toContain("მფლობელის კონტროლში რჩება");
  });

  it("keeps manager and receptionist tours on operational routes", () => {
    expect(guidedTourSteps("MANAGER").map(step => step.path)).toEqual(["/app/today", "/app/calendar", "/app/clients"]);
    expect(guidedTourSteps("RECEPTIONIST").map(step => step.path)).toEqual(["/app/today", "/app/calendar", "/app/clients"]);
  });
});
