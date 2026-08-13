// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { pendingInvitePath } from "@/lib/pendingInvite";

const pendingInviteStorageKey = "salonflow.pendingInviteToken";

afterEach(() => {
  sessionStorage.clear();
});

describe("pendingInvitePath", () => {
  it("returns the exact local invite route only for a valid opaque token", () => {
    const token = "invite_token_0123456789abcdefghijklmnop";
    sessionStorage.setItem(pendingInviteStorageKey, token);

    expect(pendingInvitePath()).toBe(`/invite/${token}`);
  });

  it("does not navigate to a malformed pending invite route", () => {
    sessionStorage.setItem(pendingInviteStorageKey, "not/a/valid/token");

    expect(pendingInvitePath()).toBeNull();
  });
});
