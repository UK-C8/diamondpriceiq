"use client";

import { useState } from "react";
import { analytics } from "@/lib/analytics";
import type { StoneInput, PriceBand } from "@/lib/types";

interface LeadCaptureProps {
  stone: StoneInput;
  band: PriceBand;
  modelVersion: string;
}

type State = "idle" | "loading" | "done" | "error";

export function LeadCapture({ stone, band, modelVersion }: LeadCaptureProps) {
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [state, setState] = useState<State>("idle");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!consent) { setError("Please tick the consent checkbox."); return; }
    if (!email || !email.includes("@")) { setError("Enter a valid email address."); return; }
    setError("");
    setState("loading");

    try {
      const res = await fetch("/api/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, stone, band, modelVersion }),
      });
      if (!res.ok) throw new Error("PDF generation failed");

      // Trigger download
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "diamondpriceiq-estimate.pdf";
      a.click();
      URL.revokeObjectURL(url);

      analytics.leadCaptured("single");
      analytics.pdfDownloaded();
      setState("done");
    } catch {
      analytics.estimateError("pdf_generation");
      setState("error");
      setError("Something went wrong generating your PDF. Please try again.");
    }
  }

  if (state === "done") {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-center">
        <p className="text-sm font-semibold text-emerald-800">✓ Your PDF is downloading!</p>
        <p className="mt-1 text-xs text-emerald-700">Check your downloads folder for <em>diamondpriceiq-estimate.pdf</em>.</p>
      </div>
    );
  }

  return (
    <section aria-labelledby="pdf-heading" className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <h2 id="pdf-heading" className="text-base font-bold text-gray-900 mb-1">
        Get a branded PDF report
      </h2>
      <p className="text-xs text-gray-500 mb-4">
        Enter your email to receive a shareable PDF of this estimate. The price result above is always free to view — no email required.
      </p>

      <form onSubmit={handleSubmit} noValidate className="space-y-3">
        <div>
          <label htmlFor="lead-email" className="block text-xs font-semibold text-gray-700 mb-1">
            Email address
          </label>
          <input
            id="lead-email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-900 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-200 transition"
          />
        </div>

        <label className="flex items-start gap-2.5 cursor-pointer">
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-gray-300 accent-amber-500 focus:ring-amber-400"
            aria-required="true"
          />
          <span className="text-xs text-gray-600 leading-relaxed">
            I consent to Centr8 LLP storing my email to send this estimate and occasional product updates.
            I can unsubscribe at any time. See our{" "}
            <a href="/privacy" className="underline hover:text-amber-700">privacy notice</a>.
          </span>
        </label>

        {error && (
          <p role="alert" className="text-xs text-red-600">{error}</p>
        )}

        <button
          type="submit"
          disabled={state === "loading"}
          className="w-full rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-bold text-white hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed transition"
        >
          {state === "loading" ? "Generating PDF…" : "Download PDF report →"}
        </button>
      </form>
    </section>
  );
}
