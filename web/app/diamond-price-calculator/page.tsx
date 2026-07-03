import type { Metadata } from "next";
import { SeoPageShell } from "@/components/SeoPageShell";
import { EstimatorClient } from "@/components/EstimatorClient";
import { ClarityPriceChart } from "@/components/ClarityPriceChart";

export const metadata: Metadata = {
  title: "Free Diamond Price Calculator — Instant 4Cs Estimate | DiamondPrice IQ",
  description:
    "Use our free diamond price calculator to get an instant fair-market estimate for any diamond. Enter carat, cut, color, and clarity — get a price range in seconds. No signup required.",
  keywords: ["diamond price calculator", "diamond price estimator", "4Cs calculator", "diamond value calculator", "GIA diamond price"],
  openGraph: {
    title: "Free Diamond Price Calculator — DiamondPrice IQ",
    description: "Instant fair-market diamond price estimate from the 4Cs. No signup required.",
    type: "website",
    images: [{ url: "/api/og?carat=1.00&cut=Ideal&color=G&clarity=VS1&low=5427&mid=6543&high=7116", width: 1200, height: 630 }],
  },
  alternates: { canonical: "https://diamondpriceiq.com/diamond-price-calculator" },
};

const webAppSchema = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "DiamondPrice IQ — Diamond Price Calculator",
  description: "Free diamond price calculator. Enter the 4Cs and get an instant fair-market price range.",
  applicationCategory: "FinanceApplication",
  operatingSystem: "Web",
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  author: { "@type": "Organization", name: "Centr8 LLP" },
};

const faqs = [
  {
    q: "How accurate is this diamond price calculator?",
    a: "The model achieves 7.5% mean absolute percentage error (MAPE) on held-out test data, with 87% of test stones falling inside the displayed band. It is trained on 50,000+ real GIA-scale listings.",
  },
  {
    q: "What are the 4Cs of a diamond?",
    a: "The 4Cs are the four main characteristics graded by GIA: Carat (weight), Cut (light performance), Color (lack of color, D–Z scale), and Clarity (absence of inclusions, FL–I3 scale). Together they determine a diamond's quality and price.",
  },
  {
    q: "Does the calculator show the actual transaction price?",
    a: "No. The estimate reflects listing/asking prices from online retailers. Actual transaction prices are typically 10–30% lower due to negotiation. This is a fair-market estimate, not a certified appraisal.",
  },
  {
    q: "Do I need to create an account?",
    a: "No account or signup is needed. Enter the 4Cs and get your estimate instantly. An optional email lets you download a branded PDF report.",
  },
];

const intro = (
  <>
    Enter the 4Cs of any natural white diamond and get an instant price band — backed by a
    machine-learning model trained on 50,000+ GIA-scale listings. No guesswork, no signup,
    no sales pitch.
  </>
);

export default function DiamondPriceCalculatorPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppSchema) }}
      />
      <SeoPageShell
        pageId="diamond-price-calculator"
        headline="Free Diamond Price Calculator"
        intro={intro}
        formSlot={<EstimatorClient />}
        faqs={faqs}
        extra={
          <>
          <section className="mb-8 space-y-4 text-sm text-gray-700 leading-relaxed">
            <h2 className="text-lg font-bold text-gray-900">How does a diamond price calculator work?</h2>
            <p>
              A diamond price calculator uses the 4Cs — Carat, Cut, Color, and Clarity — to
              estimate a fair-market price range based on comparable listings. Our model is a
              gradient-boosted tree ensemble (XGBoost + LightGBM) trained on 50,576 cleaned
              diamond listings, predicting a low, median, and high band rather than a single
              point estimate.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              {[
                { label: "Carat", text: "Weight in carats (1ct = 0.2g). Price scales non-linearly — a 2ct diamond costs 3–4× a 1ct of equal quality due to rarity." },
                { label: "Cut", text: "How well-proportioned the diamond is cut. Ideal cut returns the most light. Ranges from Ideal to Fair on the GIA scale." },
                { label: "Color", text: "GIA grades D (colorless) to Z (light yellow). D–F are colorless; G–J are near-colorless and offer excellent value." },
                { label: "Clarity", text: "Internal inclusions and surface blemishes. FL (Flawless) is rarest. VS1–VS2 are eye-clean and the sweet spot for most buyers." },
              ].map(({ label, text }) => (
                <div key={label} className="rounded-xl bg-gray-50 border border-gray-100 p-4">
                  <p className="font-bold text-gray-900 mb-1">{label}</p>
                  <p className="text-xs text-gray-600">{text}</p>
                </div>
              ))}
            </div>
          </section>
          <section className="mb-8">
            <h2 className="text-lg font-bold text-gray-900 mb-2">How much does clarity affect price?</h2>
            <p className="text-xs text-gray-500 mb-3">
              Our model's estimate for a 1.00ct Ideal G diamond across all clarity grades — from I3 (included) to FL (flawless).
            </p>
            <div className="rounded-xl border border-gray-100 bg-white p-3 shadow-sm">
              <ClarityPriceChart compact />
            </div>
          </section>
          </>
        }
      />
    </>
  );
}
