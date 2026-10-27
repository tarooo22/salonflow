import express, { type Express } from "express";
import fs from "fs";
import { type Server } from "http";
import { nanoid } from "nanoid";
import path from "path";
import { createServer as createViteServer } from "vite";
import viteConfig from "../../vite.config";
import { publicRouter } from "../routers/public";
import { renderPublicSalonProfileHead, renderPublicSalonProfileSnapshot } from "../lib/publicProfileSeo";
import { marketplaceRouter } from "../routers/marketplace";
import { activeSeoCategories, renderCategoryLandingHead, renderCategoryLandingSnapshot, requestOrigin } from "../publicSeo";
import { BRAND } from "../../shared/brand";
import { marketplaceCategorySlugSchema, slugSchema } from "../../shared/validation";

// Matches whatever <title> index.html carries, so renaming the brand can't silently switch this off.
const TITLE_TAG = /<title>[^<]*<\/title>/;

// index.html declares robots/googlebot "index,follow"; a page with its own robots directive must replace them, not add a second one.
const ROBOTS_META_TAGS = /<meta\s+name="(?:robots|googlebot)"[^>]*>\s*/g;
const withRobots = (template: string, content: string) => template.replace(ROBOTS_META_TAGS, "").replace("</head>", `<meta name="robots" content="${content}" />\n</head>`);

/** Unknown public page: HTTP 404 + noindex, but the SPA root stays so the app renders its own NotFound with header and navigation. */
function notFoundPage(template: string, title: string) {
  return { status: 404, html: withRobots(template, "noindex").replace(TITLE_TAG, `<title>${title} | ${BRAND.name}</title>`) };
}

async function injectSalonProfileSeo(template: string, req: express.Request) {
  const pathname = req.originalUrl.split("?")[0];
  const canonicalOrigin = requestOrigin(req);
  const match = pathname.match(/^\/salon\/([a-z0-9]+(?:-[a-z0-9]+)*)\/?$/);
  if (!match) return null;
  // A slug the schema rejects (e.g. too short) would throw inside the procedure; treat it as not found.
  const profile = slugSchema.safeParse(match[1]).success ? await publicRouter.createCaller({} as never).salonProfile(match[1]) : null;
  if (!profile) return notFoundPage(template, "სალონი ვერ მოიძებნა");
  const head = renderPublicSalonProfileHead(profile, canonicalOrigin);
  const body = renderPublicSalonProfileSnapshot(profile, canonicalOrigin);
  return { status: 200, html: template.replace(TITLE_TAG, head).replace("<div id=\"root\"></div>", `<div id="root">${body}</div>`) };
}

// index.html carries site-wide description/og/twitter tags; a page that injects its own must drop them to avoid duplicates.
const SITE_META_TAGS = /<meta\s+(?:name="(?:description|twitter:[a-z]+)"|property="og:[a-z:]+")[^>]*>\s*/g;

async function injectCategoryLandingSeo(template: string, req: express.Request) {
  const pathname = req.originalUrl.split("?")[0];
  const match = pathname.match(/^\/salons\/c\/([a-z0-9]+(?:-[a-z0-9]+)*)\/?$/);
  if (!match) return null;
  const parsed = marketplaceCategorySlugSchema.safeParse(match[1]);
  const category = parsed.success ? (await activeSeoCategories()).find(item => item.slug === parsed.data) : undefined;
  if (!category) return notFoundPage(template, "კატეგორია ვერ მოიძებნა");
  // The listing links are a crawler convenience; the page still renders without them.
  const listings = await marketplaceRouter.createCaller({} as never).directory({ categorySlug: category.slug, limit: 48, offset: 0 }).then(result => result.items as Array<{ publicSlug: string; name: string; areaLabelKa: string | null }>).catch(() => null);
  // An empty category is thin content: keep it out of the index (links are still followed). A failed lookup must not noindex a real page.
  const head = renderCategoryLandingHead(category, requestOrigin(req), { noindex: listings?.length === 0 });
  return { status: 200, html: template.replace(SITE_META_TAGS, "").replace(ROBOTS_META_TAGS, "").replace(TITLE_TAG, head).replace("<div id=\"root\"></div>", `<div id="root">${renderCategoryLandingSnapshot(category, listings ?? [])}</div>`) };
}

async function injectPublicSeo(template: string, req: express.Request) {
  return (await injectSalonProfileSeo(template, req)) ?? (await injectCategoryLandingSeo(template, req));
}

export async function setupVite(app: Express, server: Server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true as const,
  };

  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    server: serverOptions,
    appType: "custom",
  });

  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;

    try {
      const clientTemplate = path.resolve(
        import.meta.dirname,
        "../..",
        "client",
        "index.html"
      );

      // always reload the index.html file from disk incase it changes
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      const seoPage = await injectPublicSeo(page, req);
      res.status(seoPage?.status ?? 200).set({ "Content-Type": "text/html", "Cache-Control": "no-cache" }).end(seoPage?.html ?? page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

export function serveStatic(app: Express) {
  const distPath =
    process.env.NODE_ENV === "development"
      ? path.resolve(import.meta.dirname, "../..", "dist", "public")
      : path.resolve(import.meta.dirname, "public");
  if (!fs.existsSync(distPath)) {
    console.error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }

  app.use(express.static(distPath));

  // Fall through to the SPA shell, but inject crawler-visible public salon pages.
  app.use("*", async (req, res, next) => {
    try {
      const template = await fs.promises.readFile(path.resolve(distPath, "index.html"), "utf-8");
      const seoPage = await injectPublicSeo(template, req);
      if (seoPage) return res.status(seoPage.status).set({ "Content-Type": "text/html", "Cache-Control": "no-cache" }).end(seoPage.html);
      res.sendFile(path.resolve(distPath, "index.html"));
    } catch (error) {
      next(error);
    }
  });
}
