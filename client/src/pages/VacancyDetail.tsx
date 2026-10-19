import { CatalogFooter, CatalogHeader } from "@/components/catalog/CatalogChrome";
import { EMPLOYMENT_LABELS, formatUtcDate, salaryLabel } from "@/components/catalog/Commerce";
import "@/components/catalog/commerce.css";
import { cssVars } from "@/components/catalog/Tickets";
import { usePublicMeta } from "@/components/public/PublicMeta";
import { trpc } from "@/lib/trpc";
import { verticalForCategory, verticalStyle } from "@/lib/verticals";
import { BRAND } from "@shared/brand";
import { ArrowLeft, Mail, MapPin, Phone } from "lucide-react";
import { Link, useRoute } from "wouter";

export default function VacancyDetail() {
  const [, params] = useRoute("/vacancies/:id");
  const id = params?.id ?? "";
  const vacancy = trpc.vacancies.publicDetail.useQuery({ id }, { enabled: Boolean(id), retry: false });
  const item = vacancy.data;
  usePublicMeta({
    title: item ? `${item.title} — ${item.businessName} | ${BRAND.name}` : `ვაკანსია | ${BRAND.name}`,
    description: item ? (item.description ?? "").slice(0, 155) : "ვაკანსიის დეტალები.",
    canonicalPath: `/vacancies/${id}`,
    robots: item ? "index,follow" : "noindex,nofollow",
  });
  const tone = verticalStyle(verticalForCategory(item?.roleCategory ?? ""));
  const expires = item ? formatUtcDate(item.expiresAt) : null;

  return <div className="cw min-h-screen">
    <CatalogHeader />
    <main id="main-content" className="cw-section">
      <div className="cw-container max-w-3xl">
        <Link href="/vacancies" className="cwx-biz mb-6 inline-flex w-auto gap-2 border-0"><ArrowLeft className="size-4" aria-hidden="true" />ყველა ვაკანსია</Link>
        {vacancy.isLoading ? <div className="h-72 animate-pulse rounded-[4px] border-[1.5px] border-[var(--cw-rule)] bg-white" aria-busy="true" aria-label="იტვირთება" />
          : vacancy.isError ? <div className="cwx-empty" role={vacancy.error.data?.code === "NOT_FOUND" ? "status" : "alert"}>
            <h1 className="text-2xl font-extrabold [font-stretch:85%]">{vacancy.error.data?.code === "NOT_FOUND" ? "ვაკანსია ვერ მოიძებნა ან უკვე დახურულია." : "ვაკანსიის ჩატვირთვა ვერ მოხერხდა."}</h1>
            <p className="mt-2 text-[var(--cw-ink-soft)]">{vacancy.error.data?.code === "NOT_FOUND" ? "განცხადების ვადა შეიძლება ამოიწურა. იხილეთ მიმდინარე ვაკანსიები." : "სცადეთ რამდენიმე წუთში."}</p>
            <Link href="/vacancies" className="cw-btn cw-btn-stamp mt-4">ყველა ვაკანსია</Link>
          </div>
          : item ? <article className="cw-ledger" style={cssVars({ "--ledger-bg": tone.bg, "--ledger-ink": tone.ink })}>
            <div className="cw-ledger-head">
              <span className="text-sm font-extrabold">{tone.label}</span>
              {item.isVip ? <span className="cw-stamp-mark" title="ფასიანი განთავსება">VIP<span className="sr-only"> — რეკლამა</span></span> : null}
            </div>
            <div className="p-5 sm:p-8">
              <h1 className="cw-display text-[clamp(1.75rem,4.5vw,2.6rem)]">{item.title}</h1>
              <p className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-[var(--cw-ink-soft)]">
                <Link href={`/salon/${item.locationPublicSlug}`} className="font-extrabold text-[var(--cw-stamp)] underline">{item.businessName}</Link>
                {item.areaLabelKa ? <span className="inline-flex items-center gap-1"><MapPin className="size-4" aria-hidden="true" />{item.areaLabelKa}</span> : null}
              </p>
              <dl className="cwx-facts mt-6">
                <div className="cwx-fact"><dt className="cw-caption">დასაქმების ტიპი</dt><dd className="font-bold">{EMPLOYMENT_LABELS[item.employmentType] ?? item.employmentType}</dd></div>
                <div className="cwx-fact"><dt className="cw-caption">ანაზღაურება</dt><dd className="cw-num font-semibold">{salaryLabel(item.salaryFromTetri, item.salaryToTetri)}</dd></div>
                {expires ? <div className="cwx-fact"><dt className="cw-caption">განცხადება მოქმედებს</dt><dd className="cw-num font-semibold">{expires}-მდე</dd></div> : null}
              </dl>
              <h2 className="mt-8 text-xl font-extrabold [font-stretch:85%]">აღწერა</h2>
              <p className="cwx-prose mt-2">{item.description}</p>
              <h2 className="mt-8 text-xl font-extrabold [font-stretch:85%]">დაკავშირება</h2>
              <p className="mt-2 text-sm text-[var(--cw-ink-soft)]">განცხადებას აქვეყნებს ბიზნესი. დაუკავშირდი მას პირდაპირ.</p>
              <div className="mt-4 flex flex-wrap gap-3">
                {item.contactPhone ? <a href={`tel:${item.contactPhone.replace(/[^\d+]/g, "")}`} className="cw-btn cw-btn-stamp"><Phone className="size-5" aria-hidden="true" /><span className="cw-num">{item.contactPhone}</span></a> : null}
                {item.contactEmail ? <a href={`mailto:${item.contactEmail}`} className="cw-btn cw-btn-line min-w-0 text-[var(--cw-ink)]"><Mail className="size-5 shrink-0" aria-hidden="true" /><span className="truncate">{item.contactEmail}</span></a> : null}
                <Link href={`/salon/${item.locationPublicSlug}`} className="cw-btn cw-btn-line text-[var(--cw-ink)]">ბიზნესის გვერდი</Link>
              </div>
            </div>
          </article> : null}
      </div>
    </main>
    <CatalogFooter />
  </div>;
}
