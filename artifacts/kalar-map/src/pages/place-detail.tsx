import { useState } from "react";
import { useRoute, useLocation, Link } from "wouter";
import { useGetPlace, useDeletePlace } from "@workspace/api-client-react";
import { CATEGORY_LABELS, CATEGORY_ICONS, CITY_LABELS } from "@/lib/constants";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import { MapPin, Phone, Calendar, ArrowRight, Edit, Trash2, Image as ImageIcon, ExternalLink, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";

// Fix leaflet default icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

export default function PlaceDetail() {
  const [, params] = useRoute("/places/:id");
  const id = params?.id ? parseInt(params.id, 10) : 0;
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const { data: place, isLoading, error } = useGetPlace(id, {
    query: { enabled: !!id, queryKey: ["/api/places", id] }
  });

  const deletePlace = useDeletePlace();

  const handleDelete = async () => {
    try {
      await deletePlace.mutateAsync({ id });
      toast({
        title: "سەرکەوتوو بوو",
        description: "شوێنەکە سڕدرایەوە",
      });
      setLocation("/places");
    } catch (e) {
      toast({
        title: "هەڵەیەک ڕوویدا",
        description: "نەتوانرا شوێنەکە بسڕێتەوە",
        variant: "destructive"
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="flex flex-col items-center text-primary animate-pulse">
          <MapPin size={48} className="mb-4" />
          <h2 className="text-xl font-bold">لە بارکردندایە...</h2>
        </div>
      </div>
    );
  }

  if (error || !place) {
    return (
      <div className="flex-1 flex items-center justify-center bg-muted/20">
        <div className="text-center p-8 bg-card rounded-xl shadow-sm border border-border max-w-md w-full">
          <MapPin size={48} className="mx-auto mb-4 text-muted-foreground opacity-50" />
          <h2 className="text-2xl font-bold mb-2">شوێنەکە نەدۆزرایەوە</h2>
          <p className="text-muted-foreground mb-6">لەوانەیە سڕدرابێتەوە یان لینکی هەڵەبێت.</p>
          <Link href="/places">
            <Button>گەڕانەوە بۆ لیستی شوێنەکان</Button>
          </Link>
        </div>
      </div>
    );
  }

  const Icon = CATEGORY_ICONS[place.category] || MapPin;
  const mapCenter: [number, number] = [place.latitude, place.longitude];

  return (
    <div className="flex-1 overflow-auto bg-background flex flex-col">
      {/* Top Nav bar for detail */}
      <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50 p-4 flex justify-between items-center">
        <Link href="/places">
          <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground">
            <ArrowRight size={16} />
            گەڕانەوە
          </Button>
        </Link>
        
        <div className="flex items-center gap-2">
          <Link href={`/places/${id}/edit`}>
            <Button variant="outline" size="sm" className="gap-2">
              <Edit size={16} />
              دەستکاری
            </Button>
          </Link>
          
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm" className="gap-2">
                <Trash2 size={16} />
                سڕینەوە
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>دڵنیایت لە سڕینەوەی ئەم شوێنە؟</AlertDialogTitle>
                <AlertDialogDescription>
                  ئەم کردارە پاشگەزبوونەوەی تێدا نییە و شوێنەکە بەتەواوی لەسەر نەخشە دەسڕێتەوە.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="flex-row-reverse sm:space-x-reverse sm:space-x-2">
                <AlertDialogCancel>پاشگەزبوونەوە</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={handleDelete} 
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  disabled={deletePlace.isPending}
                >
                  {deletePlace.isPending ? <Loader2 size={16} className="animate-spin ml-2" /> : null}
                  سڕینەوە
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row">
        {/* Left Column: Details */}
        <div className="flex-1 p-6 lg:p-10 lg:max-w-2xl overflow-auto border-l border-border/50">
          <div className="space-y-8">
            <div>
              <div className="flex flex-wrap gap-2 mb-4">
                <Badge className="bg-primary/10 text-primary hover:bg-primary/20 border-none px-3 py-1 text-sm gap-1">
                  <Icon size={14} />
                  {CATEGORY_LABELS[place.category]}
                </Badge>
                <Badge variant="outline" className="px-3 py-1 text-sm border-border">
                  {CITY_LABELS[place.city]}
                </Badge>
              </div>
              
              <h1 className="text-4xl font-bold mb-2 tracking-tight text-foreground">{place.nameKurdish}</h1>
              <h2 className="text-xl text-muted-foreground font-medium" dir="ltr">{place.name}</h2>
            </div>

            <div className="flex flex-col gap-4 py-6 border-y border-border/50">
              {place.phone && (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-accent/10 text-accent flex items-center justify-center shrink-0">
                    <Phone size={18} />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">ژمارەی تەلەفۆن</p>
                    <p className="font-bold font-mono" dir="ltr">{place.phone}</p>
                  </div>
                </div>
              )}
              
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-secondary/10 text-secondary-foreground flex items-center justify-center shrink-0">
                  <Calendar size={18} />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">بەرواری تۆمارکردن</p>
                  <p className="font-bold" dir="ltr">
                    {format(new Date(place.createdAt), "yyyy/MM/dd")}
                  </p>
                </div>
              </div>
            </div>

            {place.description && (
              <div>
                <h3 className="text-lg font-bold mb-3 flex items-center gap-2 text-foreground">
                  <MapPin size={18} className="text-primary" />
                  زانیاری زیاتر
                </h3>
                <div className="p-6 bg-muted/30 rounded-2xl border border-border/50 leading-loose text-foreground/90 text-lg">
                  {place.description}
                </div>
              </div>
            )}

            {/* Images Gallery */}
            <div>
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-foreground">
                <ImageIcon size={18} className="text-primary" />
                وێنەکان
              </h3>
              
              {place.images && place.images.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {place.images.map((img, i) => (
                    <div key={img.id} className={`rounded-xl overflow-hidden bg-muted border border-border/50 ${i === 0 && place.images.length % 2 !== 0 ? 'sm:col-span-2 aspect-video' : 'aspect-square'}`}>
                      <img 
                        src={img.url} 
                        alt={img.caption || `${place.nameKurdish} - وێنەی ${i + 1}`}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-10 text-center border-2 border-dashed border-border/50 rounded-2xl text-muted-foreground">
                  <ImageIcon size={32} className="mx-auto mb-3 opacity-30" />
                  <p>هیچ وێنەیەک بۆ ئەم شوێنە بەردەست نییە</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Minimap */}
        <div className="h-[400px] lg:h-auto lg:flex-1 relative z-0">
          <MapContainer 
            center={mapCenter} 
            zoom={16} 
            className="w-full h-full z-0"
            zoomControl={true}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            />
            <Marker position={mapCenter}>
              <Popup className="custom-popup">
                <div className="font-bold text-center" dir="rtl">{place.nameKurdish}</div>
              </Popup>
            </Marker>
          </MapContainer>
          
          <div className="absolute bottom-6 right-6 z-[1000]">
            <a 
              href={`https://www.google.com/maps/dir/?api=1&destination=${place.latitude},${place.longitude}`}
              target="_blank"
              rel="noreferrer"
            >
              <Button size="lg" className="shadow-xl rounded-full px-6 gap-2">
                <ExternalLink size={18} />
                کرانەوە لە Google Maps
              </Button>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
