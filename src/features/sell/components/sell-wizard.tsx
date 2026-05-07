"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useWizardState } from "./use-wizard-state";
import { PlateLookup } from "./plate-lookup";
import { PhotoGuide } from "./photo-guide";
import { LivePreviewCard } from "./live-preview-card";
import type { WizardForm } from "./use-wizard-state";

const TOTAL_STEPS = 8;

const LISTING_TYPE_OPTIONS = [
  { value: "TRANSFER" as const, label: "승계", desc: "현재 진행 중인 리스·렌트 계약을 넘기고 싶을 때" },
  { value: "USED_LEASE" as const, label: "중고 리스", desc: "만기 후 차량을 리스 조건으로 다시 내놓을 때" },
  { value: "USED_RENTAL" as const, label: "중고 렌트", desc: "만기 후 차량을 렌트 조건으로 다시 내놓을 때" },
];

export interface SellWizardInitialVehicle {
  plate?: string;
  brand?: string;
  model?: string;
  year?: number;
  fuel?: WizardForm["fuel"];
}

interface SellWizardProps {
  initialVehicle?: SellWizardInitialVehicle;
  manualEntry?: boolean;
}

export function SellWizard({ initialVehicle, manualEntry = false }: SellWizardProps) {
  const router = useRouter();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const hasInitialVehicle = Boolean(
    initialVehicle?.plate ||
      initialVehicle?.brand ||
      initialVehicle?.model ||
      initialVehicle?.year ||
      initialVehicle?.fuel
  );
  const { step, form, patch, next, prev } = useWizardState({
    initialStep: hasInitialVehicle || manualEntry ? 1 : 0,
    initialForm: {
      plate: initialVehicle?.plate,
      brand: initialVehicle?.brand ?? "",
      model: initialVehicle?.model ?? "",
      year: initialVehicle?.year,
      fuel: initialVehicle?.fuel,
    },
  });

  async function handleSubmit() {
    setSubmitError(null);

    try {
      const res = await fetch("/api/listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildListingPayload(form)),
      });

      if (!res.ok) {
        const data: unknown = await res.json().catch(() => null);
        throw new Error(getListingErrorMessage(data, res.status));
      }

      const listing = await res.json();

      if (form.imageUrls.length > 0) {
        await fetch(`/api/listings/${listing.id}/images`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ urls: form.imageUrls }),
        });
      }

      router.push(`/sell/promote?listingId=${listing.id}`);
    } catch (err) {
      console.error(err);
      setSubmitError(err instanceof Error ? err.message : "등록에 실패했습니다.");
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
    if (step === 1) return form.brand.trim().length > 0 && form.model.trim().length > 0;
    if (step === 2) return form.year !== undefined;
    if (step === 3) return form.type !== undefined;
    if (step === 4) return (form.monthlyPayment ?? 0) > 0;
    if (step === 5) return (form.remainingMonths ?? 0) > 0;
    return true;
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6 pb-24">
          {manualEntry && !hasInitialVehicle && (
            <div className="rounded-xl border border-[var(--chayong-border)] bg-white p-4 text-sm font-medium text-[var(--chayong-text-sub)]">
              조회되지 않아 직접 입력합니다. 차량명과 계약 조건을 순서대로 채워주세요.
            </div>
          )}
          <ProgressBar current={step} total={TOTAL_STEPS} />

          <div className="min-h-[320px]">
        {/* Step 0: 차량번호 조회 */}
        {step === 0 && (
          <div className="flex flex-col gap-4">
            <TrustReinforcement message="입력 정보는 에스크로 시스템으로 보호되며, 검수 후 게재됩니다." />
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
            <TrustReinforcement message="입력 정보는 에스크로 시스템으로 보호되며, 검수 후 게재됩니다." />
            <div>
              <h1 className="text-2xl font-bold" style={{ color: "var(--chayong-text)" }}>
                차종을 확인해주세요
              </h1>
              <p className="mt-1.5 text-sm" style={{ color: "var(--chayong-text-sub)" }}>
                자동 조회 결과가 맞는지 확인하고, 틀린 부분만 수정하세요
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {form.plate && (
                <div className="col-span-2 flex flex-col gap-2">
                  <Label style={{ color: "var(--chayong-text)" }}>차량번호</Label>
                  <Input
                    value={form.plate}
                    onChange={(e) => patch({ plate: e.target.value })}
                  />
                </div>
              )}
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
              {form.fuel && (
                <div className="col-span-2 rounded-xl bg-[var(--chayong-surface)] px-4 py-3 text-sm font-medium text-[var(--chayong-text-sub)]">
                  조회된 연료: {formatFuel(form.fuel)}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 2: 연식 + 주행거리 */}
        {step === 2 && (
          <div className="flex flex-col gap-6">
            <TrustReinforcement message="입력 정보는 에스크로 시스템으로 보호되며, 검수 후 게재됩니다." />
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
            <TrustReinforcement message="연락처는 채팅에서 자동 차단됩니다. 오직 차용 플랫폼을 통한 안전 거래만 보호됩니다." />
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
            <TrustReinforcement message="연락처는 채팅에서 자동 차단됩니다. 오직 차용 플랫폼을 통한 안전 거래만 보호됩니다." />
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
            <TrustReinforcement message="연락처는 채팅에서 자동 차단됩니다. 오직 차용 플랫폼을 통한 안전 거래만 보호됩니다." />
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
            <TrustReinforcement message="최소 5장 이상의 실차 사진이 승인 및 안심매물 뱃지에 도움됩니다." />
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
            <TrustReinforcement message="등록 후 24시간 내 관리자 검수를 통해 게재됩니다." />
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
            {submitError && (
              <p className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-[var(--chayong-danger)]">
                {submitError}
              </p>
            )}
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

        <div className="lg:sticky lg:top-20 lg:self-start">
          <LivePreviewCard
            brand={form.brand}
            model={form.model}
            year={form.year}
            mileage={form.mileage}
            monthlyPayment={form.monthlyPayment}
            initialCost={form.initialCost}
            remainingMonths={form.remainingMonths}
          />
        </div>
      </div>
    </div>
  );
}

export function buildListingPayload(form: WizardForm) {
  const type = form.type ?? "TRANSFER";
  const common = {
    type,
    monthlyPayment: form.monthlyPayment ?? 0,
    remainingMonths: form.remainingMonths ?? 0,
    initialCost: form.initialCost ?? 0,
    brand: form.brand.trim(),
    model: form.model.trim(),
    year: form.year,
    plateNumber: form.plate || null,
    fuelType: form.fuel ?? null,
    trim: form.trim || null,
    mileage: form.mileage ?? undefined,
    color: form.color || null,
    capitalCompany: form.capitalCompany || null,
    description: form.description || null,
    options: form.options,
  };

  if (type === "TRANSFER") {
    return {
      ...common,
      type,
      transferFee: 0,
      carryoverPremium: form.initialCost ?? 0,
    };
  }

  return {
    ...common,
    type,
    deposit: form.initialCost ?? 0,
    terminationFee: 0,
    mileageLimit: null,
  };
}

function getListingErrorMessage(data: unknown, status: number) {
  if (
    data &&
    typeof data === "object" &&
    "error" in data &&
    typeof data.error === "string"
  ) {
    return `${data.error} (${status})`;
  }

  return `등록에 실패했습니다 (${status})`;
}

function formatFuel(fuel: WizardForm["fuel"]): string {
  if (fuel === "GASOLINE") return "가솔린";
  if (fuel === "DIESEL") return "디젤";
  if (fuel === "HYBRID") return "하이브리드";
  if (fuel === "EV") return "전기";
  return "";
}

function TrustReinforcement({ message }: { message: string }) {
  return (
    <div
      className="flex items-center gap-2.5 rounded-xl p-3 text-xs"
      style={{
        backgroundColor: "var(--chayong-primary-soft)",
        color: "var(--chayong-primary)",
      }}
    >
      <ShieldCheck size={16} aria-hidden="true" />
      <span className="font-medium">{message}</span>
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
    <div className="fixed inset-x-0 bottom-16 z-40 border-t bg-white p-3 md:static md:inset-auto md:bottom-auto md:border-t-0 md:px-0 md:pt-6">
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
