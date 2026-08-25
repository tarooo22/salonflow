import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

vi.mock("@/lib/trpc", () => ({ trpc: { useUtils: () => ({ productivity: { preferences: { invalidate: vi.fn() } } }), productivity: { savePreferences: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) } } } }));
vi.mock("@/components/ui/popover", () => ({ Popover: ({ children }: { children: React.ReactNode }) => <div>{children}</div>, PopoverTrigger: ({ children }: { children: React.ReactNode }) => <>{children}</>, PopoverContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div> }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn(), message: vi.fn() } }));

import { MetricPreferenceMenu } from "./MetricPreferenceMenu";

describe("MetricPreferenceMenu", () => {
  it("offers only the provided role-safe metric choices", () => {
    const markup = renderToStaticMarkup(<MetricPreferenceMenu organizationId="org_1" allowedKeys={["BOOKINGS", "PENDING", "OUTSTANDING"]} selectedKeys={["BOOKINGS", "PENDING"]} />);
    expect(markup).toContain("დღის ჯავშნები");
    expect(markup).toContain("მომლოდინე");
    expect(markup).not.toContain("შემდეგი ვიზიტი");
  });
});
