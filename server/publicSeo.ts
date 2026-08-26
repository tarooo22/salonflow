import type { Express, Request } from "express";
import { desc, eq } from "drizzle-orm";
import { locationMarketplaceProfiles, locations } from "../drizzle/schema";
import { requireDb } from "./db";

const staticPublicPaths = ["/", "/salons", "/salons/map", "/book", "/partner", "/features", "/pricing", "/demo", "/faq", "/contact", "/privacy"];

function xmlEscape(value: string) {
  return value.replace(/[<>&'\"]/g, character => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", "\"": "&quot;" })[character] ?? character);
}

function requestOrigin(req: Request) {
  const configured = process.env.PUBLIC_SITE_URL;
  if (configured && /^https:\/\/[a-z0-9.-]+(?:\:\d+)?$/i.test(configured)) return configured.replace(/\/$/, "");
  const host = req.get("host") ?? "salonflow-dpxqgxgv.manus.space";
  const safeHost = /^[a-z0-9.-]+(?::\d+)?$/i.test(host) ? host : "salonflow-dpxqgxgv.manus.space";
  const protocol = safeHost.includes("localhost") || safeHost.startsWith("127.") ? "http" : "https";
  return `${protocol}://${safeHost}`;
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
      const urls = [
        ...staticPublicPaths.map(path => `<url><loc>${xmlEscape(`${origin}${path}`)}</loc></url>`),
        ...profiles.map(profile => `<url><loc>${xmlEscape(`${origin}/salon/${profile.publicSlug}`)}</loc><lastmod>${profile.updatedAt.toISOString()}</lastmod></url>`),
      ];
      res.type("application/xml").set("Cache-Control", "public, max-age=3600").send(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.join("")}</urlset>`);
    } catch (error) {
      console.error("[SEO] Sitemap generation failed", error);
      res.status(503).type("application/xml").send("<?xml version=\"1.0\" encoding=\"UTF-8\"?><error>Temporarily unavailable</error>");
    }
  });
}
