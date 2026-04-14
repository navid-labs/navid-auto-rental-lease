import type { Metadata } from "next";
import { MyDashboard } from "@/features/my/components/my-dashboard";
import type { ListingCardData } from "@/types";

export const metadata: Metadata = {
  title: "마이페이지",
  description: "내 매물, 찜한 매물, 거래 내역을 확인하세요.",
};

// TODO: Replace with real auth once Supabase session is wired up
async function getMockProfile() {
  return {
    name: "",
    role: "SELLER",
    listingCount: 0,
    chatCount: 0,
    activeTransactionCount: 0,
  };
}

export default async function MyPage() {
  const profile = await getMockProfile();

  // TODO: Fetch real listings and favorites after auth integration
  const myListings: never[] = [];
  const favorites: ListingCardData[] = [];

  return (
    <MyDashboard
      profile={profile}
      myListings={myListings}
      favorites={favorites}
    />
  );
}
