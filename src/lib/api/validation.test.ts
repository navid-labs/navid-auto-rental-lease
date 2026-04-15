import { describe, it, expect } from "vitest";
import { z } from "zod";
import { validateQuery } from "./validation";

const schema = z.object({
  status: z.enum(["A", "B"]).optional(),
  name: z.string().optional(),
});

describe("validateQuery", () => {
  it("returns ok=true with parsed data on valid input", () => {
    const result = validateQuery(schema, new URLSearchParams("status=A"));
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data.status).toBe("A");
  });

  it("returns ok=true with empty object when all optional fields missing", () => {
    const result = validateQuery(schema, new URLSearchParams(""));
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data).toEqual({});
  });

  it("returns ok=false with 400 response on invalid enum", async () => {
    const result = validateQuery(schema, new URLSearchParams("status=INVALID"));
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.response.status).toBe(400);
      const body = await result.response.json();
      expect(body.error).toBe("잘못된 요청입니다.");
      expect(body.details).toBeTruthy();
    }
  });
});
