import { usePublicLocale } from "@/contexts/PublicLocaleContext";
import { trpc } from "@/lib/trpc";
import { CheckCircle2, Star } from "lucide-react";
import { useState } from "react";
import "../catalog/booking.css";

export const ui = {
  ka: { received: "თქვენი უკუკავშირი მიღებულია. მისი სტატუსია: განხილვაზე.", eyebrow: "დასრულებული ვიზიტი", title: "დატოვეთ შეფასება", lede: "თქვენი კომენტარი ჯერ განიხილება სალონის მიერ. ის არ გამოჩნდება ავტომატურად.", rating: "შეფასება", ratingGroup: "შეფასება 1-დან 5-მდე", star: (value: number) => `${value} ვარსკვლავი`, comment: "კომენტარი", commentPlaceholder: "გააზიარეთ თქვენი რეალური გამოცდილება…", showName: "საჯაროდ აჩვენეთ ჩემი სახელი", nameLabel: "სახელი შეფასებასთან", namePlaceholder: "სახელი, რომელიც შეფასებასთან გამოჩნდება", sending: "იგზავნება…", send: "უკუკავშირის გაგზავნა" },
  en: { received: "Your feedback has been received. Status: pending review.", eyebrow: "Completed visit", title: "Leave a review", lede: "Your comment is reviewed by the salon first. It will not appear automatically.", rating: "Rating", ratingGroup: "Rating from 1 to 5", star: (value: number) => `${value} ${value === 1 ? "star" : "stars"}`, comment: "Comment", commentPlaceholder: "Share your real experience…", showName: "Show my name publicly", nameLabel: "Name shown with the review", namePlaceholder: "The name that will appear with your review", sending: "Sending…", send: "Send feedback" },
  ru: { received: "Ваш отзыв получен. Статус: на рассмотрении.", eyebrow: "Завершённый визит", title: "Оставьте отзыв", lede: "Сначала ваш комментарий рассматривает салон. Он не появится автоматически.", rating: "Оценка", ratingGroup: "Оценка от 1 до 5", star: (value: number) => `Оценка: ${value} из 5`, comment: "Комментарий", commentPlaceholder: "Поделитесь своим настоящим опытом…", showName: "Показывать моё имя публично", nameLabel: "Имя рядом с отзывом", namePlaceholder: "Имя, которое будет показано рядом с отзывом", sending: "Отправка…", send: "Отправить отзыв" },
} as const;

export function BookingFeedbackForm({ token }: { token: string }) {
  const text = ui[usePublicLocale().locale];
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
  if (eligibility.data?.submitted) return <div role="status" className="cwb-notice" data-tone="ok"><CheckCircle2 className="size-5" aria-hidden="true" /><p>{text.received}</p></div>;
  if (!eligibility.data?.eligible) return null;

  const canSubmit = rating >= 1 && comment.trim().length >= 4 && (!publicNameConsent || displayName.trim().length > 0);
  return <section aria-labelledby="feedback-form-title">
    <h2 id="feedback-form-title" className="cwb-section-title">{text.title}</h2>
    <p className="cwb-step-lede">{text.lede}</p>
    <div className="mt-4 grid gap-3">
      <div>
        <p id="feedback-rating-label" className="cwb-label">{text.rating}</p>
        <div className="cwb-stars mt-2" role="radiogroup" aria-label={text.ratingGroup}>{[1, 2, 3, 4, 5].map(value => <button key={value} type="button" role="radio" aria-checked={rating === value} data-filled={value <= rating} aria-label={text.star(value)} onClick={() => setRating(value)} className="cwb-star"><Star className="size-5 fill-current" aria-hidden="true" /></button>)}</div>
      </div>
      <div className="cwb-field"><label className="cwb-label" htmlFor="booking-feedback-comment">{text.comment}</label><textarea id="booking-feedback-comment" className="cwb-input" maxLength={1200} value={comment} onChange={event => setComment(event.target.value)} placeholder={text.commentPlaceholder} /></div>
      <label className="cwb-agree"><input type="checkbox" className="cwb-check" checked={publicNameConsent} onChange={event => setPublicNameConsent(event.target.checked)} /><span>{text.showName}</span></label>
      {publicNameConsent ? <div className="cwb-field"><label className="cwb-label" htmlFor="booking-feedback-name">{text.nameLabel}</label><input id="booking-feedback-name" className="cwb-input" maxLength={100} value={displayName} onChange={event => setDisplayName(event.target.value)} placeholder={text.namePlaceholder} /></div> : null}
      {submit.error ? <p role="alert" className="cwb-error">{submit.error.message}</p> : null}
      <div><button type="button" className="cwb-btn cwb-btn-primary" disabled={!canSubmit || submit.isPending} onClick={() => submit.mutate({ token, rating, comment, displayName: publicNameConsent ? displayName : undefined, publicNameConsent })}>{submit.isPending ? text.sending : text.send}</button></div>
    </div>
  </section>;
}
