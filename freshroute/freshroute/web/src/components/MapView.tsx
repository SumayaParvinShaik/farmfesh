import { CircleMarker, MapContainer, Polyline, Popup, TileLayer, Tooltip, useMap } from "react-leaflet";
import { useEffect } from "react";
import type { Buyer, BuyerMatch, ColdStorage, Lot } from "../core/types";

interface Props {
  lots: Lot[];
  buyers: Buyer[];
  coldRooms: ColdStorage[];
  selectedLot: Lot | null;
  matches: BuyerMatch[];
  onSelectLot: (id: string) => void;
  t: (k: string) => string;
}

function FlyTo({ lot }: { lot: Lot | null }) {
  const map = useMap();
  useEffect(() => {
    if (lot) map.flyTo([lot.location.lat, lot.location.lng], 11, { duration: 0.6 });
  }, [lot, map]);
  return null;
}

export default function MapView({ lots, buyers, coldRooms, selectedLot, matches, onSelectLot, t }: Props) {
  const reachable = new Set(matches.map((m) => m.buyer.id));
  const bestId = matches[0]?.buyer.id;

  return (
    <MapContainer
      center={[17.47, 78.38]}
      zoom={10}
      scrollWheelZoom={false}
      style={{ height: 460, width: "100%", borderRadius: 12 }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FlyTo lot={selectedLot} />

      {/* Line to best buyer */}
      {selectedLot && matches[0] && (
        <Polyline
          positions={[
            [selectedLot.location.lat, selectedLot.location.lng],
            [matches[0].buyer.location.lat, matches[0].buyer.location.lng],
          ]}
          pathOptions={{ color: "#16a34a", weight: 4, dashArray: "6 8" }}
        />
      )}

      {/* Farms */}
      {lots.map((l) => (
        <CircleMarker
          key={l.id}
          center={[l.location.lat, l.location.lng]}
          radius={selectedLot?.id === l.id ? 12 : 8}
          pathOptions={{ color: "#14532d", fillColor: "#22c55e", fillOpacity: 0.9 }}
          eventHandlers={{ click: () => onSelectLot(l.id) }}
        >
          <Tooltip>
            🌾 {l.farmerName} ({l.locationName})
          </Tooltip>
        </CircleMarker>
      ))}

      {/* Buyers */}
      {buyers.map((b) => {
        const ok = !selectedLot || reachable.has(b.id);
        return (
          <CircleMarker
            key={b.id}
            center={[b.location.lat, b.location.lng]}
            radius={b.id === bestId ? 11 : 7}
            pathOptions={{
              color: ok ? "#1d4ed8" : "#94a3b8",
              fillColor: ok ? "#3b82f6" : "#cbd5e1",
              fillOpacity: ok ? 0.9 : 0.5,
            }}
          >
            <Popup>
              <b>{b.name}</b>
              <br />
              {t(b.type)}
            </Popup>
          </CircleMarker>
        );
      })}

      {/* Cold rooms */}
      {coldRooms.map((c) => (
        <CircleMarker
          key={c.id}
          center={[c.location.lat, c.location.lng]}
          radius={7}
          pathOptions={{ color: "#0e7490", fillColor: "#67e8f9", fillOpacity: 0.9 }}
        >
          <Tooltip>❄️ {c.name}</Tooltip>
        </CircleMarker>
      ))}
    </MapContainer>
  );
}
