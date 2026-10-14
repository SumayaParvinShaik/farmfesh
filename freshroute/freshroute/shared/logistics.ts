import { wallClockHoursLeft, coldStorageGainHours } from "./freshness";
import { distanceKm, roadKm } from "./geo";
import type { ColdStorage, Lot, PickupGroup } from "./types";

export interface LogisticsContext {
  now: number;
  ambientC: number;
}

export interface Priority {
  lot: Lot;
  hoursLeft: number; // wall-clock
  rank: number;
}

/**
 * Collection priority: least time left first. Ties broken by bigger quantity.
 * Spoiled lots are pushed to the bottom.
 */
export function prioritise(lots: Lot[], ctx: LogisticsContext): Priority[] {
  return lots
    .map((lot) => ({
      lot,
      hoursLeft: wallClockHoursLeft({
        cropId: lot.cropId,
        storage: lot.storage,
        harvestedAt: lot.harvestedAt,
        now: ctx.now,
        ambientC: ctx.ambientC,
      }),
    }))
    .sort((a, b) => {
      const aSp = a.hoursLeft <= 0 ? 1 : 0;
      const bSp = b.hoursLeft <= 0 ? 1 : 0;
      if (aSp !== bSp) return aSp - bSp;
      if (a.hoursLeft !== b.hoursLeft) return a.hoursLeft - b.hoursLeft;
      return b.lot.quantityKg - a.lot.quantityKg;
    })
    .map((p, i) => ({ ...p, rank: i + 1 }));
}

/**
 * Shared transport: greedily group lots whose farms are within `radiusKm`
 * of each other and that are not already spoiled. A real system would also
 * check pickup time windows and truck capacity.
 */
export function groupPickups(
  lots: Lot[],
  ctx: LogisticsContext,
  opts: { radiusKm?: number; truckCapacityKg?: number } = {},
): PickupGroup[] {
  const radius = opts.radiusKm ?? 12;
  const cap = opts.truckCapacityKg ?? 1500;
  const live = lots.filter(
    (l) =>
      wallClockHoursLeft({
        cropId: l.cropId,
        storage: l.storage,
        harvestedAt: l.harvestedAt,
        now: ctx.now,
        ambientC: ctx.ambientC,
      }) > 0,
  );
  const used = new Set<string>();
  const groups: PickupGroup[] = [];

  for (const seed of live) {
    if (used.has(seed.id)) continue;
    const members = [seed];
    let kg = seed.quantityKg;
    used.add(seed.id);
    for (const other of live) {
      if (used.has(other.id)) continue;
      if (distanceKm(seed.location, other.location) <= radius && kg + other.quantityKg <= cap) {
        members.push(other);
        kg += other.quantityKg;
        used.add(other.id);
      }
    }
    if (members.length > 1) {
      // saving ≈ extra trips avoided: each extra farm saves a hop from the seed
      const kmSaved = members
        .slice(1)
        .reduce((sum, m) => sum + roadKm(seed.location, m.location), 0);
      groups.push({ lotIds: members.map((m) => m.id), totalKg: kg, kmSaved: Math.round(kmSaved * 10) / 10 });
    }
  }
  return groups;
}

export interface ColdOption {
  storage: ColdStorage;
  distanceKm: number;
  extraHours: number;
}

/** Nearby cold rooms with space, with the extra shelf-life each would buy. */
export function coldStorageOptions(
  lot: Lot,
  rooms: ColdStorage[],
  ctx: LogisticsContext,
  maxKm = 40,
): ColdOption[] {
  const gain = coldStorageGainHours({
    cropId: lot.cropId,
    storage: lot.storage,
    harvestedAt: lot.harvestedAt,
    now: ctx.now,
    ambientC: ctx.ambientC,
  });
  return rooms
    .filter((r) => r.freeKg >= lot.quantityKg)
    .map((r) => ({ storage: r, distanceKm: roadKm(lot.location, r.location), extraHours: gain }))
    .filter((o) => o.distanceKm <= maxKm && o.extraHours > 1)
    .sort((a, b) => a.distanceKm - b.distanceKm);
}
