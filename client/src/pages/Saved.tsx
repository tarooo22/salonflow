import { CatalogFooter, CatalogHeader } from "@/components/catalog/CatalogChrome";
import { SalonGrid, type CatalogListing } from "@/components/catalog/Tickets";
import { usePublicMeta } from "@/components/public/PublicMeta";
import { usePublicLocale } from "@/contexts/PublicLocaleContext";
import { useSavedSalons } from "@/lib/deviceSaved";
import { trpc } from "@/lib/trpc";
import { BRAND } from "@shared/brand";
import { Trash2 } from "lucide-react";
import { Link } from "wouter";

export const ui = {
  ka: { title: "ჩემი ადგილები", note: "ინახება მხოლოდ ამ მოწყობილობაზე.", emptyTitle: "ჯერ არაფერი შეგინახავს.", emptyBody: "გულის ნიშანზე დააჭირე და ადგილი აქ გამოჩნდება.", find: "ადგილის მოძებნა", loading: "იტვირთება…", failed: "ადგილები ვერ ჩაიტვირთა.", retry: "სცადე თავიდან", gone: "ეს ადგილები კატალოგში აღარ ჩანს:", remove: "სიიდან წაშლა", metaDescription: "ადგილები, რომლებიც ამ მოწყობილობაზე შეინახე." },
  en: { title: "Saved places", note: "Stored only on this device.", emptyTitle: "You have not saved anything yet.", emptyBody: "Tap the heart on a place and it will appear here.", find: "Find a place", loading: "Loading…", failed: "Could not load the places.", retry: "Try again", gone: "These places are no longer in the catalog:", remove: "Remove from list", metaDescription: "Places you saved on this device." },
  ru: { title: "Сохранённые места", note: "Хранится только на этом устройстве.", emptyTitle: "Вы пока ничего не сохранили.", emptyBody: "Нажмите на сердечко у места, и оно появится здесь.", find: "Найти место", loading: "Загрузка…", failed: "Не удалось загрузить места.", retry: "Повторить", gone: "Этих мест больше нет в каталоге:", remove: "Убрать из списка", metaDescription: "Места, которые вы сохранили на этом устройстве." },
} as const;

// shortcut: the directory call returns at most 100 listings and is matched by slug on the client; add a by-slugs query if the catalog outgrows that.
const DIRECTORY_LIMIT = 100;

export default function Saved() {
  const { locale } = usePublicLocale();
  const text = ui[locale];
  const { slugs, remove } = useSavedSalons();
  usePublicMeta({ title: `${text.title} | ${BRAND.name}`, description: text.metaDescription, canonicalPath: "/saved", robots: "noindex,nofollow" });
  const directory = trpc.marketplace.directory.useQuery({ limit: DIRECTORY_LIMIT, offset: 0 }, { enabled: slugs.length > 0 });
  const items = (directory.data?.items ?? []) as CatalogListing[];
  const found = slugs.map(slug => items.find(item => item.publicSlug === slug)).filter((item): item is CatalogListing => Boolean(item));
  const complete = directory.isSuccess && (directory.data?.total ?? 0) <= DIRECTORY_LIMIT;
  const gone = complete ? slugs.filter(slug => !items.some(item => item.publicSlug === slug)) : [];

  return <div className="cw min-h-screen">
    <CatalogHeader />
    <main id="main-content" tabIndex={-1} className="cw-container">
      <div className="cw-page-head">
        <h1>{text.title}</h1>
        <p className="cw-page-note">{text.note}</p>
      </div>
      {slugs.length === 0
        ? <div className="cw-device-empty">
          <h2>{text.emptyTitle}</h2>
          <p>{text.emptyBody}</p>
          <Link href="/salons" className="cw-btn cw-btn-stamp mt-2 min-h-11">{text.find}</Link>
        </div>
        : directory.isLoading ? <p role="status" className="cw-page-note pb-12">{text.loading}</p>
        : directory.isError ? <div role="alert" className="cw-device-empty"><h2>{text.failed}</h2><button type="button" className="cw-btn cw-btn-line min-h-11" onClick={() => directory.refetch()}>{text.retry}</button></div>
        : <>
          {found.length ? <div className="pb-12"><SalonGrid items={found} /></div> : null}
          {gone.length ? <div className="cw-device-empty">
            <p>{text.gone}</p>
            <ul className="grid gap-1">{gone.map(slug => <li key={slug} className="flex flex-wrap items-center gap-2"><span className="font-semibold">{slug}</span><button type="button" className="cw-device-remove" onClick={() => remove(slug)}><Trash2 className="size-4" aria-hidden="true" />{text.remove}</button></li>)}</ul>
          </div> : null}
        </>}
    </main>
    <CatalogFooter />
  </div>;
}
