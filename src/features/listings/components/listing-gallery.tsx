"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { createPortal } from "react-dom";

interface GalleryImage {
  id?: string;
  url: string;
  alt?: string;
  order: number;
}

interface ListingGalleryProps {
  images: GalleryImage[];
  /** @deprecated use images[i].alt instead — kept for backward compat */
  vehicleName?: string;
}

// ─── Lightbox ────────────────────────────────────────────────────────────────

interface LightboxProps {
  images: GalleryImage[];
  index: number;
  onClose: () => void;
  onNavigate: (next: number) => void;
}

function Lightbox({ images, index, onClose, onNavigate }: LightboxProps) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const total = images.length;
  const current = images[index];

  const prev = useCallback(() => {
    onNavigate((index - 1 + total) % total);
  }, [index, total, onNavigate]);

  const next = useCallback(() => {
    onNavigate((index + 1) % total);
  }, [index, total, onNavigate]);

  // Keyboard navigation + focus trap
  useEffect(() => {
    closeRef.current?.focus();

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose, next, prev]);

  const altText = current.alt ?? `이미지 ${index + 1}`;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="이미지 확대 보기"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Close */}
      <button
        ref={closeRef}
        type="button"
        onClick={onClose}
        aria-label="닫기"
        className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white transition hover:bg-white/20"
      >
        <X size={20} />
      </button>

      {/* Counter */}
      <div className="absolute left-1/2 top-4 -translate-x-1/2 rounded-full bg-black/50 px-3 py-1 text-sm text-white tabular-nums">
        {index + 1} / {total}
      </div>

      {/* Prev */}
      {total > 1 && (
        <button
          type="button"
          onClick={prev}
          aria-label="이전 이미지"
          className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white transition hover:bg-white/20"
        >
          <ChevronLeft size={24} />
        </button>
      )}

      {/* Main image */}
      <div className="relative mx-16 max-h-[85vh] max-w-[90vw] overflow-hidden rounded-xl">
        <Image
          src={current.url}
          alt={altText}
          width={1200}
          height={800}
          className="max-h-[85vh] w-auto object-contain"
          priority
        />
      </div>

      {/* Next */}
      {total > 1 && (
        <button
          type="button"
          onClick={next}
          aria-label="다음 이미지"
          className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white transition hover:bg-white/20"
        >
          <ChevronRight size={24} />
        </button>
      )}

      {/* Thumbnail strip */}
      {total > 1 && (
        <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-1.5 overflow-x-auto px-4">
          {images.map((img, i) => (
            <button
              key={img.id ?? img.url + i}
              type="button"
              onClick={() => onNavigate(i)}
              aria-label={`썸네일 ${i + 1}`}
              aria-current={i === index}
              className="relative h-12 w-16 shrink-0 overflow-hidden rounded-lg transition-opacity"
              style={{ opacity: i === index ? 1 : 0.5, outline: i === index ? "2px solid white" : "none", outlineOffset: "2px" }}
            >
              <Image
                src={img.url}
                alt={img.alt ?? `썸네일 ${i + 1}`}
                fill
                className="object-cover"
                sizes="64px"
              />
            </button>
          ))}
        </div>
      )}
    </div>,
    document.body,
  );
}

// ─── Gallery ─────────────────────────────────────────────────────────────────

export function ListingGallery({ images, vehicleName }: ListingGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const openLightbox = useCallback(() => setLightboxOpen(true), []);
  const closeLightbox = useCallback(() => setLightboxOpen(false), []);

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
  const altText = current.alt ?? (vehicleName ? `${vehicleName} ${activeIndex + 1}번째 이미지` : `이미지 ${activeIndex + 1}`);
  const compactLabel = `${activeIndex + 1}/${total}`;

  return (
    <>
      <div className="flex flex-col gap-2">
        {/* Main image — clickable to open lightbox */}
        <button
          type="button"
          onClick={openLightbox}
          aria-label="이미지 확대 보기"
          className="relative aspect-[4/3] w-full cursor-zoom-in overflow-hidden rounded-xl"
          style={{ backgroundColor: "var(--chayong-surface)" }}
        >
          <Image
            src={current.url}
            alt={altText}
            fill
            className="object-cover transition-transform duration-200 hover:scale-[1.02]"
            sizes="(max-width: 768px) 100vw, 50vw"
            priority={activeIndex === 0}
          />
          <div className="pointer-events-none absolute inset-x-3 top-3 flex items-start justify-between gap-2">
            <div className="flex flex-wrap gap-2">
              <div
                className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold text-white shadow-sm backdrop-blur"
                style={{ backgroundColor: "rgba(0,0,0,0.56)" }}
              >
                사진 {compactLabel}
              </div>
              <div
                className="inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold shadow-sm backdrop-blur"
                style={{
                  backgroundColor: "rgba(0, 0, 0, 0.42)",
                  borderColor: "var(--chayong-primary)",
                  color: "var(--chayong-primary)",
                }}
              >
                실매물 사진
              </div>
            </div>
            <div
              className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold text-white shadow-sm backdrop-blur"
              style={{ backgroundColor: "rgba(0,0,0,0.56)" }}
            >
              확대 보기
            </div>
          </div>
          <div className="pointer-events-none absolute inset-x-3 bottom-3 flex items-end justify-between gap-2">
            <div
              className="inline-flex max-w-[70%] items-center rounded-full border px-3 py-1 text-[11px] font-medium leading-none text-white shadow-sm backdrop-blur"
              style={{
                backgroundColor: "rgba(0,0,0,0.45)",
                borderColor: "rgba(255, 255, 255, 0.16)",
              }}
            >
              검수 이미지와 상세 컷을 눌러 확인
            </div>
            <div
              className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium text-white tabular-nums shadow-sm backdrop-blur"
              style={{ backgroundColor: "rgba(0,0,0,0.58)" }}
            >
              {compactLabel}
            </div>
          </div>
        </button>

        {/* Thumbnail strip */}
        {total > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1" role="group" aria-label="이미지 목록">
            {images.map((img, i) => (
              <button
                key={img.id ?? img.url + i}
                type="button"
                onClick={() => setActiveIndex(i)}
                className="relative h-16 w-24 shrink-0 overflow-hidden rounded-lg transition-transform transition-opacity hover:-translate-y-0.5"
                aria-label={`thumbnail ${i + 1}`}
                aria-current={i === activeIndex}
                style={{
                  outline: i === activeIndex ? `2px solid var(--chayong-primary)` : "1px solid rgba(255,255,255,0.08)",
                  outlineOffset: "1px",
                  opacity: i === activeIndex ? 1 : 0.68,
                }}
              >
                <Image
                  src={img.url}
                  alt={img.alt ?? `썸네일 ${i + 1}`}
                  fill
                  className="object-cover"
                  sizes="80px"
                />
                <div
                  className="absolute left-1 top-1 rounded-full px-1.5 py-0.5 text-[10px] font-semibold leading-none text-white shadow-sm"
                  style={{
                    backgroundColor: i === activeIndex ? "var(--chayong-primary)" : "rgba(0,0,0,0.62)",
                  }}
                  aria-hidden="true"
                >
                  {i + 1}
                </div>
                <div
                  className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-black/45 to-transparent"
                  aria-hidden="true"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {lightboxOpen && (
        <Lightbox
          images={images}
          index={activeIndex}
          onClose={closeLightbox}
          onNavigate={setActiveIndex}
        />
      )}
    </>
  );
}
