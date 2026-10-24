import { motion, useInView, useReducedMotionConfig, type Variants } from "framer-motion";
import { type ReactNode, useLayoutEffect, useRef, useState } from "react";

/* The home page's one motion system. Hover lifts and image zoom live in discovery.css with the same ease;
   everything that moves on mount or scroll is here; nothing loops. Content is visible by default: sections only
   hide (instantly, before paint) when they start below the fold, and show once they scroll in. With
   prefers-reduced-motion (or a MotionConfig reducedMotion="always" from the panel setting) every wrapper renders its plain element and nothing transforms. */

export const EASE = [0.2, 0, 0, 1] as const;
const ENTER = { duration: 0.5, ease: EASE };

const groupTags = { div: motion.div, ul: motion.ul } as const;
const itemTags = { div: motion.div, li: motion.li } as const;
const plainGroup = { div: "div", ul: "ul" } as const;
const plainItem = { div: "div", li: "li" } as const;

const groupVariants: Variants = {
  hide: { transition: { duration: 0 } },
  show: { transition: { staggerChildren: 0.07 } },
};
const itemVariants: Variants = {
  hide: { opacity: 0, y: 16, transition: { duration: 0 } },
  show: { opacity: 1, y: 0, transition: ENTER },
};

type Props = { as?: "div" | "ul" | "li"; className?: string; children: ReactNode };

/** Reveals its RevealItem children once, staggered, when it scrolls into view. */
export function RevealGroup({ as = "div", className, children }: Props & { as?: "div" | "ul" }) {
  const reduce = useReducedMotionConfig();
  const ref = useRef<HTMLElement>(null);
  const seen = useInView(ref, { once: true, margin: "0px 0px -8% 0px" });
  const [belowFold, setBelowFold] = useState(false);
  useLayoutEffect(() => {
    const rect = ref.current?.getBoundingClientRect();
    if (rect && rect.top > window.innerHeight) setBelowFold(true);
  }, []);
  if (reduce) {
    const Plain = plainGroup[as];
    return <Plain className={className}>{children}</Plain>;
  }
  const Tag = groupTags[as];
  return <Tag ref={ref as never} className={className} variants={groupVariants} initial={false} animate={belowFold && !seen ? "hide" : "show"}>{children}</Tag>;
}

export function RevealItem({ as = "div", className, children }: Props & { as?: "div" | "li" }) {
  const reduce = useReducedMotionConfig();
  if (reduce) {
    const Plain = plainItem[as];
    return <Plain className={className}>{children}</Plain>;
  }
  const Tag = itemTags[as];
  return <Tag className={className} variants={itemVariants}>{children}</Tag>;
}

/** Hero text and search: staggered rise on mount, never fully transparent. */
export function HeroIn({ delay = 0, className, children }: { delay?: number; className?: string; children: ReactNode }) {
  const reduce = useReducedMotionConfig();
  if (reduce) return <div className={className}>{children}</div>;
  return <motion.div className={className} initial={{ opacity: 0.35, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ ...ENTER, delay }}>{children}</motion.div>;
}

/** Hero photo settles from 1.04 to 1. */
export function HeroPhoto({ className, children }: { className?: string; children: ReactNode }) {
  const reduce = useReducedMotionConfig();
  if (reduce) return <div className={className}>{children}</div>;
  return <motion.div className={className} initial={{ scale: 1.04 }} animate={{ scale: 1 }} transition={{ duration: 0.6, ease: EASE }}>{children}</motion.div>;
}

/** Hero chip: fades in once after the text. `period` is accepted for old callers and ignored (no looping). */
export function Float({ delay = 0, className, children }: { delay?: number; period?: number; className?: string; children: ReactNode }) {
  const reduce = useReducedMotionConfig();
  if (reduce) return <div className={className}>{children}</div>;
  return <motion.div className={className} initial={{ opacity: 0.35, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ ...ENTER, delay: 0.5 + delay }}>{children}</motion.div>;
}
