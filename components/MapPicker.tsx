"use client";

import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L, { LatLngExpression } from "leaflet";
import "leaflet/dist/leaflet.css";

// Memperbaiki isu ikon marker bawaan Leaflet yang sering hilang di Next.js
const DefaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

interface MapPosition {
  lat: number;
  lng: number;
}

function LocationMarker({ 
  position, 
  setPosition 
}: { 
  position: MapPosition | null
  setPosition: (pos: MapPosition) => void 
}) {
  useMapEvents({
    click(e: L.LeafletMouseEvent) {
      setPosition({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });

  return position === null ? null : <Marker position={[position.lat, position.lng]} />;
}

export default function MapPicker({ 
  position, 
  setPosition 
}: { 
  position: MapPosition | null
  setPosition: (pos: MapPosition) => void 
}) {
  // Titik tengah default: Pusat Kota Tanjungpinang
  const center: LatLngExpression = [0.9156, 104.4431];
  const displayCenter: LatLngExpression = position 
    ? [position.lat, position.lng]
    : center;

  return (
    <div className="h-64 w-full border border-gray-300 relative z-0">
      <MapContainer 
        center={displayCenter}
        zoom={14} 
        scrollWheelZoom={true} 
        style={{ height: "100%", width: "100%", zIndex: 0 }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        <LocationMarker position={position} setPosition={setPosition} />
      </MapContainer>
    </div>
  );
}