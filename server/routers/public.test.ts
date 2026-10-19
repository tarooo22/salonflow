import { MySqlDialect } from "drizzle-orm/mysql-core";
import { describe, expect, it, vi } from "vitest";

const mocked = vi.hoisted(() => ({ db: null as unknown, ids: [] as string[], isOrganizationTrialPublicBookingActive: vi.fn(async () => true), storageGetSignedUrl: vi.fn(async (key: string) => `https://r2.test/${key}`) }));

vi.mock("../db", () => ({
  requireDb: vi.fn(async () => mocked.db),
}));
vi.mock("nanoid", () => ({ nanoid: vi.fn(() => mocked.ids.shift() ?? "generated_id_000000001") }));
vi.mock("../lib/trialAccess", () => ({ isOrganizationTrialPublicBookingActive: mocked.isOrganizationTrialPublicBookingActive }));
vi.mock("../storage", () => ({ storageGetSignedUrl: mocked.storageGetSignedUrl }));

import { dateKeyInTimeZone, zonedDateTimeToUtc } from "../../shared/timezones";
import { assertWaitlistFuturePreference, canCustomerManage, publicRouter } from "./public";

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
      leftJoin: () => chain,
      where: () => chain,
      orderBy: () => chain,
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
    leftJoin: () => chain,
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

const activeLocation = { id: ids.locationId, organizationId: ids.organizationId, minimumNoticeMinutes: 0, maximumAdvanceDays: 365, timezone: "Asia/Tbilisi", slotIntervalMinutes: 30 };
const activeService = { id: ids.serviceId, organizationId: ids.organizationId, defaultDurationMinutes: 60, bufferBeforeMinutes: 0, bufferAfterMinutes: 0 };

// A start at the given Tbilisi hour two days ahead, so it is always in the future and on the 30-minute grid.
function localStart(hour: number) {
  const key = dateKeyInTimeZone(new Date(Date.now() + 2 * 86_400_000), "Asia/Tbilisi");
  const [year, month, day] = key.split("-").map(Number) as [number, number, number];
  return zonedDateTimeToUtc({ year, month, day, hour, minute: 0, second: 0 }, "Asia/Tbilisi");
}
const workingRule = { startLocalTime: "09:00", endLocalTime: "18:00" };

function availabilityInput() {
  return { slug: "gldani-beauty", serviceId: ids.serviceId, staffProfileId: ids.staffProfileId, startsAt: new Date(Date.now() + 7_200_000) };
}

describe("public booking router safeguards", () => {
  it("blocks new availability checks for an expired trial while retaining the location record", async () => {
    mocked.isOrganizationTrialPublicBookingActive.mockResolvedValueOnce(false);
    mocked.db = queuedDb([[activeLocation]]);
    await expect(caller().checkAvailability(availabilityInput())).resolves.toEqual({ available: false, reason: "TRIAL_EXPIRED" });
  });
  it("allows token-based self-service only for pending or confirmed bookings strictly before the cancellation cutoff", () => {
    const now = new Date("2026-08-20T08:00:00.000Z").getTime();
    expect(canCustomerManage({ status: "PENDING", startsAt: new Date("2026-08-20T11:01:00.000Z") }, 180, now)).toBe(true);
    expect(canCustomerManage({ status: "CONFIRMED", startsAt: new Date("2026-08-20T11:00:00.000Z") }, 180, now)).toBe(false);
    expect(canCustomerManage({ status: "IN_SERVICE", startsAt: new Date("2026-08-20T15:00:00.000Z") }, 180, now)).toBe(false);
  });

  it("rejects waitlist preferences from a past Tbilisi date or elapsed same-day time", () => {
    const now = new Date("2026-08-27T08:30:00.000Z"); // 12:30 in Asia/Tbilisi
    expect(() => assertWaitlistFuturePreference({ requestedDate: "2026-08-26" }, "Asia/Tbilisi", now)).toThrow("გასული თარიღისთვის");
    expect(() => assertWaitlistFuturePreference({ requestedDate: "2026-08-27", preferredStartLocalTime: "12:00" }, "Asia/Tbilisi", now)).toThrow("გასული დროის არჩევა შეუძლებელია");
    expect(() => assertWaitlistFuturePreference({ requestedDate: "2026-08-27", preferredStartLocalTime: "13:00" }, "Asia/Tbilisi", now)).not.toThrow();
    expect(() => assertWaitlistFuturePreference({ requestedDate: "2026-08-28", preferredStartLocalTime: "08:00" }, "Asia/Tbilisi", now)).not.toThrow();
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
      [{ location: { id: ids.locationId, organizationId: ids.organizationId, publicSlug: "gldani-beauty", name: "გლდანი", timezone: "Asia/Tbilisi", address: "გლდანი", phone: "+995555000000", email: "hello@example.com", publicDescription: "მზრუნველი მომსახურება" } }],
      [{ service: { id: ids.serviceId, nameKa: "თმის შეჭრა", defaultDurationMinutes: 60, priceTetri: 4_000 }, category: { nameKa: "თმის მოვლა" } }],
      [{ id: ids.staffProfileId, name: "ლელა", specialty: "სტილისტი", bio: null, serviceId: ids.serviceId }],
      [{ weekday: 0, startLocalTime: "09:00", endLocalTime: "18:00" }],
    ]);

    const result = await caller().bookingCatalog("gldani-beauty");
    expect(result?.location).toEqual(expect.objectContaining({ phone: "+995555000000", email: "hello@example.com", publicDescription: "მზრუნველი მომსახურება", workingHours: [{ weekday: 0, startLocalTime: "09:00", endLocalTime: "18:00" }] }));
    expect(result?.team[0]).toMatchObject({ id: ids.staffProfileId, eligibleServiceIds: [ids.serviceId] });
  });

  it("builds a public salon profile from only approved public media and excludes client identity data", async () => {
    const location = { id: ids.locationId, organizationId: ids.organizationId, publicSlug: "gldani-beauty", name: "გლდანი", status: "ACTIVE", bookingEnabled: true, publicDescription: "მზრუნველი მომსახურება", coverImageKey: "salons/org/cover.webp", coverImageAltKa: "სალონის ინტერიერი", address: "გლდანი", phone: "+995555000000", email: "hello@example.com", socialLinks: { instagram: "https://instagram.com/example" } };
    mocked.db = publicCatalogDb([
      [{ location, organizationName: "Beauty Group" }],
      [{ id: ids.serviceId, nameKa: "თმის შეჭრა", description: null, durationMinutes: 60, priceTetri: 4_000, isFromPrice: false, categoryNameKa: "თმის მოვლა", categorySortOrder: 0, sortOrder: 0 }],
      [{ id: ids.staffProfileId, name: "ლელა", bio: "გამოცდილი სტილისტი", jobTitle: "სტილისტი", specialty: null, experienceYears: 8, avatarKey: "salons/org/staff.webp", avatarAltKa: "ლელას ავატარი", sortOrder: 0 }],
      [{ id: "feed_001", mediaKey: "salons/org/feed.webp", titleKa: "ახალი ლუქი", captionKa: "აღწერა", altTextKa: "თმის ახალი ლუქი", publishedAt: new Date("2026-08-20") }],
      [{ id: "set_001", clientId: "private_client", appointmentId: "private_appointment", publicVisible: true, clientPublicationConsent: true }],
      [],
      [{ id: "item_before", setId: "set_001", stage: "BEFORE", mediaKey: "salons/org/before.webp", altTextKa: "მანამდე" }, { id: "item_after", setId: "set_001", stage: "AFTER", mediaKey: "salons/org/after.webp", altTextKa: "შემდეგ" }],
    ]);

    const result = await caller().salonProfile("gldani-beauty");

    expect(result?.salon).toMatchObject({ name: "გლდანი", coverImageUrl: "/manus-storage/salons/org/cover.webp" });
    expect(result?.team[0]).toMatchObject({ avatarUrl: "/manus-storage/salons/org/staff.webp", experienceYears: 8 });
    expect(result?.feed[0]).toMatchObject({ mediaUrl: "/manus-storage/salons/org/feed.webp" });
    expect(result?.gallery[0]).toEqual({ id: "set_001", before: { mediaUrl: "https://r2.test/salons/org/before.webp", altTextKa: "მანამდე" }, after: { mediaUrl: "https://r2.test/salons/org/after.webp", altTextKa: "შემდეგ" } });
    expect(result?.feedback).toEqual([]);
    expect(JSON.stringify(result)).not.toContain("private_client");
    expect(JSON.stringify(result)).not.toContain("private_appointment");
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
    ], [[], [workingRule], [], [], []]);
    mocked.db = db;
    mocked.ids.splice(0, mocked.ids.length, "appointment_any_001", "client_any_001", "appointment_service_any_001", "history_any_001", "consent_any_001");
    const input = { ...availabilityInput(), startsAt: localStart(10), staffProfileId: "ANY_AVAILABLE" as const, firstName: "თამარი", phone: "+995 555 12 34 56", bookingTermsConsent: true as const, idempotencyKey: "booking_any_available_001" };
    const result = await caller().commitBooking(input);
    expect(result).toMatchObject({ confirmed: true, replayed: false, assignedStaffName: "ნინო", endsAt: persistedEndsAt });
    expect(db.values).toHaveBeenCalledWith(expect.objectContaining({ staffProfileId: "staff_any_01" }));

    mocked.db = anyAvailableCommitDb([[{ id: "appointment_any_001", endsAt: persistedEndsAt }], [{ name: "ნინო" }]], []);
    const replay = await caller().commitBooking(input);
    expect(replay).toMatchObject({ confirmed: true, replayed: true, assignedStaffName: "ნინო", endsAt: persistedEndsAt });
    expect(replay.confirmationToken).toBe(result.confirmationToken);
  });

  it("falls back to the next eligible any-available candidate after final transactional conflict re-check", async () => {
    const startsAt = localStart(10);
    const conflictingAppointment = { status: "CONFIRMED", startsAt, endsAt: new Date(startsAt.getTime() + 3_600_000), bufferBeforeMinutes: 0, bufferAfterMinutes: 0 };
    const db = anyAvailableCommitDb([
      [], [activeLocation], [activeService], [{ id: "staff_any_busy", name: "ანა", durationOverrideMinutes: null }, { id: "staff_any_free", name: "ნინო", durationOverrideMinutes: null }], [{ id: "persisted_any_02" }],
    ], [[], [workingRule], [], [conflictingAppointment], [workingRule], [], [], []]);
    mocked.db = db;
    const result = await caller().commitBooking({ slug: "gldani-beauty", serviceId: ids.serviceId, staffProfileId: "ANY_AVAILABLE", startsAt, firstName: "თამარი", phone: "+995 555 12 34 56", bookingTermsConsent: true, idempotencyKey: "booking_any_available_003" });
    expect(result).toMatchObject({ confirmed: true, assignedStaffName: "ნინო" });
    expect(db.values).toHaveBeenCalledWith(expect.objectContaining({ staffProfileId: "staff_any_free" }));
  });

  it.each([
    ["outside the staff working hours", localStart(3), []],
    ["on a closure or exception", localStart(10), [{ staffProfileId: null, locationId: null, startsAt: localStart(9), endsAt: localStart(18) }]],
  ])("rejects a public commit %s", async (_label, startsAt, exceptions) => {
    const db = anyAvailableCommitDb([
      [], [activeLocation], [activeService], [{ id: "staff_any_01", name: "ნინო", durationOverrideMinutes: null }],
    ], [[], [workingRule], exceptions, [], []]);
    mocked.db = db;
    await expect(caller().commitBooking({ ...availabilityInput(), startsAt, staffProfileId: "ANY_AVAILABLE", firstName: "თამარი", phone: "+995 555 12 34 56", bookingTermsConsent: true, idempotencyKey: "booking_hours_guard_001" })).rejects.toThrow("The selected time is no longer available");
    expect(db.values).not.toHaveBeenCalledWith(expect.objectContaining({ source: "PUBLIC_WEB" }));
  });

  it("treats an appointment of the same specialist at another location as blocking", async () => {
    const wheres: unknown[] = [];
    const otherLocationAppointment = { status: "CONFIRMED", locationId: "location_other_01", staffProfileId: ids.staffProfileId, startsAt: localStart(10), endsAt: localStart(11), bufferBeforeMinutes: 0, bufferAfterMinutes: 0 };
    const rows: unknown[][] = [[activeLocation], [activeService], [{ id: "staff-location" }], [{ id: ids.staffProfileId }], [{ id: "eligibility", durationOverrideMinutes: null }], [otherLocationAppointment]];
    mocked.db = { select: () => ({ from: () => ({ where: (condition: unknown) => {
      wheres.push(condition);
      const result = rows.shift() ?? [];
      return { limit: async () => result, then: (resolve: (value: unknown[]) => unknown) => Promise.resolve(result).then(resolve) };
    } }) }) };
    await expect(caller().checkAvailability({ ...availabilityInput(), startsAt: localStart(10) })).resolves.toEqual({ available: false, reason: "SLOT_UNAVAILABLE" });
    const appointmentQuery = new MySqlDialect().sqlToQuery(wheres[5] as never).sql;
    expect(appointmentQuery).toContain("`staffProfileId`");
    expect(appointmentQuery).not.toContain("`locationId`");
  });

  it("drops a slot from availableSlots when a closure covers it", async () => {
    const closure = { staffProfileId: null, locationId: null, startsAt: localStart(12), endsAt: localStart(13) };
    const run = async (exceptions: unknown[]) => {
      mocked.db = publicCatalogDb([[activeLocation], [activeService], [{ id: "staff_any_01", durationOverrideMinutes: null }], [{ staffProfileId: "staff_any_01", ...workingRule }], [], exceptions]);
      const date = dateKeyInTimeZone(localStart(10), "Asia/Tbilisi");
      return (await caller().availableSlots({ slug: "gldani-beauty", serviceId: ids.serviceId, staffProfileId: "ANY_AVAILABLE", date })).slots.map(slot => slot.startsAt);
    };
    expect(await run([])).toContain(localStart(12).toISOString());
    const blocked = await run([closure]);
    expect(blocked).not.toContain(localStart(12).toISOString());
    expect(blocked).toContain(localStart(11).toISOString());
    expect(blocked).toContain(localStart(13).toISOString());
    // Staff leave entered for another location still blocks the person here; another location's closure does not.
    expect(await run([{ ...closure, staffProfileId: "staff_any_01", locationId: "location_other_01" }])).not.toContain(localStart(12).toISOString());
    expect(await run([{ ...closure, locationId: "location_other_01" }])).toContain(localStart(12).toISOString());
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
