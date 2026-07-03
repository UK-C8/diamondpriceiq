import type { StoneInput, EstimateResponse } from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
const TIMEOUT_MS = 12_000; // 12s — gives the API plenty of room under the p95 400ms target

async function postEstimate(body: object): Promise<EstimateResponse> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  let res: Response;
  try {
    res = await fetch(`${API_URL}/v1/estimate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
      signal: controller.signal,
    });
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new Error("The pricing service is taking too long to respond. Please try again.");
    }
    throw new Error("Could not reach the pricing service. Check your connection and try again.");
  } finally {
    clearTimeout(timer);
  }

  if (res.status === 429) {
    throw new Error("Too many requests — please wait a moment and try again.");
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.detail ?? `Pricing service error (${res.status}). Please try again.`);
  }
  return res.json();
}

export function fetchEstimate(stone: StoneInput): Promise<EstimateResponse> {
  return postEstimate({ stone });
}

export function fetchParcelEstimate(stones: StoneInput[]): Promise<EstimateResponse> {
  return postEstimate({ stones });
}
