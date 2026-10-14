import { StatusBar } from "expo-status-bar";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Slider from "@react-native-community/slider";
import { useEffect, useMemo, useState } from "react";
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { getCrop } from "./src/core/crops";
import { estimateFreshness } from "./src/core/freshness";
import { LANGS, makeT, type Lang } from "./src/core/i18n";
import { coldStorageOptions, groupPickups, prioritise } from "./src/core/logistics";
import { adviceFor, matchBuyers } from "./src/core/matching";
import { totalImpact } from "./src/core/impact";
import { BUYERS, COLD_ROOMS, makeSeedLots } from "./src/core/seed";
import type { BuyerMatch, Lot } from "./src/core/types";
import AddLot from "./src/AddLot";

const KEY = "freshroute.mobile.v1";
const COLORS = { fresh: "#22c55e", sell_soon: "#facc15", urgent: "#ef4444", spoiled: "#94a3b8" } as const;

interface Saved {
  lots: Lot[];
  chosen: Record<string, string>;
  lang: Lang;
  ambientC: number;
}

export default function App() {
  const [saved, setSaved] = useState<Saved>({ lots: makeSeedLots(Date.now()), chosen: {}, lang: "en", ambientC: 30 });
  const [ready, setReady] = useState(false);
  const [offsetH, setOffsetH] = useState(0);
  const [adding, setAdding] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((raw) => raw && setSaved(JSON.parse(raw) as Saved))
      .catch(() => {})
      .finally(() => setReady(true));
  }, []);
  useEffect(() => {
    if (ready) AsyncStorage.setItem(KEY, JSON.stringify(saved)).catch(() => {});
  }, [saved, ready]);

  const t = makeT(saved.lang);
  const patch = (p: Partial<Saved>) => setSaved((s) => ({ ...s, ...p }));
  const now = useMemo(() => Date.now() + offsetH * 36e5, [offsetH, saved.lots]);
  const ctx = useMemo(() => ({ now, ambientC: saved.ambientC }), [now, saved.ambientC]);

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
        saved.lots.map((lot) => ({
          lot,
          best: matchesByLot[lot.id].find((m) => m.buyer.id === saved.chosen[lot.id]),
        })),
      ),
    [saved.lots, saved.chosen, matchesByLot],
  );

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar style="light" />
      <View style={s.header}>
        <Text style={s.title}>🌿 {t("appName")}</Text>
        <View style={s.langRow}>
          {LANGS.map((l) => (
            <TouchableOpacity key={l.id} onPress={() => patch({ lang: l.id })}>
              <Text style={[s.lang, saved.lang === l.id && s.langOn]}>{l.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 12, paddingBottom: 60 }}>
        {/* Impact */}
        <View style={s.impactRow}>
          <Impact value={impact.kgRescued} label={t("kgRescued")} />
          <Impact value={impact.incomeRecovered} label={"₹ " + t("incomeRecovered")} />
          <Impact value={impact.co2AvoidedKg} label={t("co2")} />
        </View>

        {/* Controls */}
        <View style={s.card}>
          <Text style={s.label}>⏩ {t("timeTravel")}: +{offsetH} {t("hoursPlus")}</Text>
          <Slider minimumValue={0} maximumValue={96} step={1} value={offsetH} onValueChange={setOffsetH} minimumTrackTintColor="#16a34a" />
          <Text style={s.label}>🌡️ {t("temperature")}: {saved.ambientC}°C</Text>
          <Slider minimumValue={15} maximumValue={45} step={1} value={saved.ambientC} onValueChange={(v) => patch({ ambientC: v })} minimumTrackTintColor="#f97316" />
        </View>

        {/* Priorities */}
        <View style={s.card}>
          <Text style={s.h2}>📋 {t("priorities")}</Text>
          {priorities.map((p) => (
            <TouchableOpacity key={p.lot.id} onPress={() => setOpenId(p.lot.id)} style={s.rowBetween}>
              <Text style={s.body}>
                {p.rank}. {p.lot.farmerName} — {p.lot.locationName}
              </Text>
              <Text style={{ color: p.hoursLeft <= 0 ? "#dc2626" : p.hoursLeft < 24 ? "#ea580c" : "#15803d", fontWeight: "600" }}>
                {p.hoursLeft <= 0 ? t("spoiled") : `${Math.round(p.hoursLeft)} h`}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {groups.map((g, i) => (
          <View key={i} style={[s.card, { backgroundColor: "#eff6ff" }]}>
            <Text style={s.h2}>🚚 {t("sharedTruck")}</Text>
            <Text style={s.body}>{t("sharedTruckHelp")}</Text>
            <Text style={s.muted}>
              {g.lotIds.map((id) => saved.lots.find((l) => l.id === id)?.locationName).join(" + ")} · {g.totalKg} {t("kg")} · ~{g.kmSaved} {t("km")}
            </Text>
          </View>
        ))}

        <TouchableOpacity style={s.addBtn} onPress={() => setAdding(true)}>
          <Text style={s.addBtnText}>+ {t("addLot")}</Text>
        </TouchableOpacity>

        {adding && (
          <AddLot
            t={t}
            lang={saved.lang}
            onCancel={() => setAdding(false)}
            onSave={(lot) => {
              patch({ lots: [lot, ...saved.lots] });
              setAdding(false);
              setOpenId(lot.id);
            }}
          />
        )}

        {/* Lots */}
        {saved.lots.map((lot) => {
          const crop = getCrop(lot.cropId);
          const f = estimateFreshness({ cropId: lot.cropId, storage: lot.storage, harvestedAt: lot.harvestedAt, now, ambientC: saved.ambientC });
          const matches = matchesByLot[lot.id];
          const advice = adviceFor(lot, matches, ctx);
          const cold = coldStorageOptions(lot, COLD_ROOMS, ctx)[0];
          const open = openId === lot.id;
          return (
            <TouchableOpacity key={lot.id} activeOpacity={0.9} onPress={() => setOpenId(open ? null : lot.id)} style={s.card}>
              <Text style={s.h2}>
                {crop.emoji} {crop.names[saved.lang]} · {lot.quantityKg} {t("kg")}
              </Text>
              <Text style={s.muted}>
                {lot.farmerName} · {lot.locationName} · {t(lot.storage)}
              </Text>
              <View style={s.barBg}>
                <View style={[s.barFill, { width: `${f.percentLeft}%`, backgroundColor: COLORS[f.status] }]} />
              </View>
              <Text style={s.body}>
                <Text style={{ fontWeight: "700" }}>{t(f.status)}</Text> · {f.percentLeft}% · {Math.round(f.remainingHoursLow)}–{Math.round(f.remainingHoursHigh)} h {t("hoursLeft")}
              </Text>
              <Text style={[s.body, { color: "#15803d", fontWeight: "600" }]}>👉 {t(`advice_${advice}`)}</Text>

              {open && f.status !== "spoiled" && (
                <View style={{ marginTop: 8 }}>
                  <Text style={s.h3}>{t("bestBuyers")}</Text>
                  {matches.length === 0 && <Text style={[s.body, { color: "#9a3412" }]}>{t("noBuyers")}</Text>}
                  {matches.slice(0, 3).map((m) => {
                    const chosen = saved.chosen[lot.id] === m.buyer.id;
                    return (
                      <View key={m.buyer.id} style={s.buyer}>
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontWeight: "600" }}>{m.buyer.name}</Text>
                          <Text style={s.muted}>
                            {t(m.buyer.type)} · {m.distanceKm} {t("km")} · {t("arrivesWith")} {m.percentLeftAtArrival}%
                          </Text>
                          <Text style={s.muted}>
                            {t("price")}: ₹{m.priceAtArrivalPerKg} · {t("income")}: ₹{m.expectedIncome}
                          </Text>
                        </View>
                        <TouchableOpacity
                          onPress={() => patch({ chosen: { ...saved.chosen, [lot.id]: m.buyer.id } })}
                          style={[s.chip, chosen && { backgroundColor: "#16a34a" }]}
                        >
                          <Text style={{ color: chosen ? "#fff" : "#111", fontSize: 12 }}>{chosen ? "✓ " + t("chosen") : t("accept")}</Text>
                        </TouchableOpacity>
                      </View>
                    );
                  })}
                  {cold && lot.storage !== "cold_room" && (
                    <Text style={[s.body, { backgroundColor: "#f0f9ff", padding: 8, borderRadius: 8, marginTop: 6 }]}>
                      ❄️ {t("coldStorage")}: {cold.storage.name} ({cold.distanceKm} {t("km")}) → +{Math.round(cold.extraHours)} {t("coldGain")}
                    </Text>
                  )}
                  <TouchableOpacity onPress={() => patch({ lots: saved.lots.filter((l) => l.id !== lot.id) })}>
                    <Text style={{ color: "#dc2626", textAlign: "right", marginTop: 6, fontSize: 12 }}>{t("delete")}</Text>
                  </TouchableOpacity>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
        <Text style={s.muted}>{t("estimateNote")}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function Impact({ value, label }: { value: number; label: string }) {
  return (
    <View style={s.impact}>
      <Text style={s.impactNum}>{value.toLocaleString("en-IN")}</Text>
      <Text style={s.impactLabel}>{label}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f8fafc" },
  header: { backgroundColor: "#15803d", paddingHorizontal: 14, paddingVertical: 12 },
  title: { color: "#fff", fontSize: 22, fontWeight: "700" },
  langRow: { flexDirection: "row", gap: 14, marginTop: 6 },
  lang: { color: "#bbf7d0", fontSize: 14 },
  langOn: { color: "#fff", fontWeight: "700", textDecorationLine: "underline" },
  impactRow: { flexDirection: "row", gap: 8, marginBottom: 10 },
  impact: { flex: 1, backgroundColor: "#14532d", borderRadius: 12, padding: 10, alignItems: "center" },
  impactNum: { color: "#fff", fontSize: 18, fontWeight: "700" },
  impactLabel: { color: "#bbf7d0", fontSize: 11, textAlign: "center" },
  card: { backgroundColor: "#fff", borderRadius: 12, padding: 12, marginBottom: 10 },
  h2: { fontSize: 16, fontWeight: "700", marginBottom: 2 },
  h3: { fontSize: 14, fontWeight: "700", marginBottom: 4 },
  label: { fontSize: 13, fontWeight: "600", marginTop: 4 },
  body: { fontSize: 14, marginTop: 2 },
  muted: { fontSize: 12, color: "#64748b", marginTop: 2 },
  rowBetween: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 6 },
  barBg: { height: 10, backgroundColor: "#e2e8f0", borderRadius: 6, marginVertical: 6, overflow: "hidden" },
  barFill: { height: "100%" },
  addBtn: { backgroundColor: "#16a34a", padding: 14, borderRadius: 12, alignItems: "center", marginBottom: 10 },
  addBtnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  buyer: { flexDirection: "row", alignItems: "center", gap: 8, borderWidth: 1, borderColor: "#e2e8f0", borderRadius: 10, padding: 8, marginBottom: 6 },
  chip: { backgroundColor: "#f1f5f9", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
});
