import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { requireAuth, isAuthError } from "@/lib/api/auth-guard";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ roomId: string }>;
}

export const metadata: Metadata = {
  title: "채팅",
};

export default async function ChatRoomPage({ params }: PageProps) {
  const { roomId } = await params;
  const auth = await requireAuth();
  if (isAuthError(auth)) redirect("/login");

  const room = await prisma.chatRoom.findFirst({
    where: {
      id: roomId,
      OR: [{ buyerId: auth.userId }, { sellerId: auth.userId }],
    },
    select: { listingId: true },
  });

  if (!room) notFound();

  redirect(`/detail/${room.listingId}?chatRoom=${roomId}`);
}
