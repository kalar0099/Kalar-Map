import { useState, useCallback } from "react";
import { InteractiveMap } from "@/components/map";
import { useListPlaces, PlaceCategory, PlaceCity } from "@workspace/api-client-react";
import { CATEGORY_LABELS, CATEGORY_ICONS, CITY_LABELS } from "@/lib/constants";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, MapPin, X, Loader2, Navigation2, ChevronDown, ChevronUp } from "lucide-react";
import { Link } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const CITY_COLORS: Record<string, string> = {
  kalar:   "bg-emerald-500 text-white",
  kifre:   "bg-sky-500 text-white",
  rizgari: "bg-violet-500 text-white",
};

export default function Home() {
  const [search, setSearch] = useState("");
  const [city, setCity] = useState<PlaceCity | undefined>();
  const [category, setCategory] = useState<PlaceCategory | undefined>();
  const [panelOpen, setPanelOpen] = useState(true);

  const { data: places, isLoading } = useListPlaces(
    { search: search || undefined, city, category },
    { query: { queryKey: ["/api/places", { search, city, category }] } }
  );

  const activePlaces = places || [];

  const handleGeolocate = useCallback(() => {
    navigator.geolocation?.getCurrentPosition(
      () => {},
      (err) => console.error(err)
    );
  }, []);

  return (
    <div className="flex h-full w-full relative overflow-hidden">
      {/* ── Full-screen Map ── */}
      <div className="absolute inset-0">
        <InteractiveMap places={activePlaces} centerCity={city || "kalar"} />
      </div>

      {/* ── Floating Search + Results Panel (top-right) ── */}
      <div className="absolute top-4 right-4 z-[400] w-[320px] flex flex-col gap-3 pointer-events-none">

        {/* Search card */}
        <div className="pointer-events-auto rounded-2xl overflow-hidden shadow-2xl border border-white/50" style={{ background: "rgba(255,255,255,0.92)", backdropFilter: "blur(16px)" }}>
          {/* Header */}
          <div className="flex items-center gap-2 px-4 pt-4 pb-2">
            <div className="flex-1 relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
              <input
                type="text"
                placeholder="گەڕان بۆ شوێن..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-slate-100 rounded-xl pr-9 pl-8 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30 text-slate-800 placeholder:text-slate-400 transition"
              />
              {search && (
                <button onClick={() => setSearch("")} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  <X size={14} />
                </button>
              )}
            </div>

            <button
              onClick={() => setPanelOpen(o => !o)}
              className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition shrink-0"
              title={panelOpen ? "داخستن" : "کردنەوە"}
            >
              {panelOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
          </div>

          {/* City pills */}
          <div className="flex gap-1.5 px-4 pb-3 overflow-x-auto scrollbar-none">
            <button
              onClick={() => setCity(undefined)}
              className={cn(
                "shrink-0 text-xs font-semibold px-3 py-1.5 rounded-full transition",
                !city ? "bg-slate-800 text-white shadow" : "bg-slate-100 text-slate-500 hover:bg-slate-200"
              )}
            >
              هەمووی
            </button>
            {Object.entries(CITY_LABELS).map(([val, label]) => (
              <button
                key={val}
                onClick={() => setCity(city === val ? undefined : val as PlaceCity)}
                className={cn(
                  "shrink-0 text-xs font-semibold px-3 py-1.5 rounded-full transition",
                  city === val
                    ? (CITY_COLORS[val] || "bg-primary text-white") + " shadow"
                    : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Results card */}
        {panelOpen && (
          <div className="pointer-events-auto rounded-2xl overflow-hidden shadow-2xl border border-white/50 flex flex-col" style={{ maxHeight: "calc(100vh - 220px)", background: "rgba(255,255,255,0.92)", backdropFilter: "blur(16px)" }}>
            {/* count bar */}
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-100">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">ئەنجامەکان</span>
              <span className="text-xs font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                {isLoading ? <Loader2 size={11} className="animate-spin inline" /> : activePlaces.length}
              </span>
            </div>

            <ScrollArea className="flex-1">
              {isLoading ? (
                <div className="p-3 space-y-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="flex gap-3 items-center">
                      <Skeleton className="w-11 h-11 rounded-xl shrink-0" />
                      <div className="flex-1 space-y-1.5">
                        <Skeleton className="h-3.5 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : activePlaces.length === 0 ? (
                <div className="py-10 text-center text-slate-400 flex flex-col items-center">
                  <MapPin size={28} className="mb-2 opacity-40" />
                  <p className="text-sm">هیچ شوێنێک نەدۆزرایەوە</p>
                  <button
                    onClick={() => { setSearch(""); setCity(undefined); setCategory(undefined); }}
                    className="mt-3 text-xs text-primary hover:underline"
                  >
                    پاکردنەوەی فلتەرەکان
                  </button>
                </div>
              ) : (
                <div className="p-2 space-y-0.5">
                  {activePlaces.map(place => {
                    const Icon = CATEGORY_ICONS[place.category] || MapPin;
                    return (
                      <Link key={place.id} href={`/places/${place.id}`}>
                        <div className="flex gap-3 items-center p-2.5 rounded-xl hover:bg-slate-50 transition cursor-pointer group">
                          {place.images && place.images.length > 0 ? (
                            <img
                              src={place.images[0].url}
                              alt=""
                              className="w-11 h-11 rounded-xl object-cover shrink-0 border border-slate-100 group-hover:scale-105 transition"
                            />
                          ) : (
                            <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:text-white transition">
                              <Icon size={20} />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-sm text-slate-800 truncate leading-snug">{place.nameKurdish}</p>
                            <p className="text-xs text-slate-400 truncate mt-0.5">
                              {CATEGORY_LABELS[place.category]}
                              <span className="mx-1 text-slate-200">•</span>
                              {CITY_LABELS[place.city]}
                            </p>
                          </div>
                          <span className="text-slate-300 group-hover:text-primary transition text-sm">←</span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </div>
        )}
      </div>

      {/* ── Category Filter Bar (bottom) ── */}
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-[400] pointer-events-none">
        <div
          className="pointer-events-auto flex gap-1.5 px-3 py-2.5 rounded-2xl overflow-x-auto scrollbar-none shadow-2xl border border-white/50 max-w-[calc(100vw-340px)]"
          style={{ background: "rgba(255,255,255,0.92)", backdropFilter: "blur(16px)" }}
        >
          <button
            onClick={() => setCategory(undefined)}
            className={cn(
              "shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition",
              !category ? "bg-slate-800 text-white shadow" : "text-slate-500 hover:bg-slate-100"
            )}
          >
            هەموو
          </button>
          <div className="w-px bg-slate-200 self-stretch" />
          {Object.entries(CATEGORY_LABELS).map(([val, label]) => {
            const Icon = CATEGORY_ICONS[val as PlaceCategory];
            const active = category === val;
            return (
              <button
                key={val}
                onClick={() => setCategory(active ? undefined : val as PlaceCategory)}
                className={cn(
                  "shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition whitespace-nowrap",
                  active ? "bg-primary text-white shadow" : "text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                )}
              >
                {Icon && <Icon size={14} />}
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Geolocate Button ── */}
      <button
        onClick={handleGeolocate}
        className="absolute bottom-24 right-4 z-[400] w-11 h-11 rounded-2xl shadow-xl border border-white/60 bg-white/90 backdrop-blur-md flex items-center justify-center text-slate-600 hover:bg-white hover:text-primary hover:shadow-2xl transition"
        title="شوێنی خۆت"
      >
        <Navigation2 size={20} />
      </button>
    </div>
  );
}
