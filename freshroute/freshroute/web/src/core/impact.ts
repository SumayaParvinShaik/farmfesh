import type { BuyerMatch, Lot } from "./types";

export interface Impact {
  kgRescued: number;
  incomeRecovered: number; // INR
  co2AvoidedKg: number;
}

/**
 * Emission factor: roughly 1 kg CO2e avoided per kg of fresh produce
 * kept out of landfill (order-of-magnitude figure; cite your own source).
 */
const CO2_PER_KG = 1.0;

/** Sums impact assuming each lot is sent to its best match. */
export function totalImpact(items: { lot: Lot; best?: BuyerMatch }[]): Impact {
  let kg = 0;
  let income = 0;
  for (const { best } of items) {
    if (!best) continue;
    kg += best.kgAccepted;
    income += best.expectedIncome;
  }
  return { kgRescued: kg, incomeRecovered: income, co2AvoidedKg: Math.round(kg * CO2_PER_KG) };
}
