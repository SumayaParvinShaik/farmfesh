# 🌿 FreshRoute

Predicts which nearby buyers can take a farmer's produce **before it spoils**.

```
freshroute/
├── shared/        ← the engine (edit here only) + engine.test.ts
├── web/           ← React + Vite + Tailwind website
├── mobile/        ← Expo React Native app
├── sync-core.sh   ← copies shared/ into web/src/core and mobile/src/core
└── BUILD_PROMPT.md← prompt to rebuild/extend this with any AI coding tool
```

## Run the website
```bash
cd web
npm install
npm run dev        # open the URL it prints
npm run build      # type-check + production build
```
Deploy: push to GitHub and import the `web` folder in Vercel or Netlify.

## Run the mobile app
```bash
cd mobile
npm install
npx expo start     # scan the QR code with the Expo Go app on your phone
```
If Expo complains about versions, run `npx expo install --fix`.

## Test the engine
```bash
cd shared
npx tsx engine.test.ts
```

## After changing the engine
Edit files in `shared/`, then run `./sync-core.sh` from the project root.

## How the freshness estimate works
```
spoilage_rate = 2 ^ ((temp - 20) / 10)  (Q10 rule), adjusted per crop and storage
remaining     = baseline_shelf_life - hours_since_harvest × spoilage_rate
```
A buyer is a valid match only if the produce will still have **at least the freshness that buyer type needs when the truck arrives** (supermarket about 50%, restaurant 25%, food bank 8%, processor 3%).

**Important:** the shelf-life numbers in `shared/crops.ts` are rounded demo values. Replace them with figures from FAO or your state agriculture university and cite them in your pitch.

## 3-minute demo script
1. "Ravi harvested tomatoes 16 hours ago and keeps them in the open sun." Show his card, about 60% fresh.
2. Drag **fast-forward time** to +24 h. The bar turns yellow, then red. The top buyer changes from a supermarket to a restaurant, then to a food bank or processor. Nothing is wasted, it is only downgraded.
3. Show the **map** line to the best buyer, then the **shared truck** card (farms close together) and the **cold storage** tip (+hours).
4. Click "Choose this buyer" on a few lots and show the **impact** counters rise.
5. Switch language to Hindi or Telugu.
6. Close: "Next: WhatsApp alerts, real mandi prices, low-cost temperature sensors, a cooperative cold-chain network."

## Honest limits (say these in Q&A)
- Freshness is an estimate with a range, not a sensor reading.
- Distances use a road-factor on straight lines, not live routing (OSRM is the next step).
- Buyers and prices are demo data.
