/**
 * Baseline shelf life (hours of SELLABLE life from harvest) at a reference
 * temperature of 20°C. These are rounded, conservative demo values based on
 * typical post-harvest guidance. Replace with values from your local
 * agriculture university / FAO / NHB data before real use, and cite them.
 */
export interface Crop {
  id: string;
  emoji: string;
  shelfLifeHoursAt20C: number;
  /** how sensitive to heat; multiplies Q10 effect (1 = normal) */
  heatSensitivity: number;
  names: { en: string; hi: string; te: string };
}

export const CROPS: Crop[] = [
  { id: "tomato", emoji: "🍅", shelfLifeHoursAt20C: 144, heatSensitivity: 1, names: { en: "Tomato", hi: "टमाटर", te: "టమాటా" } },
  { id: "spinach", emoji: "🥬", shelfLifeHoursAt20C: 48, heatSensitivity: 1.3, names: { en: "Spinach / Leafy greens", hi: "पालक / पत्तेदार सब्ज़ी", te: "ఆకుకూరలు" } },
  { id: "banana", emoji: "🍌", shelfLifeHoursAt20C: 120, heatSensitivity: 1, names: { en: "Banana", hi: "केला", te: "అరటి" } },
  { id: "mango", emoji: "🥭", shelfLifeHoursAt20C: 120, heatSensitivity: 1, names: { en: "Mango", hi: "आम", te: "మామిడి" } },
  { id: "okra", emoji: "🌿", shelfLifeHoursAt20C: 72, heatSensitivity: 1.2, names: { en: "Okra (Bhindi)", hi: "भिंडी", te: "బెండకాయ" } },
  { id: "chilli", emoji: "🌶️", shelfLifeHoursAt20C: 96, heatSensitivity: 1, names: { en: "Green chilli", hi: "हरी मिर्च", te: "పచ్చిమిర్చి" } },
  { id: "cauliflower", emoji: "🥦", shelfLifeHoursAt20C: 96, heatSensitivity: 1.1, names: { en: "Cauliflower", hi: "फूलगोभी", te: "కాలీఫ్లవర్" } },
  { id: "brinjal", emoji: "🍆", shelfLifeHoursAt20C: 120, heatSensitivity: 1, names: { en: "Brinjal", hi: "बैंगन", te: "వంకాయ" } },
  { id: "onion", emoji: "🧅", shelfLifeHoursAt20C: 720, heatSensitivity: 0.6, names: { en: "Onion", hi: "प्याज़", te: "ఉల్లిపాయ" } },
  { id: "potato", emoji: "🥔", shelfLifeHoursAt20C: 960, heatSensitivity: 0.5, names: { en: "Potato", hi: "आलू", te: "బంగాళాదుంప" } },
];

export const getCrop = (id: string): Crop => {
  const c = CROPS.find((x) => x.id === id);
  if (!c) throw new Error(`Unknown crop: ${id}`);
  return c;
};
