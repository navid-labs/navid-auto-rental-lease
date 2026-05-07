"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, CheckCircle2, ClipboardCheck, Search, ShieldCheck } from "lucide-react";
import { PlateLookup, type PlateLookupResult } from "./plate-lookup";
import { SELL_DRAFT_VEHICLE_KEY } from "./sell-draft";

interface SellEntryProps {
  isAuthenticated: boolean;
}

const STEPS = [
  { title: "차량번호 조회", description: "번호판으로 기본 정보를 먼저 확인합니다.", icon: Search },
  { title: "등록 정보 입력", description: "계약 조건과 사진을 이어서 채웁니다.", icon: ClipboardCheck },
  { title: "검수 후 게재", description: "관리자 확인 뒤 공개 매물로 노출됩니다.", icon: ShieldCheck },
] as const;

export function SellEntry({ isAuthenticated }: SellEntryProps) {
  const [result, setResult] = useState<PlateLookupResult | null>(null);
  const [lookupFailed, setLookupFailed] = useState(false);

  const signupHref = "/signup?role=SELLER&redirect=/sell/new";
  const nextHref = isAuthenticated ? "/sell/new" : signupHref;
  const nextLabel = isAuthenticated ? "등록 정보 입력하기" : "회원가입하고 등록하기";

  function handleResult(vehicle: PlateLookupResult) {
    setResult(vehicle);
    setLookupFailed(false);
    sessionStorage.setItem(
      SELL_DRAFT_VEHICLE_KEY,
      JSON.stringify({
        plate: vehicle.plate,
        brand: vehicle.brand,
        model: vehicle.model,
        year: vehicle.year,
        fuel: vehicle.fuel,
      })
    );
  }

  function handleManualEntry() {
    sessionStorage.removeItem(SELL_DRAFT_VEHICLE_KEY);
    window.location.href = isAuthenticated ? "/sell/new?manual=1" : signupHref;
  }

  return (
    <div className="bg-[var(--chayong-bg)]">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-12">
        <section className="grid gap-6 lg:grid-cols-[1fr_420px] lg:items-start">
          <div className="min-w-0 space-y-6">
            <div className="space-y-3">
              <div className="inline-flex w-fit items-center gap-2 rounded-full border border-[color:var(--chayong-primary)]/20 bg-[color:var(--chayong-primary)]/10 px-3 py-1 text-xs font-semibold text-[var(--chayong-primary)]">
                <CheckCircle2 size={14} aria-hidden="true" />
                공개 등록 시작
              </div>
              <h1 className="text-balance text-3xl font-bold tracking-tight text-[var(--chayong-text)] sm:text-4xl">
                차량번호만 확인하고 등록은 다음 단계에서 이어가세요
              </h1>
              <p className="max-w-2xl text-sm leading-6 text-[var(--chayong-text-sub)] sm:text-base">
                먼저 차량 정보를 가볍게 조회하고, 계정 확인 후 계약 조건과 사진을 입력합니다.
                조회되지 않아도 수동 입력으로 계속 진행할 수 있습니다.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {STEPS.map(({ title, description, icon: Icon }, index) => (
                <div
                  key={title}
                  className="min-w-0 rounded-xl border border-[var(--chayong-border)] bg-white p-4"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <Icon size={18} className="text-[var(--chayong-primary)]" aria-hidden="true" />
                    <span className="text-xs font-semibold tabular-nums text-[var(--chayong-text-caption)]">
                      {index + 1}
                    </span>
                  </div>
                  <h2 className="text-sm font-bold text-[var(--chayong-text)]">{title}</h2>
                  <p className="mt-2 text-sm leading-6 text-[var(--chayong-text-sub)]">
                    {description}
                  </p>
                </div>
              ))}
            </div>

            <div className="rounded-xl border border-[var(--chayong-border)] bg-white p-5">
              <h2 className="text-lg font-bold text-[var(--chayong-text)]">진행 전 확인사항</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                {["연락처는 채팅에서 보호", "계약 정보는 검수 후 공개", "최종 등록은 기존 검증 통과"].map(
                  (item) => (
                    <div
                      key={item}
                      className="rounded-xl bg-[var(--chayong-surface)] px-4 py-3 text-sm font-medium text-[var(--chayong-text-sub)]"
                    >
                      {item}
                    </div>
                  )
                )}
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-[var(--chayong-border)] bg-white p-5 shadow-sm">
            <div className="mb-4">
              <p className="text-xs font-semibold text-[var(--chayong-primary)]">차량 조회</p>
              <h2 className="mt-1 text-xl font-bold text-[var(--chayong-text)]">
                번호판으로 시작
              </h2>
            </div>

            <PlateLookup
              onResult={handleResult}
              onSkip={handleManualEntry}
              onError={() => setLookupFailed(true)}
            />

            {result && (
              <div className="mt-5 rounded-xl border border-[color:var(--chayong-primary)]/25 bg-[color:var(--chayong-primary)]/5 p-4">
                <p className="text-xs font-semibold text-[var(--chayong-primary)]">조회 완료</p>
                <h3 className="mt-2 text-lg font-bold text-[var(--chayong-text)]">
                  {result.brand} {result.model}
                </h3>
                <p className="mt-1 text-sm text-[var(--chayong-text-sub)]">
                  {result.plate} · {result.year}년식 · {formatFuel(result.fuel)}
                </p>
                <Link
                  href={nextHref}
                  className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[var(--chayong-primary)] px-4 text-sm font-semibold text-white"
                >
                  {nextLabel}
                  <ArrowRight size={16} aria-hidden="true" />
                </Link>
              </div>
            )}

            {lookupFailed && !result && (
              <div className="mt-5 rounded-xl border border-[var(--chayong-border)] bg-[var(--chayong-surface)] p-4">
                <p className="text-sm font-medium text-[var(--chayong-text-sub)]">
                  조회되지 않으면 차량 정보를 직접 입력할 수 있습니다.
                </p>
                <button
                  type="button"
                  onClick={handleManualEntry}
                  className="mt-3 inline-flex h-11 w-full items-center justify-center rounded-xl border border-[var(--chayong-border)] bg-white px-4 text-sm font-semibold text-[var(--chayong-text)]"
                >
                  수동 입력으로 계속
                </button>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function formatFuel(fuel: PlateLookupResult["fuel"]) {
  if (fuel === "GASOLINE") return "가솔린";
  if (fuel === "DIESEL") return "디젤";
  if (fuel === "HYBRID") return "하이브리드";
  return "전기";
}
