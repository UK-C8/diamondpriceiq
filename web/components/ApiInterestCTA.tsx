"use client";
import { analytics } from "@/lib/analytics";

export function ApiInterestCTA() {
  return (
    <section
      aria-labelledby="api-cta-heading"
      className="border-t border-gray-100 bg-gray-50 py-8 px-4"
    >
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-xs font-bold uppercase tracking-widest text-amber-600 mb-2">For jewelers · lenders · insurers</p>
        <h2 id="api-cta-heading" className="text-lg font-extrabold text-gray-900 mb-2">
          Need diamond pricing in your platform?
        </h2>
        <p className="text-sm text-gray-500 mb-5 max-w-md mx-auto">
          DiamondPrice IQ is architected as a future white-label B2B API and embeddable widget.
          Register your interest and we&apos;ll be in touch when it&apos;s ready.
        </p>
        <a
          href="mailto:urvilk1542@gmail.com?subject=DiamondPrice IQ API Interest&body=Hi Centr8 team, I'm interested in the diamond pricing API / embeddable widget."
          onClick={() => analytics.apiInterestClicked()}
          className="inline-flex items-center gap-2 rounded-xl bg-gray-900 px-6 py-3 text-sm font-bold text-white hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 transition"
        >
          Register API interest →
        </a>
      </div>
    </section>
  );
}
