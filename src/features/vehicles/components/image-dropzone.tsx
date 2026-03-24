'use client'

import { useState, useRef, useCallback } from 'react'
import { Upload, AlertCircle, Loader2 } from 'lucide-react'
import { compressImage, ACCEPTED_IMAGE_TYPES, MAX_FILE_SIZE_MB } from '@/features/vehicles/utils/image-compression'
import { uploadVehicleImage as uploadVehicleImageApi } from '@/lib/api/generated/vehicles/vehicles'
import { ApiError } from '@/lib/api/fetcher'

type ImageDropzoneProps = {
  vehicleId: string
  currentCount: number
  maxCount: number
  onUploadComplete: () => void
}

export function ImageDropzone({
  vehicleId,
  currentCount,
  maxCount,
  onUploadComplete,
}: ImageDropzoneProps) {
  const [isDragOver, setIsDragOver] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [errors, setErrors] = useState<string[]>([])
  const inputRef = useRef<HTMLInputElement>(null)

  const remaining = maxCount - currentCount

  const processFiles = useCallback(
    async (files: FileList | File[]) => {
      setErrors([])
      const fileArray = Array.from(files)

      // Validate each file
      const validFiles: File[] = []
      const newErrors: string[] = []

      for (const file of fileArray) {
        if (!ACCEPTED_IMAGE_TYPES.includes(file.type as typeof ACCEPTED_IMAGE_TYPES[number])) {
          newErrors.push(`${file.name}: 지원하지 않는 파일 형식입니다.`)
          continue
        }
        if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
          newErrors.push(`${file.name}: ${MAX_FILE_SIZE_MB}MB를 초과합니다.`)
          continue
        }
        validFiles.push(file)
      }

      if (validFiles.length > remaining) {
        newErrors.push(`최대 ${remaining}장 더 업로드할 수 있습니다.`)
        validFiles.splice(remaining)
      }

      if (newErrors.length > 0) setErrors(newErrors)
      if (validFiles.length === 0) return

      setUploading(true)

      // Compress and upload in parallel
      const uploadErrors: string[] = []
      await Promise.all(
        validFiles.map(async (file) => {
          try {
            const compressed = await compressImage(file)
            await uploadVehicleImageApi(vehicleId, { file: compressed })
          } catch (e) {
            uploadErrors.push(e instanceof ApiError ? e.message : `${file.name}: 업로드에 실패했습니다.`)
          }
        })
      )

      if (uploadErrors.length > 0) {
        setErrors((prev) => [...prev, ...uploadErrors])
      }

      setUploading(false)
      onUploadComplete()
    },
    [vehicleId, remaining, onUploadComplete]
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragOver(false)
      if (e.dataTransfer.files.length > 0) {
        processFiles(e.dataTransfer.files)
      }
    },
    [processFiles]
  )

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        processFiles(e.target.files)
        // Reset input so same file can be re-selected
        e.target.value = ''
      }
    },
    [processFiles]
  )

  return (
    <div className="space-y-2">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`
          flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors
          ${isDragOver ? 'border-accent bg-accent/5' : 'border-muted-foreground/25 hover:border-accent/50'}
          ${uploading ? 'pointer-events-none opacity-60' : ''}
        `}
      >
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED_IMAGE_TYPES.join(',')}
          multiple
          onChange={handleInputChange}
          className="hidden"
        />

        {uploading ? (
          <>
            <Loader2 className="mb-2 size-8 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">업로드 중...</p>
          </>
        ) : (
          <>
            <Upload className="mb-2 size-8 text-muted-foreground" />
            <p className="text-sm font-medium">
              사진을 드래그하거나 클릭하여 선택
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              JPG, PNG, WebP, HEIC / 최대 {MAX_FILE_SIZE_MB}MB / {remaining}장 추가 가능
            </p>
          </>
        )}
      </div>

      {errors.length > 0 && (
        <div className="space-y-1">
          {errors.map((err, i) => (
            <div key={i} className="flex items-start gap-1.5 text-xs text-destructive">
              <AlertCircle className="mt-0.5 size-3 shrink-0" />
              <span>{err}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
