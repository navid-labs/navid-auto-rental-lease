// src/app/api/sell/plate-lookup/route.ts
import { NextResponse } from "next/server";

const PLATE_RE = /^[0-9]{2,3}[가-힣][0-9]{4}$/;

const MOCK_POOL = [
  { brand: "BMW", model: "X3", year: 2022, fuel: "GASOLINE" as const, displacement: 1998 },
  { brand: "현대", model: "아반떼 하이브리드", year: 2023, fuel: "HYBRID" as const, displacement: 1598 },
  { brand: "기아", model: "K5", year: 2021, fuel: "GASOLINE" as const, displacement: 1999 },
  { brand: "테슬라", model: "Model 3", year: 2024, fuel: "EV" as const, displacement: 0 },
  { brand: "벤츠", model: "E220d", year: 2022, fuel: "DIESEL" as const, displacement: 1950 },
];

function hashPlate(p: string): number {
  let h = 0;
  for (let i = 0; i < p.length; i++) h = (h * 31 + p.charCodeAt(i)) | 0;
  return Math.abs(h) % MOCK_POOL.length;
}

export async function POST(req: Request) {
  let body: { plate?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }
  const plate = body.plate?.trim();
  if (!plate || !PLATE_RE.test(plate)) {
    return NextResponse.json({ error: "invalid plate" }, { status: 400 });
  }
  const vehicle = MOCK_POOL[hashPlate(plate)];
  return NextResponse.json({ plate, ...vehicle });
}
