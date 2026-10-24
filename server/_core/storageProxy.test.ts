import { describe, expect, it } from "vitest";
import { publicMediaKey } from "./storageProxy";

describe("public media proxy keys", () => {
  it("serves catalogue media, including product photos", () => {
    expect(publicMediaKey.test("salons/org/locations/loc/cover.webp")).toBe(true);
    expect(publicMediaKey.test("salons/org/products/prod/a1B2_c-D.png")).toBe(true);
  });

  it("keeps client visit photos private", () => {
    expect(publicMediaKey.test("salons/org/clients/c/visits/a/set-before.jpg")).toBe(false);
    expect(publicMediaKey.test("salons/org/products/prod/../clients/x.jpg")).toBe(false);
  });
});
