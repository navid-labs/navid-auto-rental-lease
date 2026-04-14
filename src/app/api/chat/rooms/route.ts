import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

// GET /api/chat/rooms?userId=...
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const userId = searchParams.get("userId");

  if (!userId) {
    return NextResponse.json({ error: "userId is required" }, { status: 400 });
  }

  const rooms = await prisma.chatRoom.findMany({
    where: {
      isActive: true,
      OR: [{ buyerId: userId }, { sellerId: userId }],
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
    // Count unread: messages not sent by this user and not read
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
            isMine: lastMessage.senderId === userId,
          }
        : null,
      updatedAt: room.updatedAt,
    };
  });

  return NextResponse.json({ data });
}

// POST /api/chat/rooms — create or return existing room
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { listingId, buyerId, sellerId } = body;

  if (!listingId || !buyerId || !sellerId) {
    return NextResponse.json(
      { error: "listingId, buyerId, sellerId are required" },
      { status: 400 }
    );
  }

  // Upsert: find existing room or create new one
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
}
