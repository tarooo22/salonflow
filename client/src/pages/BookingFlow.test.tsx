import { readFileSync } from "node:fs";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { BookingConfirmation, formatGel, getBookingValidationIssue, getEligibleTeam, isNetworkError, isSlotTakenError, LocationContext, parseRequestedServiceIds, StaffStep } from "./BookingFlow";
import { BookingChoiceCard, BookingSlotGroup } from "@/components/public/BookingPrimitives";

vi.mock("wouter", () => ({ Link: ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a> }));

describe("public booking conversion helpers", () => {
  it("limits specialist choices to the selected service", () => {
    const team = [
      { id: "staff-1", name: "ანა", specialty: null, bio: null, eligibleServiceIds: ["service-a"] },
      { id: "staff-2", name: "ნინო", specialty: null, bio: null, eligibleServiceIds: ["service-b"] },
    ];
    expect(getEligibleTeam(team, "service-a").map(member => member.id)).toEqual(["staff-1"]);
  });

  it("keeps only specialists eligible for every selected service in a multi-service booking", () => {
    const team = [
      { id: "staff-1", name: "ანა", specialty: null, bio: null, eligibleServiceIds: ["service-a", "service-b"] },
      { id: "staff-2", name: "ნინო", specialty: null, bio: null, eligibleServiceIds: ["service-a"] },
    ];
    expect(getEligibleTeam(team, ["service-a", "service-b"]).map(member => member.id)).toEqual(["staff-1"]);
  });

  it("formats service price from integer tetri for the decision card", () => {
    expect(formatGel(4050)).toContain("40,50");
    expect(formatGel(4050)).toContain("₾");
  });

  it("renders genuine public contact and clearly labelled specialist availability hours", () => {
    const markup = renderToStaticMarkup(<LocationContext location={{ name: "სილამაზის სივრცე", timezone: "Asia/Tbilisi", address: "ვაკე", phone: "+995555000000", email: "hello@example.com", publicDescription: "მზრუნველი მომსახურება", workingHours: [{ weekday: 0, startLocalTime: "09:00", endLocalTime: "18:00" }] }} />);
    expect(markup).toContain("მზრუნველი მომსახურება");
    expect(markup).toContain("ხელმისაწვდომი სპეციალისტების საათები");
    expect(markup).toContain("ორშაბათი");
    expect(markup).toContain("09:00–18:00");
    expect(markup).toContain("+995555000000");
    expect(markup).toContain("hello@example.com");
  });

  it("does not imply location opening hours when no active specialist rule exists", () => {
    const markup = renderToStaticMarkup(<LocationContext location={{ name: "სივრცე", timezone: "Asia/Tbilisi", address: null, phone: null, email: null, publicDescription: null, workingHours: [] }} />);
    expect(markup).toContain("სამუშაო საათები ჯერ არ არის მითითებული");
  });

  it("renders a clearly labelled any-available specialist choice alongside eligible staff", () => {
    const markup = renderToStaticMarkup(<StaffStep team={[{ id: "staff-1", name: "ანა", specialty: "სტილისტი", bio: null, eligibleServiceIds: ["service-a"] }]} selectedId={undefined} onSelect={() => undefined} />);
    expect(markup).toContain("ნებისმიერი თავისუფალი სპეციალისტი");
    expect(markup).toContain("რეალურად თავისუფალ სპეციალისტს");
    expect(markup).toContain("ანა");
  });

  it("keeps booking choice and slot analytics markers aggregate-only", () => {
    const choice = renderToStaticMarkup(<BookingChoiceCard selected={false} label="ტესტ სერვისი" conversionEvent="BOOKING_SERVICE_SELECTED" onSelect={() => undefined}>სერვისი</BookingChoiceCard>);
    const slots = renderToStaticMarkup(<BookingSlotGroup title="დილა" conversionEvent="BOOKING_TIME_SELECTED" selectedStartsAt="" onSelect={() => undefined} slots={[{ startsAt: "2026-08-20T09:00:00.000Z", label: "09:00" }]} />);
    expect(choice).toContain('data-conversion-event="BOOKING_SERVICE_SELECTED"');
    expect(slots).toContain('data-conversion-event="BOOKING_TIME_SELECTED"');
    expect(choice).not.toContain("phone");
    expect(slots).not.toContain("bookingToken");
  });

  it("shows the server-resolved specialist and calendar action in the final confirmation", () => {
    const markup = renderToStaticMarkup(<BookingConfirmation confirmationToken="safe-confirmation" assignedStaffName="ნინო" serviceName="თმის შეჭრა" startsAt={new Date("2026-08-20T08:30:00.000Z")} endsAt={new Date("2026-08-20T09:15:00.000Z")} locationName="ვაკე" />);
    expect(markup).toContain("შენი სპეციალისტი:");
    expect(markup).toContain("ნინო");
    expect(markup).toContain("კალენდარში დამატება");
    expect(markup).toContain("ჩაწერილია");
    expect(markup).toContain("/manage-booking/safe-confirmation");
    expect(markup).toContain("ელოდება სალონის დადასტურებას");
  });

  it("gives a focused, non-technical recovery message when a booking step is incomplete", () => {
    const timeIssue = getBookingValidationIssue({ step: 2, serviceId: "service-a", staffProfileId: "staff-1", startsAt: null, firstName: "", phone: "", termsAccepted: false });
    const contactIssue = getBookingValidationIssue({ step: 3, serviceId: "service-a", staffProfileId: "staff-1", startsAt: new Date("2026-08-16T10:00:00Z"), available: true, firstName: "ანა", phone: "", termsAccepted: false });
    expect(timeIssue).toMatchObject({ kind: "time", title: "დაამატე სასურველი თარიღი და დრო" });
    expect(contactIssue).toMatchObject({ kind: "contact", title: "მიუთითე მობილურის ნომერი" });
    expect(contactIssue?.description).not.toContain("tRPC");
  });

  it("tells a taken slot from a lost connection using what the commit mutation actually returns", () => {
    expect(isSlotTakenError({ message: "ეს დრო ახლახან დაიკავეს. აირჩიეთ სხვა თავისუფალი დრო." })).toBe(true);
    expect(isSlotTakenError({ message: "The selected time is no longer available" })).toBe(true);
    expect(isSlotTakenError({ message: "მიუთითეთ სწორი ქართული მობილურის ნომერი." })).toBe(false);
    expect(isNetworkError({ data: undefined })).toBe(true);
    expect(isNetworkError({ data: { code: "INTERNAL_SERVER_ERROR" } })).toBe(false);
  });

  it("offers the sticky choice strip, 4-column slot grid and a retry on network errors without uppercase or mono type", () => {
    const flow = readFileSync(new URL("./BookingFlow.tsx", import.meta.url), "utf8");
    const css = readFileSync(new URL("../components/catalog/booking.css", import.meta.url), "utf8");
    expect(flow).toContain("<BookingChoiceStrip");
    expect(flow).toContain("addDeviceBooking");
    expect(flow).not.toMatch(/token.*addDeviceBooking|addDeviceBooking\(\{[^}]*(token|confirmation)/i);
    expect(css).toContain("repeat(4, minmax(0, 1fr))");
    expect(css).toContain("repeat(6, minmax(0, 1fr))");
    expect(css).not.toMatch(/uppercase|Martian|--cw-mono/i);
  });

  it("reads comma-separated preselected service ids from ?services= and drops blanks and duplicates", () => {
    expect(parseRequestedServiceIds("?services=a,b,,a")).toEqual(["a", "b"]);
    expect(parseRequestedServiceIds("")).toEqual([]);
  });
});
