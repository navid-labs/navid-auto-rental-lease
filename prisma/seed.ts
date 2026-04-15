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

// ─── Image position sequence (6 per listing) ─────────────────────────────────

const POSITION_SEQUENCE: ImagePosition[] = [
  ImagePosition.EXTERIOR_FRONT,
  ImagePosition.EXTERIOR_SIDE_LEFT,
  ImagePosition.EXTERIOR_REAR,
  ImagePosition.INTERIOR_DASH,
  ImagePosition.INTERIOR_SEATS,
  ImagePosition.ENGINE,
]

// ─── Unsplash image IDs per brand ────────────────────────────────────────────

const IMAGES = {
  mercedes: [
    'photo-1676054836355-06ade4ec64f5',
    'photo-1765446925499-71c1c9f797c4',
    'photo-1765446925539-ddd50bed8692',
    'photo-1770364276116-92b507f179ac',
    'photo-1765446925474-1984ae5aadc4',
    'photo-1765446925621-0b01dc8800d3',
  ],
  bmw: [
    'photo-1542906042-f41e62496963',
    'photo-1652890021312-19b10788919a',
    'photo-1652890058094-a3fe8ead30fa',
    'photo-1718903498747-23fb2bc6c85e',
    'photo-1652890196230-4fd9acadd0e5',
    'photo-1652890194149-b6f398082678',
  ],
  genesis: [
    'photo-1714614935738-f953543c8c4d',
    'photo-1710985833965-309a3c0b20e4',
    'photo-1709085582795-4aca78fd76a2',
    'photo-1706061921962-41b17b8a5053',
    'photo-1750380328422-fbe02f196300',
    'photo-1712815780855-5cce5961f8ba',
  ],
  hyundaiSedan: [
    'photo-1678954331903-10fc4703d472',
    'photo-1679558269617-2de50ebf55e0',
    'photo-1682570965698-9eb843b9bd13',
    'photo-1681276159290-29989388a728',
    'photo-1681697120632-19beae7529fb',
    'photo-1681361270520-4cc3961d3b00',
  ],
  kia: [
    'photo-1707268229618-84641aa3c9d5',
    'photo-1678349161221-81e63c7a0af1',
    'photo-1686816982312-16659dfb2dfd',
    'photo-1707183628772-4ab3c3a68dc4',
    'photo-1687419032287-02e696f04d15',
    'photo-1688624381743-8cb5bfb4cc47',
  ],
  audi: [
    'photo-1712483565373-8edf883a2baf',
    'photo-1709124342602-2cc6a2c552d7',
    'photo-1767972885673-1cc21432a2ba',
    'photo-1762028159594-03d92f86b23a',
    'photo-1769174399551-7e3803fbf3ca',
    'photo-1758793248636-da8268a0a423',
  ],
  volvo: [
    'photo-1671051548278-fce15b49e304',
    'photo-1642274726955-594a24fe9a04',
    'photo-1635004426018-11276fe37e94',
    'photo-1608926554325-1c4f1d969ad8',
    'photo-1671051636613-d133dbd781d9',
    'photo-1608926324459-317fbd88ba3e',
  ],
  hyundaiTucson: [
    'photo-1705624843697-4461f9dce482',
    'photo-1704940225548-1420f7fed72f',
    'photo-1706752986827-f784d768d4c3',
    'photo-1706082072635-d19df8f0f3fb',
    'photo-1709774378962-171db2614a30',
    'photo-1646029642262-022158ff5794',
  ],
}

function buildImageUrl(photoId: string): string {
  return `https://images.unsplash.com/${photoId}?w=1200&h=800&fit=crop&q=80`
}

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

    // ── 2. Listings (12 rich listings) ───────────────────────────────────────

    const listings = await Promise.all([
      // ── 1. TRANSFER: 현대 아반떼 CN7 ─────────────────────────────────────
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
          description: '1인 소유·무사고 차량입니다. 실내 매우 깨끗하며 잔여 약정 2년 4개월로 여유롭게 타실 수 있습니다. 현대캐피탈 승계 절차 간편하며 보증 이관 포함. 네비·후방카메라·스마트키 기본, 통풍·열선 시트 완비. 시승 후 결정 가능하며 직거래 우대합니다.',
        },
      }),

      // ── 2. TRANSFER: 제네시스 G80 RG3 ────────────────────────────────────
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
          description: '제네시스 하우스 멤버십 차량입니다. 가벼운 접촉사고 1회 있으나 판금·도색 수준이며 무교환입니다. 3.5T AWD 풀옵션 사양으로 HUD·파노라마루프·빌트인캠·파워트렁크 장착. 잔여 2년 10개월의 여유로운 약정 기간이 남아있어 실 부담이 낮습니다.',
        },
      }),

      // ── 3. USED_LEASE: BMW 520i M Sport ──────────────────────────────────
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
          description: 'BMW FS 리스 승계 매물입니다. 잔여 22개월, 차량 보증 이관 가능합니다. M 스포츠 패키지 적용으로 전·후방 에어로킷, 18인치 M 알로이휠 장착. 무사고 1인 소유 차량이며 실내 상태 최상급. 파노라마루프·하만카돈·주변뷰카메라 포함.',
        },
      }),

      // ── 4. USED_LEASE: 메르세데스-벤츠 E350 4MATIC ───────────────────────
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
          description: '거의 신차 수준의 E350 4MATIC 리스 승계입니다. 주행 8천km 미만으로 실내·외 흠집 없는 최상 컨디션. AMG 라인 공기역학 바디킷·스포츠 서스펜션 적용. 버메스터 서라운드 사운드·HUD·360도 카메라 풀 장착. 잔여 3년 잔여 기간 장기 이용 가능합니다.',
        },
      }),

      // ── 5. USED_RENTAL: 기아 K8 3.5 시그니처 ────────────────────────────
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
          description: '롯데렌탈 장기 렌트 승계 매물입니다. 경미 접촉 2회 이력 있으나 서스펜션·기어박스 양호. 3.5 대배기량 자연흡기 엔진으로 고속도로 주행 안정감 탁월. 7인치 클러스터·파노라믹 디스플레이·고급 크리나 사운드 포함. 하체 점검 완료 서류 제공 가능합니다.',
        },
      }),

      // ── 6. TRANSFER: 현대 투싼 NX4 ───────────────────────────────────────
      tx.listing.create({
        data: {
          sellerId: SELLER_ID,
          type: ListingType.TRANSFER,
          status: ListingStatus.ACTIVE,
          brand: '현대',
          model: '투싼',
          trim: 'NX4 1.6T 스마트 가솔린',
          year: 2023,
          mileage: 25000,
          color: '아틀라스 화이트',
          fuelType: FuelType.GASOLINE,
          transmission: Transmission.AUTO,
          displacement: 1598,
          bodyType: BodyType.SUV,
          drivetrain: Drivetrain.FF,
          plateType: PlateType.PRIVATE,
          vin: 'KMHJN81BXPU234567',
          plateNumber: '12나3456',
          seatingCapacity: 5,
          monthlyPayment: 550000,
          initialCost: 0,
          remainingMonths: 24,
          totalPrice: 32000000,
          remainingBalance: 13200000,
          transferFee: 130000,
          carryoverPremium: 800000,
          capitalCompany: '현대캐피탈',
          accidentCount: 0,
          ownerCount: 1,
          exteriorGrade: Grade.A,
          interiorGrade: Grade.A,
          mileageVerified: true,
          registrationRegion: '경기도',
          inspectionDate: new Date('2026-01-20'),
          isVerified: true,
          options: [
            'navigation', 'rear_camera', 'heated_seats', 'smart_key',
            'apple_carplay', 'led_headlight', 'alloy_wheel', 'lane_assist',
          ],
          description: '무사고 1인 소유 투싼 NX4 승계 매물입니다. 잔여 약정 24개월로 2년간 부담 없이 이용 가능. 1.6T 터보 가솔린 엔진으로 SUV이지만 연비 효율 우수. 후방카메라·애플 카플레이·스마트키 기본 장착. 경기도 등록 차량이며 주중 시승 가능합니다.',
        },
      }),

      // ── 7. USED_LEASE: 아우디 A4 45 TFSI 콰트로 ─────────────────────────
      tx.listing.create({
        data: {
          sellerId: SELLER_ID,
          type: ListingType.USED_LEASE,
          status: ListingStatus.ACTIVE,
          brand: '아우디',
          model: 'A4',
          trim: '45 TFSI 콰트로 S라인',
          year: 2023,
          mileage: 18000,
          color: '나르도 그레이',
          fuelType: FuelType.GASOLINE,
          transmission: Transmission.AUTO,
          displacement: 1984,
          bodyType: BodyType.SEDAN,
          drivetrain: Drivetrain.AWD,
          plateType: PlateType.PRIVATE,
          vin: 'WAUZZZF49PA345678',
          plateNumber: '34다5678',
          seatingCapacity: 5,
          monthlyPayment: 890000,
          initialCost: 0,
          remainingMonths: 30,
          totalPrice: null,
          remainingBalance: null,
          transferFee: 220000,
          deposit: 9000000,
          terminationFee: 2000000,
          mileageLimit: 20000,
          capitalCompany: '아우디 파이낸셜 서비스',
          accidentCount: 0,
          ownerCount: 1,
          exteriorGrade: Grade.A,
          interiorGrade: Grade.A,
          mileageVerified: true,
          registrationRegion: '서울특별시',
          inspectionDate: new Date('2026-03-01'),
          isVerified: true,
          options: [
            'navigation', 'panoramic_sunroof', 'heated_seats', 'ventilated_seats',
            'memory_seats', 'leather_seats', 'around_view', 'adaptive_cruise',
            'lane_assist', 'blind_spot', 'auto_emergency_brake', 'hud',
            'apple_carplay', 'android_auto', 'premium_audio', 'ambient_light',
            'wireless_charger', 'led_headlight', 'alloy_wheel',
          ],
          description: '아우디 파이낸셜 리스 승계 매물입니다. S라인 익스테리어·인테리어 패키지 적용으로 스포티한 디자인. 콰트로 AWD 시스템으로 코너링·안정성 탁월. 버추얼 콕핏·매트릭스 LED·어댑티브 에어 서스펜션 풀 장착. 무사고 1인 소유, 잔여 30개월 여유 있습니다.',
        },
      }),

      // ── 8. USED_RENTAL: 볼보 XC40 T4 인스크립션 ─────────────────────────
      tx.listing.create({
        data: {
          sellerId: SELLER_ID,
          type: ListingType.USED_RENTAL,
          status: ListingStatus.ACTIVE,
          brand: '볼보',
          model: 'XC40',
          trim: 'T4 인스크립션 AWD',
          year: 2022,
          mileage: 32000,
          color: '버건디 레드',
          fuelType: FuelType.GASOLINE,
          transmission: Transmission.AUTO,
          displacement: 1969,
          bodyType: BodyType.SUV,
          drivetrain: Drivetrain.AWD,
          plateType: PlateType.COMMERCIAL,
          vin: 'YV1XZABG5N2456789',
          plateNumber: '78라9012',
          seatingCapacity: 5,
          monthlyPayment: 680000,
          initialCost: 0,
          remainingMonths: 20,
          totalPrice: null,
          remainingBalance: null,
          transferFee: 160000,
          deposit: 6000000,
          terminationFee: 1500000,
          mileageLimit: 35000,
          capitalCompany: 'SK렌터카',
          accidentCount: 1,
          ownerCount: 1,
          exteriorGrade: Grade.B,
          interiorGrade: Grade.A,
          mileageVerified: true,
          registrationRegion: '인천광역시',
          isVerified: true,
          options: [
            'navigation', 'panoramic_sunroof', 'heated_seats', 'memory_seats',
            'leather_seats', 'around_view', 'adaptive_cruise', 'lane_assist',
            'blind_spot', 'auto_emergency_brake', 'apple_carplay', 'premium_audio',
          ],
          description: 'SK렌터카 장기 렌트 승계 매물입니다. 사고 1회 이력(도어 판금)이며 현재 외관 상태 B등급. 볼보 특유의 북유럽 안전 철학 그대로 — 전방충돌방지·파일럿어시스트 탑재. 인스크립션 최상위 트림으로 나파 가죽·파노라마루프·하만카돈 사운드 장착. 인천 등록 차량입니다.',
        },
      }),

      // ── 9. TRANSFER: BMW X3 xDrive20i ────────────────────────────────────
      tx.listing.create({
        data: {
          sellerId: SELLER_ID,
          type: ListingType.TRANSFER,
          status: ListingStatus.ACTIVE,
          brand: 'BMW',
          model: 'X3',
          trim: 'xDrive20i xLine',
          year: 2023,
          mileage: 19500,
          color: '미네랄 화이트',
          fuelType: FuelType.GASOLINE,
          transmission: Transmission.AUTO,
          displacement: 1998,
          bodyType: BodyType.SUV,
          drivetrain: Drivetrain.AWD,
          plateType: PlateType.PRIVATE,
          vin: 'WBA8G9C53NG567890',
          plateNumber: '67마8901',
          seatingCapacity: 5,
          monthlyPayment: 780000,
          initialCost: 0,
          remainingMonths: 26,
          totalPrice: 68000000,
          remainingBalance: 20280000,
          transferFee: 190000,
          carryoverPremium: 2500000,
          capitalCompany: 'BMW Financial Services',
          accidentCount: 0,
          ownerCount: 1,
          exteriorGrade: Grade.A,
          interiorGrade: Grade.A,
          mileageVerified: true,
          registrationRegion: '서울특별시',
          inspectionDate: new Date('2026-02-10'),
          isVerified: true,
          options: [
            'navigation', 'panoramic_sunroof', 'heated_seats', 'ventilated_seats',
            'memory_seats', 'leather_seats', 'around_view', 'adaptive_cruise',
            'lane_assist', 'blind_spot', 'apple_carplay', 'android_auto',
            'premium_audio', 'ambient_light', 'led_headlight',
          ],
          description: '무사고 1인 소유 X3 xDrive20i 승계 매물입니다. xLine 패키지 적용으로 에어 서스펜션·루프레일·19인치 알로이휠 장착. 파노라마 글라스루프·하만카돈 사운드·파킹 어시스턴트 플러스 포함. BMW FS 승계 절차 지원하며 잔여 2년 2개월입니다.',
        },
      }),

      // ── 10. USED_LEASE: 제네시스 GV70 2.5T AWD ───────────────────────────
      tx.listing.create({
        data: {
          sellerId: SELLER_ID,
          type: ListingType.USED_LEASE,
          status: ListingStatus.ACTIVE,
          brand: '제네시스',
          model: 'GV70',
          trim: '2.5T AWD 스탠다드',
          year: 2024,
          mileage: 12000,
          color: '마타도르 레드',
          fuelType: FuelType.GASOLINE,
          transmission: Transmission.AUTO,
          displacement: 2497,
          bodyType: BodyType.SUV,
          drivetrain: Drivetrain.AWD,
          plateType: PlateType.PRIVATE,
          vin: 'KMTHB81BXRU678901',
          plateNumber: '89바0123',
          seatingCapacity: 5,
          monthlyPayment: 1050000,
          initialCost: 0,
          remainingMonths: 32,
          totalPrice: null,
          remainingBalance: null,
          transferFee: 200000,
          deposit: 10000000,
          terminationFee: 2200000,
          mileageLimit: 20000,
          capitalCompany: '현대캐피탈',
          accidentCount: 0,
          ownerCount: 1,
          exteriorGrade: Grade.A,
          interiorGrade: Grade.A,
          mileageVerified: true,
          registrationRegion: '서울특별시',
          inspectionDate: new Date('2026-04-01'),
          isVerified: true,
          options: [
            'navigation', 'panoramic_sunroof', 'around_view', 'ventilated_seats',
            'heated_seats', 'memory_seats', 'leather_seats', 'hud',
            'adaptive_cruise', 'auto_emergency_brake', 'lane_assist', 'blind_spot',
            'premium_audio', 'wireless_charger', 'ambient_light',
            'power_tailgate', 'led_headlight', 'alloy_wheel',
            'apple_carplay', 'android_auto',
          ],
          description: '2024년식 제네시스 GV70 2.5T AWD 리스 승계 매물입니다. 주행 12,000km의 준신차 컨디션. 스탠다드 패키지에 주요 옵션 모두 추가된 사실상 풀옵션 구성. 제네시스 GV70 특유의 크레스트 그릴·파노라마 선루프·럭셔리 인테리어 그대로. 현대캐피탈 승계 간편하며 잔여 32개월입니다.',
        },
      }),

      // ── 11. USED_RENTAL: 기아 EV6 롱레인지 AWD ───────────────────────────
      tx.listing.create({
        data: {
          sellerId: SELLER_ID,
          type: ListingType.USED_RENTAL,
          status: ListingStatus.ACTIVE,
          brand: '기아',
          model: 'EV6',
          trim: '롱레인지 AWD 에어',
          year: 2023,
          mileage: 28000,
          color: '스노우 화이트 펄',
          fuelType: FuelType.EV,
          transmission: Transmission.AUTO,
          displacement: null,
          bodyType: BodyType.SUV,
          drivetrain: Drivetrain.AWD,
          plateType: PlateType.COMMERCIAL,
          vin: 'KNDC3DLC1P5789012',
          plateNumber: '90사1234',
          seatingCapacity: 5,
          monthlyPayment: 720000,
          initialCost: 0,
          remainingMonths: 22,
          totalPrice: null,
          remainingBalance: null,
          transferFee: 170000,
          deposit: 7000000,
          terminationFee: 1600000,
          mileageLimit: 40000,
          capitalCompany: '롯데렌탈',
          accidentCount: 0,
          ownerCount: 1,
          exteriorGrade: Grade.A,
          interiorGrade: Grade.A,
          mileageVerified: true,
          registrationRegion: '대전광역시',
          inspectionDate: new Date('2026-03-20'),
          isVerified: true,
          options: [
            'navigation', 'around_view', 'heated_seats', 'ventilated_seats',
            'memory_seats', 'leather_seats', 'adaptive_cruise', 'lane_assist',
            'blind_spot', 'auto_emergency_brake', 'apple_carplay', 'android_auto',
            'premium_audio', 'wireless_charger', 'led_headlight',
          ],
          description: '기아 EV6 롱레인지 AWD 장기 렌트 승계 매물입니다. 77.4kWh 대용량 배터리로 1회 충전 400km+ 주행 가능. V2L(차량→가전 전력 공급) 기능 탑재. 무사고 1인 소유 차량으로 실내·외 최상 컨디션. 800V 초고속 충전 지원으로 18분 만에 80% 충전 완료. 대전 등록 차량입니다.',
        },
      }),

      // ── 12. TRANSFER: 메르세데스-벤츠 C-Class C200 ───────────────────────
      tx.listing.create({
        data: {
          sellerId: SELLER_ID,
          type: ListingType.TRANSFER,
          status: ListingStatus.ACTIVE,
          brand: '메르세데스-벤츠',
          model: 'C-Class',
          trim: 'C200 아방가르드',
          year: 2022,
          mileage: 31000,
          color: '폴라 화이트',
          fuelType: FuelType.GASOLINE,
          transmission: Transmission.AUTO,
          displacement: 1496,
          bodyType: BodyType.SEDAN,
          drivetrain: Drivetrain.FR,
          plateType: PlateType.PRIVATE,
          vin: 'WDD2060041R890123',
          plateNumber: '11차2345',
          seatingCapacity: 5,
          monthlyPayment: 680000,
          initialCost: 0,
          remainingMonths: 18,
          totalPrice: 58000000,
          remainingBalance: 12240000,
          transferFee: 200000,
          carryoverPremium: 2000000,
          capitalCompany: '메르세데스-벤츠 파이낸셜',
          accidentCount: 1,
          ownerCount: 1,
          exteriorGrade: Grade.B,
          interiorGrade: Grade.A,
          mileageVerified: true,
          registrationRegion: '부산광역시',
          isVerified: true,
          options: [
            'navigation', 'rear_camera', 'heated_seats', 'leather_seats',
            'adaptive_cruise', 'lane_assist', 'auto_emergency_brake',
            'apple_carplay', 'ambient_light', 'led_headlight', 'alloy_wheel',
            'wireless_charger',
          ],
          description: '메르세데스-벤츠 C200 아방가르드 승계 매물입니다. 접촉사고 1회(범퍼 도색) 이력, 현재 외관 B등급. 1.5T 마일드 하이브리드 엔진으로 연비·퍼포먼스 균형 탁월. 3세대 MBUX 인포테인먼트·64색 앰비언트 라이트·디지털 계기판 기본 탑재. 잔여 18개월, 부산 직거래 선호합니다.',
        },
      }),
    ])

    console.log(`  Created ${listings.length} listings`)

    // ── 3. Listing Images (6 per listing, Unsplash) ───────────────────────────

    // 브랜드별 이미지 ID 매핑 (listings 순서와 동일)
    const brandImageMap: string[][] = [
      IMAGES.hyundaiSedan,  // 1. 현대 아반떼
      IMAGES.genesis,       // 2. 제네시스 G80
      IMAGES.bmw,           // 3. BMW 520i
      IMAGES.mercedes,      // 4. 벤츠 E350
      IMAGES.kia,           // 5. 기아 K8
      IMAGES.hyundaiTucson, // 6. 현대 투싼
      IMAGES.audi,          // 7. 아우디 A4
      IMAGES.volvo,         // 8. 볼보 XC40
      IMAGES.bmw,           // 9. BMW X3 (BMW 이미지 재사용)
      IMAGES.genesis,       // 10. 제네시스 GV70 (제네시스 이미지 재사용)
      IMAGES.kia,           // 11. 기아 EV6 (기아 이미지 재사용)
      IMAGES.mercedes,      // 12. 벤츠 C200 (메르세데스 이미지 재사용)
    ]

    for (const [idx, listing] of listings.entries()) {
      const photoIds = brandImageMap[idx]
      const imagesData = POSITION_SEQUENCE.map((position, i) => ({
        listingId: listing.id,
        url: buildImageUrl(photoIds[i]),
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

  console.log(`✅ Seeded 12 listings with 72 images`)
  console.log('Seed complete.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
