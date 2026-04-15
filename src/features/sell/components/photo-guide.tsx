// src/features/sell/components/photo-guide.tsx
"use client";
import { useRef } from "react";

const SLOTS = [
  "정면",
  "운전석 측면",
  "조수석 측면",
  "후면",
  "대시보드",
  "계기판",
  "엔진룸",
  "좌전 바퀴",
  "우전 바퀴",
  "좌후 바퀴",
  "우후 바퀴",
  "트렁크",
];

interface Props {
  value: (File | null)[];
  onChange: (next: (File | null)[]) => void;
}

export function PhotoGuide({ value, onChange }: Props) {
  const normalized = SLOTS.map((_, i) => value[i] ?? null);

  function setAt(i: number, file: File | null) {
    const next = [...normalized];
    next[i] = file;
    onChange(next);
  }

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
      {SLOTS.map((label, i) => (
        <Slot
          key={label}
          label={label}
          index={i}
          file={normalized[i]}
          onFile={(f) => setAt(i, f)}
        />
      ))}
    </div>
  );
}

function Slot({
  label,
  index,
  file,
  onFile,
}: {
  label: string;
  index: number;
  file: File | null;
  onFile: (f: File | null) => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const preview = file ? URL.createObjectURL(file) : null;
  return (
    <div
      data-testid={`photo-slot-${index}`}
      className="relative aspect-[4/3] overflow-hidden rounded-xl border bg-[var(--chayong-surface)]"
    >
      {preview ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={preview} alt={label} className="h-full w-full object-cover" />
      ) : (
        <button
          type="button"
          onClick={() => ref.current?.click()}
          className="flex h-full w-full flex-col items-center justify-center gap-2 text-sm text-[var(--chayong-text-sub)]"
        >
          <span>+</span>
          <span>{label}</span>
        </button>
      )}
      <input
        ref={ref}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => onFile(e.target.files?.[0] ?? null)}
      />
      {file && (
        <button
          type="button"
          onClick={() => onFile(null)}
          className="absolute right-1 top-1 rounded-full bg-white/90 px-2 py-1 text-xs"
        >
          삭제
        </button>
      )}
    </div>
  );
}
