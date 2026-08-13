// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";
import {
  BookingConfirmation,
  getEligibleTeam,
  StaffStep,
  TimeStep,
  type BookingTeamMember,
} from "./BookingFlow";

const team: BookingTeamMember[] = [
  { id: "staff-eligible", name: "ნინო მაისურაძე", specialty: "კოლორისტი", bio: null, eligibleServiceIds: ["service-color"] },
  { id: "staff-ineligible", name: "ანა ქავთარაძე", specialty: "მანიკიური", bio: null, eligibleServiceIds: ["service-nails"] },
];

describe("public booking interface", () => {
  it("filters the specialist list to members eligible for the selected service", () => {
    const eligibleTeam = getEligibleTeam(team, "service-color");
    const onSelect = vi.fn();
    render(<StaffStep team={eligibleTeam} onSelect={onSelect} />);

    expect(screen.getByRole("button", { name: /ნინო მაისურაძე/i })).toBeTruthy();
    expect(screen.queryByRole("button", { name: /ანა ქავთარაძე/i })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: /ნინო მაისურაძე/i }));
    expect(onSelect).toHaveBeenCalledWith("staff-eligible");
  });

  it("renders clear Georgian guidance when the selected service has no eligible specialist", () => {
    render(<StaffStep team={[]} onSelect={vi.fn()} />);

    expect(screen.getByText(/აქტიური ონლაინ სპეციალისტი ჯერ არ არის/i)).toBeTruthy();
  });

  it("shows the availability gate when the chosen appointment time is unavailable", () => {
    render(<TimeStep dateTime="2026-08-20T10:00" onChange={vi.fn()} availability={{ isLoading: false, isError: false, data: { available: false } }} />);

    expect(screen.getByText(/ეს დრო აღარ არის ხელმისაწვდომი/i)).toBeTruthy();
  });

  it("renders the successful booking confirmation with an accessible confirmation token", () => {
    render(<BookingConfirmation confirmationToken="confirm_opaque_123" />);

    expect(screen.getByText(/თქვენი მოთხოვნა მიღებულია/i)).toBeTruthy();
    expect(screen.getByLabelText("ჯავშნის დადასტურების კოდი").textContent).toBe("confirm_opaque_123");
    expect(screen.getByRole("link", { name: /ფილიალების სიაში დაბრუნება/i }).getAttribute("href")).toBe("/book");
  });
});
