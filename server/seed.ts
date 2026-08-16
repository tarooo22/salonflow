import "dotenv/config";
import { nanoid } from "nanoid";
import { requireDb } from "./db";
import { hashPassword } from "./lib/passwords";
import {
  appointmentServices, appointmentStatusHistory, appointments, auditLogs, clientConsents, clientMerges, clients,
  commissionEntries, commissionRules, expenses, locationOpeningHours, locations, notificationJobs,
  organizationMemberships, organizations, payments, scheduleExceptions, scheduleLocks, serviceCategories,
  services, staffInvites, staffLocations, staffProfiles, staffServices, timeOffRequests, users, workingHourRules,
} from "../drizzle/schema";
import { eq } from "drizzle-orm";

const OWNER_EMAIL = "demo@salonflow.ge";
const OWNER_PASSWORD = "salonflow2026";
const SLUG = "visage-demo";

/** Tbilisi (UTC+4) local time → Date */
function tbilisi(dayOffset: number, hour: number, minute = 0) {
  const now = new Date();
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Tbilisi", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(now);
  const y = Number(parts.find(p => p.type === "year")!.value);
  const m = Number(parts.find(p => p.type === "month")!.value);
  const d = Number(parts.find(p => p.type === "day")!.value);
  return new Date(Date.UTC(y, m - 1, d + dayOffset, hour - 4, minute));
}

async function clearAll(db: Awaited<ReturnType<typeof requireDb>>) {
  const tables = [
    commissionEntries, commissionRules, payments, appointmentStatusHistory, appointmentServices, appointments,
    scheduleLocks, scheduleExceptions, timeOffRequests, clientConsents, clientMerges, clients, staffServices,
    staffLocations, workingHourRules, locationOpeningHours, services, serviceCategories, staffProfiles, expenses,
    notificationJobs, staffInvites, auditLogs, organizationMemberships, locations, organizations,
  ];
  for (const t of tables) await db.delete(t);
  const existingUser = await db.select().from(users).where(eq(users.normalizedEmail, OWNER_EMAIL)).limit(1);
  if (existingUser[0]) await db.delete(users).where(eq(users.id, existingUser[0].id));
}

async function main() {
  const db = await requireDb();
  console.log("Clearing existing data…");
  await clearAll(db);

  console.log("Creating owner account…");
  const passwordHash = await hashPassword(OWNER_PASSWORD);
  await db.insert(users).values({
    openId: `local_${nanoid(21)}`, name: "თამუნა კიკნაძე", email: OWNER_EMAIL, normalizedEmail: OWNER_EMAIL,
    passwordHash, loginMethod: "local", locale: "ka-GE", accountStatus: "ACTIVE", role: "admin",
  });
  const owner = (await db.select().from(users).where(eq(users.normalizedEmail, OWNER_EMAIL)).limit(1))[0]!;

  const organizationId = nanoid(21);
  const locationId = nanoid(21);
  await db.insert(organizations).values({ id: organizationId, name: "Visage Beauty Studio", slug: SLUG, defaultTimezone: "Asia/Tbilisi", contactPhone: "+995322000000", contactEmail: "info@visage.ge" });
  const ownerMembershipId = nanoid(21);
  await db.insert(organizationMemberships).values({ id: ownerMembershipId, organizationId, userId: owner.id, role: "OWNER", status: "ACTIVE", invitedByUserId: owner.id, invitedAt: new Date(), activatedAt: new Date() });
  await db.insert(locations).values({ id: locationId, organizationId, name: "ჭავჭავაძის ფილიალი", publicSlug: SLUG, timezone: "Asia/Tbilisi", address: "ჭავჭავაძის გამზირი 37, თბილისი", phone: "+995322000000", email: "info@visage.ge", publicDescription: "დაიწყეთ დღესვე უფასოდ — თანამედროვე სილამაზის სტუდია თბილისის ცენტრში.", bookingEnabled: true });

  // Opening hours: Mon–Sat 10:00–20:00
  for (let weekday = 0; weekday <= 5; weekday += 1) {
    await db.insert(locationOpeningHours).values({ id: nanoid(21), locationId, weekday, startLocalTime: "10:00:00", endLocalTime: "20:00:00" });
  }

  console.log("Creating staff…");
  const staffSeed = [
    { name: "სოფო მაისურაძე", title: "სტილისტი / კოლორისტი", color: "#ec4899" },
    { name: "ანა გელაშვილი", title: "მაკიაჟის არტისტი", color: "#12b5a6" },
    { name: "მარიამ კვარაცხელია", title: "ფრჩხილის ოსტატი", color: "#8b5cf6" },
    { name: "ლიკა ჯავახიძე", title: "წარბების სპეციალისტი", color: "#f59e0b" },
  ];
  const staffProfileIds: string[] = [];
  for (let i = 0; i < staffSeed.length; i += 1) {
    const s = staffSeed[i]!;
    const membershipId = nanoid(21);
    await db.insert(users).values({ openId: `local_${nanoid(21)}`, name: s.name, loginMethod: "local", locale: "ka-GE", accountStatus: "ACTIVE" });
    const staffUser = (await db.select().from(users).limit(1000)).find(u => u.name === s.name && u.id !== owner.id)!;
    await db.insert(organizationMemberships).values({ id: membershipId, organizationId, userId: staffUser.id, role: "STAFF", status: "ACTIVE", invitedByUserId: owner.id, invitedAt: new Date(), activatedAt: new Date() });
    const staffProfileId = nanoid(21);
    await db.insert(staffProfiles).values({ id: staffProfileId, membershipId, publicDisplayName: s.name, jobTitle: s.title, specialty: s.title, color: s.color, onlineBookingVisible: true, sortOrder: i });
    await db.insert(staffLocations).values({ staffProfileId, locationId });
    for (let weekday = 0; weekday <= 5; weekday += 1) await db.insert(workingHourRules).values({ id: nanoid(21), staffProfileId, locationId, weekday, startLocalTime: "10:00:00", endLocalTime: "20:00:00" });
    staffProfileIds.push(staffProfileId);
  }

  console.log("Creating services…");
  const catalog: Array<{ category: string; color: string; items: Array<{ name: string; minutes: number; price: number; from?: boolean }> }> = [
    { category: "თმა", color: "#ec4899", items: [
      { name: "თმის შეჭრა", minutes: 45, price: 4000 }, { name: "ფენი", minutes: 40, price: 3500 },
      { name: "შეღებვა", minutes: 180, price: 15000 }, { name: "მელირება", minutes: 240, price: 22000, from: true },
      { name: "კერატინი", minutes: 210, price: 25000, from: true },
    ] },
    { category: "ფრჩხილი", color: "#8b5cf6", items: [
      { name: "მანიკიური", minutes: 60, price: 4500 }, { name: "პედიკიური", minutes: 75, price: 6000 }, { name: "გელ-ლაქი", minutes: 90, price: 7000 },
    ] },
    { category: "მაკიაჟი", color: "#f59e0b", items: [
      { name: "დღის მაკიაჟი", minutes: 45, price: 6000 }, { name: "საღამოს მაკიაჟი", minutes: 75, price: 10000 },
    ] },
    { category: "წარბები", color: "#12b5a6", items: [
      { name: "წარბების კორექცია", minutes: 30, price: 2500 }, { name: "წამწამების დაგრძელება", minutes: 180, price: 12000 },
    ] },
  ];
  const serviceRecords: Array<{ id: string; name: string; minutes: number; price: number }> = [];
  let sortOrder = 0;
  for (let c = 0; c < catalog.length; c += 1) {
    const cat = catalog[c]!;
    const categoryId = nanoid(21);
    await db.insert(serviceCategories).values({ id: categoryId, organizationId, nameKa: cat.category, color: cat.color, sortOrder: c });
    for (const item of cat.items) {
      const serviceId = nanoid(21);
      await db.insert(services).values({ id: serviceId, organizationId, categoryId, nameKa: item.name, defaultDurationMinutes: item.minutes, priceTetri: item.price, isFromPrice: Boolean(item.from), onlineBookingEnabled: true, sortOrder: sortOrder++ });
      for (const staffProfileId of staffProfileIds) await db.insert(staffServices).values({ staffProfileId, serviceId, canPerform: true });
      serviceRecords.push({ id: serviceId, name: item.name, minutes: item.minutes, price: item.price });
    }
  }

  console.log("Creating clients…");
  const clientSeed = [
    "ანი მჭედლიშვილი", "გვანცა ჩიქოვანი", "დარეჯან ჯავახიშვილი", "ეკა ნოზაძე", "ელენე ქავთარაძე",
    "თეონა აბაშიძე", "ია გოგიჩაიშვილი", "ლელა ცერცვაძე", "მაია ბოლქვაძე", "მარიამ ონიანი",
    "ნათია წიკლაური", "ნინო ფხაკაძე", "სალომე დათაშვილი", "ქეთევან ლომიძე", "ხატია სვანიძე", "ია გოგიაშვილი",
  ];
  const clientIds: string[] = [];
  for (let i = 0; i < clientSeed.length; i += 1) {
    const parts = clientSeed[i]!.split(" ");
    const clientId = nanoid(21);
    await db.insert(clients).values({ id: clientId, organizationId, firstName: parts[0]!, lastName: parts[1] ?? null, normalizedPhone: `+99555${String(1000000 + i * 13337).slice(0, 7)}`, email: `client${100 + i}@example.com`, createdByUserId: owner.id, source: "INTERNAL" });
    clientIds.push(clientId);
  }

  console.log("Creating appointments…");
  const statuses = ["COMPLETED", "COMPLETED", "CONFIRMED", "CHECKED_IN", "IN_SERVICE", "CONFIRMED", "PENDING", "COMPLETED"] as const;
  let apptCount = 0;
  // Spread appointments across the last 3 days + today, each staff a few per day.
  for (let dayOffset = -3; dayOffset <= 0; dayOffset += 1) {
    for (let s = 0; s < staffProfileIds.length; s += 1) {
      const staffProfileId = staffProfileIds[s]!;
      let hour = 10 + s; // stagger start
      const perDay = 3 + ((s + dayOffset + 4) % 2);
      for (let n = 0; n < perDay; n += 1) {
        const service = serviceRecords[(apptCount * 3 + s) % serviceRecords.length]!;
        const client = clientIds[(apptCount * 5 + s) % clientIds.length]!;
        const startsAt = tbilisi(dayOffset, hour, (n % 2) * 30);
        const endsAt = new Date(startsAt.getTime() + service.minutes * 60000);
        const status = dayOffset < 0 ? "COMPLETED" : statuses[apptCount % statuses.length]!;
        const appointmentId = nanoid(21);
        await db.insert(appointments).values({
          id: appointmentId, organizationId, locationId, clientId: client, staffProfileId, startsAt, endsAt,
          status, source: n % 3 === 0 ? "PUBLIC_WEB" : "WALK_IN", subtotalTetri: service.price, discountTetri: 0, totalTetri: service.price, createdByUserId: owner.id,
        });
        await db.insert(appointmentServices).values({ id: nanoid(21), appointmentId, serviceId: service.id, staffProfileId, serviceNameSnapshot: service.name, durationMinutesSnapshot: service.minutes, priceTetriSnapshot: service.price, sortOrder: 0 });
        if (status === "COMPLETED") {
          await db.insert(payments).values({ id: nanoid(21), appointmentId, amountTetri: service.price, method: apptCount % 2 === 0 ? "CARD_TERMINAL" : "CASH", status: "PAID", collectedByUserId: owner.id, collectedAt: endsAt });
        }
        hour += Math.max(1, Math.ceil(service.minutes / 60));
        if (hour > 19) hour = 10 + s;
        apptCount += 1;
      }
    }
  }

  // A few expenses for finance
  for (let i = 0; i < 4; i += 1) {
    await db.insert(expenses).values({ id: nanoid(21), organizationId, locationId, category: ["მასალები", "ქირა", "მარკეტინგი", "კომუნალური"][i]!, amountTetri: [12000, 80000, 15000, 9000][i]!, expenseDate: tbilisi(-i, 12), description: "დემო ხარჯი", createdByUserId: owner.id });
  }

  console.log(`\n✅ Seed complete: ${apptCount} appointments, ${clientIds.length} clients, ${serviceRecords.length} services, ${staffProfileIds.length} staff.`);
  console.log(`\n   Login:  ${OWNER_EMAIL}  /  ${OWNER_PASSWORD}`);
  console.log(`   Booking page:  /book/${SLUG}\n`);
  process.exit(0);
}

main().catch(err => { console.error(err); process.exit(1); });
