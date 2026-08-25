import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("./productivity.ts", import.meta.url), "utf8");

describe("productivity router boundaries", () => {
  it("keeps preferences user-scoped and day-close role/location scoped", () => {
    expect(source).toContain("dashboardUserPreferences.userId, ctx.user.id");
    expect(source).toContain("requireOrganizationRole(ctx.user, input.organizationId, [...closeRoles])");
    expect(source).toContain("requireLocationInOrganization(input.organizationId, input.locationId)");
    expect(source).toContain("dismissedNotificationKeys");
    expect(source).toContain("businessDate");
    expect(source).toContain("savedViewPayload");
    expect(source).toContain("workspaceSavedViews.userId, ctx.user.id");
    expect(source).toContain("/app/calendar");
  });
});
