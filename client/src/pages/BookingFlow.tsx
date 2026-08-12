import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronLeft, CircleAlert, MapPin, UserRound } from "lucide-react";
import { Link, useRoute } from "wouter";
import { trpc } from "@/lib/trpc";

const steps = ["სერვისი", "სპეციალისტი", "თარიღი და დრო", "თქვენი მონაცემები"];

export default function BookingFlow() {
  const [, params] = useRoute("/book/:slug");
  const slug = params?.slug ?? "";
  const catalog = trpc.public.bookingCatalog.useQuery(slug, { enabled: Boolean(slug) });

  return (
    <main className="min-h-screen bg-[#F7F4EF] px-5 py-8 text-[#1E2824] sm:px-8">
      <div className="mx-auto max-w-3xl">
        <Link href="/book" className="inline-flex items-center gap-2 text-sm font-medium text-[#516159]"><ChevronLeft className="h-4 w-4" /> ფილიალების სია</Link>
        <header className="mt-10">
          <p className="text-sm font-semibold text-[#B85C3D]">ონლაინ ჩაწერა · 4 ნაბიჯი</p>
          <h1 className="mt-3 font-serif text-4xl font-semibold tracking-tight">დაჯავშნეთ სასურველი დრო</h1>
        </header>
        <ol className="mt-8 grid gap-2 sm:grid-cols-4">
          {steps.map((step, index) => <li key={step} className={`rounded-xl border px-3 py-3 text-sm ${index === 0 ? "border-[#B85C3D] bg-[#B85C3D]/10 font-semibold text-[#743A27]" : "border-[#1E2824]/10 bg-white text-[#69756e]"}`}><span className="mr-2 text-xs">0{index + 1}</span>{step}</li>)}
        </ol>
        {catalog.isLoading ? <Card className="mt-8 border-[#1E2824]/10"><CardContent className="p-6 text-sm text-muted-foreground">ჩაწერის კატალოგი იტვირთება…</CardContent></Card> : null}
        {catalog.isError ? <Card className="mt-8 border-destructive/30 bg-destructive/5"><CardContent className="flex gap-3 p-6 text-sm text-destructive"><CircleAlert className="h-5 w-5 shrink-0" />ჩაწერის მონაცემები დროებით მიუწვდომელია. სცადეთ მოგვიანებით.</CardContent></Card> : null}
        {catalog.data === null ? <Card className="mt-8 border-[#1E2824]/10"><CardHeader><CardTitle>ეს ჩაწერის ბმული აღარ არის აქტიური</CardTitle></CardHeader><CardContent className="text-sm leading-6 text-muted-foreground">ფილიალი შესაძლოა გათიშულია ან ბმული არასწორია. დაბრუნდით ფილიალების სიაში და აირჩიეთ აქტიური ფილიალი.</CardContent></Card> : null}
        {catalog.data ? <div className="mt-8 grid gap-5 lg:grid-cols-[1fr_0.82fr]">
          <section className="space-y-4">
            <Card className="border-[#1E2824]/10"><CardHeader><p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#B85C3D]">ფილიალი</p><CardTitle className="mt-2">{catalog.data.location.name}</CardTitle></CardHeader><CardContent className="flex items-center gap-2 text-sm text-muted-foreground"><MapPin className="h-4 w-4" />{catalog.data.location.address || catalog.data.location.timezone}</CardContent></Card>
            <Card className="border-[#1E2824]/10"><CardHeader><CardTitle>აირჩიეთ სერვისი</CardTitle></CardHeader><CardContent className="space-y-3">{catalog.data.catalog.length ? catalog.data.catalog.map(({ service, category }) => <button key={service.id} type="button" className="w-full rounded-xl border border-[#1E2824]/10 bg-white px-4 py-4 text-left transition hover:border-[#B85C3D] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B85C3D]"><p className="text-xs font-medium text-[#B85C3D]">{category.nameKa}</p><div className="mt-1 flex items-start justify-between gap-3"><p className="font-semibold">{service.nameKa}</p><p className="text-sm text-[#516159]">{service.defaultDurationMinutes} წთ</p></div><p className="mt-1 text-sm text-[#516159]">{(service.priceTetri / 100).toFixed(2)} ₾</p></button>) : <p className="text-sm leading-6 text-muted-foreground">ამ ფილიალისთვის ჯერ არ არის ხელმისაწვდომი ონლაინ სერვისები.</p>}</CardContent></Card>
          </section>
          <aside><Card className="border-[#1E2824]/10"><CardHeader><UserRound className="h-5 w-5 text-[#B85C3D]" /><CardTitle className="mt-3">შემდეგი ნაბიჯი</CardTitle></CardHeader><CardContent className="space-y-4 text-sm leading-6 text-muted-foreground"><p>სერვისის არჩევის შემდეგ ნაჩვენები იქნება მხოლოდ ამ სერვისზე დაშვებული სპეციალისტები და მათი ხელმისაწვდომი დროები.</p><p>დრო საბოლოოდ მოწმდება სერვერზე დაჯავშნების მომენტში, ამიტომ ორი სტუმარი ერთსა და იმავე საათს ვერ დაჯავშნის.</p><Button disabled className="w-full bg-[#B85C3D]">გააგრძელეთ სერვისის არჩევის შემდეგ</Button></CardContent></Card></aside>
        </div> : null}
      </div>
    </main>
  );
}
