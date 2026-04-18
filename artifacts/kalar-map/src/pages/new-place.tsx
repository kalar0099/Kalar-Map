import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useCreatePlace, CreatePlaceBodyCity, CreatePlaceBodyCategory, useAddPlaceImage } from "@workspace/api-client-react";
import { CATEGORY_LABELS, CITY_LABELS } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormDescription,
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
import { Loader2, MapPin, Plus, Trash2, Image as ImageIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

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

export default function NewPlace() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const createPlace = useCreatePlace();
  const addImage = useAddPlaceImage();
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [currentImageUrl, setCurrentImageUrl] = useState("");

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

  function addImageUrl() {
    if (currentImageUrl && currentImageUrl.trim() !== "") {
      try {
        new URL(currentImageUrl);
        setImageUrls([...imageUrls, currentImageUrl]);
        setCurrentImageUrl("");
      } catch (e) {
        toast({
          title: "لینکی وێنە هەڵەیە",
          description: "تکایە لینکێکی ڕاست بەکاربهێنە",
          variant: "destructive",
        });
      }
    }
  }

  function removeImageUrl(index: number) {
    setImageUrls(imageUrls.filter((_, i) => i !== index));
  }

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      // 1. Create place
      const place = await createPlace.mutateAsync({
        data: {
          name: values.name,
          nameKurdish: values.nameKurdish,
          city: values.city as CreatePlaceBodyCity,
          category: values.category as CreatePlaceBodyCategory,
          description: values.description,
          phone: values.phone,
          latitude: values.latitude,
          longitude: values.longitude,
        }
      });

      // 2. Add images if any
      if (imageUrls.length > 0) {
        for (const url of imageUrls) {
          await addImage.mutateAsync({
            id: place.id,
            data: { url }
          });
        }
      }

      toast({
        title: "سەرکەوتوو بوو",
        description: "شوێنەکە بە سەرکەوتوویی زیادکرا",
      });
      setLocation(`/places/${place.id}`);
    } catch (error) {
      toast({
        title: "هەڵەیەک ڕوویدا",
        description: "تکایە دووبارە هەوڵبدەرەوە",
        variant: "destructive",
      });
    }
  }

  return (
    <div className="flex-1 overflow-auto bg-muted/20">
      <div className="max-w-4xl mx-auto py-10 px-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">زیادکردنی شوێنی نوێ</h1>
          <p className="text-muted-foreground">زانیارییەکان پڕبکەرەوە بۆ تۆمارکردنی شوێنێک لەسەر نەخشە</p>
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
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                            <Textarea 
                              placeholder="هەر زانیارییەکی تر کە بەسوود بێت..." 
                              className="min-h-[100px] resize-none" 
                              {...field} 
                            />
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
                      disabled={createPlace.isPending || addImage.isPending}
                    >
                      {(createPlace.isPending || addImage.isPending) ? (
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      ) : null}
                      پاشەکەوتکردنی شوێن
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-1">
            <Card className="border-none shadow-md sticky top-6">
              <CardContent className="p-6">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                  <ImageIcon size={20} className="text-primary" />
                  وێنەکان
                </h3>
                
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <Input 
                      placeholder="لینک (URL)ـی وێنە..." 
                      value={currentImageUrl}
                      onChange={(e) => setCurrentImageUrl(e.target.value)}
                      className="text-left"
                      dir="ltr"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addImageUrl();
                        }
                      }}
                    />
                    <Button type="button" onClick={addImageUrl} size="icon" className="shrink-0">
                      <Plus size={18} />
                    </Button>
                  </div>
                  
                  {imageUrls.length === 0 ? (
                    <div className="text-center p-6 border-2 border-dashed rounded-xl border-border/50 text-muted-foreground">
                      <ImageIcon size={32} className="mx-auto mb-2 opacity-20" />
                      <p className="text-sm">هیچ وێنەیەک زیاد نەکراوە</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {imageUrls.map((url, i) => (
                        <div key={i} className="relative group rounded-lg overflow-hidden border border-border">
                          <div className="aspect-video bg-muted relative">
                            <img src={url} alt="" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <Button 
                                type="button" 
                                variant="destructive" 
                                size="sm" 
                                onClick={() => removeImageUrl(i)}
                                className="h-8"
                              >
                                <Trash2 size={14} className="mr-1" />
                                سڕینەوە
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
