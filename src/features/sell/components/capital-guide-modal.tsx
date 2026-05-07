"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, FileText, Route } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CAPITAL_COMPANIES } from "@/lib/capital/companies";

type CapitalGuideModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  capitalCompanySlug?: string | null;
  onAcknowledge: () => void | Promise<void>;
};

const GENERAL_GUIDE = {
  name: "캐피탈사",
  transferSteps: [
    "매도자가 계약 중인 캐피탈사에 승계 가능 여부를 확인합니다.",
    "구매자가 캐피탈사 승계 심사에 필요한 정보를 제출합니다.",
    "캐피탈사가 구매자 신용과 잔여 계약 조건을 심사합니다.",
    "승인 후 수수료, 미납금, 보증금 등 정산 조건을 확인합니다.",
    "승계 약정과 자동차등록증 명의 변경 절차를 완료합니다.",
  ],
  transferDocs: ["신분증", "자동차등록증", "리스/렌트 계약서", "승계 신청서", "소득 또는 재직 증빙"],
  cautions: ["캐피탈사에 직접 문의 권장", "승계 승인 전 차량 인도나 정산 확정을 피하세요.", "공식 승인 문서와 변경된 자동차등록증을 보관하세요."],
};

export function CapitalGuideModal({
  open,
  onOpenChange,
  capitalCompanySlug,
  onAcknowledge,
}: CapitalGuideModalProps) {
  const [checked, setChecked] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const guide = useMemo(
    () =>
      CAPITAL_COMPANIES.find((company) => company.slug === capitalCompanySlug) ??
      GENERAL_GUIDE,
    [capitalCompanySlug],
  );

  const handleAcknowledge = async () => {
    if (!checked || submitting) {
      return;
    }

    setSubmitting(true);
    try {
      await onAcknowledge();
      onOpenChange(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{guide.name} 승계 가이드</DialogTitle>
          <DialogDescription>
            캐피탈사 승계 심사는 매도자와 구매자가 직접 진행합니다. 차용은 거래
            전 확인해야 할 절차와 서류를 안내합니다.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-5">
          <section>
            <h3
              className="mb-3 flex items-center gap-2 text-sm font-semibold"
              style={{ color: "var(--chayong-text)" }}
            >
              <Route size={16} style={{ color: "var(--chayong-primary)" }} />
              절차
            </h3>
            <ol className="grid gap-2">
              {guide.transferSteps.map((step, index) => (
                <li key={step} className="flex gap-3 text-sm">
                  <span
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold"
                    style={{
                      backgroundColor: "var(--chayong-primary-light)",
                      color: "var(--chayong-primary)",
                    }}
                  >
                    {index + 1}
                  </span>
                  <span
                    className="pt-0.5 leading-relaxed"
                    style={{ color: "var(--chayong-text)" }}
                  >
                    {step}
                  </span>
                </li>
              ))}
            </ol>
          </section>

          <section>
            <h3
              className="mb-3 flex items-center gap-2 text-sm font-semibold"
              style={{ color: "var(--chayong-text)" }}
            >
              <FileText size={16} style={{ color: "var(--chayong-primary)" }} />
              필요 서류
            </h3>
            <div className="grid gap-2 sm:grid-cols-2">
              {guide.transferDocs.map((document) => (
                <div
                  key={document}
                  className="rounded-lg border px-3 py-2 text-sm"
                  style={{
                    borderColor: "var(--chayong-divider)",
                    color: "var(--chayong-text)",
                  }}
                >
                  {document}
                </div>
              ))}
            </div>
          </section>

          <section>
            <h3
              className="mb-3 flex items-center gap-2 text-sm font-semibold"
              style={{ color: "var(--chayong-text)" }}
            >
              <AlertTriangle
                size={16}
                style={{ color: "var(--chayong-warning)" }}
              />
              주의사항
            </h3>
            <ul className="grid gap-2">
              {guide.cautions.map((caution) => (
                <li key={caution} className="flex gap-2 text-sm">
                  <CheckCircle2
                    className="mt-0.5 shrink-0"
                    size={15}
                    style={{ color: "var(--chayong-primary)" }}
                  />
                  <span
                    className="leading-relaxed"
                    style={{ color: "var(--chayong-text)" }}
                  >
                    {caution}
                  </span>
                </li>
              ))}
            </ul>
          </section>

          <label
            className="flex gap-3 rounded-lg border p-3 text-sm"
            style={{ borderColor: "var(--chayong-divider)" }}
          >
            <Checkbox
              checked={checked}
              onCheckedChange={(value) => setChecked(value === true)}
            />
            <span
              className="leading-relaxed"
              style={{ color: "var(--chayong-text)" }}
            >
              캐피탈사 승계 심사와 명의 변경은 당사자가 직접 진행해야 하며,
              캐피탈사 승인 전 거래 확정을 피해야 함을 확인했습니다.
            </span>
          </label>
        </div>

        <DialogFooter>
          <Button
            type="button"
            disabled={!checked || submitting}
            onClick={handleAcknowledge}
          >
            동의하고 계속
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
