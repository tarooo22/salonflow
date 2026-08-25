import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

vi.mock("@/lib/trpc", () => ({ trpc: { clients: { list: { useQuery: () => ({ data: { items: [] }, isLoading: false }) } } } }));
vi.mock("wouter", () => ({ useLocation: () => ["/app/today", vi.fn()] }));
vi.mock("@/components/ui/command", () => ({ CommandDialog: ({ children }: { children: React.ReactNode }) => <div>{children}</div>, CommandInput: () => <input aria-label="სწრაფი ძიება" />, CommandList: ({ children }: { children: React.ReactNode }) => <div>{children}</div>, CommandEmpty: ({ children }: { children: React.ReactNode }) => <div>{children}</div>, CommandGroup: ({ children }: { children: React.ReactNode }) => <div>{children}</div>, CommandItem: ({ children }: { children: React.ReactNode }) => <button>{children}</button>, CommandSeparator: () => <hr />, CommandShortcut: ({ children }: { children: React.ReactNode }) => <span>{children}</span> }));

import { CommandPalette } from "./CommandPalette";

describe("CommandPalette", () => {
  it("only renders route choices available to the current role and keeps a restricted workspace on Today", () => {
    const staff = renderToStaticMarkup(<CommandPalette open onOpenChange={() => undefined} organizationId="org_1" role="STAFF" restricted={false} />);
    const restrictedOwner = renderToStaticMarkup(<CommandPalette open onOpenChange={() => undefined} organizationId="org_1" role="OWNER" restricted />);
    expect(staff).toContain("კალენდარი");
    expect(staff).not.toContain("ანგარიშები");
    expect(restrictedOwner).toContain("დღეს");
    expect(restrictedOwner).not.toContain("კლიენტები");
  });
});
