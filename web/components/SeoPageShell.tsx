"use client";

import { useEffect, type ReactNode } from "react";
import Link from "next/link";
import { Disclaimer } from "@/components/Disclaimer";
import { analytics } from "@/lib/analytics";

type PageId = "diamond-price-calculator" | "1-carat-diamond-price" | "diamond-parcel-valuation";

interface FaqItem {
  q: string;
  a: string;
}

interface SeoPageShellProps {
  pageId: PageId;
  headline: string;
  intro: ReactNode;
  formSlot: ReactNode;
  faqs?: FaqItem[];
  /** Extra content rendered below the form and FAQ */
  extra?: ReactNode;
}

export function SeoPageShell({ pageId, headline, intro, formSlot, faqs, extra }: SeoPageShellProps) {
  useEffect(() => {
    analytics.pageView(pageId);
  }, [pageId]);

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:py-12">
      {/* Hero */}
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-extrabold tracking-tight text-gray-900 sm:text-3xl">
          {headline}
        </h1>
        <div className="mt-3 text-sm text-gray-500 max-w-lg mx-auto leading-relaxed">
          {intro}
        </div>
      </div>

      {/* Form / tool slot */}
      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-7 mb-8">
        {formSlot}
      </div>

      {/* FAQ block */}
      {faqs && faqs.length > 0 && (
        <section className="mb-8">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Frequently asked questions</h2>
          <div className="space-y-5">
            {faqs.map(({ q, a }) => (
              <div key={q}>
                <p className="font-semibold text-gray-900 text-sm">{q}</p>
                <p className="mt-1 text-xs text-gray-600 leading-relaxed">{a}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Extra content */}
      {extra}

      {/* Disclaimer */}
      <div className="mt-8 border-t border-gray-100 pt-5">
        <Disclaimer />
      </div>

      {/* Internal links — keeps all SEO pages crawlable */}
      <nav aria-label="Related tools" className="mt-5 flex flex-wrap justify-center gap-x-4 gap-y-1">
        {pageId !== "diamond-price-calculator" && (
          <Link href="/diamond-price-calculator" className="text-xs text-amber-700 underline hover:text-amber-800">
            Diamond price calculator
          </Link>
        )}
        {pageId !== "1-carat-diamond-price" && (
          <Link href="/1-carat-diamond-price" className="text-xs text-amber-700 underline hover:text-amber-800">
            1 carat diamond price
          </Link>
        )}
        {pageId !== "diamond-parcel-valuation" && (
          <Link href="/diamond-parcel-valuation" className="text-xs text-amber-700 underline hover:text-amber-800">
            Parcel valuation
          </Link>
        )}
        <Link href="/methodology" className="text-xs text-amber-700 underline hover:text-amber-800">
          Methodology
        </Link>
      </nav>
    </div>
  );
}
