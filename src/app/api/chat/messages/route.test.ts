import { NextRequest, NextResponse } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const prismaMock = vi.hoisted(() => ({
  chatRoom: {
    findUnique: vi.fn(),
    update: vi.fn(),
  },
  chatMessage: {
    create: vi.fn(),
  },
}));

const authMock = vi.hoisted(() => ({
  requireActiveProfile: vi.fn(),
  requireAuth: vi.fn(),
}));

vi.mock("@/lib/db/prisma", () => ({
  prisma: prismaMock,
}));

vi.mock("@/lib/api/auth-guard", () => ({
  requireActiveProfile: authMock.requireActiveProfile,
  requireAuth: authMock.requireAuth,
  isAuthError: (result: unknown) => result instanceof NextResponse,
}));

import { POST } from "./route";

function req(body: unknown) {
  return new NextRequest("http://localhost/api/chat/messages", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });
}

describe("POST /api/chat/messages", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authMock.requireActiveProfile.mockResolvedValue({
      userId: "00000000-0000-4000-8000-000000000001",
      role: "BUYER",
    });
    prismaMock.chatRoom.findUnique.mockResolvedValue({
      buyerId: "00000000-0000-4000-8000-000000000001",
      sellerId: "00000000-0000-4000-8000-000000000002",
    });
    prismaMock.chatMessage.create.mockResolvedValue({
      id: "message-1",
      chatRoomId: "room-1",
      senderId: "00000000-0000-4000-8000-000000000001",
      type: "TEXT",
      content: "안녕하세요",
      imageUrl: null,
      isRead: false,
      reviewStatus: "APPROVED",
      blockReason: null,
      createdAt: new Date("2026-05-08T00:00:00.000Z"),
    });
    prismaMock.chatRoom.update.mockResolvedValue({});
  });

  it("ignores client senderId and uses the authenticated user", async () => {
    const res = await POST(
      req({
        chatRoomId: "room-1",
        senderId: "00000000-0000-4000-8000-000000000002",
        content: "안녕하세요",
        type: "TEXT",
      })
    );

    expect(res.status).toBe(201);
    expect(prismaMock.chatMessage.create).toHaveBeenCalledWith({
      data: {
        chatRoomId: "room-1",
        senderId: "00000000-0000-4000-8000-000000000001",
        type: "TEXT",
        content: "안녕하세요",
        reviewStatus: "APPROVED",
        blockReason: undefined,
      },
    });
  });
});
