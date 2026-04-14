"use client";

import Link from "next/link";
import Image from "next/image";

interface LastMessage {
  content: string;
  type: string;
  createdAt: string;
  isMine: boolean;
}

interface ChatRoomItem {
  id: string;
  listing: {
    id: string;
    brand: string | null;
    model: string | null;
    monthlyPayment: number;
    primaryImage: string | null;
  };
  buyerId: string;
  sellerId: string;
  lastMessage: LastMessage | null;
  updatedAt: string;
  unreadCount?: number;
}

interface ChatRoomListProps {
  rooms: ChatRoomItem[];
  activeRoomId?: string;
}

function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return date.toLocaleTimeString("ko-KR", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  }
  if (diffDays === 1) return "어제";
  if (diffDays < 7) return `${diffDays}일 전`;
  return date.toLocaleDateString("ko-KR", { month: "numeric", day: "numeric" });
}

function ListingName({
  brand,
  model,
}: {
  brand: string | null;
  model: string | null;
}) {
  if (brand && model) return <>{`${brand} ${model}`}</>;
  if (brand) return <>{brand}</>;
  if (model) return <>{model}</>;
  return <>매물</>;
}

export function ChatRoomList({ rooms, activeRoomId }: ChatRoomListProps) {
  if (rooms.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center py-16 px-6 text-center"
        style={{ color: "var(--chayong-text-caption)" }}
      >
        <svg
          width="48"
          height="48"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          className="mb-4 opacity-40"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z"
          />
        </svg>
        <p
          className="text-sm font-medium mb-1"
          style={{ color: "var(--chayong-text-sub)" }}
        >
          진행 중인 채팅이 없습니다
        </p>
        <p className="text-xs mb-5">매물을 둘러보고 상담을 시작해보세요</p>
        <Link
          href="/"
          className="px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors"
          style={{ backgroundColor: "var(--chayong-primary)" }}
        >
          매물 보러가기
        </Link>
      </div>
    );
  }

  return (
    <ul className="divide-y" style={{ borderColor: "var(--chayong-divider)" }}>
      {rooms.map((room) => {
        const isActive = room.id === activeRoomId;
        const listingLabel = [room.listing.brand, room.listing.model]
          .filter(Boolean)
          .join(" ") || "매물";

        return (
          <li key={room.id}>
            <Link
              href={`/chat/${room.id}`}
              className="flex items-center gap-3 px-4 py-3.5 transition-colors"
              style={{
                backgroundColor: isActive
                  ? "var(--chayong-primary-light)"
                  : undefined,
              }}
            >
              {/* Thumbnail */}
              <div
                className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg"
                style={{ backgroundColor: "var(--chayong-surface)" }}
              >
                {room.listing.primaryImage ? (
                  <Image
                    src={room.listing.primaryImage}
                    alt={listingLabel}
                    fill
                    className="object-cover"
                    sizes="48px"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      style={{ color: "var(--chayong-text-caption)" }}
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12"
                      />
                    </svg>
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <span
                    className="truncate text-sm font-semibold"
                    style={{ color: "var(--chayong-text)" }}
                  >
                    <ListingName
                      brand={room.listing.brand}
                      model={room.listing.model}
                    />
                    <span
                      className="ml-1.5 font-normal"
                      style={{ color: "var(--chayong-text-caption)" }}
                    >
                      월 {room.listing.monthlyPayment.toLocaleString("ko-KR")}원
                    </span>
                  </span>
                  {room.lastMessage && (
                    <span
                      className="flex-shrink-0 text-xs"
                      style={{ color: "var(--chayong-text-caption)" }}
                    >
                      {formatTime(room.lastMessage.createdAt)}
                    </span>
                  )}
                </div>
                <div className="mt-0.5 flex items-center justify-between gap-2">
                  <p
                    className="truncate text-xs"
                    style={{ color: "var(--chayong-text-sub)" }}
                  >
                    {room.lastMessage
                      ? room.lastMessage.type === "IMAGE"
                        ? "사진"
                        : room.lastMessage.type === "SYSTEM"
                          ? "[시스템]"
                          : room.lastMessage.content
                      : "대화를 시작해보세요"}
                  </p>
                  {room.unreadCount && room.unreadCount > 0 ? (
                    <span
                      className="flex h-5 min-w-5 flex-shrink-0 items-center justify-center rounded-full px-1.5 text-xs font-bold text-white"
                      style={{ backgroundColor: "var(--chayong-primary)" }}
                    >
                      {room.unreadCount > 99 ? "99+" : room.unreadCount}
                    </span>
                  ) : null}
                </div>
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
