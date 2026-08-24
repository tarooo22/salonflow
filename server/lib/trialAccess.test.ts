import { describe, expect, it, vi } from "vitest";

const mocked = vi.hoisted(() => ({ db: null as unknown, nanoid: vi.fn(() => "trial_event_001") }));

vi.mock("../db", () => ({ requireDb: vi.fn(async () => mocked.db) }));
vi.mock("nanoid", () => ({ nanoid: mocked.nanoid }));

import { isOrganizationTrialPublicBookingActive, requireActiveTrialForOrganization, requireApprovedTrialForWorkspaceCreation } from "./trialAccess";

type Trial = { id: string; userId: number; organizationId: string | null; status: "PENDING" | "APPROVED" | "REJECTED" | "EXPIRED" | "CANCELLED"; expiresAt: Date | null };
function createDb(trial: Trial | null) {
  const values = vi.fn(async () => undefined);
  const where = vi.fn(async () => undefined);
  const set = vi.fn(() => ({ where }));
  const update = vi.fn(() => ({ set }));
  const selectWhere = vi.fn(() => ({ limit: vi.fn(async () => trial ? [trial] : []) }));
  const select = vi.fn(() => ({ from: vi.fn(() => ({ where: selectWhere })) }));
  const transaction = vi.fn(async (callback: (tx: { update: typeof update; insert: () => { values: typeof values } }) => Promise<void>) => callback({ update, insert: () => ({ values }) }));
  return { select, transaction, update, values };
}

describe("trial access entitlement", () => {
  it("keeps existing organizations without a linked trial operational", async () => {
    mocked.db = createDb(null);
    await expect(requireActiveTrialForOrganization("legacy_org")).resolves.toBeNull();
    await expect(isOrganizationTrialPublicBookingActive("legacy_org")).resolves.toBe(true);
  });

  it("allows one workspace creation for an active, unlinked approved trial", async () => {
    const active = { id: "active_trial", userId: 7, organizationId: null, status: "APPROVED" as const, expiresAt: new Date(Date.now() + 86_400_000) };
    mocked.db = createDb(active);
    await expect(requireApprovedTrialForWorkspaceCreation(7)).resolves.toMatchObject({ id: "active_trial" });
  });

  it("marks an expired approved trial and denies workspace operations without deleting data", async () => {
    const expired = { id: "expired_trial", userId: 8, organizationId: "trial_org", status: "APPROVED" as const, expiresAt: new Date(Date.now() - 1_000) };
    const db = createDb(expired);
    mocked.db = db;
    await expect(requireActiveTrialForOrganization("trial_org")).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(db.update).toHaveBeenCalledTimes(1);
    expect(db.values).toHaveBeenCalledWith(expect.objectContaining({ trialRequestId: "expired_trial", eventType: "EXPIRED_BY_ACCESS_CHECK" }));
  });

  it("reports false for expired public booking access while preserving the linked trial record", async () => {
    const expired = { id: "expired_public_trial", userId: 9, organizationId: "trial_public_org", status: "APPROVED" as const, expiresAt: new Date(Date.now() - 1_000) };
    const db = createDb(expired);
    mocked.db = db;
    await expect(isOrganizationTrialPublicBookingActive("trial_public_org")).resolves.toBe(false);
    expect(db.update).toHaveBeenCalledTimes(1);
    expect(db.values).toHaveBeenCalledWith(expect.objectContaining({ trialRequestId: "expired_public_trial", eventType: "EXPIRED_BY_ACCESS_CHECK" }));
  });
});
