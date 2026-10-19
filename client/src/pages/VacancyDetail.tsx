import { CatalogFooter, CatalogHeader } from "@/components/catalog/CatalogChrome";
import { employmentLabel, formatUtcDate, salaryLabel } from "@/components/catalog/Commerce";
import "@/components/catalog/commerce.css";
import { cssVars } from "@/components/catalog/Tickets";
import { usePublicMeta } from "@/components/public/PublicMeta";
import { usePublicLocale } from "@/contexts/PublicLocaleContext";
import { trpc } from "@/lib/trpc";
import { verticalForCategory, verticalLabel, verticalStyle } from "@/lib/verticals";
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
  const tone = verticalStyle(leadVertical);
  const expires = item ? formatUtcDate(item.expiresAt) : null;

  return <div className="cw min-h-screen">
    <CatalogHeader />
    <main id="main-content" className="cw-section">
      <div className="cw-container max-w-3xl">
        <Link href="/vacancies" className="cwx-biz mb-6 inline-flex w-auto gap-2 border-0"><ArrowLeft className="size-4" aria-hidden="true" />{text.allVacancies}</Link>
        {vacancy.isLoading ? <div className="h-72 animate-pulse rounded-[4px] border-[1.5px] border-[var(--cw-rule)] bg-white" aria-busy="true" aria-label={text.loading} />
          : vacancy.isError ? <div className="cwx-empty" role={vacancy.error.data?.code === "NOT_FOUND" ? "status" : "alert"}>
            <h1 className="text-2xl font-extrabold [font-stretch:85%]">{vacancy.error.data?.code === "NOT_FOUND" ? text.notFoundTitle : text.loadFailedTitle}</h1>
            <p className="mt-2 text-[var(--cw-ink-soft)]">{vacancy.error.data?.code === "NOT_FOUND" ? text.notFoundText : text.loadFailedText}</p>
            <Link href="/vacancies" className="cw-btn cw-btn-stamp mt-4">{text.allVacancies}</Link>
          </div>
          : item ? <article className="cw-ledger" style={cssVars({ "--ledger-bg": tone.bg, "--ledger-ink": tone.ink })}>
            <div className="cw-ledger-head">
              <span className="text-sm font-extrabold">{verticalLabel(leadVertical, locale)}</span>
              {item.isVip ? <span className="cw-stamp-mark" title={text.paid}>VIP<span className="sr-only">{text.adSr}</span></span> : null}
            </div>
            <div className="p-5 sm:p-8">
              <h1 className="cw-display text-[clamp(1.75rem,4.5vw,2.6rem)]">{item.title}</h1>
              <p className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-[var(--cw-ink-soft)]">
                <Link href={`/salon/${item.locationPublicSlug}`} className="font-extrabold text-[var(--cw-stamp)] underline">{item.businessName}</Link>
                {item.areaLabelKa ? <span className="inline-flex items-center gap-1"><MapPin className="size-4" aria-hidden="true" />{item.areaLabelKa}</span> : null}
              </p>
              <dl className="cwx-facts mt-6">
                <div className="cwx-fact"><dt className="cw-caption">{text.employmentType}</dt><dd className="font-bold">{employmentLabel(item.employmentType, locale)}</dd></div>
                <div className="cwx-fact"><dt className="cw-caption">{text.salary}</dt><dd className="cw-num font-semibold">{salaryLabel(item.salaryFromTetri, item.salaryToTetri, locale)}</dd></div>
                {expires ? <div className="cwx-fact"><dt className="cw-caption">{text.validity}</dt><dd className="cw-num font-semibold">{text.untilPrefix}{expires}{text.until}</dd></div> : null}
              </dl>
              <h2 className="mt-8 text-xl font-extrabold [font-stretch:85%]">{text.description}</h2>
              <p className="cwx-prose mt-2">{item.description}</p>
              <h2 className="mt-8 text-xl font-extrabold [font-stretch:85%]">{text.contact}</h2>
              <p className="mt-2 text-sm text-[var(--cw-ink-soft)]">{text.contactLede}</p>
              <div className="mt-4 flex flex-wrap gap-3">
                {item.contactPhone ? <a href={`tel:${item.contactPhone.replace(/[^\d+]/g, "")}`} className="cw-btn cw-btn-stamp"><Phone className="size-5" aria-hidden="true" /><span className="cw-num">{item.contactPhone}</span></a> : null}
                {item.contactEmail ? <a href={`mailto:${item.contactEmail}`} className="cw-btn cw-btn-line min-w-0 text-[var(--cw-ink)]"><Mail className="size-5 shrink-0" aria-hidden="true" /><span className="truncate">{item.contactEmail}</span></a> : null}
                <Link href={`/salon/${item.locationPublicSlug}`} className="cw-btn cw-btn-line text-[var(--cw-ink)]">{text.businessPage}</Link>
              </div>
            </div>
          </article> : null}
      </div>
    </main>
    <CatalogFooter />
  </div>;
}
