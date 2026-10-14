import { getCrop } from "./crops";
import { estimateFreshness, remainingAfter, spoilageRate } from "./freshness";
import { roadKm, travelHours } from "./geo";
import type { Buyer, BuyerMatch, Lot } from "./types";

/** Time the buyer/driver needs before the truck can actually leave (hours). */
const PICKUP_DELAY_H = 1;
/** Safety margin: don't plan to arrive on the last drop of freshness. */
const SAFETY = 0.9;

/** Price falls as freshness falls. Food banks pay 0 but are still a rescue. */
function priceFactor(percentLeft: number): number {
  if (percentLeft >= 70) return 1;
  if (percentLeft >= 40) return 0.8;
  if (percentLeft >= 20) return 0.55;
  return 0.35;
}

/** How well the buyer type fits the freshness we'll have on arrival (0..1). */
function urgencyFit(buyer: Buyer, percentLeftAtArrival: number): number {
  // The ideal buyer is the one whose minimum is just below what we have.
  // Sending very fresh produce to a food bank wastes value; sending nearly
  // spoiled produce to a supermarket is impossible (filtered already).
  const slack = percentLeftAtArrival - buyer.minFreshPercentAtArrival;
  if (slack < 0) return 0;
  return Math.max(0, 1 - slack / 100) * 0.6 + 0.4;
}

export interface MatchContext {
  now: number;
  ambientC: number;
}

export function matchBuyers(lot: Lot, buyers: Buyer[], ctx: MatchContext): BuyerMatch[] {
  const crop = getCrop(lot.cropId);
  const matches: BuyerMatch[] = [];

  for (const buyer of buyers) {
    if (!buyer.accepts.includes(lot.cropId)) continue;

    const km = roadKm(lot.location, buyer.location);
    const tH = travelHours(km);
    const totalDelay = PICKUP_DELAY_H + tH;

    const lifeAfter = remainingAfter({
      cropId: lot.cropId,
      storage: lot.storage,
      harvestedAt: lot.harvestedAt,
      now: ctx.now,
      ambientC: ctx.ambientC,
      extraHours: totalDelay / SAFETY,
    });
    const pct = Math.round((lifeAfter / crop.shelfLifeHoursAt20C) * 100);
    if (lifeAfter <= 0 || pct < buyer.minFreshPercentAtArrival) continue; // can't make it in time

    const rate = spoilageRate(lot.cropId, "shade", ctx.ambientC + 3);
    const hoursLeft = Math.round((lifeAfter / rate) * 10) / 10;
    const kg = Math.min(lot.quantityKg, buyer.maxKgPerPickup);
    const price = Math.round(buyer.basePricePerKg * priceFactor(pct) * 10) / 10;
    const income = Math.round(price * kg);

    // Score: urgency fit 40, speed 25, volume 20, price 15
    const fit = urgencyFit(buyer, pct);
    const speed = Math.max(0, 1 - km / 80);
    const volume = kg / lot.quantityKg;
    const priceScore = buyer.basePricePerKg > 0 ? Math.min(1, price / 30) : 0.1;
    const score = Math.round((fit * 40 + speed * 25 + volume * 20 + priceScore * 15) * 10) / 10;

    const reasons: string[] = [];
    reasons.push(`reaches in ~${(totalDelay).toFixed(1)}h with ${pct}% life left`);
    if (volume >= 1) reasons.push("takes the full quantity");
    else reasons.push(`takes ${kg} of ${lot.quantityKg} kg`);
    if (buyer.type === "food_bank") reasons.push("prevents waste (donation)");

    matches.push({
      buyer,
      distanceKm: km,
      travelHours: tH,
      percentLeftAtArrival: pct,
      hoursLeftAtArrival: hoursLeft,
      priceAtArrivalPerKg: price,
      kgAccepted: kg,
      expectedIncome: income,
      score,
      reasons,
    });
  }

  return matches.sort((a, b) => b.score - a.score);
}

/** The "rescue cascade": what to do with the lot. */
export type Advice = "sell_now" | "sell_soon" | "donate_or_process" | "no_option" | "spoiled";

export function adviceFor(lot: Lot, matches: BuyerMatch[], ctx: MatchContext): Advice {
  const f = estimateFreshness({
    cropId: lot.cropId,
    storage: lot.storage,
    harvestedAt: lot.harvestedAt,
    now: ctx.now,
    ambientC: ctx.ambientC,
  });
  if (f.status === "spoiled") return "spoiled";
  if (matches.length === 0) return "no_option";
  const onlyRescue = matches.every((m) => m.buyer.type === "food_bank" || m.buyer.type === "processor");
  if (onlyRescue) return "donate_or_process";
  return f.status === "urgent" ? "sell_now" : "sell_soon";
}
