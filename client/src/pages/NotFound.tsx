import { CatalogFooter, CatalogHeader } from "@/components/catalog/CatalogChrome";
import "@/components/catalog/marketing.css";
import { usePublicMeta } from "@/components/public/PublicMeta";
import { usePublicLocale } from "@/contexts/PublicLocaleContext";
import { BRAND } from "@shared/brand";
import { ArrowLeft, Home } from "lucide-react";
import { Link } from "wouter";

export const ui = {
  ka: { metaTitle: "გვერდი ვერ მოიძებნა", metaDescription: "მოთხოვნილი გვერდი ვერ მოიძებნა.", title: "ეს გვერდი ვერ მოიძებნა", lede: "მისამართი შეიძლება არასწორია, შეიცვალა ან აღარ არსებობს. დაბრუნდით მთავარ გვერდზე ან გახსენით კატალოგი.", home: "მთავარ გვერდზე", catalog: "კატალოგი", back: "წინა გვერდი" },
  en: { metaTitle: "Page not found", metaDescription: "The requested page could not be found.", title: "This page was not found", lede: "The address may be wrong, may have changed, or may no longer exist. Go back to the home page or open the catalog.", home: "Home page", catalog: "Catalog", back: "Previous page" },
  ru: { metaTitle: "Страница не найдена", metaDescription: "Запрошенная страница не найдена.", title: "Эта страница не найдена", lede: "Адрес может быть неверным, измениться или больше не существовать. Вернитесь на главную страницу или откройте каталог.", home: "На главную", catalog: "Каталог", back: "Назад" },
} as const;

export default function NotFound() {
  const { locale } = usePublicLocale();
  const text = ui[locale];
  usePublicMeta({ title: `${text.metaTitle} | ${BRAND.name}`, description: text.metaDescription, canonicalPath: "/404", robots: "noindex,nofollow" });
  return <div className="cw flex min-h-screen flex-col">
    <CatalogHeader />
    <main id="main-content" tabIndex={-1} className="cw-container flex flex-1 items-center py-14 sm:py-20">
      <section className="mx-auto w-full max-w-2xl" aria-labelledby="not-found-title">
        <div className="cw-torn-wrap">
          <div className="cw-torn">
            <div className="cw-torn-stub"><span className="cw-num text-sm">№ 404</span><span className="cw-num text-xs">{BRAND.domain}</span></div>
            <div className="p-6 sm:p-10">
              <h1 id="not-found-title" className="cw-display text-[clamp(1.9rem,5vw,3.2rem)]">{text.title}</h1>
              <p className="cw-lede mt-4">{text.lede}</p>
              <div id="not-found-button-group" className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <Link href="/" className="cw-btn cw-btn-stamp"><Home className="size-5" aria-hidden="true" />{text.home}</Link>
                <Link href="/salons" className="cw-btn cw-btn-line text-[var(--cw-ink)]">{text.catalog}</Link>
                <button type="button" className="cw-btn cw-btn-line text-[var(--cw-ink)]" onClick={() => window.history.back()}><ArrowLeft className="size-5" aria-hidden="true" />{text.back}</button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
    <CatalogFooter />
  </div>;
}
