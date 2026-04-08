import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { ChatMessageArea } from "@/features/chat/components/chat-message-area";
import { ChevronLeft, ShieldCheck } from "lucide-react";

interface PageProps {
  params: Promise<{ roomId: string }>;
}

export const metadata: Metadata = {
  title: "채팅",
};

// TODO: Replace with real auth once Supabase session is wired up
const MOCK_USER_ID = "00000000-0000-0000-0000-000000000001";

export default async function ChatRoomPage({ params }: PageProps) {
  const { roomId } = await params;

  const room = await prisma.chatRoom.findUnique({
    where: { id: roomId },
    include: {
      listing: {
        select: {
          id: true,
          brand: true,
          model: true,
          monthlyPayment: true,
        },
      },
      messages: {
        orderBy: { createdAt: "asc" },
        take: 50,
        select: {
          id: true,
          chatRoomId: true,
          senderId: true,
          type: true,
          content: true,
          imageUrl: true,
          isRead: true,
          createdAt: true,
        },
      },
    },
  });

  if (!room) notFound();

  const currentUserId = MOCK_USER_ID;
  const listingName =
    [room.listing.brand, room.listing.model].filter(Boolean).join(" ") ||
    "매물";

  // Serialize dates for client component
  const initialMessages = room.messages.map((msg) => ({
    ...msg,
    createdAt: msg.createdAt.toISOString(),
  }));

  return (
    <div
      className="flex h-screen flex-col"
      style={{ backgroundColor: "var(--chayong-bg)" }}
    >
      {/* Top bar */}
      <header
        className="flex items-center gap-3 border-b px-4 py-3"
        style={{
          backgroundColor: "var(--chayong-bg)",
          borderColor: "var(--chayong-divider)",
        }}
      >
        <Link
          href="/chat"
          className="flex h-9 w-9 items-center justify-center rounded-full transition-colors"
          style={{ color: "var(--chayong-text)" }}
          aria-label="채팅 목록으로 돌아가기"
        >
          <ChevronLeft size={22} />
        </Link>

        <div className="min-w-0 flex-1">
          <p
            className="truncate text-sm font-bold"
            style={{ color: "var(--chayong-text)" }}
          >
            {listingName}
          </p>
          <p
            className="text-xs"
            style={{ color: "var(--chayong-text-caption)" }}
          >
            월 {room.listing.monthlyPayment.toLocaleString("ko-KR")}원
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/listings/${room.listing.id}`}
            className="rounded-lg px-3 py-1.5 text-xs font-medium transition-colors"
            style={{
              backgroundColor: "var(--chayong-surface)",
              color: "var(--chayong-text-sub)",
              border: "1px solid var(--chayong-border)",
            }}
          >
            매물보기
          </Link>
          <Link
            href={`/payment/${room.listing.id}`}
            className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-bold text-white transition-colors"
            style={{ backgroundColor: "var(--chayong-primary)" }}
          >
            <ShieldCheck size={13} />
            안전거래 진행하기
          </Link>
        </div>
      </header>

      {/* Safety notice (system message) */}
      <div
        className="flex items-center gap-2 px-4 py-2.5 text-xs"
        style={{
          backgroundColor: "#FFFBEB",
          borderBottom: "1px solid #FDE68A",
          color: "#92400E",
        }}
      >
        <ShieldCheck size={14} style={{ flexShrink: 0 }} />
        <span>
          안전거래 시 보호됩니다. 플랫폼 외 거래로 인한 문제는 보호되지 않습니다.
        </span>
      </div>

      {/* Message area + input */}
      <ChatMessageArea
        roomId={roomId}
        currentUserId={currentUserId}
        initialMessages={initialMessages}
      />
    </div>
  );
}
