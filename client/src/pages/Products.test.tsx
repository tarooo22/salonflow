import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const page = readFileSync(new URL("./Products.tsx", import.meta.url), "utf8");
const commerce = readFileSync(new URL("../components/catalog/Commerce.tsx", import.meta.url), "utf8");
const app = readFileSync(new URL("../App.tsx", import.meta.url), "utf8");

describe("products page", () => {
  it("queries the public list with vertical and area, in the catalog world", () => {
    expect(page).toContain('<div className="cw min-h-screen">');
    expect(page).toContain("trpc.products.publicList.useQuery");
    expect(page).toContain("vertical: vertical ?? undefined, area: area || undefined");
    expect(page).toContain("BRAND.name");
  });

  it("says purchase happens at the business and shows stock honestly", () => {
    expect(page).toContain("უშუალოდ ბიზნესში");
    expect(commerce).toContain("მარაგშია");
    expect(commerce).toContain("ამოიწურა");
    expect(commerce).toContain("formatGelTetri(item.priceTetri)");
    expect(page).toContain("ამჟამად პროდუქტები არ არის დამატებული.");
  });

  it("registers the public routes", () => {
    for (const route of ['"/vacancies"', '"/vacancies/:id"', '"/products"']) expect(app).toContain(route);
  });
});
