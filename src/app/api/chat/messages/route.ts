import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { containsContactInfo } from "@/lib/chat/contact-filter";

const PAGE_SIZE = 50;

// GET /api/chat/messages?roomId=...&cursor=...
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const roomId = searchParams.get("roomId");
  const cursor = searchParams.get("cursor");

  if (!roomId) {
    return NextResponse.json({ error: "roomId is required" }, { status: 400 });
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
}

// POST /api/chat/messages — send a message
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { chatRoomId, senderId, content, type = "TEXT" } = body;

  if (!chatRoomId || !senderId || !content) {
    return NextResponse.json(
      { error: "chatRoomId, senderId, content are required" },
      { status: 400 }
    );
  }

  // Server-side contact info check (must mirror client-side filter)
  if (type === "TEXT" && containsContactInfo(content)) {
    return NextResponse.json(
      { error: "외부 연락처 공유가 제한됩니다." },
      { status: 422 }
    );
  }

  const message = await prisma.chatMessage.create({
    data: {
      chatRoomId,
      senderId,
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
}
