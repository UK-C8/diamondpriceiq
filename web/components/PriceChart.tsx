"use client";

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer, ReferenceLine, Cell,
} from "recharts";
import type { PriceBand } from "@/lib/types";
import { formatUSD } from "@/lib/utils";

interface PriceChartProps {
  band: PriceBand;
  lowConfidence: boolean;
  quotedPrice?: number;
}

const COLORS = {
  low: "#FDE68A",
  mid: "#F59E0B",
  high: "#D97706",
};

export function PriceChart({ band, lowConfidence, quotedPrice }: PriceChartProps) {
  const data = [
    { name: "Low", value: band.low, fill: COLORS.low },
    { name: "Mid (median)", value: band.mid, fill: COLORS.mid },
    { name: "High", value: band.high, fill: COLORS.high },
  ];

  const yMin = Math.max(0, band.low * 0.85);
  const yMax = band.high * 1.1;

  const textSummary = `Estimated price range: low ${formatUSD(band.low)}, median ${formatUSD(band.mid)}, high ${formatUSD(band.high)}.`;

  return (
    <div>
      {lowConfidence && (
        <div
          role="status"
          className="mb-3 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-800"
        >
          <span className="mt-0.5 flex-shrink-0 text-amber-500">⚠</span>
          <span>
            <strong>Limited data — wider range.</strong> Few comparable listings exist for this combination. The band is intentionally wider to reflect that uncertainty.
          </span>
        </div>
      )}

      {/* Accessible text fallback for screen readers */}
      <p className="sr-only">{textSummary}</p>

      <div aria-hidden="true">
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={data} margin={{ top: 4, right: 8, left: 8, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#6B7280" }} axisLine={false} tickLine={false} />
            <YAxis
              domain={[yMin, yMax]}
              tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
              tick={{ fontSize: 10, fill: "#9CA3AF" }}
              axisLine={false}
              tickLine={false}
              width={40}
            />
            <RechartsTooltip
              formatter={(v: unknown) => [formatUSD(v as number), "Price"]}
              contentStyle={{ borderRadius: "0.75rem", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0/0.1)" }}
              labelStyle={{ fontWeight: 600, marginBottom: 2 }}
            />
            <Bar dataKey="value" radius={[8, 8, 0, 0]}>
              {data.map((entry, i) => (
                <Cell key={i} fill={entry.fill} />
              ))}
            </Bar>
            {quotedPrice !== undefined && (
              <ReferenceLine
                y={quotedPrice}
                stroke="#1D4ED8"
                strokeDasharray="5 3"
                strokeWidth={2}
                label={{ value: "Your quote", position: "insideTopRight", fontSize: 10, fill: "#1D4ED8" }}
              />
            )}
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Numeric band summary — always visible */}
      <div className="mt-3 grid grid-cols-3 gap-2 text-center">
        {[
          { label: "Low", total: band.low, perCarat: band.per_carat_low },
          { label: "Median", total: band.mid, perCarat: band.per_carat_mid },
          { label: "High", total: band.high, perCarat: band.per_carat_high },
        ].map(({ label, total, perCarat }) => (
          <div key={label} className="rounded-xl bg-gray-50 border border-gray-100 p-3">
            <p className="text-xs text-gray-500 font-medium">{label}</p>
            <p className="text-base font-bold text-gray-900 mt-0.5">{formatUSD(total)}</p>
            <p className="text-xs text-gray-400">{formatUSD(perCarat)}/ct</p>
          </div>
        ))}
      </div>
    </div>
  );
}
