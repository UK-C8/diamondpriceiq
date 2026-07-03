"use client";

/**
 * Price-by-clarity chart — static data pre-computed from DiamondPrice IQ's
 * XGBoost + LightGBM ensemble at inference time (1.00ct · Ideal · G sweep).
 * No API call on page load; numbers are baked in at build time.
 */
import {
  ComposedChart, Area, Line, XAxis, YAxis,
  CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer, Legend,
} from "recharts";

// Computed from our model: 1.00ct · Ideal cut · G color, clarity swept FL→I3
// Source: DiamondPrice IQ XGBoost/LightGBM ensemble, 50,576-listing training set
const DATA = [
  { clarity: "I3",  low: 2035, mid: 2823, high: 3209 },
  { clarity: "I2",  low: 2269, mid: 3096, high: 3343 },
  { clarity: "I1",  low: 2701, mid: 3269, high: 3526 },
  { clarity: "SI2", low: 3552, mid: 4262, high: 4812 },
  { clarity: "SI1", low: 4108, mid: 5048, high: 5684 },
  { clarity: "VS2", low: 5237, mid: 6151, high: 6882 },
  { clarity: "VS1", low: 5427, mid: 6543, high: 7116 },
  { clarity: "VVS2",low: 5908, mid: 7444, high: 7955 },
  { clarity: "VVS1",low: 6226, mid: 7799, high: 8735 },
  { clarity: "IF",  low: 7098, mid: 8319, high: 9235 },
  { clarity: "FL",  low: 7719, mid: 9273, high: 10273 },
];

// For Recharts area band: encode as [low, high] via custom area
const CHART_DATA = DATA.map((d) => ({
  clarity: d.clarity,
  band: [d.low, d.high] as [number, number],
  mid: d.mid,
  low: d.low,
  high: d.high,
}));

function fmt(v: number) {
  return `$${(v / 1000).toFixed(1)}k`;
}

interface Props {
  /** Show a more compact version (for the calculator landing page) */
  compact?: boolean;
}

export function ClarityPriceChart({ compact = false }: Props) {
  const height = compact ? 180 : 240;

  // Screen-reader text summary
  const srText =
    "Price by clarity grade for a 1-carat Ideal-cut G-color diamond, from lowest to highest clarity: " +
    DATA.map((d) => `${d.clarity}: median $${d.mid.toLocaleString()}`).join("; ") +
    ". Better clarity commands a higher price; FL (Flawless) diamonds list at roughly 3× the price of I3 (Included).";

  return (
    <div>
      {/* Screen-reader summary */}
      <p className="sr-only">{srText}</p>

      <div aria-hidden="true">
        <ResponsiveContainer width="100%" height={height}>
          <ComposedChart data={CHART_DATA} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
            <XAxis
              dataKey="clarity"
              tick={{ fontSize: 10, fill: "#9CA3AF" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tickFormatter={fmt}
              tick={{ fontSize: 10, fill: "#9CA3AF" }}
              axisLine={false}
              tickLine={false}
              width={38}
              domain={["auto", "auto"]}
            />
            <RechartsTooltip
              formatter={(v: unknown, name?: string | number) => {
                if (name === "Price range") return [`${fmt(Number((v as [number,number])[0]))} – ${fmt(Number((v as [number,number])[1]))}`, String(name)];
                return [fmt(v as number), String(name ?? "")];
              }}
              contentStyle={{
                borderRadius: "0.75rem",
                border: "none",
                boxShadow: "0 4px 6px -1px rgb(0 0 0/0.1)",
                fontSize: 11,
              }}
            />
            {!compact && (
              <Legend
                wrapperStyle={{ fontSize: 10, paddingTop: 8 }}
                formatter={(value) => <span className="text-gray-500">{value}</span>}
              />
            )}
            {/* Shaded band: low → high */}
            <Area
              dataKey="band"
              name="Price range"
              stroke="none"
              fill="#FEF3C7"
              fillOpacity={0.9}
            />
            {/* Median line */}
            <Line
              dataKey="mid"
              name="Median price"
              type="monotone"
              stroke="#F59E0B"
              strokeWidth={2.5}
              dot={{ r: 3, fill: "#F59E0B", strokeWidth: 0 }}
              activeDot={{ r: 5 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <p className="mt-2 text-center text-[10px] text-gray-400 leading-snug">
        1.00ct · Ideal cut · G color · clarity swept I3→FL ·{" "}
        <span className="font-medium">Amber band = 5th–95th percentile range · Line = median</span>
        <br />
        Based on DiamondPrice IQ&apos;s pricing model trained on 50,576 listings
      </p>
    </div>
  );
}
