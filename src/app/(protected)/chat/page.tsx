import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ChatRoomList } from "@/features/chat/components/chat-room-list";
import { prisma } from "@/lib/db/prisma";
import { requireActiveProfile, isAuthError } from "@/lib/api/auth-guard";

export const metadata: Metadata = {
  title: "채팅",
  description: "상담 채팅 목록을 확인하세요.",
};

interface PageProps {
  searchParams: Promise<{ listing?: string }>;
}

export const dynamic = "force-dynamic";

export default async function ChatListPage({ searchParams }: PageProps) {
  const auth = await requireActiveProfile();
  if (isAuthError(auth)) redirect("/login");

  const { listing: listingId } = await searchParams;

  if (listingId) {
    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
      select: { sellerId: true, status: true },
    });

    if (!listing || listing.status !== "ACTIVE") {
      redirect("/chat?error=unavailable");
    }

    if (listing.sellerId === auth.userId) {
      redirect("/chat?error=self");
    }

    const room = await prisma.chatRoom.upsert({
      where: { listingId_buyerId: { listingId, buyerId: auth.userId } },
      update: {},
      create: {
        listingId,
        buyerId: auth.userId,
        sellerId: listing.sellerId,
      },
      select: { id: true },
    });

    redirect(`/chat/${room.id}`);
  }

  const rooms = await prisma.chatRoom.findMany({
    where: {
      isActive: true,
      OR: [{ buyerId: auth.userId }, { sellerId: auth.userId }],
    },
    orderBy: { updatedAt: "desc" },
    include: {
      listing: {
        select: {
          id: true,
          brand: true,
          model: true,
          monthlyPayment: true,
          images: {
            where: { isPrimary: true },
            take: 1,
            select: { url: true },
          },
        },
      },
      messages: {
        where: {
          OR: [{ reviewStatus: "APPROVED" }, { senderId: auth.userId }],
        },
        orderBy: { createdAt: "desc" },
        take: 1,
        select: {
          content: true,
          type: true,
          createdAt: true,
          senderId: true,
        },
      },
    },
  });

  const roomItems = rooms.map((room) => {
    const lastMessage = room.messages[0] ?? null;
    return {
      id: room.id,
      listing: {
        id: room.listing.id,
        brand: room.listing.brand,
        model: room.listing.model,
        monthlyPayment: room.listing.monthlyPayment,
        primaryImage: room.listing.images[0]?.url ?? null,
      },
      buyerId: room.buyerId,
      sellerId: room.sellerId,
      lastMessage: lastMessage
        ? {
            content: lastMessage.content,
            type: lastMessage.type,
            createdAt: lastMessage.createdAt.toISOString(),
            isMine: lastMessage.senderId === auth.userId,
          }
        : null,
      updatedAt: room.updatedAt.toISOString(),
    };
  });

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
        <ChatRoomList rooms={roomItems} />
      </div>
    </div>
  );
}
