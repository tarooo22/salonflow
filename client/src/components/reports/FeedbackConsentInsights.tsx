import React from "react";
import { Star } from "lucide-react";

type FeedbackInsights = {
  feedback: { total: number; averageRating: number | null; ratings: Array<{ rating: number; count: number }>; statuses: Array<{ status: string; count: number }>; trend: Array<{ date: string; count: number }> };
  consent: { currentOptIns: { marketingSms: number; marketingEmail: number; bookingTerms: number }; activity: { granted: number; withdrawn: number } };
};

const statusCopy: Record<string, string> = { PENDING: "მოლოდინში", APPROVED: "გამოქვეყნებული", HIDDEN: "დამალული", REJECTED: "უარყოფილი" };
const statusTone: Record<string, string> = { PENDING: "bg-[color-mix(in_srgb,var(--sf-warning)_16%,transparent)] text-[var(--sf-warning)]", APPROVED: "bg-[color-mix(in_srgb,var(--sf-success)_16%,transparent)] text-[var(--sf-success)]", HIDDEN: "bg-muted text-muted-foreground", REJECTED: "bg-destructive/10 text-destructive" };

export function FeedbackConsentInsights({ data }: { data: FeedbackInsights }) {
  const maxRatingCount = Math.max(1, ...data.feedback.ratings.map(item => item.count));
  const reviewed = data.feedback.statuses.filter(item => item.status !== "PENDING").reduce((total, item) => total + item.count, 0);
  const currentMarketing = data.consent.currentOptIns.marketingSms + data.consent.currentOptIns.marketingEmail;
  return <div className="space-y-4">
    <dl className="grid grid-cols-1 overflow-hidden rounded-md border border-border sm:grid-flow-col sm:auto-cols-fr">
      <Metric label="შეფასებები" value={data.feedback.total} helper={data.feedback.total ? `${reviewed} განხილულია` : "ჯერ არ არის"} />
      <Metric label="საშუალო" value={data.feedback.averageRating === null ? "—" : `${data.feedback.averageRating}/5`} />
      <Metric label="მარკეტინგის თანხმობა" value={currentMarketing} helper="SMS და ელფოსტა" />
    </dl>
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.1fr_.9fr]">
      <section aria-labelledby="feedback-rating-distribution">
        <h3 id="feedback-rating-distribution" className="font-semibold">შეფასებების განაწილება</h3>
        
        <div className="mt-3 space-y-2">{data.feedback.ratings.slice().reverse().map(item => <div key={item.rating} className="grid grid-cols-[2.25rem_1fr_2rem] items-center gap-2 text-sm"><span className="cwk-num inline-flex items-center gap-1 font-medium">{item.rating}<Star className="size-3.5" aria-hidden="true" /></span><div className="h-2.5 overflow-hidden rounded-sm bg-muted" role="progressbar" aria-label={`${item.rating} ვარსკვლავიანი შეფასებები`} aria-valuemin={0} aria-valuemax={maxRatingCount} aria-valuenow={item.count}><div className="h-full bg-primary" style={{ width: `${Math.round((item.count / maxRatingCount) * 100)}%` }} /></div><span className="text-right cwk-num text-muted-foreground">{item.count}</span></div>)}</div>
      </section>
      <section aria-labelledby="feedback-publication-status">
        <h3 id="feedback-publication-status" className="font-semibold">მოდერაციის სტატუსი</h3>
        <dl className="mt-3 divide-y divide-border">{data.feedback.statuses.map(item => <div key={item.status} className="flex items-center justify-between py-1.5 text-sm"><dt><span className={`inline-flex rounded-md px-2 py-0.5 text-xs font-semibold ${statusTone[item.status] ?? "bg-muted text-muted-foreground"}`}>{statusCopy[item.status] ?? item.status}</span></dt><dd className="cwk-num font-semibold">{item.count}</dd></div>)}</dl>
      </section>
    </div>
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
      <section aria-labelledby="consent-current">
        <h3 id="consent-current" className="font-semibold">მიმდინარე თანხმობები</h3>
        <dl className="mt-3 divide-y divide-border"><ConsentStat label="SMS" value={data.consent.currentOptIns.marketingSms} /><ConsentStat label="ელფოსტა" value={data.consent.currentOptIns.marketingEmail} /><ConsentStat label="ჩაწერის პირობები" value={data.consent.currentOptIns.bookingTerms} /></dl>
      </section>
      <section aria-labelledby="consent-activity">
        <h3 id="consent-activity" className="font-semibold">თანხმობის აქტივობა</h3>
        <dl className="mt-3 divide-y divide-border"><ConsentStat label="დამატებული" value={data.consent.activity.granted} tone="success" /><ConsentStat label="გაუქმებული" value={data.consent.activity.withdrawn} tone="warning" /></dl>
      </section>
    </div>
  </div>;
}

function Metric({ label, value, helper }: { label: string; value: string | number; helper?: string }) { return <div className="min-w-0 border-b border-border px-3 py-2 last:border-b-0 sm:border-b-0 sm:border-r sm:last:border-r-0"><dt className="truncate text-xs text-muted-foreground">{label}</dt><dd className="cwk-num text-lg font-semibold leading-tight">{value}</dd>{helper ? <p className="text-xs text-muted-foreground">{helper}</p> : null}</div>; }
function ConsentStat({ label, value }: { label: string; value: number; tone?: "neutral" | "success" | "warning" }) { return <div className="flex items-center justify-between py-1.5 text-sm"><dt className="text-muted-foreground">{label}</dt><dd className="cwk-num font-semibold">{value}</dd></div>; }
