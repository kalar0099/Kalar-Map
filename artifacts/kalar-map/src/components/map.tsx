import { useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { Place, PlaceCategory } from "@workspace/api-client-react";
import { CITY_COORDS, CATEGORY_LABELS, CITY_LABELS } from "@/lib/constants";
import { Link } from "wouter";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const categoryColors: Record<PlaceCategory, { bg: string; ring: string }> = {
  mosque:      { bg: "#16a34a", ring: "#bbf7d0" },
  school:      { bg: "#2563eb", ring: "#bfdbfe" },
  government:  { bg: "#475569", ring: "#cbd5e1" },
  hospital:    { bg: "#dc2626", ring: "#fecaca" },
  market:      { bg: "#ea580c", ring: "#fed7aa" },
  university:  { bg: "#7c3aed", ring: "#ddd6fe" },
  institute:   { bg: "#9333ea", ring: "#e9d5ff" },
  shop:        { bg: "#d97706", ring: "#fde68a" },
  stadium:     { bg: "#059669", ring: "#a7f3d0" },
  park:        { bg: "#65a30d", ring: "#d9f99d" },
  cemetery:    { bg: "#57534e", ring: "#d6d3d1" },
  hotel:       { bg: "#0284c7", ring: "#bae6fd" },
  restaurant:  { bg: "#b91c1c", ring: "#fecaca" },
  cafe:        { bg: "#92400e", ring: "#fde68a" },
  recreation:  { bg: "#0d9488", ring: "#99f6e4" },
};

const categoryIcons: Partial<Record<PlaceCategory, string>> = {
  mosque:     `<path d="M12 2C9 2 7 4 7 7c0 1.5.5 2.8 1.3 3.8L8 12H5v2h1v7h12v-7h1v-2h-3l-.3-1.2C15.5 9.8 16 8.5 16 7c0-3-2-5-4-5zm0 2c1.1 0 2 1.3 2 3s-.9 3-2 3-2-1.3-2-3 .9-3 2-3z" fill="white"/>`,
  hospital:   `<path d="M12 2v8H4v4h8v8h4v-8h8v-4h-8V2z" fill="white"/>`,
  school:     `<path d="M12 3L1 9l11 6 9-4.9V17h2V9L12 3zm-4.5 9.5l4.5 2.5 4.5-2.5V15l-4.5 2.5L7.5 15v-2.5z" fill="white"/>`,
  government: `<path d="M12 2L2 7v2h20V7L12 2zM4 10v8H2v2h20v-2h-2v-8h-2v8h-3v-8h-2v8H9v-8H7v8H4v-8H4z" fill="white"/>`,
  market:     `<path d="M4 4h16l-1.5 9H5.5L4 4zm3 11a2 2 0 100 4 2 2 0 000-4zm10 0a2 2 0 100 4 2 2 0 000-4z" fill="white"/>`,
  university: `<path d="M12 3L1 9l4 2.2V17h14v-5.8L21 9 12 3zm6 12H6v-3.4L12 15l6-3.4V15z" fill="white"/>`,
  park:       `<path d="M12 2a7 7 0 00-7 7c0 4 3 7 7 7s7-3 7-7a7 7 0 00-7-7zm-1 14v4h2v-4h-2zM6 21h12v2H6z" fill="white"/>`,
  stadium:    `<path d="M12 2C6 2 2 6 2 12s4 10 10 10 10-4 10-10S18 2 12 2zm0 2c4.4 0 8 3.6 8 8s-3.6 8-8 8-8-3.6-8-8 3.6-8 8-8zm-1 3v6l5 3 1-1.7-4-2.3V7h-2z" fill="white"/>`,
  hotel:      `<path d="M7 13c1.66 0 3-1.34 3-3S8.66 7 7 7s-3 1.34-3 3 1.34 3 3 3zm12-6h-8v7H3V5H1v15h2v-3h18v3h2v-9c0-2.21-1.79-4-4-4z" fill="white"/>`,
  restaurant: `<path d="M18 2h-2v7h-3V2h-2v7c0 2.12 1.66 3.84 3.75 3.97V22h2.5v-9.03C19.34 12.84 21 11.12 21 9V2h-3zm-6.25 10c-.41 0-.75.34-.75.75s.34.75.75.75.75-.34.75-.75-.34-.75-.75-.75zM11 2H9.5v2H8V2H6.5v2H5V2H3.5v4.5C3.5 8.43 5.07 10 7 10v12h2V10c1.93 0 3.5-1.57 3.5-3.5V2H11z" fill="white"/>`,
  cafe:       `<path d="M18.5 3H6c-1.1 0-2 .9-2 2v5.71c0 3.83 2.95 7.18 6.78 7.29 3.96.12 7.22-3.06 7.22-7v-1h.5c1.93 0 3.5-1.57 3.5-3.5S20.43 3 18.5 3zM16 13c0 2.76-2.24 5-5 5s-5-2.24-5-5V5h10v8zm2.5-3H16V5h2.5c.83 0 1.5.67 1.5 1.5S19.33 10 18.5 10zm-5.5 9h-2l-3 3h8l-3-3z" fill="white"/>`,
};

const createCustomIcon = (category: PlaceCategory, selected = false) => {
  const col = categoryColors[category] || { bg: "#14b8a6", ring: "#99f6e4" };
  const iconSvg = categoryIcons[category] || `<circle cx="12" cy="12" r="4" fill="white"/>`;
  const size = selected ? 40 : 34;
  const pulse = selected ? `<circle cx="${size/2}" cy="${size/2}" r="${size/2}" fill="${col.bg}" opacity="0.25" class="animate-ping"/>` : "";

  return L.divIcon({
    className: "",
    html: `
      <div style="position:relative;width:${size}px;height:${size}px;">
        ${selected ? `<div style="position:absolute;inset:0;border-radius:50%;background:${col.bg};opacity:0.2;animation:ping 1.5s cubic-bezier(0,0,0.2,1) infinite;"></div>` : ""}
        <div style="
          position:absolute;inset:0;
          background:${col.bg};
          border-radius:50%;
          display:flex;
          align-items:center;
          justify-content:center;
          border:3px solid white;
          box-shadow:0 4px 12px rgba(0,0,0,0.25),0 0 0 2px ${col.ring};
          transition:all 0.2s;
        ">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">${iconSvg}</svg>
        </div>
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -(size / 2) - 8],
  });
};

function MapUpdater({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, zoom, { duration: 1.2, easeLinearity: 0.3 });
  }, [center, zoom]);
  return null;
}

interface InteractiveMapProps {
  places: Place[];
  centerCity?: "kalar" | "kifre" | "rizgari";
}

export function InteractiveMap({ places, centerCity = "kalar" }: InteractiveMapProps) {
  const centerInfo = CITY_COORDS[centerCity];
  const center: [number, number] = [centerInfo.lat, centerInfo.lng];

  return (
    <div className="w-full h-full relative z-0">
      <style>{`
        .leaflet-popup-content-wrapper {
          border-radius: 16px !important;
          padding: 0 !important;
          overflow: hidden;
          box-shadow: 0 20px 40px rgba(0,0,0,0.18), 0 4px 12px rgba(0,0,0,0.1) !important;
          border: 1px solid rgba(255,255,255,0.8);
        }
        .leaflet-popup-content {
          margin: 0 !important;
          width: 220px !important;
        }
        .leaflet-popup-tip-container { display: none; }
        .leaflet-popup-close-button {
          color: white !important;
          font-size: 20px !important;
          top: 8px !important;
          right: 8px !important;
          z-index: 10;
          background: rgba(0,0,0,0.3) !important;
          border-radius: 50% !important;
          width: 24px !important;
          height: 24px !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          line-height: 1 !important;
        }
        @keyframes ping {
          75%, 100% { transform: scale(2); opacity: 0; }
        }
        .leaflet-control-zoom {
          border-radius: 12px !important;
          overflow: hidden;
          border: none !important;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15) !important;
        }
        .leaflet-control-zoom a {
          width: 36px !important;
          height: 36px !important;
          line-height: 36px !important;
          font-size: 18px !important;
          color: #374151 !important;
          background: white !important;
        }
        .leaflet-control-zoom a:hover {
          background: #f3f4f6 !important;
        }
        .leaflet-attribution-flag { display: none !important; }
        .leaflet-control-attribution {
          background: rgba(255,255,255,0.7) !important;
          backdrop-filter: blur(4px);
          border-radius: 8px !important;
          font-size: 10px !important;
          padding: 2px 8px !important;
          margin: 0 8px 8px 0 !important;
        }
      `}</style>

      <MapContainer
        center={center}
        zoom={centerInfo.zoom}
        className="w-full h-full z-0"
        zoomControl={true}
      >
        <MapUpdater center={center} zoom={centerInfo.zoom} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          maxZoom={20}
        />

        {places.map((place) => {
          const col = categoryColors[place.category] || { bg: "#14b8a6", ring: "#99f6e4" };
          return (
            <Marker
              key={place.id}
              position={[place.latitude, place.longitude]}
              icon={createCustomIcon(place.category)}
            >
              <Popup>
                <div dir="rtl" className="overflow-hidden rounded-2xl">
                  {place.images && place.images.length > 0 ? (
                    <div className="relative h-28 overflow-hidden">
                      <img
                        src={place.images[0].url}
                        alt={place.nameKurdish}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                      <div
                        className="absolute top-2 right-2 text-white text-xs px-2 py-0.5 rounded-full font-semibold"
                        style={{ background: col.bg }}
                      >
                        {CATEGORY_LABELS[place.category]}
                      </div>
                    </div>
                  ) : (
                    <div className="h-10 flex items-center px-4" style={{ background: col.bg }}>
                      <span className="text-white text-xs font-semibold">{CATEGORY_LABELS[place.category]}</span>
                    </div>
                  )}

                  <div className="p-4 bg-white">
                    <h3 className="font-bold text-gray-900 text-base leading-snug mb-0.5">{place.nameKurdish}</h3>
                    <p className="text-xs text-gray-400 mb-3">{CITY_LABELS[place.city]}</p>
                    <Link href={`/places/${place.id}`}>
                      <button
                        className="w-full text-white text-sm font-semibold py-2 rounded-xl transition hover:opacity-90 active:scale-95"
                        style={{ background: col.bg }}
                      >
                        زانیاری زیاتر ←
                      </button>
                    </Link>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
