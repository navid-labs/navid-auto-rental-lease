import type { Metadata } from "next";
import { SellWizard } from "@/features/sell/components/sell-wizard";

export const metadata: Metadata = {
  title: "매물 등록",
  description: "간편하게 승계·리스·렌트 매물을 등록하세요.",
};

export default function SellPage() {
  return <SellWizard />;
}
