import { PrismaClient, type EscrowStatus } from "@prisma/client";

const prisma = new PrismaClient();

export type FixturePrefix = string;

export async function seedListings(
  sellerId: string,
  prefix: FixturePrefix,
  count = 25
) {
  return prisma.listing.createMany({
    data: Array.from({ length: count }).map((_, i) => ({
      sellerId,
      type: "USED_LEASE" as const,
      status: i < 20 ? ("ACTIVE" as const) : ("PENDING" as const),
      brand: prefix,
      model: `모델-${i}`,
      monthlyPayment: 500000,
      remainingMonths: 24,
    })),
  });
}

export async function seedLeads(
  userId: string,
  listingId: string,
  prefix: FixturePrefix,
  count = 25
) {
  return prisma.consultationLead.createMany({
    data: Array.from({ length: count }).map((_, i) => ({
      userId,
      listingId,
      status: i < 15 ? ("WAITING" as const) : ("CONSULTING" as const),
      note: `${prefix}-lead-${i}`,
      type: "USED_LEASE" as const,
    })),
  });
}

export async function seedEscrows(
  buyerId: string,
  sellerId: string,
  listingId: string,
  prefix: FixturePrefix,
  count = 25
) {
  return prisma.escrowPayment.createMany({
    data: Array.from({ length: count }).map((_, i) => {
      const status: EscrowStatus =
        i < 5 ? "DISPUTED" : i < 15 ? "PAID" : "RELEASED";
      return {
        buyerId,
        sellerId,
        listingId,
        status,
        depositAmount: 500000,
        transferFee: 100000,
        totalAmount: 1000000 + i,
        paidAt: new Date(),
        releasedAt: status === "RELEASED" ? new Date() : null,
      };
    }),
  });
}

export async function cleanupByPrefix(prefix: FixturePrefix) {
  await prisma.consultationLead.deleteMany({
    where: { note: { startsWith: prefix } },
  });
  await prisma.escrowPayment.deleteMany({
    where: { listing: { brand: prefix } },
  });
  await prisma.listing.deleteMany({ where: { brand: prefix } });
}
