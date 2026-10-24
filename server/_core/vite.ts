import express, { type Express } from "express";
import fs from "fs";
import { type Server } from "http";
import { nanoid } from "nanoid";
import path from "path";
import { createServer as createViteServer } from "vite";
import viteConfig from "../../vite.config";
import { publicRouter } from "../routers/public";
import { renderPublicSalonProfileHead, renderPublicSalonProfileSnapshot } from "../lib/publicProfileSeo";
import { requestOrigin } from "../publicSeo";
import { BRAND } from "../../shared/brand";
import { slugSchema } from "../../shared/validation";

// Matches whatever <title> index.html carries, so renaming the brand can't silently switch this off.
const TITLE_TAG = /<title>[^<]*<\/title>/;

async function injectSalonProfileSeo(template: string, req: express.Request) {
  const pathname = req.originalUrl.split("?")[0];
  const canonicalOrigin = requestOrigin(req);
  const match = pathname.match(/^\/salon\/([a-z0-9]+(?:-[a-z0-9]+)*)\/?$/);
  if (!match) return null;
  // A slug the schema rejects (e.g. too short) would throw inside the procedure; treat it as not found.
  const profile = slugSchema.safeParse(match[1]).success ? await publicRouter.createCaller({} as never).salonProfile(match[1]) : null;
  if (!profile) return { status: 404, html: template.replace(TITLE_TAG, `<title>სალონი ვერ მოიძებნა | ${BRAND.name}</title>`).replace("<div id=\"root\"></div>", "<main class=\"sf-public-page grid min-h-screen place-items-center px-4\"><h1>სალონი ვერ მოიძებნა</h1></main>") };
  const head = renderPublicSalonProfileHead(profile, canonicalOrigin);
  const body = renderPublicSalonProfileSnapshot(profile, canonicalOrigin);
  return { status: 200, html: template.replace(TITLE_TAG, head).replace("<div id=\"root\"></div>", `<div id="root">${body}</div>`) };
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
      const seoPage = await injectSalonProfileSeo(page, req);
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
      const seoPage = await injectSalonProfileSeo(template, req);
      if (seoPage) return res.status(seoPage.status).set({ "Content-Type": "text/html", "Cache-Control": "no-cache" }).end(seoPage.html);
      res.sendFile(path.resolve(distPath, "index.html"));
    } catch (error) {
      next(error);
    }
  });
}
