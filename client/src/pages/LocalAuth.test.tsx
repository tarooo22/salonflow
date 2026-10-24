import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(new URL("./LocalAuth.tsx", import.meta.url), "utf8");

describe("local auth card on the catalog desk", () => {
  it("retains local credential boundaries while using the cw presentation", () => {
    expect(source).toContain("ადგილობრივი ელფოსტა და პაროლი");
    expect(source).toContain("mkt-auth-card");
    expect(source).toContain("mkt-field");
    expect(source).toContain("mkt-btn-primary");
    expect(source).not.toContain("Manus OAuth");
    expect(source).not.toContain("sf-");
  });

  it("keeps labelled, autocompleting inputs and a named password toggle", () => {
    for (const id of ["auth-name", "recovery-code", "auth-email", "auth-password"]) expect(source).toContain(`htmlFor="${id}"`);
    expect(source).toContain('autoComplete="email"');
    expect(source).toContain('autoComplete="one-time-code"');
    expect(source).toContain('"პაროლის დამალვა"');
    expect(source).toContain('"პაროლის ჩვენება"');
    expect(source).toContain('role="alert"');
  });

  it("keeps validation: passwords of at least 10 characters for register and claim", () => {
    expect(source).toContain("password.length < 10");
    expect(source).toContain("პაროლი მინიმუმ 10 სიმბოლოს უნდა შეიცავდეს.");
    expect(source).toContain("minLength={isRegister || isClaim ? 10 : 1}");
    expect(source).toContain("register.mutate({ name, email, password })");
    expect(source).toContain("claimLegacyLocal.mutate({ recoveryCode, email, password })");
    expect(source).toContain("login.mutate({ email, password })");
  });

  it("routes platform admins away from trial onboarding while preserving the default trial destination", () => {
    expect(source).toContain('user.role === "admin"');
    expect(source).toContain('destination === "/app/trial-status"');
    expect(source).toContain('"/app/trial-admin"');
    expect(source).toContain("const returnTo = useMemo(getReturnTo, []);");
    expect(source).toContain('finish(user, "/app/trial-request")');
    expect(source).toContain('raw.startsWith("/app/")');
  });

  it("uses the brand constant and keeps auth pages out of search indexes", () => {
    expect(source).toContain("BRAND.name");
    expect(source).not.toContain("SalonFlow");
    expect(source).toContain('robots: "noindex,nofollow"');
  });
});
