'use client'

import { useState, useCallback, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { ImageDropzone } from './image-dropzone'
import { SortableImageGrid } from './sortable-image-grid'
import { deleteVehicleImage } from '@/features/vehicles/actions/delete-image'
import { reorderVehicleImages } from '@/features/vehicles/actions/reorder-images'
import { MAX_IMAGES_PER_VEHICLE } from '@/features/vehicles/utils/image-compression'
import type { ImageItem } from '@/features/vehicles/types'

type StepPhotosProps = {
  vehicleId: string
  initialImages?: ImageItem[]
  onBack: () => void
  onComplete: () => void
  mode: 'create' | 'edit'
}

export function StepPhotos({
  vehicleId,
  initialImages = [],
  onBack,
  onComplete,
  mode,
}: StepPhotosProps) {
  const [images, setImages] = useState<ImageItem[]>(initialImages)
  const [isPending, startTransition] = useTransition()

  const refreshImages = useCallback(async () => {
    // Fetch latest images from server
    const res = await fetch(`/api/vehicles/${vehicleId}/images`)
    if (res.ok) {
      const data = await res.json()
      setImages(data.images ?? [])
    }
  }, [vehicleId])

  const handleImagesChange = useCallback(
    (reordered: ImageItem[]) => {
      // Optimistic update
      setImages(reordered)
      // Persist to server
      startTransition(async () => {
        await reorderVehicleImages(
          vehicleId,
          reordered.map((img) => img.id)
        )
      })
    },
    [vehicleId, startTransition]
  )

  const handleDelete = useCallback(
    (imageId: string) => {
      // Optimistic: remove from local state
      setImages((prev) => {
        const filtered = prev.filter((img) => img.id !== imageId)
        return filtered.map((img, idx) => ({ ...img, order: idx }))
      })
      // Persist
      startTransition(async () => {
        await deleteVehicleImage(imageId)
      })
    },
    [startTransition]
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground">
          차량 사진 ({images.length} / {MAX_IMAGES_PER_VEHICLE}장)
        </h3>
      </div>

      {/* Sortable grid of existing images */}
      <SortableImageGrid
        images={images}
        vehicleId={vehicleId}
        onImagesChange={handleImagesChange}
        onDelete={handleDelete}
      />

      {/* Dropzone (hidden when at max) */}
      {images.length < MAX_IMAGES_PER_VEHICLE && (
        <ImageDropzone
          vehicleId={vehicleId}
          currentCount={images.length}
          maxCount={MAX_IMAGES_PER_VEHICLE}
          onUploadComplete={refreshImages}
        />
      )}

      {/* Navigation */}
      <div className="flex justify-between pt-4">
        <Button type="button" variant="outline" onClick={onBack}>
          이전
        </Button>
        <Button
          type="button"
          onClick={onComplete}
          disabled={isPending}
        >
          {mode === 'create' ? '등록 완료' : '수정 완료'}
        </Button>
      </div>
    </div>
  )
}
