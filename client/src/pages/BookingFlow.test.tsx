import { readFileSync } from "node:fs";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { BookingConfirmation, bookingMoment, formatGel, getBookingValidationIssue, getEligibleTeam, isNetworkError, isSlotTakenError, LocationContext, parseRequestedServiceIds, StaffStep, stepFromSearch } from "./BookingFlow";
import { BookingBar, BookingChoiceCard, BookingDateStrip, BookingSlotGroup } from "@/components/public/BookingPrimitives";

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
    expect(markup).toContain("სისტემა თავისუფალ სპეციალისტს თავად შეარჩევს.");
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

  it("shows the sent-booking moment: ringed time, specialist, calendar, map and share actions, what happens next and a private link card instead of the raw token", () => {
    const markup = renderToStaticMarkup(<BookingConfirmation slug="visage" confirmationToken="safe-confirmation" assignedStaffName="ნინო" serviceName="თმის შეჭრა" startsAt={new Date("2026-08-20T07:30:00.000Z")} endsAt={new Date("2026-08-20T08:15:00.000Z")} locationName="ვაკე" locationAddress="ჭავჭავაძის 1" timeZone="Asia/Tbilisi" cancellationCutoffMinutes={720} />);
    expect(markup).toContain("ჯავშანი გაიგზავნა");
    expect(markup).toContain("ახლა ჯავშანს დადასტურება სჭირდება.");
    expect(markup).toContain("20 აგვისტო");
    expect(markup).toContain("11:30–12:15");
    expect(markup).toContain('data-ring="wide"');
    expect(markup).toContain("შენი სპეციალისტი:");
    expect(markup).toContain("ნინო");
    expect(markup).toContain("კალენდარში დამატება");
    expect(markup).toContain("რუკაზე ნახვა");
    expect(markup).toContain("https://www.google.com/maps/search/?api=1&amp;query=" + encodeURIComponent("ვაკე, ჭავჭავაძის 1"));
    expect(markup).toContain("გაზიარება");
    expect(markup).toContain("რა ხდება შემდეგ");
    expect(markup).toContain("ვაკე ჯავშანს განიხილავს.");
    expect(markup).toContain("შეცვლა ან გაუქმება შეგიძლია ვიზიტამდე 12 საათით ადრე.");
    expect(markup).toContain("ჯავშნის პირადი ბმული");
    expect(markup).toContain("ბმულის კოპირება");
    expect(markup).toContain("/manage-booking/safe-confirmation");
    expect(markup).not.toContain("<code");
    expect(markup).not.toContain(">safe-confirmation<");
  });

  it("leaves the cancellation line out when the cutoff is unknown and hides the map action without an address", () => {
    const markup = renderToStaticMarkup(<BookingConfirmation confirmationToken="t" serviceName="x" startsAt={new Date("2026-08-20T07:30:00.000Z")} endsAt={new Date("2026-08-20T08:15:00.000Z")} locationName="ვაკე" />);
    expect(markup).not.toContain("შეცვლა ან გაუქმება შეგიძლია ვიზიტამდე");
    expect(markup).not.toContain("რუკაზე ნახვა");
  });

  it("gives a focused, non-technical recovery message when a booking step is incomplete", () => {
    const timeIssue = getBookingValidationIssue({ step: 1, serviceId: "service-a", staffProfileId: "staff-1", startsAt: null, firstName: "", phone: "", termsAccepted: false });
    const contactIssue = getBookingValidationIssue({ step: 2, serviceId: "service-a", staffProfileId: "staff-1", startsAt: new Date("2026-08-16T10:00:00Z"), available: true, firstName: "ანა", phone: "", termsAccepted: false });
    expect(timeIssue).toMatchObject({ kind: "time", title: "დაამატე სასურველი თარიღი და დრო" });
    expect(contactIssue).toMatchObject({ kind: "contact", title: "მიუთითე მობილურის ნომერი" });
    expect(contactIssue?.description).not.toContain("tRPC");
  });

  it("validates the three steps: service, then time (with a silent availability check), then contact", () => {
    const base = { serviceId: "s", staffProfileId: "p", startsAt: new Date("2026-08-16T10:00:00Z"), available: true, firstName: "ანა", phone: "555", termsAccepted: true };
    expect(getBookingValidationIssue({ ...base, step: 0, serviceId: undefined })).toMatchObject({ kind: "service" });
    expect(getBookingValidationIssue({ ...base, step: 0 })).toBeNull();
    expect(getBookingValidationIssue({ ...base, step: 1, available: undefined })).toMatchObject({ kind: "time", title: "ეს დრო ჯერ არ დადასტურებულა" });
    expect(getBookingValidationIssue({ ...base, step: 1 })).toBeNull();
    expect(getBookingValidationIssue({ ...base, step: 2, termsAccepted: false })).toMatchObject({ kind: "contact" });
    expect(getBookingValidationIssue({ ...base, step: 2 })).toBeNull();
  });

  it("keeps the wizard step in the URL: ?step= wins, a ?services= link opens on the time step", () => {
    expect(stepFromSearch("")).toBe(0);
    expect(stepFromSearch("?services=a")).toBe(1);
    expect(stepFromSearch("services=a&step=services")).toBe(0);
    expect(stepFromSearch("?services=a&step=time")).toBe(1);
    expect(stepFromSearch("?step=details")).toBe(2);
    expect(stepFromSearch("?step=bogus")).toBe(0);
  });

  it("reads the date and time in the location timezone", () => {
    expect(bookingMoment(new Date("2026-10-29T07:30:00Z"), "Asia/Tbilisi")).toMatchObject({ key: "2026-10-29", day: 29, time: "11:30", weekdayShort: "ხუთ", monthShort: "ოქტ" });
  });

  it("tells a taken slot from a lost connection using what the commit mutation actually returns", () => {
    expect(isSlotTakenError({ message: "ეს დრო ახლახან დაიკავეს. აირჩიეთ სხვა თავისუფალი დრო." })).toBe(true);
    expect(isSlotTakenError({ message: "The selected time is no longer available" })).toBe(true);
    expect(isSlotTakenError({ message: "anything", data: { code: "CONFLICT" } })).toBe(true);
    expect(isSlotTakenError({ message: "anything", data: { code: "BAD_REQUEST" } })).toBe(false);
    expect(isSlotTakenError({ message: "მიუთითეთ სწორი ქართული მობილურის ნომერი." })).toBe(false);
    expect(isNetworkError({ data: undefined })).toBe(true);
    expect(isNetworkError({ data: { code: "INTERNAL_SERVER_ERROR" } })).toBe(false);
  });

  it("keeps the step in the URL, drops the green notice, choice strip and footer, keeps the 4/6-column slot grid, without uppercase or mono type", () => {
    const flow = readFileSync(new URL("./BookingFlow.tsx", import.meta.url), "utf8");
    const css = readFileSync(new URL("../components/catalog/booking.css", import.meta.url), "utf8");
    expect(flow).toContain("state: { cwbFlow: true }");
    expect(flow).not.toContain("<BookingChoiceStrip");
    expect(flow).not.toContain('tone="ok"');
    expect(flow).not.toContain("<CatalogFooter");
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

  it("renders the date picker as a Monday-first week strip: past and closed days disabled, selected day pressed, previous week locked", () => {
    // 2026-10-21 is a Wednesday; the booking window starts today and the Saturday is closed.
    const days = Array.from({ length: 14 }, (_, index) => { const day = new Date(Date.UTC(2026, 9, 21 + index)); return { key: day.toISOString().slice(0, 10), closed: day.getUTCDay() === 6 }; });
    const markup = renderToStaticMarkup(<BookingDateStrip days={days} selected="2026-10-22" todayKey="2026-10-21" onSelect={() => undefined} />);
    expect(markup).toContain("ოქტომბერი 2026");
    expect(markup).toMatch(/aria-label="წინა კვირა" disabled/);
    expect(markup).not.toMatch(/aria-label="შემდეგი კვირა" disabled/);
    expect(markup).toMatch(/disabled=""[^>]*aria-label="ორშაბათი, 19 ოქტომბერი, გასულია"/);
    expect(markup).toMatch(/aria-checked="true"[^>]*aria-label="ხუთშაბათი, 22 ოქტომბერი"/);
    expect(markup).toContain('role="radiogroup"');
    expect(markup).toContain('data-ring="square"');
    expect(markup).toContain("შაბათი, 24 ოქტომბერი, დახურულია");
    expect((markup.match(/class="cwb-day"/g) ?? []).length).toBe(7);
  });

  it("marks closed and full days, and keeps them selectable when asked", () => {
    const days = [{ key: "2026-10-21" }, { key: "2026-10-22", closed: true }, { key: "2026-10-23", full: true }];
    const locked = renderToStaticMarkup(<BookingDateStrip days={days} selected="2026-10-21" todayKey="2026-10-21" onSelect={() => undefined} />);
    expect(locked).toContain("დაკეტ.");
    expect(locked).toContain("სავსეა");
    expect(locked).toMatch(/disabled=""[^>]*aria-label="ხუთშაბათი, 22 ოქტომბერი, დახურულია"/);
    const open = renderToStaticMarkup(<BookingDateStrip days={days} selected="2026-10-21" todayKey="2026-10-21" onSelect={() => undefined} selectableUnavailable />);
    expect(open).not.toMatch(/disabled=""[^>]*aria-label="ხუთშაბათი, 22 ოქტომბერი, დახურულია"/);
    expect(open).toContain("პარასკევი, 23 ოქტომბერი, სავსეა");
  });

  it("rings the selected slot with radio semantics and renders the bar summary as an expandable button", () => {
    const slots = renderToStaticMarkup(<BookingSlotGroup title="დილა" selectedStartsAt="a" onSelect={() => undefined} slots={[{ startsAt: "a", label: "09:00" }, { startsAt: "b", label: "09:30" }]} />);
    expect(slots).toContain('aria-checked="true"');
    expect(slots).toContain('data-state="on"');
    expect(slots).toContain('data-state="off"');
    const bar = renderToStaticMarkup(<BookingBar summary="თმის შეჭრა + მანიკური" detail="ხუთ, 30 ოქტ · 11:30" label="გაგრძელება" blocked={false} summaryOpen={false} onOpenSummary={() => undefined} onClick={() => undefined} />);
    expect(bar).toMatch(/<button[^>]*aria-expanded="false"[^>]*>/);
    expect(bar).toContain("ხუთ, 30 ოქტ · 11:30");
    expect(bar).toContain("გაგრძელება");
  });

  it("marks unavailable slots as disabled", () => {
    const markup = renderToStaticMarkup(<BookingSlotGroup title="დილა" selectedStartsAt="" onSelect={() => undefined} slots={[{ startsAt: "a", label: "09:00" }, { startsAt: "b", label: "09:30", unavailable: true }]} />);
    expect(markup.match(/disabled/g)?.length).toBe(1);
  });
});
