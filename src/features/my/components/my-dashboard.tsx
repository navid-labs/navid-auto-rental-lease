"use client";

import { useState } from "react";
import Link from "next/link";
import { VehicleCard } from "@/components/ui/vehicle-card";
import { PendingReviewsSection } from "@/features/my/components/pending-reviews-section";
import { MyListingCard } from "./my-listing-card";
import type { Listing, ListingCardData } from "@/types";
import {
  User,
  Settings,
  ChevronRight,
  MessageCircle,
  Package,
  Heart,
  ClipboardList,
  History,
  HeadphonesIcon,
  LogOut,
} from "lucide-react";

interface ProfileData {
  name: string;
  role: string;
  listingCount: number;
  chatCount: number;
  activeTransactionCount: number;
}

interface MyDashboardProps {
  profile: ProfileData;
  myListings: Pick<
    Listing,
    "id" | "brand" | "model" | "year" | "monthlyPayment" | "status" | "createdAt"
  >[];
  favorites?: ListingCardData[];
}

const TABS = ["내 매물", "찜한 매물", "거래 내역"] as const;
type Tab = (typeof TABS)[number];

const ROLE_LABEL: Record<string, string> = {
  SELLER: "판매자",
  BUYER: "구매자",
  DEALER: "딜러",
  ADMIN: "관리자",
};

const MENU_ITEMS = [
  { icon: Package, label: "내 매물 관리", href: "#" },
  { icon: Heart, label: "찜한 매물", href: "#" },
  { icon: MessageCircle, label: "채팅 내역", href: "#" },
  { icon: History, label: "거래 내역", href: "#" },
  { icon: ClipboardList, label: "계정 설정", href: "#" },
  { icon: HeadphonesIcon, label: "고객센터", href: "#" },
  { icon: LogOut, label: "로그아웃", href: "#" },
] as const;

export function MyDashboard({ profile, myListings, favorites: initialFavorites = [] }: MyDashboardProps) {
  const [activeTab, setActiveTab] = useState<Tab>("내 매물");
  const [favorites, setFavorites] = useState<ListingCardData[]>(initialFavorites);
  const [favLoading, setFavLoading] = useState(false);

  async function loadFavorites() {
    if (favLoading) return;
    setFavLoading(true);
    try {
      const res = await fetch("/api/favorites/my");
      if (res.ok) {
        const data = await res.json();
        setFavorites(data);
      }
    } finally {
      setFavLoading(false);
    }
  }

  const initials = profile.name
    ? profile.name.slice(0, 2)
    : "?";

  return (
    <div className="mx-auto max-w-lg px-4 py-6">
      {/* Profile card */}
      <div
        className="mb-5 flex items-center justify-between rounded-2xl p-5"
        style={{
          backgroundColor: "var(--chayong-surface)",
        }}
      >
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div
            className="flex h-14 w-14 items-center justify-center rounded-full text-lg font-bold text-white"
            style={{ backgroundColor: "var(--chayong-primary)" }}
          >
            {profile.name ? (
              initials
            ) : (
              <User size={24} />
            )}
          </div>
          <div>
            <p className="font-semibold" style={{ color: "var(--chayong-text)" }}>
              {profile.name || "비로그인"}
            </p>
            <span
              className="mt-0.5 inline-block rounded-full px-2 py-0.5 text-xs font-medium"
              style={{
                backgroundColor: "var(--chayong-primary-light)",
                color: "var(--chayong-primary)",
              }}
            >
              {ROLE_LABEL[profile.role] ?? profile.role}
            </span>
          </div>
        </div>
        <Link
          href="#"
          className="flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors"
          style={{
            borderColor: "var(--chayong-border)",
            color: "var(--chayong-text-sub)",
          }}
        >
          <Settings size={13} />
          설정
        </Link>
      </div>

      {/* Stats row */}
      <div className="mb-6 grid grid-cols-3 gap-3">
        {[
          { label: "등록 매물", value: profile.listingCount },
          { label: "채팅", value: profile.chatCount },
          { label: "진행 중 거래", value: profile.activeTransactionCount },
        ].map(({ label, value }) => (
          <div
            key={label}
            className="flex flex-col items-center justify-center rounded-xl py-4"
            style={{ backgroundColor: "var(--chayong-surface)" }}
          >
            <span
              className="text-2xl font-bold"
              style={{ color: "var(--chayong-text)" }}
            >
              {value}
            </span>
            <span
              className="mt-1 text-xs"
              style={{ color: "var(--chayong-text-caption)" }}
            >
              {label}
            </span>
          </div>
        ))}
      </div>

      <PendingReviewsSection />

      {/* Tabs */}
      <div
        className="mb-4 flex rounded-xl p-1"
        style={{ backgroundColor: "var(--chayong-surface)" }}
      >
        {TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => {
              setActiveTab(tab);
              if (tab === "찜한 매물") loadFavorites();
            }}
            className="flex-1 rounded-lg py-2 text-sm font-medium transition-all"
            style={{
              backgroundColor:
                activeTab === tab ? "var(--chayong-bg)" : "transparent",
              color:
                activeTab === tab
                  ? "var(--chayong-text)"
                  : "var(--chayong-text-sub)",
              fontWeight: activeTab === tab ? 600 : 400,
            }}
          >
            {tab === "찜한 매물" && favorites.length > 0
              ? `찜한 매물 (${favorites.length})`
              : tab}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "내 매물" && (
        <div className="flex flex-col gap-3">
          {myListings.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center gap-3 rounded-xl py-16"
              style={{ backgroundColor: "var(--chayong-surface)" }}
            >
              <Package size={36} style={{ color: "var(--chayong-text-caption)" }} />
              <p className="text-sm" style={{ color: "var(--chayong-text-caption)" }}>
                등록된 매물이 없습니다
              </p>
              <Link
                href="/sell"
                className="rounded-xl px-5 py-2.5 text-sm font-semibold text-white"
                style={{ backgroundColor: "var(--chayong-primary)" }}
              >
                매물 등록하기
              </Link>
            </div>
          ) : (
            myListings.map((listing) => (
              <MyListingCard key={listing.id} listing={listing} />
            ))
          )}
        </div>
      )}

      {activeTab === "찜한 매물" && (
        <div>
          {favLoading ? (
            <div
              className="flex items-center justify-center rounded-xl py-16"
              style={{ backgroundColor: "var(--chayong-surface)" }}
            >
              <p className="text-sm" style={{ color: "var(--chayong-text-caption)" }}>
                불러오는 중…
              </p>
            </div>
          ) : favorites.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center gap-3 rounded-xl py-16"
              style={{ backgroundColor: "var(--chayong-surface)" }}
            >
              <Heart size={36} style={{ color: "var(--chayong-text-caption)" }} />
              <p className="text-sm" style={{ color: "var(--chayong-text-caption)" }}>
                찜한 매물이 없습니다
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {favorites.map((listing) => (
                <VehicleCard key={listing.id} listing={listing} />
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "거래 내역" && (
        <div
          className="flex flex-col items-center justify-center gap-3 rounded-xl py-16"
          style={{ backgroundColor: "var(--chayong-surface)" }}
        >
          <History size={36} style={{ color: "var(--chayong-text-caption)" }} />
          <p className="text-sm" style={{ color: "var(--chayong-text-caption)" }}>
            거래 내역이 없습니다
          </p>
        </div>
      )}

      {/* Menu list */}
      <div
        className="mt-8 overflow-hidden rounded-2xl border"
        style={{ borderColor: "var(--chayong-border)" }}
      >
        {MENU_ITEMS.map(({ icon: Icon, label, href }, index) => (
          <Link
            key={label}
            href={href}
            className="flex items-center justify-between px-4 py-4 transition-colors"
            style={{
              borderBottom:
                index < MENU_ITEMS.length - 1
                  ? "1px solid var(--chayong-divider)"
                  : "none",
              backgroundColor: "var(--chayong-bg)",
              color: label === "로그아웃" ? "#dc2626" : "var(--chayong-text)",
            }}
          >
            <div className="flex items-center gap-3">
              <Icon
                size={18}
                style={{
                  color: label === "로그아웃" ? "#dc2626" : "var(--chayong-text-sub)",
                }}
              />
              <span className="text-sm font-medium">{label}</span>
            </div>
            <ChevronRight
              size={16}
              style={{ color: "var(--chayong-text-caption)" }}
            />
          </Link>
        ))}
      </div>
    </div>
  );
}
