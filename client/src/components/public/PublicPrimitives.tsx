import { Button } from "@/components/ui/button";
import { CalendarDays, Menu, Sparkles, X } from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";

const navigation = [
  { href: "/#features", label: "შესაძლებლობები" },
  { href: "/#how-it-works", label: "როგორ მუშაობს" },
  { href: "/#faq", label: "კითხვები" },
  { href: "/#contact", label: "კონტაქტი" },
];

export function SalonFlowMark({ inverted = false }: { inverted?: boolean }) {
  return <Link href="/" className="inline-flex items-center gap-2 rounded-lg font-semibold tracking-tight">
    <span className={`grid size-9 place-items-center rounded-xl ${inverted ? "bg-white/12 text-[var(--sf-terracotta)]" : "bg-[var(--sf-ink)] text-[var(--sf-canvas)]"}`}><CalendarDays className="size-4" aria-hidden="true" /></span>
    <span className="text-lg">SalonFlow</span>
  </Link>;
}

export function PublicHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  return <header className="relative z-30 border-b border-[color-mix(in_srgb,var(--sf-line)_72%,transparent)] bg-[color-mix(in_srgb,var(--sf-canvas)_86%,transparent)] backdrop-blur-xl">
    <div className="sf-public-container flex min-h-18 items-center justify-between gap-4 py-3">
      <SalonFlowMark />
      <nav className="hidden items-center gap-1 lg:flex" aria-label="მთავარი ნავიგაცია">{navigation.map(item => <a key={item.href} className="sf-interactive rounded-lg px-3 py-2 text-sm font-medium text-[var(--sf-muted)] hover:bg-[var(--sf-surface)] hover:text-[var(--sf-ink)]" href={item.href}>{item.label}</a>)}</nav>
      <div className="hidden items-center gap-2 sm:flex"><Button asChild variant="publicQuiet"><Link href="/login">შესვლა</Link></Button><Button asChild variant="public"><Link href="/register">დაიწყე უფასოდ</Link></Button></div>
      <Button type="button" variant="publicQuiet" size="icon" className="sm:hidden" aria-expanded={menuOpen} aria-controls="public-mobile-menu" aria-label={menuOpen ? "მენიუს დახურვა" : "მენიუს გახსნა"} onClick={() => setMenuOpen(open => !open)}>{menuOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}</Button>
    </div>
    {menuOpen ? <div id="public-mobile-menu" className="border-t border-[var(--sf-line)] bg-[var(--sf-surface)] sm:hidden"><nav className="sf-public-container grid gap-1 py-3" aria-label="მობილური მთავარი ნავიგაცია">{navigation.map(item => <a key={item.href} href={item.href} onClick={() => setMenuOpen(false)} className="rounded-lg px-3 py-3 text-sm font-semibold hover:bg-[var(--sf-canvas)]">{item.label}</a>)}<div className="mt-2 grid grid-cols-2 gap-2"><Button asChild variant="publicSecondary"><Link href="/login">შესვლა</Link></Button><Button asChild variant="public"><Link href="/register">დაიწყე</Link></Button></div></nav></div> : null}
  </header>;
}

export function PublicFooter() {
  return <footer id="contact" className="border-t border-white/10 bg-[var(--sf-ink)] text-[var(--sf-canvas)]"><div className="sf-public-container grid gap-8 py-10 md:grid-cols-[1.4fr_repeat(2,minmax(0,1fr))]"><div><SalonFlowMark inverted /><p className="mt-4 max-w-sm text-sm leading-6 text-white/68">მშვიდი, ქართული ოპერაციული სისტემა სალონის ყოველდღიური ჩაწერებისთვის, გუნდისთვის და კონტროლისთვის.</p></div><div><h2 className="text-sm font-semibold">პროდუქტი</h2><div className="mt-3 grid gap-2 text-sm text-white/68"><Link href="/book">ონლაინ ჩაწერა</Link><Link href="/register">სამუშაო სივრცის შექმნა</Link></div></div><div><h2 className="text-sm font-semibold">დახმარება</h2><div className="mt-3 grid gap-2 text-sm text-white/68"><a href="/#faq">ხშირი კითხვები</a><Link href="/login">სამუშაო სივრცეში შესვლა</Link></div></div></div><div className="border-t border-white/10"><div className="sf-public-container flex flex-wrap items-center justify-between gap-3 py-4 text-xs text-white/56"><span>ქართული ინტერფეისი · უსაფრთხო ადგილობრივი ანგარიში</span><span>© {new Date().getFullYear()} SalonFlow</span></div></div></footer>;
}

export function PublicEyebrow({ children }: { children: React.ReactNode }) {
  return <p className="sf-kicker inline-flex items-center gap-2"><Sparkles className="size-3.5" aria-hidden="true" />{children}</p>;
}
