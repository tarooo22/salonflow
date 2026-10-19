import { TRPCError } from "@trpc/server";
import { and, asc, desc, eq, exists, like, not, or, type SQL } from "drizzle-orm";
import { nanoid } from "nanoid";
import { locationMarketplaceProfiles, locations, marketplaceCategories, marketplaceLocationCategories, organizationGovernance, organizations, products } from "../../drizzle/schema";
import { productByLocationSchema, productCreateSchema, productOwnerListSchema, productPublicListSchema, productUpdateSchema } from "../../shared/validation";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { requireOrganizationRole } from "../access";
import { requireDb } from "../db";
import { mediaUrl, parseImageDataUrl } from "../lib/media";
import { storagePut } from "../storage";
import { approvedPublicLocationCondition } from "./marketplace";

const productManagers = ["OWNER", "MANAGER"] as const;
type Db = Awaited<ReturnType<typeof requireDb>>;

async function assertLocationInOrganization(db: Db, organizationId: string, locationId: string) {
  const [location] = await db.select({ id: locations.id }).from(locations).where(and(eq(locations.id, locationId), eq(locations.organizationId, organizationId), eq(locations.status, "ACTIVE"))).limit(1);
  if (!location) throw new TRPCError({ code: "NOT_FOUND", message: "ფილიალი ვერ მოიძებნა." });
}

async function storeImage(organizationId: string, productId: string, imageDataUrl: string) {
  let image;
  try {
    image = parseImageDataUrl(imageDataUrl);
  } catch (error) {
    throw new TRPCError({ code: "BAD_REQUEST", message: error instanceof Error ? error.message : "ფოტო ვერ აიტვირთა." });
  }
  // Unique file name per upload so a replaced photo is never served from cache.
  const stored = await storagePut(`salons/${organizationId}/products/${productId}/${nanoid(8)}.${image.extension}`, image.bytes, image.contentType);
  return stored.key;
}

/** A location's marketplace categories decide a product's vertical/category filters. */
function categoryFilters(db: Db, input: { vertical?: "beauty" | "dental" | "aesthetics"; category?: string }): (SQL | undefined)[] {
  const linked = (slugCondition: SQL | undefined) => db
    .select({ one: marketplaceLocationCategories.locationId }).from(marketplaceLocationCategories)
    .innerJoin(marketplaceCategories, eq(marketplaceLocationCategories.categoryId, marketplaceCategories.id))
    .where(and(eq(marketplaceLocationCategories.locationId, locations.id), slugCondition));
  const dental = like(marketplaceCategories.slug, "dental%");
  // Same mapping as client/src/lib/verticals.ts; a location with several verticals matches each of them.
  const aesthetic = or(like(marketplaceCategories.slug, "aesthetic%"), eq(marketplaceCategories.slug, "cosmetology"))!;
  return [
    input.category ? exists(linked(eq(marketplaceCategories.slug, input.category))) : undefined,
    input.vertical === "dental" ? exists(linked(dental)) : undefined,
    input.vertical === "aesthetics" ? exists(linked(aesthetic)) : undefined,
    input.vertical === "beauty" ? exists(linked(and(not(dental), not(aesthetic)))) : undefined,
  ];
}

const publicColumns = {
  id: products.id,
  name: products.name,
  brand: products.brand,
  description: products.description,
  priceTetri: products.priceTetri,
  inStock: products.inStock,
  imageKey: products.imageKey,
  imageAltKa: products.imageAltKa,
  businessName: organizations.name,
  locationName: locations.name,
  locationPublicSlug: locations.publicSlug,
  areaLabelKa: locationMarketplaceProfiles.areaLabelKa,
};

function toPublic<T extends { imageKey: string | null }>({ imageKey, ...row }: T) {
  return { ...row, imageUrl: imageKey ? mediaUrl(imageKey) : null };
}

function publicQuery(db: Db) {
  return db.select(publicColumns).from(products)
    .innerJoin(locations, eq(products.locationId, locations.id))
    .innerJoin(locationMarketplaceProfiles, eq(locationMarketplaceProfiles.locationId, locations.id))
    .innerJoin(organizations, eq(products.organizationId, organizations.id))
    .leftJoin(organizationGovernance, eq(organizationGovernance.organizationId, organizations.id));
}

export const productsRouter = router({
  // ---- Owner / manager ----
  list: protectedProcedure.input(productOwnerListSchema).query(async ({ ctx, input }) => {
    await requireOrganizationRole(ctx.user, input.organizationId, [...productManagers]);
    const db = await requireDb();
    const rows = await db.select({ product: products, locationName: locations.name }).from(products)
      .innerJoin(locations, eq(products.locationId, locations.id))
      .where(and(eq(products.organizationId, input.organizationId), input.locationId ? eq(products.locationId, input.locationId) : undefined, input.includeArchived ? undefined : eq(products.status, "ACTIVE")))
      .orderBy(asc(products.sortOrder), desc(products.createdAt)).limit(500);
    return rows.map(({ product, locationName }) => ({ ...product, locationName, imageUrl: product.imageKey ? mediaUrl(product.imageKey) : null }));
  }),

  create: protectedProcedure.input(productCreateSchema).mutation(async ({ ctx, input }) => {
    await requireOrganizationRole(ctx.user, input.organizationId, [...productManagers]);
    const db = await requireDb();
    await assertLocationInOrganization(db, input.organizationId, input.locationId);
    const id = nanoid(21);
    const imageKey = input.imageDataUrl ? await storeImage(input.organizationId, id, input.imageDataUrl) : null;
    await db.insert(products).values({
      id,
      organizationId: input.organizationId,
      locationId: input.locationId,
      name: input.name,
      brand: input.brand || null,
      description: input.description || null,
      priceTetri: input.priceTetri,
      inStock: input.inStock,
      imageKey,
      imageAltKa: imageKey ? input.imageAltKa ?? null : null,
      sortOrder: input.sortOrder,
    });
    return { id };
  }),

  /** Edits, toggles stock, archives (status: ARCHIVED) or restores. Products are never deleted. */
  update: protectedProcedure.input(productUpdateSchema).mutation(async ({ ctx, input }) => {
    await requireOrganizationRole(ctx.user, input.organizationId, [...productManagers]);
    const db = await requireDb();
    const [current] = await db.select({ id: products.id }).from(products).where(and(eq(products.id, input.id), eq(products.organizationId, input.organizationId))).limit(1);
    if (!current) throw new TRPCError({ code: "NOT_FOUND", message: "პროდუქტი ვერ მოიძებნა." });
    if (input.locationId) await assertLocationInOrganization(db, input.organizationId, input.locationId);
    const { organizationId: _o, id: _i, imageDataUrl, imageAltKa, removeImage, brand, description, ...fields } = input;
    const patch = Object.fromEntries(Object.entries(fields).filter(([, value]) => value !== undefined)) as Partial<typeof products.$inferInsert>;
    if (brand !== undefined) patch.brand = brand || null;
    if (description !== undefined) patch.description = description || null;
    if (imageDataUrl) {
      patch.imageKey = await storeImage(input.organizationId, input.id, imageDataUrl);
      patch.imageAltKa = imageAltKa ?? null;
    } else if (removeImage) {
      patch.imageKey = null;
      patch.imageAltKa = null;
    }
    if (Object.keys(patch).length) await db.update(products).set(patch).where(and(eq(products.id, input.id), eq(products.organizationId, input.organizationId)));
    return { id: input.id };
  }),

  // ---- Public ----
  publicList: publicProcedure.input(productPublicListSchema).query(async ({ input }) => {
    const db = await requireDb();
    const rows = await publicQuery(db)
      .where(and(eq(products.status, "ACTIVE"), approvedPublicLocationCondition(), ...categoryFilters(db, input), input.area ? like(locationMarketplaceProfiles.areaLabelKa, `%${input.area}%`) : undefined))
      .orderBy(desc(products.inStock), desc(products.createdAt), desc(products.id)).limit(input.limit + 1).offset(input.offset);
    return { items: rows.slice(0, input.limit).map(toPublic), hasMore: rows.length > input.limit };
  }),

  byLocation: publicProcedure.input(productByLocationSchema).query(async ({ input }) => {
    const db = await requireDb();
    const rows = await publicQuery(db)
      .where(and(eq(products.status, "ACTIVE"), approvedPublicLocationCondition(), eq(locations.publicSlug, input.publicSlug)))
      .orderBy(asc(products.sortOrder), desc(products.createdAt)).limit(200);
    return rows.map(toPublic);
  }),
});
