import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ readLocalSessionOpenId: vi.fn(), getUserByOpenId: vi.fn() }));
vi.mock("../db", () => ({ getUserByOpenId: mocks.getUserByOpenId }));
vi.mock("../lib/localSessions", () => ({ readLocalSessionOpenId: mocks.readLocalSessionOpenId }));

import { createContext } from "./context";

describe("local-only request context", () => {
  beforeEach(() => vi.clearAllMocks());

  it("authenticates an active local user from a validated local session subject", async () => {
    const user = { id: 5, openId: "local_context_user_00001", loginMethod: "local", accountStatus: "ACTIVE" };
    mocks.readLocalSessionOpenId.mockResolvedValue(user.openId);
    mocks.getUserByOpenId.mockResolvedValue(user);
    const result = await createContext({ req: { headers: {} }, res: {} } as never);
    expect(result.user).toEqual(user);
  });

  it("never authenticates a legacy-style subject even if a database lookup could return a user", async () => {
    mocks.readLocalSessionOpenId.mockResolvedValue("oauth_legacy_user_00001");
    mocks.getUserByOpenId.mockResolvedValue({ id: 7, openId: "oauth_legacy_user_00001", loginMethod: "local", accountStatus: "ACTIVE" });
    const result = await createContext({ req: { headers: {} }, res: {} } as never);
    expect(result.user).toBeNull();
    expect(mocks.getUserByOpenId).not.toHaveBeenCalled();
  });
});
