// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";
import { BookingHistoryState, ReportsActionControls } from "./Reports";

describe("protected reports controls", () => {
  it("withholds finance-management actions from a member without finance permission while retaining the report export action", () => {
    render(<ReportsActionControls canManageFinance={false} hasOrganization csvExporting={false} onOpenCommission={vi.fn()} onOpenExpense={vi.fn()} onDownload={vi.fn()} />);

    expect(screen.queryByRole("button", { name: /კომისიის დარიცხვა/i })).toBeNull();
    expect(screen.queryByRole("button", { name: /ხარჯის დამატება/i })).toBeNull();
    expect(screen.getByRole("button", { name: /CSV ექსპორტი/i }).hasAttribute("disabled")).toBe(false);
  });

  it("shows finance-management actions to an authorized owner or manager", () => {
    render(<ReportsActionControls canManageFinance hasOrganization csvExporting={false} onOpenCommission={vi.fn()} onOpenExpense={vi.fn()} onDownload={vi.fn()} />);

    expect(screen.getByRole("button", { name: /კომისიის დარიცხვა/i })).toBeTruthy();
    expect(screen.getByRole("button", { name: /ხარჯის დამატება/i })).toBeTruthy();
  });

  it("renders accessible protected-history error and empty states", () => {
    const { rerender } = render(<BookingHistoryState isLoading={false} isError itemCount={0} />);
    expect(screen.getByRole("alert")).toBeTruthy();
    expect(screen.getByText(/ჯავშნების ისტორია დროებით მიუწვდომელია/i)).toBeTruthy();

    rerender(<BookingHistoryState isLoading={false} isError={false} itemCount={0} />);
    expect(screen.getByText(/ამ პერიოდში ჯავშანი ჯერ არ არის/i)).toBeTruthy();
  });
});
