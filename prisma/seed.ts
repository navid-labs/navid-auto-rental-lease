import { PrismaClient, UserRole, ListingType, ListingStatus, MessageType, LeadStatus } from '@prisma/client'

const prisma = new PrismaClient()

// ─── Hardcoded UUIDs for reproducibility ─────────────────────────────────────

const ADMIN_ID  = '00000000-0000-0000-0000-000000000001'
const SELLER_ID = '00000000-0000-0000-0000-000000000002'
const BUYER_ID  = '00000000-0000-0000-0000-000000000003'

// ─── Listing seed data ────────────────────────────────────────────────────────

const listingSeeds = [
  {
    brand: '현대',
    model: '싼타페 하이브리드',
    type: ListingType.TRANSFER,
    monthlyPayment: 580000,
    initialCost: 0,
    remainingMonths: 32,
    isVerified: true,
    options: ['파노라마 선루프', 'HUD'],
    year: 2022,
    trim: '하이브리드 2.5T 프리미엄',
    mileage: 28000,
    color: '어비스블랙펄',
    fuelType: '하이브리드',
    transmission: '자동',
    capitalCompany: '현대캐피탈',
    imageText: '현대+싼타페',
  },
  {
    brand: 'BMW',
    model: '520i M 스포츠',
    type: ListingType.TRANSFER,
    monthlyPayment: 760000,
    initialCost: 2000000,
    remainingMonths: 28,
    isVerified: true,
    options: ['BOSE 사운드'],
    year: 2022,
    trim: '520i M 스포츠 패키지',
    mileage: 35000,
    color: '알파인화이트',
    fuelType: '가솔린',
    transmission: '자동',
    capitalCompany: 'BMW파이낸셜',
    imageText: 'BMW+520i',
  },
  {
    brand: '제네시스',
    model: 'GV80 2.5T',
    type: ListingType.USED_LEASE,
    monthlyPayment: 950000,
    initialCost: 5000000,
    remainingMonths: 35,
    isVerified: true,
    options: ['빌트인캠', 'HUD'],
    year: 2023,
    trim: '2.5T 프레스티지',
    mileage: 15000,
    color: '마제스틱블랙',
    fuelType: '가솔린',
    transmission: '자동',
    capitalCompany: '현대캐피탈',
    imageText: '제네시스+GV80',
  },
  {
    brand: '기아',
    model: 'K8 하이브리드',
    type: ListingType.USED_RENTAL,
    monthlyPayment: 530000,
    initialCost: 0,
    remainingMonths: 30,
    isVerified: true,
    options: [],
    year: 2022,
    trim: '하이브리드 시그니처',
    mileage: 42000,
    color: '스노우화이트펄',
    fuelType: '하이브리드',
    transmission: '자동',
    capitalCompany: '기아캐피탈',
    imageText: '기아+K8',
  },
  {
    brand: '벤츠',
    model: 'C 300 4MATIC',
    type: ListingType.TRANSFER,
    monthlyPayment: 890000,
    initialCost: 3000000,
    remainingMonths: 28,
    isVerified: false,
    options: [],
    imageText: '벤츠+C300',
  },
  {
    brand: '현대',
    model: '그랜저 하이브리드',
    type: ListingType.USED_LEASE,
    monthlyPayment: 490000,
    initialCost: 0,
    remainingMonths: 26,
    isVerified: false,
    options: ['파노라마 선루프'],
    imageText: '현대+그랜저',
  },
]

// ─── Helper ───────────────────────────────────────────────────────────────────

function calcTotalPrice(monthly: number, months: number, initial: number): number {
  return monthly * months + initial
}

function calcRemainingBalance(monthly: number, months: number): number {
  return monthly * months
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('Seeding database...')

  await prisma.$transaction(async (tx) => {
    // Clean slate — order matters due to FK constraints
    await tx.chatMessage.deleteMany()
    await tx.chatRoom.deleteMany()
    await tx.consultationLead.deleteMany()
    await tx.escrowPayment.deleteMany()
    await tx.favorite.deleteMany()
    await tx.notification.deleteMany()
    await tx.listingImage.deleteMany()
    await tx.listing.deleteMany()
    await tx.profile.deleteMany()

    // ── 1. Profiles ──────────────────────────────────────────────────────────

    const [admin, seller, buyer] = await Promise.all([
      tx.profile.upsert({
        where: { id: ADMIN_ID },
        update: {},
        create: {
          id: ADMIN_ID,
          email: 'admin@chayong.kr',
          name: '관리자',
          role: UserRole.ADMIN,
        },
      }),
      tx.profile.upsert({
        where: { id: SELLER_ID },
        update: {},
        create: {
          id: SELLER_ID,
          email: 'seller@chayong.kr',
          name: '김차용',
          phone: '010-1234-5678',
          role: UserRole.SELLER,
        },
      }),
      tx.profile.upsert({
        where: { id: BUYER_ID },
        update: {},
        create: {
          id: BUYER_ID,
          email: 'buyer@chayong.kr',
          name: '이매수',
          phone: '010-9876-5432',
          role: UserRole.BUYER,
        },
      }),
    ])

    console.log(`  Created profiles: ${admin.name}, ${seller.name}, ${buyer.name}`)

    // ── 2. Listings ──────────────────────────────────────────────────────────

    const listings = await Promise.all(
      listingSeeds.map((seed) =>
        tx.listing.create({
          data: {
            sellerId: SELLER_ID,
            type: seed.type,
            status: ListingStatus.ACTIVE,
            brand: seed.brand,
            model: seed.model,
            year: seed.year ?? null,
            trim: seed.trim ?? null,
            fuelType: seed.fuelType ?? null,
            transmission: seed.transmission ?? null,
            mileage: seed.mileage ?? null,
            color: seed.color ?? null,
            monthlyPayment: seed.monthlyPayment,
            initialCost: seed.initialCost,
            remainingMonths: seed.remainingMonths,
            totalPrice: calcTotalPrice(seed.monthlyPayment, seed.remainingMonths, seed.initialCost),
            remainingBalance: calcRemainingBalance(seed.monthlyPayment, seed.remainingMonths),
            capitalCompany: seed.capitalCompany ?? null,
            isVerified: seed.isVerified,
            accidentFree: true,
            options: seed.options,
          },
        })
      )
    )

    console.log(`  Created ${listings.length} listings`)

    // ── 3. Listing Images (1 per listing) ────────────────────────────────────

    await Promise.all(
      listings.map((listing, i) => {
        const seed = listingSeeds[i]
        const label = encodeURIComponent(seed.imageText)
        return tx.listingImage.create({
          data: {
            listingId: listing.id,
            url: `https://placehold.co/800x600/e2e8f0/64748b.png?text=${label}`,
            order: 0,
            isPrimary: true,
          },
        })
      })
    )

    console.log('  Created listing images')

    // ── 4. ChatRoom + Messages (buyer ↔ seller for first listing) ────────────

    const firstListing = listings[0]

    const chatRoom = await tx.chatRoom.create({
      data: {
        listingId: firstListing.id,
        buyerId: BUYER_ID,
        sellerId: SELLER_ID,
      },
    })

    const messages: Array<{ senderId: string; type: MessageType; content: string }> = [
      { senderId: SELLER_ID, type: MessageType.SYSTEM,  content: '안전거래 시 보호됩니다.' },
      { senderId: BUYER_ID,  type: MessageType.TEXT,    content: '안녕하세요, 매물 아직도 있나요?' },
      { senderId: SELLER_ID, type: MessageType.TEXT,    content: '네, 아직 있습니다!' },
    ]

    for (const msg of messages) {
      await tx.chatMessage.create({
        data: {
          chatRoomId: chatRoom.id,
          senderId: msg.senderId,
          type: msg.type,
          content: msg.content,
        },
      })
    }

    console.log('  Created chat room with 3 messages')

    // ── 5. ConsultationLead ──────────────────────────────────────────────────

    await tx.consultationLead.create({
      data: {
        userId: BUYER_ID,
        listingId: firstListing.id,
        type: firstListing.type,
        status: LeadStatus.WAITING,
      },
    })

    console.log('  Created consultation lead')
  })

  console.log('Seed complete.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
