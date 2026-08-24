import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SalonFlowMark } from "@/components/public/PublicPrimitives";
import { trpc } from "@/lib/trpc";
import { Building2, ExternalLink, MessageCircle, ShieldCheck } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { useLocation } from "wouter";

function slugify(value: string) { return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 96); }

export default function TrialRequest() {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();
  const mine = trpc.trialAccess.mine.useQuery(undefined, { enabled: Boolean(user) });
  const organizations = trpc.organizations.listMine.useQuery(undefined, { enabled: Boolean(user) });
  const [salonName, setSalonName] = useState("");
  const [salonSlug, setSalonSlug] = useState("");
  const [error, setError] = useState("");
  const request = trpc.trialAccess.request.useMutation({ onSuccess: () => setLocation("/app/trial-status"), onError: cause => setError(cause.message) });
  useEffect(() => { if (!loading && !user) setLocation("/login?returnTo=/app/trial-request"); }, [loading, setLocation, user]);
  useEffect(() => {
    const existing = mine.data?.request;
    if (organizations.data?.length) setLocation("/app/today");
    else if (existing?.status === "PENDING" || (existing?.status === "APPROVED" && existing.expiresAt && new Date(existing.expiresAt) > new Date())) setLocation("/app/trial-status");
    else if (existing) {
      setSalonName(current => current || existing.requestedSalonName);
      setSalonSlug(current => current || existing.requestedSalonSlug);
    }
  }, [mine.data?.request, organizations.data?.length, setLocation]);
  const submit = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); setError(""); if (salonName.trim().length < 2 || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(salonSlug)) { setError("შეიყვანეთ სალონის სახელი და მინიმუმ 3-სიმბოლოიანი ლათინური კოდი."); return; } request.mutate({ salonName, salonSlug }); };
  return <main className="sf-public-page min-h-screen px-4 py-8 sm:py-12"><div className="mx-auto w-full max-w-2xl"><SalonFlowMark /><Card className="sf-salon-panel mt-8 overflow-hidden"><CardHeader className="border-b border-[var(--sf-salon-hairline)] bg-[color-mix(in_srgb,var(--sf-salon-warm)_6%,transparent)]"><p className="sf-salon-eyebrow">7-დღიანი უფასო საცდელი წვდომა</p><CardTitle className="mt-3 text-2xl">დაარეგისტრირეთ სალონის საცდელი განაცხადი</CardTitle><CardDescription className="mt-2 max-w-xl leading-6">ჯერ შეავსეთ მომავალი სალონის სახელი და კოდი. ამის შემდეგ თქვენი მოთხოვნა გადაეგზავნება SalonFlow platform admin-ს ხელით დასამტკიცებლად; სამუშაო სივრცე ჯერ არ შეიქმნება.</CardDescription></CardHeader><CardContent className="space-y-6 p-5 sm:p-7"><div className="grid gap-3 rounded-2xl border border-[color-mix(in_srgb,var(--sf-salon-warm)_28%,transparent)] bg-[color-mix(in_srgb,var(--sf-salon-warm)_7%,transparent)] p-4 sm:grid-cols-[auto_1fr]"><span className="grid size-10 place-items-center rounded-xl bg-[color-mix(in_srgb,var(--sf-salon-warm)_18%,transparent)] text-[var(--sf-salon-warm)]"><ShieldCheck className="size-5" /></span><p className="text-sm leading-6 text-[var(--sf-muted)]"><strong className="text-[var(--sf-ink)]">ეს ავტომატური ვერიფიკაცია არ არის.</strong> მოთხოვნის გაგზავნის შემდეგ მოგვწერეთ Facebook-ზე, რათა თქვენთვის გავააქტიუროთ 7-დღიანი საცდელი წვდომა.</p></div><form onSubmit={submit} className="space-y-5"><div className="space-y-2"><Label htmlFor="trial-salon-name">სალონის ან ბიზნესის სახელი</Label><div className="relative"><Building2 className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--sf-muted)]" /><Input id="trial-salon-name" value={salonName} onChange={event => { setSalonName(event.target.value); if (!salonSlug) setSalonSlug(slugify(event.target.value)); }} className="h-11 bg-[var(--sf-surface)] pl-10" placeholder="მაგ. Nino Beauty Studio" maxLength={160} autoFocus required /></div></div><div className="space-y-2"><Label htmlFor="trial-salon-slug">სალონის კოდი</Label><Input id="trial-salon-slug" value={salonSlug} onChange={event => setSalonSlug(slugify(event.target.value))} className="h-11 bg-[var(--sf-surface)]" placeholder="nino-beauty" minLength={3} maxLength={96} pattern="[a-z0-9]+(-[a-z0-9]+)*" required /><p className="text-xs text-[var(--sf-muted)]">გამოიყენეთ ლათინური ასოები, ციფრები და დეფისი. ეს კოდი მომავალში თქვენს საჯარო მისამართს დაემთხვევა.</p></div>{error ? <p role="alert" className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">{error}</p> : null}<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><a href={mine.data?.facebookContactUrl ?? "https://www.facebook.com/profile.php?id=61576174343901"} target="_blank" rel="noreferrer" className="sf-interactive inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[var(--sf-salon-hairline)] px-4 text-sm font-semibold text-[var(--sf-ink)] hover:bg-[var(--sf-surface-raised)]"><MessageCircle className="size-4 text-[var(--sf-salon-warm)]" />Facebook-ზე მიწერა<ExternalLink className="size-3.5" /></a><Button type="submit" variant="public" className="min-h-11" disabled={request.isPending}>{request.isPending ? "იგზავნება…" : "საცდელი მოთხოვნის გაგზავნა"}</Button></div></form></CardContent></Card></div></main>;
}
