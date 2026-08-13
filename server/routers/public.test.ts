import { describe, expect, it, vi } from "vitest";

const mocked = vi.hoisted(() => ({ db: null as unknown }));

vi.mock("../db", () => ({ requireDb: vi.fn(async () => mocked.db) }));

import { publicRouter } from "./public";

function chainResult<T>(value: T[]) {
  const chain = {
    from: () => chain,
    innerJoin: () => chain,
    where: () => chain,
    orderBy: async () => value,
    limit: async () => value,
  };
  return chain;
}

describe("public.bookingCatalog", () => {
  it("groups a visible specialist’s eligible services without exposing unrelated service eligibility", async () => {
    const location = { id: "location_00000001", organizationId: "organization_00001", publicSlug: "studio-vake", name: "ვაკის ფილიალი", timezone: "Asia/Tbilisi", address: null };
    const teamRows = [
      { id: "staff_profile_001", name: "ლელა ბერიძე", specialty: "თმის სტილისტი", bio: null, serviceId: "service_hair_0001" },
      { id: "staff_profile_001", name: "ლელა ბერიძე", specialty: "თმის სტილისტი", bio: null, serviceId: "service_color_001" },
      { id: "staff_profile_002", name: "ნინო ქავთარაძე", specialty: null, bio: null, serviceId: "service_nails_001" },
    ];
    mocked.db = {
      select: vi.fn()
        .mockReturnValueOnce(chainResult([location]))
        .mockReturnValueOnce(chainResult([]))
        .mockReturnValueOnce(chainResult(teamRows)),
    };

    const result = await publicRouter.createCaller({} as never).bookingCatalog("studio-vake");

    expect(result?.team).toEqual([
      { id: "staff_profile_001", name: "ლელა ბერიძე", specialty: "თმის სტილისტი", bio: null, eligibleServiceIds: ["service_hair_0001", "service_color_001"] },
      { id: "staff_profile_002", name: "ნინო ქავთარაძე", specialty: null, bio: null, eligibleServiceIds: ["service_nails_001"] },
    ]);
  });
});

describe("public.checkAvailability", () => {
  it("returns a location-unavailable gate before evaluating services, staff, or appointments", async () => {
    mocked.db = { select: vi.fn(() => chainResult([])) };

    await expect(publicRouter.createCaller({} as never).checkAvailability({
      slug: "studio-vake",
      serviceId: "service_hair_0001",
      staffProfileId: "staff_profile_001",
      startsAt: new Date("2026-09-01T09:00:00.000Z"),
    })).resolves.toEqual({ available: false, reason: "LOCATION_UNAVAILABLE" });
    expect((mocked.db as { select: ReturnType<typeof vi.fn> }).select).toHaveBeenCalledTimes(1);
  });

  it("rejects a specialist who is neither assigned to the location nor eligible for the selected service", async () => {
    const location = { id: "location_00000001", organizationId: "organization_00001", minimumNoticeMinutes: 0, maximumAdvanceDays: 365, status: "ACTIVE", bookingEnabled: true };
    const service = { id: "service_hair_0001", organizationId: "organization_00001", defaultDurationMinutes: 60, bufferBeforeMinutes: 0, bufferAfterMinutes: 0, status: "ACTIVE", onlineBookingEnabled: true };
    const db = {
      select: vi.fn()
        .mockReturnValueOnce(chainResult([location]))
        .mockReturnValueOnce(chainResult([service]))
        .mockReturnValueOnce(chainResult([]))
        .mockReturnValueOnce(chainResult([]))
        .mockReturnValueOnce(chainResult([])),
    };
    mocked.db = db;

    await expect(publicRouter.createCaller({} as never).checkAvailability({
      slug: "studio-vake",
      serviceId: "service_hair_0001",
      staffProfileId: "staff_profile_001",
      startsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    })).resolves.toEqual({ available: false, reason: "STAFF_UNAVAILABLE" });
    expect(db.select).toHaveBeenCalledTimes(5);
  });
});

describe("public.commitBooking", () => {
  it("returns the original confirmation without starting a transaction when the idempotency key already exists", async () => {
    const db = {
      select: vi.fn(() => chainResult([{ id: "appointment_00001" }])),
      transaction: vi.fn(),
    };
    mocked.db = db;

    await expect(publicRouter.createCaller({} as never).commitBooking({
      slug: "studio-vake",
      serviceId: "service_hair_0001",
      staffProfileId: "staff_profile_001",
      startsAt: new Date("2026-09-01T09:00:00.000Z"),
      firstName: "ლელა",
      phone: "+995555123456",
      bookingTermsConsent: true,
      idempotencyKey: "booking_retry_key_0001",
    })).resolves.toEqual(expect.objectContaining({ confirmed: true, replayed: true, confirmationToken: expect.any(String) }));
    expect(db.transaction).not.toHaveBeenCalled();
  });
});
