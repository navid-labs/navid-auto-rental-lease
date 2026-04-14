import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireAuth, isAuthError } from "@/lib/api/auth-guard";
import { containsContactInfo } from "@/lib/chat/contact-filter";

const PAGE_SIZE = 50;

// GET /api/chat/messages?roomId=...&cursor=...
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth();
    if (isAuthError(auth)) return auth;

    const { searchParams } = request.nextUrl;
    const roomId = searchParams.get("roomId");
    const cursor = searchParams.get("cursor");

    if (!roomId) {
      return NextResponse.json({ error: "roomId is required" }, { status: 400 });
    }

    // Verify the user is a participant in this room
    const room = await prisma.chatRoom.findUnique({
      where: { id: roomId },
      select: { buyerId: true, sellerId: true },
    });

    if (!room) {
      return NextResponse.json({ error: "채팅방을 찾을 수 없습니다." }, { status: 404 });
    }

    if (room.buyerId !== auth.userId && room.sellerId !== auth.userId) {
      return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
    }

    const messages = await prisma.chatMessage.findMany({
      where: { chatRoomId: roomId },
      orderBy: { createdAt: "asc" },
      take: PAGE_SIZE,
      ...(cursor
        ? {
            cursor: { id: cursor },
            skip: 1,
          }
        : {}),
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
    });

    return NextResponse.json({ data: messages });
  } catch (error) {
    console.error("GET /api/chat/messages error:", error);
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}

// POST /api/chat/messages — send a message
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth();
    if (isAuthError(auth)) return auth;

    const body = await request.json();
    const { chatRoomId, content, type = "TEXT" } = body;

    if (!chatRoomId || !content) {
      return NextResponse.json(
        { error: "chatRoomId, content are required" },
        { status: 400 }
      );
    }

    // Verify the authenticated user is a participant in this room
    const room = await prisma.chatRoom.findUnique({
      where: { id: chatRoomId },
      select: { buyerId: true, sellerId: true },
    });

    if (!room) {
      return NextResponse.json({ error: "채팅방을 찾을 수 없습니다." }, { status: 404 });
    }

    if (room.buyerId !== auth.userId && room.sellerId !== auth.userId) {
      return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
    }

    // Server-side contact info check (must mirror client-side filter)
    if (type === "TEXT" && containsContactInfo(content)) {
      return NextResponse.json(
        { error: "외부 연락처 공유가 제한됩니다." },
        { status: 422 }
      );
    }

    // senderId is always taken from the session — never from body
    const message = await prisma.chatMessage.create({
      data: {
        chatRoomId,
        senderId: auth.userId,
        type,
        content,
      },
    });

    // Touch updatedAt on the parent room so room list re-sorts
    await prisma.chatRoom.update({
      where: { id: chatRoomId },
      data: { updatedAt: new Date() },
    });

    return NextResponse.json(message, { status: 201 });
  } catch (error) {
    console.error("POST /api/chat/messages error:", error);
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
