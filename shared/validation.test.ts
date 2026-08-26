import { describe, expect, it } from "vitest";
import { appointmentRescheduleSchema, attendanceClockSchema, calendarRangeSchema, clientBeforeAfterCreateSchema, feedbackEscalateSchema, feedbackPlatformDecisionSchema, feedbackPlatformRestoreSchema, marketplaceOwnerMapPointConfirmSchema, marketplacePromotionCancelSchema, publicFeedbackSubmitSchema, retailSaleCreateSchema, tipCreateSchema, trialAdminQueueSchema } from "./validation";

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

describe("trial admin queue validation", () => {
  it("accepts a bounded applicant or salon search term and rejects an empty one", () => {
    expect(trialAdminQueueSchema.parse({ limit: 25, offset: 0, status: "PENDING", search: "tarashvili" }).search).toBe("tarashvili");
    expect(() => trialAdminQueueSchema.parse({ limit: 25, offset: 0, search: "   " })).toThrow();
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

describe("Marketplace map and promotion validation", () => {
  it("accepts only bounded integer E6 coordinates for an owner-confirmed map point", () => {
    expect(marketplaceOwnerMapPointConfirmSchema.parse({ ...scope, placeId: "ChIJ-test", latitudeE6: 41715100, longitudeE6: 44827100 })).toMatchObject({ latitudeE6: 41715100, longitudeE6: 44827100 });
    expect(() => marketplaceOwnerMapPointConfirmSchema.parse({ ...scope, placeId: "ChIJ-test", latitudeE6: 90_000_001, longitudeE6: 44827100 })).toThrow();
    expect(() => marketplaceOwnerMapPointConfirmSchema.parse({ ...scope, placeId: "ChIJ-test", latitudeE6: 41715100.5, longitudeE6: 44827100 })).toThrow();
  });

  it("requires a bounded opaque promotion identifier for admin cancellation", () => {
    expect(marketplacePromotionCancelSchema.parse({ promotionId: "promotion_2026_abcdefgh" }).promotionId).toBe("promotion_2026_abcdefgh");
    expect(() => marketplacePromotionCancelSchema.parse({ promotionId: "short" })).toThrow();
  });
});

describe("verified feedback validation", () => {
  const token = "booking_token_2026_abcdefghijklmno";

  it("accepts a bounded completed-booking feedback payload", () => {
    expect(publicFeedbackSubmitSchema.parse({ token, rating: 5, comment: "მომსახურებით კმაყოფილი ვარ.", publicNameConsent: false })).toMatchObject({ rating: 5, publicNameConsent: false });
  });

  it("rejects invalid ratings, short comments and named publication without a name", () => {
    expect(() => publicFeedbackSubmitSchema.parse({ token, rating: 6, comment: "ძალიან კარგი მომსახურება", publicNameConsent: false })).toThrow();
    expect(() => publicFeedbackSubmitSchema.parse({ token, rating: 4, comment: "კი", publicNameConsent: false })).toThrow();
    expect(() => publicFeedbackSubmitSchema.parse({ token, rating: 4, comment: "ძალიან კარგი მომსახურება", publicNameConsent: true })).toThrow("საჯარო სახელის გამოსაჩენად მიუთითეთ სახელი.");
  });

  it("requires a factual reason for platform escalation and an explanation for hiding or rejecting feedback", () => {
    const scope = { organizationId: "organization_2026_abcdefgh", feedbackId: "feedback_2026_abcdefgh" };
    expect(feedbackEscalateSchema.parse({ ...scope, reason: "PERSONAL_DATA" })).toMatchObject({ reason: "PERSONAL_DATA" });
    expect(() => feedbackEscalateSchema.parse({ ...scope, reason: "OTHER" })).toThrow("სხვა მიზეზისთვის მიუთითეთ მოკლე განმარტება.");
    expect(feedbackPlatformDecisionSchema.parse({ feedbackId: scope.feedbackId, status: "APPROVED" })).toMatchObject({ status: "APPROVED" });
    expect(() => feedbackPlatformDecisionSchema.parse({ feedbackId: scope.feedbackId, status: "HIDDEN" })).toThrow("დამალვის ან უარყოფისას საჭიროა მოკლე დასაბუთება.");
    expect(feedbackPlatformDecisionSchema.parse({ feedbackId: scope.feedbackId, status: "REJECTED", moderationNote: "პირადი ნომერია მითითებული" })).toMatchObject({ status: "REJECTED" });
    expect(() => feedbackPlatformRestoreSchema.parse({ feedbackId: scope.feedbackId, moderationNote: "x" })).toThrow();
    expect(feedbackPlatformRestoreSchema.parse({ feedbackId: scope.feedbackId, moderationNote: "Policy შესაბამისი აღდგენის მიზეზი" })).toMatchObject({ feedbackId: scope.feedbackId });
  });
});
