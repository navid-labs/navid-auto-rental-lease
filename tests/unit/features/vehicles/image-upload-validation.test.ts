import { describe, it, expect } from 'vitest'
import { validateImageFile } from '@/lib/validation/image'

/**
 * Helper to create mock File objects with specific byte content.
 * Pads to at least 12 bytes so magic byte checks can read enough header data.
 */
function createMockFile(
  bytes: number[],
  options: { type: string; name: string },
): File {
  const buffer = new Uint8Array(bytes.length < 12 ? 12 : bytes.length)
  buffer.set(bytes)
  const blob = new Blob([buffer], { type: options.type })
  return new File([blob], options.name, { type: options.type })
}

/**
 * Helper to create a File of a specific size (in bytes) for size-limit tests.
 */
function createMockFileWithSize(
  sizeInBytes: number,
  options: { type: string; name: string },
): File {
  // Start with valid JPEG header so MIME/magic checks pass
  const jpegHeader = [0xff, 0xd8, 0xff, 0xe0]
  const buffer = new Uint8Array(sizeInBytes)
  buffer.set(jpegHeader)
  const blob = new Blob([buffer], { type: options.type })
  return new File([blob], options.name, { type: options.type })
}

describe('validateImageFile', () => {
  it('rejects null/undefined file with error message', async () => {
    const result = await validateImageFile(null as unknown as File)
    expect(result).toHaveProperty('error')
    expect((result as { error: string }).error).toBeTruthy()
  })

  it('rejects file with disallowed MIME type (application/javascript)', async () => {
    const file = createMockFile([0x76, 0x61, 0x72, 0x20], {
      type: 'application/javascript',
      name: 'script.js',
    })
    const result = await validateImageFile(file)
    expect(result).toHaveProperty('error')
    expect((result as { error: string }).error).toContain(
      '허용되지 않는 파일 형식입니다',
    )
  })

  it('rejects file exceeding MAX_FILE_SIZE (10MB)', async () => {
    const tenMBPlusOne = 10 * 1024 * 1024 + 1
    const file = createMockFileWithSize(tenMBPlusOne, {
      type: 'image/jpeg',
      name: 'huge.jpg',
    })
    const result = await validateImageFile(file)
    expect(result).toHaveProperty('error')
    expect((result as { error: string }).error).toContain('10MB')
  })

  it('rejects file where magic bytes do not match any known image signature', async () => {
    // A .js file: bytes start with "var " (0x76 0x61 0x72 0x20)
    const file = createMockFile([0x76, 0x61, 0x72, 0x20], {
      type: 'image/png',
      name: 'fake.png',
    })
    const result = await validateImageFile(file)
    expect(result).toHaveProperty('error')
    expect((result as { error: string }).error).toContain(
      '파일 내용이 이미지 형식과 일치하지 않습니다',
    )
  })

  it('accepts valid JPEG file (magic bytes FF D8 FF)', async () => {
    const file = createMockFile([0xff, 0xd8, 0xff, 0xe0], {
      type: 'image/jpeg',
      name: 'photo.jpg',
    })
    const result = await validateImageFile(file)
    expect(result).toEqual({ valid: true })
  })

  it('accepts valid PNG file (magic bytes 89 50 4E 47)', async () => {
    const file = createMockFile(
      [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
      { type: 'image/png', name: 'image.png' },
    )
    const result = await validateImageFile(file)
    expect(result).toEqual({ valid: true })
  })

  it('accepts valid WebP file (RIFF at offset 0, WEBP at offset 8)', async () => {
    const file = createMockFile(
      [0x52, 0x49, 0x46, 0x46, 0x00, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50],
      { type: 'image/webp', name: 'image.webp' },
    )
    const result = await validateImageFile(file)
    expect(result).toEqual({ valid: true })
  })

  it('accepts valid GIF file (magic bytes 47 49 46 38)', async () => {
    const file = createMockFile(
      [0x47, 0x49, 0x46, 0x38, 0x39, 0x61],
      { type: 'image/gif', name: 'animation.gif' },
    )
    const result = await validateImageFile(file)
    expect(result).toEqual({ valid: true })
  })

  it('rejects file claiming image/jpeg MIME type but containing JavaScript bytes', async () => {
    // Claiming image/jpeg but actual content is JavaScript
    const file = createMockFile([0x76, 0x61, 0x72, 0x20], {
      type: 'image/jpeg',
      name: 'malicious.jpg',
    })
    const result = await validateImageFile(file)
    expect(result).toHaveProperty('error')
    expect((result as { error: string }).error).toContain(
      '파일 내용이 이미지 형식과 일치하지 않습니다',
    )
  })
})
