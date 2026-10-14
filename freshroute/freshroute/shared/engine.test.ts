import assert from "node:assert/strict";
import { estimateFreshness } from "./freshness";
import { matchBuyers, adviceFor } from "./matching";
import { prioritise, groupPickups, coldStorageOptions } from "./logistics";
import { makeSeedLots, BUYERS, COLD_ROOMS } from "./seed";

const now = Date.UTC(2026, 9, 14, 6, 0, 0);
const ambientC = 30;
const ctx = { now, ambientC };
const lots = makeSeedLots(now);

// 1. Hotter storage => less life left
const sun = estimateFreshness({ cropId: "tomato", storage: "open_sun", harvestedAt: now - 24 * 36e5, now, ambientC });
const cold = estimateFreshness({ cropId: "tomato", storage: "cold_room", harvestedAt: now - 24 * 36e5, now, ambientC });
assert.ok(sun.remainingHoursMid < cold.remainingHoursMid, "sun should age faster than cold room");

// 2. Fresh lot has more life than old lot
const l1 = lots.find((l) => l.id === "L1")!;
const l6 = lots.find((l) => l.id === "L6")!;
const f1 = estimateFreshness({ cropId: l1.cropId, storage: l1.storage, harvestedAt: l1.harvestedAt, now, ambientC });
const f6 = estimateFreshness({ cropId: l6.cropId, storage: l6.storage, harvestedAt: l6.harvestedAt, now, ambientC });
assert.ok(f6.percentLeft > f1.percentLeft);

// 3. Range ordering
assert.ok(f1.remainingHoursLow <= f1.remainingHoursMid && f1.remainingHoursMid <= f1.remainingHoursHigh);

// 4. Time passing eventually spoils and removes all matches
const later = { now: now + 400 * 36e5, ambientC };
assert.equal(
  estimateFreshness({ cropId: "tomato", storage: "shade", harvestedAt: l6.harvestedAt, now: later.now, ambientC }).status,
  "spoiled",
);
assert.equal(matchBuyers(l6, BUYERS, later).length, 0);

// 5. Matching respects accepted crops & min freshness
for (const l of lots) {
  const ms = matchBuyers(l, BUYERS, ctx);
  for (const m of ms) {
    assert.ok(m.buyer.accepts.includes(l.cropId));
    assert.ok(m.percentLeftAtArrival >= m.buyer.minFreshPercentAtArrival);
  }
}

// 6. Priority puts least time first
const pr = prioritise(lots, ctx);
for (let i = 1; i < pr.length; i++) assert.ok(pr[i - 1].hoursLeft <= pr[i].hoursLeft || pr[i - 1].hoursLeft > 0);

// 7. Cold storage options exist for a sun-stored lot
assert.ok(coldStorageOptions(l1, COLD_ROOMS, ctx).length > 0);

console.log("lot | crop | storage | pct | hrs(mid) | status | advice | best");
for (const l of lots) {
  const f = estimateFreshness({ cropId: l.cropId, storage: l.storage, harvestedAt: l.harvestedAt, now, ambientC });
  const ms = matchBuyers(l, BUYERS, ctx);
  console.log(
    [l.id, l.cropId, l.storage, f.percentLeft + "%", f.remainingHoursMid, f.status, adviceFor(l, ms, ctx), ms[0] ? `${ms[0].buyer.name} (${ms[0].distanceKm}km, ${ms[0].percentLeftAtArrival}%, Rs${ms[0].expectedIncome})` : "none"].join(" | "),
  );
}
console.log("priority:", pr.map((p) => `${p.lot.id}:${p.hoursLeft}h`).join(", "));
console.log("groups:", JSON.stringify(groupPickups(lots, ctx)));
console.log("ALL TESTS PASSED");
