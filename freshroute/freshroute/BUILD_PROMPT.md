# FreshRoute: master build prompt

Paste everything below the line into an AI coding tool (Claude Code, Cursor, Bolt, Lovable, etc.) if you want it to build or extend the project from scratch. The code in this folder already implements it.

---

You are a senior full-stack engineer. Build **FreshRoute**, a hackathon prototype that helps farmers in India sell perishable produce before it spoils.

## Problem
Farmers lose income when produce spoils before reaching buyers. Existing marketplaces connect people but ignore **time**. FreshRoute predicts which nearby buyers can receive the produce before it spoils.

## Deliverables
1. A responsive **web app**: React 18 + TypeScript + Vite + Tailwind CSS + react-leaflet (OpenStreetMap).
2. A separate **mobile app**: Expo (React Native, TypeScript), runnable in Expo Go.
3. A **shared TypeScript engine** (pure functions, no UI or framework imports) used by both apps, kept in `/shared` and copied into each app by `sync-core.sh`.

Audience: farmers in India. UI languages: **English, Hindi, Telugu**, with a language switcher. Use ₹ and km. Large tap targets, icon-led, plain words.

## Shared engine requirements
**1. Freshness estimate** (`freshness.ts`). Explainable, no ML.
- Each crop has a baseline shelf life in hours at 20°C (10 crops: tomato, spinach, banana, mango, okra, green chilli, cauliflower, brinjal, onion, potato). Comment that the values are demo values to be replaced with cited FAO / agricultural university data.
- Spoilage rate follows the Q10 rule: it doubles for every +10°C. Apply a per-crop heat sensitivity exponent.
- Storage types: open sun (ambient +6°C, handling x1.15), shade, crates in shade (ambient -1°C, handling x0.9), cold room (fixed 8°C).
- `remaining = shelfLife - elapsedHours x spoilageRate`.
- Return a **range** (low = 80%, high = 120% of mid), percent left, and a status: fresh / sell_soon / urgent / spoiled.
- Provide `remainingAfter(extraHours)` for transport time, `wallClockHoursLeft`, and `coldStorageGainHours`.

**2. Buyer matching** (`matching.ts`).
- Buyer types: supermarket, restaurant, food_bank, processor. Each has accepted crops, max kg per pickup, base price, and `minFreshPercentAtArrival` (supermarket about 50, restaurant about 25, food bank about 8, processor about 3).
- Road distance = haversine x 1.3. Truck speed 35 km/h. Pickup delay 1 hour. Safety margin 0.9.
- **Hard filter:** drop any buyer where predicted percent life at arrival is below their minimum.
- Price falls with freshness (100% / 80% / 55% / 35% of base price).
- Score 0-100: urgency fit 40, speed 25, volume 20, price 15. Return reasons as text.
- `adviceFor()` returns sell_now, sell_soon, donate_or_process, no_option or spoiled (the rescue cascade).

**3. Logistics** (`logistics.ts`).
- `prioritise()`: least wall-clock hours left first, spoiled last.
- `groupPickups()`: greedy grouping of farms within 12 km, capped by truck capacity, with km saved.
- `coldStorageOptions()`: nearby cold rooms with free capacity and the extra hours of freshness each would give.

**4. Impact** (`impact.ts`): kg rescued, income recovered, CO2 avoided, computed from the buyers the farmer chose.

**5. Seed data:** 6 farm lots, 7 buyers, 3 cold rooms around Hyderabad. Lots are created relative to the current time so the demo always looks live.

## Web app screens
- Header with language switcher and an impact bar (kg saved, ₹ recovered, CO2).
- **Demo controls:** a "fast-forward time" slider (0-96 hours) and a temperature slider. Moving them must update every freshness bar, match list and the priority list live. This is the main demo moment.
- "Collect in this order" priority list.
- Shared-truck suggestion cards.
- Lot cards: crop, quantity, farmer, storage, colour freshness bar with hour range, advice chip, top 3 buyers (distance, % life on arrival, price, income, "Choose this buyer"), cold-storage tip, remove button.
- Add-produce form (crop, kg, hours since harvest, storage, place).
- Map: farms (green), buyers (blue, grey when unreachable), cold rooms (cyan), dashed line to the best buyer, fly-to on selecting a lot.
- State saved in localStorage; a "reset demo data" link.
- Always show the note "This is an estimate, not a measurement."

## Mobile app
Same engine and the same features in one scrollable screen: language pills, impact cards, sliders, priority list, shared-truck cards, add-produce panel, expandable lot cards. Persist state with AsyncStorage. No maps (keeps Expo Go simple).

## Quality bar
- TypeScript strict, no `any`.
- Engine has no dependencies and has a test script (`engine.test.ts`) that checks: hot storage ages faster, ranges are ordered, matches respect crop and freshness limits, spoiled lots have no matches, priority order is correct.
- Accessible: labels on inputs, colour is never the only signal (status text always shown).
- Intermediate-level readable code with short comments explaining the formulas.

## Out of scope
Login, payments, real logistics APIs, ML. Mention them as "next steps" only.
