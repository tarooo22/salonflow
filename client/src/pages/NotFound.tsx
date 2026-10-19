import { CatalogFooter, CatalogHeader } from "@/components/catalog/CatalogChrome";
import "@/components/catalog/marketing.css";
import { usePublicMeta } from "@/components/public/PublicMeta";
import { BRAND } from "@shared/brand";
import { ArrowLeft, Home } from "lucide-react";
import { Link } from "wouter";

export default function NotFound() {
  usePublicMeta({ title: `გვერდი ვერ მოიძებნა | ${BRAND.name}`, description: "მოთხოვნილი გვერდი ვერ მოიძებნა.", canonicalPath: "/404", robots: "noindex,nofollow" });
  return <div className="cw flex min-h-screen flex-col">
    <CatalogHeader />
    <main id="main-content" tabIndex={-1} className="cw-container flex flex-1 items-center py-14 sm:py-20">
      <section className="mx-auto w-full max-w-2xl" aria-labelledby="not-found-title">
        <div className="cw-torn-wrap">
          <div className="cw-torn">
            <div className="cw-torn-stub"><span className="cw-num text-sm">№ 404</span><span className="cw-num text-xs">{BRAND.domain}</span></div>
            <div className="p-6 sm:p-10">
              <h1 id="not-found-title" className="cw-display text-[clamp(1.9rem,5vw,3.2rem)]">ეს გვერდი ვერ მოიძებნა</h1>
              <p className="cw-lede mt-4">მისამართი შეიძლება არასწორია, შეიცვალა ან აღარ არსებობს. დაბრუნდით მთავარ გვერდზე ან გახსენით კატალოგი.</p>
              <div id="not-found-button-group" className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <Link href="/" className="cw-btn cw-btn-stamp"><Home className="size-5" aria-hidden="true" />მთავარ გვერდზე</Link>
                <Link href="/salons" className="cw-btn cw-btn-line text-[var(--cw-ink)]">კატალოგი</Link>
                <button type="button" className="cw-btn cw-btn-line text-[var(--cw-ink)]" onClick={() => window.history.back()}><ArrowLeft className="size-5" aria-hidden="true" />წინა გვერდი</button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
    <CatalogFooter />
  </div>;
}
