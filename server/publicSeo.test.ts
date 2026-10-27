import type { Request } from "express";
import { beforeEach, describe, expect, it, vi } from "vitest";

const queued: unknown[][] = [];
vi.mock("./db", () => ({
  requireDb: async () => ({
    // The query builder is awaitable; the db handle itself must not be (await would unwrap it).
    select: () => {
      const chain: Record<string, unknown> = {};
      for (const method of ["from", "innerJoin", "where", "orderBy"]) chain[method] = () => chain;
      chain.then = (resolve: (rows: unknown[]) => unknown) => resolve(queued.shift() ?? []);
      return chain;
    },
  }),
}));

import { registerPublicSeoRoutes, renderCategoryLandingHead, renderCategoryLandingSnapshot, requestOrigin } from "./publicSeo";

function run(path: string) {
  const handlers = new Map<string, (req: Request, res: unknown) => Promise<void> | void>();
  registerPublicSeoRoutes({ get: (route: string, handler: never) => handlers.set(route, handler) } as never);
  const sent = { status: 200, type: "", body: "" };
  const res = { type(value: string) { sent.type = value; return res; }, set() { return res; }, status(code: number) { sent.status = code; return res; }, send(body: string) { sent.body = body; return res; } };
  const req = { get: () => "chawera.test" } as unknown as Request;
  return Promise.resolve(handlers.get(path)!(req, res)).then(() => sent);
}

describe("public SEO routes", () => {
  beforeEach(() => { queued.length = 0; delete process.env.PUBLIC_SITE_URL; });

  it("robots.txt hides the panel and points at the sitemap", async () => {
    const { body } = await run("/robots.txt");
    expect(body).toContain("Disallow: /app/");
    expect(body).toContain("Sitemap: https://chawera.test/sitemap.xml");
  });

  it("sitemap lists home, catalog, only categories that have listings, and approved salons (no /book)", async () => {
    // Query order: approved profiles, category slugs with listings, active categories.
    queued.push([{ publicSlug: "salon-one", updatedAt: new Date("2026-10-01T00:00:00Z") }], [{ slug: "hair" }, { slug: "hair" }, { slug: "dental-kids" }], [{ slug: "hair", nameKa: "თმა" }, { slug: "dental-kids", nameKa: "ბავშვთა სტომატოლოგია" }, { slug: "nails", nameKa: "ფრჩხილები" }]);
    const { body, type } = await run("/sitemap.xml");
    expect(type).toBe("application/xml");
    for (const loc of ["https://chawera.test/", "https://chawera.test/salons", "https://chawera.test/salons/c/hair", "https://chawera.test/salons/c/dental-kids", "https://chawera.test/salon/salon-one"]) expect(body).toContain(`<loc>${loc}</loc>`);
    expect(body).not.toContain("/salons/c/nails");
    expect(body).not.toContain("/book<");
  });

  it("marks a category with no listings noindex,follow and an indexable one index,follow", () => {
    expect(renderCategoryLandingHead({ slug: "hair", nameKa: "თმა" }, "https://chawera.test", { noindex: true })).toContain('<meta name="robots" content="noindex,follow" />');
    expect(renderCategoryLandingHead({ slug: "hair", nameKa: "თმა" }, "https://chawera.test")).toContain('<meta name="robots" content="index,follow" />');
  });

  it("renders category head tags with canonical, og and a BreadcrumbList", () => {
    const head = renderCategoryLandingHead({ slug: "hair", nameKa: "თმა" }, "https://chawera.test");
    expect(head).toContain("<title>თმა — სალონები და ონლაინ ჩაწერა | Chawera</title>");
    expect(head).toContain('<link rel="canonical" href="https://chawera.test/salons/c/hair" />');
    expect(head).toContain('property="og:url" content="https://chawera.test/salons/c/hair"');
    expect(head).toContain('"@type":"BreadcrumbList"');
    expect(head).toContain('name="description"');
  });

  it("escapes names in the crawler snapshot", () => {
    const html = renderCategoryLandingSnapshot({ slug: "hair", nameKa: "თმა" }, [{ publicSlug: "a-b", name: "A <b>&", areaLabelKa: "ვაკე" }]);
    expect(html).toContain("<h1>თმა — სალონები და ონლაინ ჩაწერა</h1>");
    expect(html).toContain('<a href="/salon/a-b">A &lt;b&gt;&amp;</a> — ვაკე');
    expect(requestOrigin({ get: () => "localhost:3100" } as unknown as Request)).toBe("http://localhost:3100");
  });
});
