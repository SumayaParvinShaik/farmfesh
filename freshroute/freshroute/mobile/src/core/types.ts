export type StorageType = "open_sun" | "shade" | "crate_shade" | "cold_room";
export type BuyerType = "supermarket" | "restaurant" | "food_bank" | "processor";

export interface Coord {
  lat: number;
  lng: number;
}

export interface Lot {
  id: string;
  farmerName: string;
  cropId: string;
  quantityKg: number;
  harvestedAt: number; // epoch ms
  storage: StorageType;
  location: Coord;
  locationName: string;
}

export interface Buyer {
  id: string;
  name: string;
  type: BuyerType;
  location: Coord;
  accepts: string[]; // crop ids
  maxKgPerPickup: number;
  /** buyer needs at least this % of shelf life left AT ARRIVAL (supermarket 50, food bank 8 ...) */
  minFreshPercentAtArrival: number;
  /** base price per kg when fresh (INR). food banks = 0 */
  basePricePerKg: number;
}

export interface FreshnessEstimate {
  remainingHoursLow: number;
  remainingHoursMid: number;
  remainingHoursHigh: number;
  percentLeft: number; // 0-100 (mid)
  status: "fresh" | "sell_soon" | "urgent" | "spoiled";
}

export interface BuyerMatch {
  buyer: Buyer;
  distanceKm: number;
  travelHours: number;
  /** estimated % of shelf life left when the truck arrives (mid estimate) */
  percentLeftAtArrival: number;
  /** same thing as wall-clock hours before it spoils after arrival */
  hoursLeftAtArrival: number;
  priceAtArrivalPerKg: number;
  kgAccepted: number;
  expectedIncome: number;
  score: number; // 0-100
  reasons: string[];
}

export interface PickupGroup {
  lotIds: string[];
  totalKg: number;
  /** straight-line saving vs. separate trips, km (approx) */
  kmSaved: number;
}

export interface ColdStorage {
  id: string;
  name: string;
  location: Coord;
  freeKg: number;
  tempC: number;
}
