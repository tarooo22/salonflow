import { and, eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { organizationMemberships, type User } from "../drizzle/schema";
import { requireDb } from "./db";

export type SalonRole = "OWNER" | "MANAGER" | "RECEPTIONIST" | "STAFF";

export const ROLE_ACTIONS: Record<SalonRole, ReadonlySet<string>> = {
  OWNER: new Set(["organization:manage", "team:manage", "services:manage", "clients:manage", "calendar:manage", "finance:view", "finance:manage", "reports:view", "audit:view", "tips:record", "pos:manage", "media:manage"]),
  MANAGER: new Set(["team:manage", "services:manage", "clients:manage", "calendar:manage", "finance:view", "finance:manage", "reports:view", "tips:record", "pos:manage", "media:manage"]),
  RECEPTIONIST: new Set(["clients:manage", "calendar:manage", "payments:record", "tips:record", "pos:manage"]),
  STAFF: new Set(["calendar:own", "appointments:own-status"]),
};

export function roleCan(role: SalonRole, action: string): boolean {
  return ROLE_ACTIONS[role].has(action);
}

export async function requireOrganizationRole(user: User | null, organizationId: string, allowedRoles: SalonRole[]) {
  if (!user) throw new TRPCError({ code: "UNAUTHORIZED", message: "ავტორიზაცია აუცილებელია" });
  const db = await requireDb();
  const [membership] = await db.select().from(organizationMemberships).where(and(
    eq(organizationMemberships.organizationId, organizationId),
    eq(organizationMemberships.userId, user.id),
    eq(organizationMemberships.status, "ACTIVE"),
  )).limit(1);
  if (!membership || !allowedRoles.includes(membership.role)) {
    throw new TRPCError({ code: "FORBIDDEN", message: "ამ მოქმედებისთვის წვდომა არ გაქვთ" });
  }
  return membership;
}

export async function requireOrganizationAction(user: User | null, organizationId: string, action: string) {
  const membership = await requireOrganizationRole(user, organizationId, ["OWNER", "MANAGER", "RECEPTIONIST", "STAFF"]);
  if (!roleCan(membership.role, action)) {
    throw new TRPCError({ code: "FORBIDDEN", message: "ამ მოქმედებისთვის წვდომა არ გაქვთ" });
  }
  return membership;
}
