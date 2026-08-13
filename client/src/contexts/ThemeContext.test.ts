import { describe, expect, it } from "vitest";
import { resolveTheme } from "./ThemeContext";

describe("SalonFlow theme preference resolution", () => {
  it("uses an explicit light or dark preference without consulting system appearance", () => {
    expect(resolveTheme("light", true)).toBe("light");
    expect(resolveTheme("dark", false)).toBe("dark");
  });

  it("maps the system preference to the currently resolved light or dark theme", () => {
    expect(resolveTheme("system", false)).toBe("light");
    expect(resolveTheme("system", true)).toBe("dark");
  });
});
