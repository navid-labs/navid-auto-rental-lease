// src/app/api/sell/plate-lookup/route.test.ts
import { describe, expect, it } from "vitest";
import { POST } from "./route";

function req(body: unknown) {
  return new Request("http://localhost/api/sell/plate-lookup", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });
}

describe("POST /api/sell/plate-lookup", () => {
  it("returns deterministic vehicle for valid plate", async () => {
    const res = await POST(req({ plate: "12가3456" }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toMatchObject({
      plate: "12가3456",
      brand: expect.any(String),
      model: expect.any(String),
      year: expect.any(Number),
      fuel: expect.stringMatching(/GASOLINE|DIESEL|HYBRID|EV/),
      displacement: expect.any(Number),
    });
  });

  it("rejects invalid plate format", async () => {
    const res = await POST(req({ plate: "BADPLATE" }));
    expect(res.status).toBe(400);
  });

  it("rejects missing plate", async () => {
    const res = await POST(req({}));
    expect(res.status).toBe(400);
  });
});
