import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SalonFlowMark } from "@/components/public/PublicPrimitives";
import { trpc } from "@/lib/trpc";
import { CheckCircle2, Clock3, ExternalLink, MessageCircle, RefreshCw, ShieldAlert } from "lucide-react";
import { useEffect } from "react";
import { Link, useLocation } from "wouter";

function formatDate(value: Date | null | undefined) { return value ? new Date(value).toLocaleString("ka-GE", { dateStyle: "medium", timeStyle: "short" }) : "—"; }

export default function TrialStatus() {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();
  const mine = trpc.trialAccess.mine.useQuery(undefined, { enabled: Boolean(user) });
  const organizations = trpc.organizations.listMine.useQuery(undefined, { enabled: Boolean(user) });
  useEffect(() => { if (!loading && !user) setLocation("/login?returnTo=/app/trial-status"); }, [loading, setLocation, user]);
  useEffect(() => { if (organizations.data?.length) setLocation("/app/today"); else if (!mine.isLoading && !mine.data?.request) setLocation("/app/trial-request"); }, [mine.data?.request, mine.isLoading, organizations.data?.length, setLocation]);
  const request = mine.data?.request;
  if (loading || mine.isLoading || organizations.isLoading) return <main className="sf-public-page grid min-h-screen place-items-center p-6" role="status">სტატუსი იტვირთება…</main>;
  if (!request) return null;
  const approved = request.status === "APPROVED" && request.expiresAt && new Date(request.expiresAt) > new Date();
  const needsResubmit = request.status === "REJECTED" || request.status === "EXPIRED" || request.status === "CANCELLED";
  const icon = approved ? <CheckCircle2 className="size-7 text-[var(--sf-jade)]" /> : needsResubmit ? <ShieldAlert className="size-7 text-[var(--sf-salon-warm)]" /> : <Clock3 className="size-7 text-[var(--sf-salon-warm)]" />;
  const title = approved ? "თქვენი საცდელი წვდომა აქტიურია" : needsResubmit ? "საცდელი წვდომა ახლა არ არის აქტიური" : "თქვენი საცდელი მოთხოვნა მიღებულია";
  const description = approved ? `თქვენ შეგიძლიათ შექმნათ „${request.requestedSalonName}“ და გამოიყენოთ SalonFlow ${formatDate(request.expiresAt)}-მდე.` : needsResubmit ? "შეგიძლიათ განაახლოთ განაცხადი და Facebook-ზე მოგვწეროთ, რათა განვიხილოთ ახალი საცდელი წვდომა." : "თქვენი სამუშაო სივრცე ჯერ არ შექმნილა. Facebook-ზე მოგვწერეთ თქვენი სახელითა და სალონის სახელით; platform admin ხელით გაააქტიურებს 7-დღიან საცდელ წვდომას.";
  return <main className="sf-public-page min-h-screen px-4 py-8 sm:py-12"><div className="mx-auto w-full max-w-2xl"><SalonFlowMark /><Card className="sf-salon-panel mt-8 overflow-hidden"><CardHeader className="border-b border-[var(--sf-salon-hairline)] bg-[color-mix(in_srgb,var(--sf-salon-warm)_6%,transparent)]"><div className="flex size-12 items-center justify-center rounded-2xl border border-[var(--sf-salon-hairline)] bg-[var(--sf-surface-raised)]">{icon}</div><p className="sf-salon-eyebrow mt-4">საცდელი წვდომის სტატუსი</p><CardTitle className="mt-3 text-2xl">{title}</CardTitle><CardDescription className="mt-3 max-w-xl leading-6">{description}</CardDescription></CardHeader><CardContent className="space-y-5 p-5 sm:p-7"><div className="grid gap-3 rounded-2xl border bg-[var(--sf-surface-raised)] p-4 text-sm sm:grid-cols-2"><p><span className="block text-xs text-[var(--sf-muted)]">სალონის განაცხადი</span><strong className="mt-1 block">{request.requestedSalonName}</strong></p><p><span className="block text-xs text-[var(--sf-muted)]">კოდი</span><strong className="mt-1 block font-mono">{request.requestedSalonSlug}</strong></p>{approved ? <p className="sm:col-span-2"><span className="block text-xs text-[var(--sf-muted)]">წვდომა მოქმედებს</span><strong className="mt-1 block">{formatDate(request.startsAt)} — {formatDate(request.expiresAt)}</strong></p> : null}</div>{request.reviewNoteKa ? <p className="rounded-xl border border-[var(--sf-salon-hairline)] p-4 text-sm leading-6 text-[var(--sf-muted)]"><strong className="text-[var(--sf-ink)]">შენიშვნა:</strong> {request.reviewNoteKa}</p> : null}<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><a href={mine.data?.facebookContactUrl ?? "https://www.facebook.com/profile.php?id=61576174343901"} target="_blank" rel="noreferrer" className="sf-interactive inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[var(--sf-salon-hairline)] px-4 text-sm font-semibold text-[var(--sf-ink)] hover:bg-[var(--sf-surface-raised)]"><MessageCircle className="size-4 text-[var(--sf-salon-warm)]" />Facebook-ზე მიწერა<ExternalLink className="size-3.5" /></a>{approved ? <Button asChild variant="public" className="min-h-11"><Link href="/app/setup">სალონის გამართვის დაწყება</Link></Button> : needsResubmit ? <Button asChild variant="public" className="min-h-11"><Link href="/app/trial-request"><RefreshCw className="mr-2 size-4" />განაცხადის განახლება</Link></Button> : null}</div></CardContent></Card></div></main>;
}
