import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AlertTriangle, Building2, FileText, Phone, Route } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CAPITAL_COMPANIES, getCapitalCompany } from "@/lib/capital/companies";

type PageProps = {
  params: Promise<{ name: string }>;
};

export function generateStaticParams() {
  return CAPITAL_COMPANIES.map((company) => ({ name: company.slug }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { name } = await params;
  const company = getCapitalCompany(name);

  if (!company) {
    return {
      title: "캐피탈사 승계 가이드 | 차용",
    };
  }

  return {
    title: `${company.name} 승계 가이드 | 차용`,
    description: `${company.name} 차량 승계 절차와 필요 서류를 확인하세요.`,
  };
}

export default async function CapitalCompanyGuidePage({ params }: PageProps) {
  const { name } = await params;
  const company = getCapitalCompany(name);

  if (!company) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:py-14">
      <header className="mb-10 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p
            className="mb-2 text-sm font-semibold"
            style={{ color: "var(--chayong-primary)" }}
          >
            캐피탈사 승계 가이드
          </p>
          <h1
            className="text-3xl font-bold"
            style={{ color: "var(--chayong-text)" }}
          >
            {company.name}
          </h1>
          <p
            className="mt-3 max-w-2xl text-sm leading-relaxed"
            style={{ color: "var(--chayong-text-sub)" }}
          >
            차량 승계는 매도자와 구매자가 캐피탈사 심사를 직접 진행하는
            절차입니다. 차용에서는 거래 전 확인해야 할 공통 흐름과 서류를
            안내합니다.
          </p>
        </div>
        <div
          className="flex h-20 w-20 shrink-0 items-center justify-center rounded-lg border"
          style={{
            borderColor: "var(--chayong-divider)",
            backgroundColor: "var(--chayong-surface)",
          }}
          aria-label={`${company.name} 로고 placeholder`}
        >
          <Building2 size={32} style={{ color: "var(--chayong-primary)" }} />
        </div>
      </header>

      <div className="grid gap-5 lg:grid-cols-[1.35fr_0.85fr]">
        <Card className="rounded-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Route size={18} style={{ color: "var(--chayong-primary)" }} />
              승계 절차
            </CardTitle>
            <CardDescription>
              실제 필요 단계와 심사 기준은 캐피탈사 안내가 우선합니다.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ol className="grid gap-3">
              {company.transferSteps.map((step, index) => (
                <li key={step} className="flex gap-3">
                  <span
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold"
                    style={{
                      backgroundColor: "var(--chayong-primary-light)",
                      color: "var(--chayong-primary)",
                    }}
                  >
                    {index + 1}
                  </span>
                  <span
                    className="pt-1 text-sm leading-relaxed"
                    style={{ color: "var(--chayong-text)" }}
                  >
                    {step}
                  </span>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>

        <div className="grid gap-5">
          <Card className="rounded-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone size={18} style={{ color: "var(--chayong-primary)" }} />
                연락처
              </CardTitle>
              <CardDescription>사람 검수 후 공식 정보로 정정합니다.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 text-sm">
              <div>
                <div style={{ color: "var(--chayong-text-sub)" }}>전화</div>
                <div
                  className="mt-1 font-medium"
                  style={{ color: "var(--chayong-text)" }}
                >
                  {company.phone}
                </div>
              </div>
              <div>
                <div style={{ color: "var(--chayong-text-sub)" }}>웹사이트</div>
                <div
                  className="mt-1 break-all font-medium"
                  style={{ color: "var(--chayong-text)" }}
                >
                  {company.website}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle
                  size={18}
                  style={{ color: "var(--chayong-warning)" }}
                />
                주의사항
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="grid gap-2">
                {company.cautions.map((caution) => (
                  <li
                    key={caution}
                    className="text-sm leading-relaxed"
                    style={{ color: "var(--chayong-text)" }}
                  >
                    {caution}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>

        <Card className="rounded-lg lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText size={18} style={{ color: "var(--chayong-primary)" }} />
              필요 서류
            </CardTitle>
            <CardDescription>
              계약 유형과 심사 결과에 따라 추가 서류가 요청될 수 있습니다.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {company.transferDocs.map((document) => (
                <div
                  key={document}
                  className="rounded-lg border px-4 py-3 text-sm font-medium"
                  style={{
                    borderColor: "var(--chayong-divider)",
                    color: "var(--chayong-text)",
                  }}
                >
                  {document}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
