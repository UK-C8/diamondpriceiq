import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

function fmt(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const carat   = searchParams.get("carat") ?? "1.00";
  const cut     = searchParams.get("cut") ?? "Ideal";
  const color   = searchParams.get("color") ?? "G";
  const clarity = searchParams.get("clarity") ?? "VS1";
  const low     = parseFloat(searchParams.get("low") ?? "0");
  const mid     = parseFloat(searchParams.get("mid") ?? "0");
  const high    = parseFloat(searchParams.get("high") ?? "0");

  return new ImageResponse(
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: "1200px",
        height: "630px",
        background: "linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 50%, #FDE68A 100%)",
        padding: "60px",
        fontFamily: "sans-serif",
      }}
    >
      {/* Brand */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "40px" }}>
        <svg width="44" height="44" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            <polygon points="20,4 32,14 20,14" fill="#FDE68A" />
            <polygon points="20,4 8,14 20,14" fill="#FCD34D" />
            <polygon points="4,17 20,17 20,36" fill="#F59E0B" />
            <polygon points="36,17 20,17 20,36" fill="#D97706" />
            <polyline points="4,17 20,4 36,17 20,36 4,17" stroke="#92400E" strokeWidth="1.2" strokeLinejoin="round" fill="none" />
          </svg>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <span style={{ fontSize: "28px", fontWeight: 800, color: "#111827" }}>
            DiamondPrice <span style={{ color: "#F59E0B" }}>IQ</span>
          </span>
          <span style={{ fontSize: "14px", color: "#6B7280" }}>Fair-market estimate · from the diamond capital</span>
        </div>
      </div>

      {/* Stone */}
      <div style={{ display: "flex", gap: "16px", marginBottom: "36px", flexWrap: "wrap" }}>
        {[
          ["Carat", `${carat} ct`],
          ["Cut", cut],
          ["Color", color],
          ["Clarity", clarity],
        ].map(([label, val]) => (
          <div key={label} style={{ display: "flex", flexDirection: "column", background: "white", borderRadius: "12px", padding: "12px 20px", boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
            <span style={{ fontSize: "11px", color: "#9CA3AF", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</span>
            <span style={{ fontSize: "20px", fontWeight: 700, color: "#111827", marginTop: "2px" }}>{val}</span>
          </div>
        ))}
      </div>

      {/* Price band */}
      <div style={{ display: "flex", gap: "20px", flex: 1 }}>
        {[
          { label: "Low", value: fmt(low), bg: "#FDE68A", text: "#92400E" },
          { label: "Median", value: fmt(mid), bg: "#F59E0B", text: "#78350F" },
          { label: "High", value: fmt(high), bg: "#D97706", text: "#451A03" },
        ].map(({ label, value, bg, text }) => (
          <div key={label} style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: bg, borderRadius: "20px", flex: 1, padding: "24px" }}>
            <span style={{ fontSize: "14px", fontWeight: 700, color: text, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "8px" }}>{label}</span>
            <span style={{ fontSize: "36px", fontWeight: 800, color: text }}>{value}</span>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div style={{ display: "flex", marginTop: "28px", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: "12px", color: "#9CA3AF" }}>Fair-market estimate from public listing data · not a certified appraisal</span>
        <span style={{ fontSize: "13px", fontWeight: 700, color: "#F59E0B" }}>diamondpriceiq.com</span>
      </div>
    </div>,
    { width: 1200, height: 630 }
  );
}
