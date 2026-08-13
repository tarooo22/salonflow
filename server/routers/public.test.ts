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
});
