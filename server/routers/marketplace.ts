import { and, asc, desc, eq, gt, inArray, isNull, like, lte, notLike, or } from "drizzle-orm";
import { nanoid } from "nanoid";
import {
  locationMarketplaceProfiles,
  locations,
  marketplaceCategories,
  marketplaceListingEvents,
  marketplaceLocationCategories,
  marketplaceLocationCategoryServices,
  marketplacePromotions,
  organizationGovernance,
  organizations,
  services,
} from "../../drizzle/schema";
import {
  marketplaceAdminReviewSchema,
  marketplaceAdminQueueSchema,
  marketplaceDirectorySchema,
  marketplaceOwnerGeocodeSchema,
  marketplaceOwnerListingScopeSchema,
  marketplaceOwnerListingUpdateSchema,
  marketplaceOwnerMapPointConfirmSchema,
  marketplaceOwnerSubmitSchema,
  marketplacePromotionScheduleSchema,
  marketplacePromotionCancelSchema,
  slugSchema,
} from "../../shared/validation";
import { requireDb } from "../db";
import { requireOrganizationRole } from "../access";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { mediaUrl } from "../lib/media";
import { makeRequest, type GeocodingResult } from "../_core/map";

type ListingStatus = "DRAFT" | "SUBMITTED" | "APPROVED" | "HIDDEN" | "REJECTED";

export function canTransitionMarketplaceListing(from: ListingStatus, to: ListingStatus, isAdmin: boolean) {
  if (isAdmin) return ["APPROVED", "HIDDEN", "REJECTED"].includes(to);
  return (from === "DRAFT" || from === "REJECTED" || from === "HIDDEN") && to === "SUBMITTED";
}

export function isPromotionVisible(promotion: { status: string; startsAt: Date; endsAt: Date }, now = new Date()) {
  return marketplacePromotionLifecycleStatus(promotion, now) === "ACTIVE";
}

export function marketplacePromotionLifecycleStatus(promotion: { status: string; startsAt: Date; endsAt: Date }, now = new Date()) {
  if (promotion.status === "CANCELLED" || promotion.status === "EXPIRED") return promotion.status;
  if (promotion.endsAt <= now) return "EXPIRED";
  return promotion.startsAt <= now ? "ACTIVE" : "SCHEDULED";
}

export function marketplacePublicMapPoint(input: { mapVisibility: boolean; latitudeE6: number | null; longitudeE6: number | null }) {
  return input.mapVisibility && input.latitudeE6 !== null && input.longitudeE6 !== null ? { latitudeE6: input.latitudeE6, longitudeE6: input.longitudeE6 } : null;
}

export function marketplaceLaunchReadiness(input: { hasCoverImage: boolean; hasCoverAlt: boolean; hasPublicDescription: boolean; hasOnlineServices: boolean; hasCategoryLinks: boolean; bookingEnabled: boolean; mapVisibility: boolean; hasConfirmedMapPoint: boolean }) {
  const items = [
    { key: "cover", label: "ტიტულური ფოტო", complete: input.hasCoverImage, action: "ტიტულური ფოტო ატვირთეთ გვერდზე „ფოტოები და აღწერა“." },
    { key: "alt", label: "ფოტოს აღწერა", complete: input.hasCoverImage && input.hasCoverAlt, action: "დაამატეთ ტიტულური ფოტოს მოკლე აღწერა ქართულად." },
    { key: "description", label: "საჯარო აღწერა", complete: input.hasPublicDescription, action: "დაამატეთ მოკლე, ფაქტობრივი საჯარო აღწერა." },
    { key: "booking", label: "ონლაინ ჩაწერა", complete: input.bookingEnabled && input.hasOnlineServices, action: "ჩართეთ ონლაინ ჩაწერა და დატოვეთ მინიმუმ ერთი აქტიური სერვისი, რომელზეც ონლაინ ჩაწერა შეიძლება." },
    { key: "categories", label: "კატალოგის კატეგორია", complete: input.hasCategoryLinks, action: "კატეგორია დააკავშირეთ სერვისთან, რომელზეც ონლაინ ჩაწერა შეიძლება." },
    { key: "map", label: "რუკის თანხმობა", complete: !input.mapVisibility || input.hasConfirmedMapPoint, action: "რუკაზე გამოსაჩენად ჯერ დაადასტურეთ ადგილის წერტილი." },
  ];
  return { items, completed: items.filter(item => item.complete).length, total: items.length, readyForReview: items.every(item => item.complete) };
}

export type MarketplaceGeocodeCandidate = {
  placeId: string;
  formattedAddress: string;
  latitudeE6: number;
  longitudeE6: number;
};

export function normalizeMarketplaceGeocodeCandidates(response: GeocodingResult): MarketplaceGeocodeCandidate[] {
  if (response.status === "ZERO_RESULTS") return [];
  if (response.status !== "OK") throw new TRPCError({ code: "BAD_REQUEST", message: "მისამართის მოძიება ახლა ვერ მოხერხდა. სცადეთ მოგვიანებით." });
  return response.results.flatMap(result => {
    const latitudeE6 = Math.round(result.geometry.location.lat * 1_000_000);
    const longitudeE6 = Math.round(result.geometry.location.lng * 1_000_000);
    if (!Number.isInteger(latitudeE6) || !Number.isInteger(longitudeE6) || latitudeE6 < -90_000_000 || latitudeE6 > 90_000_000 || longitudeE6 < -180_000_000 || longitudeE6 > 180_000_000) return [];
    return [{ placeId: result.place_id, formattedAddress: result.formatted_address, latitudeE6, longitudeE6 }];
  }).slice(0, 5);
}

async function getMarketplaceGeocodeCandidates(address: string) {
  try {
    const response = await makeRequest<GeocodingResult>("/maps/api/geocode/json", { address });
    return normalizeMarketplaceGeocodeCandidates(response);
  } catch (error) {
    if (error instanceof TRPCError) throw error;
    throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "მისამართის მოძიება ახლა ვერ მოხერხდა. სცადეთ მოგვიანებით." });
  }
}

export function marketplaceDirectoryPublicListing<T extends { address: unknown; latitudeE6: number | null; longitudeE6: number | null; mapVisibility: boolean }>(row: T, includeMapPoint = false) {
  const { address: _address, latitudeE6, longitudeE6, mapVisibility, ...listing } = row;
  return {
    ...listing,
    ...(includeMapPoint ? { mapPoint: marketplacePublicMapPoint({ mapVisibility, latitudeE6, longitudeE6 }) } : {}),
  };
}

/**
 * Public-visibility rule for anything attached to a location (vacancies, products): approved marketplace profile,
 * active bookable branch, active organization not hidden by governance. The query must join locations,
 * locationMarketplaceProfiles, organizations and (left) organizationGovernance.
 */
export function approvedPublicLocationCondition() {
  return and(
    eq(locationMarketplaceProfiles.status, "APPROVED"),
    eq(locations.status, "ACTIVE"),
    eq(locations.bookingEnabled, true),
    eq(organizations.status, "ACTIVE"),
    or(isNull(organizationGovernance.organizationId), eq(organizationGovernance.publicVisible, true)),
  );
}

function requireMarketplaceAdmin(user: { role: string } | null) {
  if (!user || user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "კატალოგის სამართავად პლატფორმის ადმინისტრატორის წვდომაა საჭირო." });
}

async function assertOwnerLocation(user: Parameters<typeof requireOrganizationRole>[0], organizationId: string, locationId: string) {
  await requireOrganizationRole(user, organizationId, ["OWNER"]);
  const db = await requireDb();
  const [location] = await db.select().from(locations).where(and(eq(locations.id, locationId), eq(locations.organizationId, organizationId))).limit(1);
  if (!location) throw new TRPCError({ code: "NOT_FOUND", message: "ფილიალი ვერ მოიძებნა." });
  return { db, location };
}

/** Escapes LIKE wildcards so a visitor's "%" or "_" is matched literally (MySQL's default escape character is backslash). */
export function escapeLikePattern(value: string) {
  return value.replace(/[\\%_]/g, character => `\\${character}`);
}

/**
 * LIKE patterns for service/category names: the phrase itself plus, for a single longer word, its first four letters
 * (a cheap Georgian stem: "ფრჩხილები" also finds "ფრჩხილების მოვლა"). A prefix of the whole name or of a later word.
 */
export function directoryNamePatterns(search: string) {
  const phrase = search.trim();
  if (!phrase) return [];
  const patterns = [`%${escapeLikePattern(phrase)}%`];
  const letters = Array.from(phrase);
  if (!/\s/.test(phrase) && letters.length >= 5) {
    const stem = escapeLikePattern(letters.slice(0, 4).join(""));
    patterns.push(`${stem}%`, `% ${stem}%`);
  }
  return patterns;
}

/** Field names a visitor may type instead of a service ("სილამაზე") and the category slugs they stand for. */
function verticalSlugCondition(search: string) {
  const word = search.trim().toLocaleLowerCase("ka-GE");
  if (word === "სილამაზე") return and(notLike(marketplaceCategories.slug, "dental%"), notLike(marketplaceCategories.slug, "aesthetic%"), notLike(marketplaceCategories.slug, "cosmetology"));
  if (word === "ესთეტიკა") return or(like(marketplaceCategories.slug, "aesthetic%"), eq(marketplaceCategories.slug, "cosmetology"));
  if (word === "სტომატოლოგია") return like(marketplaceCategories.slug, "dental%");
  return undefined;
}

async function approvedDirectoryRows(input: { categorySlug?: string; search?: string; area?: string; limit: number; offset: number }) {
  const db = await requireDb();
  let searchCondition;
  if (input.search) {
    const escaped = escapeLikePattern(input.search);
    // Locations offering an active, online-bookable service whose name (or whose marketplace category name) matches.
    const matchingServiceLocations = db.select({ locationId: marketplaceLocationCategoryServices.locationId }).from(marketplaceLocationCategoryServices)
      .innerJoin(services, eq(marketplaceLocationCategoryServices.serviceId, services.id))
      .innerJoin(marketplaceCategories, eq(marketplaceLocationCategoryServices.categoryId, marketplaceCategories.id))
      .where(and(eq(services.status, "ACTIVE"), eq(services.onlineBookingEnabled, true), eq(marketplaceCategories.isActive, true), or(...directoryNamePatterns(input.search).flatMap(pattern => [like(services.nameKa, pattern), like(marketplaceCategories.nameKa, pattern)]), verticalSlugCondition(input.search))));
    searchCondition = or(
      like(locations.name, `%${escaped}%`),
      like(organizations.name, `%${escaped}%`),
      like(locationMarketplaceProfiles.areaLabelKa, `%${escaped}%`),
      inArray(locations.id, matchingServiceLocations),
    );
  }
  const areaCondition = input.area ? like(locationMarketplaceProfiles.areaLabelKa, `%${escapeLikePattern(input.area)}%`) : undefined;
  const baseRows = await db.select({
    locationId: locations.id,
    organizationId: locations.organizationId,
    publicSlug: locations.publicSlug,
    name: locations.name,
    organizationName: organizations.name,
    address: locations.address,
    areaLabelKa: locationMarketplaceProfiles.areaLabelKa,
    approvedAt: locationMarketplaceProfiles.approvedAt,
    publicDescription: locations.publicDescription,
    coverImageKey: locations.coverImageKey,
    coverImageAltKa: locations.coverImageAltKa,
    latitudeE6: locations.latitudeE6,
    longitudeE6: locations.longitudeE6,
    mapVisibility: locationMarketplaceProfiles.mapVisibility,
  }).from(locationMarketplaceProfiles)
    .innerJoin(locations, eq(locationMarketplaceProfiles.locationId, locations.id))
    .innerJoin(organizations, eq(locations.organizationId, organizations.id))
    .where(and(eq(locationMarketplaceProfiles.status, "APPROVED"), eq(locations.status, "ACTIVE"), eq(locations.bookingEnabled, true), searchCondition, areaCondition))
    .orderBy(asc(locations.name));

  if (!baseRows.length) return { total: 0, items: [] as Array<Record<string, unknown>> };
  const locationIds = baseRows.map(row => row.locationId);
  const categoryRows = await db.select({
    locationId: marketplaceLocationCategories.locationId,
    id: marketplaceCategories.id,
    slug: marketplaceCategories.slug,
    nameKa: marketplaceCategories.nameKa,
    iconKey: marketplaceCategories.iconKey,
  }).from(marketplaceLocationCategories)
    .innerJoin(marketplaceCategories, eq(marketplaceLocationCategories.categoryId, marketplaceCategories.id))
    .innerJoin(marketplaceLocationCategoryServices, and(eq(marketplaceLocationCategoryServices.locationId, marketplaceLocationCategories.locationId), eq(marketplaceLocationCategoryServices.categoryId, marketplaceLocationCategories.categoryId)))
    .innerJoin(services, eq(marketplaceLocationCategoryServices.serviceId, services.id))
    .where(and(inArray(marketplaceLocationCategories.locationId, locationIds), eq(marketplaceCategories.isActive, true), eq(services.status, "ACTIVE"), eq(services.onlineBookingEnabled, true)));
  const categoriesByLocation = new Map<string, Array<{ id: string; slug: string; nameKa: string; iconKey: string }>>();
  for (const category of categoryRows) {
    const existing = categoriesByLocation.get(category.locationId) ?? [];
    if (!existing.some(item => item.id === category.id)) existing.push({ id: category.id, slug: category.slug, nameKa: category.nameKa, iconKey: category.iconKey });
    categoriesByLocation.set(category.locationId, existing);
  }
  const now = new Date();
  const promotionRows = await db.select({ locationId: marketplacePromotions.locationId, tier: marketplacePromotions.tier, startsAt: marketplacePromotions.startsAt, endsAt: marketplacePromotions.endsAt, status: marketplacePromotions.status, displayDisclosure: marketplacePromotions.displayDisclosure }).from(marketplacePromotions)
    .where(and(inArray(marketplacePromotions.locationId, locationIds), inArray(marketplacePromotions.status, ["SCHEDULED", "ACTIVE"]), gt(marketplacePromotions.endsAt, now)));
  const promotionsByLocation = new Map(promotionRows.filter(row => isPromotionVisible(row, now)).map(row => [row.locationId, row]));
  const filtered = baseRows.map(row => ({
    ...row,
    coverImageUrl: row.coverImageKey ? mediaUrl(row.coverImageKey) : null,
    categories: categoriesByLocation.get(row.locationId) ?? [],
    promotion: promotionsByLocation.get(row.locationId) ? { tier: promotionsByLocation.get(row.locationId)!.tier, disclosure: promotionsByLocation.get(row.locationId)!.displayDisclosure } : null,
  })).filter(row => !input.categorySlug || row.categories.some(category => category.slug === input.categorySlug));
  const sorted = [...filtered].sort((a, b) => (a.promotion?.tier === "VIP" ? -2 : a.promotion?.tier === "RECOMMENDED" ? -1 : 0) - (b.promotion?.tier === "VIP" ? -2 : b.promotion?.tier === "RECOMMENDED" ? -1 : 0) || a.name.localeCompare(b.name, "ka-GE"));
  return { total: sorted.length, items: sorted.slice(input.offset, input.offset + input.limit) };
}

export const marketplaceRouter = router({
  categories: publicProcedure.query(async () => {
    const db = await requireDb();
    return db.select({ id: marketplaceCategories.id, slug: marketplaceCategories.slug, nameKa: marketplaceCategories.nameKa, iconKey: marketplaceCategories.iconKey }).from(marketplaceCategories).where(eq(marketplaceCategories.isActive, true)).orderBy(asc(marketplaceCategories.sortOrder));
  }),

  directory: publicProcedure.input(marketplaceDirectorySchema).query(async ({ input }) => {
    const result = await approvedDirectoryRows(input);
    return { ...result, items: result.items.map(item => marketplaceDirectoryPublicListing(item as typeof item & { address: unknown; latitudeE6: number | null; longitudeE6: number | null; mapVisibility: boolean }, true)) };
  }),

  mapResults: publicProcedure.input(marketplaceDirectorySchema).query(async ({ input }) => {
    const result = await approvedDirectoryRows(input);
    const items = result.items.map(item => marketplaceDirectoryPublicListing(item as typeof item & { address: unknown; latitudeE6: number | null; longitudeE6: number | null; mapVisibility: boolean }, true)).filter(item => item.mapPoint !== null);
    return { total: items.length, items };
  }),

  listingBySlug: publicProcedure.input(slugSchema).query(async ({ input: slug }) => {
    const db = await requireDb();
    const [listing] = await db.select({
      locationId: locations.id,
      mapVisibility: locationMarketplaceProfiles.mapVisibility,
      latitudeE6: locations.latitudeE6,
      longitudeE6: locations.longitudeE6,
    }).from(locationMarketplaceProfiles)
      .innerJoin(locations, eq(locationMarketplaceProfiles.locationId, locations.id))
      .where(and(eq(locations.publicSlug, slug), eq(locationMarketplaceProfiles.status, "APPROVED"), eq(locations.status, "ACTIVE"), eq(locations.bookingEnabled, true))).limit(1);
    if (!listing) return null;
    const categories = await db.select({ id: marketplaceCategories.id, slug: marketplaceCategories.slug, nameKa: marketplaceCategories.nameKa, iconKey: marketplaceCategories.iconKey }).from(marketplaceLocationCategories)
      .innerJoin(marketplaceCategories, eq(marketplaceLocationCategories.categoryId, marketplaceCategories.id))
      .innerJoin(marketplaceLocationCategoryServices, and(eq(marketplaceLocationCategoryServices.locationId, marketplaceLocationCategories.locationId), eq(marketplaceLocationCategoryServices.categoryId, marketplaceLocationCategories.categoryId)))
      .innerJoin(services, eq(marketplaceLocationCategoryServices.serviceId, services.id))
      .where(and(eq(marketplaceLocationCategories.locationId, listing.locationId), eq(marketplaceCategories.isActive, true), eq(services.status, "ACTIVE"), eq(services.onlineBookingEnabled, true)));
    const now = new Date();
    const promotions = await db.select({ tier: marketplacePromotions.tier, disclosure: marketplacePromotions.displayDisclosure, startsAt: marketplacePromotions.startsAt, endsAt: marketplacePromotions.endsAt, status: marketplacePromotions.status }).from(marketplacePromotions)
      .where(and(eq(marketplacePromotions.locationId, listing.locationId), inArray(marketplacePromotions.status, ["SCHEDULED", "ACTIVE"]), gt(marketplacePromotions.endsAt, now)));
    const promotion = promotions.find(item => isPromotionVisible(item, now));
    return {
      categories: categories.filter((category, index, rows) => rows.findIndex(item => item.id === category.id) === index),
      promotion: promotion ?? null,
      mapPoint: marketplacePublicMapPoint(listing),
    };
  }),

  getOwnListing: protectedProcedure.input(marketplaceOwnerListingScopeSchema).query(async ({ ctx, input }) => {
    const { db, location } = await assertOwnerLocation(ctx.user, input.organizationId, input.locationId);
    const [profile] = await db.select().from(locationMarketplaceProfiles).where(eq(locationMarketplaceProfiles.locationId, location.id)).limit(1);
    const links = await db.select({ categoryId: marketplaceLocationCategories.categoryId, serviceId: marketplaceLocationCategoryServices.serviceId }).from(marketplaceLocationCategories)
      .leftJoin(marketplaceLocationCategoryServices, and(eq(marketplaceLocationCategories.locationId, marketplaceLocationCategoryServices.locationId), eq(marketplaceLocationCategories.categoryId, marketplaceLocationCategoryServices.categoryId)))
      .where(eq(marketplaceLocationCategories.locationId, location.id));
    const launchReadiness = marketplaceLaunchReadiness({
      hasCoverImage: Boolean(location.coverImageKey),
      hasCoverAlt: Boolean(location.coverImageAltKa?.trim()),
      hasPublicDescription: Boolean(location.publicDescription?.trim()),
      hasOnlineServices: links.some(link => Boolean(link.serviceId)),
      hasCategoryLinks: links.some(link => Boolean(link.serviceId)),
      bookingEnabled: location.bookingEnabled,
      mapVisibility: profile?.mapVisibility ?? false,
      hasConfirmedMapPoint: Boolean(profile?.geocodeConfirmedAt) && location.latitudeE6 !== null && location.longitudeE6 !== null,
    });
    return { location, profile: profile ?? null, categoryServiceLinks: links, launchReadiness };
  }),

  geocodeOwnLocation: protectedProcedure.input(marketplaceOwnerGeocodeSchema).mutation(async ({ ctx, input }) => {
    const { location } = await assertOwnerLocation(ctx.user, input.organizationId, input.locationId);
    const address = location.address?.trim();
    if (!address || address.length > 1200) throw new TRPCError({ code: "BAD_REQUEST", message: "ფილიალის მისამართი ჯერ არ არის მითითებული. მიუთითეთ იგი ფილიალის პარამეტრებში და შემდეგ დაბრუნდით Marketplace-ში." });
    return { address, candidates: await getMarketplaceGeocodeCandidates(address) };
  }),

  confirmOwnLocationMapPoint: protectedProcedure.input(marketplaceOwnerMapPointConfirmSchema).mutation(async ({ ctx, input }) => {
    const { db, location } = await assertOwnerLocation(ctx.user, input.organizationId, input.locationId);
    const address = location.address?.trim();
    if (!address || address.length > 1200) throw new TRPCError({ code: "BAD_REQUEST", message: "ფილიალის მისამართი ჯერ არ არის მითითებული." });
    const candidates = await getMarketplaceGeocodeCandidates(address);
    const candidate = candidates.find(item => item.placeId === input.placeId && item.latitudeE6 === input.latitudeE6 && item.longitudeE6 === input.longitudeE6);
    if (!candidate) throw new TRPCError({ code: "BAD_REQUEST", message: "არჩეული მდებარეობის შედეგი ვეღარ დასტურდება. მოძებნეთ მისამართი ხელახლა." });
    await db.update(locations).set({ latitudeE6: candidate.latitudeE6, longitudeE6: candidate.longitudeE6 }).where(and(eq(locations.id, location.id), eq(locations.organizationId, input.organizationId)));
    const [existing] = await db.select().from(locationMarketplaceProfiles).where(eq(locationMarketplaceProfiles.locationId, location.id)).limit(1);
    await db.insert(locationMarketplaceProfiles).values({ locationId: location.id, mapVisibility: existing?.mapVisibility ?? false, geocodeConfirmedAt: new Date(), status: existing?.status ?? "DRAFT" }).onDuplicateKeyUpdate({ set: { geocodeConfirmedAt: new Date() } });
    await db.insert(marketplaceListingEvents).values({ id: nanoid(21), locationId: location.id, eventType: "OWNER_MAP_POINT_CONFIRMED", actorUserId: ctx.user.id, metadata: { placeId: candidate.placeId } });
    return { success: true, confirmedPoint: candidate };
  }),

  saveOwnListing: protectedProcedure.input(marketplaceOwnerListingUpdateSchema).mutation(async ({ ctx, input }) => {
    const { db, location } = await assertOwnerLocation(ctx.user, input.organizationId, input.locationId);
    const [existing] = await db.select().from(locationMarketplaceProfiles).where(eq(locationMarketplaceProfiles.locationId, location.id)).limit(1);
    const requestedMapVisibility = input.mapVisibility ?? existing?.mapVisibility ?? false;
    const hasConfirmedPoint = Boolean(input.geocodeConfirmed || existing?.geocodeConfirmedAt) && location.latitudeE6 !== null && location.longitudeE6 !== null;
    if (requestedMapVisibility && !hasConfirmedPoint) throw new TRPCError({ code: "BAD_REQUEST", message: "რუკაზე გამოსაჩენად ჯერ დაადასტურეთ მდებარეობის წერტილი." });
    await db.insert(locationMarketplaceProfiles).values({
      locationId: location.id,
      areaLabelKa: input.areaLabelKa === undefined ? existing?.areaLabelKa ?? null : input.areaLabelKa,
      mapVisibility: input.mapVisibility === undefined ? existing?.mapVisibility ?? false : input.mapVisibility,
      geocodeConfirmedAt: input.geocodeConfirmed ? new Date() : existing?.geocodeConfirmedAt ?? null,
      status: existing?.status ?? "DRAFT",
    }).onDuplicateKeyUpdate({ set: {
      areaLabelKa: input.areaLabelKa === undefined ? existing?.areaLabelKa ?? null : input.areaLabelKa,
      mapVisibility: input.mapVisibility === undefined ? existing?.mapVisibility ?? false : input.mapVisibility,
      geocodeConfirmedAt: input.geocodeConfirmed ? new Date() : existing?.geocodeConfirmedAt ?? null,
    } });
    if (input.categoryServiceLinks) {
      const requestedServiceIds = input.categoryServiceLinks.flatMap(link => link.serviceIds);
      const eligibleServices = requestedServiceIds.length ? await db.select({ id: services.id }).from(services).where(and(inArray(services.id, requestedServiceIds), eq(services.organizationId, location.organizationId), eq(services.status, "ACTIVE"), eq(services.onlineBookingEnabled, true))) : [];
      if (eligibleServices.length !== new Set(requestedServiceIds).size) throw new TRPCError({ code: "BAD_REQUEST", message: "კატალოგის კატეგორიას მხოლოდ თქვენი აქტიური online-bookable სერვისი შეიძლება დაუკავშიროთ." });
      // Validate every category first, then swap the links atomically so a failure cannot wipe an approved listing.
      for (const link of input.categoryServiceLinks) {
        const [category] = await db.select({ id: marketplaceCategories.id }).from(marketplaceCategories).where(and(eq(marketplaceCategories.id, link.categoryId), eq(marketplaceCategories.isActive, true))).limit(1);
        if (!category) throw new TRPCError({ code: "BAD_REQUEST", message: "არჩეული კატალოგის კატეგორია მიუწვდომელია." });
      }
      await db.transaction(async tx => {
        await tx.delete(marketplaceLocationCategoryServices).where(eq(marketplaceLocationCategoryServices.locationId, location.id));
        await tx.delete(marketplaceLocationCategories).where(eq(marketplaceLocationCategories.locationId, location.id));
        for (const link of input.categoryServiceLinks!) {
          await tx.insert(marketplaceLocationCategories).values({ locationId: location.id, categoryId: link.categoryId });
          await tx.insert(marketplaceLocationCategoryServices).values(link.serviceIds.map(serviceId => ({ locationId: location.id, categoryId: link.categoryId, serviceId })));
        }
      });
    }
    await db.insert(marketplaceListingEvents).values({ id: nanoid(21), locationId: location.id, eventType: "OWNER_LISTING_UPDATED", actorUserId: ctx.user.id });
    return { success: true };
  }),

  submitOwnListing: protectedProcedure.input(marketplaceOwnerSubmitSchema).mutation(async ({ ctx, input }) => {
    const { db, location } = await assertOwnerLocation(ctx.user, input.organizationId, input.locationId);
    const [profile] = await db.select().from(locationMarketplaceProfiles).where(eq(locationMarketplaceProfiles.locationId, location.id)).limit(1);
    const links = await db.select({ categoryId: marketplaceLocationCategories.categoryId }).from(marketplaceLocationCategories).where(eq(marketplaceLocationCategories.locationId, location.id));
    if (!profile || !links.length) throw new TRPCError({ code: "BAD_REQUEST", message: "გაგზავნამდე დაამატეთ კატალოგის კატეგორია და საჯარო პროფილის დეტალები." });
    if (!canTransitionMarketplaceListing(profile.status, "SUBMITTED", false)) throw new TRPCError({ code: "BAD_REQUEST", message: "ამ პროფილის გაგზავნა მიმდინარე მდგომარეობიდან შეუძლებელია." });
    await db.update(locationMarketplaceProfiles).set({ status: "SUBMITTED", ownerSubmittedAt: new Date(), reviewNoteKa: null }).where(eq(locationMarketplaceProfiles.locationId, location.id));
    await db.insert(marketplaceListingEvents).values({ id: nanoid(21), locationId: location.id, eventType: "OWNER_LISTING_SUBMITTED", actorUserId: ctx.user.id });
    return { success: true };
  }),

  adminReviewListing: protectedProcedure.input(marketplaceAdminReviewSchema).mutation(async ({ ctx, input }) => {
    requireMarketplaceAdmin(ctx.user);
    const db = await requireDb();
    const [profile] = await db.select().from(locationMarketplaceProfiles).where(eq(locationMarketplaceProfiles.locationId, input.locationId)).limit(1);
    if (!profile) throw new TRPCError({ code: "NOT_FOUND", message: "Marketplace listing ვერ მოიძებნა." });
    if (!canTransitionMarketplaceListing(profile.status, input.status, true)) throw new TRPCError({ code: "BAD_REQUEST", message: "Listing-ის ახალი სტატუსი მიუწვდომელია." });
    await db.update(locationMarketplaceProfiles).set({ status: input.status, approvedAt: input.status === "APPROVED" ? new Date() : profile.approvedAt, approvedByUserId: input.status === "APPROVED" ? ctx.user.id : profile.approvedByUserId, reviewNoteKa: input.reviewNoteKa ?? null }).where(eq(locationMarketplaceProfiles.locationId, input.locationId));
    await db.insert(marketplaceListingEvents).values({ id: nanoid(21), locationId: input.locationId, eventType: `ADMIN_LISTING_${input.status}`, actorUserId: ctx.user.id, metadata: { reviewNoteKa: input.reviewNoteKa ?? null } });
    return { success: true };
  }),

  adminListings: protectedProcedure.input(marketplaceAdminQueueSchema).query(async ({ ctx, input }) => {
    requireMarketplaceAdmin(ctx.user);
    const db = await requireDb();
    const rows = await db.select({
      locationId: locations.id,
      organizationId: organizations.id,
      organizationName: organizations.name,
      locationName: locations.name,
      publicSlug: locations.publicSlug,
      coverImageKey: locations.coverImageKey,
      coverImageAltKa: locations.coverImageAltKa,
      publicDescription: locations.publicDescription,
      bookingEnabled: locations.bookingEnabled,
      listingStatus: locationMarketplaceProfiles.status,
      ownerSubmittedAt: locationMarketplaceProfiles.ownerSubmittedAt,
      approvedAt: locationMarketplaceProfiles.approvedAt,
      reviewNoteKa: locationMarketplaceProfiles.reviewNoteKa,
      mapVisibility: locationMarketplaceProfiles.mapVisibility,
    }).from(locationMarketplaceProfiles)
      .innerJoin(locations, eq(locationMarketplaceProfiles.locationId, locations.id))
      .innerJoin(organizations, eq(locations.organizationId, organizations.id))
      .where(input.status ? eq(locationMarketplaceProfiles.status, input.status) : undefined)
      .orderBy(desc(locationMarketplaceProfiles.updatedAt))
      .limit(input.limit)
      .offset(input.offset);
    const locationIds = rows.map(row => row.locationId);
    if (!locationIds.length) return { items: [] };
    const promotions = await db.select({ id: marketplacePromotions.id, locationId: marketplacePromotions.locationId, tier: marketplacePromotions.tier, status: marketplacePromotions.status, startsAt: marketplacePromotions.startsAt, endsAt: marketplacePromotions.endsAt, displayDisclosure: marketplacePromotions.displayDisclosure }).from(marketplacePromotions).where(inArray(marketplacePromotions.locationId, locationIds)).orderBy(desc(marketplacePromotions.startsAt));
    const now = new Date();
    const promotionsByLocation = new Map<string, Array<typeof promotions[number] & { effectiveStatus: string }>>();
    for (const promotion of promotions) {
      const rowsForLocation = promotionsByLocation.get(promotion.locationId) ?? [];
      rowsForLocation.push({ ...promotion, effectiveStatus: marketplacePromotionLifecycleStatus(promotion, now) });
      promotionsByLocation.set(promotion.locationId, rowsForLocation);
    }
    return { items: rows.map(row => ({
      ...row,
      mediaReadiness: !row.coverImageKey ? "COVER_MISSING" : !row.coverImageAltKa?.trim() ? "ALT_MISSING" : "DECLARED",
      publicProfileReady: Boolean(row.publicDescription?.trim()) && row.bookingEnabled,
      promotions: promotionsByLocation.get(row.locationId) ?? [],
    })) };
  }),

  schedulePromotion: protectedProcedure.input(marketplacePromotionScheduleSchema).mutation(async ({ ctx, input }) => {
    requireMarketplaceAdmin(ctx.user);
    const db = await requireDb();
    const now = new Date();
    if (input.endsAt <= now) throw new TRPCError({ code: "BAD_REQUEST", message: "Promotion დასრულების დრო მომავალში უნდა იყოს." });
    const [listing] = await db.select().from(locationMarketplaceProfiles).where(and(eq(locationMarketplaceProfiles.locationId, input.locationId), eq(locationMarketplaceProfiles.status, "APPROVED"))).limit(1);
    if (!listing) throw new TRPCError({ code: "BAD_REQUEST", message: "Promotion-ისთვის მხოლოდ დამტკიცებული Marketplace listing შეიძლება შეირჩეს." });
    const overlapping = await db.select({ id: marketplacePromotions.id }).from(marketplacePromotions).where(and(eq(marketplacePromotions.locationId, input.locationId), inArray(marketplacePromotions.status, ["SCHEDULED", "ACTIVE"]), lte(marketplacePromotions.startsAt, input.endsAt), gt(marketplacePromotions.endsAt, input.startsAt))).limit(1);
    if (overlapping.length) throw new TRPCError({ code: "CONFLICT", message: "ამ სალონისთვის მოცემულ პერიოდში უკვე არსებობს promotion. ჯერ გააუქმეთ ან შეცვალეთ არსებული ჩანაწერი." });
    const tierLabel = input.tier === "VIP" ? "VIP / რეკლამა" : "რეკომენდებული";
    await db.insert(marketplacePromotions).values({ id: nanoid(21), locationId: input.locationId, tier: input.tier, status: input.startsAt <= now ? "ACTIVE" : "SCHEDULED", startsAt: input.startsAt, endsAt: input.endsAt, displayDisclosure: tierLabel, manualPriceTetri: input.manualPriceTetri, billingReference: input.billingReference, createdByUserId: ctx.user.id, approvedByUserId: ctx.user.id });
    await db.insert(marketplaceListingEvents).values({ id: nanoid(21), locationId: input.locationId, eventType: `ADMIN_PROMOTION_${input.tier}_SCHEDULED`, actorUserId: ctx.user.id, metadata: { startsAt: input.startsAt.toISOString(), endsAt: input.endsAt.toISOString() } });
    return { success: true, paymentCaptured: false as const };
  }),

  cancelPromotion: protectedProcedure.input(marketplacePromotionCancelSchema).mutation(async ({ ctx, input }) => {
    requireMarketplaceAdmin(ctx.user);
    const db = await requireDb();
    const [promotion] = await db.select({ id: marketplacePromotions.id, locationId: marketplacePromotions.locationId, status: marketplacePromotions.status }).from(marketplacePromotions).where(eq(marketplacePromotions.id, input.promotionId)).limit(1);
    if (!promotion) throw new TRPCError({ code: "NOT_FOUND", message: "Promotion ვერ მოიძებნა." });
    if (promotion.status === "CANCELLED") return { success: true, alreadyCancelled: true as const };
    await db.update(marketplacePromotions).set({ status: "CANCELLED", cancelledAt: new Date() }).where(eq(marketplacePromotions.id, promotion.id));
    await db.insert(marketplaceListingEvents).values({ id: nanoid(21), locationId: promotion.locationId, eventType: "ADMIN_PROMOTION_CANCELLED", actorUserId: ctx.user.id, metadata: { promotionId: promotion.id } });
    return { success: true, alreadyCancelled: false as const };
  }),
});
