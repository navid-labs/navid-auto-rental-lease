/**
 * Server-side image upload validation with MIME type whitelist and magic byte verification.
 *
 * Prevents malicious file uploads by validating actual file content (magic bytes),
 * not just the file extension or claimed MIME type.
 */

/** Maximum allowed file size: 10MB */
export const MAX_FILE_SIZE = 10 * 1024 * 1024

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
])

/**
 * Magic byte signatures for supported image formats.
 * Each entry lists the bytes that must appear at the start of the file.
 * WebP additionally requires "WEBP" at byte offset 8.
 */
const IMAGE_SIGNATURES: Array<{
  mime: string
  bytes: number[]
  offsetBytes?: { offset: number; bytes: number[] }
}> = [
  { mime: 'image/jpeg', bytes: [0xFF, 0xD8, 0xFF] },
  { mime: 'image/png', bytes: [0x89, 0x50, 0x4E, 0x47] },
  { mime: 'image/gif', bytes: [0x47, 0x49, 0x46, 0x38] },
  {
    mime: 'image/webp',
    bytes: [0x52, 0x49, 0x46, 0x46],
    offsetBytes: { offset: 8, bytes: [0x57, 0x45, 0x42, 0x50] },
  },
]

type ValidationResult = { valid: true } | { error: string }

/**
 * Validate an uploaded image file server-side:
 * 1. Null check
 * 2. File size check (max 10MB)
 * 3. MIME type whitelist check
 * 4. Magic byte verification (actual file content)
 */
export async function validateImageFile(
  file: File | null | undefined,
): Promise<ValidationResult> {
  if (!file) {
    return { error: '파일을 선택해주세요.' }
  }

  if (file.size > MAX_FILE_SIZE) {
    return { error: '파일 크기는 10MB 이하만 허용됩니다.' }
  }

  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    return {
      error:
        '허용되지 않는 파일 형식입니다. JPEG, PNG, WebP, GIF만 업로드 가능합니다.',
    }
  }

  // Read the first 12 bytes for magic byte verification
  const headerSlice = file.slice(0, 12)
  const headerBuffer = await headerSlice.arrayBuffer()
  const header = new Uint8Array(headerBuffer)

  const matchesSignature = IMAGE_SIGNATURES.some((sig) => {
    // Check primary bytes at offset 0
    const primaryMatch = sig.bytes.every(
      (byte, i) => header[i] === byte,
    )
    if (!primaryMatch) return false

    // Check additional offset bytes if specified (e.g., WebP "WEBP" at offset 8)
    if (sig.offsetBytes) {
      return sig.offsetBytes.bytes.every(
        (byte, i) => header[sig.offsetBytes!.offset + i] === byte,
      )
    }

    return true
  })

  if (!matchesSignature) {
    return { error: '파일 내용이 이미지 형식과 일치하지 않습니다.' }
  }

  return { valid: true }
}
