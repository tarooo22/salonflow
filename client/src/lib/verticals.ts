export type Vertical = "beauty" | "aesthetics" | "dental";

type VerticalLocale = "ka" | "en" | "ru";

// `label` is the Georgian name kept for existing callers; use verticalLabel() for the visitor's language.
export const VERTICALS: ReadonlyArray<{ id: Vertical; label: string; labels: Record<VerticalLocale, string>; bg: string; ink: string }> = [
  { id: "beauty", label: "სილამაზე", labels: { ka: "სილამაზე", en: "Beauty", ru: "Красота" }, bg: "var(--cw-beauty)", ink: "var(--cw-beauty-ink)" },
  { id: "aesthetics", label: "ესთეტიკა", labels: { ka: "ესთეტიკა", en: "Aesthetics", ru: "Эстетика" }, bg: "var(--cw-aesthetics)", ink: "var(--cw-aesthetics-ink)" },
  { id: "dental", label: "სტომატოლოგია", labels: { ka: "სტომატოლოგია", en: "Dental", ru: "Стоматология" }, bg: "var(--cw-dental)", ink: "var(--cw-dental-ink)" },
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

export function verticalLabel(id: Vertical, locale: VerticalLocale) {
  return verticalStyle(id).labels[locale];
}
