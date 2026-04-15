"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type SerializedListing = {
  id: string;
  status: string;
  type: string;
  isVerified: boolean;
  brand: string | null;
  model: string | null;
  year: number | null;
  trim: string | null;
  color: string | null;
  plateNumber: string | null;
  fuelType: string | null;
  transmission: string | null;
  seatingCapacity: number | null;
  mileage: number | null;
  vin: string | null;
  displacement: number | null;
  bodyType: string | null;
  drivetrain: string | null;
  plateType: string | null;
  options: string[];
  description: string | null;
  accidentCount: number | null;
  ownerCount: number | null;
  exteriorGrade: string | null;
  interiorGrade: string | null;
  mileageVerified: boolean;
  registrationRegion: string | null;
  [key: string]: unknown;
};

const STATUS_OPTIONS = [
  { value: "DRAFT", label: "임시저장" },
  { value: "PENDING", label: "승인대기" },
  { value: "ACTIVE", label: "활성" },
  { value: "RESERVED", label: "예약" },
  { value: "SOLD", label: "판매완료" },
  { value: "HIDDEN", label: "숨김" },
];

const FUEL_OPTIONS = [
  { value: "", label: "선택" },
  { value: "GASOLINE", label: "가솔린" },
  { value: "DIESEL", label: "디젤" },
  { value: "HYBRID", label: "하이브리드" },
  { value: "PHEV", label: "PHEV" },
  { value: "EV", label: "전기" },
  { value: "HYDROGEN", label: "수소" },
  { value: "LPG", label: "LPG" },
];

const TRANSMISSION_OPTIONS = [
  { value: "", label: "선택" },
  { value: "AUTO", label: "자동" },
  { value: "MANUAL", label: "수동" },
  { value: "CVT", label: "CVT" },
  { value: "DCT", label: "DCT" },
];

const BODY_TYPE_OPTIONS = [
  { value: "", label: "선택" },
  { value: "SEDAN", label: "세단" },
  { value: "SUV", label: "SUV" },
  { value: "HATCH", label: "해치백" },
  { value: "COUPE", label: "쿠페" },
  { value: "WAGON", label: "왜건" },
  { value: "VAN", label: "밴" },
  { value: "TRUCK", label: "트럭" },
  { value: "CONVERTIBLE", label: "컨버터블" },
];

const DRIVETRAIN_OPTIONS = [
  { value: "", label: "선택" },
  { value: "FF", label: "전륜(FF)" },
  { value: "FR", label: "후륜(FR)" },
  { value: "AWD", label: "AWD" },
  { value: "FOURWD", label: "4WD" },
];

const PLATE_TYPE_OPTIONS = [
  { value: "", label: "선택" },
  { value: "PRIVATE", label: "자가용" },
  { value: "COMMERCIAL", label: "영업용" },
];

const GRADE_OPTIONS = [
  { value: "", label: "선택" },
  { value: "A", label: "A (양호)" },
  { value: "B", label: "B (보통)" },
  { value: "C", label: "C (미흡)" },
];

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label
        className="text-xs font-medium"
        style={{ color: "var(--chayong-text-sub)" }}
      >
        {label}
      </label>
      {children}
    </div>
  );
}

const inputClass =
  "h-10 w-full rounded-lg border px-3 text-sm outline-none transition-colors focus:ring-2";
const inputStyle = {
  borderColor: "var(--chayong-divider)",
  color: "var(--chayong-text)",
  backgroundColor: "var(--chayong-bg)",
} as React.CSSProperties;

export function ListingEditForm({ listing }: { listing: SerializedListing }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [form, setForm] = useState({
    status: listing.status,
    isVerified: listing.isVerified,
    brand: listing.brand ?? "",
    model: listing.model ?? "",
    year: listing.year ?? "",
    trim: listing.trim ?? "",
    color: listing.color ?? "",
    plateNumber: listing.plateNumber ?? "",
    fuelType: listing.fuelType ?? "",
    transmission: listing.transmission ?? "",
    seatingCapacity: listing.seatingCapacity ?? "",
    mileage: listing.mileage ?? "",
    vin: listing.vin ?? "",
    displacement: listing.displacement ?? "",
    bodyType: listing.bodyType ?? "",
    drivetrain: listing.drivetrain ?? "",
    plateType: listing.plateType ?? "",
    options: listing.options.join(", "),
    description: listing.description ?? "",
    accidentCount: listing.accidentCount ?? "",
    ownerCount: listing.ownerCount ?? "",
    exteriorGrade: listing.exteriorGrade ?? "",
    interiorGrade: listing.interiorGrade ?? "",
    mileageVerified: listing.mileageVerified,
    registrationRegion: listing.registrationRegion ?? "",
  });

  const set = (key: string, value: string | boolean) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);

    const toNum = (v: string | number) =>
      v === "" || v === null ? null : Number(v);
    const toNullStr = (v: string) => (v === "" ? null : v);

    const payload = {
      status: form.status,
      isVerified: form.isVerified,
      brand: toNullStr(form.brand),
      model: toNullStr(form.model),
      year: toNum(form.year),
      trim: toNullStr(form.trim),
      color: toNullStr(form.color),
      plateNumber: toNullStr(form.plateNumber),
      fuelType: toNullStr(form.fuelType),
      transmission: toNullStr(form.transmission),
      seatingCapacity: toNum(form.seatingCapacity),
      mileage: toNum(form.mileage),
      vin: toNullStr(form.vin),
      displacement: toNum(form.displacement),
      bodyType: toNullStr(form.bodyType),
      drivetrain: toNullStr(form.drivetrain),
      plateType: toNullStr(form.plateType),
      options: form.options
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      description: toNullStr(form.description),
      accidentCount: toNum(form.accidentCount),
      ownerCount: toNum(form.ownerCount),
      exteriorGrade: toNullStr(form.exteriorGrade),
      interiorGrade: toNullStr(form.interiorGrade),
      mileageVerified: form.mileageVerified,
      registrationRegion: toNullStr(form.registrationRegion),
    };

    try {
      const res = await fetch(`/api/admin/listings/${listing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "저장에 실패했습니다.");
      }

      setSuccess(true);
      router.refresh();
      setTimeout(() => setSuccess(false), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "저장에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  };

  const renderInput = (
    key: string,
    type = "text",
    extra?: Record<string, unknown>
  ) => (
    <input
      type={type}
      value={String(form[key as keyof typeof form] ?? "")}
      onChange={(e) => set(key, e.target.value)}
      className={inputClass}
      style={inputStyle}
      {...extra}
    />
  );

  const renderSelect = (
    key: string,
    options: { value: string; label: string }[]
  ) => (
    <select
      value={String(form[key as keyof typeof form] ?? "")}
      onChange={(e) => set(key, e.target.value)}
      className={inputClass}
      style={inputStyle}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* 상태 관리 */}
      <div
        className="flex items-center gap-4 rounded-xl border p-4"
        style={{
          borderColor: "var(--chayong-divider)",
          backgroundColor: "var(--chayong-surface)",
        }}
      >
        <Field label="상태">{renderSelect("status", STATUS_OPTIONS)}</Field>
        <label
          className="flex items-center gap-2 text-sm"
          style={{ color: "var(--chayong-text)" }}
        >
          <input
            type="checkbox"
            checked={form.isVerified}
            onChange={(e) => set("isVerified", e.target.checked)}
            className="h-4 w-4 rounded"
          />
          안심매물
        </label>
      </div>

      {/* 차량 기본 정보 */}
      <details
        open
        className="rounded-xl border"
        style={{ borderColor: "var(--chayong-divider)" }}
      >
        <summary
          className="cursor-pointer px-4 py-3 text-sm font-semibold"
          style={{ color: "var(--chayong-text)" }}
        >
          차량 기본 정보
        </summary>
        <div className="grid grid-cols-1 gap-4 px-4 pb-4 sm:grid-cols-2">
          <Field label="브랜드">{renderInput("brand")}</Field>
          <Field label="모델">{renderInput("model")}</Field>
          <Field label="연식">{renderInput("year", "number")}</Field>
          <Field label="트림">{renderInput("trim")}</Field>
          <Field label="색상">{renderInput("color")}</Field>
          <Field label="차량번호">{renderInput("plateNumber")}</Field>
          <Field label="연료">{renderSelect("fuelType", FUEL_OPTIONS)}</Field>
          <Field label="변속기">
            {renderSelect("transmission", TRANSMISSION_OPTIONS)}
          </Field>
          <Field label="인승">
            {renderInput("seatingCapacity", "number")}
          </Field>
          <Field label="주행거리(km)">{renderInput("mileage", "number")}</Field>
        </div>
      </details>

      {/* 확장 정보 */}
      <details
        className="rounded-xl border"
        style={{ borderColor: "var(--chayong-divider)" }}
      >
        <summary
          className="cursor-pointer px-4 py-3 text-sm font-semibold"
          style={{ color: "var(--chayong-text)" }}
        >
          확장 정보
        </summary>
        <div className="grid grid-cols-1 gap-4 px-4 pb-4 sm:grid-cols-2">
          <Field label="VIN (17자)">
            {renderInput("vin", "text", { maxLength: 17 })}
          </Field>
          <Field label="배기량(cc)">
            {renderInput("displacement", "number")}
          </Field>
          <Field label="차종">
            {renderSelect("bodyType", BODY_TYPE_OPTIONS)}
          </Field>
          <Field label="구동방식">
            {renderSelect("drivetrain", DRIVETRAIN_OPTIONS)}
          </Field>
          <Field label="차량용도">
            {renderSelect("plateType", PLATE_TYPE_OPTIONS)}
          </Field>
          <div className="sm:col-span-2">
            <Field label="옵션 (쉼표 구분)">
              <input
                type="text"
                value={form.options}
                onChange={(e) => set("options", e.target.value)}
                className={inputClass}
                style={inputStyle}
                placeholder="파노라마 선루프, HUD, 통풍시트"
              />
            </Field>
          </div>
          <div className="sm:col-span-2">
            <Field label="설명">
              <textarea
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
                className="w-full rounded-lg border px-3 py-2 text-sm outline-none transition-colors focus:ring-2"
                style={inputStyle}
                rows={4}
              />
            </Field>
          </div>
        </div>
      </details>

      {/* 신뢰 정보 */}
      <details
        className="rounded-xl border"
        style={{ borderColor: "var(--chayong-divider)" }}
      >
        <summary
          className="cursor-pointer px-4 py-3 text-sm font-semibold"
          style={{ color: "var(--chayong-text)" }}
        >
          신뢰 정보
        </summary>
        <div className="grid grid-cols-1 gap-4 px-4 pb-4 sm:grid-cols-2">
          <Field label="사고 횟수">
            {renderInput("accidentCount", "number")}
          </Field>
          <Field label="소유자 수">
            {renderInput("ownerCount", "number")}
          </Field>
          <Field label="외관 등급">
            {renderSelect("exteriorGrade", GRADE_OPTIONS)}
          </Field>
          <Field label="내장 등급">
            {renderSelect("interiorGrade", GRADE_OPTIONS)}
          </Field>
          <Field label="등록 지역">
            {renderInput("registrationRegion")}
          </Field>
          <label
            className="flex items-center gap-2 text-sm"
            style={{ color: "var(--chayong-text)" }}
          >
            <input
              type="checkbox"
              checked={form.mileageVerified}
              onChange={(e) => set("mileageVerified", e.target.checked)}
              className="h-4 w-4 rounded"
            />
            주행거리 검증됨
          </label>
        </div>
      </details>

      {/* 액션 */}
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={saving}
          className="h-12 rounded-xl px-8 text-[15px] font-semibold text-white transition-colors disabled:opacity-50"
          style={{ backgroundColor: "var(--chayong-primary)" }}
        >
          {saving ? "저장 중..." : "저장"}
        </button>
        {success && (
          <span
            className="text-sm font-medium"
            style={{ color: "var(--chayong-success)" }}
          >
            저장되었습니다
          </span>
        )}
        {error && (
          <span
            className="text-sm font-medium"
            style={{ color: "var(--chayong-danger)" }}
          >
            {error}
          </span>
        )}
      </div>
    </form>
  );
}
