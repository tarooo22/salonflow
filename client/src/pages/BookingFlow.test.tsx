import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { BookingConfirmation, formatGel, getBookingValidationIssue, getEligibleTeam, LocationContext, StaffStep } from "./BookingFlow";
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
    expect(markup).toContain("ორშაბათი · 09:00–18:00");
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
    expect(markup).toContain("თქვენი სპეციალისტი:");
    expect(markup).toContain("ნინო");
    expect(markup).toContain("კალენდარში დამატება");
    expect(markup).toContain("sf-booking-confirmation");
    expect(markup).toContain("/manage-booking/safe-confirmation");
    expect(markup).toContain("ელოდება სალონის დადასტურებას");
  });

  it("gives a focused, non-technical recovery message when a booking step is incomplete", () => {
    const timeIssue = getBookingValidationIssue({ step: 2, serviceId: "service-a", staffProfileId: "staff-1", startsAt: null, firstName: "", phone: "", termsAccepted: false });
    const contactIssue = getBookingValidationIssue({ step: 3, serviceId: "service-a", staffProfileId: "staff-1", startsAt: new Date("2026-08-16T10:00:00Z"), available: true, firstName: "ანა", phone: "", termsAccepted: false });
    expect(timeIssue).toMatchObject({ kind: "time", title: "დაამატეთ სასურველი თარიღი და დრო" });
    expect(contactIssue).toMatchObject({ kind: "contact", title: "მიუთითეთ მობილურის ნომერი" });
    expect(contactIssue?.description).not.toContain("tRPC");
  });
});
