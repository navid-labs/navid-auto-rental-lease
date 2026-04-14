"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { ImagePlus, X, Loader2 } from "lucide-react";

interface ImageUploadProps {
  images: string[];
  onImagesChange: (images: string[]) => void;
  maxImages?: number;
  bucket?: string;
  folder?: string;
}

export function ImageUpload({
  images,
  onImagesChange,
  maxImages = 15,
  bucket = "listing-images",
  folder = "general",
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const remaining = maxImages - images.length;
    const toUpload = files.slice(0, remaining);

    setUploading(true);
    try {
      const uploaded: string[] = [];
      for (const file of toUpload) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("bucket", bucket);
        formData.append("folder", folder);

        const res = await fetch("/api/upload", { method: "POST", body: formData });
        const data = await res.json();
        if (res.ok && data.url) {
          uploaded.push(data.url as string);
        }
      }
      onImagesChange([...images, ...uploaded]);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function handleRemove(index: number) {
    onImagesChange(images.filter((_, i) => i !== index));
  }

  return (
    <div>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {images.map((url, i) => (
          <div
            key={url}
            className="relative aspect-square overflow-hidden rounded-lg border"
            style={{ borderColor: "var(--chayong-divider)" }}
          >
            <Image
              src={url}
              alt={`업로드 ${i + 1}`}
              fill
              className="object-cover"
              sizes="120px"
            />
            <button
              type="button"
              onClick={() => handleRemove(i)}
              className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white"
            >
              <X size={12} />
            </button>
          </div>
        ))}

        {images.length < maxImages && (
          <label
            className="flex aspect-square cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed transition-colors"
            style={{
              borderColor: "var(--chayong-border)",
              color: "var(--chayong-text-caption)",
            }}
          >
            {uploading ? (
              <Loader2 size={24} className="animate-spin" />
            ) : (
              <>
                <ImagePlus size={24} />
                <span className="mt-1 text-xs">
                  {images.length}/{maxImages}
                </span>
              </>
            )}
            <input
              ref={inputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              className="hidden"
              onChange={handleFileChange}
              disabled={uploading}
            />
          </label>
        )}
      </div>
    </div>
  );
}
