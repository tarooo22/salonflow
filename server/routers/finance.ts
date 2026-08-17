import { and, asc, desc, eq, gte, inArray, lt } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { nanoid } from "nanoid";
import { appointmentServices, appointments, commissionEntries, commissionRules, expenses, locations, services, staffProfiles, organizationMemberships } from "../../drizzle/schema";
import { commissionEntryCreateSchema, commissionListRangeSchema, commissionRuleCreateSchema, commissionRuleDeleteSchema, expenseCreateSchema, organizationScopeSchema } from "../../shared/validation";
import { requireOrganizationAction, requireOrganizationRole } from "../access";
import { calculateCommissionTetri, commissionRuleApplies, splitDiscountAcrossServices } from "../lib/commissions";
import { requireDb } from "../db";
import { protectedProcedure, router } from "../_core/trpc";

export const financeRouter = router({
  listExpenses: protectedProcedure.input(organizationScopeSchema).query(async ({ ctx, input }) => {
    await requireOrganizationRole(ctx.user, input.organizationId, ["OWNER", "MANAGER"]);
    const db = await requireDb();
    return db.select().from(expenses)
      .where(and(eq(expenses.organizationId, input.organizationId), eq(expenses.status, "ACTIVE")))
      .orderBy(desc(expenses.expenseDate), desc(expenses.createdAt));
  }),

  createExpense: protectedProcedure.input(expenseCreateSchema).mutation(async ({ ctx, input }) => {
    await requireOrganizationAction(ctx.user, input.organizationId, "finance:manage");
    const db = await requireDb();
    const [location] = await db.select().from(locations).where(and(
      eq(locations.id, input.locationId),
      eq(locations.organizationId, input.organizationId),
      eq(locations.status, "ACTIVE"),
    )).limit(1);
    if (!location) throw new Error("Active location not found in this organization");
    const id = nanoid(21);
    await db.insert(expenses).values({
      id,
      organizationId: input.organizationId,
      locationId: input.locationId,
      category: input.category,
      amountTetri: input.amountTetri,
      expenseDate: input.expenseDate,
      description: input.description,
      receiptKey: input.receiptKey,
      createdByUserId: ctx.user.id,
      status: "ACTIVE",
    });
    return { id };
  }),

  listCommissionRules: protectedProcedure.input(organizationScopeSchema).query(async ({ ctx, input }) => {
    await requireOrganizationRole(ctx.user, input.organizationId, ["OWNER", "MANAGER"]);
    const db = await requireDb();
    return db.select({ rule: commissionRules, staff: staffProfiles, service: services, location: locations }).from(commissionRules)
      .leftJoin(staffProfiles, eq(commissionRules.staffProfileId, staffProfiles.id))
      .leftJoin(services, eq(commissionRules.serviceId, services.id))
      .leftJoin(locations, eq(commissionRules.locationId, locations.id))
      .where(and(eq(commissionRules.organizationId, input.organizationId), eq(commissionRules.status, "ACTIVE")))
      .orderBy(asc(commissionRules.createdAt));
  }),

  createCommissionRule: protectedProcedure.input(commissionRuleCreateSchema).mutation(async ({ ctx, input }) => {
    await requireOrganizationAction(ctx.user, input.organizationId, "finance:manage");
    if (input.type === "PERCENTAGE" && input.valueTetri > 10_000) throw new TRPCError({ code: "BAD_REQUEST", message: "პროცენტული განაკვეთი 100%-ს (10000 საბაზო ერთეული) არ უნდა აღემატებოდეს." });
    const db = await requireDb();
    if (input.locationId) {
      const [location] = await db.select({ id: locations.id }).from(locations).where(and(eq(locations.id, input.locationId), eq(locations.organizationId, input.organizationId), eq(locations.status, "ACTIVE"))).limit(1);
      if (!location) throw new TRPCError({ code: "BAD_REQUEST", message: "მითითებული ფილიალი აღარ არის აქტიური." });
    }
    if (input.staffProfileId) {
      const [profile] = await db.select({ id: staffProfiles.id }).from(staffProfiles)
        .innerJoin(organizationMemberships, eq(staffProfiles.membershipId, organizationMemberships.id))
        .where(and(eq(staffProfiles.id, input.staffProfileId), eq(organizationMemberships.organizationId, input.organizationId), eq(organizationMemberships.status, "ACTIVE"), eq(staffProfiles.status, "ACTIVE"))).limit(1);
      if (!profile) throw new TRPCError({ code: "BAD_REQUEST", message: "მითითებული სპეციალისტი ვერ მოიძებნა." });
    }
    if (input.serviceId) {
      const [service] = await db.select({ id: services.id }).from(services).where(and(eq(services.id, input.serviceId), eq(services.organizationId, input.organizationId), eq(services.status, "ACTIVE"))).limit(1);
      if (!service) throw new TRPCError({ code: "BAD_REQUEST", message: "მითითებული სერვისი ვერ მოიძებნა." });
    }
    const id = nanoid(21);
    await db.insert(commissionRules).values({
      id, organizationId: input.organizationId, locationId: input.locationId, staffProfileId: input.staffProfileId,
      serviceId: input.serviceId, type: input.type, valueTetri: input.valueTetri, status: "ACTIVE",
    });
    return { id };
  }),

  deleteCommissionRule: protectedProcedure.input(commissionRuleDeleteSchema).mutation(async ({ ctx, input }) => {
    await requireOrganizationAction(ctx.user, input.organizationId, "finance:manage");
    const db = await requireDb();
    const [rule] = await db.select({ id: commissionRules.id }).from(commissionRules).where(and(eq(commissionRules.id, input.id), eq(commissionRules.organizationId, input.organizationId))).limit(1);
    if (!rule) throw new TRPCError({ code: "NOT_FOUND", message: "წესი ვერ მოიძებნა." });
    await db.update(commissionRules).set({ status: "ARCHIVED" }).where(eq(commissionRules.id, input.id));
    return { success: true } as const;
  }),

  listCommissionEntries: protectedProcedure.input(commissionListRangeSchema).query(async ({ ctx, input }) => {
    await requireOrganizationRole(ctx.user, input.organizationId, ["OWNER", "MANAGER"]);
    const db = await requireDb();
    const conditions = [
      eq(appointments.organizationId, input.organizationId),
      gte(appointments.startsAt, input.startsAt),
      lt(appointments.startsAt, input.endsAt),
    ];
    if (input.staffProfileId) conditions.push(eq(commissionEntries.staffProfileId, input.staffProfileId));
    return db.select({ entry: commissionEntries, staff: staffProfiles, appointment: appointments, service: appointmentServices }).from(commissionEntries)
      .innerJoin(appointments, eq(commissionEntries.appointmentId, appointments.id))
      .innerJoin(staffProfiles, eq(commissionEntries.staffProfileId, staffProfiles.id))
      .leftJoin(appointmentServices, eq(commissionEntries.appointmentServiceId, appointmentServices.id))
      .where(and(...conditions))
      .orderBy(desc(appointments.startsAt));
  }),

  /** Auto-generate commission entries for every completed appointment in the range that has an applicable rule and no existing entry. */
  runCommissionBackfill: protectedProcedure.input(commissionListRangeSchema).mutation(async ({ ctx, input }) => {
    await requireOrganizationAction(ctx.user, input.organizationId, "finance:manage");
    const db = await requireDb();
    const rules = await db.select().from(commissionRules).where(and(eq(commissionRules.organizationId, input.organizationId), eq(commissionRules.status, "ACTIVE")));
    if (!rules.length) return { created: 0 } as const;
    const eligible = await db.select({ appt: appointments, line: appointmentServices }).from(appointments)
      .innerJoin(appointmentServices, eq(appointmentServices.appointmentId, appointments.id))
      .where(and(
        eq(appointments.organizationId, input.organizationId),
        eq(appointments.status, "COMPLETED"),
        gte(appointments.startsAt, input.startsAt),
        lt(appointments.startsAt, input.endsAt),
      ));
    const lineIds = eligible.map(row => row.line.id);
    const existing = lineIds.length ? await db.select({ id: commissionEntries.appointmentServiceId }).from(commissionEntries).where(inArray(commissionEntries.appointmentServiceId, lineIds)) : [];
    const alreadyEntered = new Set(existing.map(row => row.id));
    let created = 0;
    for (const row of eligible) {
      if (!row.line.staffProfileId || !row.line.serviceId || alreadyEntered.has(row.line.id)) continue;
      const matched = rules.find(rule => commissionRuleApplies(rule, { locationId: row.appt.locationId, staffProfileId: row.line.staffProfileId!, serviceId: row.line.serviceId! }));
      if (!matched) continue;
      const netServiceTetri = row.line.priceTetriSnapshot - Math.round(row.appt.discountTetri * (row.line.priceTetriSnapshot / (row.line.priceTetriSnapshot || 1)));
      const amountTetri = calculateCommissionTetri(netServiceTetri, matched);
      await db.insert(commissionEntries).values({
        id: nanoid(21), appointmentId: row.appt.id, appointmentServiceId: row.line.id,
        staffProfileId: row.line.staffProfileId, ruleId: matched.id, amountTetri,
        calculationSnapshot: { servicePriceTetri: row.line.priceTetriSnapshot, allocatedDiscountTetri: 0, netServiceTetri, ruleType: matched.type, ruleValueTetri: matched.valueTetri },
      });
      created += 1;
    }
    return { created } as const;
  }),

  createCommissionEntry: protectedProcedure.input(commissionEntryCreateSchema).mutation(async ({ ctx, input }) => {
    await requireOrganizationAction(ctx.user, input.organizationId, "finance:manage");
    const db = await requireDb();
    return db.transaction(async tx => {
      const [appointment] = await tx.select().from(appointments).where(and(
        eq(appointments.id, input.appointmentId),
        eq(appointments.organizationId, input.organizationId),
      )).limit(1);
      if (!appointment) throw new Error("Appointment not found");

      const serviceLines = await tx.select().from(appointmentServices)
        .where(eq(appointmentServices.appointmentId, appointment.id));
      const serviceLineIndex = serviceLines.findIndex(line => line.id === input.appointmentServiceId);
      const serviceLine = serviceLines[serviceLineIndex];
      if (!serviceLine?.staffProfileId || !serviceLine.serviceId) throw new Error("Appointment service or specialist not found");

      const [rule] = await tx.select().from(commissionRules).where(and(
        eq(commissionRules.id, input.ruleId),
        eq(commissionRules.organizationId, input.organizationId),
        eq(commissionRules.status, "ACTIVE"),
      )).limit(1);
      if (!rule) throw new Error("Active commission rule not found");
      if (!commissionRuleApplies(rule, {
        locationId: appointment.locationId,
        staffProfileId: serviceLine.staffProfileId,
        serviceId: serviceLine.serviceId,
      })) {
        throw new Error("Commission rule does not apply to this appointment service");
      }

      const [existing] = await tx.select().from(commissionEntries)
        .where(eq(commissionEntries.appointmentServiceId, serviceLine.id)).limit(1);
      if (existing) throw new Error("A commission entry already exists for this appointment service");

      const allocatedDiscounts = splitDiscountAcrossServices(serviceLines.map(line => line.priceTetriSnapshot), appointment.discountTetri);
      const netServiceTetri = serviceLine.priceTetriSnapshot - (allocatedDiscounts[serviceLineIndex] ?? 0);
      const amountTetri = calculateCommissionTetri(netServiceTetri, rule);
      const id = nanoid(21);
      await tx.insert(commissionEntries).values({
        id,
        appointmentId: appointment.id,
        appointmentServiceId: serviceLine.id,
        staffProfileId: serviceLine.staffProfileId,
        ruleId: rule.id,
        amountTetri,
        calculationSnapshot: {
          servicePriceTetri: serviceLine.priceTetriSnapshot,
          allocatedDiscountTetri: allocatedDiscounts[serviceLineIndex] ?? 0,
          netServiceTetri,
          ruleType: rule.type,
          ruleValueTetri: rule.valueTetri,
        },
      });
      return { id, amountTetri };
    });
  }),
});
