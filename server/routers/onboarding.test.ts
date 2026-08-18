import { describe, expect, it, vi } from "vitest";

const mocked = vi.hoisted(() => ({
  db: null as unknown,
  ids: ["org_onboard_000000001", "member_onboard_00001", "location_onboard_0001", "staff_onboard_0000001", "opening_one_000000001", "rule_one_000000000001", "opening_two_000000001", "rule_two_000000000001", "category_onboard_0001", "service_onboard_00001"] as string[],
}));

vi.mock("../db", () => ({ requireDb: vi.fn(async () => mocked.db) }));
vi.mock("nanoid", () => ({ nanoid: vi.fn(() => mocked.ids.shift()) }));

import { onboardingRouter } from "./onboarding";

function createDb(selectResults: unknown[][] = [[], [], []]) {
  const values = vi.fn(async () => undefined);
  const limit = vi.fn(async () => selectResults.shift() ?? []);
  const where = vi.fn(() => ({ limit }));
  const from = vi.fn(() => ({ where }));
  const select = vi.fn(() => ({ from }));
  const transaction = vi.fn(async (callback: (tx: { insert: () => { values: typeof values } }) => Promise<void>) => {
    await callback({ insert: () => ({ values }) });
  });
  return { select, transaction, values };
}

const user = { id: 71, openId: "local_onboardingowner000", name: "მარი", email: "mari@example.com", normalizedEmail: "mari@example.com", normalizedPhone: null, passwordHash: "scrypt$test", avatarKey: null, locale: "ka-GE", loginMethod: "local", role: "user" as const, accountStatus: "ACTIVE" as const, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() };

describe("onboarding.complete", () => {
  it("creates a tenant-safe starter workspace, owner schedule, catalog, and staff eligibility in one transaction", async () => {
    const db = createDb();
    mocked.db = db;
    mocked.ids.splice(0, mocked.ids.length, "org_onboard_000000001", "member_onboard_00001", "location_onboard_0001", "staff_onboard_0000001", "opening_one_000000001", "rule_one_000000000001", "opening_two_000000001", "rule_two_000000000001", "category_onboard_0001", "service_onboard_00001");
    const result = await onboardingRouter.createCaller({ user } as never).complete({
      organization: { name: "თამარის სალონი", slug: "tamari-salon", timezone: "Asia/Tbilisi", contactPhone: "+995 555 12 34 56", contactEmail: "mari@example.com" },
      location: { name: "ვაკის ფილიალი", publicSlug: "tamari-vake", timezone: "Asia/Tbilisi", address: "თბილისი", phone: "+995 555 12 34 56", email: "mari@example.com", bookingEnabled: true, slotIntervalMinutes: 15, minimumNoticeMinutes: 60, maximumAdvanceDays: 60, cancellationCutoffMinutes: 120 },
      openingHours: [
        { weekday: 1, enabled: true, startLocalTime: "10:00", endLocalTime: "18:00" },
        { weekday: 2, enabled: true, startLocalTime: "10:00", endLocalTime: "18:00" },
        { weekday: 3, enabled: false, startLocalTime: "10:00", endLocalTime: "18:00" },
        { weekday: 4, enabled: false, startLocalTime: "10:00", endLocalTime: "18:00" },
        { weekday: 5, enabled: false, startLocalTime: "10:00", endLocalTime: "18:00" },
        { weekday: 6, enabled: false, startLocalTime: "10:00", endLocalTime: "18:00" },
        { weekday: 0, enabled: false, startLocalTime: "10:00", endLocalTime: "18:00" },
      ],
      owner: { publicDisplayName: "მარი", jobTitle: "მფლობელი", onlineBookingVisible: true },
      services: [{ categoryNameKa: "თმის მოვლა", nameKa: "სტაილინგი", defaultDurationMinutes: 60, priceTetri: 7_500, onlineBookingEnabled: true }],
    });

    expect(result).toEqual({ organizationId: "org_onboard_000000001", locationId: "location_onboard_0001", staffProfileId: "staff_onboard_0000001", publicBookingPath: "/book/tamari-vake" });
    expect(db.transaction).toHaveBeenCalledTimes(1);
    expect(db.values).toHaveBeenCalledWith(expect.objectContaining({ id: "org_onboard_000000001", slug: "tamari-salon" }));
    expect(db.values).toHaveBeenCalledWith(expect.objectContaining({ id: "staff_onboard_0000001", onlineBookingVisible: true }));
    expect(db.values).toHaveBeenCalledWith(expect.objectContaining({ nameKa: "სტაილინგი", priceTetri: 7_500 }));
    expect(db.values).toHaveBeenCalledWith(expect.objectContaining({ staffProfileId: "staff_onboard_0000001", serviceId: "service_onboard_00001", canPerform: true }));
  });

  it("rejects an occupied public booking slug before opening the transaction", async () => {
    const db = createDb([[], [], [{ id: "existing_location" }]]);
    mocked.db = db;

    await expect(onboardingRouter.createCaller({ user } as never).complete({
      organization: { name: "თამარის სალონი", slug: "tamari-salon", timezone: "Asia/Tbilisi" },
      location: { name: "ვაკის ფილიალი", publicSlug: "gldani-beauty", timezone: "Asia/Tbilisi", bookingEnabled: true, slotIntervalMinutes: 15, minimumNoticeMinutes: 60, maximumAdvanceDays: 60, cancellationCutoffMinutes: 120 },
      openingHours: Array.from({ length: 7 }, (_, weekday) => ({ weekday, enabled: weekday === 1, startLocalTime: "10:00", endLocalTime: "18:00" })),
      owner: { publicDisplayName: "მარი", onlineBookingVisible: false },
      services: [{ categoryNameKa: "თმის მოვლა", nameKa: "სტაილინგი", defaultDurationMinutes: 60, priceTetri: 7_500, onlineBookingEnabled: true }],
    })).rejects.toMatchObject({ code: "CONFLICT", message: "საჯარო დაჯავშნის მისამართი `/book/gldani-beauty` უკვე დაკავებულია. შეცვალეთ საჯარო კოდი და სცადეთ ხელახლა." });

    expect(db.transaction).not.toHaveBeenCalled();
  });
});
