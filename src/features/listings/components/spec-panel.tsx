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
  tone?: "neutral" | "success" | "accent";
}

interface SpecSection {
  title: string;
  description: string;
  rows: SpecRow[];
}

function filterRows(rows: SpecRow[]): SpecRow[] {
  return rows.filter((row) => row.value != null);
}

function buildRows(props: SpecPanelProps): SpecSection[] {
  const sections: SpecSection[] = [
    {
      title: "차량 기본",
      description: "연식, 주행거리, 연료와 구동 정보를 한 번에 확인합니다.",
      rows: filterRows([
        {
          label: "연식",
          value: props.year ? `${props.year}년` : null,
        },
        {
          label: "주행거리",
          value:
            props.mileage != null
              ? `${props.mileage.toLocaleString("ko-KR")} km`
              : null,
          tone: props.mileageVerified ? "success" : "neutral",
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
                ? "전기차"
                : null,
        },
        {
          label: "색상",
          value: props.color ?? null,
        },
      ]),
    },
    {
      title: "상태·검수",
      description: "주행거리 인증, 사고 이력, 외장·내장 등급을 묶어서 보여줍니다.",
      rows: filterRows([
        {
          label: "주행거리 인증",
          value: props.mileageVerified ? "인증됨" : "미인증",
          tone: props.mileageVerified ? "success" : "neutral",
        },
        {
          label: "사고 이력",
          value:
            props.accidentCount == null
              ? "확인 필요"
              : props.accidentCount === 0
                ? "무사고"
                : `사고이력 ${props.accidentCount}건`,
          tone: props.accidentCount === 0 ? "success" : "neutral",
        },
        {
          label: "외장 상태",
          value: props.exteriorGrade ? GRADE_LABEL[props.exteriorGrade] : null,
          tone: props.exteriorGrade ? "accent" : "neutral",
        },
        {
          label: "내장 상태",
          value: props.interiorGrade ? GRADE_LABEL[props.interiorGrade] : null,
          tone: props.interiorGrade ? "accent" : "neutral",
        },
      ]),
    },
    {
      title: "계약 조건",
      description: "리스·렌트 계약의 남은 조건과 운영 한도를 확인합니다.",
      rows: filterRows([
        {
          label: "캐피탈사",
          value: props.capitalCompany ?? null,
        },
        {
          label: "잔여 개월",
          value: props.remainingMonths != null ? `${props.remainingMonths}개월` : null,
          tone: props.remainingMonths != null ? "accent" : "neutral",
        },
        {
          label: "주행 한도",
          value:
            props.mileageLimit != null
              ? `월 ${props.mileageLimit.toLocaleString("ko-KR")} km`
              : null,
        },
      ]),
    },
  ];

  return sections.filter((section) => section.rows.length > 0);
}

// ─── Component ────────────────────────────────────────────────────────────────

const ROW_TONE_CLASSES: Record<
  NonNullable<SpecRow["tone"]>,
  string
> = {
  neutral: "border-[color:var(--chayong-divider)] bg-white",
  success:
    "border-[var(--chayong-success)]/20 bg-[var(--chayong-success)]/8",
  accent:
    "border-[color:color-mix(in_srgb,var(--chayong-primary)_24%,white)] bg-[color:color-mix(in_srgb,var(--chayong-primary)_8%,white)]",
};

const VALUE_TONE_CLASSES: Record<
  NonNullable<SpecRow["tone"]>,
  string
> = {
  neutral: "text-[color:var(--chayong-text)]",
  success: "text-[color:var(--chayong-success)]",
  accent: "text-[color:var(--chayong-primary)]",
};

interface SummaryToken {
  label: string;
  tone: NonNullable<SpecRow["tone"]>;
}

function buildSummaryTokens(props: SpecPanelProps): SummaryToken[] {
  const tokens: SummaryToken[] = [];

  if (props.mileageVerified) tokens.push({ label: "주행거리 인증", tone: "success" });
  if (props.accidentCount === 0) tokens.push({ label: "무사고", tone: "success" });
  if (props.exteriorGrade) tokens.push({ label: `외장 ${GRADE_LABEL[props.exteriorGrade]}`, tone: "accent" });
  if (props.interiorGrade) tokens.push({ label: `내장 ${GRADE_LABEL[props.interiorGrade]}`, tone: "accent" });

  return tokens;
}

export function SpecPanel(props: SpecPanelProps) {
  const rows = buildRows(props);

  if (rows.length === 0) return null;

  const summaryTokens = buildSummaryTokens(props);
  const summaryText =
    summaryTokens.length > 0
      ? summaryTokens.map(({ label }) => label).join(" · ")
      : "차량 핵심 정보를 빠르게 확인";

  return (
    <section aria-label="차량 스펙" className="space-y-3">
      <div
        className="overflow-hidden rounded-2xl border bg-[color:var(--chayong-surface)]"
        style={{ borderColor: "var(--chayong-border)" }}
      >
        <div className="grid gap-px bg-[color:var(--chayong-divider)]">
          <div className="bg-white px-4 py-4 sm:px-5">
            <div className="flex flex-col gap-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="text-base font-semibold leading-6" style={{ color: "var(--chayong-text)" }}>
                    차량 스펙
                  </h2>
                  <p
                    className="mt-1 text-sm leading-5"
                    style={{ color: "var(--chayong-text-caption)" }}
                  >
                    {summaryText}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <span
                    className="inline-flex max-w-full items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold leading-none"
                    style={{
                      borderColor: "color-mix(in srgb, var(--chayong-primary) 26%, white)",
                      backgroundColor: "color-mix(in srgb, var(--chayong-primary) 8%, white)",
                      color: "var(--chayong-primary)",
                    }}
                  >
                    상세 확인
                  </span>
                  <span
                    className="inline-flex max-w-full items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold leading-none"
                    style={{
                      borderColor: "var(--chayong-divider)",
                      backgroundColor: "var(--chayong-surface)",
                      color: "var(--chayong-text-caption)",
                    }}
                  >
                    {rows.reduce((count, section) => count + section.rows.length, 0)}개 항목
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {summaryTokens.length > 0 ? (
                  summaryTokens.map(({ label, tone }, index) => (
                    <span
                      key={`${tone}-${index}-${label}`}
                      className="inline-flex max-w-full items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold leading-none"
                      style={
                        tone === "success"
                          ? {
                              borderColor: "color-mix(in srgb, var(--chayong-success) 22%, white)",
                              backgroundColor: "color-mix(in srgb, var(--chayong-success) 8%, white)",
                              color: "var(--chayong-success)",
                            }
                          : {
                              borderColor: "color-mix(in srgb, var(--chayong-primary) 20%, white)",
                              backgroundColor: "color-mix(in srgb, var(--chayong-primary) 8%, white)",
                              color: "var(--chayong-primary)",
                            }
                      }
                    >
                      {label}
                    </span>
                  ))
                ) : (
                  <span
                    className="inline-flex max-w-full items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold leading-none"
                    style={{
                      borderColor: "var(--chayong-divider)",
                      backgroundColor: "var(--chayong-surface)",
                      color: "var(--chayong-text-caption)",
                    }}
                  >
                    검수 정보 준비 중
                  </span>
                )}
              </div>
            </div>
          </div>

          {rows.map((section, sectionIndex) => (
            <div key={section.title} className="bg-white px-4 py-4 sm:px-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3
                    className="text-sm font-semibold leading-5"
                    style={{ color: "var(--chayong-text)" }}
                  >
                    {section.title}
                  </h3>
                  <p
                    className="mt-1 text-xs leading-5"
                    style={{ color: "var(--chayong-text-caption)" }}
                  >
                    {section.description}
                  </p>
                </div>

                <span
                  className="inline-flex shrink-0 items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold leading-none"
                  style={{
                    borderColor:
                      sectionIndex === 1
                        ? "color-mix(in srgb, var(--chayong-primary) 22%, white)"
                        : "var(--chayong-divider)",
                    backgroundColor:
                      sectionIndex === 1
                        ? "color-mix(in srgb, var(--chayong-primary) 8%, white)"
                        : "var(--chayong-surface)",
                    color:
                      sectionIndex === 1
                        ? "var(--chayong-primary)"
                        : "var(--chayong-text-caption)",
                  }}
                >
                  {section.rows.length}개
                </span>
              </div>

              <div
                className={`mt-4 grid gap-3 ${
                  section.title === "차량 기본"
                    ? "sm:grid-cols-2 xl:grid-cols-3"
                    : "sm:grid-cols-2"
                }`}
              >
                {section.rows.map(({ label, value, tone = "neutral" }) => (
                  <div
                    key={`${section.title}-${label}`}
                    className={`flex min-w-0 flex-col gap-2 rounded-xl border px-3 py-3 sm:px-4 ${ROW_TONE_CLASSES[tone]}`}
                  >
                    <span
                      className="text-xs font-medium leading-5"
                      style={{ color: "var(--chayong-text-caption)" }}
                    >
                      {label}
                    </span>
                    <span
                      className={`min-w-0 text-sm font-semibold leading-5 break-words ${VALUE_TONE_CLASSES[tone]}`}
                    >
                      {value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
