import { beforeEach, describe, expect, it, vi } from "vitest";

const mocked = vi.hoisted(() => ({ db: null as unknown, requireOrganizationRole: vi.fn(), storagePut: vi.fn(), parseImageDataUrl: vi.fn() }));

vi.mock("../db", () => ({ requireDb: vi.fn(async () => mocked.db) }));
vi.mock("../access", () => ({ requireOrganizationRole: mocked.requireOrganizationRole }));
vi.mock("../storage", () => ({ storagePut: mocked.storagePut }));
vi.mock("../lib/media", () => ({ mediaUrl: (key: string) => `/manus-storage/${key}`, parseImageDataUrl: mocked.parseImageDataUrl }));
vi.mock("drizzle-orm", async importOriginal => {
  const actual = await importOriginal<typeof import("drizzle-orm")>();
  return { ...actual, and: (...conditions: unknown[]) => ({ kind: "and", conditions }), eq: (column: unknown, value: unknown) => ({ kind: "eq", column, value }), desc: (column: unknown) => ({ kind: "desc", column }), inArray: (column: unknown, value: unknown) => ({ kind: "inArray", column, value }) };
});

import { mediaRouter } from "./media";

const user = { id: 31, openId: "staff-user", email: "staff@example.com", name: "Staff", loginMethod: "local", role: "user" as const, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() };
const input = { organizationId: "organization_001", staffProfileId: "staff_profile_00001", imageDataUrl: "data:image/png;base64,AAAA", altTextKa: "ლელა ბერიძის პროფესიული პორტრეტი" };

function avatarDb(rows: unknown[]) {
  const updateWhere = vi.fn(async () => undefined);
  const updateSet = vi.fn(() => ({ where: updateWhere }));
  const chain = { from: () => chain, innerJoin: () => chain, where: () => ({ limit: vi.fn(async () => rows) }) };
  return { select: vi.fn(() => chain), update: vi.fn(() => ({ set: updateSet })), updateSet, updateWhere };
}

describe("media.updateSelfAvatar", () => {
  beforeEach(() => {
    mocked.requireOrganizationRole.mockReset();
    mocked.storagePut.mockReset();
    mocked.parseImageDataUrl.mockReset();
    mocked.parseImageDataUrl.mockReturnValue({ extension: "png", contentType: "image/png", bytes: Buffer.from("image") });
  });

  it("uploads an avatar only for the calling specialist's own active profile", async () => {
    const db = avatarDb([{ id: input.staffProfileId }]);
    mocked.db = db;
    mocked.requireOrganizationRole.mockResolvedValue({ id: "membership_0001", role: "STAFF" });
    mocked.storagePut.mockResolvedValue({ key: "salons/organization_001/staff/staff_profile_00001/avatar.png", url: "/manus-storage/salons/organization_001/staff/staff_profile_00001/avatar.png" });

    await expect(mediaRouter.createCaller({ user } as never).updateSelfAvatar(input)).resolves.toMatchObject({ key: expect.stringContaining("staff_profile_00001") });
    expect(mocked.requireOrganizationRole).toHaveBeenCalledWith(user, input.organizationId, ["STAFF"]);
    expect(mocked.storagePut).toHaveBeenCalledTimes(1);
    expect(db.updateSet).toHaveBeenCalledWith(expect.objectContaining({ avatarAltKa: input.altTextKa }));
  });

  it("rejects a different specialist profile before parsing or uploading image data", async () => {
    const db = avatarDb([]);
    mocked.db = db;
    mocked.requireOrganizationRole.mockResolvedValue({ id: "membership_0001", role: "STAFF" });

    await expect(mediaRouter.createCaller({ user } as never).updateSelfAvatar({ ...input, staffProfileId: "another_staff_profile" })).rejects.toThrow("თქვენ არ შეგიძლიათ ამ სპეციალისტის ავატარის შეცვლა.");
    expect(mocked.parseImageDataUrl).not.toHaveBeenCalled();
    expect(mocked.storagePut).not.toHaveBeenCalled();
    expect(db.update).not.toHaveBeenCalled();
  });
});
