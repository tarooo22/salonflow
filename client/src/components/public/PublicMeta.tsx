import { usePublicLocale } from "@/contexts/PublicLocaleContext";
import { BRAND } from "@shared/brand";
import { useEffect } from "react";

type PublicMetaProps = { title: string; description: string; canonicalPath: string; robots?: "index,follow" | "noindex,nofollow" };

function upsertMeta(attribute: "name" | "property", key: string, content: string) {
  const selector = `meta[${attribute}="${key}"]`;
  const element = document.head.querySelector<HTMLMetaElement>(selector) ?? document.head.appendChild(document.createElement("meta"));
  element.setAttribute(attribute, key);
  element.content = content;
}

const OG_LOCALES = { ka: "ka_GE", en: "en_US", ru: "ru_RU" } as const;

export function usePublicMeta({ title, description, canonicalPath, robots = "index,follow" }: PublicMetaProps) {
  const { locale } = usePublicLocale();
  useEffect(() => {
    document.title = title;
    upsertMeta("name", "description", description);
    upsertMeta("property", "og:title", title);
    upsertMeta("property", "og:description", description);
    upsertMeta("property", "og:type", "website");
    upsertMeta("property", "og:site_name", BRAND.name);
    upsertMeta("property", "og:locale", OG_LOCALES[locale]);
    upsertMeta("name", "twitter:card", "summary");
    upsertMeta("name", "twitter:title", title);
    upsertMeta("name", "twitter:description", description);
    upsertMeta("name", "robots", robots);
    const canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]') ?? document.head.appendChild(document.createElement("link"));
    canonical.rel = "canonical";
    canonical.href = new URL(canonicalPath, window.location.origin).toString();
  }, [title, description, canonicalPath, robots, locale]);
}
