import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

vi.mock("@/lib/trpc", () => ({ trpc: { useUtils: () => ({ productivity: { listSavedViews: { invalidate: vi.fn() } } }), productivity: { listSavedViews: { useQuery: () => ({ data: [], isLoading: false }) }, saveSavedView: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) }, deleteSavedView: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) } } } }));
vi.mock("@/components/ui/popover", () => ({ Popover: ({ children }: { children: React.ReactNode }) => <div>{children}</div>, PopoverTrigger: ({ children }: { children: React.ReactNode }) => <>{children}</>, PopoverContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div> }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn(), message: vi.fn() } }));

import { SavedViewMenu } from "./SavedViewMenu";

describe("SavedViewMenu", () => {
  it("renders user-owned view controls without raw client data", () => {
    const markup = renderToStaticMarkup(<SavedViewMenu organizationId="org_1" route="/app/calendar" filterPayload={{ view: "week", locationId: "loc_1" }} onApply={() => undefined} />);
    expect(markup).toContain("შენახული ხედები");
    expect(markup).toContain("მიმდინარე ხედის შენახვა");
    expect(markup).not.toContain("კლიენტის ნომერი");
  });
});
