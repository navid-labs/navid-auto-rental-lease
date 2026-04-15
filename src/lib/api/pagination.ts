import { z } from "zod";

const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  size: z.coerce.number().int().min(1).max(50).default(20),
});

export type Pagination = z.infer<typeof paginationSchema>;
export type PaginationMeta = {
  page: number;
  size: number;
  total: number;
  totalPages: number;
};

/** undefined 또는 빈 문자열 값을 제거하여 안전하게 URLSearchParams 생성 */
export function toURLSearchParams(
  obj: Record<string, string | undefined>
): URLSearchParams {
  const entries = Object.entries(obj).filter(
    ([, v]) => v != null && v !== ""
  ) as [string, string][];
  return new URLSearchParams(entries);
}

/** 폴백 기반 파싱 — 비숫자/음수/초과는 기본값으로 (never throw) */
export function parsePagination(params: URLSearchParams): Pagination {
  const parsed = paginationSchema.safeParse({
    page: params.get("page") ?? undefined,
    size: params.get("size") ?? undefined,
  });
  return parsed.success ? parsed.data : { page: 1, size: 20 };
}

export function paginationMeta(
  page: number,
  size: number,
  total: number
): PaginationMeta {
  return {
    page,
    size,
    total,
    totalPages: Math.max(1, Math.ceil(total / size)),
  };
}
