import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { PriceBand, Verdict } from "./types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatUSD(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export function getVerdict(quoted: number, band: PriceBand): {
  verdict: Verdict;
  pctDelta: number;
  explanation: string;
} {
  const pctDelta = ((quoted - band.mid) / band.mid) * 100;

  if (quoted < band.low) {
    return {
      verdict: "below",
      pctDelta,
      explanation: `The quoted price is ${Math.abs(pctDelta).toFixed(1)}% below our estimated market range — this looks like a good deal. Verify the diamond's grading report before purchasing.`,
    };
  }
  if (quoted > band.high) {
    return {
      verdict: "above",
      pctDelta,
      explanation: `The quoted price is ${Math.abs(pctDelta).toFixed(1)}% above our estimated market range. You may be able to negotiate, or the stone may have qualities not captured by the 4Cs alone.`,
    };
  }
  return {
    verdict: "fair",
    pctDelta,
    explanation: `The quoted price falls within our estimated market range — this is a fair deal at ${pctDelta > 0 ? "+" : ""}${pctDelta.toFixed(1)}% of the median estimate.`,
  };
}
