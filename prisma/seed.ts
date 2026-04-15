import {
  PrismaClient,
  UserRole,
  ListingType,
  ListingStatus,
  MessageType,
  LeadStatus,
  FuelType,
  Transmission,
  BodyType,
  Drivetrain,
  PlateType,
  Grade,
  ImagePosition,
} from '@prisma/client'
import { createAdminClient } from '../src/lib/supabase/admin'

const prisma = new PrismaClient()

// ─── Hardcoded UUIDs for reproducibility ─────────────────────────────────────

const ADMIN_ID  = '00000000-0000-0000-0000-000000000001'
const SELLER_ID = '00000000-0000-0000-0000-000000000002'
const BUYER_ID  = '00000000-0000-0000-0000-000000000003'

// ─── Image position sequence (10 per listing) ─────────────────────────────────

const POSITION_SEQUENCE: ImagePosition[] = [
  ImagePosition.EXTERIOR_FRONT,
  ImagePosition.EXTERIOR_SIDE_LEFT,
  ImagePosition.EXTERIOR_SIDE_RIGHT,
  ImagePosition.EXTERIOR_REAR,
  ImagePosition.INTERIOR_DASH,
  ImagePosition.INTERIOR_SEATS,
  ImagePosition.INTERIOR_SEATS,
  ImagePosition.INTERIOR_DASH,
  ImagePosition.ENGINE,
  ImagePosition.ODOMETER,
]

// ─── Seed Supabase auth users ─────────────────────────────────────────────────

async function seedAuthUsers() {
  const admin = createAdminClient()
  const TEST_PASSWORD = 'chayong-test-2026!'

  const users = [
    { id: ADMIN_ID,  email: 'admin@chayong.kr' },
    { id: SELLER_ID, email: 'seller@chayong.kr' },
    { id: BUYER_ID,  email: 'buyer@chayong.kr' },
  ]

  for (const u of users) {
    const { data: existing } = await admin.auth.admin.getUserById(u.id)
    if (existing?.user) {
      await admin.auth.admin.updateUserById(u.id, {
        password: TEST_PASSWORD,
        email_confirm: true,
      })
      console.log(`  auth user updated: ${u.email}`)
    } else {
      const { error } = await admin.auth.admin.createUser({
        id: u.id,
        email: u.email,
        password: TEST_PASSWORD,
        email_confirm: true,
      })
      if (error) throw new Error(`Failed to create auth user ${u.email}: ${error.message}`)
      console.log(`  auth user created: ${u.email}`)
    }
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('Seeding database...')

  await seedAuthUsers()

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

    // ── 2. Listings (5 rich listings) ────────────────────────────────────────

    const listings = await Promise.all([
      // — TRANSFER 1: 현대 아반떼 CN7
      tx.listing.create({
        data: {
          sellerId: SELLER_ID,
          type: ListingType.TRANSFER,
          status: ListingStatus.ACTIVE,
          brand: '현대',
          model: '아반떼',
          trim: '인스퍼레이션 1.6 가솔린',
          year: 2022,
          mileage: 28400,
          color: '어비스 블랙 펄',
          fuelType: FuelType.GASOLINE,
          transmission: Transmission.AUTO,
          displacement: 1598,
          bodyType: BodyType.SEDAN,
          drivetrain: Drivetrain.FF,
          plateType: PlateType.PRIVATE,
          vin: 'KMHLN81CBNU123456',
          plateNumber: '23가4521',
          seatingCapacity: 5,
          monthlyPayment: 420000,
          initialCost: 0,
          remainingMonths: 28,
          totalPrice: 22000000,
          remainingBalance: 11760000,
          transferFee: 120000,
          carryoverPremium: 1500000,
          capitalCompany: '현대캐피탈',
          accidentCount: 0,
          ownerCount: 1,
          exteriorGrade: Grade.A,
          interiorGrade: Grade.A,
          mileageVerified: true,
          registrationRegion: '서울특별시',
          inspectionDate: new Date('2026-03-15'),
          isVerified: true,
          options: [
            'navigation', 'rear_camera', 'smart_key', 'ventilated_seats',
            'heated_seats', 'heated_steering', 'lane_assist', 'adaptive_cruise',
            'apple_carplay', 'android_auto', 'led_headlight', 'alloy_wheel',
          ],
          description: '1인 소유·무사고 차량입니다. 실내 매우 깨끗하며 잔여 약정 2년 4개월입니다.',
        },
      }),

      // — TRANSFER 2: 제네시스 G80 RG3
      tx.listing.create({
        data: {
          sellerId: SELLER_ID,
          type: ListingType.TRANSFER,
          status: ListingStatus.ACTIVE,
          brand: '제네시스',
          model: 'G80',
          trim: '3.5 가솔린 터보 AWD',
          year: 2023,
          mileage: 15200,
          color: '탄자나이트 블루',
          fuelType: FuelType.GASOLINE,
          transmission: Transmission.AUTO,
          displacement: 3470,
          bodyType: BodyType.SEDAN,
          drivetrain: Drivetrain.AWD,
          plateType: PlateType.PRIVATE,
          vin: 'KMHG341BJPA654321',
          plateNumber: '321허7842',
          seatingCapacity: 5,
          monthlyPayment: 1240000,
          initialCost: 0,
          remainingMonths: 34,
          totalPrice: 85000000,
          remainingBalance: 42160000,
          transferFee: 180000,
          carryoverPremium: 3000000,
          capitalCompany: '현대캐피탈',
          accidentCount: 1,
          ownerCount: 1,
          exteriorGrade: Grade.A,
          interiorGrade: Grade.A,
          mileageVerified: true,
          registrationRegion: '경기도',
          isVerified: true,
          options: [
            'navigation', 'panoramic_sunroof', 'around_view', 'ventilated_seats',
            'heated_seats', 'memory_seats', 'leather_seats', 'hud',
            'adaptive_cruise', 'auto_emergency_brake', 'premium_audio',
            'wireless_charger', 'ambient_light', 'power_tailgate', 'led_headlight',
          ],
          description: '제네시스 하우스 멤버십 차량. 가벼운 접촉사고 1회 있으나 무교환. 옵션 풀 장착.',
        },
      }),

      // — USED_LEASE 1: BMW 520i M Sport
      tx.listing.create({
        data: {
          sellerId: SELLER_ID,
          type: ListingType.USED_LEASE,
          status: ListingStatus.ACTIVE,
          brand: 'BMW',
          model: '5 Series',
          trim: '520i M Sport',
          year: 2023,
          mileage: 22100,
          color: '알파인 화이트',
          fuelType: FuelType.GASOLINE,
          transmission: Transmission.AUTO,
          displacement: 1998,
          bodyType: BodyType.SEDAN,
          drivetrain: Drivetrain.FR,
          plateType: PlateType.PRIVATE,
          vin: 'WBA5A5C50NG123789',
          plateNumber: '45하9134',
          seatingCapacity: 5,
          monthlyPayment: 960000,
          initialCost: 0,
          remainingMonths: 22,
          totalPrice: null,
          remainingBalance: null,
          transferFee: 200000,
          deposit: 8000000,
          terminationFee: 1800000,
          mileageLimit: 20000,
          capitalCompany: 'BMW Financial Services',
          accidentCount: 0,
          ownerCount: 1,
          exteriorGrade: Grade.A,
          interiorGrade: Grade.A,
          mileageVerified: true,
          registrationRegion: '서울특별시',
          inspectionDate: new Date('2026-02-28'),
          isVerified: true,
          options: [
            'navigation', 'panoramic_sunroof', 'heated_seats', 'leather_seats',
            'adaptive_cruise', 'lane_assist', 'blind_spot', 'around_view',
            'apple_carplay', 'premium_audio', 'ambient_light', 'led_headlight',
            'alloy_wheel',
          ],
          description: 'BMW FS 리스 승계 매물. 잔여 22개월, 보증 이관 가능.',
        },
      }),

      // — USED_LEASE 2: 벤츠 E350 4MATIC
      tx.listing.create({
        data: {
          sellerId: SELLER_ID,
          type: ListingType.USED_LEASE,
          status: ListingStatus.ACTIVE,
          brand: '메르세데스-벤츠',
          model: 'E-Class',
          trim: 'E350 4MATIC AMG Line',
          year: 2024,
          mileage: 8400,
          color: '옵시디언 블랙',
          fuelType: FuelType.GASOLINE,
          transmission: Transmission.AUTO,
          displacement: 1999,
          bodyType: BodyType.SEDAN,
          drivetrain: Drivetrain.AWD,
          plateType: PlateType.PRIVATE,
          vin: 'WDD2130231A987654',
          plateNumber: '88수1023',
          seatingCapacity: 5,
          monthlyPayment: 1380000,
          initialCost: 0,
          remainingMonths: 36,
          totalPrice: null,
          remainingBalance: null,
          transferFee: 250000,
          deposit: 12000000,
          terminationFee: 2500000,
          mileageLimit: 25000,
          capitalCompany: '메르세데스-벤츠 파이낸셜',
          accidentCount: 0,
          ownerCount: 1,
          exteriorGrade: Grade.A,
          interiorGrade: Grade.A,
          mileageVerified: true,
          registrationRegion: '서울특별시',
          isVerified: true,
          options: [
            'navigation', 'panoramic_sunroof', 'ventilated_seats', 'heated_seats',
            'memory_seats', 'leather_seats', 'hud', 'adaptive_cruise',
            'lane_assist', 'auto_emergency_brake', 'premium_audio',
            'wireless_charger', 'ambient_light', 'power_tailgate', 'led_headlight',
          ],
          description: '거의 신차 수준의 E350 리스 승계. 주행 1만km 미만.',
        },
      }),

      // — USED_RENTAL 1: 기아 K8 3.5
      tx.listing.create({
        data: {
          sellerId: SELLER_ID,
          type: ListingType.USED_RENTAL,
          status: ListingStatus.ACTIVE,
          brand: '기아',
          model: 'K8',
          trim: '3.5 가솔린 시그니처',
          year: 2023,
          mileage: 35800,
          color: '스노우 화이트 펄',
          fuelType: FuelType.GASOLINE,
          transmission: Transmission.AUTO,
          displacement: 3470,
          bodyType: BodyType.SEDAN,
          drivetrain: Drivetrain.FF,
          plateType: PlateType.COMMERCIAL,
          vin: 'KNALD4AC5NA456789',
          plateNumber: '56아7123',
          seatingCapacity: 5,
          monthlyPayment: 820000,
          initialCost: 0,
          remainingMonths: 30,
          totalPrice: null,
          remainingBalance: null,
          transferFee: 150000,
          deposit: 5000000,
          terminationFee: 1200000,
          mileageLimit: 30000,
          capitalCompany: '롯데렌탈',
          accidentCount: 2,
          ownerCount: 1,
          exteriorGrade: Grade.B,
          interiorGrade: Grade.A,
          mileageVerified: false,
          registrationRegion: '부산광역시',
          isVerified: false,
          options: [
            'navigation', 'rear_camera', 'heated_seats', 'ventilated_seats',
            'smart_key', 'remote_start', 'apple_carplay', 'premium_audio',
            'led_headlight', 'alloy_wheel',
          ],
          description: '롯데렌탈 장기 렌트 승계. 경미 접촉 2회. 서스펜션 양호.',
        },
      }),
    ])

    console.log(`  Created ${listings.length} listings`)

    // ── 3. Listing Images (10 per listing) ───────────────────────────────────

    for (const [idx, listing] of listings.entries()) {
      const slug = `${listing.brand}-${listing.model}`.replace(/\s+/g, '-').toLowerCase()
      const imagesData = POSITION_SEQUENCE.map((position, i) => ({
        listingId: listing.id,
        url: `https://picsum.photos/seed/${slug}-${idx}-${i}/1200/800`,
        order: i,
        isPrimary: i === 0,
        position,
      }))
      await tx.listingImage.createMany({ data: imagesData })
    }

    console.log(`  Created ${listings.length * POSITION_SEQUENCE.length} listing images`)

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

  console.log(`✅ Seeded 5 listings with 50 images`)
  console.log('Seed complete.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
