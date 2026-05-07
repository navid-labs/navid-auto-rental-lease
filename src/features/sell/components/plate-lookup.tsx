// src/features/sell/components/plate-lookup.tsx
"use client";
import { useState } from "react";

const PLATE_RE = /^[0-9]{2,3}[가-힣][0-9]{4}$/;

export interface PlateLookupResult {
  plate: string;
  brand: string;
  model: string;
  year: number;
  fuel: "GASOLINE" | "DIESEL" | "HYBRID" | "EV";
  displacement: number;
}

interface Props {
  onResult: (r: PlateLookupResult) => void;
  onSkip: () => void;
  onError?: () => void;
}

export function PlateLookup({ onResult, onSkip, onError }: Props) {
  const [plate, setPlate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function lookup() {
    if (!PLATE_RE.test(plate.trim())) {
      setError("번호판 형식이 올바르지 않습니다 (예: 12가3456)");
      onError?.();
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/sell/plate-lookup", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ plate: plate.trim() }),
      });
      if (!res.ok) {
        setError("조회에 실패했습니다. 수동으로 입력해주세요.");
        onError?.();
        return;
      }
      onResult(await res.json());
    } catch {
      setError("네트워크 오류. 수동으로 입력해주세요.");
      onError?.();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <label htmlFor="plate" className="text-sm font-semibold">
        차량번호
      </label>
      <input
        id="plate"
        placeholder="차량번호 (예: 12가3456)"
        value={plate}
        onChange={(e) => setPlate(e.target.value)}
        className="h-12 rounded-xl border px-4"
      />
      {error && <p className="text-sm text-[var(--chayong-danger)]">{error}</p>}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={lookup}
          disabled={loading}
          className="h-12 flex-1 rounded-xl bg-[var(--chayong-primary)] font-semibold text-white disabled:opacity-50"
        >
          {loading ? "조회 중…" : "조회"}
        </button>
        <button
          type="button"
          onClick={onSkip}
          className="h-12 rounded-xl border px-4 font-semibold"
        >
          수동 입력
        </button>
      </div>
    </div>
  );
}
