import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { and, eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import {
  appointmentServices,
  appointments,
  appointmentStatusHistory,
  clientConsents,
  clients,
  locations,
  organizationMemberships,
  organizations,
  scheduleLocks,
  serviceCategories,
  services,
  staffLocations,
  staffProfiles,
  staffServices,
  users,
} from "../../drizzle/schema";
import { requireDb } from "../db";
import { publicRouter } from "./public";

const describeLive = process.env.RUN_LIVE_DB_TESTS === "1" ? describe : describe.skip;
const suffix = `${Date.now().toString(36)}${Math.floor(Math.random() * 1_000_000).toString(36)}`;
const fixtureUserEmail = `live.booking.${suffix}@salonflow.invalid`;
let fixtureUserId: number | null = null;

const ids = {
  organizationId: nanoid(21),
  locationId: nanoid(21),
  membershipId: nanoid(21),
  staffProfileId: nanoid(21),
  categoryId: nanoid(21),
  serviceId: nanoid(21),
};

const appointmentStart = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
appointmentStart.setMinutes(0, 0, 0);

describeLive("public booking live database verification", () => {
  beforeAll(async () => {
    const db = await requireDb();
    await db.insert(users).values({
      openId: `live_booking_${suffix}`,
      name: "Live booking verification user",
      email: fixtureUserEmail,
      normalizedEmail: fixtureUserEmail,
      loginMethod: "integration_test",
      role: "user",
      accountStatus: "ACTIVE",
    });
    const [testUser] = await db.select().from(users).where(eq(users.normalizedEmail, fixtureUserEmail)).limit(1);
    if (!testUser) throw new Error("Live booking verification user could not be created");
    fixtureUserId = testUser.id;

    await db.insert(organizations).values({
      id: ids.organizationId,
      name: `Live booking verification ${suffix}`,
      slug: `live-booking-${suffix}`,
      defaultTimezone: "Asia/Tbilisi",
      status: "ACTIVE",
    });
    await db.insert(locations).values({
      id: ids.locationId,
      organizationId: ids.organizationId,
      name: "Live booking verification location",
      publicSlug: `live-booking-${suffix}`,
      timezone: "Asia/Tbilisi",
      bookingEnabled: true,
      minimumNoticeMinutes: 0,
      maximumAdvanceDays: 365,
      status: "ACTIVE",
    });
    await db.insert(organizationMemberships).values({
      id: ids.membershipId,
      organizationId: ids.organizationId,
      userId: testUser.id,
      role: "STAFF",
      status: "ACTIVE",
      activatedAt: new Date(),
    });
    await db.insert(staffProfiles).values({
      id: ids.staffProfileId,
      membershipId: ids.membershipId,
      publicDisplayName: "Live booking verification specialist",
      color: "#17826A",
      onlineBookingVisible: true,
      status: "ACTIVE",
    });
    await db.insert(staffLocations).values({ staffProfileId: ids.staffProfileId, locationId: ids.locationId });
    await db.insert(serviceCategories).values({
      id: ids.categoryId,
      organizationId: ids.organizationId,
      nameKa: "Live verification category",
      sortOrder: 0,
      status: "ACTIVE",
    });
    await db.insert(services).values({
      id: ids.serviceId,
      organizationId: ids.organizationId,
      categoryId: ids.categoryId,
      nameKa: "Live verification service",
      defaultDurationMinutes: 60,
      bufferBeforeMinutes: 0,
      bufferAfterMinutes: 0,
      priceTetri: 10_000,
      onlineBookingEnabled: true,
      sortOrder: 0,
      status: "ACTIVE",
    });
    await db.insert(staffServices).values({ staffProfileId: ids.staffProfileId, serviceId: ids.serviceId, canPerform: true });
  });

  afterAll(async () => {
    const db = await requireDb();
    const appointmentRows = await db.select({ id: appointments.id, clientId: appointments.clientId }).from(appointments).where(eq(appointments.organizationId, ids.organizationId));
    const appointmentIds = appointmentRows.map(row => row.id);
    const clientIds = appointmentRows.flatMap(row => row.clientId ? [row.clientId] : []);

    for (const appointmentId of appointmentIds) {
      await db.delete(clientConsents).where(eq(clientConsents.clientId, appointmentRows.find(row => row.id === appointmentId)?.clientId ?? ""));
      await db.delete(appointmentStatusHistory).where(eq(appointmentStatusHistory.appointmentId, appointmentId));
      await db.delete(appointmentServices).where(eq(appointmentServices.appointmentId, appointmentId));
      await db.delete(appointments).where(eq(appointments.id, appointmentId));
    }
    for (const clientId of clientIds) await db.delete(clients).where(eq(clients.id, clientId));
    await db.delete(scheduleLocks).where(eq(scheduleLocks.staffProfileId, ids.staffProfileId));
    await db.delete(staffServices).where(and(eq(staffServices.staffProfileId, ids.staffProfileId), eq(staffServices.serviceId, ids.serviceId)));
    await db.delete(staffLocations).where(and(eq(staffLocations.staffProfileId, ids.staffProfileId), eq(staffLocations.locationId, ids.locationId)));
    await db.delete(staffProfiles).where(eq(staffProfiles.id, ids.staffProfileId));
    await db.delete(organizationMemberships).where(eq(organizationMemberships.id, ids.membershipId));
    await db.delete(services).where(eq(services.id, ids.serviceId));
    await db.delete(serviceCategories).where(eq(serviceCategories.id, ids.categoryId));
    await db.delete(locations).where(eq(locations.id, ids.locationId));
    await db.delete(organizations).where(eq(organizations.id, ids.organizationId));
    if (fixtureUserId !== null) await db.delete(users).where(eq(users.id, fixtureUserId));
  });

  it("persists the first public booking and returns the exact same confirmation for an idempotent retry", async () => {
    const caller = publicRouter.createCaller({} as never);
    const input = {
      slug: `live-booking-${suffix}`,
      serviceId: ids.serviceId,
      staffProfileId: ids.staffProfileId,
      startsAt: appointmentStart,
      firstName: "Live",
      lastName: "Verification",
      phone: "+995555123456",
      bookingTermsConsent: true as const,
      idempotencyKey: `live-retry-${suffix}`,
    };

    const first = await caller.commitBooking(input);
    const retry = await caller.commitBooking(input);

    expect(first).toMatchObject({ confirmed: true, replayed: false });
    expect(retry).toEqual({ confirmed: true, replayed: true, confirmationToken: first.confirmationToken });
  });

  it("permits only one of two competing commits for the same specialist and slot", async () => {
    const caller = publicRouter.createCaller({} as never);
    const baseInput = {
      slug: `live-booking-${suffix}`,
      serviceId: ids.serviceId,
      staffProfileId: ids.staffProfileId,
      startsAt: new Date(appointmentStart.getTime() + 3 * 60 * 60 * 1000),
      firstName: "Concurrent",
      phone: "+995555123457",
      bookingTermsConsent: true as const,
    };

    const outcomes = await Promise.allSettled([
      caller.commitBooking({ ...baseInput, idempotencyKey: `live-concurrent-a-${suffix}` }),
      caller.commitBooking({ ...baseInput, idempotencyKey: `live-concurrent-b-${suffix}` }),
    ]);
    const fulfilled = outcomes.filter((outcome): outcome is PromiseFulfilledResult<{ confirmed: true; replayed: boolean; confirmationToken: string }> => outcome.status === "fulfilled");
    const rejected = outcomes.filter((outcome): outcome is PromiseRejectedResult => outcome.status === "rejected");

    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);
    expect(String(rejected[0]?.reason)).toContain("The selected time is no longer available");
  });
});
