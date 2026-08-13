import { renderToStaticMarkup } from "react-dom/server";
import React from "react";
import { describe, expect, it, vi } from "vitest";
import { AppointmentQuickAction } from "./AppointmentQuickAction";

describe("AppointmentQuickAction rendered visibility", () => {
  it("renders a keyboard button only for permitted roles and active appointment statuses", () => {
    const allowed = renderToStaticMarkup(<AppointmentQuickAction role="RECEPTIONIST" status="PENDING" cardHeight={80} context="calendar" onAction={vi.fn()} />);
    const today = renderToStaticMarkup(<AppointmentQuickAction role="MANAGER" status="IN_SERVICE" cardHeight={80} context="today" onAction={vi.fn()} />);
    const staff = renderToStaticMarkup(<AppointmentQuickAction role="STAFF" status="PENDING" cardHeight={80} onAction={vi.fn()} />);
    const completed = renderToStaticMarkup(<AppointmentQuickAction role="OWNER" status="COMPLETED" cardHeight={80} onAction={vi.fn()} />);

    expect(allowed).toContain("<button");
    expect(allowed).toContain("დადასტურება");
    expect(allowed).toContain('data-appointment-action-context="calendar"');
    expect(today).toContain("დასრულება");
    expect(today).toContain('data-appointment-action-context="today"');
    expect(staff).toBe("");
    expect(completed).toBe("");
  });
});
