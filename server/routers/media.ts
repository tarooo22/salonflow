import { and, desc, eq, inArray } from "drizzle-orm";
import { nanoid } from "nanoid";
import { appointments, clientMediaItems, clientMediaSets, clients, locationFeedPosts, locations, organizationMemberships, staffProfiles } from "../../drizzle/schema";
import { clientBeforeAfterCreateSchema, clientMediaDeleteSchema, clientMediaListSchema, clientMediaVisibilitySchema, locationCoverUploadSchema, locationFeedCreateSchema, locationFeedDeleteSchema, locationFeedListSchema, locationFeedVisibilitySchema, publicLocationProfileUpdateSchema, staffAvatarUploadSchema } from "../../shared/validation";
import { requireOrganizationRole } from "../access";
import { requireDb } from "../db";
import { mediaUrl, parseImageDataUrl } from "../lib/media";
import { storagePut } from "../storage";
import { protectedProcedure, router } from "../_core/trpc";

const profileManagers = ["OWNER"] as const;
const clientManagers = ["OWNER", "MANAGER", "RECEPTIONIST"] as const;

async function verifyLocation(db: Awaited<ReturnType<typeof requireDb>>, organizationId: string, locationId: string) {
  const [location] = await db.select({ id: locations.id }).from(locations).where(and(eq(locations.id, locationId), eq(locations.organizationId, organizationId))).limit(1);
  if (!location) throw new Error("ფილიალი ამ ორგანიზაციას არ ეკუთვნის");
  return location;
}

export const mediaRouter = router({
  setLocationCover: protectedProcedure.input(locationCoverUploadSchema).mutation(async ({ ctx, input }) => {
    await requireOrganizationRole(ctx.user, input.organizationId, [...profileManagers]);
    const db = await requireDb();
    await verifyLocation(db, input.organizationId, input.locationId);
    const image = parseImageDataUrl(input.imageDataUrl);
    const stored = await storagePut(`salons/${input.organizationId}/locations/${input.locationId}/cover.${image.extension}`, image.bytes, image.contentType);
    await db.update(locations).set({ coverImageKey: stored.key, coverImageAltKa: input.altTextKa }).where(and(eq(locations.id, input.locationId), eq(locations.organizationId, input.organizationId)));
    return { key: stored.key, url: stored.url };
  }),

  setStaffAvatar: protectedProcedure.input(staffAvatarUploadSchema).mutation(async ({ ctx, input }) => {
    await requireOrganizationRole(ctx.user, input.organizationId, [...profileManagers]);
    const db = await requireDb();
    const [staff] = await db.select({ id: staffProfiles.id }).from(staffProfiles).innerJoin(organizationMemberships, eq(staffProfiles.membershipId, organizationMemberships.id)).where(and(eq(staffProfiles.id, input.staffProfileId), eq(organizationMemberships.organizationId, input.organizationId))).limit(1);
    if (!staff) throw new Error("სპეციალისტი ამ ორგანიზაციას არ ეკუთვნის");
    const image = parseImageDataUrl(input.imageDataUrl);
    const stored = await storagePut(`salons/${input.organizationId}/staff/${input.staffProfileId}/avatar.${image.extension}`, image.bytes, image.contentType);
    await db.update(staffProfiles).set({ avatarKey: stored.key, avatarAltKa: input.altTextKa }).where(eq(staffProfiles.id, input.staffProfileId));
    return { key: stored.key, url: stored.url };
  }),

  updatePublicLocationProfile: protectedProcedure.input(publicLocationProfileUpdateSchema).mutation(async ({ ctx, input }) => {
    await requireOrganizationRole(ctx.user, input.organizationId, [...profileManagers]);
    const db = await requireDb();
    await verifyLocation(db, input.organizationId, input.locationId);
    await db.update(locations).set({ ...(input.publicDescription !== undefined ? { publicDescription: input.publicDescription || null } : {}), ...(input.socialLinks !== undefined ? { socialLinks: input.socialLinks } : {}) }).where(and(eq(locations.id, input.locationId), eq(locations.organizationId, input.organizationId)));
    return { success: true };
  }),

  listClientGallery: protectedProcedure.input(clientMediaListSchema).query(async ({ ctx, input }) => {
    await requireOrganizationRole(ctx.user, input.organizationId, [...clientManagers]);
    const db = await requireDb();
    const [client] = await db.select({ id: clients.id }).from(clients).where(and(eq(clients.id, input.clientId), eq(clients.organizationId, input.organizationId))).limit(1);
    if (!client) throw new Error("კლიენტი ამ ორგანიზაციას არ ეკუთვნის");
    const sets = await db.select().from(clientMediaSets).where(and(eq(clientMediaSets.organizationId, input.organizationId), eq(clientMediaSets.clientId, input.clientId))).orderBy(desc(clientMediaSets.createdAt));
    const setIds = sets.map(set => set.id);
    const items = setIds.length ? await db.select().from(clientMediaItems).where(inArray(clientMediaItems.setId, setIds)) : [];
    return sets.map(set => ({ set, items: items.filter(item => item.setId === set.id).map(item => ({ ...item, url: mediaUrl(item.mediaKey) })) }));
  }),

  createClientBeforeAfter: protectedProcedure.input(clientBeforeAfterCreateSchema).mutation(async ({ ctx, input }) => {
    const membership = await requireOrganizationRole(ctx.user, input.organizationId, [...clientManagers]);
    if (input.requestPublicVisibility && !profileManagers.includes(membership.role as (typeof profileManagers)[number])) throw new Error("საჯარო გამოჩენა მხოლოდ მფლობელს ან მენეჯერს შეუძლია");
    const db = await requireDb();
    const [appointment] = await db.select().from(appointments).where(and(eq(appointments.id, input.appointmentId), eq(appointments.organizationId, input.organizationId), eq(appointments.clientId, input.clientId), eq(appointments.status, "COMPLETED"))).limit(1);
    if (!appointment) throw new Error("before/after ფოტო უნდა უკავშირდებოდეს ამ კლიენტის დასრულებულ ვიზიტს");
    const before = parseImageDataUrl(input.beforeImageDataUrl);
    const after = parseImageDataUrl(input.afterImageDataUrl);
    const setId = nanoid(21);
    const [storedBefore, storedAfter] = await Promise.all([
      storagePut(`salons/${input.organizationId}/clients/${input.clientId}/visits/${input.appointmentId}/${setId}-before.${before.extension}`, before.bytes, before.contentType),
      storagePut(`salons/${input.organizationId}/clients/${input.clientId}/visits/${input.appointmentId}/${setId}-after.${after.extension}`, after.bytes, after.contentType),
    ]);
    const publicVisible = input.requestPublicVisibility && input.clientPublicationConsent;
    await db.transaction(async tx => {
      await tx.insert(clientMediaSets).values({ id: setId, organizationId: input.organizationId, clientId: input.clientId, appointmentId: input.appointmentId, locationId: appointment.locationId, publicVisible, clientPublicationConsent: input.clientPublicationConsent, clientPublicationConsentAt: input.clientPublicationConsent ? new Date() : null, internalNote: input.internalNote || null, createdByUserId: ctx.user.id });
      await tx.insert(clientMediaItems).values([
        { id: nanoid(21), setId, stage: "BEFORE", mediaKey: storedBefore.key, contentType: before.contentType, byteSize: before.bytes.length, altTextKa: input.beforeAltTextKa },
        { id: nanoid(21), setId, stage: "AFTER", mediaKey: storedAfter.key, contentType: after.contentType, byteSize: after.bytes.length, altTextKa: input.afterAltTextKa },
      ]);
    });
    return { id: setId, publicVisible };
  }),

  setClientGalleryVisibility: protectedProcedure.input(clientMediaVisibilitySchema).mutation(async ({ ctx, input }) => {
    await requireOrganizationRole(ctx.user, input.organizationId, [...profileManagers]);
    const db = await requireDb();
    const [set] = await db.select().from(clientMediaSets).where(and(eq(clientMediaSets.id, input.setId), eq(clientMediaSets.organizationId, input.organizationId))).limit(1);
    if (!set) throw new Error("ფოტოების ნაკრები ამ ორგანიზაციას არ ეკუთვნის");
    if (input.publicVisible && !set.clientPublicationConsent) throw new Error("საჯარო გამოჩენას სჭირდება კლიენტის ცალკე თანხმობა");
    await db.update(clientMediaSets).set({ publicVisible: input.publicVisible }).where(eq(clientMediaSets.id, input.setId));
    return { success: true };
  }),

  deleteClientGallerySet: protectedProcedure.input(clientMediaDeleteSchema).mutation(async ({ ctx, input }) => {
    await requireOrganizationRole(ctx.user, input.organizationId, [...clientManagers]);
    const db = await requireDb();
    const [set] = await db.select({ id: clientMediaSets.id }).from(clientMediaSets).where(and(eq(clientMediaSets.id, input.setId), eq(clientMediaSets.organizationId, input.organizationId))).limit(1);
    if (!set) throw new Error("ფოტოების ნაკრები ამ ორგანიზაციას არ ეკუთვნის");
    await db.transaction(async tx => { await tx.delete(clientMediaItems).where(eq(clientMediaItems.setId, set.id)); await tx.delete(clientMediaSets).where(eq(clientMediaSets.id, set.id)); });
    return { success: true };
  }),

  listFeed: protectedProcedure.input(locationFeedListSchema).query(async ({ ctx, input }) => {
    await requireOrganizationRole(ctx.user, input.organizationId, [...profileManagers]);
    const db = await requireDb();
    await verifyLocation(db, input.organizationId, input.locationId);
    const posts = await db.select().from(locationFeedPosts).where(and(eq(locationFeedPosts.organizationId, input.organizationId), eq(locationFeedPosts.locationId, input.locationId))).orderBy(desc(locationFeedPosts.publishedAt), desc(locationFeedPosts.createdAt));
    return posts.map(post => ({ ...post, url: mediaUrl(post.mediaKey) }));
  }),

  createFeedPost: protectedProcedure.input(locationFeedCreateSchema).mutation(async ({ ctx, input }) => {
    await requireOrganizationRole(ctx.user, input.organizationId, [...profileManagers]);
    const db = await requireDb();
    await verifyLocation(db, input.organizationId, input.locationId);
    const image = parseImageDataUrl(input.imageDataUrl);
    const id = nanoid(21);
    const stored = await storagePut(`salons/${input.organizationId}/locations/${input.locationId}/feed/${id}.${image.extension}`, image.bytes, image.contentType);
    await db.insert(locationFeedPosts).values({ id, organizationId: input.organizationId, locationId: input.locationId, mediaKey: stored.key, contentType: image.contentType, byteSize: image.bytes.length, titleKa: input.titleKa || null, captionKa: input.captionKa || null, altTextKa: input.altTextKa, publicVisible: input.publicVisible, publishedAt: input.publicVisible ? new Date() : null, sortOrder: input.sortOrder, createdByUserId: ctx.user.id });
    return { id, url: stored.url };
  }),

  setFeedVisibility: protectedProcedure.input(locationFeedVisibilitySchema).mutation(async ({ ctx, input }) => {
    await requireOrganizationRole(ctx.user, input.organizationId, [...profileManagers]);
    const db = await requireDb();
    const [post] = await db.select({ id: locationFeedPosts.id }).from(locationFeedPosts).where(and(eq(locationFeedPosts.id, input.postId), eq(locationFeedPosts.organizationId, input.organizationId))).limit(1);
    if (!post) throw new Error("პოსტი ამ ორგანიზაციას არ ეკუთვნის");
    await db.update(locationFeedPosts).set({ publicVisible: input.publicVisible, publishedAt: input.publicVisible ? new Date() : null }).where(eq(locationFeedPosts.id, input.postId));
    return { success: true };
  }),

  deleteFeedPost: protectedProcedure.input(locationFeedDeleteSchema).mutation(async ({ ctx, input }) => {
    await requireOrganizationRole(ctx.user, input.organizationId, [...profileManagers]);
    const db = await requireDb();
    const result = await db.delete(locationFeedPosts).where(and(eq(locationFeedPosts.id, input.postId), eq(locationFeedPosts.organizationId, input.organizationId)));
    if (!result[0]?.affectedRows) throw new Error("პოსტი ამ ორგანიზაციას არ ეკუთვნის");
    return { success: true };
  }),
});
