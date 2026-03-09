import imageCompression from 'browser-image-compression'

const COMPRESSION_OPTIONS = {
  maxSizeMB: 2,
  maxWidthOrHeight: 1920,
  useWebWorker: true,
  fileType: 'image/webp' as const,
}

/** Minimum file size to trigger compression (500KB) */
const COMPRESSION_THRESHOLD = 500 * 1024

/**
 * Compress an image file client-side before upload.
 * Skips compression for files under 500KB.
 * Converts to WebP for smaller file sizes.
 */
export async function compressImage(file: File): Promise<File> {
  if (file.size < COMPRESSION_THRESHOLD) return file
  return imageCompression(file, COMPRESSION_OPTIONS)
}

/** Accepted image MIME types for vehicle photos */
export const ACCEPTED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
] as const

/** Maximum file size before compression (MB) */
export const MAX_FILE_SIZE_MB = 10

/** Maximum number of images per vehicle */
export const MAX_IMAGES_PER_VEHICLE = 10
