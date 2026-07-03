"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Tooltip } from "./Tooltip";
import {
  CUT_OPTIONS, COLOR_OPTIONS, CLARITY_OPTIONS,
  SHAPE_OPTIONS, FLUORESCENCE_OPTIONS, CERTIFICATE_OPTIONS,
} from "@/lib/constants";
import type { StoneInput, Cut, Color, Clarity, Shape, Fluorescence, Certificate } from "@/lib/types";
import { cn } from "@/lib/utils";

interface EstimateFormProps {
  onSubmit: (stone: StoneInput) => void;
  loading: boolean;
}

const labelClass = "block text-sm font-semibold text-gray-700 mb-1";
const inputClass =
  "w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 shadow-sm focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-200 transition";
const errorClass = "mt-1 text-xs text-red-600";

export function EstimateForm({ onSubmit, loading }: EstimateFormProps) {
  const [carat, setCarat] = useState("");
  const [cut, setCut] = useState<Cut | "">("");
  const [color, setColor] = useState<Color | "">("");
  const [clarity, setClarity] = useState<Clarity | "">("");

  const [shape, setShape] = useState<Shape | "">("");
  const [fluorescence, setFluorescence] = useState<Fluorescence | "">("");
  const [certificate, setCertificate] = useState<Certificate | "">("");
  const [refineOpen, setRefineOpen] = useState(false);

  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate(): boolean {
    const errs: Record<string, string> = {};
    const caratNum = parseFloat(carat);
    if (!carat || isNaN(caratNum) || caratNum <= 0)
      errs.carat = "Enter a valid carat weight greater than 0";
    else if (caratNum > 20)
      errs.carat = "Carat weight must be ≤ 20";
    if (!cut) errs.cut = "Select a cut grade";
    if (!color) errs.color = "Select a color grade";
    if (!clarity) errs.clarity = "Select a clarity grade";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    const stone: StoneInput = {
      carat: parseFloat(carat),
      cut: cut as Cut,
      color: color as Color,
      clarity: clarity as Clarity,
      ...(shape && { shape: shape as Shape }),
      ...(fluorescence && { fluorescence: fluorescence as Fluorescence }),
      ...(certificate && { certificate: certificate as Certificate }),
    };
    onSubmit(stone);
  }

  return (
    <form onSubmit={handleSubmit} noValidate aria-label="Diamond price estimator">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Carat */}
        <div className="sm:col-span-2">
          <label htmlFor="carat" className={labelClass}>
            Carat weight
            <Tooltip content="The weight of the diamond in carats (1 carat = 0.2 grams). Heavier diamonds are exponentially rarer and more valuable." />
          </label>
          <input
            id="carat"
            type="number"
            step="0.01"
            min="0.01"
            max="20"
            placeholder="e.g. 1.00"
            value={carat}
            onChange={(e) => { setCarat(e.target.value); setErrors((p) => ({ ...p, carat: "" })); }}
            aria-invalid={!!errors.carat}
            aria-describedby={errors.carat ? "carat-error" : undefined}
            className={cn(inputClass, errors.carat && "border-red-400 focus:border-red-400 focus:ring-red-100")}
          />
          {errors.carat && <p id="carat-error" className={errorClass} role="alert">{errors.carat}</p>}
        </div>

        {/* Cut */}
        <div>
          <label htmlFor="cut" className={labelClass}>
            Cut
            <Tooltip content="Cut quality determines how well a diamond reflects light (brilliance). Ideal cut returns the most light. GIA grades: Ideal, Premium, Very Good, Good, Fair." />
          </label>
          <select
            id="cut"
            value={cut}
            onChange={(e) => { setCut(e.target.value as Cut); setErrors((p) => ({ ...p, cut: "" })); }}
            aria-invalid={!!errors.cut}
            aria-describedby={errors.cut ? "cut-error" : undefined}
            className={cn(inputClass, "appearance-none cursor-pointer", errors.cut && "border-red-400")}
          >
            <option value="">Select cut grade</option>
            {CUT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          {errors.cut && <p id="cut-error" className={errorClass} role="alert">{errors.cut}</p>}
        </div>

        {/* Color */}
        <div>
          <label htmlFor="color" className={labelClass}>
            Color
            <Tooltip content="GIA color scale D–Z. D is completely colorless (rarest). G–J is near-colorless and offers excellent value for most buyers." />
          </label>
          <select
            id="color"
            value={color}
            onChange={(e) => { setColor(e.target.value as Color); setErrors((p) => ({ ...p, color: "" })); }}
            aria-invalid={!!errors.color}
            aria-describedby={errors.color ? "color-error" : undefined}
            className={cn(inputClass, "appearance-none cursor-pointer", errors.color && "border-red-400")}
          >
            <option value="">Select color grade</option>
            {COLOR_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          {errors.color && <p id="color-error" className={errorClass} role="alert">{errors.color}</p>}
        </div>

        {/* Clarity */}
        <div className="sm:col-span-2">
          <label htmlFor="clarity" className={labelClass}>
            Clarity
            <Tooltip content="Clarity measures internal inclusions and surface blemishes. FL (Flawless) is rarest; VS1–VS2 are eye-clean and best value. I-grades have visible inclusions." />
          </label>
          <select
            id="clarity"
            value={clarity}
            onChange={(e) => { setClarity(e.target.value as Clarity); setErrors((p) => ({ ...p, clarity: "" })); }}
            aria-invalid={!!errors.clarity}
            aria-describedby={errors.clarity ? "clarity-error" : undefined}
            className={cn(inputClass, "appearance-none cursor-pointer", errors.clarity && "border-red-400")}
          >
            <option value="">Select clarity grade</option>
            {CLARITY_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          {errors.clarity && <p id="clarity-error" className={errorClass} role="alert">{errors.clarity}</p>}
        </div>
      </div>

      {/* Refine section */}
      <div className="mt-4">
        <button
          type="button"
          aria-expanded={refineOpen}
          aria-controls="refine-section"
          onClick={() => setRefineOpen((v) => !v)}
          className="flex items-center gap-1.5 text-sm font-medium text-amber-700 hover:text-amber-800 focus:outline-none focus:ring-2 focus:ring-amber-400 rounded px-1"
        >
          {refineOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          Refine with optional details
        </button>

        {refineOpen && (
          <div id="refine-section" className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-3 animate-fade-in">
            <div>
              <label htmlFor="shape" className={labelClass}>
                Shape
                <Tooltip content="Round brilliant is the most common and typically highest-priced per carat. Fancy shapes (oval, cushion, pear) can offer 10–40% savings." />
              </label>
              <select
                id="shape"
                value={shape}
                onChange={(e) => setShape(e.target.value as Shape)}
                className={cn(inputClass, "appearance-none cursor-pointer")}
              >
                <option value="">Round (default)</option>
                {SHAPE_OPTIONS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="fluorescence" className={labelClass}>
                Fluorescence
                <Tooltip content="Fluorescence is a diamond's glow under UV light. Strong blue fluorescence can actually make a lower-color stone appear whiter, but may reduce value in some markets." />
              </label>
              <select
                id="fluorescence"
                value={fluorescence}
                onChange={(e) => setFluorescence(e.target.value as Fluorescence)}
                className={cn(inputClass, "appearance-none cursor-pointer")}
              >
                <option value="">None (default)</option>
                {FLUORESCENCE_OPTIONS.map((f) => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="certificate" className={labelClass}>
                Certificate / Lab
                <Tooltip content="GIA is the gold standard grading lab. IGI and HRD are reputable alternatives. Uncertified diamonds are harder to price accurately." />
              </label>
              <select
                id="certificate"
                value={certificate}
                onChange={(e) => setCertificate(e.target.value as Certificate)}
                className={cn(inputClass, "appearance-none cursor-pointer")}
              >
                <option value="">Unknown</option>
                {CERTIFICATE_OPTIONS.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      <button
        type="submit"
        disabled={loading}
        className="mt-6 w-full rounded-xl bg-amber-500 px-6 py-3.5 text-sm font-bold text-white shadow-md hover:bg-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? "Getting price…" : "Get price →"}
      </button>
    </form>
  );
}
