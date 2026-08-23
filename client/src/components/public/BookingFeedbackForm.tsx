import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { CheckCircle2, Star } from "lucide-react";
import { useState } from "react";

export function BookingFeedbackForm({ token }: { token: string }) {
  const utils = trpc.useUtils();
  const eligibility = trpc.public.feedbackEligibility.useQuery({ token }, { enabled: Boolean(token), retry: false });
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [publicNameConsent, setPublicNameConsent] = useState(false);
  const submit = trpc.public.submitFeedback.useMutation({
    onSuccess: async () => { await utils.public.feedbackEligibility.invalidate({ token }); },
  });

  if (eligibility.isLoading) return null;
  if (eligibility.data?.submitted) return <div role="status" className="rounded-xl border border-[color-mix(in_srgb,var(--sf-jade)_35%,transparent)] bg-[color-mix(in_srgb,var(--sf-jade)_8%,transparent)] p-4 text-sm leading-6 text-[var(--sf-jade)]"><CheckCircle2 className="mr-2 inline size-4" aria-hidden="true" />თქვენი უკუკავშირი მიღებულია. მისი სტატუსია: განხილვაზე.</div>;
  if (!eligibility.data?.eligible) return null;

  const canSubmit = rating >= 1 && comment.trim().length >= 4 && (!publicNameConsent || displayName.trim().length > 0);
  return <section className="sf-salon-panel p-5" aria-labelledby="feedback-form-title"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--sf-salon-warm)]">დასრულებული ვიზიტი</p><h2 id="feedback-form-title" className="mt-2 text-xl font-semibold">დატოვეთ შეფასება</h2><p className="mt-2 text-sm leading-6 text-[var(--sf-muted)]">თქვენი კომენტარი ჯერ განიხილება სალონის მიერ. ის არ გამოჩნდება ავტომატურად.</p><div className="mt-4"><p className="text-sm font-semibold">შეფასება</p><div className="mt-2 flex gap-2" role="radiogroup" aria-label="შეფასება 1-დან 5-მდე">{[1, 2, 3, 4, 5].map(value => <button key={value} type="button" role="radio" aria-checked={rating === value} aria-label={`${value} ვარსკვლავი`} onClick={() => setRating(value)} className={`grid size-11 place-items-center rounded-xl border transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--sf-accent-strong)] ${value <= rating ? "border-[var(--sf-salon-warm)] bg-[color-mix(in_srgb,var(--sf-salon-warm)_12%,transparent)] text-[var(--sf-salon-warm)]" : "border-[var(--sf-line)] bg-[var(--sf-surface)] text-[var(--sf-muted)]"}`}><Star className="size-5 fill-current" aria-hidden="true" /></button>)}</div></div><label className="mt-4 block text-sm font-semibold" htmlFor="booking-feedback-comment">კომენტარი</label><Textarea id="booking-feedback-comment" className="mt-2 min-h-28" maxLength={1200} value={comment} onChange={event => setComment(event.target.value)} placeholder="გააზიარეთ თქვენი რეალური გამოცდილება…" /><label className="mt-4 flex items-start gap-3 text-sm leading-5"><Checkbox checked={publicNameConsent} onCheckedChange={checked => setPublicNameConsent(checked === true)} /><span>საჯაროდ აჩვენეთ ჩემი სახელი</span></label>{publicNameConsent ? <Input className="mt-3" maxLength={100} value={displayName} onChange={event => setDisplayName(event.target.value)} placeholder="სახელი, რომელიც შეფასებასთან გამოჩნდება" /> : null}{submit.error ? <p role="alert" className="mt-3 text-sm text-destructive">{submit.error.message}</p> : null}<Button className="mt-5 w-full sm:w-auto" disabled={!canSubmit || submit.isPending} onClick={() => submit.mutate({ token, rating, comment, displayName: publicNameConsent ? displayName : undefined, publicNameConsent })}>{submit.isPending ? "იგზავნება…" : "უკუკავშირის გაგზავნა"}</Button></section>;
}
