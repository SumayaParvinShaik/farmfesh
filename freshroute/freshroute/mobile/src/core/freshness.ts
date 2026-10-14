import { getCrop } from "./crops";
import type { FreshnessEstimate, StorageType } from "./types";

const REF_TEMP_C = 20;
const Q10 = 2; // spoilage rate roughly doubles per +10°C

/** How storage changes the temperature the produce actually experiences. */
export function storageTemp(storage: StorageType, ambientC: number): number {
  switch (storage) {
    case "open_sun":
      return ambientC + 6;
    case "shade":
      return ambientC;
    case "crate_shade":
      return ambientC - 1; // airflow + less bruising
    case "cold_room":
      return 8;
  }
}

/** Extra multiplier on spoilage rate from handling (bruising, airflow). */
function handlingFactor(storage: StorageType): number {
  return storage === "open_sun" ? 1.15 : storage === "crate_shade" ? 0.9 : 1;
}

/** Spoilage speed relative to the 20°C baseline (1 = baseline). */
export function spoilageRate(cropId: string, storage: StorageType, ambientC: number): number {
  const crop = getCrop(cropId);
  const t = storageTemp(storage, ambientC);
  const q = Math.pow(Q10, (t - REF_TEMP_C) / 10);
  // heatSensitivity bends the curve: sensitive crops react more to heat
  const tempEffect = Math.pow(q, crop.heatSensitivity);
  return tempEffect * handlingFactor(storage);
}

/**
 * Estimate remaining sellable life.
 * remaining = baseline_life - hours_elapsed * spoilage_rate
 * Returns a range (±20%) because this is an estimate, not a measurement.
 */
export function estimateFreshness(args: {
  cropId: string;
  storage: StorageType;
  harvestedAt: number;
  now: number;
  ambientC: number;
}): FreshnessEstimate {
  const { cropId, storage, harvestedAt, now, ambientC } = args;
  const crop = getCrop(cropId);
  const elapsedH = Math.max(0, (now - harvestedAt) / 36e5);
  const rate = spoilageRate(cropId, storage, ambientC);
  const used = elapsedH * rate;
  const mid = Math.max(0, crop.shelfLifeHoursAt20C - used);
  const low = Math.max(0, mid * 0.8);
  const high = mid * 1.2;
  const percentLeft = Math.round((mid / crop.shelfLifeHoursAt20C) * 100);
  const status: FreshnessEstimate["status"] =
    mid <= 0 ? "spoiled" : percentLeft <= 25 || mid < 12 ? "urgent" : percentLeft <= 55 ? "sell_soon" : "fresh";
  return {
    remainingHoursLow: round1(low),
    remainingHoursMid: round1(mid),
    remainingHoursHigh: round1(high),
    percentLeft,
    status,
  };
}

/**
 * Remaining life (mid) after `extraHours` more hours under given conditions.
 * Used to ask "how fresh will it be when the truck arrives?".
 */
export function remainingAfter(args: {
  cropId: string;
  storage: StorageType;
  harvestedAt: number;
  now: number;
  ambientC: number;
  extraHours: number;
  /** temperature during transport (open truck ~ ambient + 3) */
  transportTempOffsetC?: number;
}): number {
  const base = estimateFreshness(args).remainingHoursMid;
  const rate = spoilageRate(args.cropId, "shade", args.ambientC + (args.transportTempOffsetC ?? 3));
  return Math.max(0, round1(base - args.extraHours * rate));
}

/** How many extra hours of life would cold storage (8°C) give from now? */
export function coldStorageGainHours(args: {
  cropId: string;
  storage: StorageType;
  harvestedAt: number;
  now: number;
  ambientC: number;
}): number {
  const current = estimateFreshness(args).remainingHoursMid;
  if (current <= 0) return 0;
  const rateNow = spoilageRate(args.cropId, args.storage, args.ambientC);
  const rateCold = spoilageRate(args.cropId, "cold_room", args.ambientC);
  // wall-clock hours the lot lasts under each condition
  const lastsNow = current / rateNow;
  const lastsCold = current / rateCold;
  return round1(Math.max(0, lastsCold - lastsNow));
}

/** Wall-clock hours until the lot is spoiled under current storage. */
export function wallClockHoursLeft(args: {
  cropId: string;
  storage: StorageType;
  harvestedAt: number;
  now: number;
  ambientC: number;
}): number {
  const mid = estimateFreshness(args).remainingHoursMid;
  return round1(mid / spoilageRate(args.cropId, args.storage, args.ambientC));
}

const round1 = (n: number) => Math.round(n * 10) / 10;
