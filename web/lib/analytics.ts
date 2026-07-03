"use client";

// GA4 event instrumentation — matches CLAUDE.md Section 7 exactly.
// Fires gtag() if GA4 is loaded; silently no-ops otherwise.

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

function track(event: string, params?: Record<string, unknown>) {
  if (typeof window !== "undefined" && typeof window.gtag === "function") {
    window.gtag("event", event, params ?? {});
  }
  // Dev logging
  if (process.env.NODE_ENV === "development") {
    console.debug(`[analytics] ${event}`, params);
  }
}

export const analytics = {
  pageView: (page: "landing" | "methodology" | "parcel" | "diamond-price-calculator" | "1-carat-diamond-price" | "diamond-parcel-valuation") =>
    track("page_view", { page }),

  estimateStarted: (hasOptionalInputs: boolean) =>
    track("estimate_started", { has_optional_inputs: hasOptionalInputs }),

  estimateReturned: (p: {
    caratBucket: string;
    color: string;
    clarity: string;
    cut: string;
    shape?: string;
    confidenceLevel: string;
    latencyMs: number;
  }) =>
    track("estimate_returned", {
      carat_bucket: p.caratBucket,
      color: p.color,
      clarity: p.clarity,
      cut: p.cut,
      shape: p.shape ?? "Round",
      confidence_level: p.confidenceLevel,
      latency_ms: p.latencyMs,
    }),

  fairDealChecked: (verdict: string, pctDelta: number) =>
    track("fair_deal_checked", { verdict, pct_delta: Math.round(pctDelta * 10) / 10 }),

  lowConfidenceFlagShown: (segment: string) =>
    track("low_confidence_flag_shown", { segment }),

  shareCardGenerated: (channel: "whatsapp" | "copy" | "twitter") =>
    track("share_card_generated", { channel }),

  leadCaptured: (source: "single" | "parcel") =>
    track("lead_captured", { source }),

  pdfDownloaded: () => track("pdf_downloaded"),

  parcelRun: (stoneCount: number, source: "rows" | "csv") =>
    track("parcel_run", { stone_count: stoneCount, source }),

  apiInterestClicked: () => track("api_interest_clicked"),

  currencyChanged: (currency: string) =>
    track("currency_changed", { currency }),

  estimateError: (type: string) => track("estimate_error", { type }),
};

// Caret bucket helper — matches CLAUDE.md Section 7 payload spec
export function caratBucket(carat: number): string {
  if (carat < 0.5) return "0.0-0.5";
  if (carat < 1.0) return "0.5-1.0";
  if (carat < 1.5) return "1.0-1.5";
  if (carat < 2.0) return "1.5-2.0";
  if (carat < 3.0) return "2.0-3.0";
  return "3.0+";
}
