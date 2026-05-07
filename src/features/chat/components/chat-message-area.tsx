"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { sanitizeMessage } from "@/lib/chat/contact-filter";
import { createClient } from "@/lib/supabase/client";
import { ReportModal } from "@/components/ui/report-modal";
import { Flag, ImageIcon, Send } from "lucide-react";

interface Message {
  id: string;
  chatRoomId: string;
  senderId: string;
  type: "TEXT" | "IMAGE" | "SYSTEM";
  content: string;
  imageUrl?: string | null;
  isRead: boolean;
  createdAt: string;
}

interface ChatMessageAreaProps {
  roomId: string;
  currentUserId: string;
  initialMessages: Message[];
}

function formatMessageTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleTimeString("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function getInitial(id: string): string {
  return id.slice(0, 1).toUpperCase();
}

export function ChatMessageArea({
  roomId,
  currentUserId,
  initialMessages,
}: ChatMessageAreaProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [inputText, setInputText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [warning, setWarning] = useState<string | null>(null);
  const [reportTarget, setReportTarget] = useState<{
    id: string;
    summary: string;
  } | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Subscribe to Supabase Realtime for new messages
  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel(`chat:${roomId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `chat_room_id=eq.${roomId}`,
        },
        (payload) => {
          const newMessage = payload.new as Message;
          // Deduplicate: skip if already added via optimistic update
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMessage.id)) return prev;
            return [...prev, newMessage];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId]);

  // Mark messages as read when entering the room
  useEffect(() => {
    fetch("/api/chat/messages/read", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chatRoomId: roomId, userId: currentUserId }),
    });
  }, [roomId, currentUserId]);

  const handleSend = useCallback(async () => {
    const trimmed = inputText.trim();
    if (!trimmed || isSending) return;

    // Client-side contact filter
    const result = sanitizeMessage(trimmed);
    if (result.blocked) {
      setWarning(result.reason);
      return;
    }

    setWarning(null);
    setIsSending(true);

    // Optimistic update: add a temporary message immediately
    const optimisticId = `optimistic-${Date.now()}`;
    const optimisticMessage: Message = {
      id: optimisticId,
      chatRoomId: roomId,
      senderId: currentUserId,
      type: "TEXT",
      content: trimmed,
      imageUrl: null,
      isRead: false,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimisticMessage]);
    setInputText("");

    try {
      const res = await fetch("/api/chat/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chatRoomId: roomId,
          senderId: currentUserId,
          content: trimmed,
          type: "TEXT",
        }),
      });

      if (!res.ok) {
        // Roll back optimistic message on error
        setMessages((prev) => prev.filter((m) => m.id !== optimisticId));
        const data = await res.json();
        setWarning(data.error ?? "메시지 전송에 실패했습니다.");
        setInputText(trimmed);
        return;
      }

      const savedMessage: Message = await res.json();
      // Replace optimistic entry with the server-persisted message
      setMessages((prev) =>
        prev.map((m) => (m.id === optimisticId ? savedMessage : m))
      );
    } catch {
      setMessages((prev) => prev.filter((m) => m.id !== optimisticId));
      setWarning("메시지 전송에 실패했습니다. 다시 시도해주세요.");
      setInputText(trimmed);
    } finally {
      setIsSending(false);
    }
  }, [inputText, isSending, roomId, currentUserId]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* Message list */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.length === 0 && (
          <p
            className="text-center text-sm py-8"
            style={{ color: "var(--chayong-text-caption)" }}
          >
            대화를 시작해보세요
          </p>
        )}

        {messages.map((msg) => {
          if (msg.type === "SYSTEM") {
            return (
              <div key={msg.id} className="flex justify-center">
                <span
                  className="rounded-full px-3 py-1 text-xs"
                  style={{
                    backgroundColor: "#FFF9EC",
                    color: "#7A5A00",
                    border: "1px solid #FFE08A",
                  }}
                >
                  {msg.content}
                </span>
              </div>
            );
          }

          const isMine = msg.senderId === currentUserId;
          const reportSummary = msg.content.trim().slice(0, 80);

          return (
            <div
              key={msg.id}
              className={`group flex items-end gap-2 ${isMine ? "flex-row-reverse" : "flex-row"}`}
            >
              {/* Avatar (only for received) */}
              {!isMine && (
                <div
                  className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                  style={{ backgroundColor: "var(--chayong-text-caption)" }}
                  aria-hidden="true"
                >
                  {getInitial(msg.senderId)}
                </div>
              )}

              <div
                className={`flex flex-col gap-1 ${isMine ? "items-end" : "items-start"}`}
              >
                <div className="flex items-end gap-2">
                  {!isMine && (
                    <button
                      type="button"
                      onClick={() =>
                        setReportTarget({
                          id: msg.id,
                          summary: reportSummary,
                        })
                      }
                      className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full border border-[var(--chayong-divider)] bg-[var(--chayong-surface)] text-[var(--chayong-text-caption)] opacity-0 shadow-sm transition-all duration-150 hover:bg-[var(--chayong-bg)] hover:text-[var(--chayong-primary)] focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--chayong-primary)] focus-visible:ring-offset-2 active:scale-95 group-hover:opacity-100 group-focus-within:opacity-100 group-active:opacity-100"
                      aria-label="메시지 신고"
                    >
                      <Flag size={12} />
                    </button>
                  )}

                  <div
                    className="max-w-xs rounded-2xl px-4 py-2.5 text-sm leading-relaxed break-words lg:max-w-md"
                    style={
                      isMine
                        ? {
                            backgroundColor: "var(--chayong-primary)",
                            color: "#ffffff",
                            borderBottomRightRadius: "4px",
                          }
                        : {
                            backgroundColor: "var(--chayong-surface)",
                            color: "var(--chayong-text)",
                            border: "1px solid var(--chayong-border)",
                            borderBottomLeftRadius: "4px",
                          }
                    }
                  >
                    {msg.content}
                  </div>
                </div>
                <span
                  className="text-xs"
                  style={{ color: "var(--chayong-text-caption)" }}
                >
                  {formatMessageTime(msg.createdAt)}
                </span>
              </div>
            </div>
          );
        })}

        <div ref={bottomRef} />
      </div>

      <ReportModal
        targetType="MESSAGE"
        targetId={reportTarget?.id ?? ""}
        targetSummary={reportTarget?.summary}
        isOpen={reportTarget !== null}
        onClose={() => setReportTarget(null)}
      />

      {/* Warning toast */}
      {warning && (
        <div
          className="mx-4 mb-2 rounded-lg px-3 py-2 text-xs font-medium"
          style={{
            backgroundColor: "#FFF3F3",
            color: "var(--chayong-danger)",
            border: "1px solid #FECDD3",
          }}
          role="alert"
        >
          {warning}
        </div>
      )}

      {/* Input bar */}
      <div
        className="flex items-end gap-2 border-t px-4 py-3"
        style={{ borderColor: "var(--chayong-divider)" }}
      >
        {/* Image button (placeholder) */}
        <button
          type="button"
          className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full transition-colors"
          style={{ color: "var(--chayong-text-caption)" }}
          aria-label="이미지 첨부 (준비 중)"
          disabled
        >
          <ImageIcon size={20} />
        </button>

        <textarea
          ref={inputRef}
          value={inputText}
          onChange={(e) => {
            setInputText(e.target.value);
            if (warning) setWarning(null);
          }}
          onKeyDown={handleKeyDown}
          placeholder="메시지를 입력하세요"
          rows={1}
          className="flex-1 resize-none rounded-2xl px-4 py-2.5 text-sm outline-none transition-colors"
          style={{
            backgroundColor: "var(--chayong-surface)",
            color: "var(--chayong-text)",
            border: "1px solid var(--chayong-border)",
            maxHeight: "120px",
          }}
        />

        <button
          type="button"
          onClick={handleSend}
          disabled={!inputText.trim() || isSending}
          className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-white transition-colors disabled:opacity-40"
          style={{ backgroundColor: "var(--chayong-primary)" }}
          aria-label="전송"
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  );
}
