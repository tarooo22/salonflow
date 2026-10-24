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
    <main id="main-content" tabIndex={-1} className="mkt-container mkt-404">
      <section className="mkt-card mkt-404-card" aria-labelledby="not-found-title">
        <div className="mkt-404-top">
          <span className="mkt-pill tabular-nums">№ 404</span>
          <span className="mkt-caption">{BRAND.domain}</span>
        </div>
        <h1 id="not-found-title" className="mkt-h1 mkt-404-title">{text.title}</h1>
        <p className="mkt-lede mkt-404-lede">{text.lede}</p>
        <div id="not-found-button-group" className="mkt-404-actions">
          <Link href="/" className="mkt-btn mkt-btn-primary"><Home className="size-5" aria-hidden="true" />{text.home}</Link>
          <Link href="/salons" className="mkt-btn mkt-btn-secondary">{text.catalog}</Link>
          <button type="button" className="mkt-btn mkt-btn-secondary" onClick={() => window.history.back()}><ArrowLeft className="size-5" aria-hidden="true" />{text.back}</button>
        </div>
      </section>
    </main>
    <CatalogFooter />
  </div>;
}
