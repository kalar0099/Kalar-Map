import { useState, useRef } from "react";
import { useUpload } from "@workspace/object-storage-web";
import { Button } from "@/components/ui/button";
import { Loader2, Upload, Trash2, Image as ImageIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface UploadedImage {
  url: string;
  objectPath: string;
}

interface ImageUploaderProps {
  images: UploadedImage[];
  onImagesChange: (images: UploadedImage[]) => void;
  maxImages?: number;
}

export function ImageUploader({ images, onImagesChange, maxImages = 10 }: ImageUploaderProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploadFile, isUploading, progress } = useUpload();

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    if (images.length + files.length > maxImages) {
      toast({
        title: "زۆر زیاتری",
        description: `زیاتر لە ${maxImages} وێنە دابنێ نییە`,
        variant: "destructive",
      });
      return;
    }

    for (const file of files) {
      if (!file.type.startsWith("image/")) {
        toast({
          title: "فایلی هەڵە",
          description: "تەنها وێنە دابنێ",
          variant: "destructive",
        });
        continue;
      }

      const result = await uploadFile(file);
      if (result) {
        const imageUrl = `/api/storage${result.objectPath}`;
        onImagesChange([...images, { url: imageUrl, objectPath: result.objectPath }]);
      } else {
        toast({
          title: "هەڵەی ئەپڵۆد",
          description: "نەتوانرا وێنەکە ئەپڵۆد بکرێت. دووبارە هەوڵبدەرەوە.",
          variant: "destructive",
        });
      }
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function removeImage(index: number) {
    onImagesChange(images.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-4">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleFileChange}
        data-testid="input-image-file"
      />

      {images.length < maxImages && (
        <Button
          type="button"
          variant="outline"
          className="w-full h-20 border-dashed border-2 flex flex-col gap-1 hover:bg-primary/5"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          data-testid="button-upload-image"
        >
          {isUploading ? (
            <>
              <Loader2 size={24} className="animate-spin text-primary" />
              <span className="text-sm text-muted-foreground">{progress}% ئەپڵۆد دەکرێت...</span>
            </>
          ) : (
            <>
              <Upload size={24} className="text-primary" />
              <span className="text-sm text-muted-foreground">کلیک بکە بۆ هەڵگرتنی وێنە</span>
            </>
          )}
        </Button>
      )}

      {images.length === 0 && !isUploading && (
        <div className="text-center p-6 border-2 border-dashed rounded-xl border-border/50 text-muted-foreground">
          <ImageIcon size={32} className="mx-auto mb-2 opacity-20" />
          <p className="text-sm">هیچ وێنەیەک زیاد نەکراوە</p>
        </div>
      )}

      {images.length > 0 && (
        <div className="space-y-3">
          {images.map((img, i) => (
            <div key={i} className="relative group rounded-lg overflow-hidden border border-border" data-testid={`img-preview-${i}`}>
              <div className="aspect-video bg-muted relative">
                <img src={img.url} alt="" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => removeImage(i)}
                    className="h-8"
                    data-testid={`button-remove-image-${i}`}
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
  );
}
