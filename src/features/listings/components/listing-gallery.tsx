"use client";

import { useState } from "react";
import Image from "next/image";

interface GalleryImage {
  url: string;
  order: number;
}

interface ListingGalleryProps {
  images: GalleryImage[];
  vehicleName: string;
}

export function ListingGallery({ images, vehicleName }: ListingGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  if (images.length === 0) {
    return (
      <div
        className="flex aspect-[4/3] w-full items-center justify-center rounded-xl"
        style={{ backgroundColor: "var(--chayong-surface)" }}
      >
        <span className="text-sm" style={{ color: "var(--chayong-text-caption)" }}>
          이미지 없음
        </span>
      </div>
    );
  }

  const current = images[activeIndex];
  const total = images.length;

  return (
    <div className="flex flex-col gap-2">
      {/* Main image */}
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl" style={{ backgroundColor: "var(--chayong-surface)" }}>
        <Image
          src={current.url}
          alt={`${vehicleName} ${activeIndex + 1}번째 이미지`}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 50vw"
          priority={activeIndex === 0}
        />
        {/* Counter overlay */}
        <div className="absolute bottom-2 right-2 rounded-full px-2.5 py-1 text-xs font-medium text-white" style={{ backgroundColor: "rgba(0,0,0,0.55)" }}>
          {activeIndex + 1}/{total}
        </div>
      </div>

      {/* Thumbnail strip */}
      {total > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {images.map((img, i) => (
            <button
              key={img.url + i}
              type="button"
              onClick={() => setActiveIndex(i)}
              className="relative h-16 w-20 shrink-0 overflow-hidden rounded-lg transition-opacity"
              style={{
                outline: i === activeIndex ? `2px solid var(--chayong-primary)` : "none",
                outlineOffset: "1px",
                opacity: i === activeIndex ? 1 : 0.6,
              }}
              aria-label={`${i + 1}번째 이미지 보기`}
              aria-current={i === activeIndex}
            >
              <Image
                src={img.url}
                alt={`${vehicleName} 썸네일 ${i + 1}`}
                fill
                className="object-cover"
                sizes="80px"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
