import { useState } from "react";
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { CROPS } from "./core/crops";
import type { Lang } from "./core/i18n";
import type { Lot, StorageType } from "./core/types";

const STORAGE: StorageType[] = ["open_sun", "shade", "crate_shade", "cold_room"];
const PLACES = [
  { name: "Medchal", lat: 17.55, lng: 78.35 },
  { name: "Shamirpet", lat: 17.5, lng: 78.28 },
  { name: "Keesara", lat: 17.6, lng: 78.4 },
  { name: "Shankarpally", lat: 17.44, lng: 78.2 },
  { name: "Ibrahimpatnam", lat: 17.3, lng: 78.55 },
];

export default function AddLot(p: { t: (k: string) => string; lang: Lang; onSave: (l: Lot) => void; onCancel: () => void }) {
  const [farmer, setFarmer] = useState("");
  const [cropId, setCropId] = useState(CROPS[0].id);
  const [kg, setKg] = useState("100");
  const [hours, setHours] = useState("2");
  const [storage, setStorage] = useState<StorageType>("shade");
  const [place, setPlace] = useState(0);

  const save = () => {
    const pl = PLACES[place];
    p.onSave({
      id: "L" + Date.now(),
      farmerName: farmer.trim() || "Farmer",
      cropId,
      quantityKg: Math.max(1, Number(kg) || 1),
      harvestedAt: Date.now() - Math.max(0, Number(hours) || 0) * 36e5,
      storage,
      location: { lat: pl.lat, lng: pl.lng },
      locationName: pl.name,
    });
  };

  return (
    <View style={s.box}>
      <Text style={s.label}>{p.t("farmerName")}</Text>
      <TextInput style={s.input} value={farmer} onChangeText={setFarmer} />
      <Text style={s.label}>{p.t("crop")}</Text>
      <Pills items={CROPS.map((c) => ({ id: c.id, text: `${c.emoji} ${c.names[p.lang]}` }))} value={cropId} onPick={setCropId} />
      <Text style={s.label}>{p.t("quantity")}</Text>
      <TextInput style={s.input} keyboardType="numeric" value={kg} onChangeText={setKg} />
      <Text style={s.label}>{p.t("harvestedHoursAgo")}</Text>
      <TextInput style={s.input} keyboardType="numeric" value={hours} onChangeText={setHours} />
      <Text style={s.label}>{p.t("storage")}</Text>
      <Pills items={STORAGE.map((x) => ({ id: x, text: p.t(x) }))} value={storage} onPick={(v) => setStorage(v as StorageType)} />
      <Text style={s.label}>{p.t("location")}</Text>
      <Pills items={PLACES.map((x, i) => ({ id: String(i), text: x.name }))} value={String(place)} onPick={(v) => setPlace(Number(v))} />
      <View style={{ flexDirection: "row", gap: 10, marginTop: 12 }}>
        <TouchableOpacity style={s.save} onPress={save}>
          <Text style={{ color: "#fff", fontWeight: "700" }}>{p.t("save")}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.cancel} onPress={p.onCancel}>
          <Text>{p.t("cancel")}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function Pills(p: { items: { id: string; text: string }[]; value: string; onPick: (id: string) => void }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 4 }}>
      {p.items.map((i) => (
        <TouchableOpacity key={i.id} onPress={() => p.onPick(i.id)} style={[s.pill, p.value === i.id && s.pillOn]}>
          <Text style={{ color: p.value === i.id ? "#fff" : "#111" }}>{i.text}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  box: { backgroundColor: "#fff", borderRadius: 12, padding: 12, marginBottom: 10, borderWidth: 2, borderColor: "#22c55e" },
  label: { fontSize: 13, fontWeight: "600", marginTop: 8 },
  input: { borderWidth: 1, borderColor: "#cbd5e1", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, marginTop: 4 },
  pill: { backgroundColor: "#f1f5f9", paddingHorizontal: 12, paddingVertical: 8, borderRadius: 18, marginRight: 8 },
  pillOn: { backgroundColor: "#16a34a" },
  save: { backgroundColor: "#16a34a", paddingHorizontal: 18, paddingVertical: 10, borderRadius: 10 },
  cancel: { backgroundColor: "#f1f5f9", paddingHorizontal: 18, paddingVertical: 10, borderRadius: 10 },
});
