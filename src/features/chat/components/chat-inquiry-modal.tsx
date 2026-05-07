"use client";

import type React from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChatMessageArea } from "@/features/chat/components/chat-message-area";
import { ShieldCheck, X } from "lucide-react";

type Message = {
  id: string;
  chatRoomId: string;
  senderId: string;
  type: "TEXT" | "IMAGE" | "SYSTEM";
  content: string;
  imageUrl?: string | null;
  isRead: boolean;
  reviewStatus?: string;
  blockReason?: string | null;
  createdAt: string;
};

interface ChatInquiryModalProps {
  listingId: string;
  listingName: string;
  monthlyPayment: number;
  className: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
  initialRoom?: {
    id: string;
    currentUserId: string;
    messages: Message[];
  };
}

type RoomResponse = {
  id: string;
  buyerId: string;
};

export function ChatInquiryModal({
  listingId,
  listingName,
  monthlyPayment,
  className,
  style,
  children,
  initialRoom,
}: ChatInquiryModalProps) {
  const router = useRouter();
  const [roomId, setRoomId] = useState<string | null>(initialRoom?.id ?? null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(
    initialRoom?.currentUserId ?? null
  );
  const [messages, setMessages] = useState<Message[]>(initialRoom?.messages ?? []);
  const [isOpen, setIsOpen] = useState(Boolean(initialRoom));
  const [isOpening, setIsOpening] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function closeChat() {
    setIsOpen(false);
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.has("chatRoom")) {
        router.replace(`/detail/${listingId}`);
      }
    }
  }

  async function openChat() {
    if (isOpening) return;
    setIsOpening(true);
    setError(null);

    try {
      const roomRes = await fetch("/api/chat/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId }),
      });

      if (roomRes.status === 401) {
        router.push(`/login?redirect=/detail/${listingId}`);
        return;
      }

      const roomData = await roomRes.json();
      if (!roomRes.ok) {
        setError(roomData.error ?? "채팅을 시작할 수 없습니다.");
        return;
      }

      const room = roomData as RoomResponse;
      const messagesRes = await fetch(`/api/chat/messages?roomId=${room.id}`, {
        cache: "no-store",
      });
      const messagesData = await messagesRes.json();

      if (!messagesRes.ok) {
        setError(messagesData.error ?? "채팅 내역을 불러오지 못했습니다.");
        return;
      }

      setRoomId(room.id);
      setCurrentUserId(room.buyerId);
      setMessages(
        (messagesData.data ?? []).map((message: Message) => ({
          ...message,
          createdAt:
            typeof message.createdAt === "string"
              ? message.createdAt
              : new Date(message.createdAt).toISOString(),
        }))
      );
      setIsOpen(true);
    } catch {
      setError("채팅을 시작할 수 없습니다. 다시 시도해주세요.");
    } finally {
      setIsOpening(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={openChat}
        disabled={isOpening}
        className={className}
        style={style}
      >
        {isOpening ? "채팅 여는 중..." : children}
      </button>
      {error && (
        <p className="mt-2 text-xs font-medium text-[var(--chayong-danger)]">
          {error}
        </p>
      )}

      {isOpen && roomId && currentUserId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6">
          <button
            type="button"
            className="absolute inset-0 bg-black/45 backdrop-blur-[2px]"
            onClick={closeChat}
            aria-label="채팅 닫기"
          />

          <section
            role="dialog"
            aria-modal="true"
            aria-label={`${listingName} 채팅`}
            className="relative z-10 flex h-[min(760px,calc(100dvh-1.5rem))] w-full max-w-2xl flex-col overflow-hidden rounded-2xl shadow-2xl ring-1 ring-black/10 sm:h-[min(760px,calc(100dvh-3rem))]"
            style={{ backgroundColor: "var(--chayong-bg)" }}
          >
            <header
              className="flex items-center gap-3 border-b px-4 py-3"
              style={{
                backgroundColor: "var(--chayong-bg)",
                borderColor: "var(--chayong-divider)",
              }}
            >
              <button
                type="button"
                onClick={closeChat}
                className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full transition-colors hover:bg-[var(--chayong-surface-hover)]"
                style={{ color: "var(--chayong-text)" }}
                aria-label="채팅 닫기"
              >
                <X size={20} />
              </button>

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
                  월 {monthlyPayment.toLocaleString("ko-KR")}원
                </p>
              </div>
            </header>

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
                안전거래 시 보호됩니다. 플랫폼 외 거래로 인한 문제는 보호되지
                않습니다.
              </span>
            </div>

            <ChatMessageArea
              roomId={roomId}
              currentUserId={currentUserId}
              initialMessages={messages}
            />
          </section>
        </div>
      )}
    </>
  );
}
