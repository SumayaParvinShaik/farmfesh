import { useState } from "react";
import { CROPS } from "../core/crops";
import type { Lang } from "../core/i18n";
import type { Lot, StorageType } from "../core/types";

const STORAGE: StorageType[] = ["open_sun", "shade", "crate_shade", "cold_room"];

/** A few demo villages so the farmer doesn't need to type coordinates. */
const PLACES = [
  { name: "Medchal", lat: 17.55, lng: 78.35 },
  { name: "Shamirpet", lat: 17.5, lng: 78.28 },
  { name: "Keesara", lat: 17.6, lng: 78.4 },
  { name: "Shankarpally", lat: 17.44, lng: 78.2 },
  { name: "Ibrahimpatnam", lat: 17.3, lng: 78.55 },
];

interface Props {
  t: (k: string) => string;
  lang: Lang;
  onSave: (lot: Lot) => void;
  onCancel: () => void;
}

export default function AddLotForm({ t, lang, onSave, onCancel }: Props) {
  const [farmerName, setFarmerName] = useState("");
  const [cropId, setCropId] = useState(CROPS[0].id);
  const [quantityKg, setQuantityKg] = useState(100);
  const [hoursAgo, setHoursAgo] = useState(2);
  const [storage, setStorage] = useState<StorageType>("shade");
  const [placeIdx, setPlaceIdx] = useState(0);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const place = PLACES[placeIdx];
    onSave({
      id: "L" + Date.now(),
      farmerName: farmerName.trim() || "Farmer",
      cropId,
      quantityKg: Math.max(1, quantityKg),
      harvestedAt: Date.now() - Math.max(0, hoursAgo) * 36e5,
      storage,
      location: { lat: place.lat, lng: place.lng },
      locationName: place.name,
    });
  };

  const field = "w-full rounded border border-slate-300 px-2 py-2";
  return (
    <form onSubmit={submit} className="grid gap-3 rounded-xl border-2 border-leaf-500 bg-white p-4 sm:grid-cols-2">
      <label className="text-sm">
        {t("farmerName")}
        <input className={field} value={farmerName} onChange={(e) => setFarmerName(e.target.value)} />
      </label>
      <label className="text-sm">
        {t("crop")}
        <select className={field} value={cropId} onChange={(e) => setCropId(e.target.value)}>
          {CROPS.map((c) => (
            <option key={c.id} value={c.id}>
              {c.emoji} {c.names[lang]}
            </option>
          ))}
        </select>
      </label>
      <label className="text-sm">
        {t("quantity")}
        <input type="number" min={1} className={field} value={quantityKg} onChange={(e) => setQuantityKg(Number(e.target.value))} />
      </label>
      <label className="text-sm">
        {t("harvestedHoursAgo")}
        <input type="number" min={0} className={field} value={hoursAgo} onChange={(e) => setHoursAgo(Number(e.target.value))} />
      </label>
      <label className="text-sm">
        {t("storage")}
        <select className={field} value={storage} onChange={(e) => setStorage(e.target.value as StorageType)}>
          {STORAGE.map((s) => (
            <option key={s} value={s}>
              {t(s)}
            </option>
          ))}
        </select>
      </label>
      <label className="text-sm">
        {t("location")}
        <select className={field} value={placeIdx} onChange={(e) => setPlaceIdx(Number(e.target.value))}>
          {PLACES.map((p, i) => (
            <option key={p.name} value={i}>
              {p.name}
            </option>
          ))}
        </select>
      </label>
      <div className="flex gap-2 sm:col-span-2">
        <button type="submit" className="rounded-lg bg-leaf-600 px-4 py-2 font-medium text-white hover:bg-leaf-700">
          {t("save")}
        </button>
        <button type="button" onClick={onCancel} className="rounded-lg bg-slate-100 px-4 py-2 hover:bg-slate-200">
          {t("cancel")}
        </button>
      </div>
    </form>
  );
}
