import { useEffect, useMemo, useState } from "react";
import { makeT, LANGS, type Lang } from "./core/i18n";
import { BUYERS, COLD_ROOMS, makeSeedLots } from "./core/seed";
import { prioritise, groupPickups, coldStorageOptions } from "./core/logistics";
import { matchBuyers, adviceFor } from "./core/matching";
import { totalImpact } from "./core/impact";
import type { BuyerMatch, Lot } from "./core/types";
import LotCard from "./components/LotCard";
import AddLotForm from "./components/AddLotForm";
import MapView from "./components/MapView";
import ImpactBar from "./components/ImpactBar";

const STORE_KEY = "freshroute.v1";

interface Saved {
  lots: Lot[];
  chosen: Record<string, string>; // lotId -> buyerId
  lang: Lang;
  ambientC: number;
}

function load(): Saved {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) return JSON.parse(raw) as Saved;
  } catch {
    /* ignore */
  }
  return { lots: makeSeedLots(Date.now()), chosen: {}, lang: "en", ambientC: 30 };
}

export default function App() {
  const [saved, setSaved] = useState<Saved>(load);
  const [offsetH, setOffsetH] = useState(0); // demo time travel
  const [showAdd, setShowAdd] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const t = makeT(saved.lang);
  const now = useMemo(() => Date.now() + offsetH * 36e5, [offsetH, saved.lots]);
  const ctx = useMemo(() => ({ now, ambientC: saved.ambientC }), [now, saved.ambientC]);

  useEffect(() => {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(saved));
    } catch {
      /* ignore */
    }
  }, [saved]);

  const patch = (p: Partial<Saved>) => setSaved((s) => ({ ...s, ...p }));

  const priorities = useMemo(() => prioritise(saved.lots, ctx), [saved.lots, ctx]);
  const groups = useMemo(() => groupPickups(saved.lots, ctx), [saved.lots, ctx]);

  const matchesByLot = useMemo(() => {
    const m: Record<string, BuyerMatch[]> = {};
    for (const l of saved.lots) m[l.id] = matchBuyers(l, BUYERS, ctx);
    return m;
  }, [saved.lots, ctx]);

  const impact = useMemo(
    () =>
      totalImpact(
        saved.lots.map((lot) => {
          const chosenId = saved.chosen[lot.id];
          const best = chosenId
            ? matchesByLot[lot.id].find((m) => m.buyer.id === chosenId)
            : undefined;
          return { lot, best };
        }),
      ),
    [saved.lots, saved.chosen, matchesByLot],
  );

  const selectedLot = saved.lots.find((l) => l.id === selectedId) ?? null;
  const groupOf = (lotId: string) => groups.find((g) => g.lotIds.includes(lotId));

  return (
    <div className="mx-auto max-w-6xl p-4 pb-16">
      {/* Header */}
      <header className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-leaf-700">🌿 {t("appName")}</h1>
          <p className="text-sm text-slate-600">{t("tagline")}</p>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-slate-600" htmlFor="lang">
            {t("language")}
          </label>
          <select
            id="lang"
            className="rounded border border-slate-300 bg-white px-2 py-1"
            value={saved.lang}
            onChange={(e) => patch({ lang: e.target.value as Lang })}
          >
            {LANGS.map((l) => (
              <option key={l.id} value={l.id}>
                {l.label}
              </option>
            ))}
          </select>
        </div>
      </header>

      <ImpactBar impact={impact} t={t} />

      {/* Demo controls */}
      <section className="mb-4 grid gap-4 rounded-xl bg-white p-4 shadow-sm sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium">
            ⏩ {t("timeTravel")}: <b>+{offsetH} {t("hoursPlus")}</b>
          </label>
          <input
            type="range"
            min={0}
            max={96}
            step={1}
            value={offsetH}
            onChange={(e) => setOffsetH(Number(e.target.value))}
            className="w-full accent-leaf-600"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">
            🌡️ {t("temperature")}: <b>{saved.ambientC}°C</b>
          </label>
          <input
            type="range"
            min={15}
            max={45}
            value={saved.ambientC}
            onChange={(e) => patch({ ambientC: Number(e.target.value) })}
            className="w-full accent-orange-500"
          />
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-5">
        {/* Left column: priority + lots */}
        <div className="space-y-4 lg:col-span-3">
          <section className="rounded-xl bg-white p-4 shadow-sm">
            <h2 className="mb-2 font-semibold">📋 {t("priorities")}</h2>
            <ol className="space-y-1 text-sm">
              {priorities.map((p) => (
                <li key={p.lot.id}>
                  <button
                    onClick={() => setSelectedId(p.lot.id)}
                    className="flex w-full items-center justify-between rounded px-2 py-1 text-left hover:bg-slate-100"
                  >
                    <span>
                      <b>{p.rank}.</b> {p.lot.farmerName} — {p.lot.locationName}
                    </span>
                    <span className={p.hoursLeft <= 0 ? "text-red-600" : p.hoursLeft < 24 ? "text-orange-600" : "text-green-700"}>
                      {p.hoursLeft <= 0 ? t("spoiled") : `${Math.round(p.hoursLeft)} ${t("hoursLeft")}`}
                    </span>
                  </button>
                </li>
              ))}
            </ol>
          </section>

          {groups.map((g, i) => (
            <section key={i} className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm">
              <h3 className="font-semibold">🚚 {t("sharedTruck")}</h3>
              <p>{t("sharedTruckHelp")}</p>
              <p className="mt-1 text-slate-700">
                {g.lotIds
                  .map((id) => saved.lots.find((l) => l.id === id)?.locationName)
                  .join(" + ")}{" "}
                · {g.totalKg} {t("kg")} · ~{g.kmSaved} {t("km")} saved
              </p>
            </section>
          ))}

          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">
              {t("myLots")} ({saved.lots.length})
            </h2>
            <button
              className="rounded-lg bg-leaf-600 px-4 py-2 font-medium text-white hover:bg-leaf-700"
              onClick={() => setShowAdd(true)}
            >
              + {t("addLot")}
            </button>
          </div>

          {showAdd && (
            <AddLotForm
              t={t}
              lang={saved.lang}
              onCancel={() => setShowAdd(false)}
              onSave={(lot) => {
                patch({ lots: [lot, ...saved.lots] });
                setShowAdd(false);
                setSelectedId(lot.id);
              }}
            />
          )}

          {saved.lots.map((lot) => {
            const matches = matchesByLot[lot.id];
            return (
              <LotCard
                key={lot.id}
                lot={lot}
                t={t}
                lang={saved.lang}
                ctx={ctx}
                matches={matches}
                advice={adviceFor(lot, matches, ctx)}
                cold={coldStorageOptions(lot, COLD_ROOMS, ctx)}
                inGroup={!!groupOf(lot.id)}
                chosenBuyerId={saved.chosen[lot.id]}
                selected={selectedId === lot.id}
                onSelect={() => setSelectedId(lot.id)}
                onChoose={(buyerId) => patch({ chosen: { ...saved.chosen, [lot.id]: buyerId } })}
                onRemove={() => {
                  const { [lot.id]: _drop, ...rest } = saved.chosen;
                  patch({ lots: saved.lots.filter((l) => l.id !== lot.id), chosen: rest });
                }}
              />
            );
          })}

          <button
            className="text-xs text-slate-500 underline"
            onClick={() => {
              setOffsetH(0);
              setSaved({ lots: makeSeedLots(Date.now()), chosen: {}, lang: saved.lang, ambientC: 30 });
            }}
          >
            {t("reset")}
          </button>
          <p className="text-xs text-slate-500">{t("estimateNote")}</p>
        </div>

        {/* Right column: map */}
        <div className="lg:col-span-2">
          <div className="sticky top-4 rounded-xl bg-white p-3 shadow-sm">
            <h2 className="mb-2 font-semibold">🗺️ {t("map")}</h2>
            <MapView
              lots={saved.lots}
              buyers={BUYERS}
              coldRooms={COLD_ROOMS}
              selectedLot={selectedLot}
              matches={selectedLot ? matchesByLot[selectedLot.id] : []}
              onSelectLot={setSelectedId}
              t={t}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
