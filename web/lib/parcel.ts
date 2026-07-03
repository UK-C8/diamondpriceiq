import Papa from "papaparse";
import type { StoneInput, Cut, Color, Clarity } from "./types";

export const PARCEL_ROW_CAP = 500;

// CSV template columns in order
export const CSV_COLUMNS = ["carat", "cut", "color", "clarity", "shape", "fluorescence", "certificate"];

const VALID_CUTS = new Set(["Fair", "Good", "Very Good", "Premium", "Ideal"]);
const VALID_COLORS = new Set(["D","E","F","G","H","I","J"]);
const VALID_CLARITIES = new Set(["FL","IF","VVS1","VVS2","VS1","VS2","SI1","SI2","I1","I2","I3"]);

export interface ParsedRow {
  stone: StoneInput;
  rowIndex: number;
}

export interface ParseError {
  rowIndex: number;
  message: string;
}

export interface ParseResult {
  rows: ParsedRow[];
  errors: ParseError[];
}

export function parseCSV(text: string): ParseResult {
  const result = Papa.parse<Record<string, string>>(text.trim(), {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim().toLowerCase(),
  });

  const rows: ParsedRow[] = [];
  const errors: ParseError[] = [];

  const data = result.data.slice(0, PARCEL_ROW_CAP);

  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    const rowIndex = i + 2; // 1-based + header row

    const carat = parseFloat(row.carat ?? "");
    if (isNaN(carat) || carat <= 0 || carat > 20) {
      errors.push({ rowIndex, message: `Invalid carat "${row.carat}"` });
      continue;
    }

    const cut = row.cut?.trim();
    if (!VALID_CUTS.has(cut)) {
      errors.push({ rowIndex, message: `Invalid cut "${cut}"` });
      continue;
    }

    const color = row.color?.trim().toUpperCase();
    if (!VALID_COLORS.has(color)) {
      errors.push({ rowIndex, message: `Invalid color "${color}"` });
      continue;
    }

    const clarity = row.clarity?.trim().toUpperCase();
    if (!VALID_CLARITIES.has(clarity)) {
      errors.push({ rowIndex, message: `Invalid clarity "${clarity}"` });
      continue;
    }

    rows.push({
      rowIndex,
      stone: {
        carat: Math.round(carat * 1000) / 1000,
        cut: cut as Cut,
        color: color as Color,
        clarity: clarity as Clarity,
        shape: row.shape?.trim() as StoneInput["shape"] || undefined,
        fluorescence: row.fluorescence?.trim() as StoneInput["fluorescence"] || undefined,
        certificate: row.certificate?.trim() as StoneInput["certificate"] || undefined,
      },
    });
  }

  return { rows, errors };
}

export function csvTemplateBlob(): Blob {
  const header = CSV_COLUMNS.join(",");
  const example = "1.00,Ideal,G,VS1,Round,None,GIA";
  return new Blob([header + "\n" + example + "\n"], { type: "text/csv" });
}
