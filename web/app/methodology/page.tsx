import type { Metadata } from "next";
import Link from "next/link";
import { Disclaimer } from "@/components/Disclaimer";
import { ClarityPriceChart } from "@/components/ClarityPriceChart";

export const metadata: Metadata = {
  title: "How It Works — DiamondPrice IQ",
  description:
    "Learn how DiamondPrice IQ estimates diamond prices: data sources, machine-learning model, accuracy figures, and important caveats.",
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="mb-3 text-lg font-bold text-gray-900">{title}</h2>
      <div className="text-sm text-gray-700 leading-relaxed space-y-3">{children}</div>
    </section>
  );
}

function StatCard({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 text-center">
      <p className="text-xs text-gray-500 font-medium mb-1">{label}</p>
      <p className="text-xl font-extrabold text-amber-600">{value}</p>
      <p className="text-xs text-gray-400 mt-0.5">{note}</p>
    </div>
  );
}

export default function MethodologyPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <Link
        href="/"
        className="mb-6 inline-flex items-center gap-1 text-xs font-medium text-gray-400 hover:text-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-400 rounded"
      >
        ← Back to estimator
      </Link>

      <h1 className="mb-2 text-2xl font-extrabold tracking-tight text-gray-900">
        How DiamondPrice IQ works
      </h1>
      <p className="mb-8 text-sm text-gray-500">
        A plain-English explanation of our data, model, and what the numbers mean.
      </p>

      {/* Accuracy stats */}
      <div className="mb-8 grid grid-cols-3 gap-3">
        <StatCard label="Overall accuracy" value="7.5% MAPE" note="Mean absolute % error on held-out test data" />
        <StatCard label="Large stones (>2ct)" value="9.2% MAPE" note="Slightly wider — fewer comparables" />
        <StatCard label="Band coverage" value="87%" note="Of test stones fall inside our displayed range" />
      </div>

      <Section title="Data sources">
        <p>
          Our model was trained on approximately <strong>50,000 diamond listings</strong> from publicly available datasets,
          primarily the widely-used GIA-scale diamonds dataset published alongside the R ggplot2 library.
          After removing duplicates, zero-dimension entries, and price outliers, we retained 50,576 high-quality records.
        </p>
        <p>
          Each record includes carat weight, cut grade, color grade, clarity grade, and listing price in USD.
          Where available, shape, fluorescence, and certification lab are also used as model inputs.
        </p>
      </Section>

      <Section title="The model">
        <p>
          We use a <strong>gradient-boosted tree ensemble</strong> (XGBoost and LightGBM) trained to predict
          the natural logarithm of price. The log-price target is standard practice because diamond prices scale
          non-linearly with carat — a 2ct diamond isn&apos;t twice the price of a 1ct; it&apos;s typically 3–4× more expensive.
        </p>
        <p>
          Key features include:
        </p>
        <ul className="list-disc list-inside space-y-1 text-gray-600">
          <li><strong>Carat weight</strong> and its log transform</li>
          <li><strong>Magic-size indicators</strong> — binary flags near 0.50, 1.00, 1.50, 2.00ct, where prices jump sharply</li>
          <li><strong>Cut, color, clarity</strong> as ordinal-encoded GIA grades</li>
          <li><strong>Quality interaction</strong> — carat × sum of grades, capturing that larger stones are more grade-sensitive</li>
          <li><strong>Shape and fluorescence</strong> (when provided)</li>
        </ul>
        <p>
          We predict three values simultaneously: a low (5th percentile), median, and high (95th percentile) estimate
          using separate quantile regression models. This produces an honest <em>range</em>, not a falsely precise point estimate.
        </p>
      </Section>

      <Section title="Accuracy & validation">
        <p>
          We held out 15% of the dataset for testing — stones the model never saw during training.
          The model achieved <strong>7.5% mean absolute percentage error (MAPE)</strong> on these held-out stones overall,
          and <strong>9.2% MAPE on stones above 2.0 carats</strong> (where data is naturally sparser).
          <strong> 87% of test stones fell inside our displayed price band</strong>, exceeding our 80% target.
        </p>
        <p>
          Every model change must pass automated <em>monotonicity tests</em> before deployment:
          a diamond with better clarity, color, or cut must never predict a lower price than a worse stone,
          all else equal. These tests run in our CI pipeline on every code change.
        </p>
      </Section>

      <Section title="Important caveat: listing prices vs. transaction prices">
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <p className="font-semibold text-amber-800 mb-1">⚠ This is the most important thing to understand</p>
          <p className="text-amber-800">
            All training data is <strong>retailer asking/listing prices</strong>, not what buyers actually paid.
            Real transaction prices are typically <strong>10–30% below listed prices</strong> due to negotiation and promotions.
            Our estimates therefore reflect what you might see quoted at a jeweler, not the absolute floor you could negotiate to.
          </p>
        </div>
        <p>
          This is why our tool is called a <em>fair-market estimate</em>, not a certified appraisal.
          A professional appraiser has access to closed transaction data, the physical stone, and market relationships
          that no public model can replicate.
        </p>
      </Section>

      <Section title="What the price band means">
        <p>
          The three values — <strong>Low, Median, High</strong> — represent the 5th, 50th, and 95th percentile of
          prices we&apos;d expect to see listed for comparable diamonds. Roughly:
        </p>
        <ul className="list-disc list-inside space-y-1 text-gray-600">
          <li><strong>Below the Low:</strong> unusually cheap — verify the grading report carefully</li>
          <li><strong>At the Median:</strong> typical market price for this combination of 4Cs</li>
          <li><strong>Above the High:</strong> a premium price — may reflect unmeasured qualities like cut symmetry, brand, or setting</li>
        </ul>
        <p>
          When the <strong>Limited data</strong> flag appears, the band is intentionally widened because
          fewer than ~50 comparable listings exist in our training data for that specific combination.
          This is most common for stones above 2 carats, Flawless (FL) clarity, or unusual shapes.
        </p>
      </Section>

      <section className="mb-8">
        <h2 className="mb-3 text-lg font-bold text-gray-900">What the data shows</h2>
        <p className="text-sm text-gray-700 leading-relaxed mb-4">
          The chart below illustrates how our model prices a 1.00ct Ideal-cut G-color diamond
          across all eleven GIA clarity grades. The amber band is the 5th–95th percentile range
          our model predicts; the line is the median. Flawless diamonds list at roughly{" "}
          <strong>3× the price of Included (I3) stones</strong> at equivalent carat, cut, and color — a
          range that holds up across our 50,576-listing training set.
        </p>
        <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
          <ClarityPriceChart />
        </div>
      </section>

      <Section title="Natural diamonds only">
        <p>
          This tool is calibrated for <strong>natural white diamonds</strong> only.
          Lab-grown diamonds have different pricing dynamics and are not modeled here.
          Fancy-colored diamonds and other gemstones are also out of scope.
        </p>
      </Section>

      <Section title="Built by Centr8 LLP">
        <p>
          DiamondPrice IQ is a free public tool built by{" "}
          <a href="https://centr8.in" target="_blank" rel="noopener noreferrer" className="underline text-amber-700 hover:text-amber-800">
            Centr8 LLP
          </a>
          , a technology company based in Surat, Gujarat — India&apos;s diamond capital.
          It demonstrates Centr8&apos;s AI/ML, web development, and data analytics capabilities.
          Jewelers, lenders, and insurers interested in a private API or embeddable widget can register interest below.
        </p>
      </Section>

      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm mt-8">
        <Disclaimer />
      </div>

      <div className="mt-6 text-center">
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-6 py-3 text-sm font-bold text-white shadow hover:bg-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-400 transition"
        >
          Try the estimator →
        </Link>
      </div>
    </div>
  );
}
