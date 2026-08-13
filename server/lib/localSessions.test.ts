import { describe, expect, it } from "vitest";
import { createLocalSessionToken, readLocalSessionOpenId } from "./localSessions";

describe("local session parser", () => {
  it("accepts a signed local account cookie", async () => {
    const token = await createLocalSessionToken("local_session_test_00001", "თამარი");
    const openId = await readLocalSessionOpenId({ headers: { cookie: `app_session_id=${token}` } } as never);
    expect(openId).toBe("local_session_test_00001");
  });

  it("rejects a signed non-local subject and absent cookies", async () => {
    const token = await createLocalSessionToken("remote_oauth_user_00001", "Remote");
    await expect(readLocalSessionOpenId({ headers: { cookie: `app_session_id=${token}` } } as never)).resolves.toBeNull();
    await expect(readLocalSessionOpenId({ headers: {} } as never)).resolves.toBeNull();
  });
});
