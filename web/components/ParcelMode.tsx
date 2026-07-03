"use client";

import { useState, useRef } from "react";
import * as RadixTooltip from "@radix-ui/react-tooltip";
import { Upload, Plus, Trash2, Download, ChevronDown, ChevronUp } from "lucide-react";
import { analytics } from "@/lib/analytics";
import { parseCSV, csvTemplateBlob, PARCEL_ROW_CAP } from "@/lib/parcel";
import { formatUSD } from "@/lib/utils";
import { CUT_OPTIONS, COLOR_OPTIONS, CLARITY_OPTIONS } from "@/lib/constants";
import type { StoneInput, StoneEstimate } from "@/lib/types";
import { fetchParcelEstimate } from "@/lib/api";
import { LeadCapture } from "./LeadCapture";
import { ShareCard } from "./ShareCard";

const EMPTY_ROW = (): StoneInput => ({ carat: 1.0, cut: "Ideal", color: "G", clarity: "VS1" });

interface ParcelRow {
  id: number;
  stone: StoneInput;
  estimate?: StoneEstimate;
}

let _id = 0;
const newRow = (stone = EMPTY_ROW()): ParcelRow => ({ id: ++_id, stone });

type RunState = "idle" | "loading" | "done" | "error";

// ── Confidence dot ──────────────────────────────────────────────────────────
function ConfidenceDot({ level, reason }: { level: "high" | "medium" | "low"; reason: string | null }) {
  const colors: Record<string, string> = {
    high:   "bg-emerald-500",
    medium: "bg-amber-400",
    low:    "bg-red-400",
  };
  const label =
    level === "high"   ? "High confidence" :
    level === "medium" ? "Medium confidence" :
    "Low confidence — limited data";

  const tip = reason
    ? `${label}. ${reason}`
    : label;

  return (
    <RadixTooltip.Provider delayDuration={150}>
      <RadixTooltip.Root>
        <RadixTooltip.Trigger asChild>
          <button
            type="button"
            aria-label={tip}
            className="inline-flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-amber-400 rounded-full"
          >
            <span className={`block w-2.5 h-2.5 rounded-full ${colors[level]}`} />
          </button>
        </RadixTooltip.Trigger>
        <RadixTooltip.Portal>
          <RadixTooltip.Content
            className="max-w-xs bg-gray-900 text-white text-xs rounded-lg px-3 py-2 shadow-lg z-50 leading-relaxed"
            sideOffset={4}
          >
            {tip}
            <RadixTooltip.Arrow className="fill-gray-900" />
          </RadixTooltip.Content>
        </RadixTooltip.Portal>
      </RadixTooltip.Root>
    </RadixTooltip.Provider>
  );
}

// ── Inline band summary (shown in expanded detail) ──────────────────────────
function BandCells({ est }: { est: StoneEstimate }) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {([["Low", est.band.low, "text-gray-500"], ["Mid", est.band.mid, "text-gray-900 font-bold"], ["High", est.band.high, "text-gray-500"]] as const).map(([label, val, cls]) => (
        <div key={label} className="rounded-lg bg-amber-50 border border-amber-100 p-2 text-center">
          <p className="text-[10px] text-amber-700 mb-0.5">{label}</p>
          <p className={`text-xs font-mono ${cls}`}>{formatUSD(val)}</p>
          <p className="text-[10px] text-amber-500">{formatUSD(label === "Low" ? est.band.per_carat_low : label === "Mid" ? est.band.per_carat_mid : est.band.per_carat_high)}/ct</p>
        </div>
      ))}
    </div>
  );
}

// ── Grade selects (shown in expanded detail) ─────────────────────────────────
function GradeSelects({ stone, onChange }: { stone: StoneInput; onChange: (patch: Partial<StoneInput>) => void }) {
  const sel = "rounded-lg border border-gray-200 px-2 py-1 text-xs focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-200 w-full";
  return (
    <div className="grid grid-cols-3 gap-2 mt-2">
      <div>
        <label className="text-[10px] text-gray-400 block mb-0.5">Cut</label>
        <select value={stone.cut} onChange={(e) => onChange({ cut: e.target.value as StoneInput["cut"] })} className={sel}>
          {CUT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.value}</option>)}
        </select>
      </div>
      <div>
        <label className="text-[10px] text-gray-400 block mb-0.5">Color</label>
        <select value={stone.color} onChange={(e) => onChange({ color: e.target.value as StoneInput["color"] })} className={sel}>
          {COLOR_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.value}</option>)}
        </select>
      </div>
      <div>
        <label className="text-[10px] text-gray-400 block mb-0.5">Clarity</label>
        <select value={stone.clarity} onChange={(e) => onChange({ clarity: e.target.value as StoneInput["clarity"] })} className={sel}>
          {CLARITY_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.value}</option>)}
        </select>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export function ParcelMode() {
  const [rows, setRows] = useState<ParcelRow[]>([newRow()]);
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const [runState, setRunState] = useState<RunState>("idle");
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [apiError, setApiError] = useState("");
  const [totalLow, setTotalLow] = useState(0);
  const [totalMid, setTotalMid] = useState(0);
  const [totalHigh, setTotalHigh] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);

  function toggleExpand(id: number) {
    setExpanded((s) => {
      const next = new Set(s);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function updateRow(id: number, patch: Partial<StoneInput>) {
    setRows((rs) => rs.map((r) => r.id === id ? { ...r, stone: { ...r.stone, ...patch } } : r));
  }

  function addRow() {
    if (rows.length >= PARCEL_ROW_CAP) return;
    setRows((rs) => [...rs, newRow()]);
  }

  function removeRow(id: number) {
    setRows((rs) => rs.filter((r) => r.id !== id));
    setExpanded((s) => { const n = new Set(s); n.delete(id); return n; });
  }

  async function handleCSV(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.endsWith(".csv")) { setParseErrors(["File must be a .csv"]); return; }
    if (file.size > 2 * 1024 * 1024) { setParseErrors(["CSV must be under 2MB"]); return; }
    const text = await file.text();
    const { rows: parsed, errors } = parseCSV(text);
    setParseErrors(errors.map((e) => `Row ${e.rowIndex}: ${e.message}`));
    if (parsed.length > 0) setRows(parsed.map((p) => newRow(p.stone)));
    e.target.value = "";
  }

  function downloadTemplate() {
    const blob = csvTemplateBlob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "parcel-template.csv"; a.click();
    URL.revokeObjectURL(url);
  }

  async function runEstimates() {
    setRunState("loading");
    setApiError("");
    try {
      const stones = rows.map((r) => r.stone);
      const res = await fetchParcelEstimate(stones);
      const estimates = res.estimates!;
      setRows((rs) => rs.map((r, i) => ({ ...r, estimate: estimates[i] })));
      setTotalLow(res.parcel_total_low ?? 0);
      setTotalMid(res.parcel_total_mid ?? 0);
      setTotalHigh(res.parcel_total_high ?? 0);
      setRunState("done");
      analytics.parcelRun(stones.length, "rows");
    } catch (err) {
      setApiError(err instanceof Error ? err.message : "Estimate failed");
      analytics.estimateError("parcel_api_error");
      setRunState("error");
    }
  }

  function downloadResults() {
    const header = "carat,cut,color,clarity,price_low,price_mid,price_high,confidence";
    const lines = rows.map((r) => {
      const e = r.estimate;
      return [r.stone.carat, r.stone.cut, r.stone.color, r.stone.clarity,
        e?.band.low ?? "", e?.band.mid ?? "", e?.band.high ?? "", e?.confidence_level ?? ""].join(",");
    });
    const blob = new Blob([header + "\n" + lines.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "parcel-estimates.csv"; a.click();
    URL.revokeObjectURL(url);
  }

  const confidenceCounts = rows.reduce<Record<string, number>>((acc, r) => {
    const c = r.estimate?.confidence_level ?? "";
    if (c) acc[c] = (acc[c] ?? 0) + 1;
    return acc;
  }, {});

  const firstStone = rows[0]?.stone;
  const firstBand = runState === "done" && rows[0]?.estimate ? rows[0].estimate.band : null;

  const inputCls = "w-16 rounded-lg border border-gray-200 px-2 py-1 text-xs focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-200";

  return (
    <div className="space-y-5">
      {/* Toolbar — stacks vertically on mobile */}
      <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2 sm:items-center sm:justify-between">
        <div className="flex flex-col sm:flex-row gap-2 sm:flex-wrap">
          <button onClick={addRow} disabled={rows.length >= PARCEL_ROW_CAP}
            className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-amber-400 transition">
            <Plus className="w-3.5 h-3.5" /> Add stone
          </button>
          <button onClick={() => fileRef.current?.click()}
            className="flex items-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800 hover:bg-amber-100 focus:outline-none focus:ring-2 focus:ring-amber-400 transition">
            <Upload className="w-3.5 h-3.5" /> Upload CSV
          </button>
          <button onClick={downloadTemplate}
            className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-500 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-amber-400 transition">
            <Download className="w-3.5 h-3.5" /> CSV template
          </button>
        </div>
        <span className="text-xs text-gray-400 sm:ml-auto">{rows.length} / {PARCEL_ROW_CAP} stones</span>
        <input ref={fileRef} type="file" accept=".csv" onChange={handleCSV} className="hidden" aria-label="Upload CSV file" />
      </div>

      {parseErrors.length > 0 && (
        <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700 space-y-1">
          {parseErrors.slice(0, 5).map((e, i) => <p key={i}>{e}</p>)}
          {parseErrors.length > 5 && <p>…and {parseErrors.length - 5} more errors</p>}
        </div>
      )}

      {/* ── DESKTOP TABLE (sm and above) ──────────────────────────────────── */}
      <div className="hidden sm:block rounded-xl border border-gray-100 overflow-hidden">
        <table className="w-full text-xs">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2.5 text-left font-semibold text-gray-400 w-8">#</th>
              <th className="px-2 py-2.5 text-left font-semibold text-gray-500">Carat</th>
              <th className="px-3 py-2.5 text-left font-semibold text-gray-500">Grade</th>
              <th className="px-3 py-2.5 text-left font-semibold text-gray-500">Mid price</th>
              <th className="px-3 py-2.5 text-left font-semibold text-gray-400 w-8" aria-label="Confidence"></th>
              <th className="w-8"></th>
              <th className="w-8"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {rows.map((row, idx) => {
              const est = row.estimate;
              const isOpen = expanded.has(row.id);
              const grade = `${row.stone.cut} · ${row.stone.color} · ${row.stone.clarity}`;

              return [
                /* Collapsed row */
                <tr key={row.id}
                  className="bg-white hover:bg-gray-50/70 transition-colors"
                >
                  <td className="px-3 py-2 text-gray-400 font-mono">{idx + 1}</td>
                  <td className="px-2 py-1.5">
                    <input type="number" step="0.01" min="0.01" max="20"
                      value={row.stone.carat}
                      onChange={(e) => updateRow(row.id, { carat: parseFloat(e.target.value) || 1 })}
                      aria-label={`Carat for stone ${idx + 1}`}
                      className={inputCls} />
                  </td>
                  <td className="px-3 py-2 text-gray-600 whitespace-nowrap">{grade}</td>
                  <td className="px-3 py-2 font-mono font-bold text-gray-900">
                    {est ? formatUSD(est.band.mid) : <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-3 py-2">
                    {est && (
                      <ConfidenceDot
                        level={est.confidence_level}
                        reason={est.low_confidence_reason}
                      />
                    )}
                  </td>
                  <td className="px-1 py-1.5">
                    <button
                      onClick={() => toggleExpand(row.id)}
                      aria-expanded={isOpen}
                      aria-label={isOpen ? `Collapse row ${idx + 1}` : `Expand row ${idx + 1}`}
                      className="rounded p-1 text-gray-400 hover:text-gray-700 focus:outline-none focus:ring-1 focus:ring-amber-400 transition"
                    >
                      {isOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>
                  </td>
                  <td className="px-1 py-1.5">
                    <button onClick={() => removeRow(row.id)} disabled={rows.length <= 1}
                      aria-label={`Remove stone ${idx + 1}`}
                      className="rounded p-1 text-gray-300 hover:text-red-500 disabled:opacity-20 focus:outline-none focus:ring-1 focus:ring-red-400 transition">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>,

                /* Expanded detail row */
                isOpen && (
                  <tr key={`${row.id}-detail`} className="bg-gray-50/60">
                    <td colSpan={7} className="px-4 py-3">
                      <div className="space-y-2">
                        {est && (
                          <>
                            <BandCells est={est} />
                            {est.low_confidence && (
                              <p className="text-[10px] text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-2 py-1">
                                ⚠ Limited data — wider range. Few comparable listings exist for this combination.
                              </p>
                            )}
                          </>
                        )}
                        <GradeSelects stone={row.stone} onChange={(patch) => updateRow(row.id, patch)} />
                      </div>
                    </td>
                  </tr>
                ),
              ];
            })}
          </tbody>
        </table>
      </div>

      {/* ── MOBILE CARDS (below sm) ───────────────────────────────────────── */}
      <div className="sm:hidden space-y-2">
        {rows.map((row, idx) => {
          const est = row.estimate;
          const isOpen = expanded.has(row.id);
          const grade = `${row.stone.cut} · ${row.stone.color} · ${row.stone.clarity}`;

          return (
            <div key={row.id} className="rounded-xl border border-gray-100 bg-white overflow-hidden">
              {/* Card header — always visible */}
              <div className="flex items-center gap-2 px-3 py-2.5">
                <span className="text-xs text-gray-400 font-mono w-5 shrink-0">{idx + 1}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-600 truncate">{grade}</span>
                    {est && <ConfidenceDot level={est.confidence_level} reason={est.low_confidence_reason} />}
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    <input type="number" step="0.01" min="0.01" max="20"
                      value={row.stone.carat}
                      onChange={(e) => updateRow(row.id, { carat: parseFloat(e.target.value) || 1 })}
                      aria-label={`Carat for stone ${idx + 1}`}
                      className="w-16 rounded-lg border border-gray-200 px-2 py-1 text-xs focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-200" />
                    <span className="text-sm font-bold text-gray-900 font-mono">
                      {est ? formatUSD(est.band.mid) : <span className="text-gray-300 text-xs">—</span>}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => toggleExpand(row.id)}
                    aria-expanded={isOpen}
                    aria-label={isOpen ? `Collapse stone ${idx + 1}` : `Expand stone ${idx + 1}`}
                    className="rounded p-1 text-gray-400 hover:text-gray-700 focus:outline-none focus:ring-1 focus:ring-amber-400 transition">
                    {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                  <button onClick={() => removeRow(row.id)} disabled={rows.length <= 1}
                    aria-label={`Remove stone ${idx + 1}`}
                    className="rounded p-1 text-gray-300 hover:text-red-500 disabled:opacity-20 focus:outline-none focus:ring-1 focus:ring-red-400 transition">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Expanded detail */}
              {isOpen && (
                <div className="border-t border-gray-100 px-3 py-3 space-y-2 bg-gray-50/60">
                  {est && (
                    <>
                      <BandCells est={est} />
                      {est.low_confidence && (
                        <p className="text-[10px] text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-2 py-1">
                          ⚠ Limited data — wider range.
                        </p>
                      )}
                    </>
                  )}
                  <GradeSelects stone={row.stone} onChange={(patch) => updateRow(row.id, patch)} />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Run button */}
      <button onClick={runEstimates} disabled={runState === "loading"}
        className="w-full rounded-xl bg-amber-500 px-6 py-3.5 text-sm font-bold text-white shadow hover:bg-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed transition">
        {runState === "loading" ? `Estimating ${rows.length} stones…` : `Estimate ${rows.length} stone${rows.length !== 1 ? "s" : ""} →`}
      </button>

      {apiError && <p role="alert" className="text-xs text-red-600">{apiError}</p>}

      {/* Parcel summary — unchanged */}
      {runState === "done" && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-amber-100 bg-amber-50 p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-gray-900">Parcel total</h3>
              <button onClick={downloadResults}
                className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-amber-400 transition">
                <Download className="w-3 h-3" /> Export CSV
              </button>
            </div>
            <div className="grid grid-cols-3 gap-3 mb-4">
              {([["Low", totalLow], ["Median", totalMid], ["High", totalHigh]] as const).map(([label, val]) => (
                <div key={label} className="text-center rounded-xl bg-white border border-amber-100 p-3">
                  <p className="text-xs text-gray-500 mb-1">{label}</p>
                  <p className="text-lg font-bold text-gray-900">{formatUSD(val)}</p>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-3 text-xs text-gray-500">
              <span>{rows.length} stones</span>
              {Object.entries(confidenceCounts).map(([level, count]) => (
                <span key={level}>{count} {level} confidence</span>
              ))}
            </div>
          </div>

          {firstBand && (
            <>
              <ShareCard stone={firstStone} band={firstBand} />
              <LeadCapture stone={firstStone} band={firstBand} modelVersion="0.1.0" />
            </>
          )}
        </div>
      )}
    </div>
  );
}
