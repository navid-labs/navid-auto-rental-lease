'use client'

import { useState, useEffect, useCallback } from 'react'
import useEmblaCarousel from 'embla-carousel-react'
import Lightbox from "yet-another-react-lightbox"
import Thumbnails from "yet-another-react-lightbox/plugins/thumbnails"
import Zoom from "yet-another-react-lightbox/plugins/zoom"
import Counter from "yet-another-react-lightbox/plugins/counter"
import "yet-another-react-lightbox/styles.css"
import "yet-another-react-lightbox/plugins/thumbnails.css"
import "yet-another-react-lightbox/plugins/counter.css"
import { ImageOff } from 'lucide-react'
import type { VehicleImage, ImageCategory } from '@prisma/client'

import { cn } from '@/lib/utils'

type SectionGalleryProps = {
  images: (VehicleImage & { category: ImageCategory })[]
}

const CATEGORY_TABS = [
  { value: 'all', label: '전체' },
  { value: 'EXTERIOR', label: '외관' },
  { value: 'INTERIOR', label: '내부' },
  { value: 'ENGINE', label: '엔진룸' },
] as const

type CategoryValue = typeof CATEGORY_TABS[number]['value']

export function SectionGallery({ images }: SectionGalleryProps) {
  const [activeCategory, setActiveCategory] = useState<CategoryValue>('all')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [lightboxOpen, setLightboxOpen] = useState(false)

  const filteredImages = activeCategory === 'all'
    ? images
    : images.filter((img) => img.category === activeCategory)

  // Main carousel -- remount on category change via key
  const [mainRef, mainApi] = useEmblaCarousel({ loop: false })

  // Thumbnail carousel
  const [thumbRef, thumbApi] = useEmblaCarousel({
    containScroll: 'keepSnaps',
    dragFree: true,
  })

  const onThumbClick = useCallback(
    (index: number) => {
      if (!mainApi) return
      mainApi.scrollTo(index)
    },
    [mainApi],
  )

  const onSelect = useCallback(() => {
    if (!mainApi || !thumbApi) return
    const index = mainApi.selectedScrollSnap()
    setSelectedIndex(index)
    thumbApi.scrollTo(index)
  }, [mainApi, thumbApi])

  useEffect(() => {
    if (!mainApi) return
    onSelect()
    mainApi.on('select', onSelect)
    mainApi.on('reInit', onSelect)
    return () => {
      mainApi.off('select', onSelect)
      mainApi.off('reInit', onSelect)
    }
  }, [mainApi, onSelect])

  const handleCategoryChange = (category: CategoryValue) => {
    setActiveCategory(category)
    setSelectedIndex(0)
  }

  if (images.length === 0) {
    return (
      <div className="bg-muted aspect-[4/3] rounded-lg flex flex-col items-center justify-center gap-2 text-muted-foreground">
        <ImageOff className="size-10" />
        <p className="text-sm">이미지를 불러올 수 없습니다</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Category tabs */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide">
        {CATEGORY_TABS.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => handleCategoryChange(tab.value)}
            className={cn(
              'shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors',
              activeCategory === tab.value
                ? 'bg-foreground text-background'
                : 'bg-muted text-muted-foreground hover:bg-muted/80',
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Main carousel -- key forces remount on category change (Embla pitfall) */}
      <div key={activeCategory} className="relative">
        <div className="overflow-hidden rounded-lg" ref={mainRef}>
          <div className="flex">
            {filteredImages.map((img, index) => (
              <div
                key={img.id}
                className="aspect-[4/3] min-w-0 shrink-0 grow-0 basis-full cursor-pointer"
                onClick={() => {
                  setSelectedIndex(index)
                  setLightboxOpen(true)
                }}
              >
                <img
                  src={img.url}
                  alt={`차량 이미지 ${index + 1}`}
                  className="h-full w-full object-cover"
                  loading={index === 0 ? 'eager' : 'lazy'}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Image count badge */}
        <div className="absolute bottom-3 right-3 flex items-center gap-1 rounded bg-black/60 px-2 py-1 text-xs text-white">
          <span>📷</span>
          <span>{filteredImages.length}</span>
        </div>
      </div>

      {/* Mobile dot indicators */}
      <div className="flex justify-center gap-1.5 py-2 lg:hidden">
        {filteredImages.map((_, index) => (
          <button
            key={index}
            type="button"
            onClick={() => onThumbClick(index)}
            className={cn(
              'size-2 rounded-full transition-colors',
              index === selectedIndex
                ? 'bg-foreground'
                : 'bg-foreground/30',
            )}
            aria-label={`이미지 ${index + 1}로 이동`}
          />
        ))}
      </div>

      {/* Thumbnail strip -- desktop only */}
      <div className="hidden lg:block overflow-hidden" ref={thumbRef}>
        <div className="flex gap-2">
          {filteredImages.map((img, index) => (
            <button
              key={img.id}
              type="button"
              onClick={() => onThumbClick(index)}
              className={cn(
                'w-16 h-12 shrink-0 rounded cursor-pointer overflow-hidden transition-all',
                index === selectedIndex
                  ? 'ring-2 ring-accent opacity-100'
                  : 'opacity-60 hover:opacity-80',
              )}
            >
              <img
                src={img.url}
                alt={`썸네일 ${index + 1}`}
                className="h-full w-full object-cover"
                loading="lazy"
              />
            </button>
          ))}
        </div>
      </div>

      {/* YARL Lightbox */}
      <Lightbox
        open={lightboxOpen}
        close={() => setLightboxOpen(false)}
        index={selectedIndex}
        slides={filteredImages.map((img) => ({
          src: img.url,
          alt: '차량 이미지',
        }))}
        plugins={[Thumbnails, Zoom, Counter]}
      />
    </div>
  )
}
