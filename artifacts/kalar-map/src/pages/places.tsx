import { useState } from "react";
import { useListPlaces, PlaceCategory, PlaceCity, useGetPlaceStats } from "@workspace/api-client-react";
import { CATEGORY_LABELS, CATEGORY_ICONS, CITY_LABELS } from "@/lib/constants";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Search, MapPin, X, Loader2, Image as ImageIcon } from "lucide-react";
import { Link } from "wouter";

export default function Places() {
  const [search, setSearch] = useState("");
  const [city, setCity] = useState<PlaceCity | undefined>();
  const [category, setCategory] = useState<PlaceCategory | undefined>();
  
  const { data: places, isLoading } = useListPlaces(
    { search: search || undefined, city, category },
    { query: { queryKey: ["/api/places", { search, city, category }] } }
  );

  const { data: stats } = useGetPlaceStats();

  const activePlaces = places || [];

  return (
    <div className="flex-1 overflow-auto bg-muted/20 pb-20">
      {/* Header Banner */}
      <div className="bg-primary text-primary-foreground py-12 px-6 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white to-transparent" />
        <div className="max-w-6xl mx-auto relative z-10 text-center">
          <h1 className="text-4xl font-bold mb-4 font-sans tracking-tight">هەموو شوێنەکان</h1>
          <p className="text-primary-foreground/80 max-w-xl mx-auto text-lg">
            گەڕان بکە بەناو {stats?.totalPlaces || "..."} شوێنی تۆمارکراو لە کەلار، کفری و ریزگاری
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 -mt-8 relative z-20">
        <Card className="shadow-lg border-none bg-background/95 backdrop-blur-sm">
          <CardContent className="p-4 flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
              <Input 
                placeholder="گەڕان بەدوای شوێن..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pr-10 h-12 text-lg bg-background"
              />
              {search && (
                <button 
                  onClick={() => setSearch("")}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X size={20} />
                </button>
              )}
            </div>
            
            <div className="flex gap-2">
              <select 
                className="h-12 px-4 rounded-md border border-input bg-background"
                value={city || ""}
                onChange={(e) => setCity(e.target.value ? e.target.value as PlaceCity : undefined)}
              >
                <option value="">هەموو شارەکان</option>
                {Object.entries(CITY_LABELS).map(([val, label]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>
              
              <select 
                className="h-12 px-4 rounded-md border border-input bg-background"
                value={category || ""}
                onChange={(e) => setCategory(e.target.value ? e.target.value as PlaceCategory : undefined)}
              >
                <option value="">هەموو جۆرەکان</option>
                {Object.entries(CATEGORY_LABELS).map(([val, label]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Results Grid */}
        <div className="mt-12 mb-6 flex justify-between items-end">
          <h2 className="text-2xl font-bold text-foreground">
            {isLoading ? "لە گەڕاندایە..." : `${activePlaces.length} ئەنجام دۆزرایەوە`}
          </h2>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
              <Card key={i} className="overflow-hidden border-border/50">
                <div className="aspect-video bg-muted animate-pulse" />
                <CardContent className="p-4 space-y-3">
                  <div className="h-6 bg-muted animate-pulse rounded w-3/4" />
                  <div className="h-4 bg-muted animate-pulse rounded w-1/2" />
                  <div className="h-4 bg-muted animate-pulse rounded w-1/4 mt-4" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : activePlaces.length === 0 ? (
          <div className="py-20 text-center flex flex-col items-center bg-card rounded-xl border border-border/50 shadow-sm">
            <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-6">
              <Search size={40} className="text-muted-foreground" />
            </div>
            <h3 className="text-xl font-bold mb-2">هیچ شوێنێک نەدۆزرایەوە</h3>
            <p className="text-muted-foreground mb-6 max-w-md">
              بەپێی ئەو فلتەرانەی هەڵتبژاردووە هیچ شوێنێک تۆمار نەکراوە. هەوڵبدە فلتەرەکان کەم بکەیتەوە یان وشەیەکی تر بەکاربهێنە بۆ گەڕان.
            </p>
            <Button onClick={() => { setSearch(""); setCity(undefined); setCategory(undefined); }}>
              پاککردنەوەی گەڕان
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {activePlaces.map(place => {
              const Icon = CATEGORY_ICONS[place.category] || MapPin;
              return (
                <Link key={place.id} href={`/places/${place.id}`}>
                  <Card className="overflow-hidden h-full cursor-pointer hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-border/50 group">
                    <div className="aspect-video relative bg-muted overflow-hidden">
                      {place.images && place.images.length > 0 ? (
                        <img 
                          src={place.images[0].url} 
                          alt={place.nameKurdish} 
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground/30">
                          <ImageIcon size={48} />
                        </div>
                      )}
                      <div className="absolute top-3 right-3 flex gap-2">
                        <Badge className="bg-background/90 text-foreground backdrop-blur-sm border-none shadow-sm">
                          {CITY_LABELS[place.city]}
                        </Badge>
                      </div>
                      <div className="absolute bottom-3 left-3">
                        <Badge className="bg-primary/90 text-primary-foreground backdrop-blur-sm border-none shadow-sm flex items-center gap-1">
                          <Icon size={12} />
                          {CATEGORY_LABELS[place.category]}
                        </Badge>
                      </div>
                    </div>
                    <CardContent className="p-5">
                      <h3 className="font-bold text-xl mb-1 line-clamp-1 group-hover:text-primary transition-colors">{place.nameKurdish}</h3>
                      <p className="text-muted-foreground text-sm mb-4 line-clamp-1" dir="ltr">{place.name}</p>
                      
                      {place.description && (
                        <p className="text-sm text-foreground/80 line-clamp-2 mt-2 leading-relaxed">
                          {place.description}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
