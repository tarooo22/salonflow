import React, { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { CalendarDays, ChevronLeft, MapPin } from "lucide-react";
import { Link } from "wouter";

export type PublicDiscoveryLocation = { publicSlug: string; name: string; address: string | null; categories: string[] };
export function filterLocationsByCategory(locations: PublicDiscoveryLocation[], category: string) { return locations.filter(location => category === "ALL" || location.categories.includes(category)); }

export function DiscoveryResults({ locations, category, onCategoryChange }: { locations: PublicDiscoveryLocation[]; category: string; onCategoryChange: (category: string) => void }) {
  const categories = Array.from(new Set(locations.flatMap(location => location.categories))).sort((a, b) => a.localeCompare(b, "ka"));
  const visibleLocations = filterLocationsByCategory(locations, category);
  return <><div className="mt-6 flex flex-wrap gap-2" aria-label="მომსახურების კატეგორიის ფილტრი"><Button size="sm" variant={category === "ALL" ? "default" : "outline"} aria-pressed={category === "ALL"} className={category === "ALL" ? "bg-[#1E2824] hover:bg-[#1E2824]/90" : ""} onClick={() => onCategoryChange("ALL")}>ყველა სერვისი</Button>{categories.map(value => <Button key={value} size="sm" variant={category === value ? "default" : "outline"} aria-pressed={category === value} className={category === value ? "bg-[#1E2824] hover:bg-[#1E2824]/90" : ""} onClick={() => onCategoryChange(value)}>{value}</Button>)}</div>{!visibleLocations.length ? <Card className="mt-8 border-dashed border-[#1E2824]/15"><CardContent className="p-6 text-sm text-muted-foreground">ამ კატეგორიის ონლაინ სერვისი ამჟამად არცერთ აქტიურ ფილიალს არ აქვს. აირჩიეთ სხვა კატეგორია.</CardContent></Card> : <div className="mt-8 space-y-3">{visibleLocations.map(location => <Card key={location.publicSlug} className="border-[#1E2824]/10"><CardContent className="flex items-center justify-between gap-4 p-5"><div><p className="font-semibold">{location.name}</p>{location.address ? <p className="mt-2 flex items-center gap-1 text-sm text-muted-foreground"><MapPin className="h-4 w-4" />{location.address}</p> : null}{location.categories.length ? <div className="mt-3 flex flex-wrap gap-1.5">{location.categories.map(item => <Badge key={item} variant="outline" className="border-[#B85C3D]/20 bg-[#B85C3D]/5 text-[#743A27]">{item}</Badge>)}</div> : null}</div><Button asChild className="bg-[#B85C3D] hover:bg-[#9D4C31]"><Link href={`/book/${location.publicSlug}`}>არჩევა</Link></Button></CardContent></Card>)}</div>}</>;
}

export default function Book() {
  const locations = trpc.public.locations.useQuery();
  const [category, setCategory] = useState("ALL");
  const activeLocations = useMemo(() => locations.data ?? [], [locations.data]);
  return <main className="min-h-screen bg-[#F7F4EF] px-5 py-8 text-[#1E2824] sm:px-8"><div className="mx-auto max-w-xl"><Link href="/" className="inline-flex items-center gap-2 text-sm font-medium text-[#516159]"><ChevronLeft className="h-4 w-4" /> მთავარ გვერდზე</Link><header className="mt-12"><p className="text-sm font-semibold text-[#B85C3D]">ონლაინ ჩაწერა</p><h1 className="mt-3 font-serif text-4xl font-semibold tracking-tight">აირჩიეთ ფილიალი</h1><p className="mt-3 text-sm leading-6 text-[#617068]">შემდეგ აირჩევთ სერვისს, სპეციალისტს, დროს და საკონტაქტო ინფორმაციას.</p></header>{locations.isLoading ? <div className="mt-8 rounded-2xl border bg-white p-6 text-sm text-muted-foreground">ფილიალები იტვირთება…</div> : null}{locations.isError ? <div className="mt-8 rounded-2xl border border-destructive/30 bg-destructive/5 p-6 text-sm text-destructive">ონლაინ ჩაწერის მონაცემები დროებით მიუწვდომელია.</div> : null}{locations.data?.length === 0 ? <Card className="mt-8 border-[#1E2824]/10"><CardHeader><CalendarDays className="h-5 w-5 text-[#B85C3D]" /><CardTitle className="mt-4">ჩაწერა მალე გააქტიურდება</CardTitle></CardHeader><CardContent className="text-sm leading-6 text-muted-foreground">სალონს ჯერ არ აქვს აქტიური ონლაინ-ჩაწერის ფილიალი. გთხოვთ დაუკავშირდეთ სალონს უშუალოდ.</CardContent></Card> : null}{activeLocations.length ? <DiscoveryResults locations={activeLocations} category={category} onCategoryChange={setCategory} /> : null}</div></main>;
}
