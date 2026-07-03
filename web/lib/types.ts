export type Cut = "Fair" | "Good" | "Very Good" | "Premium" | "Ideal";
export type Color = "D" | "E" | "F" | "G" | "H" | "I" | "J";
export type Clarity =
  | "FL" | "IF" | "VVS1" | "VVS2" | "VS1" | "VS2"
  | "SI1" | "SI2" | "I1" | "I2" | "I3";
export type Shape =
  | "Round" | "Princess" | "Cushion" | "Oval" | "Emerald"
  | "Pear" | "Radiant" | "Asscher" | "Marquise" | "Heart";
export type Fluorescence = "None" | "Faint" | "Medium" | "Strong" | "Very Strong";
export type Certificate = "GIA" | "IGI" | "HRD" | "None";
export type ConfidenceLevel = "high" | "medium" | "low";

export interface StoneInput {
  carat: number;
  cut: Cut;
  color: Color;
  clarity: Clarity;
  shape?: Shape;
  fluorescence?: Fluorescence;
  certificate?: Certificate;
}

export interface PriceBand {
  low: number;
  mid: number;
  high: number;
  per_carat_low: number;
  per_carat_mid: number;
  per_carat_high: number;
}

export interface StoneEstimate {
  band: PriceBand;
  confidence_level: ConfidenceLevel;
  low_confidence: boolean;
  low_confidence_reason: string | null;
}

export interface EstimateResponse {
  schema_version: string;
  request_id: string;
  model_version: string;
  disclaimer: string;
  estimate: StoneEstimate | null;
  // Batch / parcel fields
  estimates?: StoneEstimate[] | null;
  parcel_total_low?: number | null;
  parcel_total_mid?: number | null;
  parcel_total_high?: number | null;
  parcel_stone_count?: number | null;
}

export type Verdict = "below" | "fair" | "above";
