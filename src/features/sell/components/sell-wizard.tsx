"use client";

import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useWizardState } from "./use-wizard-state";
import { PlateLookup } from "./plate-lookup";
import { PhotoGuide } from "./photo-guide";

const TOTAL_STEPS = 8;

const LISTING_TYPE_OPTIONS = [
  { value: "TRANSFER" as const, label: "승계", desc: "현재 진행 중인 리스·렌트 계약을 넘기고 싶을 때" },
  { value: "USED_LEASE" as const, label: "중고 리스", desc: "만기 후 차량을 리스 조건으로 다시 내놓을 때" },
  { value: "USED_RENTAL" as const, label: "중고 렌트", desc: "만기 후 차량을 렌트 조건으로 다시 내놓을 때" },
];

export function SellWizard() {
  const router = useRouter();
  const { step, form, patch, next, prev } = useWizardState();

  async function handleSubmit() {
    try {
      const res = await fetch("/api/listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sellerId: "00000000-0000-0000-0000-000000000000",
          type: form.type ?? "TRANSFER",
          monthlyPayment: form.monthlyPayment ?? 0,
          remainingMonths: form.remainingMonths ?? 0,
          initialCost: form.initialCost ?? 0,
          transferFee: 0,
          brand: form.brand || null,
          model: form.model || null,
          year: form.year ?? null,
          trim: form.trim || null,
          mileage: form.mileage ?? null,
          color: form.color || null,
          capitalCompany: form.capitalCompany || null,
          description: form.description || null,
          options: form.options,
        }),
      });

      if (!res.ok) throw new Error(`등록에 실패했습니다 (${res.status})`);

      const listing = await res.json();

      if (form.imageUrls.length > 0) {
        await fetch(`/api/listings/${listing.id}/images`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ urls: form.imageUrls }),
        });
      }

      router.push("/my");
    } catch (err) {
      console.error(err);
    }
  }

  // Step 0: 차량번호 조회
  // Step 1: 차종 확인/수정 (brand + model)
  // Step 2: 연식 + 주행거리
  // Step 3: 상품 타입
  // Step 4: 월 납입금
  // Step 5: 잔여 개월 + 보증금
  // Step 6: 사진
  // Step 7: 설명 + 제출

  const canNext = (): boolean => {
    if (step === 3) return form.type !== undefined;
    if (step === 4) return (form.monthlyPayment ?? 0) > 0;
    if (step === 5) return (form.remainingMonths ?? 0) > 0;
    return true;
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6 pb-24 px-4 py-8">
      <ProgressBar current={step} total={TOTAL_STEPS} />

      <div className="min-h-[320px]">
        {/* Step 0: 차량번호 조회 */}
        {step === 0 && (
          <div className="flex flex-col gap-4">
            <div>
              <h1 className="text-2xl font-bold" style={{ color: "var(--chayong-text)" }}>
                차량번호로 빠르게 조회
              </h1>
              <p className="mt-1.5 text-sm" style={{ color: "var(--chayong-text-sub)" }}>
                번호판만 입력하면 30초 만에 차량 정보가 채워져요
              </p>
            </div>
            <PlateLookup
              onResult={(r) => {
                patch({ plate: r.plate, brand: r.brand, model: r.model, year: r.year, fuel: r.fuel });
                next();
              }}
              onSkip={next}
            />
          </div>
        )}

        {/* Step 1: 차종 확인/수정 */}
        {step === 1 && (
          <div className="flex flex-col gap-6">
            <div>
              <h1 className="text-2xl font-bold" style={{ color: "var(--chayong-text)" }}>
                차종을 확인해주세요
              </h1>
              <p className="mt-1.5 text-sm" style={{ color: "var(--chayong-text-sub)" }}>
                자동 조회 결과가 맞는지 확인하고, 틀린 부분만 수정하세요
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label style={{ color: "var(--chayong-text)" }}>제조사</Label>
                <Input
                  placeholder="예: 현대"
                  value={form.brand}
                  onChange={(e) => patch({ brand: e.target.value })}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label style={{ color: "var(--chayong-text)" }}>모델</Label>
                <Input
                  placeholder="예: 아이오닉6"
                  value={form.model}
                  onChange={(e) => patch({ model: e.target.value })}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label style={{ color: "var(--chayong-text)" }}>트림</Label>
                <Input
                  placeholder="예: 롱레인지"
                  value={form.trim}
                  onChange={(e) => patch({ trim: e.target.value })}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label style={{ color: "var(--chayong-text)" }}>색상</Label>
                <Input
                  placeholder="예: 흰색"
                  value={form.color}
                  onChange={(e) => patch({ color: e.target.value })}
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 2: 연식 + 주행거리 */}
        {step === 2 && (
          <div className="flex flex-col gap-6">
            <div>
              <h1 className="text-2xl font-bold" style={{ color: "var(--chayong-text)" }}>
                연식과 주행거리를 입력해주세요
              </h1>
              <p className="mt-1.5 text-sm" style={{ color: "var(--chayong-text-sub)" }}>
                정확한 정보일수록 매칭 속도가 빨라져요
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label style={{ color: "var(--chayong-text)" }}>연식</Label>
                <Input
                  type="number"
                  placeholder="예: 2023"
                  value={form.year ?? ""}
                  onChange={(e) => patch({ year: e.target.value ? Number(e.target.value) : undefined })}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label style={{ color: "var(--chayong-text)" }}>주행거리</Label>
                <div className="relative">
                  <Input
                    type="number"
                    placeholder="예: 25000"
                    value={form.mileage ?? ""}
                    onChange={(e) => patch({ mileage: e.target.value ? Number(e.target.value) : undefined })}
                    className="pr-8"
                  />
                  <span
                    className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs"
                    style={{ color: "var(--chayong-text-caption)" }}
                  >
                    km
                  </span>
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Label style={{ color: "var(--chayong-text)" }}>캐피탈사</Label>
              <Input
                placeholder="예: 현대캐피탈, KB캐피탈"
                value={form.capitalCompany}
                onChange={(e) => patch({ capitalCompany: e.target.value })}
              />
            </div>
          </div>
        )}

        {/* Step 3: 상품 타입 */}
        {step === 3 && (
          <div className="flex flex-col gap-6">
            <div>
              <h1 className="text-2xl font-bold" style={{ color: "var(--chayong-text)" }}>
                매물 유형을 선택해주세요
              </h1>
              <p className="mt-1.5 text-sm" style={{ color: "var(--chayong-text-sub)" }}>
                하나를 선택해주세요
              </p>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {LISTING_TYPE_OPTIONS.map(({ value, label, desc }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => patch({ type: value })}
                  className="flex flex-col items-center rounded-xl border px-3 py-4 text-center transition-all"
                  style={{
                    borderColor: form.type === value ? "var(--chayong-primary)" : "var(--chayong-border)",
                    backgroundColor: form.type === value ? "var(--chayong-primary-light)" : "var(--chayong-surface)",
                    color: form.type === value ? "var(--chayong-primary)" : "var(--chayong-text-sub)",
                  }}
                >
                  <span className="text-sm font-bold">{label}</span>
                  <span className="mt-0.5 text-xs">{desc}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 4: 월 납입금 */}
        {step === 4 && (
          <div className="flex flex-col gap-6">
            <div>
              <h1 className="text-2xl font-bold" style={{ color: "var(--chayong-text)" }}>
                월 납입금을 입력해주세요
              </h1>
              <p className="mt-1.5 text-sm" style={{ color: "var(--chayong-text-sub)" }}>
                구매자에게 표시되는 가장 중요한 정보예요
              </p>
            </div>
            <div className="relative">
              <Input
                type="number"
                placeholder="예: 450000"
                value={form.monthlyPayment ?? ""}
                onChange={(e) => patch({ monthlyPayment: e.target.value ? Number(e.target.value) : undefined })}
                className="pr-8 h-14 text-lg"
              />
              <span
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm"
                style={{ color: "var(--chayong-text-caption)" }}
              >
                원
              </span>
            </div>
          </div>
        )}

        {/* Step 5: 잔여 개월 + 보증금 */}
        {step === 5 && (
          <div className="flex flex-col gap-6">
            <div>
              <h1 className="text-2xl font-bold" style={{ color: "var(--chayong-text)" }}>
                잔여 개월과 보증금을 입력해주세요
              </h1>
              <p className="mt-1.5 text-sm" style={{ color: "var(--chayong-text-sub)" }}>
                남은 계약 기간이 짧을수록 매칭이 빨라요
              </p>
            </div>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label style={{ color: "var(--chayong-text)" }}>
                  잔여 개월 수 <span style={{ color: "var(--chayong-primary)" }}>*</span>
                </Label>
                <div className="relative">
                  <Input
                    type="number"
                    placeholder="예: 24"
                    value={form.remainingMonths ?? ""}
                    onChange={(e) => patch({ remainingMonths: e.target.value ? Number(e.target.value) : undefined })}
                    className="pr-12"
                  />
                  <span
                    className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm"
                    style={{ color: "var(--chayong-text-caption)" }}
                  >
                    개월
                  </span>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <Label style={{ color: "var(--chayong-text)" }}>초기 인도금 / 보증금</Label>
                <div className="relative">
                  <Input
                    type="number"
                    placeholder="없으면 0"
                    value={form.initialCost ?? ""}
                    onChange={(e) => patch({ initialCost: e.target.value ? Number(e.target.value) : undefined })}
                    className="pr-8"
                  />
                  <span
                    className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm"
                    style={{ color: "var(--chayong-text-caption)" }}
                  >
                    원
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 6: 사진 업로드 */}
        {step === 6 && (
          <div className="flex flex-col gap-6">
            <div>
              <h1 className="text-2xl font-bold" style={{ color: "var(--chayong-text)" }}>
                차량 사진을 올려주세요
              </h1>
              <p className="mt-1.5 text-sm" style={{ color: "var(--chayong-text-sub)" }}>
                12가지 각도에서 찍으면 안심마크를 받을 수 있어요
              </p>
            </div>
            <PhotoGuide
              value={form.photos}
              onChange={(photos) => patch({ photos })}
            />
          </div>
        )}

        {/* Step 7: 설명 + 제출 */}
        {step === 7 && (
          <div className="flex flex-col gap-6">
            <div>
              <h1 className="text-2xl font-bold" style={{ color: "var(--chayong-text)" }}>
                차량 설명을 입력해주세요
              </h1>
              <p className="mt-1.5 text-sm" style={{ color: "var(--chayong-text-sub)" }}>
                특이사항, 옵션, 승계 사유 등을 적으면 신뢰도가 올라가요
              </p>
            </div>
            <Textarea
              placeholder="차량 상태, 특이사항 등을 자유롭게 입력해 주세요."
              rows={5}
              value={form.description}
              onChange={(e) => patch({ description: e.target.value })}
            />
          </div>
        )}
      </div>

      <StickyFooter
        onPrev={prev}
        onNext={step === TOTAL_STEPS - 1 ? handleSubmit : next}
        canPrev={step > 0}
        canNext={canNext()}
        isLast={step === TOTAL_STEPS - 1}
      />
    </div>
  );
}

function ProgressBar({ current, total }: { current: number; total: number }) {
  const pct = ((current + 1) / total) * 100;
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm font-semibold tabular-nums">
        {current + 1}/{total}
      </span>
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-[var(--chayong-surface)]">
        <div
          className="h-full bg-[var(--chayong-primary)] transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function StickyFooter({
  onPrev,
  onNext,
  canPrev,
  canNext,
  isLast,
}: {
  onPrev: () => void;
  onNext: () => void;
  canPrev: boolean;
  canNext: boolean;
  isLast: boolean;
}) {
  return (
    <div className="fixed inset-x-0 bottom-0 border-t bg-white p-3">
      <div className="mx-auto flex max-w-2xl gap-2">
        <button
          type="button"
          disabled={!canPrev}
          onClick={onPrev}
          className="h-12 rounded-xl border px-4 font-semibold disabled:opacity-40"
          style={{ borderColor: "var(--chayong-border)", color: "var(--chayong-text)" }}
        >
          이전
        </button>
        <button
          type="button"
          disabled={!canNext}
          onClick={onNext}
          className="h-12 flex-1 rounded-xl font-semibold text-white disabled:opacity-50"
          style={{ backgroundColor: "var(--chayong-primary)" }}
        >
          {isLast ? "등록하기" : "다음"}
        </button>
      </div>
    </div>
  );
}
