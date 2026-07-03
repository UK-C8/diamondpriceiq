"use client";

import { useState } from "react";
import { analytics } from "@/lib/analytics";
import type { StoneInput, PriceBand } from "@/lib/types";
import { formatUSD } from "@/lib/utils";

interface ShareCardProps {
  stone: StoneInput;
  band: PriceBand;
}

function buildShareUrl(stone: StoneInput, band: PriceBand): string {
  const base = typeof window !== "undefined" ? window.location.origin : "https://diamondpriceiq.com";
  const params = new URLSearchParams({
    carat: String(stone.carat),
    cut: stone.cut,
    color: stone.color,
    clarity: stone.clarity,
    low: String(band.low),
    mid: String(band.mid),
    high: String(band.high),
  });
  return `${base}/?${params.toString()}`;
}

function buildOgUrl(stone: StoneInput, band: PriceBand): string {
  const base = typeof window !== "undefined" ? window.location.origin : "https://diamondpriceiq.com";
  const params = new URLSearchParams({
    carat: String(stone.carat),
    cut: stone.cut,
    color: stone.color,
    clarity: stone.clarity,
    low: String(Math.round(band.low)),
    mid: String(Math.round(band.mid)),
    high: String(Math.round(band.high)),
  });
  return `${base}/api/og?${params.toString()}`;
}

export function ShareCard({ stone, band }: ShareCardProps) {
  const [copied, setCopied] = useState(false);
  const shareUrl = buildShareUrl(stone, band);
  const summary = `${stone.carat}ct ${stone.cut}/${stone.color}/${stone.clarity} diamond — fair-market estimate: ${formatUSD(band.low)}–${formatUSD(band.high)} via DiamondPrice IQ`;

  async function copyLink() {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    analytics.shareCardGenerated("copy");
  }

  function shareWhatsApp() {
    window.open(`https://wa.me/?text=${encodeURIComponent(summary + "\n" + shareUrl)}`, "_blank", "noopener");
    analytics.shareCardGenerated("whatsapp");
  }

  function shareTwitter() {
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(summary)}&url=${encodeURIComponent(shareUrl)}`, "_blank", "noopener");
    analytics.shareCardGenerated("twitter");
  }

  return (
    <section aria-labelledby="share-heading" className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <h2 id="share-heading" className="text-base font-bold text-gray-900 mb-1">Share this estimate</h2>
      <p className="text-xs text-gray-500 mb-4">
        The link below opens a pre-filled estimate. OG preview image is auto-generated for rich unfurls on WhatsApp and social.
      </p>

      {/* Share URL */}
      <div className="flex gap-2 mb-3">
        <input
          readOnly
          value={shareUrl}
          className="flex-1 min-w-0 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-600 font-mono focus:outline-none truncate"
          aria-label="Shareable link"
          onFocus={(e) => e.target.select()}
        />
        <button
          onClick={copyLink}
          className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-amber-400 whitespace-nowrap transition"
        >
          {copied ? "✓ Copied!" : "Copy link"}
        </button>
      </div>

      {/* Social buttons */}
      <div className="flex gap-2">
        <button
          onClick={shareWhatsApp}
          className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-[#25D366] px-3 py-2.5 text-xs font-bold text-white hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[#25D366] focus:ring-offset-1 transition"
        >
          <span>WhatsApp</span>
        </button>
        <button
          onClick={shareTwitter}
          className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-black px-3 py-2.5 text-xs font-bold text-white hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-1 transition"
        >
          <span>𝕏 / Twitter</span>
        </button>
      </div>

      {/* OG preview hint */}
      <p className="mt-3 text-xs text-gray-400">
        Preview card:{" "}
        <a
          href={buildOgUrl(stone, band)}
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-amber-700"
          onClick={() => analytics.shareCardGenerated("copy")}
        >
          view OG image →
        </a>
      </p>
    </section>
  );
}
