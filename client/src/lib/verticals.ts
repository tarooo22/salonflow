export type Vertical = "beauty" | "aesthetics" | "dental";

export const VERTICALS: ReadonlyArray<{ id: Vertical; label: string; bg: string; ink: string }> = [
  { id: "beauty", label: "სილამაზე", bg: "var(--cw-beauty)", ink: "var(--cw-beauty-ink)" },
  { id: "aesthetics", label: "ესთეტიკა", bg: "var(--cw-aesthetics)", ink: "var(--cw-aesthetics-ink)" },
  { id: "dental", label: "სტომატოლოგია", bg: "var(--cw-dental)", ink: "var(--cw-dental-ink)" },
];

const AESTHETICS_SLUGS = new Set(["cosmetology"]);

// Marketplace categories are a flat list in the DB; the vertical is derived from the slug.
// Dental categories are expected to use a "dental" prefix once they are added.
export function verticalForCategory(slug: string): Vertical {
  if (slug.startsWith("dental")) return "dental";
  if (AESTHETICS_SLUGS.has(slug) || slug.startsWith("aesthetic")) return "aesthetics";
  return "beauty";
}

export function verticalsForListing(categories: ReadonlyArray<{ slug: string }>): Vertical[] {
  return Array.from(new Set(categories.map(category => verticalForCategory(category.slug))));
}

export function verticalStyle(id: Vertical) {
  return VERTICALS.find(vertical => vertical.id === id)!;
}
