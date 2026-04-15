import { z } from "zod";
import { NextResponse } from "next/server";

export function validateQuery<T>(
  schema: z.ZodType<T>,
  params: URLSearchParams
): { ok: true; data: T } | { ok: false; response: NextResponse } {
  const raw = Object.fromEntries(params);
  const result = schema.safeParse(raw);
  if (!result.success) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "잘못된 요청입니다.", details: result.error.flatten() },
        { status: 400 }
      ),
    };
  }
  return { ok: true, data: result.data };
}
