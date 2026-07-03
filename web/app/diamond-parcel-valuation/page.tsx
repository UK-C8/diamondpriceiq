import type { Metadata } from "next";
import { SeoPageShell } from "@/components/SeoPageShell";
import { EstimatorClient } from "@/components/EstimatorClient";

export const metadata: Metadata = {
  title: "Diamond Parcel Valuation — Bulk Diamond Price Estimate | DiamondPrice IQ",
  description:
    "Instantly value a parcel of diamonds. Upload a CSV or enter stones manually — get per-stone estimates and a total parcel value in seconds. Built for traders and wholesalers in Surat and beyond.",
  keywords: ["diamond parcel valuation", "bulk diamond price", "diamond parcel price", "wholesale diamond pricing", "diamond lot valuation"],
  openGraph: {
    title: "Diamond Parcel Valuation — DiamondPrice IQ",
    description: "Bulk diamond price estimates for traders and wholesalers. CSV upload, per-stone values, and parcel totals.",
    type: "website",
  },
  alternates: { canonical: "https://diamondpriceiq.com/diamond-parcel-valuation" },
};

const productSchema = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "DiamondPrice IQ — Parcel Valuation Tool",
  description: "Free bulk diamond parcel valuation tool for traders and wholesalers. Enter up to 500 stones manually or via CSV upload.",
  applicationCategory: "FinanceApplication",
  operatingSystem: "Web",
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  author: { "@type": "Organization", name: "Centr8 LLP" },
};

const faqs = [
  {
    q: "How many stones can I value in one parcel?",
    a: "Up to 500 stones per run. Enter them row by row in the table, or upload a CSV using the provided template. The tool returns a per-stone estimate and a combined parcel total (low/median/high).",
  },
  {
    q: "Can I upload a CSV of my parcel?",
    a: "Yes. Download the CSV template from the parcel tool, fill in carat, cut, color, and clarity for each stone, and upload it. Optional fields (shape, fluorescence, certificate) are supported and will improve estimate precision when provided.",
  },
  {
    q: "What does the parcel total represent?",
    a: "The parcel total is the sum of the low, median, and high estimates for every stone in your lot. It reflects public listing prices for comparable stones — not hammer prices at auction or dealer buy prices, which are typically 10–30% lower.",
  },
  {
    q: "Is there a B2B API for automated parcel pricing?",
    a: "A production-grade API for jewelers, lenders, and insurers is on our roadmap. Register your interest using the footer CTA below and we'll notify you when early access opens.",
  },
];

const intro = (
  <>
    Built for diamond traders in Surat and worldwide. Value an entire parcel of stones in
    seconds — enter stones manually or upload a CSV. Get per-stone estimates plus a full
    parcel total (low / median / high) backed by a model trained on 50,000+ real listings.
  </>
);

const extra = (
  <div className="mb-8 space-y-4">
    <div className="rounded-xl bg-amber-50 border border-amber-100 p-5">
      <h2 className="text-sm font-bold text-amber-900 mb-2">How parcel mode works</h2>
      <ol className="space-y-2 text-xs text-amber-800 list-decimal list-inside leading-relaxed">
        <li>Switch to <strong>Parcel / bulk</strong> mode using the toggle at the top of the tool.</li>
        <li>Add stones manually row by row, or download the CSV template, fill it in, and upload it.</li>
        <li>Click <strong>Estimate parcel</strong> to get per-stone values and a combined parcel total.</li>
        <li>Export results as CSV, or enter your email to receive a branded PDF report.</li>
      </ol>
    </div>

    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {[
        { label: "Up to 500 stones", desc: "per parcel run" },
        { label: "CSV upload", desc: "downloadable template included" },
        { label: "Per-stone + total", desc: "low / median / high band" },
      ].map(({ label, desc }) => (
        <div key={label} className="rounded-xl bg-gray-50 border border-gray-100 p-4 text-center">
          <p className="text-sm font-bold text-gray-900">{label}</p>
          <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
        </div>
      ))}
    </div>
  </div>
);

export default function DiamondParcelValuationPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
      />
      <SeoPageShell
        pageId="diamond-parcel-valuation"
        headline="Diamond Parcel Valuation"
        intro={intro}
        formSlot={<EstimatorClient defaultMode="parcel" />}
        faqs={faqs}
        extra={extra}
      />
    </>
  );
}
