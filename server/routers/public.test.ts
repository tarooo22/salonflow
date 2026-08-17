import { describe, expect, it, vi } from "vitest";

const mocked = vi.hoisted(() => ({ db: null as unknown, ids: [] as string[] }));

vi.mock("../db", () => ({
  requireDb: vi.fn(async () => mocked.db),
}));
vi.mock("nanoid", () => ({ nanoid: vi.fn(() => mocked.ids.shift() ?? "generated_id_000000001") }));

import { canCustomerManage, publicRouter } from "./public";

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
      limit: async () => rows,
      then: <TResult1 = unknown[], TResult2 = never>(onfulfilled?: ((value: unknown[]) => TResult1 | PromiseLike<TResult1>) | null, onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null) => Promise.resolve(rows).then(onfulfilled, onrejected),
    };
    return chain;
  });
  return { select };
}

function queuedChain(rows: unknown[]) {
  const chain = {
    from: () => chain,
    innerJoin: () => chain,
    where: () => chain,
    orderBy: async () => rows,
    limit: async () => rows,
    then: <TResult1 = unknown[], TResult2 = never>(onfulfilled?: ((value: unknown[]) => TResult1 | PromiseLike<TResult1>) | null, onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null) => Promise.resolve(rows).then(onfulfilled, onrejected),
  };
  return chain;
}

function anyAvailableCommitDb(outerRows: unknown[][], transactionRows: unknown[][]) {
  const values = vi.fn(() => ({ onDuplicateKeyUpdate: async () => undefined }));
  const transaction = vi.fn(async (callback: (tx: { select: () => ReturnType<typeof queuedChain>; insert: () => { values: typeof values } }) => Promise<void>) => {
    await callback({ select: () => queuedChain(transactionRows.shift() ?? []), insert: () => ({ values }) });
  });
  return { select: () => queuedChain(outerRows.shift() ?? []), transaction, values };
}

const activeLocation = { id: ids.locationId, organizationId: ids.organizationId, minimumNoticeMinutes: 0, maximumAdvanceDays: 365 };
const activeService = { id: ids.serviceId, organizationId: ids.organizationId, defaultDurationMinutes: 60, bufferBeforeMinutes: 0, bufferAfterMinutes: 0 };

function availabilityInput() {
  return { slug: "gldani-beauty", serviceId: ids.serviceId, staffProfileId: ids.staffProfileId, startsAt: new Date(Date.now() + 7_200_000) };
}

describe("public booking router safeguards", () => {
  it("allows token-based self-service only for pending or confirmed bookings strictly before the cancellation cutoff", () => {
    const now = new Date("2026-08-20T08:00:00.000Z").getTime();
    expect(canCustomerManage({ status: "PENDING", startsAt: new Date("2026-08-20T11:01:00.000Z") }, 180, now)).toBe(true);
    expect(canCustomerManage({ status: "CONFIRMED", startsAt: new Date("2026-08-20T11:00:00.000Z") }, 180, now)).toBe(false);
    expect(canCustomerManage({ status: "IN_SERVICE", startsAt: new Date("2026-08-20T15:00:00.000Z") }, 180, now)).toBe(false);
  });

  it("exposes only active booking locations with database-backed service categories", async () => {
    mocked.db = publicCatalogDb([
      [{ id: ids.locationId, organizationId: ids.organizationId, publicSlug: "gldani-beauty", name: "გლდანი", publicDescription: "მზრუნველი მომსახურება", timezone: "Asia/Tbilisi", address: "გლდანი", phone: "+995555000000", email: "hello@example.com" }],
      [{ organizationId: ids.organizationId, nameKa: "თმის მოვლა" }, { organizationId: ids.organizationId, nameKa: "მანიკიური" }, { organizationId: ids.organizationId, nameKa: "თმის მოვლა" }],
      [{ locationId: ids.locationId, weekday: 0, startLocalTime: "09:00", endLocalTime: "18:00" }],
    ]);

    await expect(caller().locations()).resolves.toEqual([{
      publicSlug: "gldani-beauty", name: "გლდანი", publicDescription: "მზრუნველი მომსახურება", timezone: "Asia/Tbilisi", address: "გლდანი", phone: "+995555000000", email: "hello@example.com", categories: ["თმის მოვლა", "მანიკიური"], workingHours: [{ weekday: 0, startLocalTime: "09:00", endLocalTime: "18:00" }],
    }]);
  });

  it("returns real contact context and clearly scoped specialist availability hours for a booking catalog", async () => {
    mocked.db = publicCatalogDb([
      [{ id: ids.locationId, organizationId: ids.organizationId, publicSlug: "gldani-beauty", name: "გლდანი", timezone: "Asia/Tbilisi", address: "გლდანი", phone: "+995555000000", email: "hello@example.com", publicDescription: "მზრუნველი მომსახურება" }],
      [{ service: { id: ids.serviceId, nameKa: "თმის შეჭრა", defaultDurationMinutes: 60, priceTetri: 4_000 }, category: { nameKa: "თმის მოვლა" } }],
      [{ id: ids.staffProfileId, name: "ლელა", specialty: "სტილისტი", bio: null, serviceId: ids.serviceId }],
      [{ weekday: 0, startLocalTime: "09:00", endLocalTime: "18:00" }],
    ]);

    const result = await caller().bookingCatalog("gldani-beauty");
    expect(result?.location).toEqual(expect.objectContaining({ phone: "+995555000000", email: "hello@example.com", publicDescription: "მზრუნველი მომსახურება", workingHours: [{ weekday: 0, startLocalTime: "09:00", endLocalTime: "18:00" }] }));
    expect(result?.team[0]).toMatchObject({ id: ids.staffProfileId, eligibleServiceIds: [ids.serviceId] });
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

  it("server-resolves an eligible specialist for the any-available public choice", async () => {
    mocked.db = publicCatalogDb([
      [activeLocation],
      [activeService],
      [{ id: "staff_profile_any_01", name: "ნინო", durationOverrideMinutes: null }],
      [],
    ]);
    await expect(caller().checkAvailability({ ...availabilityInput(), staffProfileId: "ANY_AVAILABLE" })).resolves.toMatchObject({
      available: true,
      staffProfileId: "staff_profile_any_01",
      staffName: "ნინო",
    });
  });

  it("commits the first conflict-free any-available candidate and preserves idempotent replay", async () => {
    const persistedEndsAt = new Date("2026-08-20T09:45:00.000Z");
    const db = anyAvailableCommitDb([
      [], [activeLocation], [activeService], [{ id: "staff_any_01", name: "ნინო", durationOverrideMinutes: null }], [{ id: "appointment_any_001", endsAt: persistedEndsAt }],
    ], [[], [], [], []]);
    mocked.db = db;
    mocked.ids.splice(0, mocked.ids.length, "appointment_any_001", "client_any_001", "appointment_service_any_001", "history_any_001", "consent_any_001");
    const input = { ...availabilityInput(), staffProfileId: "ANY_AVAILABLE" as const, firstName: "თამარი", phone: "+995 555 12 34 56", bookingTermsConsent: true as const, idempotencyKey: "booking_any_available_001" };
    const result = await caller().commitBooking(input);
    expect(result).toMatchObject({ confirmed: true, replayed: false, assignedStaffName: "ნინო", endsAt: persistedEndsAt });
    expect(db.values).toHaveBeenCalledWith(expect.objectContaining({ staffProfileId: "staff_any_01" }));

    mocked.db = anyAvailableCommitDb([[{ id: "appointment_any_001", endsAt: persistedEndsAt }], [{ name: "ნინო" }]], []);
    const replay = await caller().commitBooking(input);
    expect(replay).toMatchObject({ confirmed: true, replayed: true, assignedStaffName: "ნინო", endsAt: persistedEndsAt });
    expect(replay.confirmationToken).toBe(result.confirmationToken);
  });

  it("falls back to the next eligible any-available candidate after final transactional conflict re-check", async () => {
    const startsAt = new Date(Date.now() + 7_200_000);
    const conflictingAppointment = { status: "CONFIRMED", startsAt, endsAt: new Date(startsAt.getTime() + 3_600_000), bufferBeforeMinutes: 0, bufferAfterMinutes: 0 };
    const db = anyAvailableCommitDb([
      [], [activeLocation], [activeService], [{ id: "staff_any_busy", name: "ანა", durationOverrideMinutes: null }, { id: "staff_any_free", name: "ნინო", durationOverrideMinutes: null }], [{ id: "persisted_any_02" }],
    ], [[], [conflictingAppointment], [], [], []]);
    mocked.db = db;
    const result = await caller().commitBooking({ slug: "gldani-beauty", serviceId: ids.serviceId, staffProfileId: "ANY_AVAILABLE", startsAt, firstName: "თამარი", phone: "+995 555 12 34 56", bookingTermsConsent: true, idempotencyKey: "booking_any_available_003" });
    expect(result).toMatchObject({ confirmed: true, assignedStaffName: "ნინო" });
    expect(db.values).toHaveBeenCalledWith(expect.objectContaining({ staffProfileId: "staff_any_free" }));
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
