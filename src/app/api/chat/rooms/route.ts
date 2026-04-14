import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireAuth, isAuthError } from "@/lib/api/auth-guard";

// GET /api/chat/rooms — list rooms for the authenticated user
export async function GET(_request: NextRequest) {
  try {
    const auth = await requireAuth();
    if (isAuthError(auth)) return auth;

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

    const data = rooms.map((room) => {
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
              createdAt: lastMessage.createdAt,
              isMine: lastMessage.senderId === auth.userId,
            }
          : null,
        updatedAt: room.updatedAt,
      };
    });

    return NextResponse.json({ data });
  } catch (error) {
    console.error("GET /api/chat/rooms error:", error);
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}

// POST /api/chat/rooms — create or return existing room
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth();
    if (isAuthError(auth)) return auth;

    const body = await request.json();
    const { listingId, sellerId } = body;

    if (!listingId || !sellerId) {
      return NextResponse.json(
        { error: "listingId, sellerId are required" },
        { status: 400 }
      );
    }

    // buyerId is always the authenticated user
    const buyerId = auth.userId;

    const existing = await prisma.chatRoom.findUnique({
      where: { listingId_buyerId: { listingId, buyerId } },
    });

    if (existing) {
      return NextResponse.json(existing);
    }

    const room = await prisma.chatRoom.create({
      data: { listingId, buyerId, sellerId },
    });

    return NextResponse.json(room, { status: 201 });
  } catch (error) {
    console.error("POST /api/chat/rooms error:", error);
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
