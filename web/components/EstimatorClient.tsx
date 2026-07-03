"use client";

import { useState } from "react";
import { EstimateForm } from "./EstimateForm";
import { EstimateResult } from "./EstimateResult";
import { SkeletonResult } from "./SkeletonResult";
import { ParcelMode } from "./ParcelMode";
import { fetchEstimate } from "@/lib/api";
import { analytics, caratBucket } from "@/lib/analytics";
import type { StoneInput, EstimateResponse } from "@/lib/types";

type State =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; data: EstimateResponse; stone: StoneInput }
  | { status: "error"; message: string };

export function EstimatorClient({ defaultMode = "single" }: { defaultMode?: "single" | "parcel" } = {}) {
  const [parcelMode, setParcelMode] = useState(defaultMode === "parcel");
  const [state, setState] = useState<State>({ status: "idle" });

  async function handleSubmit(stone: StoneInput) {
    const hasOptional = !!(stone.shape || stone.fluorescence || stone.certificate);
    analytics.estimateStarted(hasOptional);
    setState({ status: "loading" });

    const t0 = performance.now();
    try {
      const data = await fetchEstimate(stone);
      const latencyMs = Math.round(performance.now() - t0);

      analytics.estimateReturned({
        caratBucket: caratBucket(stone.carat),
        color: stone.color,
        clarity: stone.clarity,
        cut: stone.cut,
        shape: stone.shape,
        confidenceLevel: data.estimate!.confidence_level,
        latencyMs,
      });

      if (data.estimate?.low_confidence) {
        analytics.lowConfidenceFlagShown(`${caratBucket(stone.carat)}_${stone.clarity}`);
      }

      setState({ status: "success", data, stone });
      setTimeout(() => {
        document.getElementById("result-section")?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 50);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      analytics.estimateError(msg.includes("API") ? "api_error" : "network_error");
      setState({ status: "error", message: msg });
    }
  }

  return (
    <div className="space-y-6">
      {/* Mode toggle */}
      <div className="flex items-center gap-2" role="group" aria-label="Estimate mode">
        <button
          onClick={() => { setParcelMode(false); setState({ status: "idle" }); }}
          aria-pressed={!parcelMode}
          className={`rounded-xl px-4 py-2 text-xs font-bold transition focus:outline-none focus:ring-2 focus:ring-amber-400 ${!parcelMode ? "bg-amber-500 text-white shadow" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}
        >
          Single stone
        </button>
        <button
          onClick={() => { setParcelMode(true); setState({ status: "idle" }); analytics.pageView("parcel"); }}
          aria-pressed={parcelMode}
          className={`rounded-xl px-4 py-2 text-xs font-bold transition focus:outline-none focus:ring-2 focus:ring-amber-400 ${parcelMode ? "bg-amber-500 text-white shadow" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}
        >
          Parcel / bulk
        </button>
        {parcelMode && (
          <span className="text-xs text-gray-400 ml-1" aria-live="polite">Trade buyers — up to 500 stones</span>
        )}
      </div>

      {parcelMode ? (
        <ParcelMode />
      ) : (
        <>
          <EstimateForm onSubmit={handleSubmit} loading={state.status === "loading"} />

          <div id="result-section" aria-live="polite" aria-atomic="true">
            {state.status === "error" && (
              <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                <p className="font-semibold mb-1">Unable to get estimate</p>
                <p>{state.message}</p>
                <button
                  onClick={() => setState({ status: "idle" })}
                  className="mt-3 rounded-lg border border-red-300 bg-white px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-400 transition"
                >
                  Try again
                </button>
              </div>
            )}

            {state.status === "loading" && <SkeletonResult />}

            {state.status === "success" && (
              <EstimateResult result={state.data} stone={state.stone} />
            )}
          </div>
        </>
      )}
    </div>
  );
}
