import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  useGetPlace,
  useUpdatePlace,
  UpdatePlaceBodyCity,
  UpdatePlaceBodyCategory,
  useAddPlaceImage,
  useDeletePlaceImage
} from "@workspace/api-client-react";
import { CATEGORY_LABELS, CITY_LABELS } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, MapPin, Trash2, Image as ImageIcon, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "wouter";
import { ImageUploader } from "@/components/image-uploader";

const formSchema = z.object({
  name: z.string().min(2, { message: "ناوی ئینگلیزی پێویستە" }),
  nameKurdish: z.string().min(2, { message: "ناوی کوردی پێویستە" }),
  city: z.enum(["kalar", "kifre", "rizgari"] as const, { required_error: "شار هەڵبژێرە" }),
  category: z.enum([
    "mosque", "school", "government", "hospital", "market",
    "university", "institute", "shop", "stadium", "park",
    "cemetery", "hotel", "restaurant", "cafe", "recreation"
  ] as const, { required_error: "جۆر هەڵبژێرە" }),
  description: z.string().optional(),
  phone: z.string().optional(),
  latitude: z.coerce.number().min(-90).max(90, { message: "هێڵی پانی ڕاست نییە" }),
  longitude: z.coerce.number().min(-180).max(180, { message: "هێڵی درێژی ڕاست نییە" }),
});

interface UploadedImage {
  url: string;
  objectPath: string;
}

export default function EditPlace() {
  const [, params] = useRoute("/places/:id/edit");
  const id = params?.id ? parseInt(params.id, 10) : 0;
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: place, isLoading } = useGetPlace(id, {
    query: { enabled: !!id, queryKey: ["/api/places", id] }
  });

  const updatePlace = useUpdatePlace();
  const addImage = useAddPlaceImage();
  const deleteImage = useDeletePlaceImage();

  const [newImages, setNewImages] = useState<UploadedImage[]>([]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      nameKurdish: "",
      description: "",
      phone: "",
      latitude: 34.62,
      longitude: 45.32,
    },
  });

  useEffect(() => {
    if (place) {
      form.reset({
        name: place.name,
        nameKurdish: place.nameKurdish,
        city: place.city,
        category: place.category,
        description: place.description || "",
        phone: place.phone || "",
        latitude: place.latitude,
        longitude: place.longitude,
      });
    }
  }, [place, form]);

  async function handleDeleteExistingImage(imageId: number) {
    try {
      await deleteImage.mutateAsync({ id, imageId });
      toast({ title: "سەرکەوتوو بوو", description: "وێنەکە سڕدرایەوە" });
    } catch (e) {
      toast({ title: "هەڵەیەک ڕوویدا", description: "نەتوانرا وێنەکە بسڕێتەوە", variant: "destructive" });
    }
  }

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      await updatePlace.mutateAsync({
        id,
        data: {
          name: values.name,
          nameKurdish: values.nameKurdish,
          city: values.city as UpdatePlaceBodyCity,
          category: values.category as UpdatePlaceBodyCategory,
          description: values.description,
          phone: values.phone,
          latitude: values.latitude,
          longitude: values.longitude,
        }
      });

      if (newImages.length > 0) {
        for (const img of newImages) {
          await addImage.mutateAsync({ id, data: { url: img.url } });
        }
      }

      toast({ title: "سەرکەوتوو بوو", description: "گۆڕانکارییەکان بە سەرکەوتوویی پاشەکەوت کران" });
      setLocation(`/places/${id}`);
    } catch (error) {
      toast({ title: "هەڵەیەک ڕوویدا", description: "تکایە دووبارە هەوڵبدەرەوە", variant: "destructive" });
    }
  }

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="flex flex-col items-center text-primary animate-pulse">
          <Loader2 size={48} className="mb-4 animate-spin" />
          <h2 className="text-xl font-bold">لە بارکردندایە...</h2>
        </div>
      </div>
    );
  }

  if (!place) return null;

  return (
    <div className="flex-1 overflow-auto bg-muted/20">
      <div className="max-w-4xl mx-auto py-10 px-6">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">دەستکاری کردنی شوێن</h1>
            <p className="text-muted-foreground">نوێکردنەوەی زانیارییەکانی {place.nameKurdish}</p>
          </div>
          <Link href={`/places/${id}`}>
            <Button variant="outline" className="gap-2">
              <ArrowRight size={16} />
              گەڕانەوە
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card className="border-none shadow-md">
              <CardContent className="p-6">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="nameKurdish"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-base font-bold">ناوی شوێن (کوردی)</FormLabel>
                            <FormControl>
                              <Input placeholder="نموونە: نەخۆشخانەی گشتی کەلار" {...field} className="h-12" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-base font-bold">ناوی شوێن (ئینگلیزی)</FormLabel>
                            <FormControl>
                              <Input placeholder="Example: Kalar General Hospital" {...field} className="h-12 text-left" dir="ltr" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="city"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-base font-bold">شار</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger className="h-12">
                                  <SelectValue placeholder="شار هەڵبژێرە" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {Object.entries(CITY_LABELS).map(([val, label]) => (
                                  <SelectItem key={val} value={val}>{label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="category"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-base font-bold">جۆر</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger className="h-12">
                                  <SelectValue placeholder="جۆر هەڵبژێرە" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {Object.entries(CATEGORY_LABELS).map(([val, label]) => (
                                  <SelectItem key={val} value={val}>{label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base font-bold">زانیاری زیاتر</FormLabel>
                          <FormControl>
                            <Textarea placeholder="هەر زانیارییەکی تر کە بەسوود بێت..." className="min-h-[100px] resize-none" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base font-bold">ژمارەی تەلەفۆن</FormLabel>
                          <FormControl>
                            <Input placeholder="0750 000 0000" {...field} className="h-12 text-left" dir="ltr" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="bg-muted/50 p-4 rounded-xl border border-border">
                      <h3 className="font-bold mb-4 flex items-center gap-2 text-primary">
                        <MapPin size={18} />
                        ناونیشان لەسەر نەخشە
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="latitude"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>هێڵی پانی (Latitude)</FormLabel>
                              <FormControl>
                                <Input type="number" step="any" {...field} className="text-left" dir="ltr" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="longitude"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>هێڵی درێژی (Longitude)</FormLabel>
                              <FormControl>
                                <Input type="number" step="any" {...field} className="text-left" dir="ltr" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    <Button
                      type="submit"
                      className="w-full h-14 text-lg font-bold"
                      disabled={updatePlace.isPending || addImage.isPending}
                    >
                      {(updatePlace.isPending || addImage.isPending) ? (
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      ) : null}
                      پاشەکەوتکردنی گۆڕانکارییەکان
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-1">
            <Card className="border-none shadow-md sticky top-6">
              <CardContent className="p-6 space-y-6">
                {/* Existing Images */}
                {place.images && place.images.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="font-bold text-base flex items-center gap-2">
                      <ImageIcon size={18} className="text-primary" />
                      وێنەکانی ئێستا
                    </h3>
                    {place.images.map((img) => (
                      <div key={img.id} className="relative group rounded-lg overflow-hidden border border-border">
                        <div className="aspect-video bg-muted relative">
                          <img src={img.url} alt="" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDeleteExistingImage(img.id)}
                              className="h-8"
                              disabled={deleteImage.isPending}
                            >
                              {deleteImage.isPending ? <Loader2 size={14} className="mr-1 animate-spin" /> : <Trash2 size={14} className="mr-1" />}
                              سڕینەوە
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* New Images Upload */}
                <div className="space-y-3 pt-4 border-t border-border">
                  <h3 className="font-bold text-base flex items-center gap-2">
                    <ImageIcon size={18} className="text-primary" />
                    زیادکردنی وێنەی نوێ
                  </h3>
                  <ImageUploader
                    images={newImages}
                    onImagesChange={setNewImages}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
