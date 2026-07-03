"use client";

import type { EstimateResponse } from "@/lib/types";
import { PriceChart } from "./PriceChart";
import { FairDealChecker } from "./FairDealChecker";
import { LeadCapture } from "./LeadCapture";
import { ShareCard } from "./ShareCard";
import { Disclaimer } from "./Disclaimer";

export function EstimateResult({
  result,
  stone,
}: {
  result: EstimateResponse;
  stone: import("@/lib/types").StoneInput;
}) {
  const est = result.estimate!;

  const confidenceBadge: Record<string, { label: string; cls: string }> = {
    high:   { label: "High confidence", cls: "bg-emerald-100 text-emerald-700" },
    medium: { label: "Medium confidence", cls: "bg-amber-100 text-amber-700" },
    low:    { label: "Low confidence", cls: "bg-red-100 text-red-700" },
  };
  const badge = confidenceBadge[est.confidence_level];

  return (
    <div className="space-y-4" aria-label="Price estimate result">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-gray-900">Your price estimate</h2>
        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${badge.cls}`}>
          {badge.label}
        </span>
      </div>

      {/* Chart */}
      <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
        <PriceChart band={est.band} lowConfidence={est.low_confidence} />
      </div>

      {/* Fair deal checker */}
      <FairDealChecker band={est.band} />

      {/* Share */}
      <ShareCard stone={stone} band={est.band} />

      {/* PDF lead capture */}
      <LeadCapture stone={stone} band={est.band} modelVersion={result.model_version} />

      {/* Disclaimer */}
      <Disclaimer className="pt-1" />

      <p className="text-center text-xs text-gray-400">
        Model v{result.model_version} · Request {result.request_id.slice(0, 8)}
      </p>
    </div>
  );
}
