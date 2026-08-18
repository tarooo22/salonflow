import { and, asc, eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { nanoid } from "nanoid";
import { createHash } from "node:crypto";
import { SignJWT, jwtVerify } from "jose";
import { COOKIE_NAME, ONE_YEAR_MS } from "../../shared/const";
import { staffInviteAcceptSchema, staffInviteCreateSchema, staffInviteRevokeSchema, organizationScopeSchema } from "../../shared/validation";
import { locations, organizationMemberships, organizations, staffInvites, staffLocations, staffProfiles, users } from "../../drizzle/schema";
import { requireOrganizationRole } from "../access";
import { requireDb } from "../db";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { getSessionCookieOptions } from "../_core/cookies";
import { ENV } from "../_core/env";
import { createLocalSessionToken } from "../lib/localSessions";
import { hashPassword } from "../lib/passwords";
import { normalizeEmail } from "../lib/normalization";

type InvitePayload = {
  id: string;
  organizationId: string;
  email: string;
  role: "MANAGER" | "RECEPTIONIST" | "STAFF";
  locationId?: string;
  publicDisplayName: string;
  jobTitle?: string;
  specialty?: string;
  color: string;
};

function requireSecret() {
  if (!ENV.cookieSecret) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "სერვერული საიდუმლო არაა კონფიგურირებული" });
  return new TextEncoder().encode(ENV.cookieSecret);
}

function tokenHash(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

async function signInviteToken(payload: InvitePayload, expiresAt: Date) {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(Math.floor(expiresAt.getTime() / 1000))
    .sign(requireSecret());
}

async function verifyInviteToken(token: string): Promise<InvitePayload | null> {
  try {
    const { payload } = await jwtVerify(token, requireSecret());
    if (typeof payload.id !== "string" || typeof payload.organizationId !== "string" || typeof payload.email !== "string") return null;
    return payload as unknown as InvitePayload;
  } catch {
    return null;
  }
}

export const invitationsRouter = router({
  list: protectedProcedure.input(organizationScopeSchema).query(async ({ ctx, input }) => {
    await requireOrganizationRole(ctx.user, input.organizationId, ["OWNER"]);
    const db = await requireDb();
    return db.select().from(staffInvites)
      .where(and(eq(staffInvites.organizationId, input.organizationId), eq(staffInvites.status, "PENDING")))
      .orderBy(asc(staffInvites.createdAt));
  }),

  create: protectedProcedure.input(staffInviteCreateSchema).mutation(async ({ ctx, input }) => {
    await requireOrganizationRole(ctx.user, input.organizationId, ["OWNER"]);
    const db = await requireDb();

    if (input.locationId) {
      const [location] = await db.select({ id: locations.id }).from(locations)
        .where(and(eq(locations.id, input.locationId), eq(locations.organizationId, input.organizationId), eq(locations.status, "ACTIVE"))).limit(1);
      if (!location) throw new TRPCError({ code: "BAD_REQUEST", message: "მითითებული ფილიალი აღარ არის აქტიური." });
    }

    const normalizedEmail = normalizeEmail(input.email);
    if (!normalizedEmail) throw new TRPCError({ code: "BAD_REQUEST", message: "ელფოსტა არასწორია." });

    const id = nanoid(21);
    const expiresAt = new Date(Date.now() + input.expiresInDays * 86_400_000);
    const payload: InvitePayload = {
      id,
      organizationId: input.organizationId,
      email: input.email.trim(),
      role: input.role,
      locationId: input.locationId,
      publicDisplayName: input.publicDisplayName,
      jobTitle: input.jobTitle,
      specialty: input.specialty,
      color: input.color,
    };
    const token = await signInviteToken(payload, expiresAt);

    await db.insert(staffInvites).values({
      id,
      organizationId: input.organizationId,
      locationId: input.locationId,
      email: input.email.trim(),
      role: input.role,
      tokenHash: tokenHash(token),
      status: "PENDING",
      expiresAt,
      invitedByUserId: ctx.user.id,
    });
    return { id, token, expiresAt: expiresAt.toISOString(), acceptUrl: `/invite/${token}` };
  }),

  revoke: protectedProcedure.input(staffInviteRevokeSchema).mutation(async ({ ctx, input }) => {
    await requireOrganizationRole(ctx.user, input.organizationId, ["OWNER"]);
    const db = await requireDb();
    const [invite] = await db.select({ id: staffInvites.id, status: staffInvites.status }).from(staffInvites)
      .where(and(eq(staffInvites.id, input.id), eq(staffInvites.organizationId, input.organizationId))).limit(1);
    if (!invite) throw new TRPCError({ code: "NOT_FOUND", message: "მოწვევა ვერ მოიძებნა." });
    if (invite.status !== "PENDING") throw new TRPCError({ code: "BAD_REQUEST", message: "მოწვევის სტატუსის შეცვლა შეუძლებელია." });
    await db.update(staffInvites).set({ status: "REVOKED", revokedAt: new Date() }).where(eq(staffInvites.id, input.id));
    return { success: true } as const;
  }),

  previewByToken: publicProcedure.input(staffInviteAcceptSchema.pick({ token: true })).query(async ({ input }) => {
    const payload = await verifyInviteToken(input.token);
    if (!payload) return { valid: false as const };
    const db = await requireDb();
    const [invite] = await db.select().from(staffInvites).where(eq(staffInvites.id, payload.id)).limit(1);
    if (!invite || invite.status !== "PENDING" || tokenHash(input.token) !== invite.tokenHash || invite.expiresAt < new Date()) {
      return { valid: false as const };
    }
    const [org] = await db.select({ name: organizations.name }).from(organizations).where(eq(organizations.id, payload.organizationId)).limit(1);
    return {
      valid: true as const,
      email: payload.email,
      role: payload.role,
      publicDisplayName: payload.publicDisplayName,
      jobTitle: payload.jobTitle,
      color: payload.color,
      organizationName: org?.name ?? "",
      expiresAt: invite.expiresAt.toISOString(),
    };
  }),

  accept: publicProcedure.input(staffInviteAcceptSchema).mutation(async ({ ctx, input }) => {
    const payload = await verifyInviteToken(input.token);
    if (!payload) throw new TRPCError({ code: "BAD_REQUEST", message: "მოწვევის ბმული არასწორია ან ვადა გაუვიდა." });
    const db = await requireDb();
    const [invite] = await db.select().from(staffInvites).where(eq(staffInvites.id, payload.id)).limit(1);
    if (!invite || invite.status !== "PENDING" || tokenHash(input.token) !== invite.tokenHash || invite.expiresAt < new Date()) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "მოწვევის ბმული აღარ მოქმედებს." });
    }

    const normalizedEmail = normalizeEmail(payload.email);
    if (!normalizedEmail) throw new TRPCError({ code: "BAD_REQUEST", message: "ელფოსტა არასწორია." });

    const [existingUser] = await db.select().from(users).where(eq(users.normalizedEmail, normalizedEmail)).limit(1);
    // If a user already exists, require them to sign in first to add membership.
    if (existingUser && existingUser.loginMethod === "local") {
      const [existingMembership] = await db.select().from(organizationMemberships)
        .where(and(eq(organizationMemberships.organizationId, payload.organizationId), eq(organizationMemberships.userId, existingUser.id))).limit(1);
      if (existingMembership && existingMembership.status === "ACTIVE") {
        throw new TRPCError({ code: "CONFLICT", message: "ეს მომხმარებელი უკვე მიღებულია სამუშაო სივრცეში." });
      }
    }

    const passwordHash = await hashPassword(input.password);
    const displayName = input.fullName?.trim() || payload.publicDisplayName;

    const result = await db.transaction(async tx => {
      let userId: number;
      let userOpenId: string;
      let userName: string;
      if (existingUser) {
        userId = existingUser.id;
        userOpenId = existingUser.openId;
        userName = existingUser.name ?? displayName;
        // If the existing user has no login method (legacy), attach a password + email.
        if (!existingUser.loginMethod) {
          await tx.update(users).set({ passwordHash, loginMethod: "local", name: userName, lastSignedIn: new Date() }).where(eq(users.id, existingUser.id));
        }
      } else {
        userOpenId = `local_${nanoid(21)}`;
        userName = displayName;
        await tx.insert(users).values({
          openId: userOpenId, name: userName, email: payload.email, normalizedEmail, passwordHash,
          loginMethod: "local", locale: "ka-GE", accountStatus: "ACTIVE", lastSignedIn: new Date(),
        });
        const [inserted] = await tx.select({ id: users.id }).from(users).where(eq(users.openId, userOpenId)).limit(1);
        if (!inserted) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "მომხმარებლის შექმნა ვერ მოხერხდა." });
        userId = inserted.id;
      }

      const membershipId = nanoid(21);
      await tx.insert(organizationMemberships).values({
        id: membershipId, organizationId: payload.organizationId, userId, role: payload.role,
        status: "ACTIVE", invitedByUserId: invite.invitedByUserId, invitedAt: invite.createdAt,
        activatedAt: new Date(),
      });

      // Auto-create a staff profile so the new member appears immediately.
      const staffProfileId = nanoid(21);
      await tx.insert(staffProfiles).values({
        id: staffProfileId, membershipId,
        publicDisplayName: payload.publicDisplayName,
        jobTitle: payload.jobTitle, specialty: payload.specialty,
        color: payload.color, onlineBookingVisible: true,
      });
      if (payload.locationId) {
        await tx.insert(staffLocations).values({ staffProfileId, locationId: payload.locationId });
      }

      await tx.update(staffInvites).set({ status: "ACCEPTED", acceptedByUserId: userId, acceptedAt: new Date() }).where(eq(staffInvites.id, invite.id));
      return { userId, userOpenId, userName };
    });

    // Issue a session cookie so the accepted invitee is immediately signed in.
    const sessionToken = await createLocalSessionToken(result.userOpenId, result.userName);
    ctx.res.cookie(COOKIE_NAME, sessionToken, { ...getSessionCookieOptions(ctx.req), maxAge: ONE_YEAR_MS });
    return { organizationId: payload.organizationId, role: payload.role };
  }),
});
