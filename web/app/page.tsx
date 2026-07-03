import type { Metadata } from "next";
import { EstimatorClient } from "@/components/EstimatorClient";
import { DiamondIcon } from "@/components/DiamondIcon";

export const metadata: Metadata = {
  title: "Diamond Price Calculator — Free 4Cs Estimate | DiamondPrice IQ",
  description:
    "Get an instant, model-backed fair price range for any diamond based on its 4Cs. Free diamond price calculator — no signup required.",
  keywords: ["diamond price calculator", "diamond valuation", "4Cs price", "diamond estimate", "carat price"],
  openGraph: {
    title: "DiamondPrice IQ — Free Diamond Price Calculator",
    description: "A diamond's fair price in 10 seconds, from the diamond capital.",
    type: "website",
    images: [{ url: "/api/og?carat=1.00&cut=Ideal&color=G&clarity=VS1&low=5427&mid=6543&high=7116", width: 1200, height: 630 }],
  },
};

export default function HomePage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:py-12">
      {/* Hero */}
      <div className="mb-8 text-center">
        <DiamondIcon size={48} className="mx-auto" />
        <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-gray-900 sm:text-3xl">
          A diamond&apos;s fair price in{" "}
          <span className="text-amber-500">10 seconds</span>
        </h1>
        <p className="mt-2 text-sm text-gray-500">
          Enter the 4Cs — our model returns an instant, calibrated price range from thousands of real listings.
          <br className="hidden sm:block" /> No signup. No sales pitch. Just the number.
        </p>
      </div>

      {/* Estimator card */}
      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-7">
        <EstimatorClient />
      </div>

      {/* Trust signals */}
      <div className="mt-6 flex flex-wrap justify-center gap-4 text-xs text-gray-400">
        <span>📊 Trained on 50k+ real listings</span>
        <span>⚡ &lt;1s estimate</span>
        <span>🔒 No signup required</span>
        <span>🇮🇳 From Surat, India&apos;s diamond capital</span>
      </div>
    </div>
  );
}
