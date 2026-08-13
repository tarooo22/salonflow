import { and, desc, eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { appointmentServices, appointments, commissionEntries, commissionRules, expenses, locations } from "../../drizzle/schema";
import { commissionEntryCreateSchema, expenseCreateSchema, organizationScopeSchema } from "../../shared/validation";
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
