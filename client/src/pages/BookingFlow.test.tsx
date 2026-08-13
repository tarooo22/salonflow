import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { formatGel, getEligibleTeam, LocationContext } from "./BookingFlow";

describe("public booking conversion helpers", () => {
  it("limits specialist choices to the selected service", () => {
    const team = [
      { id: "staff-1", name: "ანა", specialty: null, bio: null, eligibleServiceIds: ["service-a"] },
      { id: "staff-2", name: "ნინო", specialty: null, bio: null, eligibleServiceIds: ["service-b"] },
    ];
    expect(getEligibleTeam(team, "service-a").map(member => member.id)).toEqual(["staff-1"]);
  });

  it("formats service price from integer tetri for the decision card", () => {
    expect(formatGel(4050)).toBe("40.50 ₾");
  });

  it("renders genuine public contact and clearly labelled specialist availability hours", () => {
    const markup = renderToStaticMarkup(<LocationContext location={{ name: "სილამაზის სივრცე", timezone: "Asia/Tbilisi", address: "ვაკე", phone: "+995555000000", email: "hello@example.com", publicDescription: "მზრუნველი მომსახურება", workingHours: [{ weekday: 0, startLocalTime: "09:00", endLocalTime: "18:00" }] }} />);
    expect(markup).toContain("მზრუნველი მომსახურება");
    expect(markup).toContain("ხელმისაწვდომი სპეციალისტების საათები");
    expect(markup).toContain("ორშაბათი · 09:00–18:00");
    expect(markup).toContain("+995555000000");
    expect(markup).toContain("hello@example.com");
  });

  it("does not imply location opening hours when no active specialist rule exists", () => {
    const markup = renderToStaticMarkup(<LocationContext location={{ name: "სივრცე", timezone: "Asia/Tbilisi", address: null, phone: null, email: null, publicDescription: null, workingHours: [] }} />);
    expect(markup).toContain("სამუშაო საათები ჯერ არ არის მითითებული");
  });
});
