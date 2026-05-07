import { FileText } from "lucide-react";
import type { ReactElement } from "react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { formatKRW } from "@/lib/utils/format";

export type AcquisitionMethod = "OPTIONAL" | "MANDATORY" | "NONE";

export type ContractInfoCardProps = {
  capitalCompany?: string;
  contractMonths?: number;
  contractEndDate?: Date | string;
  remainingMonths?: number;
  mileageLimit?: number;
  acquisitionMethod?: AcquisitionMethod;
  residualValue?: number;
  driverMinAge?: number;
  className?: string;
};

const ACQUISITION_METHOD_LABELS: Record<AcquisitionMethod, string> = {
  OPTIONAL: "선택인수",
  MANDATORY: "의무인수",
  NONE: "인수 없음",
};

function formatContractEndDate(date: Date | string): string {
  const parsedDate = typeof date === "string" ? new Date(date) : date;
  const year = parsedDate.getFullYear();
  const month = String(parsedDate.getMonth() + 1).padStart(2, "0");

  return `${year}년 ${month}월`;
}

export function ContractInfoCard({
  capitalCompany,
  contractMonths,
  contractEndDate,
  remainingMonths,
  mileageLimit,
  acquisitionMethod,
  residualValue,
  driverMinAge,
  className,
}: ContractInfoCardProps): ReactElement | null {
  const rows = [
    capitalCompany != null ? ["계약업체", capitalCompany] : null,
    contractMonths != null ? ["계약기간", `${contractMonths}개월`] : null,
    contractEndDate != null
      ? ["계약종료", formatContractEndDate(contractEndDate)]
      : null,
    remainingMonths != null ? ["잔여개월", `${remainingMonths}개월`] : null,
    mileageLimit != null
      ? ["약정주행거리", `${mileageLimit.toLocaleString("ko-KR")}km/년`]
      : null,
    acquisitionMethod != null
      ? ["인수방법", ACQUISITION_METHOD_LABELS[acquisitionMethod]]
      : null,
    residualValue != null ? ["인수금(잔존가치)", formatKRW(residualValue)] : null,
    driverMinAge != null ? ["운전자연령", `만 ${driverMinAge}세 이상`] : null,
  ].filter((row): row is [string, string] => row !== null);

  if (rows.length === 0) {
    return null;
  }

  return (
    <Card className={cn("shadow-sm transition-shadow hover:shadow-md", className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText aria-hidden="true" className="h-4 w-4 text-muted-foreground" />
          계약 정보
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <dl className="grid grid-cols-[max-content_1fr] gap-x-4 gap-y-2 text-sm">
          {rows.map(([label, value]) => (
            <div className="contents" key={label}>
              <dt className="text-muted-foreground">{label}</dt>
              <dd className="text-right font-medium text-foreground">{value}</dd>
            </div>
          ))}
        </dl>
      </CardContent>
    </Card>
  );
}
