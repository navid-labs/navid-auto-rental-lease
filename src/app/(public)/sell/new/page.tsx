import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/supabase/auth";
import { SellNewClient } from "@/features/sell/components/sell-new-client";

export const metadata: Metadata = {
  title: "등록 정보 입력",
  description: "차량 정보와 계약 조건을 입력해 매물 등록을 완료하세요.",
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function SellNewPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const [session, params] = await Promise.all([getSession(), searchParams]);
  const manual = params.manual === "1";

  if (!session) {
    redirect("/signup?role=SELLER&redirect=/sell/new");
  }

  return <SellNewClient manualEntry={manual} />;
}
