import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireAuth, isAuthError } from "@/lib/api/auth-guard";

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth();
    if (isAuthError(auth)) return auth;

    const { chatRoomId } = await request.json();

    if (!chatRoomId) {
      return NextResponse.json(
        { error: "chatRoomId is required" },
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

    // userId from session — never from body
    await prisma.chatMessage.updateMany({
      where: {
        chatRoomId,
        senderId: { not: auth.userId },
        isRead: false,
      },
      data: { isRead: true },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("POST /api/chat/messages/read error:", error);
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
