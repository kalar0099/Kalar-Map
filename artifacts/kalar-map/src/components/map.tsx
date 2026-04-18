import { useState, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { Place, PlaceCategory } from "@workspace/api-client-react";
import { CITY_COORDS, CATEGORY_ICONS, CATEGORY_LABELS, CITY_LABELS } from "@/lib/constants";
import { Link } from "wouter";
import { Button } from "./ui/button";
import { MapPin } from "lucide-react";

// Fix leaflet default icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const categoryColors: Record<PlaceCategory, string> = {
  mosque: "#16a34a",
  school: "#2563eb",
  government: "#475569",
  hospital: "#dc2626",
  market: "#ea580c",
  university: "#7c3aed",
  institute: "#9333ea",
  shop: "#d97706",
  stadium: "#059669",
  park: "#65a30d",
  cemetery: "#57534e",
  hotel: "#0284c7",
  restaurant: "#b91c1c",
  cafe: "#9a3412",
  recreation: "#0d9488"
};

const createCustomIcon = (category: PlaceCategory) => {
  const color = categoryColors[category] || "#14b8a6";
  
  return L.divIcon({
    className: "custom-marker-icon",
    html: `
      <div style="
        background-color: ${color};
        width: 32px;
        height: 32px;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        display: flex;
        align-items: center;
        justify-center: center;
        border: 2px solid white;
        box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
      ">
        <div style="transform: rotate(45deg); width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; color: white;">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="3"></circle>
          </svg>
        </div>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });
};

function MapUpdater({ center, zoom }: { center: [number, number], zoom: number }) {
  const map = useMap();
  map.setView(center, zoom);
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
      <MapContainer 
        center={center} 
        zoom={centerInfo.zoom} 
        className="w-full h-full z-0"
        zoomControl={false}
      >
        <MapUpdater center={center} zoom={centerInfo.zoom} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />
        
        {places.map((place) => (
          <Marker 
            key={place.id} 
            position={[place.latitude, place.longitude]}
            icon={createCustomIcon(place.category)}
          >
            <Popup className="custom-popup">
              <div className="text-right p-1 min-w-[200px]" dir="rtl">
                {place.images && place.images.length > 0 && (
                  <div className="w-full h-32 mb-3 rounded overflow-hidden">
                    <img 
                      src={place.images[0].url} 
                      alt={place.nameKurdish} 
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-bold text-lg leading-tight m-0">{place.nameKurdish}</h3>
                  <span className="bg-primary/10 text-primary text-xs px-2 py-1 rounded-full whitespace-nowrap">
                    {CATEGORY_LABELS[place.category]}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mb-3 font-medium">{place.name}</p>
                <div className="flex items-center gap-1 text-xs text-muted-foreground mb-4">
                  <MapPin size={14} />
                  <span>{CITY_LABELS[place.city]}</span>
                </div>
                <Link href={`/places/${place.id}`}>
                  <Button size="sm" className="w-full">بینینی وردەکاری</Button>
                </Link>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
