import { Button } from "@/components/ui/button";
import { CalendarCheck2, ChevronRight, Clock3, ShieldCheck, Sparkles, UsersRound } from "lucide-react";
import { Link } from "wouter";

const pillars = [
  { icon: CalendarCheck2, title: "ჭკვიანი ჯავშანი", text: "რეალური ხელმისაწვდომობა, დროის ბუფერები და დაცული დადასტურება." },
  { icon: UsersRound, title: "გუნდის რიტმი", text: "ინდივიდუალური გრაფიკები, გამონაკლისები და ერთი საერთო კალენდარი." },
  { icon: ShieldCheck, title: "სანდო ოპერაციები", text: "როლებზე დაფუძნებული წვდომა, ისტორიული ჩანაწერები და უსაფრთხო ფინანსური აღრიცხვა." },
];

export default function Home() {
  return <div className="min-h-screen bg-[#F7F4EF] text-[#1E2824]">
    <header className="mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-5 sm:px-8">
      <Link href="/" className="font-serif text-2xl font-semibold tracking-tight">SalonFlow</Link>
      <div className="flex items-center gap-3"><Link href="/login" className="hidden text-sm font-medium text-[#45514B] sm:block">სამუშაო სივრცე</Link><Button asChild className="bg-[#B85C3D] hover:bg-[#9D4C31]"><Link href="/login">შესვლა</Link></Button></div>
    </header>
    <main>
      <section className="mx-auto grid max-w-7xl gap-12 px-5 pb-20 pt-12 sm:px-8 lg:grid-cols-[1.15fr_.85fr] lg:items-center lg:pb-28 lg:pt-20">
        <div><p className="mb-5 flex items-center gap-2 text-sm font-semibold text-[#B85C3D]"><Sparkles className="h-4 w-4" /> სალონის ყოველდღიური რიტმისთვის</p><h1 className="max-w-3xl font-serif text-5xl font-semibold leading-[1.04] tracking-tight sm:text-6xl">მეტი დრო სტუმრებისთვის. ნაკლები დრო ქაოსისთვის.</h1><p className="mt-7 max-w-xl text-lg leading-8 text-[#526059]">SalonFlow აერთიანებს ონლაინ ჩაწერას, კალენდარს, კლიენტებს, გადახდებსა და ანალიტიკას მშვიდ, დაცულ სამუშაო სივრცეში.</p><div className="mt-9 flex flex-col gap-3 sm:flex-row"><Button asChild size="lg" className="bg-[#B85C3D] hover:bg-[#9D4C31]"><Link href="/register">სამუშაო სივრცის გახსნა <ChevronRight className="ml-1 h-4 w-4" /></Link></Button><Button asChild size="lg" variant="outline" className="border-[#1E2824]/20 bg-transparent"><a href="#how-it-works">როგორ მუშაობს</a></Button></div></div>
        <div className="rounded-[2rem] bg-[#1E2824] p-5 shadow-2xl shadow-[#1E2824]/20 sm:p-8"><div className="rounded-[1.5rem] bg-[#F7F4EF] p-5 sm:p-6"><div className="flex items-center justify-between"><p className="text-sm font-semibold">დღის ხედვა</p><span className="rounded-full bg-[#DDE8E1] px-3 py-1 text-xs font-medium text-[#2F6C58]">ორგანიზებული</span></div><div className="mt-7 grid grid-cols-2 gap-3"><Stat label="ჯავშნები" value="რეალური" /><Stat label="კლიენტები" value="დაცული" /></div><div className="mt-5 rounded-2xl border border-[#1E2824]/10 bg-white p-4"><div className="flex items-center gap-3"><div className="rounded-xl bg-[#EBD9D2] p-2 text-[#B85C3D]"><Clock3 className="h-5 w-5" /></div><div><p className="text-sm font-semibold">კალენდარი თქვენი წესებით</p><p className="mt-1 text-xs leading-5 text-[#66736C]">სამუშაო საათები, დროის ბუფერები და გუნდის ხელმისაწვდომობა.</p></div></div></div></div></div>
      </section>
      <section id="how-it-works" className="border-y border-[#1E2824]/10 bg-white/45"><div className="mx-auto max-w-7xl px-5 py-20 sm:px-8"><p className="text-sm font-semibold text-[#B85C3D]">ერთიანი ოპერაციული საფუძველი</p><h2 className="mt-3 max-w-2xl font-serif text-4xl font-semibold tracking-tight">სისტემა, რომელიც იზრდება თქვენს ბიზნესთან ერთად.</h2><div className="mt-10 grid gap-5 md:grid-cols-3">{pillars.map(({ icon: Icon, title, text }) => <article key={title} className="rounded-2xl border border-[#1E2824]/10 bg-white p-6"><Icon className="h-5 w-5 text-[#B85C3D]" /><h3 className="mt-6 text-lg font-semibold">{title}</h3><p className="mt-3 text-sm leading-6 text-[#627069]">{text}</p></article>)}</div></div></section>
    </main>
  </div>;
}

function Stat({ label, value }: { label: string; value: string }) { return <div className="rounded-xl bg-[#EDE7DD] p-4"><p className="text-xs text-[#6B746F]">{label}</p><p className="mt-2 font-serif text-2xl font-semibold">{value}</p></div>; }
