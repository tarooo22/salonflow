import { useEffect } from "react";

type PublicMetaProps = { title: string; description: string; canonicalPath: string };

function upsertMeta(attribute: "name" | "property", key: string, content: string) {
  const selector = `meta[${attribute}="${key}"]`;
  const element = document.head.querySelector<HTMLMetaElement>(selector) ?? document.head.appendChild(document.createElement("meta"));
  element.setAttribute(attribute, key);
  element.content = content;
}

export function usePublicMeta({ title, description, canonicalPath }: PublicMetaProps) {
  useEffect(() => {
    document.title = title;
    upsertMeta("name", "description", description);
    upsertMeta("property", "og:title", title);
    upsertMeta("property", "og:description", description);
    const canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]') ?? document.head.appendChild(document.createElement("link"));
    canonical.rel = "canonical";
    canonical.href = new URL(canonicalPath, window.location.origin).toString();
  }, [title, description, canonicalPath]);
}
