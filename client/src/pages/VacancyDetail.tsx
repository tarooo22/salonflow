import { CatalogFooter, CatalogHeader } from "@/components/catalog/CatalogChrome";
import { employmentLabel, formatUtcDate, salaryLabel } from "@/components/catalog/Commerce";
import "@/components/catalog/commerce.css";
import "@/components/catalog/marketing.css";
import { usePublicMeta } from "@/components/public/PublicMeta";
import { usePublicLocale } from "@/contexts/PublicLocaleContext";
import { trpc } from "@/lib/trpc";
import { verticalForCategory, verticalLabel } from "@/lib/verticals";
import { BRAND } from "@shared/brand";
import { ArrowLeft, Mail, MapPin, Phone } from "lucide-react";
import { Link, useRoute } from "wouter";

export const ui = {
  ka: {
    metaFallbackTitle: "ვაკანსია", metaFallbackDescription: "ვაკანსიის დეტალები.", allVacancies: "ყველა ვაკანსია", loading: "იტვირთება",
    notFoundTitle: "ვაკანსია ვერ მოიძებნა ან უკვე დახურულია.", loadFailedTitle: "ვაკანსიის ჩატვირთვა ვერ მოხერხდა.",
    notFoundText: "განცხადების ვადა შეიძლება ამოიწურა. იხილეთ მიმდინარე ვაკანსიები.", loadFailedText: "სცადეთ რამდენიმე წუთში.",
    paid: "ფასიანი განთავსება", adSr: " — რეკლამა", employmentType: "დასაქმების ტიპი", salary: "ანაზღაურება", validity: "განცხადება მოქმედებს", until: "-მდე", untilPrefix: "",
    description: "აღწერა", contact: "დაკავშირება", contactLede: "განცხადებას აქვეყნებს ბიზნესი. დაუკავშირდი მას პირდაპირ.", businessPage: "ბიზნესის გვერდი",
  },
  en: {
    metaFallbackTitle: "Vacancy", metaFallbackDescription: "Vacancy details.", allVacancies: "All vacancies", loading: "Loading",
    notFoundTitle: "Vacancy not found or already closed.", loadFailedTitle: "The vacancy could not be loaded.",
    notFoundText: "The listing may have expired. See the current vacancies.", loadFailedText: "Please try again in a few minutes.",
    paid: "Paid placement", adSr: " — advertisement", employmentType: "Employment type", salary: "Salary", validity: "Listing valid", until: "", untilPrefix: "Until ",
    description: "Description", contact: "Contact", contactLede: "The listing is published by the business. Contact them directly.", businessPage: "Business page",
  },
  ru: {
    metaFallbackTitle: "Вакансия", metaFallbackDescription: "Подробности вакансии.", allVacancies: "Все вакансии", loading: "Загрузка",
    notFoundTitle: "Вакансия не найдена или уже закрыта.", loadFailedTitle: "Не удалось загрузить вакансию.",
    notFoundText: "Срок объявления мог истечь. Посмотрите текущие вакансии.", loadFailedText: "Повторите через несколько минут.",
    paid: "Платное размещение", adSr: " — реклама", employmentType: "Тип занятости", salary: "Оплата", validity: "Объявление действует", until: "", untilPrefix: "До ",
    description: "Описание", contact: "Связаться", contactLede: "Объявление публикует бизнес. Свяжитесь с ним напрямую.", businessPage: "Страница бизнеса",
  },
} as const;

export default function VacancyDetail() {
  const { locale } = usePublicLocale();
  const text = ui[locale];
  const [, params] = useRoute("/vacancies/:id");
  const id = params?.id ?? "";
  const vacancy = trpc.vacancies.publicDetail.useQuery({ id }, { enabled: Boolean(id), retry: false });
  const item = vacancy.data;
  usePublicMeta({
    title: item ? `${item.title} — ${item.businessName} | ${BRAND.name}` : `${text.metaFallbackTitle} | ${BRAND.name}`,
    description: item ? (item.description ?? "").slice(0, 155) : text.metaFallbackDescription,
    canonicalPath: `/vacancies/${id}`,
    robots: item ? "index,follow" : "noindex,nofollow",
  });
  const leadVertical = verticalForCategory(item?.roleCategory ?? "");
  const expires = item ? formatUtcDate(item.expiresAt) : null;

  return <div className="cw min-h-screen">
    <CatalogHeader />
    <main id="main-content" className="mkt-section">
      <div className="mkt-container cwx-narrow">
        <Link href="/vacancies" className="cwx-back"><ArrowLeft className="size-4" aria-hidden="true" />{text.allVacancies}</Link>
        {vacancy.isLoading ? <div className="cwx-skeleton cwx-skeleton-tall" aria-busy="true" aria-label={text.loading} />
          : vacancy.isError ? <div className="cwx-empty" role={vacancy.error.data?.code === "NOT_FOUND" ? "status" : "alert"}>
            <h1 className="mkt-h2">{vacancy.error.data?.code === "NOT_FOUND" ? text.notFoundTitle : text.loadFailedTitle}</h1>
            <p className="cwx-empty-text">{vacancy.error.data?.code === "NOT_FOUND" ? text.notFoundText : text.loadFailedText}</p>
            <Link href="/vacancies" className="mkt-btn mkt-btn-primary">{text.allVacancies}</Link>
          </div>
          : item ? <article className="cwx-detail" data-vertical={leadVertical}>
            <div className="cwx-detail-head">
              <span className="mkt-vtag">{verticalLabel(leadVertical, locale)}</span>
              {item.isVip ? <span className="cwx-vip" title={text.paid}>VIP<span className="sr-only">{text.adSr}</span></span> : null}
            </div>
            <div className="cwx-detail-body">
              <h1 className="cwx-detail-title">{item.title}</h1>
              <p className="cwx-detail-business">
                <Link href={`/salon/${item.locationPublicSlug}`}>{item.businessName}</Link>
                {item.areaLabelKa ? <span className="cwx-area"><MapPin className="size-4" aria-hidden="true" />{item.areaLabelKa}</span> : null}
              </p>
              <dl className="cwx-facts">
                <div className="cwx-fact"><dt>{text.employmentType}</dt><dd>{employmentLabel(item.employmentType, locale)}</dd></div>
                <div className="cwx-fact"><dt>{text.salary}</dt><dd>{salaryLabel(item.salaryFromTetri, item.salaryToTetri, locale)}</dd></div>
                {expires ? <div className="cwx-fact"><dt>{text.validity}</dt><dd>{text.untilPrefix}{expires}{text.until}</dd></div> : null}
              </dl>
              <h2 className="cwx-section-title">{text.description}</h2>
              <p className="cwx-prose">{item.description}</p>
              <h2 className="cwx-section-title">{text.contact}</h2>
              <p className="cwx-note">{text.contactLede}</p>
              <div className="cwx-actions">
                {item.contactPhone ? <a href={`tel:${item.contactPhone.replace(/[^\d+]/g, "")}`} className="mkt-btn mkt-btn-primary"><Phone className="size-5" aria-hidden="true" /><span className="tabular-nums">{item.contactPhone}</span></a> : null}
                {item.contactEmail ? <a href={`mailto:${item.contactEmail}`} className="mkt-btn mkt-btn-secondary cwx-truncate"><Mail className="size-5 shrink-0" aria-hidden="true" /><span className="cwx-truncate">{item.contactEmail}</span></a> : null}
                <Link href={`/salon/${item.locationPublicSlug}`} className="mkt-btn mkt-btn-secondary">{text.businessPage}</Link>
              </div>
            </div>
          </article> : null}
      </div>
    </main>
    <CatalogFooter />
  </div>;
}
