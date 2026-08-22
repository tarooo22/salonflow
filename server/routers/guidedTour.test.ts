import { describe, expect, it, vi, beforeEach } from "vitest";

const mocked = vi.hoisted(() => ({ db: null as unknown, requireOrganizationRole: vi.fn(), nanoid: vi.fn() }));

vi.mock("../db", () => ({ requireDb: vi.fn(async () => mocked.db) }));
vi.mock("../access", () => ({ requireOrganizationRole: mocked.requireOrganizationRole }));
vi.mock("nanoid", () => ({ nanoid: mocked.nanoid }));

import { guidedTourRouter } from "./guidedTour";

const user = { id: 501, openId: "local_guided-tour-owner", name: "ნინო", email: "owner@example.com" };
const input = { organizationId: "organization_guided_001", tourKey: "workspace-foundation" as const };

describe("guidedTour router", () => {
  beforeEach(() => {
    mocked.requireOrganizationRole.mockReset().mockResolvedValue({ id: "membership_guided_001", role: "OWNER" });
    mocked.nanoid.mockReset().mockReturnValue("tour_progress_001");
  });

  it("returns a safe unstarted state when the active member has no stored progress", async () => {
    const limit = vi.fn(async () => []);
    mocked.db = { select: () => ({ from: () => ({ where: () => ({ limit }) }) }) };

    await expect(guidedTourRouter.createCaller({ user } as never).getState(input)).resolves.toEqual({ currentStep: 0, completed: false, autoShowDisabled: false, version: 1 });
    expect(mocked.requireOrganizationRole).toHaveBeenCalledWith(user, input.organizationId, ["OWNER", "MANAGER", "RECEPTIONIST", "STAFF"]);
  });

  it("upserts only the current user's scoped progress state", async () => {
    const onDuplicateKeyUpdate = vi.fn(async () => undefined);
    const values = vi.fn(() => ({ onDuplicateKeyUpdate }));
    mocked.db = { insert: vi.fn(() => ({ values })) };

    await expect(guidedTourRouter.createCaller({ user } as never).saveProgress({ ...input, currentStep: 3, completed: false, autoShowDisabled: true })).resolves.toEqual({ success: true });
    expect(values).toHaveBeenCalledWith(expect.objectContaining({
      id: "tour_progress_001",
      organizationId: input.organizationId,
      userId: user.id,
      tourKey: "workspace-foundation",
      currentStep: 3,
      completed: false,
      autoShowDisabled: true,
    }));
    expect(onDuplicateKeyUpdate).toHaveBeenCalledWith(expect.objectContaining({ set: expect.objectContaining({ currentStep: 3, autoShowDisabled: true }) }));
  });
});
