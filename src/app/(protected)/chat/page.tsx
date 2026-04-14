import type { Metadata } from "next";
import { ChatRoomList } from "@/features/chat/components/chat-room-list";

export const metadata: Metadata = {
  title: "채팅",
  description: "상담 채팅 목록을 확인하세요.",
};

export default async function ChatListPage() {
  // TODO: Get authenticated user, fetch their chat rooms
  // const supabase = await createClient();
  // const { data: { user } } = await supabase.auth.getUser();
  // if (!user) redirect('/login');
  // const res = await fetch(`/api/chat/rooms?userId=${user.id}`, { cache: 'no-store' });
  // const { data: rooms } = await res.json();

  const rooms: never[] = [];

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: "var(--chayong-bg)" }}
    >
      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <div
          className="sticky top-0 z-10 border-b px-4 py-4"
          style={{
            backgroundColor: "var(--chayong-bg)",
            borderColor: "var(--chayong-divider)",
          }}
        >
          <h1
            className="text-xl font-bold"
            style={{ color: "var(--chayong-text)" }}
          >
            채팅
          </h1>

          {/* Search bar (non-functional placeholder) */}
          <div className="relative mt-3">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              style={{ color: "var(--chayong-text-caption)" }}
              aria-hidden="true"
            >
              <circle cx="11" cy="11" r="8" />
              <path strokeLinecap="round" d="m21 21-4.35-4.35" />
            </svg>
            <input
              type="text"
              placeholder="채팅 검색"
              readOnly
              className="w-full rounded-xl py-2.5 pl-10 pr-4 text-sm outline-none"
              style={{
                backgroundColor: "var(--chayong-surface)",
                color: "var(--chayong-text)",
                border: "1px solid var(--chayong-border)",
              }}
            />
          </div>
        </div>

        {/* Room list */}
        <ChatRoomList rooms={rooms} />
      </div>
    </div>
  );
}
