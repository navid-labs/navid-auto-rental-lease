import type { SupabaseClient } from "@supabase/supabase-js";

import { createAdminClient } from "@/lib/supabase/admin";

export const BUCKET = {
  LISTING_DOCUMENTS: "listing-documents",
  TRANSFER_PROOFS: "transfer-proofs",
  DISPUTE_EVIDENCE: "dispute-evidence",
} as const;

export type PrivateBucket = (typeof BUCKET)[keyof typeof BUCKET];

export const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
] as const;

export const MAX_SIZE = 20 * 1024 * 1024;

export type UploadPrivateInput = {
  bucket: PrivateBucket;
  folder: string;
  file: File | Buffer;
  contentType: string;
  fileName?: string;
};

const SAFE_KEY_PATTERN = /^[a-zA-Z0-9_\-./]+$/;
const EXTENSION_BY_TYPE: Record<(typeof ALLOWED_TYPES)[number], string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "application/pdf": "pdf",
};

function createStorageClient(): SupabaseClient {
  return createAdminClient();
}

function assertAllowedContentType(
  contentType: string,
): asserts contentType is (typeof ALLOWED_TYPES)[number] {
  if (!ALLOWED_TYPES.includes(contentType as (typeof ALLOWED_TYPES)[number])) {
    throw new Error(`Unsupported private object content type: ${contentType}`);
  }
}

function getFileSize(file: File | Buffer): number {
  return Buffer.isBuffer(file) ? file.byteLength : file.size;
}

function assertValidKeySegment(value: string, label: string): void {
  if (
    !value ||
    value.startsWith("/") ||
    value.endsWith("/") ||
    value.includes("..") ||
    !SAFE_KEY_PATTERN.test(value)
  ) {
    throw new Error(`Invalid private object ${label}`);
  }
}

function getExtension(
  fileName: string | undefined,
  contentType: (typeof ALLOWED_TYPES)[number],
): string {
  if (!fileName) {
    return "bin";
  }

  const extension = fileName.split(".").pop()?.toLowerCase();

  if (!extension || !/^[a-z0-9]+$/.test(extension)) {
    return EXTENSION_BY_TYPE[contentType];
  }

  return extension;
}

export async function uploadPrivateObject(
  input: UploadPrivateInput,
): Promise<{ key: string }> {
  assertAllowedContentType(input.contentType);
  assertValidKeySegment(input.folder, "folder");

  const size = getFileSize(input.file);
  if (size > MAX_SIZE) {
    throw new Error("Private object exceeds max size");
  }

  const extension = getExtension(input.fileName, input.contentType);
  const key = `${input.folder}/${crypto.randomUUID()}.${extension}`;
  assertValidKeySegment(key, "key");

  const supabase = createStorageClient();
  const { error } = await supabase.storage.from(input.bucket).upload(key, input.file, {
    contentType: input.contentType,
    upsert: false,
  });

  if (error) {
    throw error;
  }

  return { key };
}

export async function createSignedKeyUrl(
  bucket: PrivateBucket,
  key: string,
  ttlSeconds = 3600,
): Promise<string> {
  assertValidKeySegment(key, "key");

  const supabase = createStorageClient();
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(key, ttlSeconds);

  if (error) {
    throw error;
  }

  return data.signedUrl;
}

export async function deletePrivateObject(
  bucket: PrivateBucket,
  key: string,
): Promise<void> {
  assertValidKeySegment(key, "key");

  const supabase = createStorageClient();
  const { error } = await supabase.storage.from(bucket).remove([key]);

  if (error) {
    throw error;
  }
}
