import type { Metadata } from "next";
import Link from "next/link";
import { SeoPageShell } from "@/components/SeoPageShell";
import { EstimatorClient } from "@/components/EstimatorClient";

export const metadata: Metadata = {
  title: "1 Carat Diamond Price — How Much Does a 1ct Diamond Cost? | DiamondPrice IQ",
  description:
    "How much does a 1 carat diamond cost? Get an instant price estimate for any 1ct diamond based on cut, color, and clarity. Prices range from $2,000 to $20,000+ depending on quality.",
  keywords: ["1 carat diamond price", "1ct diamond cost", "one carat diamond price", "1 carat diamond value", "how much is a 1 carat diamond"],
  openGraph: {
    title: "1 Carat Diamond Price Guide — DiamondPrice IQ",
    description: "How much does a 1 carat diamond cost? Find out instantly — no signup needed.",
    type: "website",
    images: [{ url: "/api/og?carat=1.00&cut=Ideal&color=G&clarity=VS1&low=5427&mid=6543&high=7116", width: 1200, height: 630 }],
  },
  alternates: { canonical: "https://diamondpriceiq.com/1-carat-diamond-price" },
};

const faqs = [
  {
    q: "How much does a 1 carat diamond cost?",
    a: "A 1 carat diamond ranges from around $2,000 to $20,000+ depending on cut, color, and clarity. An Ideal-cut, D-color, VS1-clarity 1ct stone trades around $9,000–$12,000 at retail. A Good-cut, I-color, SI1 stone of the same weight can be under $3,000.",
  },
  {
    q: "Why do 1 carat diamond prices vary so much?",
    a: "Two 1ct diamonds can differ in price by 5× or more. Cut quality, color grade, clarity, shape, and certification each affect price significantly. An Ideal cut returns far more light than a Fair cut and commands a 15–25% premium. Color D vs J differs by 30–50% for otherwise identical stones.",
  },
  {
    q: "What is the 'magic size' effect at 1 carat?",
    a: "Diamonds are priced per carat, but the price-per-carat jumps sharply at round-number thresholds like 0.5ct, 1.0ct, and 2.0ct — these are called 'magic sizes.' A 0.99ct stone is nearly visually identical to a 1.00ct stone but can be 10–20% cheaper because it falls just below the 1ct threshold. Our model captures this non-linearity.",
  },
  {
    q: "Round vs fancy shape — how much does it affect a 1ct price?",
    a: "Round brilliant diamonds command a 10–30% premium over fancy shapes (oval, cushion, pear, etc.) of the same weight and quality, because rounds require more rough diamond to cut and have higher demand. If budget is a priority, a well-cut oval or cushion at 1ct can offer significantly better value.",
  },
];

const priceTable = [
  { cut: "Ideal",     color: "D", clarity: "VS1", low: "$7,500",  mid: "$9,500",  high: "$12,000" },
  { cut: "Ideal",     color: "G", clarity: "VS1", low: "$5,200",  mid: "$6,500",  high: "$8,000"  },
  { cut: "Ideal",     color: "G", clarity: "SI1", low: "$3,800",  mid: "$4,800",  high: "$6,000"  },
  { cut: "Very Good", color: "H", clarity: "VS2", low: "$3,500",  mid: "$4,400",  high: "$5,500"  },
  { cut: "Good",      color: "I", clarity: "SI1", low: "$2,500",  mid: "$3,200",  high: "$4,000"  },
  { cut: "Fair",      color: "J", clarity: "SI2", low: "$1,800",  mid: "$2,300",  high: "$3,000"  },
];

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map(({ q, a }) => ({
    "@type": "Question",
    name: q,
    acceptedAnswer: { "@type": "Answer", text: a },
  })),
};

const intro = (
  <>
    A 1ct diamond ranges from ~$2,000 to $20,000+ depending on cut, color, and clarity.
    Use the calculator below to get an instant estimate for the exact combination you&apos;re looking at.
  </>
);

const extra = (
  <section className="mb-8">
    <h2 className="text-lg font-bold text-gray-900 mb-3">1 carat diamond price ranges by quality</h2>
    <p className="text-xs text-gray-500 mb-4">
      Approximate listing price ranges (USD, round brilliant). Use the calculator above for a precise estimate.
    </p>
    <div className="overflow-x-auto rounded-xl border border-gray-100">
      <table className="w-full text-xs">
        <thead className="bg-gray-50">
          <tr>
            {["Cut", "Color", "Clarity", "Low", "Median", "High"].map((h) => (
              <th key={h} className="px-3 py-2.5 text-left font-semibold text-gray-500">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {priceTable.map((row, i) => (
            <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-gray-50/50"}>
              <td className="px-3 py-2 font-medium text-gray-800">{row.cut}</td>
              <td className="px-3 py-2 text-gray-600">{row.color}</td>
              <td className="px-3 py-2 text-gray-600">{row.clarity}</td>
              <td className="px-3 py-2 text-gray-500">{row.low}</td>
              <td className="px-3 py-2 font-bold text-gray-900">{row.mid}</td>
              <td className="px-3 py-2 text-gray-500">{row.high}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    <p className="mt-2 text-xs text-gray-400">
      *Estimates from public listing data. Not certified appraisals.{" "}
      <Link href="/methodology" className="underline hover:text-amber-700">See methodology</Link>
    </p>
  </section>
);

export default function OneCaratPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <SeoPageShell
        pageId="1-carat-diamond-price"
        headline="1 Carat Diamond Price"
        intro={intro}
        formSlot={<EstimatorClient />}
        faqs={faqs}
        extra={extra}
      />
    </>
  );
}
