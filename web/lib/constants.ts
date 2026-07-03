import type { Cut, Color, Clarity, Shape, Fluorescence, Certificate } from "./types";

export const CUT_OPTIONS: { value: Cut; label: string; description: string }[] = [
  { value: "Ideal", label: "Ideal", description: "Maximum brilliance — the top 3% of diamonds" },
  { value: "Premium", label: "Premium", description: "Excellent light performance, slightly wider range" },
  { value: "Very Good", label: "Very Good", description: "Superior cut with minor trade-offs" },
  { value: "Good", label: "Good", description: "Reflects most light; good value choice" },
  { value: "Fair", label: "Fair", description: "Some light escapes; noticeably less brilliant" },
];

export const COLOR_OPTIONS: { value: Color; label: string; description: string }[] = [
  { value: "D", label: "D — Colorless", description: "Absolutely colorless; rarest and most valuable" },
  { value: "E", label: "E — Colorless", description: "Minute traces detectable only by experts" },
  { value: "F", label: "F — Colorless", description: "Slight color detected only by expert gemologist" },
  { value: "G", label: "G — Near Colorless", description: "Near colorless; excellent value" },
  { value: "H", label: "H — Near Colorless", description: "Near colorless; slightly detectable warmth" },
  { value: "I", label: "I — Near Colorless", description: "Slight color noticeable when compared" },
  { value: "J", label: "J — Near Colorless", description: "Slight color noticeable in larger stones" },
];

export const CLARITY_OPTIONS: { value: Clarity; label: string; description: string }[] = [
  { value: "FL", label: "FL — Flawless", description: "No inclusions or blemishes visible under 10× magnification" },
  { value: "IF", label: "IF — Internally Flawless", description: "No internal inclusions, minor surface blemishes only" },
  { value: "VVS1", label: "VVS1 — Very Very Slightly Included 1", description: "Inclusions so minute they're difficult for a skilled grader to see" },
  { value: "VVS2", label: "VVS2 — Very Very Slightly Included 2", description: "Inclusions extremely difficult to see under magnification" },
  { value: "VS1", label: "VS1 — Very Slightly Included 1", description: "Minor inclusions; invisible to the naked eye" },
  { value: "VS2", label: "VS2 — Very Slightly Included 2", description: "Minor inclusions; invisible to the naked eye in most cases" },
  { value: "SI1", label: "SI1 — Slightly Included 1", description: "Inclusions noticeable under magnification; usually eye-clean" },
  { value: "SI2", label: "SI2 — Slightly Included 2", description: "Inclusions noticeable under magnification; may be visible to naked eye" },
  { value: "I1", label: "I1 — Included 1", description: "Inclusions visible to the naked eye; affects brilliance" },
  { value: "I2", label: "I2 — Included 2", description: "Inclusions clearly visible; significantly affects appearance" },
  { value: "I3", label: "I3 — Included 3", description: "Inclusions very obvious; may affect durability" },
];

export const SHAPE_OPTIONS: Shape[] = [
  "Round", "Princess", "Cushion", "Oval", "Emerald",
  "Pear", "Radiant", "Asscher", "Marquise", "Heart",
];

export const FLUORESCENCE_OPTIONS: Fluorescence[] = [
  "None", "Faint", "Medium", "Strong", "Very Strong",
];

export const CERTIFICATE_OPTIONS: Certificate[] = ["GIA", "IGI", "HRD", "None"];

export const DISCLAIMER =
  "This is a fair-market estimate from public listing data, not a certified appraisal.";
