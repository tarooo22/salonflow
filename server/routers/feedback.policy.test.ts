import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("./feedback.ts", import.meta.url), "utf8");

describe("feedback moderation policy", () => {
  it("keeps review publication scoped to completed-review pending state and reserves final removals for platform admin", () => {
    expect(source).toContain('eq(customerFeedback.status, "PENDING")');
    expect(source).toContain("requestPlatformReview");
    expect(source).toContain("requirePlatformAdmin(ctx.user.role)");
    expect(source).toContain("PLATFORM_DECIDED_");
    expect(source).toContain("platformAudit");
    expect(source).toContain("platformRestore");
    expect(source).toContain('eq(customerFeedback.status, "HIDDEN")');
    expect(source).toContain("PLATFORM_RESTORED_APPROVED");
    expect(source).not.toContain("moderate:");
  });
});
