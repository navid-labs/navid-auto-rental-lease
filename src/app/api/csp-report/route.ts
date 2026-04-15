import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const report = await request.json().catch(() => null);
    if (process.env.NODE_ENV !== "production" && report) {
      console.warn("[CSP violation]", JSON.stringify(report));
    }
  } catch {
    // ignore
  }
  return new NextResponse(null, { status: 204 });
}
