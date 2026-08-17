type SalonProfile = {
  salon: {
    organizationName: string;
    publicSlug: string;
    name: string;
    address: string | null;
    phone: string | null;
    email: string | null;
    publicDescription: string | null;
    bookingEnabled: boolean;
    coverImageUrl: string | null;
    coverImageAltKa: string | null;
  };
  services: Array<{ id: string; nameKa: string; description: string | null; durationMinutes: number; priceTetri: number; isFromPrice: boolean; categoryNameKa: string }>;
  team: Array<{ id: string; name: string; bio: string | null; jobTitle: string | null; specialty: string | null; avatarUrl: string | null; avatarAltKa: string | null }>;
  feed: Array<{ id: string; titleKa: string | null; captionKa: string | null; altTextKa: string; mediaUrl: string }>;
  gallery: Array<{ id: string; before: { mediaUrl: string; altTextKa: string | null } | null; after: { mediaUrl: string; altTextKa: string | null } | null }>;
};

const escapeHtml = (value: string | null | undefined) => (value ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
const escapeJson = (value: unknown) => JSON.stringify(value).replace(/</g, "\\u003c");
const metaText = (value: string | null | undefined, max = 180) => (value ?? "").replace(/\s+/g, " ").trim().slice(0, max);
const gel = (tetri: number) => new Intl.NumberFormat("ka-GE", { style: "currency", currency: "GEL" }).format(tetri / 100);

function absoluteUrl(origin: string, value: string | null) {
  if (!value) return null;
  return value.startsWith("/") ? `${origin}${value}` : value;
}

export function renderPublicSalonProfileHead(profile: SalonProfile, origin: string) {
  const title = `${profile.salon.name} | SalonFlow`;
  const description = metaText(profile.salon.publicDescription || `${profile.salon.name} — სალონის მომსახურებები, გუნდი და ონლაინ ჩაწერა.`);
  const canonical = `${origin}/salon/${encodeURIComponent(profile.salon.publicSlug)}`;
  const image = absoluteUrl(origin, profile.salon.coverImageUrl);
  const tags = [
    `<title>${escapeHtml(title)}</title>`,
    `<meta name="description" content="${escapeHtml(description)}" />`,
    `<link rel="canonical" href="${escapeHtml(canonical)}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:locale" content="ka_GE" />`,
    `<meta property="og:title" content="${escapeHtml(title)}" />`,
    `<meta property="og:description" content="${escapeHtml(description)}" />`,
    `<meta property="og:url" content="${escapeHtml(canonical)}" />`,
    `<meta property="og:site_name" content="SalonFlow" />`,
    `<meta name="twitter:card" content="${image ? "summary_large_image" : "summary"}" />`,
    `<meta name="twitter:title" content="${escapeHtml(title)}" />`,
    `<meta name="twitter:description" content="${escapeHtml(description)}" />`,
  ];
  if (image) tags.push(`<meta property="og:image" content="${escapeHtml(image)}" />`, `<meta name="twitter:image" content="${escapeHtml(image)}" />`, `<meta property="og:image:alt" content="${escapeHtml(profile.salon.coverImageAltKa || `${profile.salon.name}-ის cover ფოტო`)}" />`);
  return tags.join("\n");
}

export function renderPublicSalonProfileSnapshot(profile: SalonProfile, origin: string) {
  const { salon } = profile;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BeautySalon",
    name: salon.name,
    description: metaText(salon.publicDescription),
    url: `${origin}/salon/${encodeURIComponent(salon.publicSlug)}`,
    image: absoluteUrl(origin, salon.coverImageUrl) ?? undefined,
    telephone: salon.phone ?? undefined,
    email: salon.email ?? undefined,
    address: salon.address ? { "@type": "PostalAddress", streetAddress: salon.address, addressCountry: "GE" } : undefined,
    priceRange: profile.services.length ? "₾" : undefined,
  };
  const hero = salon.coverImageUrl ? `<img src="${escapeHtml(salon.coverImageUrl)}" alt="${escapeHtml(salon.coverImageAltKa || `${salon.name}-ის cover ფოტო`)}" class="absolute inset-0 h-full w-full object-cover opacity-30" />` : "";
  const services = profile.services.length ? profile.services.map(service => `<article class="flex flex-col gap-2 border-b border-border/70 p-4 sm:flex-row sm:items-center sm:justify-between"><div><h3 class="font-semibold">${escapeHtml(service.nameKa)}</h3><p class="mt-1 text-sm text-muted-foreground">${escapeHtml(service.categoryNameKa)}${service.description ? ` · ${escapeHtml(service.description)}` : ""}</p></div><p class="font-semibold">${service.isFromPrice ? "დან " : ""}${escapeHtml(gel(service.priceTetri))} · ${service.durationMinutes} წთ</p></article>`).join("") : `<p class="p-4 text-sm text-muted-foreground">საჯარო მომსახურებები ჯერ არ არის დამატებული.</p>`;
  const team = profile.team.length ? profile.team.map(member => `<article class="rounded-2xl border bg-card/45 p-4"><div class="flex items-center gap-3">${member.avatarUrl ? `<img src="${escapeHtml(member.avatarUrl)}" alt="${escapeHtml(member.avatarAltKa || `${member.name}-ის ავატარი`)}" class="size-14 rounded-2xl object-cover" />` : ""}<div><h3 class="font-semibold">${escapeHtml(member.name)}</h3><p class="text-sm text-muted-foreground">${escapeHtml(member.jobTitle || member.specialty || "სპეციალისტი")}</p></div></div>${member.bio ? `<p class="mt-3 text-sm leading-6 text-muted-foreground">${escapeHtml(member.bio)}</p>` : ""}</article>`).join("") : `<p class="text-sm text-muted-foreground">საჯარო გუნდის პროფილები ჯერ არ არის დამატებული.</p>`;
  const feed = profile.feed.map(post => `<article class="overflow-hidden rounded-2xl border bg-card/45"><img src="${escapeHtml(post.mediaUrl)}" alt="${escapeHtml(post.altTextKa)}" class="w-full object-cover" />${post.titleKa || post.captionKa ? `<div class="p-4">${post.titleKa ? `<h3 class="font-semibold">${escapeHtml(post.titleKa)}</h3>` : ""}${post.captionKa ? `<p class="mt-2 text-sm leading-6 text-muted-foreground">${escapeHtml(post.captionKa)}</p>` : ""}</div>` : ""}</article>`).join("");
  const gallery = profile.gallery.filter(entry => entry.before && entry.after).map(entry => `<article class="grid grid-cols-2 overflow-hidden rounded-2xl border"><figure><img src="${escapeHtml(entry.before!.mediaUrl)}" alt="${escapeHtml(entry.before!.altTextKa || "მომსახურებამდე შედეგი")}" class="aspect-square w-full object-cover" /><figcaption class="p-2 text-xs text-muted-foreground">მანამდე</figcaption></figure><figure><img src="${escapeHtml(entry.after!.mediaUrl)}" alt="${escapeHtml(entry.after!.altTextKa || "მომსახურების შემდეგ შედეგი")}" class="aspect-square w-full object-cover" /><figcaption class="p-2 text-xs text-muted-foreground">შემდეგ</figcaption></figure></article>`).join("");
  return `<main class="sf-public-page min-h-screen"><section class="relative overflow-hidden border-b border-border/70"><div class="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgb(210_72_171_/_0.16),transparent_36%)]"></div>${hero}<div class="container relative py-14 sm:py-20"><p class="text-sm font-semibold text-primary">${escapeHtml(salon.organizationName)}</p><h1 class="mt-3 text-4xl font-semibold tracking-tight sm:text-6xl">${escapeHtml(salon.name)}</h1><p class="mt-5 max-w-2xl text-base leading-7 text-muted-foreground">${escapeHtml(salon.publicDescription || "სალონის აღწერა მალე დაემატება.")}</p>${salon.address ? `<p class="mt-4 text-sm text-muted-foreground">${escapeHtml(salon.address)}</p>` : ""}${salon.bookingEnabled ? `<a class="mt-6 inline-flex min-h-11 items-center rounded-xl bg-primary px-5 py-3 font-semibold text-primary-foreground" href="/book/${encodeURIComponent(salon.publicSlug)}">ონლაინ ჩაწერა</a>` : ""}</div></section><div class="container space-y-14 py-12"><section><p class="text-sm font-semibold text-primary">ფასების ცხრილი</p><h2 class="mt-2 text-3xl font-semibold">მომსახურებები და ფასები</h2><div class="mt-6 overflow-hidden rounded-2xl border">${services}</div></section><section><p class="text-sm font-semibold text-primary">ჩვენი გუნდი</p><h2 class="mt-2 text-3xl font-semibold">გაიცანით სპეციალისტები</h2><div class="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">${team}</div></section>${gallery ? `<section><p class="text-sm font-semibold text-primary">დადასტურებული შედეგები</p><h2 class="mt-2 text-3xl font-semibold">Before / after</h2><div class="mt-6 grid gap-4 md:grid-cols-2">${gallery}</div></section>` : ""}${feed ? `<section><p class="text-sm font-semibold text-primary">სალონის დღიური</p><h2 class="mt-2 text-3xl font-semibold">ახალი feed</h2><div class="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">${feed}</div></section>` : ""}</div><script type="application/ld+json">${escapeJson(jsonLd)}</script></main>`;
}
