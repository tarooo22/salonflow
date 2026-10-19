import { TRPCError } from "@trpc/server";
import { and, desc, eq, gt, like, not, or, isNull, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import { locationMarketplaceProfiles, locations, marketplaceCategories, organizationGovernance, organizations, vacancies } from "../../drizzle/schema";
import {
  vacancyAdminListSchema,
  vacancyCloseSchema,
  vacancyCreateSchema,
  vacancyOwnerListSchema,
  vacancyPublicDetailSchema,
  vacancyPublicListSchema,
  vacancyPublicVipListSchema,
  vacancyPublishSchema,
  vacancyUpdateSchema,
  vacancyVipSchema,
} from "../../shared/validation";
import { adminProcedure, protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { requireOrganizationRole } from "../access";
import { requireDb } from "../db";
import { mediaUrl } from "../lib/media";
import { approvedPublicLocationCondition } from "./marketplace";

const vacancyManagers = ["OWNER", "MANAGER"] as const;
const DAY_MS = 24 * 60 * 60 * 1000;

/** Same mapping as client/src/lib/verticals.ts: dental*, aesthetic* or cosmetology; everything else (or no category) is beauty. */
export function verticalSlugCondition(column: typeof vacancies.roleCategory, vertical: "beauty" | "dental" | "aesthetics") {
  const aesthetics = or(like(column, "aesthetic%"), eq(column, "cosmetology"))!;
  if (vertical === "dental") return like(column, "dental%");
  if (vertical === "aesthetics") return aesthetics;
  return or(isNull(column), not(or(like(column, "dental%"), aesthetics)!));
}

async function assertLocationInOrganization(db: Awaited<ReturnType<typeof requireDb>>, organizationId: string, locationId: string) {
  const [location] = await db.select({ id: locations.id }).from(locations).where(and(eq(locations.id, locationId), eq(locations.organizationId, organizationId), eq(locations.status, "ACTIVE"))).limit(1);
  if (!location) throw new TRPCError({ code: "NOT_FOUND", message: "ფილიალი ვერ მოიძებნა." });
}

async function assertCategory(db: Awaited<ReturnType<typeof requireDb>>, slug: string | null | undefined) {
  if (!slug) return;
  const [category] = await db.select({ id: marketplaceCategories.id }).from(marketplaceCategories).where(and(eq(marketplaceCategories.slug, slug), eq(marketplaceCategories.isActive, true))).limit(1);
  if (!category) throw new TRPCError({ code: "BAD_REQUEST", message: "კატეგორია ვერ მოიძებნა." });
}

function assertContactAndSalary(v: { contactPhone?: string | null; contactEmail?: string | null; salaryFromTetri?: number | null; salaryToTetri?: number | null }) {
  if (!v.contactPhone && !v.contactEmail) throw new TRPCError({ code: "BAD_REQUEST", message: "მიუთითეთ ტელეფონი ან ელფოსტა." });
  if (v.salaryFromTetri != null && v.salaryToTetri != null && v.salaryFromTetri > v.salaryToTetri) throw new TRPCError({ code: "BAD_REQUEST", message: "მაქსიმალური ანაზღაურება მინიმალურზე ნაკლები ვერ იქნება." });
}

/** Public rows only; ids of organization/location stay internal. */
const publicColumns = {
  id: vacancies.id,
  title: vacancies.title,
  roleCategory: vacancies.roleCategory,
  employmentType: vacancies.employmentType,
  salaryFromTetri: vacancies.salaryFromTetri,
  salaryToTetri: vacancies.salaryToTetri,
  contactPhone: vacancies.contactPhone,
  contactEmail: vacancies.contactEmail,
  publishedAt: vacancies.publishedAt,
  expiresAt: vacancies.expiresAt,
  vipUntil: vacancies.vipUntil,
  businessName: organizations.name,
  locationName: locations.name,
  locationPublicSlug: locations.publicSlug,
  areaLabelKa: locationMarketplaceProfiles.areaLabelKa,
  coverImageKey: locations.coverImageKey,
  description: vacancies.description,
};

type PublicRow = {
  vipUntil: Date | null;
  coverImageKey: string | null;
  description: string;
} & Record<string, unknown>;

function toPublic<T extends PublicRow>(row: T, now: Date) {
  const { vipUntil, coverImageKey, description: _description, ...rest } = row;
  return {
    ...rest,
    isVip: !!vipUntil && vipUntil > now,
    coverImageUrl: coverImageKey ? mediaUrl(coverImageKey) : null,
  };
}

function publicQuery(db: Awaited<ReturnType<typeof requireDb>>) {
  return db.select(publicColumns).from(vacancies)
    .innerJoin(locations, eq(vacancies.locationId, locations.id))
    .innerJoin(locationMarketplaceProfiles, eq(locationMarketplaceProfiles.locationId, locations.id))
    .innerJoin(organizations, eq(vacancies.organizationId, organizations.id))
    .leftJoin(organizationGovernance, eq(organizationGovernance.organizationId, organizations.id));
}

function publiclyVisible(now: Date) {
  return and(eq(vacancies.status, "PUBLISHED"), gt(vacancies.expiresAt, now), approvedPublicLocationCondition());
}

export const vacanciesRouter = router({
  // ---- Owner / manager ----
  list: protectedProcedure.input(vacancyOwnerListSchema).query(async ({ ctx, input }) => {
    await requireOrganizationRole(ctx.user, input.organizationId, [...vacancyManagers]);
    const db = await requireDb();
    const now = new Date();
    const rows = await db.select({ vacancy: vacancies, locationName: locations.name }).from(vacancies)
      .innerJoin(locations, eq(vacancies.locationId, locations.id))
      .where(and(eq(vacancies.organizationId, input.organizationId), input.locationId ? eq(vacancies.locationId, input.locationId) : undefined, input.status ? eq(vacancies.status, input.status) : undefined))
      .orderBy(desc(vacancies.createdAt)).limit(input.limit).offset(input.offset);
    return rows.map(({ vacancy, locationName }) => ({
      ...vacancy,
      locationName,
      isExpired: vacancy.status === "PUBLISHED" && !!vacancy.expiresAt && vacancy.expiresAt <= now,
      isVip: !!vacancy.vipUntil && vacancy.vipUntil > now,
    }));
  }),

  create: protectedProcedure.input(vacancyCreateSchema).mutation(async ({ ctx, input }) => {
    await requireOrganizationRole(ctx.user, input.organizationId, [...vacancyManagers]);
    const db = await requireDb();
    await assertLocationInOrganization(db, input.organizationId, input.locationId);
    await assertCategory(db, input.roleCategory);
    const now = new Date();
    const id = nanoid(21);
    await db.insert(vacancies).values({
      id,
      organizationId: input.organizationId,
      locationId: input.locationId,
      title: input.title,
      roleCategory: input.roleCategory ?? null,
      employmentType: input.employmentType,
      salaryFromTetri: input.salaryFromTetri ?? null,
      salaryToTetri: input.salaryToTetri ?? null,
      description: input.description,
      contactPhone: input.contactPhone ?? null,
      contactEmail: input.contactEmail ?? null,
      status: input.publish ? "PUBLISHED" : "DRAFT",
      publishedAt: input.publish ? now : null,
      expiresAt: input.publish ? new Date(now.getTime() + input.durationDays * DAY_MS) : null,
      createdByUserId: ctx.user.id,
    });
    return { id };
  }),

  update: protectedProcedure.input(vacancyUpdateSchema).mutation(async ({ ctx, input }) => {
    await requireOrganizationRole(ctx.user, input.organizationId, [...vacancyManagers]);
    const db = await requireDb();
    const [current] = await db.select().from(vacancies).where(and(eq(vacancies.id, input.id), eq(vacancies.organizationId, input.organizationId))).limit(1);
    if (!current) throw new TRPCError({ code: "NOT_FOUND", message: "ვაკანსია ვერ მოიძებნა." });
    const { organizationId: _o, id: _i, ...fields } = input;
    const patch = Object.fromEntries(Object.entries(fields).filter(([, value]) => value !== undefined)) as Partial<typeof vacancies.$inferInsert>;
    if (!Object.keys(patch).length) return { id: input.id };
    assertContactAndSalary({ ...current, ...patch });
    if (input.locationId) await assertLocationInOrganization(db, input.organizationId, input.locationId);
    if (input.roleCategory !== undefined) await assertCategory(db, input.roleCategory);
    await db.update(vacancies).set(patch).where(and(eq(vacancies.id, input.id), eq(vacancies.organizationId, input.organizationId)));
    return { id: input.id };
  }),

  /** Publishes a draft or re-opens a closed/expired vacancy for another `durationDays`. */
  publish: protectedProcedure.input(vacancyPublishSchema).mutation(async ({ ctx, input }) => {
    await requireOrganizationRole(ctx.user, input.organizationId, [...vacancyManagers]);
    const db = await requireDb();
    const [current] = await db.select({ id: vacancies.id, status: vacancies.status, expiresAt: vacancies.expiresAt }).from(vacancies).where(and(eq(vacancies.id, input.id), eq(vacancies.organizationId, input.organizationId))).limit(1);
    if (!current) throw new TRPCError({ code: "NOT_FOUND", message: "ვაკანსია ვერ მოიძებნა." });
    const now = new Date();
    // Re-publishing a live vacancy would bump it to the top for free; VIP is the paid way up.
    if (current.status === "PUBLISHED" && current.expiresAt && current.expiresAt > now) throw new TRPCError({ code: "BAD_REQUEST", message: "ვაკანსია უკვე გამოქვეყნებულია. ხელახლა გამოქვეყნება ვადის გასვლის ან დახურვის შემდეგ შეიძლება." });
    const expiresAt = new Date(now.getTime() + input.durationDays * DAY_MS);
    await db.update(vacancies).set({ status: "PUBLISHED", publishedAt: now, expiresAt }).where(and(eq(vacancies.id, input.id), eq(vacancies.organizationId, input.organizationId)));
    return { id: input.id, expiresAt };
  }),

  close: protectedProcedure.input(vacancyCloseSchema).mutation(async ({ ctx, input }) => {
    await requireOrganizationRole(ctx.user, input.organizationId, [...vacancyManagers]);
    const db = await requireDb();
    const [current] = await db.select({ id: vacancies.id }).from(vacancies).where(and(eq(vacancies.id, input.id), eq(vacancies.organizationId, input.organizationId))).limit(1);
    if (!current) throw new TRPCError({ code: "NOT_FOUND", message: "ვაკანსია ვერ მოიძებნა." });
    await db.update(vacancies).set({ status: "CLOSED" }).where(and(eq(vacancies.id, input.id), eq(vacancies.organizationId, input.organizationId)));
    return { id: input.id };
  }),

  // ---- Public ----
  publicList: publicProcedure.input(vacancyPublicListSchema).query(async ({ input }) => {
    const db = await requireDb();
    const now = new Date();
    const rows = await publicQuery(db)
      .where(and(
        publiclyVisible(now),
        input.category ? eq(vacancies.roleCategory, input.category) : undefined,
        input.vertical ? verticalSlugCondition(vacancies.roleCategory, input.vertical) : undefined,
        input.area ? like(locationMarketplaceProfiles.areaLabelKa, `%${input.area}%`) : undefined,
      ))
      // VIP first, then newest.
      .orderBy(desc(sql`CASE WHEN ${gt(vacancies.vipUntil, now)} THEN 1 ELSE 0 END`), desc(vacancies.publishedAt), desc(vacancies.id))
      .limit(input.limit + 1).offset(input.offset);
    return { items: rows.slice(0, input.limit).map(row => toPublic(row, now)), hasMore: rows.length > input.limit };
  }),

  publicVipList: publicProcedure.input(vacancyPublicVipListSchema).query(async ({ input }) => {
    const db = await requireDb();
    const now = new Date();
    const rows = await publicQuery(db)
      .where(and(publiclyVisible(now), gt(vacancies.vipUntil, now), input.vertical ? verticalSlugCondition(vacancies.roleCategory, input.vertical) : undefined))
      .orderBy(desc(vacancies.publishedAt), desc(vacancies.id)).limit(input.limit);
    return rows.map(row => toPublic(row, now));
  }),

  publicDetail: publicProcedure.input(vacancyPublicDetailSchema).query(async ({ input }) => {
    const db = await requireDb();
    const now = new Date();
    const [row] = await publicQuery(db).where(and(publiclyVisible(now), eq(vacancies.id, input.id))).limit(1);
    if (!row) throw new TRPCError({ code: "NOT_FOUND", message: "ვაკანსია ვერ მოიძებნა ან უკვე დახურულია." });
    return { ...toPublic(row, now), description: row.description };
  }),

  // ---- Platform admin ----
  adminList: adminProcedure.input(vacancyAdminListSchema).query(async ({ input }) => {
    const db = await requireDb();
    const now = new Date();
    const rows = await db.select({
      id: vacancies.id,
      title: vacancies.title,
      status: vacancies.status,
      publishedAt: vacancies.publishedAt,
      expiresAt: vacancies.expiresAt,
      vipUntil: vacancies.vipUntil,
      businessName: organizations.name,
      locationName: locations.name,
    }).from(vacancies)
      .innerJoin(locations, eq(vacancies.locationId, locations.id))
      .innerJoin(organizations, eq(vacancies.organizationId, organizations.id))
      .where(and(input.status ? eq(vacancies.status, input.status) : undefined, input.vipOnly ? gt(vacancies.vipUntil, now) : undefined))
      .orderBy(desc(vacancies.createdAt)).limit(input.limit).offset(input.offset);
    return rows.map(row => ({ ...row, isVip: !!row.vipUntil && row.vipUntil > now }));
  }),

  /** Admin-managed paid placement; `vipUntil: null` clears it. No checkout is modeled. */
  setVip: adminProcedure.input(vacancyVipSchema).mutation(async ({ ctx, input }) => {
    if (input.vipUntil && input.vipUntil <= new Date()) throw new TRPCError({ code: "BAD_REQUEST", message: "VIP ვადა მომავალში უნდა იყოს." });
    const db = await requireDb();
    const [current] = await db.select({ id: vacancies.id }).from(vacancies).where(eq(vacancies.id, input.id)).limit(1);
    if (!current) throw new TRPCError({ code: "NOT_FOUND", message: "ვაკანსია ვერ მოიძებნა." });
    await db.update(vacancies).set({ vipUntil: input.vipUntil, vipSetByUserId: ctx.user.id }).where(eq(vacancies.id, input.id));
    return { id: input.id, vipUntil: input.vipUntil };
  }),
});
