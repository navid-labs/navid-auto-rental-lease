import type { Metadata } from "next";
import { getSession } from "@/lib/supabase/auth";
import { SellEntry } from "@/features/sell/components/sell-entry";

export const metadata: Metadata = {
  title: "내 차 등록 시작",
  description: "차량번호를 먼저 조회하고 승계·리스·렌트 매물 등록을 이어가세요.",
};

export default async function SellPage() {
  const session = await getSession();

  return <SellEntry isAuthenticated={Boolean(session)} />;
}
