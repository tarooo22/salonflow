import { trpc } from "@/lib/trpc";
import { CheckCircle2, Star } from "lucide-react";
import { useState } from "react";
import "../catalog/booking.css";

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
  if (eligibility.data?.submitted) return <div role="status" className="cw-notice" data-tone="ok"><CheckCircle2 className="size-5" aria-hidden="true" /><p>თქვენი უკუკავშირი მიღებულია. მისი სტატუსია: განხილვაზე.</p></div>;
  if (!eligibility.data?.eligible) return null;

  const canSubmit = rating >= 1 && comment.trim().length >= 4 && (!publicNameConsent || displayName.trim().length > 0);
  return <section aria-labelledby="feedback-form-title">
    <span className="cw-caption cw-step-eyebrow">დასრულებული ვიზიტი</span>
    <h2 id="feedback-form-title" className="cw-step-title !text-[1.3rem]">დატოვეთ შეფასება</h2>
    <p className="cw-step-lede">თქვენი კომენტარი ჯერ განიხილება სალონის მიერ. ის არ გამოჩნდება ავტომატურად.</p>
    <div className="mt-4 grid gap-3">
      <div>
        <p className="cw-caption">შეფასება</p>
        <div className="cw-star-group mt-2" role="radiogroup" aria-label="შეფასება 1-დან 5-მდე">{[1, 2, 3, 4, 5].map(value => <button key={value} type="button" role="radio" aria-checked={rating === value} data-filled={value <= rating} aria-label={`${value} ვარსკვლავი`} onClick={() => setRating(value)} className="cw-star"><Star className="size-5 fill-current" aria-hidden="true" /></button>)}</div>
      </div>
      <label className="cw-field"><span className="cw-caption">კომენტარი</span><textarea id="booking-feedback-comment" maxLength={1200} value={comment} onChange={event => setComment(event.target.value)} placeholder="გააზიარეთ თქვენი რეალური გამოცდილება…" /></label>
      <label className="cw-consent"><input type="checkbox" className="cw-check" checked={publicNameConsent} onChange={event => setPublicNameConsent(event.target.checked)} /><span>საჯაროდ აჩვენეთ ჩემი სახელი</span></label>
      {publicNameConsent ? <label className="cw-field"><span className="cw-caption">სახელი შეფასებასთან</span><input maxLength={100} value={displayName} onChange={event => setDisplayName(event.target.value)} placeholder="სახელი, რომელიც შეფასებასთან გამოჩნდება" /></label> : null}
      {submit.error ? <p role="alert" className="text-sm font-bold text-[var(--cw-danger,#9b1c2c)]">{submit.error.message}</p> : null}
      <div><button type="button" className="cw-btn cw-btn-stamp" disabled={!canSubmit || submit.isPending} onClick={() => submit.mutate({ token, rating, comment, displayName: publicNameConsent ? displayName : undefined, publicNameConsent })}>{submit.isPending ? "იგზავნება…" : "უკუკავშირის გაგზავნა"}</button></div>
    </div>
  </section>;
}
