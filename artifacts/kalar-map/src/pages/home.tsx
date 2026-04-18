import { useState } from "react";
import { InteractiveMap } from "@/components/map";
import { useListPlaces, PlaceCategory, PlaceCity } from "@workspace/api-client-react";
import { CATEGORY_LABELS, CATEGORY_ICONS, CITY_LABELS } from "@/lib/constants";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, MapPin, X, Loader2, Navigation, Navigation2 } from "lucide-react";
import { Link } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";

export default function Home() {
  const [search, setSearch] = useState("");
  const [city, setCity] = useState<PlaceCity | undefined>();
  const [category, setCategory] = useState<PlaceCategory | undefined>();
  
  const { data: places, isLoading } = useListPlaces(
    { search: search || undefined, city, category },
    { query: { queryKey: ["/api/places", { search, city, category }] } }
  );

  const activePlaces = places || [];

  return (
    <div className="flex h-full w-full relative">
      {/* Search & Filter Sidebar Overlay */}
      <div className="absolute top-4 right-4 z-10 w-80 max-h-[calc(100vh-2rem)] flex flex-col gap-4 pointer-events-none">
        
        {/* Search Box */}
        <div className="bg-background/95 backdrop-blur-md p-4 rounded-xl shadow-lg border border-border/50 pointer-events-auto">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
            <Input 
              placeholder="گەڕان بۆ شوێن..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pr-10 bg-background/50 border-primary/20 focus-visible:ring-primary"
            />
            {search && (
              <button 
                onClick={() => setSearch("")}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X size={16} />
              </button>
            )}
          </div>
          
          <div className="mt-4 flex gap-2 overflow-x-auto pb-2 scrollbar-none">
            <Button 
              variant={!city ? "default" : "outline"} 
              size="sm" 
              onClick={() => setCity(undefined)}
              className="shrink-0"
            >
              هەمووی
            </Button>
            {Object.entries(CITY_LABELS).map(([val, label]) => (
              <Button 
                key={val}
                variant={city === val ? "default" : "outline"} 
                size="sm" 
                onClick={() => setCity(val as PlaceCity)}
                className="shrink-0"
              >
                {label}
              </Button>
            ))}
          </div>
        </div>

        {/* Results Box */}
        <div className="bg-background/95 backdrop-blur-md rounded-xl shadow-lg border border-border/50 flex-1 flex flex-col overflow-hidden pointer-events-auto">
          <div className="p-3 border-b border-border/50 flex justify-between items-center bg-primary/5">
            <h2 className="font-semibold text-primary">ئەنجامەکان</h2>
            <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20">
              {isLoading ? <Loader2 size={12} className="animate-spin" /> : activePlaces.length}
            </Badge>
          </div>
          
          <ScrollArea className="flex-1 h-[300px]">
            {isLoading ? (
              <div className="p-4 space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex gap-3">
                    <Skeleton className="w-12 h-12 rounded-lg" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : activePlaces.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground flex flex-col items-center justify-center h-full">
                <MapPin size={32} className="mb-2 opacity-50" />
                <p>هیچ شوێنێک نەدۆزرایەوە</p>
                <Button 
                  variant="link" 
                  onClick={() => { setSearch(""); setCity(undefined); setCategory(undefined); }}
                  className="mt-2 text-primary"
                >
                  پاککردنەوەی فلتەرەکان
                </Button>
              </div>
            ) : (
              <div className="p-2 space-y-1">
                {activePlaces.map(place => {
                  const Icon = CATEGORY_ICONS[place.category] || MapPin;
                  return (
                    <Link key={place.id} href={`/places/${place.id}`}>
                      <div className="p-2 rounded-lg hover:bg-accent/10 transition-colors flex gap-3 cursor-pointer items-start group">
                        <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                          <Icon size={18} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-sm truncate">{place.nameKurdish}</h4>
                          <p className="text-xs text-muted-foreground truncate">{CATEGORY_LABELS[place.category]} • {CITY_LABELS[place.city]}</p>
                        </div>
                        {place.images && place.images.length > 0 && (
                          <img 
                            src={place.images[0].url} 
                            alt="" 
                            className="w-10 h-10 rounded object-cover shrink-0" 
                          />
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </div>
      </div>

      {/* Category Filters Bottom */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 w-11/12 max-w-4xl pointer-events-none">
        <div className="bg-background/95 backdrop-blur-md p-3 rounded-2xl shadow-xl border border-border/50 pointer-events-auto flex gap-2 overflow-x-auto scrollbar-none items-center justify-center mx-auto">
          <Button
            variant={!category ? "default" : "ghost"}
            className={!category ? "bg-secondary text-secondary-foreground hover:bg-secondary/90 rounded-xl" : "rounded-xl"}
            onClick={() => setCategory(undefined)}
          >
            هەموو جۆرەکان
          </Button>
          {Object.entries(CATEGORY_LABELS).map(([val, label]) => {
            const Icon = CATEGORY_ICONS[val as PlaceCategory];
            const isSelected = category === val;
            return (
              <Button
                key={val}
                variant={isSelected ? "default" : "ghost"}
                className={isSelected ? "bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl shrink-0" : "rounded-xl shrink-0 text-muted-foreground hover:text-foreground hover:bg-primary/10"}
                onClick={() => setCategory(val as PlaceCategory)}
              >
                {Icon && <Icon size={16} className="ml-2" />}
                {label}
              </Button>
            );
          })}
        </div>
      </div>

      {/* Geolocate Button */}
      <div className="absolute bottom-24 right-4 z-10 pointer-events-auto">
         <Button 
            size="icon" 
            className="w-12 h-12 rounded-full shadow-xl bg-background text-foreground hover:bg-accent hover:text-accent-foreground border border-border/50"
            onClick={() => {
              if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                  (pos) => {
                    // You would typically fly map to this location here
                    console.log("Got location", pos);
                  },
                  (err) => console.error(err)
                );
              }
            }}
          >
            <Navigation2 size={24} />
          </Button>
      </div>

      {/* Map Background */}
      <div className="absolute inset-0">
        <InteractiveMap places={activePlaces} centerCity={city || "kalar"} />
      </div>
    </div>
  );
}
