import { expect, test } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import { randomUUID } from "node:crypto";

const prisma = new PrismaClient();
const BUYER_ID = "00000000-0000-0000-0000-000000000003";
const BUYER_EMAIL = "buyer@chayong.kr";
const TEST_PASSWORD = "chayong-test-2026!";

test.describe.serial("chat inquiry MVP", () => {
  const prefix = `채팅-E2E-${randomUUID().slice(0, 8)}`;
  const sellerId = randomUUID();
  let listingId: string;

  test.beforeAll(async () => {
    await prisma.profile.upsert({
      where: { id: BUYER_ID },
      update: { email: BUYER_EMAIL, role: "BUYER" },
      create: {
        id: BUYER_ID,
        email: BUYER_EMAIL,
        name: `${prefix}-매수자`,
        role: "BUYER",
      },
    });

    await prisma.profile.create({
      data: {
        id: sellerId,
        email: `${prefix}@seller.test`,
        name: `${prefix}-판매자`,
        role: "SELLER",
      },
    });

    const listing = await prisma.listing.create({
      data: {
        sellerId,
        type: "USED_LEASE",
        status: "ACTIVE",
        brand: prefix,
        model: "MVP",
        monthlyPayment: 510000,
        remainingMonths: 24,
      },
    });
    listingId = listing.id;
  });

  test.afterAll(async () => {
    if (listingId) {
      await prisma.chatMessage.deleteMany({
        where: { chatRoom: { listingId } },
      });
      await prisma.chatRoom.deleteMany({ where: { listingId } });
      await prisma.listing.deleteMany({ where: { id: listingId } });
    }
    await prisma.profile.deleteMany({ where: { id: sellerId } });
    await prisma.$disconnect();
  });

  test("creates or reuses a room, sends a text message, and shows it in the list", async ({
    page,
  }) => {
    const message = `${prefix} 문의드립니다`;

    await page.goto("/login");
    await page.getByLabel("이메일").fill(BUYER_EMAIL);
    await page.getByLabel("비밀번호").fill(TEST_PASSWORD);
    await page.getByRole("button", { name: "로그인" }).click();
    await expect(page).toHaveURL(/\/$/);

    await page.goto(`/chat?listing=${listingId}`);
    await expect(page).toHaveURL(/\/chat\/[0-9a-f-]+$/);
    await expect(page.getByText(`${prefix} MVP`)).toBeVisible();

    await page.getByPlaceholder("메시지를 입력하세요").fill(message);
    await page.getByRole("button", { name: "전송" }).click();
    await expect(page.getByText(message)).toBeVisible();

    const room = await prisma.chatRoom.findUnique({
      where: { listingId_buyerId: { listingId, buyerId: BUYER_ID } },
      include: { messages: { where: { content: message } } },
    });
    expect(room?.sellerId).toBe(sellerId);
    expect(room?.messages).toHaveLength(1);
    expect(room?.messages[0].senderId).toBe(BUYER_ID);

    await page.goto("/chat");
    await expect(page.getByText(`${prefix} MVP`)).toBeVisible();
    await expect(page.getByText(message)).toBeVisible();
  });
});
