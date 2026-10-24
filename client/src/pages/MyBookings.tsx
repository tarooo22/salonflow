import "@/components/catalog/discovery.css";
import { CatalogFooter, CatalogHeader } from "@/components/catalog/CatalogChrome";
import { HeroIn } from "@/components/catalog/HomeMotion";
import { usePublicMeta } from "@/components/public/PublicMeta";
import { usePublicLocale } from "@/contexts/PublicLocaleContext";
import { useDeviceBookings } from "@/lib/deviceSaved";
import { formatDateTimeForLocale } from "@/lib/presentation";
import { BRAND } from "@shared/brand";
import { CalendarCheck, Trash2 } from "lucide-react";
import { Link } from "wouter";

export const ui = {
  ka: { title: "ჩემი ჯავშნები", note: "ინახება მხოლოდ ამ მოწყობილობაზე.", emptyTitle: "ამ მოწყობილობიდან ჯერ არ დაგიჯავშნია.", emptyBody: "ჯავშნის გაკეთების შემდეგ ის აქ გამოჩნდება.", find: "ადგილის მოძებნა", manage: "ჯავშნის შეცვლა ან გაუქმება შეგიძლია დადასტურების გვერდზე მიღებული ბმულით.", openSalon: "ადგილის გვერდი", remove: "სიიდან წაშლა", metaDescription: "ჯავშნები, რომლებიც ამ მოწყობილობიდან გააკეთე." },
  en: { title: "My bookings", note: "Stored only on this device.", emptyTitle: "You have not booked from this device yet.", emptyBody: "Once you book, it will appear here.", find: "Find a place", manage: "Use the link from the confirmation page to change or cancel a booking.", openSalon: "Open the place", remove: "Remove from list", metaDescription: "Bookings you made from this device." },
  ru: { title: "Мои записи", note: "Хранится только на этом устройстве.", emptyTitle: "С этого устройства вы пока не записывались.", emptyBody: "После записи она появится здесь.", find: "Найти место", manage: "Изменить или отменить запись можно по ссылке со страницы подтверждения.", openSalon: "Страница места", remove: "Убрать из списка", metaDescription: "Записи, сделанные с этого устройства." },
} as const;

// Salons are in Georgia; the booking's own timezone is deliberately not stored, only salon, services and start time.
const DISPLAY_TIME_ZONE = "Asia/Tbilisi";

export default function MyBookings() {
  const { locale } = usePublicLocale();
  const text = ui[locale];
  const { bookings, remove } = useDeviceBookings();
  usePublicMeta({ title: `${text.title} | ${BRAND.name}`, description: text.metaDescription, canonicalPath: "/my-bookings", robots: "noindex,nofollow" });
  const sorted = [...bookings].sort((a, b) => Date.parse(b.startsAt) - Date.parse(a.startsAt));

  return <div className="cw">
    <CatalogHeader />
    <main id="main-content" tabIndex={-1} className="cw-container">
      <HeroIn className="cw-page-head">
        <h1>{text.title}</h1>
        <p className="cw-page-note">{text.note}</p>
      </HeroIn>
      {sorted.length === 0
        ? <div className="cw-empty mb-12">
          <span className="cw-empty-icon"><CalendarCheck aria-hidden="true" /></span>
          <h2>{text.emptyTitle}</h2>
          <p>{text.emptyBody}</p>
          <Link href="/salons" className="cw-btn cw-btn-stamp min-h-11">{text.find}</Link>
        </div>
        : <ul className="cw-device-list">{sorted.map(booking => <li key={`${booking.slug}-${booking.startsAt}`} className="cw-device-row">
          <div className="grid gap-2">
            <h2><Link href={`/salon/${booking.slug}`}>{booking.salonName}</Link></h2>
            <div className="cw-device-meta">
              <p>{booking.services.join(", ")}</p>
              <p className="cw-num font-semibold text-[var(--sf-text)]">{formatDateTimeForLocale(new Date(booking.startsAt), locale, DISPLAY_TIME_ZONE)}</p>
              <p>{text.manage}</p>
            </div>
          </div>
          <div className="cw-device-actions">
            <Link href={`/salon/${booking.slug}`} className="cw-device-link">{text.openSalon}</Link>
            <button type="button" className="cw-device-remove" onClick={() => remove(booking)}><Trash2 className="size-4" aria-hidden="true" />{text.remove}</button>
          </div>
        </li>)}</ul>}
    </main>
    <CatalogFooter />
  </div>;
}
