/**
 * Copy and URL for the public category landing pages (/salons/c/:slug).
 * Shared so the server-rendered <title>/<meta> and the React page always say the same thing.
 */

export type LandingKind = "beauty" | "aesthetics" | "dental";

// Same rule as client/src/lib/verticals.ts (the vertical is derived from the slug).
export function landingKind(slug: string): LandingKind {
  if (slug.startsWith("dental")) return "dental";
  if (slug === "cosmetology" || slug.startsWith("aesthetic")) return "aesthetics";
  return "beauty";
}

export function categoryLandingPath(slug: string) {
  return `/salons/c/${slug}`;
}

const NOUN: Record<LandingKind, string> = {
  beauty: "სალონები",
  aesthetics: "ესთეტიკის ცენტრები",
  dental: "სტომატოლოგიური კლინიკები",
};

const PLACE: Record<LandingKind, string> = {
  beauty: "სალონი",
  aesthetics: "ესთეტიკის ცენტრი",
  dental: "კლინიკა",
};

export function categoryLandingHeading(slug: string, nameKa: string) {
  return `${nameKa} — ${NOUN[landingKind(slug)]} და ონლაინ ჩაწერა`;
}

export function categoryLandingLede(slug: string, nameKa: string) {
  return `იპოვე გადამოწმებული ${PLACE[landingKind(slug)]} კატეგორიაში „${nameKa}“: ნახე სერვისები და ფასები, აირჩიე სპეციალისტი და ჩაეწერე ონლაინ თავისუფალ დროზე.`;
}
