import type {
  FuelType,
  Transmission,
  BodyType,
  Drivetrain,
  Grade,
} from "@prisma/client";

interface SpecPanelProps {
  year?: number | null;
  mileage?: number | null;
  fuelType?: FuelType | null;
  transmission?: Transmission | null;
  bodyType?: BodyType | null;
  drivetrain?: Drivetrain | null;
  displacement?: number | null;
  color?: string | null;
  accidentCount?: number | null;
  mileageVerified?: boolean;
  exteriorGrade?: Grade | null;
  interiorGrade?: Grade | null;
  capitalCompany?: string | null;
  remainingMonths?: number | null;
  mileageLimit?: number | null;
}

// ─── Label maps ──────────────────────────────────────────────────────────────

const FUEL_LABEL: Record<FuelType, string> = {
  GASOLINE: "가솔린",
  DIESEL: "디젤",
  HYBRID: "하이브리드",
  PHEV: "플러그인 하이브리드",
  EV: "전기",
  HYDROGEN: "수소",
  LPG: "LPG",
};

const TRANS_LABEL: Record<Transmission, string> = {
  AUTO: "자동",
  MANUAL: "수동",
  CVT: "CVT",
  DCT: "DCT",
};

const BODY_LABEL: Record<BodyType, string> = {
  SEDAN: "세단",
  SUV: "SUV",
  HATCH: "해치백",
  COUPE: "쿠페",
  WAGON: "왜건",
  VAN: "밴",
  TRUCK: "트럭",
  CONVERTIBLE: "컨버터블",
};

const DRIVE_LABEL: Record<Drivetrain, string> = {
  FF: "전륜(FF)",
  FR: "후륜(FR)",
  AWD: "상시사륜(AWD)",
  FOURWD: "파트타임 4WD",
};

const GRADE_LABEL: Record<Grade, string> = {
  A: "A등급",
  B: "B등급",
  C: "C등급",
};

// ─── Spec row ─────────────────────────────────────────────────────────────────

interface SpecRow {
  label: string;
  value: string | null | undefined;
  highlight?: boolean;
}

function buildRows(props: SpecPanelProps): SpecRow[] {
  const rows: SpecRow[] = [
    {
      label: "연식",
      value: props.year ? `${props.year}년` : null,
    },
    {
      label: "주행거리",
      value:
        props.mileage != null
          ? `${props.mileage.toLocaleString("ko-KR")} km${props.mileageVerified ? " ✓ 인증" : ""}`
          : null,
      highlight: props.mileageVerified,
    },
    {
      label: "연료",
      value: props.fuelType ? FUEL_LABEL[props.fuelType] : null,
    },
    {
      label: "변속기",
      value: props.transmission ? TRANS_LABEL[props.transmission] : null,
    },
    {
      label: "차체형태",
      value: props.bodyType ? BODY_LABEL[props.bodyType] : null,
    },
    {
      label: "구동방식",
      value: props.drivetrain ? DRIVE_LABEL[props.drivetrain] : null,
    },
    {
      label: "배기량",
      value:
        props.displacement != null && props.displacement > 0
          ? `${props.displacement.toLocaleString("ko-KR")} cc`
          : props.displacement === 0
            ? "전기차 (해당없음)"
            : null,
    },
    {
      label: "색상",
      value: props.color ?? null,
    },
    {
      label: "사고이력",
      value:
        props.accidentCount == null
          ? "확인 필요"
          : props.accidentCount === 0
            ? "무사고"
            : `사고이력 ${props.accidentCount}건`,
      highlight: props.accidentCount === 0,
    },
    {
      label: "외장 상태",
      value: props.exteriorGrade ? GRADE_LABEL[props.exteriorGrade] : null,
    },
    {
      label: "내장 상태",
      value: props.interiorGrade ? GRADE_LABEL[props.interiorGrade] : null,
    },
    {
      label: "캐피탈사",
      value: props.capitalCompany ?? null,
    },
    {
      label: "잔여 개월",
      value: props.remainingMonths != null ? `${props.remainingMonths}개월` : null,
    },
    {
      label: "주행 한도",
      value:
        props.mileageLimit != null
          ? `월 ${props.mileageLimit.toLocaleString("ko-KR")} km`
          : null,
    },
  ];

  // Filter out rows with no value
  return rows.filter((r) => r.value != null);
}

// ─── Component ────────────────────────────────────────────────────────────────

export function SpecPanel(props: SpecPanelProps) {
  const rows = buildRows(props);

  if (rows.length === 0) return null;

  return (
    <section aria-label="차량 스펙">
      <div
        className="overflow-hidden rounded-xl border"
        style={{ borderColor: "var(--chayong-border)" }}
      >
        <div
          className="px-4 py-3 text-sm font-semibold"
          style={{
            backgroundColor: "var(--chayong-surface)",
            color: "var(--chayong-text)",
            borderBottom: `1px solid var(--chayong-divider)`,
          }}
        >
          차량 스펙
        </div>

        {/* 2-column grid on sm+, 1-column on mobile */}
        <div className="grid grid-cols-1 sm:grid-cols-2">
          {rows.map(({ label, value, highlight }) => (
            <div
              key={label}
              className="flex items-center justify-between border-b px-4 py-3 last:border-b-0 sm:[&:nth-last-child(-n+2)]:border-b-0"
              style={{ borderColor: "var(--chayong-divider)" }}
            >
              <span
                className="text-xs font-medium"
                style={{ color: "var(--chayong-text-caption)" }}
              >
                {label}
              </span>
              <span
                className="text-sm font-medium tabular-nums"
                style={{
                  color: highlight
                    ? "var(--chayong-success, #00C471)"
                    : "var(--chayong-text)",
                }}
              >
                {value}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
