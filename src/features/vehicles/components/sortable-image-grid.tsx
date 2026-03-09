'use client'

import { DndContext, closestCenter, type DragEndEvent } from '@dnd-kit/core'
import { SortableContext, rectSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { X } from 'lucide-react'
import Image from 'next/image'
import type { ImageItem } from '@/features/vehicles/types'

type SortableImageProps = {
  image: ImageItem
  onDelete: (id: string) => void
}

function SortableImage({ image, onDelete }: SortableImageProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: image.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : undefined,
    opacity: isDragging ? 0.8 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="group relative aspect-[4/3] overflow-hidden rounded-lg border bg-muted"
    >
      <Image
        src={image.url}
        alt={`Vehicle photo ${image.order + 1}`}
        fill
        className="object-cover"
        sizes="(max-width: 768px) 33vw, 20vw"
      />

      {/* Delete button */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          onDelete(image.id)
        }}
        className="absolute right-1 top-1 flex size-6 items-center justify-center rounded-full bg-destructive text-destructive-foreground opacity-0 transition-opacity group-hover:opacity-100"
      >
        <X className="size-3.5" />
      </button>

      {/* Primary badge */}
      {image.order === 0 && (
        <span className="absolute bottom-1 left-1 rounded bg-accent px-2 py-0.5 text-[10px] font-semibold text-accent-foreground">
          대표
        </span>
      )}
    </div>
  )
}

type SortableImageGridProps = {
  images: ImageItem[]
  vehicleId: string
  onImagesChange: (images: ImageItem[]) => void
  onDelete: (id: string) => void
}

export function SortableImageGrid({
  images,
  onImagesChange,
  onDelete,
}: SortableImageGridProps) {
  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = images.findIndex((i) => i.id === active.id)
    const newIndex = images.findIndex((i) => i.id === over.id)
    const reordered = arrayMove(images, oldIndex, newIndex).map((img, idx) => ({
      ...img,
      order: idx,
    }))
    onImagesChange(reordered)
  }

  if (images.length === 0) return null

  return (
    <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={images.map((i) => i.id)} strategy={rectSortingStrategy}>
        <div className="grid grid-cols-3 gap-2 md:grid-cols-5">
          {images.map((image) => (
            <SortableImage key={image.id} image={image} onDelete={onDelete} />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  )
}
