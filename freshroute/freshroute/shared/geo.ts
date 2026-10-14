import type { Coord } from "./types";

/** Straight-line distance in km (haversine). */
export function distanceKm(a: Coord, b: Coord): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

/** Roads are longer than straight lines. 1.3 is a common rural factor. */
export const ROAD_FACTOR = 1.3;
/** Average loaded-truck speed on rural roads (km/h). */
export const AVG_SPEED_KMH = 35;

export function roadKm(a: Coord, b: Coord): number {
  return Math.round(distanceKm(a, b) * ROAD_FACTOR * 10) / 10;
}

export function travelHours(km: number): number {
  return Math.round((km / AVG_SPEED_KMH) * 100) / 100;
}
