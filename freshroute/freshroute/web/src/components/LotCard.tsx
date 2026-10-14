import { getCrop } from "../core/crops";
import { estimateFreshness } from "../core/freshness";
import type { Advice } from "../core/matching";
import type { ColdOption } from "../core/logistics";
import type { BuyerMatch, Lot } from "../core/types";
import type { Lang } from "../core/i18n";

interface Props {
  lot: Lot;
  t: (k: string) => string;
  lang: Lang;
  ctx: { now: number; ambientC: number };
  matches: BuyerMatch[];
  advice: Advice;
  cold: ColdOption[];
  inGroup: boolean;
  chosenBuyerId?: string;
  selected: boolean;
  onSelect: () => void;
  onChoose: (buyerId: string) => void;
  onRemove: () => void;
}

const STATUS_STYLE = {
  fresh: { bar: "bg-green-500", chip: "bg-green-100 text-green-800" },
  sell_soon: { bar: "bg-yellow-400", chip: "bg-yellow-100 text-yellow-800" },
  urgent: { bar: "bg-red-500", chip: "bg-red-100 text-red-800" },
  spoiled: { bar: "bg-slate-400", chip: "bg-slate-200 text-slate-700" },
} as const;

export default function LotCard(p: Props) {
  const { lot, t, lang, ctx } = p;
  const crop = getCrop(lot.cropId);
  const f = estimateFreshness({
    cropId: lot.cropId,
    storage: lot.storage,
    harvestedAt: lot.harvestedAt,
    now: ctx.now,
    ambientC: ctx.ambientC,
  });
  const style = STATUS_STYLE[f.status];
  const top = p.matches.slice(0, 3);

  return (
    <article
      onClick={p.onSelect}
      className={`rounded-xl bg-white p-4 shadow-sm ring-2 ${p.selected ? "ring-leaf-500" : "ring-transparent"}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="text-lg font-semibold">
            {crop.emoji} {crop.names[lang]} · {lot.quantityKg} {t("kg")}
          </h3>
          <p className="text-sm text-slate-600">
            {lot.farmerName} · {lot.locationName} · {t(lot.storage)}
          </p>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${style.chip}`}>{t(f.status)}</span>
      </div>

      {/* Freshness bar */}
      <div className="mt-3">
        <div className="h-3 w-full overflow-hidden rounded-full bg-slate-200">
          <div className={`h-full ${style.bar} transition-all`} style={{ width: `${f.percentLeft}%` }} />
        </div>
        <p className="mt-1 text-sm">
          <b>{f.percentLeft}%</b> · {t("range")}: {Math.round(f.remainingHoursLow)}–{Math.round(f.remainingHoursHigh)} h
          {" "}
          ({t("hoursLeft")})
        </p>
      </div>

      <p className="mt-2 text-sm font-medium text-leaf-700">👉 {t(`advice_${p.advice}`)}</p>
      {p.inGroup && <p className="text-xs text-blue-700">🚚 {t("sharedTruck")}</p>}

      {/* Buyers */}
      {f.status !== "spoiled" && (
        <div className="mt-3">
          <h4 className="mb-1 text-sm font-semibold">{t("bestBuyers")}</h4>
          {top.length === 0 ? (
            <p className="rounded bg-orange-50 p-2 text-sm text-orange-800">{t("noBuyers")}</p>
          ) : (
            <ul className="space-y-2">
              {top.map((m) => {
                const chosen = p.chosenBuyerId === m.buyer.id;
                return (
                  <li key={m.buyer.id} className="rounded-lg border border-slate-200 p-2 text-sm">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-medium">{m.buyer.name}</div>
                        <div className="text-xs text-slate-600">
                          {t(m.buyer.type)} · {m.distanceKm} {t("km")} · {t("arrivesWith")} {m.percentLeftAtArrival}% {t("lifeLeft")}
                        </div>
                        <div className="text-xs text-slate-600">
                          {t("price")}: ₹{m.priceAtArrivalPerKg} · {t("income")}: ₹{m.expectedIncome.toLocaleString("en-IN")}
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          p.onChoose(m.buyer.id);
                        }}
                        className={`shrink-0 rounded px-2 py-1 text-xs font-medium ${
                          chosen ? "bg-leaf-600 text-white" : "bg-slate-100 hover:bg-slate-200"
                        }`}
                      >
                        {chosen ? "✓ " + t("chosen") : t("accept")}
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}

      {/* Cold storage */}
      {f.status !== "spoiled" && p.cold.length > 0 && lot.storage !== "cold_room" && (
        <div className="mt-3 rounded-lg bg-sky-50 p-2 text-sm">
          ❄️ <b>{t("coldStorage")}:</b> {p.cold[0].storage.name} ({p.cold[0].distanceKm} {t("km")}) → +
          {Math.round(p.cold[0].extraHours)} {t("coldGain")}
        </div>
      )}

      <div className="mt-2 text-right">
        <button
          className="text-xs text-red-600 underline"
          onClick={(e) => {
            e.stopPropagation();
            p.onRemove();
          }}
        >
          {t("delete")}
        </button>
      </div>
    </article>
  );
}
