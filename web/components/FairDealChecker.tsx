"use client";

import { useState, useEffect, useRef } from "react";
import type { PriceBand, Verdict } from "@/lib/types";
import { getVerdict, formatUSD } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { analytics } from "@/lib/analytics";

const verdictStyles: Record<Verdict, { bg: string; border: string; icon: string; label: string }> = {
  below: { bg: "bg-emerald-50", border: "border-emerald-200", icon: "✓", label: "Good deal" },
  fair:  { bg: "bg-blue-50",    border: "border-blue-200",    icon: "≈", label: "Fair price" },
  above: { bg: "bg-red-50",     border: "border-red-200",     icon: "↑", label: "Above market" },
};

export function FairDealChecker({ band }: { band: PriceBand }) {
  const [quoted, setQuoted] = useState("");
  const quotedNum = parseFloat(quoted);
  const valid = !isNaN(quotedNum) && quotedNum > 0;
  const result = valid ? getVerdict(quotedNum, band) : null;
  const prevVerdict = useRef<string | null>(null);

  useEffect(() => {
    if (result && result.verdict !== prevVerdict.current) {
      prevVerdict.current = result.verdict;
      analytics.fairDealChecked(result.verdict, result.pctDelta);
    }
  }, [result]);
  const style = result ? verdictStyles[result.verdict] : null;

  return (
    <section aria-labelledby="fair-deal-heading" className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <h2 id="fair-deal-heading" className="text-base font-bold text-gray-900 mb-1">
        Is it a fair deal?
      </h2>
      <p className="text-xs text-gray-500 mb-3">
        Enter the jeweler's quoted price to see how it compares to our estimate.
      </p>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-gray-400 text-sm">$</span>
          <input
            type="number"
            min="1"
            step="1"
            placeholder="Quoted price"
            value={quoted}
            onChange={(e) => setQuoted(e.target.value)}
            aria-label="Jeweler's quoted price in USD"
            className="w-full rounded-xl border border-gray-200 bg-gray-50 pl-6 pr-3 py-2.5 text-sm text-gray-900 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-200 transition"
          />
        </div>
      </div>

      {result && style && (
        <div
          role="status"
          aria-live="polite"
          className={cn("mt-3 rounded-xl border p-4", style.bg, style.border)}
        >
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-lg font-bold">{style.icon}</span>
            <span className="text-sm font-bold text-gray-900">{style.label}</span>
            <span className="ml-auto text-xs font-semibold text-gray-600">
              {result.pctDelta > 0 ? "+" : ""}{result.pctDelta.toFixed(1)}% vs median
            </span>
          </div>
          <p className="text-xs text-gray-700 leading-relaxed">{result.explanation}</p>
          <div className="mt-2 text-xs text-gray-500">
            Market range: {formatUSD(band.low)} – {formatUSD(band.high)} · Median: {formatUSD(band.mid)}
          </div>
        </div>
      )}
    </section>
  );
}
