import { Link, useRoute } from "wouter";
import { CalendarDays, ChevronRight, ExternalLink, Instagram, MapPin, Phone, Sparkles, Star, UsersRound } from "lucide-react";
import { useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { WorkspaceState } from "@/components/workspace/WorkspacePrimitives";
import { PublicLanguageSelector } from "@/components/public/PublicPrimitives";
import { usePublicLocale } from "@/contexts/PublicLocaleContext";

const labels = {
  ka: { loading: "სალონის გვერდი იტვირთება…", unavailable: "სალონის გვერდი დროებით მიუწვდომელია", retry: "შეამოწმეთ კავშირი და სცადეთ მოგვიანებით.", missing: "სალონი ვერ მოიძებნა", missingLead: "ბმული შეიძლება შეიცვალა ან გვერდი აღარ არის ხელმისაწვდომი.", all: "სალონების ნახვა", noDescription: "სალონის აღწერა მალე დაემატება.", book: "ონლაინ ჩაწერა", bookingPaused: "ონლაინ ჩაწერა ამ სალონისთვის დროებით მიუწვდომელია. ინფორმაცია და საჯარო გვერდი შენარჩუნებულია; დეტალებისთვის დაუკავშირდით სალონს.", website: "ვებგვერდი", priceList: "ფასების ცხრილი", services: "მომსახურებები და ფასები", reserve: "დაჯავშნა", minutes: "წთ", from: "დან ", noServices: "საჯარო მომსახურებები ჯერ არ არის დამატებული.", team: "ჩვენი გუნდი", meetTeam: "გაიცანით სპეციალისტები", specialist: "სპეციალისტი", noTeam: "საჯარო გუნდის პროფილები ჯერ არ არის დამატებული.", results: "დადასტურებული შედეგები", beforeAfter: "Before / after", consent: "აქ ჩანს მხოლოდ კლიენტის ცალკე თანხმობით საჯაროდ გამოქვეყნებული შედეგები.", before: "მანამდე", after: "შემდეგ", diary: "სალონის დღიური", latest: "ახალი feed", soon: "სალონის ვიზუალური ამბები მალე დაემატება.", approved: "ამ გვერდზე გამოჩნდება მხოლოდ მფლობელის ან მენეჯერის მიერ დამტკიცებული public მასალა." },
  en: { loading: "Loading salon profile…", unavailable: "The salon profile is temporarily unavailable", retry: "Check your connection and try again later.", missing: "Salon not found", missingLead: "The link may have changed or the page is no longer available.", all: "View salons", noDescription: "A salon description will be added soon.", book: "Book online", bookingPaused: "Online booking is temporarily unavailable. The salon profile remains available; please contact the salon for details.", website: "Website", priceList: "Price list", services: "Services and prices", reserve: "Book now", minutes: "min", from: "From ", noServices: "No public services have been added yet.", team: "Our team", meetTeam: "Meet the specialists", specialist: "Specialist", noTeam: "No public team profiles have been added yet.", results: "Approved results", beforeAfter: "Before / after", consent: "Only results published with a client's separate consent are shown here.", before: "Before", after: "After", diary: "Salon journal", latest: "Latest feed", soon: "The salon's visual stories will be added soon.", approved: "Only public material approved by the owner or manager is shown on this page." },
  ru: { loading: "Загрузка страницы салона…", unavailable: "Страница салона временно недоступна", retry: "Проверьте подключение и попробуйте позже.", missing: "Салон не найден", missingLead: "Ссылка могла измениться или страница больше не доступна.", all: "Все салоны", noDescription: "Описание салона будет добавлено позже.", book: "Онлайн-запись", bookingPaused: "Онлайн-запись временно недоступна. Профиль салона остаётся доступным; свяжитесь с салоном для деталей.", website: "Сайт", priceList: "Прайс-лист", services: "Услуги и цены", reserve: "Записаться", minutes: "мин", from: "От ", noServices: "Публичные услуги ещё не добавлены.", team: "Наша команда", meetTeam: "Познакомьтесь со специалистами", specialist: "Специалист", noTeam: "Публичные профили команды ещё не добавлены.", results: "Подтверждённые результаты", beforeAfter: "До / после", consent: "Здесь показаны только результаты, опубликованные с отдельного согласия клиента.", before: "До", after: "После", diary: "Дневник салона", latest: "Новые публикации", soon: "Визуальные истории салона будут добавлены позже.", approved: "На этой странице показываются только публичные материалы, одобренные владельцем или менеджером." },
} as const;

const bookingPathLabels = {
  ka: { title: "ჩაწერის გზა", steps: ["სერვისი", "სპეციალისტი", "დრო", "დაცული მოთხოვნა"] },
  en: { title: "Booking path", steps: ["Service", "Specialist", "Time", "Secure request"] },
  ru: { title: "Путь записи", steps: ["Услуга", "Специалист", "Время", "Защищённая заявка"] },
} as const;

export default function SalonProfile() {
  const [, params] = useRoute("/salon/:slug");
  const slug = params?.slug ?? "";
  const { locale } = usePublicLocale();
  const ui = labels[locale];
  const bookingPath = bookingPathLabels[locale];
  const profile = trpc.public.salonProfile.useQuery(slug, { enabled: Boolean(slug) });
  const marketplace = trpc.marketplace.listingBySlug.useQuery(slug, { enabled: Boolean(slug) });
  const money = (tetri: number) => new Intl.NumberFormat(locale === "ka" ? "ka-GE" : locale === "ru" ? "ru-RU" : "en-US", { style: "currency", currency: "GEL" }).format(tetri / 100);

  useEffect(() => { if (profile.data) document.title = `${profile.data.salon.name} | SalonFlow`; }, [profile.data]);

  if (profile.isLoading) return <main className="sf-public-page grid min-h-screen place-items-center px-4"><WorkspaceState kind="loading" title={ui.loading} /></main>;
  if (profile.isError) return <main className="sf-public-page grid min-h-screen place-items-center px-4"><WorkspaceState kind="error" title={ui.unavailable} description={ui.retry} /></main>;
  if (!profile.data) return <main className="sf-public-page grid min-h-screen place-items-center px-4"><WorkspaceState kind="empty" title={ui.missing} description={ui.missingLead} action={<Link href="/book"><Button>{ui.all}</Button></Link>} /></main>;

  const { salon, services, team, feed, gallery, feedback } = profile.data;
  const social = salon.socialLinks ?? {};
  const marketplaceListing = marketplace.data;

  return <main className="sf-public-page min-h-screen">
    <header className="sticky top-0 z-30 border-b border-[var(--sf-salon-hairline)] bg-[color-mix(in_srgb,var(--sf-bg)_84%,transparent)] backdrop-blur-xl">
      <div className="sf-public-container flex min-h-18 items-center justify-between gap-3 py-3">
        <Link href="/" className="flex items-center gap-2 font-semibold"><span className="sf-brand-mark" aria-hidden="true"><i /><i /><i /></span>SalonFlow</Link>
        <div className="flex items-center gap-2"><PublicLanguageSelector /><Link href="/book"><Button variant="publicSecondary" size="sm">{ui.all}</Button></Link></div>
      </div>
    </header>

    <section className="sf-salon-section sf-salon-media-frame relative border-b border-[var(--sf-salon-hairline)]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,color-mix(in_srgb,var(--sf-salon-warm)_20%,transparent),transparent_38%),radial-gradient(circle_at_80%_20%,color-mix(in_srgb,var(--sf-teal)_16%,transparent),transparent_32%)]" />
      {salon.coverImageUrl ? <img src={salon.coverImageUrl} alt={salon.coverImageAltKa || `${salon.name} cover`} className="absolute inset-0 h-full w-full object-cover opacity-25" /> : null}
      <div className="sf-public-container relative py-14 sm:py-20">
        <p className="sf-salon-eyebrow">{salon.organizationName}</p>
        <h1 className="sf-display mt-4 max-w-3xl text-4xl font-semibold tracking-tight sm:text-6xl">{salon.name}</h1>
        <p className="mt-5 max-w-2xl text-base leading-7 text-[var(--sf-muted)]">{salon.publicDescription || ui.noDescription}</p>
        {marketplaceListing?.categories.length ? <div className="mt-5 flex flex-wrap gap-2">{marketplaceListing.categories.map(category => <span key={category.id} className="rounded-full border border-[var(--sf-salon-hairline)] bg-[color-mix(in_srgb,var(--sf-surface)_74%,transparent)] px-3 py-1.5 text-xs font-semibold">{category.nameKa}</span>)}{marketplaceListing.promotion ? <span className="rounded-full bg-[var(--sf-fuchsia)] px-3 py-1.5 text-xs font-bold text-white">{marketplaceListing.promotion.disclosure}</span> : null}</div> : null}
        <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm text-[var(--sf-muted)]">
          {salon.address ? <span className="inline-flex items-center gap-2"><MapPin className="size-4 text-[var(--sf-salon-warm)]" />{salon.address}</span> : null}
          {salon.phone ? <a href={`tel:${salon.phone}`} className="inline-flex items-center gap-2 hover:text-[var(--sf-ink)]"><Phone className="size-4 text-[var(--sf-salon-warm)]" />{salon.phone}</a> : null}
        </div>
        <div className="sf-salon-cta-row mt-8">
          {salon.bookingEnabled ? <Link href={`/book/${salon.publicSlug}`}><Button variant="public" size="lg"><CalendarDays className="mr-2 size-4" />{ui.book}</Button></Link> : null}
          {social.instagram ? <a href={social.instagram} target="_blank" rel="noreferrer"><Button size="lg" variant="publicSecondary"><Instagram className="mr-2 size-4" />Instagram</Button></a> : null}
          {social.website ? <a href={social.website} target="_blank" rel="noreferrer"><Button size="lg" variant="publicSecondary"><ExternalLink className="mr-2 size-4" />{ui.website}</Button></a> : null}
        </div>
        {salon.bookingUnavailableReason === "TRIAL_EXPIRED" ? <p className="mt-5 max-w-3xl rounded-xl border border-[color-mix(in_srgb,var(--sf-salon-warm)_35%,transparent)] bg-[color-mix(in_srgb,var(--sf-salon-warm)_8%,transparent)] p-4 text-sm leading-6 text-[var(--sf-muted)]" role="status">{locale === "ka" ? ui.bookingPaused : "Online booking is temporarily unavailable. The salon profile remains available; please contact the salon for details."}</p> : null}
        {salon.bookingEnabled ? <div className="sf-salon-note mt-8 max-w-3xl"><CalendarDays className="mt-0.5 size-4 shrink-0 text-[var(--sf-salon-warm)]" aria-hidden="true" /><div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--sf-salon-warm)]">{bookingPath.title}</p><ol className="mt-3 grid gap-2 sm:grid-cols-4">{bookingPath.steps.map((item, index) => <li key={item} className="flex items-center gap-2 text-sm"><span className="grid size-6 shrink-0 place-items-center rounded-full bg-[color-mix(in_srgb,var(--sf-salon-warm)_16%,transparent)] text-xs font-bold text-[var(--sf-salon-warm)]">{index + 1}</span>{item}</li>)}</ol></div></div> : null}
      </div>
    </section>

    <div className="sf-public-container space-y-16 py-12 sm:py-16">
      <section>
        <SectionHeading eyebrow={ui.priceList} title={ui.services} action={salon.bookingEnabled ? <Link href={`/book/${salon.publicSlug}`} className="hidden sm:inline-flex"><Button variant="publicSecondary">{ui.reserve}<ChevronRight className="ml-1 size-4" /></Button></Link> : null} />
        <div className="sf-salon-panel mt-6 overflow-hidden"><div className="divide-y divide-[var(--sf-salon-hairline)]">{services.map(service => <article key={service.id} className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-semibold">{service.nameKa}</p><p className="mt-1 text-sm text-[var(--sf-muted)]">{service.categoryNameKa}{service.description ? ` · ${service.description}` : ""}</p></div><div className="flex items-center gap-4 text-sm"><span className="text-[var(--sf-muted)]">{service.durationMinutes} {ui.minutes}</span><span className="font-semibold text-[var(--sf-salon-warm)]">{service.isFromPrice ? ui.from : ""}{money(service.priceTetri)}</span></div></article>)}{!services.length ? <p className="p-5 text-sm text-[var(--sf-muted)]">{ui.noServices}</p> : null}</div></div>
      </section>

      <section className="sf-salon-section -mx-4 px-4 py-12 sm:-mx-6 sm:px-6">
        <div className="sf-public-container"><SectionHeading eyebrow={ui.team} title={ui.meetTeam} />
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{team.map(member => <article key={member.id} className="sf-salon-panel p-5"><div className="flex items-center gap-4">{member.avatarUrl ? <img src={member.avatarUrl} alt={member.avatarAltKa || `${member.name} avatar`} className="size-14 rounded-2xl object-cover" loading="lazy" /> : <div className="grid size-14 place-items-center rounded-2xl bg-[color-mix(in_srgb,var(--sf-salon-warm)_12%,transparent)] text-[var(--sf-salon-warm)]"><UsersRound className="size-6" /></div>}<div><p className="font-semibold">{member.name}</p><p className="text-sm text-[var(--sf-muted)]">{member.jobTitle || member.specialty || ui.specialist}</p></div></div>{member.bio ? <p className="mt-4 text-sm leading-6 text-[var(--sf-muted)]">{member.bio}</p> : null}{member.experienceYears ? <p className="mt-3 text-xs font-semibold text-[var(--sf-salon-leaf)]">{member.experienceYears} {locale === "ka" ? "წლის გამოცდილება" : locale === "ru" ? "лет опыта" : "years of experience"}</p> : null}</article>)}{!team.length ? <p className="sf-salon-panel border-dashed p-5 text-sm text-[var(--sf-muted)] sm:col-span-2 lg:col-span-3">{ui.noTeam}</p> : null}</div>
        </div>
      </section>

      <section>
        <SectionHeading eyebrow={locale === "ka" ? "კლიენტების შეფასებები" : locale === "ru" ? "Отзывы клиентов" : "Client feedback"} title={locale === "ka" ? "დადასტურებული ვიზიტების უკუკავშირი" : locale === "ru" ? "Отзывы подтверждённых визитов" : "Feedback from verified visits"} />
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--sf-muted)]">{locale === "ka" ? "უკუკავშირს ტოვებს მხოლოდ დასრულებული ვიზიტის კლიენტი; გამოქვეყნებამდე იგი გადის მოდერაციას." : locale === "ru" ? "Отзыв может оставить только клиент после завершённого визита; каждая публикация проходит модерацию." : "Only a client with a completed visit can submit feedback, and every submission is moderated before publication."}</p>
        {feedback.length ? <div className="mt-6 grid gap-4 md:grid-cols-2">{feedback.map(item => <article key={item.id} className="sf-salon-panel p-5"><div className="flex items-center justify-between gap-3"><p className="font-semibold">{item.authorName}</p><div className="flex items-center gap-0.5 text-[var(--sf-salon-warm)]" aria-label={`${item.rating} / 5`}><Star className="size-4 fill-current" aria-hidden="true" /><span className="ml-1 text-sm font-semibold">{item.rating}/5</span></div></div><p className="mt-3 text-sm leading-6 text-[var(--sf-muted)]">{item.comment}</p><p className="mt-4 text-xs font-medium text-[var(--sf-muted)]">{new Intl.DateTimeFormat(locale === "ka" ? "ka-GE" : locale === "ru" ? "ru-RU" : "en-US", { day: "numeric", month: "long", year: "numeric" }).format(new Date(item.submittedAt))}</p></article>)}</div> : <div className="sf-salon-panel mt-6 border-dashed p-6 text-sm leading-6 text-[var(--sf-muted)]">{locale === "ka" ? "დამტკიცებული შეფასებები ჯერ არ გამოჩენილა." : locale === "ru" ? "Одобренных отзывов пока нет." : "No approved feedback has been published yet."}</div>}
      </section>

      {gallery.length ? <section><SectionHeading eyebrow={ui.results} title={ui.beforeAfter} /><p className="mt-2 text-sm text-[var(--sf-muted)]">{ui.consent}</p><div className="mt-6 grid gap-4 md:grid-cols-2">{gallery.map(item => <article key={item.id} className="sf-salon-panel overflow-hidden"><div className="grid grid-cols-2">{item.before ? <figure><img src={item.before.mediaUrl} alt={item.before.altTextKa || ui.before} className="aspect-square w-full object-cover" loading="lazy" /><figcaption className="px-3 py-2 text-xs text-[var(--sf-muted)]">{ui.before}</figcaption></figure> : null}{item.after ? <figure><img src={item.after.mediaUrl} alt={item.after.altTextKa || ui.after} className="aspect-square w-full object-cover" loading="lazy" /><figcaption className="px-3 py-2 text-xs text-[var(--sf-muted)]">{ui.after}</figcaption></figure> : null}</div></article>)}</div></section> : null}

      {feed.length ? <section><SectionHeading eyebrow={ui.diary} title={ui.latest} /><div className="mt-6 columns-1 gap-4 sm:columns-2 lg:columns-3">{feed.map(post => <article key={post.id} className="sf-salon-panel mb-4 break-inside-avoid overflow-hidden"><img src={post.mediaUrl} alt={post.altTextKa} className="w-full object-cover" loading="lazy" />{post.titleKa || post.captionKa ? <div className="p-4">{post.titleKa ? <h3 className="font-semibold">{post.titleKa}</h3> : null}{post.captionKa ? <p className="mt-2 text-sm leading-6 text-[var(--sf-muted)]">{post.captionKa}</p> : null}</div> : null}</article>)}</div></section> : null}

      {!feed.length && !gallery.length ? <section className="sf-salon-panel border-dashed p-6 text-center"><Sparkles className="mx-auto size-6 text-[var(--sf-salon-warm)]" /><p className="mt-3 font-semibold">{ui.soon}</p><p className="mt-1 text-sm text-[var(--sf-muted)]">{ui.approved}</p></section> : null}
    </div>
  </main>;
}

function SectionHeading({ eyebrow, title, action }: { eyebrow: string; title: string; action?: React.ReactNode }) {
  return <div className="flex items-end justify-between gap-4"><div><p className="sf-salon-eyebrow">{eyebrow}</p><h2 className="mt-3 text-3xl font-semibold">{title}</h2></div>{action}</div>;
}
