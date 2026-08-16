import { useEffect, useRef } from "react";

/**
 * Scroll-reveal: adds `sf-revealed` to `.sf-reveal` descendants (and the root
 * itself) as they enter the viewport. Respects `prefers-reduced-motion` by
 * revealing everything immediately. Returns a ref to attach to a container.
 */
export function useReveal<T extends HTMLElement = HTMLDivElement>() {
  const ref = useRef<T>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;

    const targets = new Set<Element>();
    if (root.classList.contains("sf-reveal")) targets.add(root);
    root.querySelectorAll(".sf-reveal").forEach(el => targets.add(el));
    if (targets.size === 0) return;

    if (typeof IntersectionObserver === "undefined" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      targets.forEach(el => el.classList.add("sf-revealed"));
      return;
    }

    const observer = new IntersectionObserver(
      entries => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("sf-revealed");
            observer.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );

    targets.forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return ref;
}
