import { NextRequest, NextResponse } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const prismaMock = vi.hoisted(() => ({
  chatRoom: {
    findUnique: vi.fn(),
    create: vi.fn(),
  },
  listing: {
    findUnique: vi.fn(),
  },
}));

const authMock = vi.hoisted(() => ({
  requireActiveProfile: vi.fn(),
}));

vi.mock("@/lib/db/prisma", () => ({
  prisma: prismaMock,
}));

vi.mock("@/lib/api/auth-guard", () => ({
  requireActiveProfile: authMock.requireActiveProfile,
  requireAuth: vi.fn(),
  isAuthError: (result: unknown) => result instanceof NextResponse,
}));

import { POST } from "./route";

function req(body: unknown) {
  return new NextRequest("http://localhost/api/chat/rooms", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });
}

describe("POST /api/chat/rooms", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authMock.requireActiveProfile.mockResolvedValue({
      userId: "00000000-0000-4000-8000-000000000001",
      role: "BUYER",
    });
    prismaMock.listing.findUnique.mockResolvedValue({
      sellerId: "00000000-0000-4000-8000-000000000002",
      status: "ACTIVE",
    });
    prismaMock.chatRoom.findUnique.mockResolvedValue(null);
    prismaMock.chatRoom.create.mockResolvedValue({
      id: "room-1",
      listingId: "listing-1",
      buyerId: "00000000-0000-4000-8000-000000000001",
      sellerId: "00000000-0000-4000-8000-000000000002",
    });
  });

  it("returns 401 when unauthenticated", async () => {
    authMock.requireActiveProfile.mockResolvedValue(
      NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 })
    );

    const res = await POST(req({ listingId: "listing-1" }));

    expect(res.status).toBe(401);
  });

  it("requires listingId", async () => {
    const res = await POST(req({}));

    expect(res.status).toBe(400);
    expect(prismaMock.listing.findUnique).not.toHaveBeenCalled();
  });

  it("creates a room with sellerId derived from the listing", async () => {
    const res = await POST(req({ listingId: "listing-1", sellerId: "spoofed" }));

    expect(res.status).toBe(201);
    expect(prismaMock.chatRoom.create).toHaveBeenCalledWith({
      data: {
        listingId: "listing-1",
        buyerId: "00000000-0000-4000-8000-000000000001",
        sellerId: "00000000-0000-4000-8000-000000000002",
      },
    });
  });

  it("returns the existing room for the same buyer and listing", async () => {
    prismaMock.chatRoom.findUnique.mockResolvedValue({
      id: "room-existing",
      listingId: "listing-1",
      buyerId: "00000000-0000-4000-8000-000000000001",
      sellerId: "00000000-0000-4000-8000-000000000002",
    });

    const res = await POST(req({ listingId: "listing-1" }));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.id).toBe("room-existing");
    expect(prismaMock.chatRoom.create).not.toHaveBeenCalled();
  });

  it("rejects self-chat for the seller's own listing", async () => {
    prismaMock.listing.findUnique.mockResolvedValue({
      sellerId: "00000000-0000-4000-8000-000000000001",
      status: "ACTIVE",
    });

    const res = await POST(req({ listingId: "listing-1" }));

    expect(res.status).toBe(403);
    expect(prismaMock.chatRoom.create).not.toHaveBeenCalled();
  });
});
