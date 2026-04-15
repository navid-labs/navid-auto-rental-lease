import Image from "next/image";
import Link from "next/link";
import type { Listing, ListingImage, FuelType, Transmission } from "@prisma/client";

type ListingForCompare = Listing & {
  images: ListingImage[];
};

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

interface CompareTableProps {
  listings: ListingForCompare[];
}

function getMinIndex(values: (number | null | undefined)[]): number {
  const nums = values.map((v, i) => ({ v, i })).filter((x) => x.v != null) as { v: number; i: number }[];
  if (nums.length === 0) return -1;
  return nums.reduce((min, cur) => (cur.v < min.v ? cur : min)).i;
}

function fmt(n: number | null | undefined): string {
  if (n == null) return "-";
  return n.toLocaleString("ko-KR");
}

function fmtWon(n: number | null | undefined): string {
  if (n == null) return "-";
  return `${(n / 10000).toLocaleString("ko-KR")}만원`;
}

interface RowProps {
  label: string;
  values: (string | null | undefined)[];
  highlightIndex?: number;
}

function CompareRow({ label, values, highlightIndex = -1 }: RowProps) {
  return (
    <tr className="border-b" style={{ borderColor: "var(--chayong-divider)" }}>
      <td
        className="w-28 py-3 pl-4 pr-2 text-xs font-medium"
        style={{ color: "var(--chayong-text-sub)" }}
      >
        {label}
      </td>
      {values.map((v, i) => (
        <td
          key={i}
          className="py-3 text-center text-sm font-semibold"
          style={{
            color:
              i === highlightIndex
                ? "var(--chayong-primary)"
                : "var(--chayong-text)",
          }}
        >
          {v ?? "-"}
        </td>
      ))}
      {/* Fill empty columns when fewer than 3 listings */}
      {Array.from({ length: 3 - values.length }).map((_, i) => (
        <td key={`empty-${i}`} className="py-3 text-center text-sm" style={{ color: "var(--chayong-text-caption)" }}>
          -
        </td>
      ))}
    </tr>
  );
}

export function CompareTable({ listings }: CompareTableProps) {
  const monthlyPayments = listings.map((l) => l.monthlyPayment);
  const initialCosts = listings.map((l) => l.initialCost);
  const mileages = listings.map((l) => l.mileage);

  const minMonthlyIdx = getMinIndex(monthlyPayments);
  const minInitialIdx = getMinIndex(initialCosts);
  const minMileageIdx = getMinIndex(mileages);

  return (
    <div className="overflow-x-auto rounded-xl border" style={{ borderColor: "var(--chayong-border)" }}>
      <table className="w-full min-w-[480px] border-collapse">
        <thead>
          <tr className="border-b" style={{ borderColor: "var(--chayong-divider)", backgroundColor: "var(--chayong-surface)" }}>
            <th className="w-28 py-4 pl-4 pr-2 text-left text-xs font-medium" style={{ color: "var(--chayong-text-caption)" }}>
              항목
            </th>
            {listings.map((l) => {
              const thumb = l.images.find((img) => img.isPrimary)?.url ?? l.images[0]?.url;
              return (
                <th key={l.id} className="py-4 text-center">
                  <Link href={`/detail/${l.id}`} className="group flex flex-col items-center gap-2">
                    <div className="h-16 w-24 overflow-hidden rounded-lg bg-[var(--chayong-surface)]">
                      {thumb ? (
                        <Image
                          src={thumb}
                          alt={`${l.brand} ${l.model}`}
                          width={96}
                          height={64}
                          className="h-full w-full object-cover transition-opacity group-hover:opacity-80"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-[10px]" style={{ color: "var(--chayong-text-caption)" }}>
                          이미지 없음
                        </div>
                      )}
                    </div>
                    <span className="text-xs font-semibold group-hover:underline" style={{ color: "var(--chayong-text)" }}>
                      {l.brand} {l.model}
                    </span>
                  </Link>
                </th>
              );
            })}
            {/* Empty header columns */}
            {Array.from({ length: 3 - listings.length }).map((_, i) => (
              <th key={`empty-head-${i}`} className="py-4 text-center">
                <div
                  className="mx-auto flex h-16 w-24 items-center justify-center rounded-lg border-2 border-dashed"
                  style={{ borderColor: "var(--chayong-border)" }}
                >
                  <span className="text-xs" style={{ color: "var(--chayong-text-caption)" }}>추가하기</span>
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <CompareRow
            label="월 납입금"
            values={listings.map((l) => (l.monthlyPayment ? `${fmtWon(l.monthlyPayment)}/월` : "-"))}
            highlightIndex={minMonthlyIdx}
          />
          <CompareRow
            label="초기비용"
            values={listings.map((l) => fmtWon(l.initialCost))}
            highlightIndex={minInitialIdx}
          />
          <CompareRow
            label="잔여개월"
            values={listings.map((l) => (l.remainingMonths ? `${l.remainingMonths}개월` : "-"))}
          />
          <CompareRow
            label="연식"
            values={listings.map((l) => (l.year ? `${l.year}년` : "-"))}
          />
          <CompareRow
            label="주행거리"
            values={listings.map((l) => (l.mileage ? `${fmt(l.mileage)}km` : "-"))}
            highlightIndex={minMileageIdx}
          />
          <CompareRow
            label="연료"
            values={listings.map((l) => (l.fuelType ? FUEL_LABEL[l.fuelType] : "-"))}
          />
          <CompareRow
            label="변속기"
            values={listings.map((l) => (l.transmission ? TRANS_LABEL[l.transmission] : "-"))}
          />
          <CompareRow
            label="사고이력"
            values={listings.map((l) => {
              if (l.accidentCount == null) return "-";
              return l.accidentCount === 0 ? "무사고" : `${l.accidentCount}회`;
            })}
          />
          <CompareRow
            label="옵션"
            values={listings.map((l) =>
              l.options.length > 0 ? l.options.slice(0, 3).join(", ") + (l.options.length > 3 ? ` 외 ${l.options.length - 3}개` : "") : "-"
            )}
          />
        </tbody>
      </table>
    </div>
  );
}
