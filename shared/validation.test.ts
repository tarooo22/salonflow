import { describe, expect, it } from "vitest";
import { appointmentRescheduleSchema, attendanceClockSchema, calendarRangeSchema, clientBeforeAfterCreateSchema, retailSaleCreateSchema, tipCreateSchema } from "./validation";

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

describe("daily operations validation", () => {
  it("accepts an optional target specialist for authoritative calendar reassignment", () => {
    expect(appointmentRescheduleSchema.parse({ organizationId: scope.organizationId, appointmentId: "appointment_2026_abcdefgh", startsAt: "2026-08-18T09:00:00.000Z", staffProfileId: scope.staffProfileId }).staffProfileId).toBe(scope.staffProfileId);
  });

  it("requires a location for attendance and a positive tip amount", () => {
    expect(attendanceClockSchema.parse({ organizationId: scope.organizationId, locationId: scope.locationId }).locationId).toBe(scope.locationId);
    expect(() => tipCreateSchema.parse({ organizationId: scope.organizationId, locationId: scope.locationId, staffProfileId: scope.staffProfileId, amountTetri: 0, method: "CASH" })).toThrow();
  });

  it("accepts unique positive POS sale lines and rejects duplicate product lines", () => {
    const input = { organizationId: scope.organizationId, locationId: scope.locationId, method: "CARD_TERMINAL" as const, lines: [{ productId: "product_2026_abcdefgh", quantity: 2 }] };
    expect(retailSaleCreateSchema.parse(input).lines).toHaveLength(1);
    expect(() => retailSaleCreateSchema.parse({ ...input, lines: [input.lines[0], input.lines[0]] })).toThrow();
  });
});

describe("client gallery privacy validation", () => {
  const galleryInput = {
    organizationId: scope.organizationId,
    clientId: "client_2026_abcdefgh",
    appointmentId: "appointment_2026_abcdefgh",
    beforeImageDataUrl: "data:image/png;base64,aGVsbG8=",
    afterImageDataUrl: "data:image/png;base64,aGVsbG8=",
    beforeAltTextKa: "მომსახურებამდე შედეგი",
    afterAltTextKa: "მომსახურების შემდეგ შედეგი",
  };

  it("keeps a gallery set private by default", () => {
    const parsed = clientBeforeAfterCreateSchema.parse(galleryInput);
    expect(parsed.requestPublicVisibility).toBe(false);
    expect(parsed.clientPublicationConsent).toBe(false);
  });

  it("rejects a public request without the client's separate consent", () => {
    expect(() => clientBeforeAfterCreateSchema.parse({ ...galleryInput, requestPublicVisibility: true, clientPublicationConsent: false })).toThrow("საჯარო გამოჩენას სჭირდება კლიენტის ცალკე თანხმობა");
  });
});
