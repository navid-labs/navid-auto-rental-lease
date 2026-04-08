"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { StepIndicator } from "@/components/ui/step-indicator";
import { PriceDisplay } from "@/components/ui/price-display";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { checkIsVerified } from "@/lib/finance/calculations";
import { BadgeCheck, ImagePlus, ChevronRight, Tag } from "lucide-react";
import type { ListingType } from "@/types";

const STEPS = ["기본 정보", "상세 정보", "등록 확인"];

const LISTING_TYPE_OPTIONS: { value: ListingType; label: string; desc: string }[] = [
  { value: "TRANSFER", label: "승계", desc: "리스·렌트 계약 승계" },
  { value: "USED_LEASE", label: "중고 리스", desc: "만기 후 중고 리스" },
  { value: "USED_RENTAL", label: "중고 렌트", desc: "만기 후 중고 렌트" },
];

const PRESET_OPTIONS = ["파노라마 선루프", "HUD", "BOSE 사운드", "빌트인캠"];

interface FormData {
  // Step 1 — required
  type: ListingType;
  monthlyPayment: string;
  remainingMonths: string;
  initialCost: string;
  // Step 2 — optional
  brand: string;
  model: string;
  year: string;
  trim: string;
  mileage: string;
  color: string;
  capitalCompany: string;
  description: string;
  options: string[];
}

const DEFAULT_FORM: FormData = {
  type: "TRANSFER",
  monthlyPayment: "",
  remainingMonths: "",
  initialCost: "0",
  brand: "",
  model: "",
  year: "",
  trim: "",
  mileage: "",
  color: "",
  capitalCompany: "",
  description: "",
  options: [],
};

function parseNum(val: string): number {
  const n = Number(val.replace(/,/g, ""));
  return isNaN(n) ? 0 : n;
}

export function SellWizard() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [form, setForm] = useState<FormData>(DEFAULT_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 1 validation
  const isStep1Valid =
    form.type !== undefined &&
    parseNum(form.monthlyPayment) > 0 &&
    parseNum(form.remainingMonths) > 0;

  const isVerified = checkIsVerified({
    brand: form.brand || null,
    model: form.model || null,
    year: form.year ? Number(form.year) : null,
    trim: form.trim || null,
    mileage: form.mileage ? Number(form.mileage) : null,
    color: form.color || null,
    imageCount: 0, // image upload is placeholder
  });

  function setField<K extends keyof FormData>(key: K, value: FormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function toggleOption(opt: string) {
    setForm((prev) => ({
      ...prev,
      options: prev.options.includes(opt)
        ? prev.options.filter((o) => o !== opt)
        : [...prev.options, opt],
    }));
  }

  async function handleSubmit() {
    setError(null);
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          // sellerId will be filled by auth middleware later — send placeholder
          sellerId: "00000000-0000-0000-0000-000000000000",
          type: form.type,
          monthlyPayment: parseNum(form.monthlyPayment),
          remainingMonths: parseNum(form.remainingMonths),
          initialCost: parseNum(form.initialCost),
          transferFee: 0,
          brand: form.brand || null,
          model: form.model || null,
          year: form.year ? Number(form.year) : null,
          trim: form.trim || null,
          mileage: form.mileage ? Number(form.mileage) : null,
          color: form.color || null,
          description: form.description || null,
        }),
      });

      if (!res.ok) {
        throw new Error(`등록에 실패했습니다 (${res.status})`);
      }

      router.push("/my");
    } catch (err) {
      setError(err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-8">
      {/* Step Indicator */}
      <div className="mb-8 flex justify-center">
        <StepIndicator steps={STEPS} currentStep={currentStep} />
      </div>

      {/* Step 1: 기본 정보 */}
      {currentStep === 0 && (
        <div className="flex flex-col gap-6">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: "var(--chayong-text)" }}>
              간편하게 매물을 등록하기
            </h1>
            <p className="mt-1.5 text-sm" style={{ color: "var(--chayong-text-sub)" }}>
              3가지 정보만 입력하면, 빠르게 등록할 수 있어요.
            </p>
          </div>

          {/* 매물 유형 */}
          <div className="flex flex-col gap-2">
            <Label style={{ color: "var(--chayong-text)" }}>
              매물 유형 <span style={{ color: "var(--chayong-primary)" }}>*</span>
            </Label>
            <div className="grid grid-cols-3 gap-2">
              {LISTING_TYPE_OPTIONS.map(({ value, label, desc }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setField("type", value)}
                  className="flex flex-col items-center rounded-xl border px-3 py-4 text-center transition-all"
                  style={{
                    borderColor:
                      form.type === value
                        ? "var(--chayong-primary)"
                        : "var(--chayong-border)",
                    backgroundColor:
                      form.type === value
                        ? "var(--chayong-primary-light)"
                        : "var(--chayong-surface)",
                    color:
                      form.type === value
                        ? "var(--chayong-primary)"
                        : "var(--chayong-text-sub)",
                  }}
                >
                  <span className="text-sm font-bold">{label}</span>
                  <span className="mt-0.5 text-xs">{desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 월 납입금 */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="monthlyPayment" style={{ color: "var(--chayong-text)" }}>
              월 납입금 <span style={{ color: "var(--chayong-primary)" }}>*</span>
            </Label>
            <div className="relative">
              <Input
                id="monthlyPayment"
                type="number"
                placeholder="예: 450000"
                value={form.monthlyPayment}
                onChange={(e) => setField("monthlyPayment", e.target.value)}
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

          {/* 잔여 개월 수 */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="remainingMonths" style={{ color: "var(--chayong-text)" }}>
              잔여 개월 수 <span style={{ color: "var(--chayong-primary)" }}>*</span>
            </Label>
            <div className="relative">
              <Input
                id="remainingMonths"
                type="number"
                placeholder="예: 24"
                value={form.remainingMonths}
                onChange={(e) => setField("remainingMonths", e.target.value)}
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

          {/* 초기 인도금/보증금 */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="initialCost" style={{ color: "var(--chayong-text)" }}>
              초기 인도금 / 보증금
            </Label>
            <div className="relative">
              <Input
                id="initialCost"
                type="number"
                placeholder="없으면 0"
                value={form.initialCost}
                onChange={(e) => setField("initialCost", e.target.value)}
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
      )}

      {/* Step 2: 상세 정보 */}
      {currentStep === 1 && (
        <div className="flex flex-col gap-6">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: "var(--chayong-text)" }}>
              상세 정보 입력
            </h1>
            <p className="mt-1.5 text-sm" style={{ color: "var(--chayong-text-sub)" }}>
              상세 정보를 입력하면{" "}
              <span
                className="inline-flex items-center gap-0.5 font-semibold"
                style={{ color: "var(--chayong-primary)" }}
              >
                <BadgeCheck size={14} />
                안심마크
              </span>
              를 받을 수 있어요
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="brand" style={{ color: "var(--chayong-text)" }}>제조사</Label>
              <Input
                id="brand"
                placeholder="예: 현대"
                value={form.brand}
                onChange={(e) => setField("brand", e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="model" style={{ color: "var(--chayong-text)" }}>모델</Label>
              <Input
                id="model"
                placeholder="예: 아이오닉6"
                value={form.model}
                onChange={(e) => setField("model", e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="year" style={{ color: "var(--chayong-text)" }}>연식</Label>
              <Input
                id="year"
                type="number"
                placeholder="예: 2023"
                value={form.year}
                onChange={(e) => setField("year", e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="trim" style={{ color: "var(--chayong-text)" }}>트림</Label>
              <Input
                id="trim"
                placeholder="예: 롱레인지"
                value={form.trim}
                onChange={(e) => setField("trim", e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="mileage" style={{ color: "var(--chayong-text)" }}>주행거리</Label>
              <div className="relative">
                <Input
                  id="mileage"
                  type="number"
                  placeholder="예: 25000"
                  value={form.mileage}
                  onChange={(e) => setField("mileage", e.target.value)}
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
            <div className="flex flex-col gap-2">
              <Label htmlFor="color" style={{ color: "var(--chayong-text)" }}>색상</Label>
              <Input
                id="color"
                placeholder="예: 흰색"
                value={form.color}
                onChange={(e) => setField("color", e.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="capitalCompany" style={{ color: "var(--chayong-text)" }}>캐피탈사</Label>
            <Input
              id="capitalCompany"
              placeholder="예: 현대캐피탈, KB캐피탈"
              value={form.capitalCompany}
              onChange={(e) => setField("capitalCompany", e.target.value)}
            />
          </div>

          {/* 사진 업로드 placeholder */}
          <div className="flex flex-col gap-2">
            <Label style={{ color: "var(--chayong-text)" }}>사진 업로드</Label>
            <div
              className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed py-8"
              style={{
                borderColor: "var(--chayong-border)",
                backgroundColor: "var(--chayong-surface)",
              }}
            >
              <ImagePlus size={28} style={{ color: "var(--chayong-text-caption)" }} />
              <p className="text-sm" style={{ color: "var(--chayong-text-caption)" }}>
                사진 업로드 기능은 추후 추가됩니다
              </p>
            </div>
          </div>

          {/* 추가 옵션 */}
          <div className="flex flex-col gap-2">
            <Label style={{ color: "var(--chayong-text)" }}>
              <Tag size={14} className="inline mr-1" />
              추가 옵션
            </Label>
            <div className="flex flex-wrap gap-2">
              {PRESET_OPTIONS.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => toggleOption(opt)}
                  className="rounded-full border px-3 py-1 text-xs font-medium transition-all"
                  style={{
                    borderColor: form.options.includes(opt)
                      ? "var(--chayong-primary)"
                      : "var(--chayong-border)",
                    backgroundColor: form.options.includes(opt)
                      ? "var(--chayong-primary-light)"
                      : "var(--chayong-surface)",
                    color: form.options.includes(opt)
                      ? "var(--chayong-primary)"
                      : "var(--chayong-text-sub)",
                  }}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>

          {/* 차량 설명 */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="description" style={{ color: "var(--chayong-text)" }}>차량 설명</Label>
            <Textarea
              id="description"
              placeholder="차량 상태, 특이사항 등을 자유롭게 입력해 주세요."
              rows={4}
              value={form.description}
              onChange={(e) => setField("description", e.target.value)}
            />
          </div>
        </div>
      )}

      {/* Step 3: 등록 확인 */}
      {currentStep === 2 && (
        <div className="flex flex-col gap-6">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: "var(--chayong-text)" }}>
              등록 확인
            </h1>
            <p className="mt-1.5 text-sm" style={{ color: "var(--chayong-text-sub)" }}>
              이후 상세 정보는 관심 고객이 생기면 추가로 입력할 수 있어요.
            </p>
          </div>

          {/* 미리보기 카드 */}
          <div
            className="rounded-2xl border p-5"
            style={{
              borderColor: "var(--chayong-border)",
              backgroundColor: "var(--chayong-surface)",
            }}
          >
            {/* 안심마크 상태 */}
            <div className="mb-4 flex items-center gap-2">
              {isVerified ? (
                <span
                  className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold"
                  style={{
                    backgroundColor: "var(--chayong-primary-light)",
                    color: "var(--chayong-primary)",
                  }}
                >
                  <BadgeCheck size={13} />
                  안심마크 획득
                </span>
              ) : (
                <span
                  className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium"
                  style={{
                    borderColor: "var(--chayong-border)",
                    color: "var(--chayong-text-caption)",
                  }}
                >
                  안심마크 미획득 (상세 정보 입력 시 획득 가능)
                </span>
              )}
            </div>

            {/* 차량명 */}
            <p
              className="mb-1 text-lg font-bold"
              style={{ color: "var(--chayong-text)" }}
            >
              {[form.brand, form.model].filter(Boolean).join(" ") || "차량 정보 미입력"}
              {form.year && (
                <span
                  className="ml-2 text-sm font-normal"
                  style={{ color: "var(--chayong-text-sub)" }}
                >
                  {form.year}년식
                </span>
              )}
            </p>
            {form.trim && (
              <p className="mb-3 text-sm" style={{ color: "var(--chayong-text-sub)" }}>
                {form.trim}
                {form.mileage && ` · ${Number(form.mileage).toLocaleString("ko-KR")}km`}
              </p>
            )}

            <div
              className="my-4 h-px"
              style={{ backgroundColor: "var(--chayong-divider)" }}
            />

            {/* 가격 정보 */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-sm" style={{ color: "var(--chayong-text-sub)" }}>
                  월 납입금
                </span>
                {parseNum(form.monthlyPayment) > 0 ? (
                  <PriceDisplay monthlyPayment={parseNum(form.monthlyPayment)} size="md" />
                ) : (
                  <span style={{ color: "var(--chayong-text-caption)" }}>—</span>
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm" style={{ color: "var(--chayong-text-sub)" }}>
                  잔여 개월 수
                </span>
                <span className="text-sm font-semibold" style={{ color: "var(--chayong-text)" }}>
                  {form.remainingMonths ? `${form.remainingMonths}개월` : "—"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm" style={{ color: "var(--chayong-text-sub)" }}>
                  초기 인도금
                </span>
                <span className="text-sm font-semibold" style={{ color: "var(--chayong-text)" }}>
                  {parseNum(form.initialCost) > 0
                    ? `${(parseNum(form.initialCost) / 10000).toLocaleString("ko-KR")}만원`
                    : "없음"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm" style={{ color: "var(--chayong-text-sub)" }}>
                  매물 유형
                </span>
                <span className="text-sm font-semibold" style={{ color: "var(--chayong-text)" }}>
                  {LISTING_TYPE_OPTIONS.find((o) => o.value === form.type)?.label}
                </span>
              </div>
            </div>

            {/* 옵션 태그 */}
            {form.options.length > 0 && (
              <>
                <div
                  className="my-4 h-px"
                  style={{ backgroundColor: "var(--chayong-divider)" }}
                />
                <div className="flex flex-wrap gap-1.5">
                  {form.options.map((opt) => (
                    <span
                      key={opt}
                      className="rounded-full px-2.5 py-0.5 text-xs"
                      style={{
                        backgroundColor: "var(--chayong-primary-light)",
                        color: "var(--chayong-primary)",
                      }}
                    >
                      {opt}
                    </span>
                  ))}
                </div>
              </>
            )}

            {/* 설명 */}
            {form.description && (
              <>
                <div
                  className="my-4 h-px"
                  style={{ backgroundColor: "var(--chayong-divider)" }}
                />
                <p className="text-sm leading-relaxed" style={{ color: "var(--chayong-text-sub)" }}>
                  {form.description}
                </p>
              </>
            )}
          </div>

          {error && (
            <p
              className="rounded-lg px-4 py-2.5 text-sm"
              style={{
                backgroundColor: "#fee2e2",
                color: "#dc2626",
              }}
            >
              {error}
            </p>
          )}
        </div>
      )}

      {/* Navigation buttons */}
      <div className="mt-8 flex gap-3">
        {currentStep > 0 && (
          <button
            type="button"
            onClick={() => setCurrentStep((s) => s - 1)}
            className="flex-1 rounded-xl border py-3 text-sm font-semibold transition-colors"
            style={{
              borderColor: "var(--chayong-border)",
              color: "var(--chayong-text)",
              backgroundColor: "var(--chayong-bg)",
            }}
          >
            이전
          </button>
        )}

        {currentStep < 2 ? (
          <button
            type="button"
            disabled={currentStep === 0 && !isStep1Valid}
            onClick={() => setCurrentStep((s) => s + 1)}
            className="flex flex-1 items-center justify-center gap-1 rounded-xl py-3 text-sm font-semibold text-white transition-colors disabled:opacity-40"
            style={{ backgroundColor: "var(--chayong-primary)" }}
          >
            다음
            <ChevronRight size={16} />
          </button>
        ) : (
          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleSubmit}
            className="flex flex-1 items-center justify-center gap-1 rounded-xl py-3 text-sm font-semibold text-white transition-colors disabled:opacity-60"
            style={{ backgroundColor: "var(--chayong-primary)" }}
          >
            {isSubmitting ? "등록 중…" : "등록하기"}
          </button>
        )}
      </div>
    </div>
  );
}
