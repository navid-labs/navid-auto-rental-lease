"use client";

import { useState } from "react";
import Link from "next/link";

export type ConsentResult = { marketingOptIn: boolean };

export function ConsentModal({
  onSubmit,
}: {
  onSubmit: (result: ConsentResult) => Promise<void> | void;
}) {
  const [terms, setTerms] = useState(false);
  const [privacy, setPrivacy] = useState(false);
  const [marketing, setMarketing] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const allChecked = terms && privacy && marketing;
  const canSubmit = terms && privacy && !submitting;

  function toggleAll() {
    const next = !allChecked;
    setTerms(next);
    setPrivacy(next);
    setMarketing(next);
  }

  async function handleSubmit() {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      await onSubmit({ marketingOptIn: marketing });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="consent-title"
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center"
    >
      <div className="w-full max-w-md rounded-t-2xl bg-white p-6 sm:rounded-2xl">
        <h2 id="consent-title" className="text-lg font-bold text-[var(--chayong-text)]">
          서비스 이용을 위해 동의해 주세요
        </h2>
        <p className="mt-1 text-sm text-[var(--chayong-text-sub)]">
          필수 항목에 동의하시면 차용을 시작할 수 있습니다.
        </p>

        <label className="mt-4 flex items-center gap-3 rounded-lg border border-[var(--chayong-divider)] px-3 py-3 cursor-pointer">
          <input type="checkbox" checked={allChecked} onChange={toggleAll} aria-label="전체 동의" />
          <span className="font-semibold">전체 동의 (선택 항목 포함)</span>
        </label>

        <div className="mt-3 flex flex-col gap-2">
          <Item
            checked={terms}
            onChange={setTerms}
            required
            label="이용약관"
            href="/terms"
            ariaLabel="이용약관 동의 (필수)"
          />
          <Item
            checked={privacy}
            onChange={setPrivacy}
            required
            label="개인정보 처리방침"
            href="/privacy"
            ariaLabel="개인정보 동의 (필수)"
          />
          <Item
            checked={marketing}
            onChange={setMarketing}
            label="마케팅 정보 수신 (이메일/SMS)"
            ariaLabel="마케팅 수신 동의 (선택)"
          />
        </div>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="mt-5 h-12 w-full rounded-xl bg-[var(--chayong-primary)] text-white font-semibold text-[15px] transition disabled:opacity-50 hover:bg-[var(--chayong-primary-hover)]"
        >
          {submitting ? "처리 중..." : "동의하고 시작하기"}
        </button>
      </div>
    </div>
  );
}

function Item({
  checked,
  onChange,
  required,
  label,
  href,
  ariaLabel,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  required?: boolean;
  label: string;
  href?: string;
  ariaLabel: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 px-1">
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          aria-label={ariaLabel}
        />
        <span className="text-sm">
          <span className={required ? "text-[var(--chayong-primary)]" : "text-[var(--chayong-text-sub)]"}>
            {required ? "(필수) " : "(선택) "}
          </span>
          {label}
        </span>
      </label>
      {href && (
        <Link href={href} target="_blank" className="text-xs text-[var(--chayong-text-sub)] underline">
          보기
        </Link>
      )}
    </div>
  );
}
