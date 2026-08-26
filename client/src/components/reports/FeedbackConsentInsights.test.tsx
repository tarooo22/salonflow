import { describe, expect, it } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { FeedbackConsentInsights } from "./FeedbackConsentInsights";

describe("FeedbackConsentInsights", () => {
  it("renders aggregate feedback and consent statistics without requiring client-level content", () => {
    const html = renderToStaticMarkup(<FeedbackConsentInsights data={{ feedback: { total: 3, averageRating: 4.33, ratings: [{ rating: 1, count: 0 }, { rating: 2, count: 0 }, { rating: 3, count: 1 }, { rating: 4, count: 0 }, { rating: 5, count: 2 }], statuses: [{ status: "PENDING", count: 1 }, { status: "APPROVED", count: 1 }, { status: "HIDDEN", count: 1 }, { status: "REJECTED", count: 0 }], trend: [] }, consent: { currentOptIns: { marketingSms: 2, marketingEmail: 1, bookingTerms: 3 }, activity: { granted: 2, withdrawn: 1 } } }} />);
    expect(html).toContain("შეფასებების განაწილება");
    expect(html).toContain("მიმდინარე თანხმობები");
    expect(html).toContain("4.33/5");
    expect(html).not.toContain("კლიენტის სახელი");
  });
});
