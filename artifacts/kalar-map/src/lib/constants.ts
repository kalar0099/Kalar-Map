import { 
  Building2, School, GraduationCap, Building,
  Stethoscope, ShoppingCart, ShoppingBag,
  Dumbbell, TreePine, Cross, Hotel,
  UtensilsCrossed, Coffee, MapPin, BookOpen
} from "lucide-react";
import { PlaceCategory, PlaceCity } from "@workspace/api-client-react";

export const CITY_LABELS: Record<PlaceCity, string> = {
  kalar: "کەلار",
  kifre: "کفری",
  rizgari: "ریزگاری"
};

export const CATEGORY_LABELS: Record<PlaceCategory, string> = {
  mosque: "مزگەوت",
  school: "قوتابخانە",
  government: "فەرمانگە",
  hospital: "نەخۆشخانە",
  market: "مارکێت",
  university: "زانکۆ",
  institute: "پەیمانگا",
  shop: "دوکان",
  stadium: "یاریگا",
  park: "پارک/باخچە",
  cemetery: "گۆرستان",
  hotel: "هۆتێل",
  restaurant: "چێشتخانە/ڕێستۆرانت",
  cafe: "کافێ",
  recreation: "سەیرانگا"
};

export const CATEGORY_ICONS: Record<PlaceCategory, any> = {
  mosque: Building, // Or a better icon if available
  school: School,
  government: Building2,
  hospital: Stethoscope,
  market: ShoppingCart,
  university: GraduationCap,
  institute: BookOpen,
  shop: ShoppingBag,
  stadium: Dumbbell,
  park: TreePine,
  cemetery: Cross,
  hotel: Hotel,
  restaurant: UtensilsCrossed,
  cafe: Coffee,
  recreation: MapPin
};

export const CITY_COORDS: Record<PlaceCity, {lat: number, lng: number, zoom: number}> = {
  kalar: { lat: 34.62, lng: 45.32, zoom: 13 },
  kifre: { lat: 34.69, lng: 44.96, zoom: 13 },
  rizgari: { lat: 34.64, lng: 45.29, zoom: 13 }
};
