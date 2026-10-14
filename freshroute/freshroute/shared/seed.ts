import type { Buyer, ColdStorage, Lot } from "./types";

const H = 36e5;

/** Demo data around Hyderabad, India. Lots are created relative to `now`. */
export function makeSeedLots(now: number): Lot[] {
  return [
    { id: "L1", farmerName: "Ravi Kumar", cropId: "tomato", quantityKg: 400, harvestedAt: now - 16 * H, storage: "open_sun", location: { lat: 17.55, lng: 78.35 }, locationName: "Medchal" },
    { id: "L2", farmerName: "Lakshmi Devi", cropId: "spinach", quantityKg: 120, harvestedAt: now - 6 * H, storage: "shade", location: { lat: 17.5, lng: 78.28 }, locationName: "Shamirpet" },
    { id: "L3", farmerName: "Suresh Reddy", cropId: "okra", quantityKg: 250, harvestedAt: now - 22 * H, storage: "crate_shade", location: { lat: 17.44, lng: 78.2 }, locationName: "Shankarpally" },
    { id: "L4", farmerName: "Anita Sharma", cropId: "banana", quantityKg: 600, harvestedAt: now - 40 * H, storage: "shade", location: { lat: 17.6, lng: 78.4 }, locationName: "Keesara" },
    { id: "L5", farmerName: "Mohd. Imran", cropId: "mango", quantityKg: 300, harvestedAt: now - 10 * H, storage: "cold_room", location: { lat: 17.3, lng: 78.55 }, locationName: "Ibrahimpatnam" },
    { id: "L6", farmerName: "Gopal Rao", cropId: "tomato", quantityKg: 350, harvestedAt: now - 8 * H, storage: "shade", location: { lat: 17.58, lng: 78.3 }, locationName: "Dundigal" },
  ];
}

export const BUYERS: Buyer[] = [
  { id: "B1", name: "FreshMart Supermarket, Kukatpally", type: "supermarket", location: { lat: 17.49, lng: 78.41 }, accepts: ["tomato", "spinach", "okra", "banana", "mango", "chilli", "cauliflower", "brinjal"], maxKgPerPickup: 500, minFreshPercentAtArrival: 50, basePricePerKg: 28 },
  { id: "B2", name: "Green Basket Retail, Secunderabad", type: "supermarket", location: { lat: 17.44, lng: 78.5 }, accepts: ["tomato", "banana", "mango", "okra", "onion", "potato"], maxKgPerPickup: 700, minFreshPercentAtArrival: 45, basePricePerKg: 30 },
  { id: "B3", name: "Spice Route Restaurant Group", type: "restaurant", location: { lat: 17.42, lng: 78.45 }, accepts: ["tomato", "okra", "spinach", "chilli", "brinjal", "cauliflower"], maxKgPerPickup: 150, minFreshPercentAtArrival: 25, basePricePerKg: 22 },
  { id: "B4", name: "Hotel Deccan Kitchen", type: "restaurant", location: { lat: 17.39, lng: 78.48 }, accepts: ["tomato", "okra", "banana", "mango", "spinach"], maxKgPerPickup: 200, minFreshPercentAtArrival: 25, basePricePerKg: 20 },
  { id: "B5", name: "Annapurna Food Bank", type: "food_bank", location: { lat: 17.47, lng: 78.38 }, accepts: ["tomato", "spinach", "okra", "banana", "mango", "chilli", "cauliflower", "brinjal", "onion", "potato"], maxKgPerPickup: 400, minFreshPercentAtArrival: 8, basePricePerKg: 0 },
  { id: "B6", name: "Seva Community Kitchen", type: "food_bank", location: { lat: 17.52, lng: 78.3 }, accepts: ["tomato", "spinach", "okra", "banana", "cauliflower", "brinjal"], maxKgPerPickup: 250, minFreshPercentAtArrival: 5, basePricePerKg: 0 },
  { id: "B7", name: "Telangana Pulp & Pickle Works", type: "processor", location: { lat: 17.56, lng: 78.5 }, accepts: ["tomato", "mango", "chilli", "banana"], maxKgPerPickup: 1000, minFreshPercentAtArrival: 3, basePricePerKg: 8 },
];

export const COLD_ROOMS: ColdStorage[] = [
  { id: "C1", name: "Medchal Cooperative Cold Room", location: { lat: 17.54, lng: 78.33 }, freeKg: 800, tempC: 8 },
  { id: "C2", name: "Shamirpet Agri Hub Cold Store", location: { lat: 17.52, lng: 78.26 }, freeKg: 300, tempC: 10 },
  { id: "C3", name: "Bowenpally Mandi Cold Store", location: { lat: 17.47, lng: 78.48 }, freeKg: 1200, tempC: 6 },
];

/** Approximate market value used for the impact panel (INR per kg, fresh). */
export const REFERENCE_PRICE: Record<string, number> = {
  tomato: 25, spinach: 20, banana: 30, mango: 60, okra: 40, chilli: 50, cauliflower: 30, brinjal: 30, onion: 25, potato: 22,
};
