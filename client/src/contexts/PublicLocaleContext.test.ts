import { describe, expect, it } from "vitest";
import { publicWeekdayShort } from "./PublicLocaleContext";

describe("public locale helpers", () => {
  it("maps public booking weekdays for Georgian, English, and Russian", () => {
    expect(publicWeekdayShort(0, "ka")).toBe("ორშ");
    expect(publicWeekdayShort(0, "en")).toBe("Mon");
    expect(publicWeekdayShort(0, "ru")).toBe("Пн");
  });
});
