import { describe, expect, it, vi } from "vitest";

const mocked = vi.hoisted(() => ({ db: null as unknown }));

vi.mock("../db", () => ({
  requireDb: vi.fn(async () => mocked.db),
}));

import { publicRouter } from "./public";

const ids = {
  organizationId: "organization_0001",
  locationId: "location_00000001",
  serviceId: "service_000000001",
  staffProfileId: "staff_profile_001",
};

function caller() {
  return publicRouter.createCaller({} as never);
}

function queuedDb(queryRows: unknown[][]) {
  const select = vi.fn(() => ({
    from: vi.fn(() => ({
      where: vi.fn(() => {
        const rows = queryRows.shift() ?? [];
        return {
          limit: vi.fn(async () => rows),
          then: <TResult1 = unknown[], TResult2 = never>(
            onfulfilled?: ((value: unknown[]) => TResult1 | PromiseLike<TResult1>) | null,
            onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
          ) => Promise.resolve(rows).then(onfulfilled, onrejected),
        };
      }),
    })),
  }));
  return { select };
}

function publicCatalogDb(queryRows: unknown[][]) {
  const select = vi.fn(() => {
    const rows = queryRows.shift() ?? [];
    const chain = {
      from: () => chain,
      innerJoin: () => chain,
      where: () => chain,
      orderBy: async () => rows,
      then: <TResult1 = unknown[], TResult2 = never>(onfulfilled?: ((value: unknown[]) => TResult1 | PromiseLike<TResult1>) | null, onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null) => Promise.resolve(rows).then(onfulfilled, onrejected),
    };
    return chain;
  });
  return { select };
}

const activeLocation = { id: ids.locationId, organizationId: ids.organizationId, minimumNoticeMinutes: 0, maximumAdvanceDays: 365 };
const activeService = { id: ids.serviceId, organizationId: ids.organizationId, defaultDurationMinutes: 60, bufferBeforeMinutes: 0, bufferAfterMinutes: 0 };

function availabilityInput() {
  return { slug: "gldani-beauty", serviceId: ids.serviceId, staffProfileId: ids.staffProfileId, startsAt: new Date(Date.now() + 7_200_000) };
}

describe("public booking router safeguards", () => {
  it("exposes only active booking locations with database-backed service categories", async () => {
    mocked.db = publicCatalogDb([
      [{ organizationId: ids.organizationId, publicSlug: "gldani-beauty", name: "გლდანი", publicDescription: "მზრუნველი მომსახურება", timezone: "Asia/Tbilisi", address: "გლდანი" }],
      [{ organizationId: ids.organizationId, nameKa: "თმის მოვლა" }, { organizationId: ids.organizationId, nameKa: "მანიკიური" }, { organizationId: ids.organizationId, nameKa: "თმის მოვლა" }],
    ]);

    await expect(caller().locations()).resolves.toEqual([{
      publicSlug: "gldani-beauty", name: "გლდანი", publicDescription: "მზრუნველი მომსახურება", timezone: "Asia/Tbilisi", address: "გლდანი", categories: ["თმის მოვლა", "მანიკიური"],
    }]);
  });

  it("keeps availability closed when the public location link is inactive", async () => {
    mocked.db = queuedDb([[]]);
    await expect(caller().checkAvailability(availabilityInput())).resolves.toEqual({ available: false, reason: "LOCATION_UNAVAILABLE" });
  });

  it("does not expose a service unavailable at the public location", async () => {
    mocked.db = queuedDb([[activeLocation], []]);
    await expect(caller().checkAvailability(availabilityInput())).resolves.toEqual({ available: false, reason: "SERVICE_UNAVAILABLE" });
  });

  it("rejects a specialist who is not eligible for the selected service", async () => {
    mocked.db = queuedDb([[activeLocation], [activeService], [], [], []]);
    await expect(caller().checkAvailability(availabilityInput())).resolves.toEqual({ available: false, reason: "STAFF_UNAVAILABLE" });
  });

  it("returns a free slot only after location, service, staff and eligibility checks pass", async () => {
    mocked.db = queuedDb([[activeLocation], [activeService], [{ id: "staff-location" }], [{ id: ids.staffProfileId }], [{ id: "eligibility", durationOverrideMinutes: null }], []]);
    await expect(caller().checkAvailability(availabilityInput())).resolves.toMatchObject({ available: true });
  });

  it("rejects invalid public phone input before touching the booking transaction", async () => {
    mocked.db = {};
    await expect(caller().commitBooking({
      ...availabilityInput(),
      firstName: "თამარი",
      phone: "abcdef",
      bookingTermsConsent: true,
      idempotencyKey: "booking_idempotency_001",
    })).rejects.toThrow("A valid Georgian mobile phone number is required");
  });
});
