import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export async function POST(request: NextRequest) {
  try {
    const { chatRoomId, userId } = await request.json();

    if (!chatRoomId || !userId) {
      return NextResponse.json(
        { error: "chatRoomId and userId are required" },
        { status: 400 }
      );
    }

    await prisma.chatMessage.updateMany({
      where: {
        chatRoomId,
        senderId: { not: userId },
        isRead: false,
      },
      data: { isRead: true },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Failed to mark messages as read" },
      { status: 500 }
    );
  }
}
