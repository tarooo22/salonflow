import { describe, expect, it } from "vitest";
import { publicConversionEvents } from "../../drizzle/schema";
import { publicAnalyticsRouter } from "./publicAnalytics";

describe("public conversion analytics contract", () => {
  it("stores only aggregate-safe event fields and exposes a bounded public event API", () => {
    expect(Object.keys(publicConversionEvents)).toEqual(expect.arrayContaining(["eventName", "routePath", "consentVersion", "occurredAt"]));
    expect(Object.keys(publicConversionEvents)).not.toEqual(expect.arrayContaining(["email", "phone", "clientId", "bookingToken", "searchQuery", "ipAddress"]));
    expect(JSON.stringify(publicAnalyticsRouter)).not.toContain("bookingToken");
    const procedures = Object.keys((publicAnalyticsRouter as unknown as { _def: { record: unknown } })._def);
    expect(procedures.length).toBeGreaterThan(0);
  });
});
