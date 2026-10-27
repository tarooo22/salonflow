import type { Express, Request } from "express";
import { asc, desc, eq, and } from "drizzle-orm";
import { locationMarketplaceProfiles, locations, marketplaceCategories, marketplaceLocationCategories, marketplaceLocationCategoryServices, services } from "../drizzle/schema";
import { BRAND } from "../shared/brand";
import { categoryLandingHeading, categoryLandingLede, categoryLandingPath } from "../shared/categoryLanding";
import { requireDb } from "./db";

const staticPublicPaths = ["/", "/salons", "/salons/map", "/partner", "/features", "/pricing", "/demo", "/faq", "/contact", "/privacy"];

function xmlEscape(value: string) {
  return value.replace(/[<>&'\"]/g, character => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", "\"": "&quot;" })[character] ?? character);
}

export function requestOrigin(req: Request) {
  const configured = process.env.PUBLIC_SITE_URL;
  if (configured && /^https:\/\/[a-z0-9.-]+(?:\:\d+)?$/i.test(configured)) return configured.replace(/\/$/, "");
  const host = req.get("host") ?? "salonflow-production-c542.up.railway.app";
  const safeHost = /^[a-z0-9.-]+(?::\d+)?$/i.test(host) ? host : "salonflow-production-c542.up.railway.app";
  const protocol = safeHost.includes("localhost") || safeHost.startsWith("127.") ? "http" : "https";
  return `${protocol}://${safeHost}`;
}

const escapeHtml = (value: string | null | undefined) => (value ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");

export type SeoCategory = { slug: string; nameKa: string };
export type SeoCategoryListing = { publicSlug: string; name: string; areaLabelKa: string | null };

/** Active marketplace categories: the only slugs that have a landing page (anything else is a 404). */
export async function activeSeoCategories(): Promise<SeoCategory[]> {
  const db = await requireDb();
  return db.select({ slug: marketplaceCategories.slug, nameKa: marketplaceCategories.nameKa }).from(marketplaceCategories)
    .where(eq(marketplaceCategories.isActive, true)).orderBy(asc(marketplaceCategories.sortOrder));
}

/**
 * Slugs of active categories that have at least one approved, bookable listing with an online-bookable service
 * (the same rule the directory uses). Categories without one stay out of the sitemap.
 */
export async function seoCategorySlugsWithListings(): Promise<Set<string>> {
  const db = await requireDb();
  const rows = await db.select({ slug: marketplaceCategories.slug }).from(marketplaceLocationCategoryServices)
    .innerJoin(marketplaceCategories, eq(marketplaceLocationCategoryServices.categoryId, marketplaceCategories.id))
    .innerJoin(marketplaceLocationCategories, and(eq(marketplaceLocationCategories.locationId, marketplaceLocationCategoryServices.locationId), eq(marketplaceLocationCategories.categoryId, marketplaceLocationCategoryServices.categoryId)))
    .innerJoin(services, eq(marketplaceLocationCategoryServices.serviceId, services.id))
    .innerJoin(locations, eq(marketplaceLocationCategoryServices.locationId, locations.id))
    .innerJoin(locationMarketplaceProfiles, eq(locationMarketplaceProfiles.locationId, locations.id))
    .where(and(eq(marketplaceCategories.isActive, true), eq(services.status, "ACTIVE"), eq(services.onlineBookingEnabled, true), eq(locations.status, "ACTIVE"), eq(locations.bookingEnabled, true), eq(locationMarketplaceProfiles.status, "APPROVED")));
  return new Set(rows.map(row => row.slug));
}

/** Head tags for /salons/c/:slug: title, description, robots, canonical, og/twitter and a BreadcrumbList. `noindex` is for categories with no listings. */
export function renderCategoryLandingHead(category: SeoCategory, origin: string, options: { noindex?: boolean } = {}) {
  const title = `${categoryLandingHeading(category.slug, category.nameKa)} | ${BRAND.name}`;
  const description = categoryLandingLede(category.slug, category.nameKa);
  const canonical = `${origin}${categoryLandingPath(category.slug)}`;
  const breadcrumbs = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: BRAND.name, item: `${origin}/` },
      { "@type": "ListItem", position: 2, name: "კატალოგი", item: `${origin}/salons` },
      { "@type": "ListItem", position: 3, name: category.nameKa, item: canonical },
    ],
  };
  return [
    `<title>${escapeHtml(title)}</title>`,
    `<meta name="description" content="${escapeHtml(description)}" />`,
    `<meta name="robots" content="${options.noindex ? "noindex,follow" : "index,follow"}" />`,
    `<link rel="canonical" href="${escapeHtml(canonical)}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:locale" content="ka_GE" />`,
    `<meta property="og:title" content="${escapeHtml(title)}" />`,
    `<meta property="og:description" content="${escapeHtml(description)}" />`,
    `<meta property="og:url" content="${escapeHtml(canonical)}" />`,
    `<meta property="og:site_name" content="${escapeHtml(BRAND.name)}" />`,
    `<meta name="twitter:card" content="summary" />`,
    `<meta name="twitter:title" content="${escapeHtml(title)}" />`,
    `<meta name="twitter:description" content="${escapeHtml(description)}" />`,
    `<script type="application/ld+json">${JSON.stringify(breadcrumbs).replace(/</g, "\\u003c")}</script>`,
  ].join("\n");
}

/** Crawler-visible body for the category page (the React app replaces it on load). */
export function renderCategoryLandingSnapshot(category: SeoCategory, listings: SeoCategoryListing[]) {
  const items = listings.map(item => `<li><a href="/salon/${encodeURIComponent(item.publicSlug)}">${escapeHtml(item.name)}</a>${item.areaLabelKa ? ` — ${escapeHtml(item.areaLabelKa)}` : ""}</li>`).join("");
  return `<main class="sf-public-page"><h1>${escapeHtml(categoryLandingHeading(category.slug, category.nameKa))}</h1><p>${escapeHtml(categoryLandingLede(category.slug, category.nameKa))}</p>${items ? `<ul>${items}</ul>` : ""}<p><a href="/salons">ყველა ადგილი</a></p></main>`;
}

export function registerPublicSeoRoutes(app: Express) {
  app.get("/robots.txt", (req, res) => {
    const origin = requestOrigin(req);
    res.type("text/plain").set("Cache-Control", "public, max-age=3600").send(`User-agent: *\nAllow: /\nDisallow: /app/\nDisallow: /login\nDisallow: /register\nDisallow: /claim-account\nDisallow: /invite/\nDisallow: /manage-booking/\nDisallow: /waitlist/\nDisallow: /book/\n\nSitemap: ${origin}/sitemap.xml\n`);
  });

  app.get("/sitemap.xml", async (req, res) => {
    try {
      const db = await requireDb();
      const origin = requestOrigin(req);
      const profiles = await db.select({ publicSlug: locations.publicSlug, updatedAt: locations.updatedAt }).from(locations)
        .innerJoin(locationMarketplaceProfiles, eq(locationMarketplaceProfiles.locationId, locations.id))
        .where(eq(locationMarketplaceProfiles.status, "APPROVED"))
        .orderBy(desc(locations.updatedAt));
      const listed = await seoCategorySlugsWithListings();
      const categories = (await activeSeoCategories()).filter(category => listed.has(category.slug));
      const urls = [
        ...staticPublicPaths.map(path => `<url><loc>${xmlEscape(`${origin}${path}`)}</loc></url>`),
        ...categories.map(category => `<url><loc>${xmlEscape(`${origin}${categoryLandingPath(category.slug)}`)}</loc></url>`),
        ...profiles.map(profile => `<url><loc>${xmlEscape(`${origin}/salon/${profile.publicSlug}`)}</loc><lastmod>${profile.updatedAt.toISOString()}</lastmod></url>`),
      ];
      res.type("application/xml").set("Cache-Control", "public, max-age=3600").send(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.join("")}</urlset>`);
    } catch (error) {
      console.error("[SEO] Sitemap generation failed", error);
      res.status(503).type("application/xml").send("<?xml version=\"1.0\" encoding=\"UTF-8\"?><error>Temporarily unavailable</error>");
    }
  });
}
