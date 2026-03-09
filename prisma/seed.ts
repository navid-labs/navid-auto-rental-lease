import { PrismaClient } from '@prisma/client'
import { createClient } from '@supabase/supabase-js'

const prisma = new PrismaClient()

// ─── Supabase Admin Client (optional, for demo auth accounts) ───

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabaseAdmin = SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
  : null

/**
 * Idempotent auth user creation.
 * Creates a Supabase Auth user or fetches the existing one by email.
 * Returns the user ID (UUID).
 */
async function ensureAuthUser(
  email: string,
  password: string,
  metadata: { role: string; name: string }
): Promise<string | null> {
  if (!supabaseAdmin) return null

  // Try to create the user
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: metadata,
  })

  if (data?.user) {
    return data.user.id
  }

  // If user already exists, fetch by email
  if (error && (error.message.includes('already') || error.message.includes('exists'))) {
    const { data: listData } = await supabaseAdmin.auth.admin.listUsers()
    const existing = listData?.users?.find((u) => u.email === email)
    if (existing) return existing.id
  }

  console.warn(`  ! Could not create/fetch auth user ${email}: ${error?.message}`)
  return null
}

// ─── Seed Data ──────────────────────────────────────────────

type FuelType = 'GASOLINE' | 'DIESEL' | 'HYBRID' | 'ELECTRIC'
type Transmission = 'AUTOMATIC' | 'MANUAL' | 'DCT'

interface TrimData {
  name: string
  fuel: FuelType
  cc: number
  trans: Transmission
}

interface ModelData {
  name: string
  nameKo?: string
  gen: string
  startYear: number
  trims: TrimData[]
}

interface BrandData {
  name: string
  nameKo: string
  models: ModelData[]
}

// 브랜드 → 모델 → 세대 → 트림 (엑셀 데이터 + 국산차 수동 추가)
const brands: BrandData[] = [
  // ─── 국산 브랜드 ───
  {
    name: 'Hyundai', nameKo: '현대',
    models: [
      { name: 'Sonata', nameKo: '소나타', gen: 'DN8', startYear: 2019, trims: [
        { name: '가솔린 2.0 모던', fuel: 'GASOLINE', cc: 1999, trans: 'AUTOMATIC' },
        { name: '가솔린 2.0 인스퍼레이션', fuel: 'GASOLINE', cc: 1999, trans: 'AUTOMATIC' },
        { name: '하이브리드 2.0 프리미엄', fuel: 'HYBRID', cc: 1999, trans: 'AUTOMATIC' },
      ]},
      { name: 'Avante', nameKo: '아반떼', gen: 'CN7', startYear: 2020, trims: [
        { name: '가솔린 1.6 스마트', fuel: 'GASOLINE', cc: 1598, trans: 'AUTOMATIC' },
        { name: '가솔린 1.6 프리미엄', fuel: 'GASOLINE', cc: 1598, trans: 'AUTOMATIC' },
      ]},
      { name: 'Tucson', nameKo: '투싼', gen: 'NX4', startYear: 2021, trims: [
        { name: '가솔린 1.6T 모던', fuel: 'GASOLINE', cc: 1598, trans: 'DCT' },
        { name: '디젤 2.0 프리미엄', fuel: 'DIESEL', cc: 1997, trans: 'AUTOMATIC' },
        { name: '하이브리드 1.6T 프리미엄', fuel: 'HYBRID', cc: 1598, trans: 'AUTOMATIC' },
      ]},
      { name: 'Grandeur', nameKo: '그랜저', gen: 'GN7', startYear: 2022, trims: [
        { name: '가솔린 2.5 프리미엄', fuel: 'GASOLINE', cc: 2497, trans: 'AUTOMATIC' },
        { name: '하이브리드 1.6T 캘리그래피', fuel: 'HYBRID', cc: 1598, trans: 'AUTOMATIC' },
      ]},
      { name: 'Palisade', nameKo: '팰리세이드', gen: 'LX2', startYear: 2018, trims: [
        { name: '디젤 2.2 캘리그래피 7인승', fuel: 'DIESEL', cc: 2199, trans: 'AUTOMATIC' },
        { name: '가솔린 3.8 캘리그래피 7인승', fuel: 'GASOLINE', cc: 3778, trans: 'AUTOMATIC' },
      ]},
    ],
  },
  {
    name: 'Kia', nameKo: '기아',
    models: [
      { name: 'K5', nameKo: 'K5', gen: 'DL3', startYear: 2019, trims: [
        { name: '가솔린 2.0 트렌디', fuel: 'GASOLINE', cc: 1999, trans: 'AUTOMATIC' },
        { name: '가솔린 2.0 프레스티지', fuel: 'GASOLINE', cc: 1999, trans: 'AUTOMATIC' },
        { name: '하이브리드 1.6T 프레스티지', fuel: 'HYBRID', cc: 1598, trans: 'AUTOMATIC' },
      ]},
      { name: 'Sportage', nameKo: '스포티지', gen: 'NQ5', startYear: 2021, trims: [
        { name: '가솔린 1.6T 트렌디', fuel: 'GASOLINE', cc: 1598, trans: 'DCT' },
        { name: '디젤 2.0 프레스티지', fuel: 'DIESEL', cc: 1997, trans: 'AUTOMATIC' },
        { name: '하이브리드 1.6T 프레스티지', fuel: 'HYBRID', cc: 1598, trans: 'AUTOMATIC' },
      ]},
      { name: 'Sorento', nameKo: '쏘렌토', gen: 'MQ4', startYear: 2020, trims: [
        { name: '디젤 2.2 프레스티지 7인승', fuel: 'DIESEL', cc: 2199, trans: 'AUTOMATIC' },
        { name: '하이브리드 1.6T 시그니처 7인승', fuel: 'HYBRID', cc: 1598, trans: 'AUTOMATIC' },
      ]},
      { name: 'EV6', nameKo: 'EV6', gen: 'CV', startYear: 2021, trims: [
        { name: 'Standard RWD', fuel: 'ELECTRIC', cc: 0, trans: 'AUTOMATIC' },
        { name: 'Long Range AWD', fuel: 'ELECTRIC', cc: 0, trans: 'AUTOMATIC' },
      ]},
    ],
  },
  {
    name: 'Genesis', nameKo: '제네시스',
    models: [
      { name: 'G80', nameKo: 'G80', gen: 'RG3', startYear: 2020, trims: [
        { name: '가솔린 2.5T 럭셔리', fuel: 'GASOLINE', cc: 2497, trans: 'AUTOMATIC' },
        { name: '디젤 2.2 프레스티지', fuel: 'DIESEL', cc: 2199, trans: 'AUTOMATIC' },
      ]},
      { name: 'GV70', nameKo: 'GV70', gen: 'JK1', startYear: 2021, trims: [
        { name: '가솔린 2.5T 스포트', fuel: 'GASOLINE', cc: 2497, trans: 'AUTOMATIC' },
        { name: '디젤 2.2 럭셔리', fuel: 'DIESEL', cc: 2199, trans: 'AUTOMATIC' },
      ]},
      { name: 'GV80', nameKo: 'GV80', gen: 'JX1', startYear: 2020, trims: [
        { name: '가솔린 2.5T 럭셔리 5인승', fuel: 'GASOLINE', cc: 2497, trans: 'AUTOMATIC' },
        { name: '디젤 3.0 캘리그래피 7인승', fuel: 'DIESEL', cc: 2996, trans: 'AUTOMATIC' },
      ]},
    ],
  },

  // ─── 수입 브랜드 (엑셀 기반) ───
  {
    name: 'BMW', nameKo: 'BMW',
    models: [
      { name: '3 Series', gen: 'G20', startYear: 2018, trims: [
        { name: '320i', fuel: 'GASOLINE', cc: 1998, trans: 'AUTOMATIC' },
        { name: '320d xDrive', fuel: 'DIESEL', cc: 1995, trans: 'AUTOMATIC' },
        { name: '330i M Sport', fuel: 'GASOLINE', cc: 1998, trans: 'AUTOMATIC' },
      ]},
      { name: '5 Series', gen: 'G30', startYear: 2016, trims: [
        { name: '520i Luxury', fuel: 'GASOLINE', cc: 1998, trans: 'AUTOMATIC' },
        { name: '520d Luxury', fuel: 'DIESEL', cc: 1995, trans: 'AUTOMATIC' },
        { name: '530i M Sport', fuel: 'GASOLINE', cc: 1998, trans: 'AUTOMATIC' },
        { name: '540i xDrive M Sport', fuel: 'GASOLINE', cc: 2998, trans: 'AUTOMATIC' },
      ]},
      { name: 'X3', gen: 'G01', startYear: 2017, trims: [
        { name: 'xDrive20d', fuel: 'DIESEL', cc: 1995, trans: 'AUTOMATIC' },
        { name: 'xDrive30i M Sport', fuel: 'GASOLINE', cc: 1998, trans: 'AUTOMATIC' },
      ]},
      { name: 'X5', gen: 'G05', startYear: 2018, trims: [
        { name: 'xDrive30d', fuel: 'DIESEL', cc: 2993, trans: 'AUTOMATIC' },
        { name: 'xDrive40i M Sport', fuel: 'GASOLINE', cc: 2998, trans: 'AUTOMATIC' },
      ]},
    ],
  },
  {
    name: 'Mercedes-Benz', nameKo: '벤츠',
    models: [
      { name: 'C-Class', gen: 'W206', startYear: 2021, trims: [
        { name: 'C 200 Avantgarde', fuel: 'GASOLINE', cc: 1496, trans: 'AUTOMATIC' },
        { name: 'C 220d AMG Line', fuel: 'DIESEL', cc: 1993, trans: 'AUTOMATIC' },
        { name: 'C 300 4MATIC AMG Line', fuel: 'GASOLINE', cc: 1999, trans: 'AUTOMATIC' },
      ]},
      { name: 'E-Class', gen: 'W214', startYear: 2023, trims: [
        { name: 'E 200 Exclusive', fuel: 'GASOLINE', cc: 1999, trans: 'AUTOMATIC' },
        { name: 'E 220d 4MATIC AMG Line', fuel: 'DIESEL', cc: 1993, trans: 'AUTOMATIC' },
        { name: 'E 300 4MATIC Exclusive', fuel: 'GASOLINE', cc: 1999, trans: 'AUTOMATIC' },
      ]},
      { name: 'GLC', gen: 'X254', startYear: 2022, trims: [
        { name: 'GLC 200 4MATIC', fuel: 'GASOLINE', cc: 1999, trans: 'AUTOMATIC' },
        { name: 'GLC 300 4MATIC AMG Line', fuel: 'GASOLINE', cc: 1999, trans: 'AUTOMATIC' },
      ]},
    ],
  },
  {
    name: 'Audi', nameKo: '아우디',
    models: [
      { name: 'A6', gen: 'C8', startYear: 2018, trims: [
        { name: '45 TFSI quattro Premium', fuel: 'GASOLINE', cc: 1984, trans: 'AUTOMATIC' },
        { name: '40 TDI Premium', fuel: 'DIESEL', cc: 1968, trans: 'AUTOMATIC' },
      ]},
      { name: 'Q5', gen: 'FY', startYear: 2017, trims: [
        { name: '45 TFSI quattro Premium', fuel: 'GASOLINE', cc: 1984, trans: 'AUTOMATIC' },
        { name: '40 TDI quattro Premium', fuel: 'DIESEL', cc: 1968, trans: 'AUTOMATIC' },
      ]},
    ],
  },
  {
    name: 'Volvo', nameKo: '볼보',
    models: [
      { name: 'XC60', gen: 'SPA', startYear: 2017, trims: [
        { name: 'B5 Momentum', fuel: 'GASOLINE', cc: 1969, trans: 'AUTOMATIC' },
        { name: 'B6 Inscription', fuel: 'GASOLINE', cc: 1969, trans: 'AUTOMATIC' },
      ]},
      { name: 'XC90', gen: 'SPA', startYear: 2015, trims: [
        { name: 'B6 Momentum', fuel: 'GASOLINE', cc: 1969, trans: 'AUTOMATIC' },
        { name: 'Recharge T8 Inscription', fuel: 'HYBRID', cc: 1969, trans: 'AUTOMATIC' },
      ]},
    ],
  },
  {
    name: 'Porsche', nameKo: '포르쉐',
    models: [
      { name: 'Cayenne', gen: 'E3', startYear: 2018, trims: [
        { name: 'Cayenne', fuel: 'GASOLINE', cc: 2995, trans: 'AUTOMATIC' },
        { name: 'Cayenne S', fuel: 'GASOLINE', cc: 2894, trans: 'AUTOMATIC' },
      ]},
      { name: 'Macan', gen: '95B', startYear: 2014, trims: [
        { name: 'Macan', fuel: 'GASOLINE', cc: 1984, trans: 'DCT' },
        { name: 'Macan S', fuel: 'GASOLINE', cc: 2894, trans: 'DCT' },
      ]},
    ],
  },
]

// 중고차 가격 생성 (트림/연식 기반)
const BASE_PRICES: Record<string, Record<string, number>> = {
  Hyundai:         { Sonata: 2200, Avante: 1600, Tucson: 2600, Grandeur: 3200, Palisade: 3800 },
  Kia:             { K5: 2100, Sportage: 2500, Sorento: 3000, EV6: 3500 },
  Genesis:         { G80: 4200, GV70: 4000, GV80: 5500 },
  BMW:             { '3 Series': 3500, '5 Series': 5000, X3: 4500, X5: 7000 },
  'Mercedes-Benz': { 'C-Class': 3800, 'E-Class': 5500, GLC: 5000 },
  Audi:            { A6: 4200, Q5: 4500 },
  Volvo:           { XC60: 4000, XC90: 5500 },
  Porsche:         { Cayenne: 8000, Macan: 5500 },
}

// Unsplash 차량 이미지 (카테고리별)
const CAR_IMAGES: Record<string, string[]> = {
  sedan: [
    'photo-1555215695-3004980ad54e',
    'photo-1549399542-7e3f8b79c341',
    'photo-1553440569-bcc63803a83d',
    'photo-1619682817481-e994891cd1f5',
    'photo-1580273916550-e323be2ae537',
  ],
  suv: [
    'photo-1519641471654-76ce0107ad1b',
    'photo-1551830820-330a71b99659',
    'photo-1609521263047-f8f205293f24',
    'photo-1603584173870-7f23fdae1b7a',
    'photo-1542362567-b07e54358753',
  ],
  luxury: [
    'photo-1563720223185-11003d516935',
    'photo-1617814076367-b759c7d7e738',
    'photo-1616422285623-13ff0162193c',
  ],
  ev: [
    'photo-1560958089-b8a1929cea89',
    'photo-1593941707882-a5bba14938c7',
  ],
}

const MODEL_CATEGORY: Record<string, Record<string, string>> = {
  Hyundai:         { Sonata: 'sedan', Avante: 'sedan', Tucson: 'suv', Grandeur: 'luxury', Palisade: 'suv' },
  Kia:             { K5: 'sedan', Sportage: 'suv', Sorento: 'suv', EV6: 'ev' },
  Genesis:         { G80: 'luxury', GV70: 'suv', GV80: 'suv' },
  BMW:             { '3 Series': 'sedan', '5 Series': 'sedan', X3: 'suv', X5: 'suv' },
  'Mercedes-Benz': { 'C-Class': 'sedan', 'E-Class': 'luxury', GLC: 'suv' },
  Audi:            { A6: 'sedan', Q5: 'suv' },
  Volvo:           { XC60: 'suv', XC90: 'suv' },
  Porsche:         { Cayenne: 'suv', Macan: 'suv' },
}

function getImageUrl(brand: string, model: string, index: number): string {
  const cat = MODEL_CATEGORY[brand]?.[model] || 'sedan'
  const photos = CAR_IMAGES[cat]
  const photoId = photos[index % photos.length]
  return `https://images.unsplash.com/${photoId}?w=800&h=500&fit=crop&auto=format`
}

const COLORS = ['흰색', '검정', '은색', '회색', '네이비', '레드', '블루']
const YEARS = [2021, 2022, 2023, 2024]

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function randomPick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

// 연식별 감가율
function depreciatedPrice(baseMW: number, year: number): number {
  const age = 2026 - year
  const factor = age === 1 ? 0.85 : age === 2 ? 0.75 : age === 3 ? 0.65 : age === 4 ? 0.55 : 0.50
  // 만원 단위 → 원 단위, 10만원 단위 반올림
  return Math.round((baseMW * factor) / 10) * 10 * 10000
}

// 연식별 주행거리
function mileageForYear(year: number): number {
  const age = 2026 - year
  const base = age * 15000
  return base + randomInt(-3000, 5000)
}

// ─── Demo Account Definitions ───

const DEMO_PASSWORD = 'navid1234!'

const DEMO_ACCOUNTS = {
  admin: { email: 'admin@navid.kr', name: '관리자', role: 'ADMIN' as const },
  dealers: [
    { email: 'dealer1@navid.kr', name: '서울모터스', phone: '02-1234-5678', role: 'DEALER' as const },
    { email: 'dealer2@navid.kr', name: '강남오토', phone: '02-9876-5432', role: 'DEALER' as const },
    { email: 'dealer3@navid.kr', name: '부산카센터', phone: '051-555-1234', role: 'DEALER' as const },
  ],
  customers: [
    { email: 'customer1@navid.kr', name: '김민수', phone: '010-1111-1111', role: 'CUSTOMER' as const },
    { email: 'customer2@navid.kr', name: '이영희', phone: '010-2222-2222', role: 'CUSTOMER' as const },
    { email: 'customer3@navid.kr', name: '박정훈', phone: '010-3333-3333', role: 'CUSTOMER' as const },
    { email: 'customer4@navid.kr', name: '최수진', phone: '010-4444-4444', role: 'CUSTOMER' as const },
    { email: 'customer5@navid.kr', name: '정대한', phone: '010-5555-5555', role: 'CUSTOMER' as const },
  ],
}

// Fixed UUIDs for fallback (when Supabase Auth is not available)
const FALLBACK_IDS = {
  admin: '00000000-0000-0000-0000-000000000001',
  dealers: [
    '00000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000004',
  ],
  customers: [
    '00000000-0000-0000-0000-000000000011',
    '00000000-0000-0000-0000-000000000012',
    '00000000-0000-0000-0000-000000000013',
    '00000000-0000-0000-0000-000000000014',
    '00000000-0000-0000-0000-000000000015',
  ],
}

async function main() {
  console.log('Starting comprehensive seed...\n')

  // ─── 1. Profiles with optional Supabase Auth ───
  if (supabaseAdmin) {
    console.log('[Auth] Supabase Admin client available -- creating auth users')
  } else {
    console.log('[Auth] SUPABASE_SERVICE_ROLE_KEY not set -- using fixed UUIDs (no login support)')
  }

  // Admin
  const adminAuthId = await ensureAuthUser(
    DEMO_ACCOUNTS.admin.email,
    DEMO_PASSWORD,
    { role: 'ADMIN', name: DEMO_ACCOUNTS.admin.name }
  )
  const adminId = adminAuthId ?? FALLBACK_IDS.admin
  await prisma.profile.upsert({
    where: { id: adminId },
    create: { id: adminId, email: DEMO_ACCOUNTS.admin.email, name: DEMO_ACCOUNTS.admin.name, role: 'ADMIN' },
    update: { name: DEMO_ACCOUNTS.admin.name, role: 'ADMIN', email: DEMO_ACCOUNTS.admin.email },
  })
  console.log(`  [OK] Admin: ${DEMO_ACCOUNTS.admin.email} (${adminId.slice(0, 8)}...)`)

  // Dealers
  const dealerIds: string[] = []
  for (let i = 0; i < DEMO_ACCOUNTS.dealers.length; i++) {
    const d = DEMO_ACCOUNTS.dealers[i]
    const authId = await ensureAuthUser(d.email, DEMO_PASSWORD, { role: 'DEALER', name: d.name })
    const id = authId ?? FALLBACK_IDS.dealers[i]
    await prisma.profile.upsert({
      where: { id },
      create: { id, email: d.email, name: d.name, phone: d.phone, role: 'DEALER' },
      update: { name: d.name, role: 'DEALER', phone: d.phone, email: d.email },
    })
    dealerIds.push(id)
    console.log(`  [OK] Dealer: ${d.email} (${id.slice(0, 8)}...)`)
  }

  // Customers
  const customerIds: string[] = []
  for (let i = 0; i < DEMO_ACCOUNTS.customers.length; i++) {
    const c = DEMO_ACCOUNTS.customers[i]
    const authId = await ensureAuthUser(c.email, DEMO_PASSWORD, { role: 'CUSTOMER', name: c.name })
    const id = authId ?? FALLBACK_IDS.customers[i]
    await prisma.profile.upsert({
      where: { id },
      create: { id, email: c.email, name: c.name, phone: c.phone, role: 'CUSTOMER' },
      update: { name: c.name, role: 'CUSTOMER', phone: c.phone, email: c.email },
    })
    customerIds.push(id)
    console.log(`  [OK] Customer: ${c.email} (${id.slice(0, 8)}...)`)
  }
  console.log(`  Total: ${1 + dealerIds.length + customerIds.length} profiles`)

  // ─── 2. Brands -> CarModels -> Generations -> Trims ───
  console.log('\nCreating brand/model/trim hierarchy...')
  const trimIds: { trimId: string; brandName: string; modelName: string; trimName: string }[] = []

  for (const brandData of brands) {
    const brand = await prisma.brand.upsert({
      where: { name: brandData.name },
      create: { name: brandData.name, nameKo: brandData.nameKo },
      update: { nameKo: brandData.nameKo },
    })

    for (const modelData of brandData.models) {
      let carModel = await prisma.carModel.findFirst({
        where: { brandId: brand.id, name: modelData.name },
      })
      if (!carModel) {
        carModel = await prisma.carModel.create({
          data: { brandId: brand.id, name: modelData.name, nameKo: modelData.nameKo },
        })
      }

      let generation = await prisma.generation.findFirst({
        where: { carModelId: carModel.id, name: modelData.gen },
      })
      if (!generation) {
        generation = await prisma.generation.create({
          data: {
            carModelId: carModel.id,
            name: modelData.gen,
            startYear: modelData.startYear,
          },
        })
      }

      for (const trimData of modelData.trims) {
        let trim = await prisma.trim.findFirst({
          where: { generationId: generation.id, name: trimData.name },
        })
        if (!trim) {
          trim = await prisma.trim.create({
            data: {
              generationId: generation.id,
              name: trimData.name,
              fuelType: trimData.fuel,
              engineCC: trimData.cc || null,
              transmission: trimData.trans,
            },
          })
        }
        trimIds.push({
          trimId: trim.id,
          brandName: brandData.name,
          modelName: modelData.name,
          trimName: trimData.name,
        })
      }
    }
    console.log(`  [OK] ${brandData.nameKo} (${brandData.name}): ${brandData.models.length} models`)
  }

  // ─── 3. Vehicles ───
  console.log('\nCreating vehicles...')
  let vehicleCount = 0
  let imageCount = 0

  for (const t of trimIds) {
    const numVehicles = randomInt(1, 2)
    const basePriceMW = BASE_PRICES[t.brandName]?.[t.modelName] || 3000

    for (let i = 0; i < numVehicles; i++) {
      const year = randomPick(YEARS)
      const price = depreciatedPrice(basePriceMW, year)
      const mileage = mileageForYear(year)
      const dealerId = randomPick(dealerIds)

      const vehicle = await prisma.vehicle.create({
        data: {
          trimId: t.trimId,
          dealerId,
          year,
          mileage: Math.max(1000, mileage),
          color: randomPick(COLORS),
          price,
          status: 'AVAILABLE',
          approvalStatus: 'APPROVED',
          approvedBy: adminId,
          approvedAt: new Date(),
          description: `${year}년식 ${t.brandName} ${t.modelName} ${t.trimName}. 정비 완료, 즉시 출고 가능.`,
        },
      })

      // Add 1~3 images per vehicle
      const numImages = randomInt(1, 3)
      for (let imgIdx = 0; imgIdx < numImages; imgIdx++) {
        await prisma.vehicleImage.create({
          data: {
            vehicleId: vehicle.id,
            url: getImageUrl(t.brandName, t.modelName, vehicleCount + imgIdx),
            order: imgIdx,
            isPrimary: imgIdx === 0,
          },
        })
      }
      imageCount += numImages
      vehicleCount++
    }
  }
  console.log(`  [OK] ${vehicleCount} vehicles, ${imageCount} images`)

  // ─── 4. Residual Value Rates ───
  console.log('\nSeeding residual value rates...')
  const sampleRates = [
    { brand: 'Hyundai', model: 'Sonata', year: 2024, rate: 0.42 },
    { brand: 'Hyundai', model: 'Sonata', year: 2023, rate: 0.38 },
    { brand: 'Hyundai', model: 'Tucson', year: 2024, rate: 0.45 },
    { brand: 'Hyundai', model: 'Avante', year: 2024, rate: 0.36 },
    { brand: 'Hyundai', model: 'Grandeur', year: 2024, rate: 0.44 },
    { brand: 'Hyundai', model: 'Palisade', year: 2024, rate: 0.48 },
    { brand: 'Kia', model: 'K5', year: 2024, rate: 0.40 },
    { brand: 'Kia', model: 'Sportage', year: 2024, rate: 0.44 },
    { brand: 'Kia', model: 'Sorento', year: 2024, rate: 0.46 },
    { brand: 'Kia', model: 'EV6', year: 2024, rate: 0.38 },
    { brand: 'Genesis', model: 'G80', year: 2024, rate: 0.48 },
    { brand: 'Genesis', model: 'GV70', year: 2024, rate: 0.50 },
    { brand: 'Genesis', model: 'GV80', year: 2024, rate: 0.52 },
    { brand: 'BMW', model: '3 Series', year: 2024, rate: 0.46 },
    { brand: 'BMW', model: '5 Series', year: 2024, rate: 0.44 },
    { brand: 'BMW', model: 'X3', year: 2024, rate: 0.47 },
    { brand: 'BMW', model: 'X5', year: 2024, rate: 0.50 },
    { brand: 'Mercedes-Benz', model: 'C-Class', year: 2024, rate: 0.45 },
    { brand: 'Mercedes-Benz', model: 'E-Class', year: 2024, rate: 0.47 },
    { brand: 'Mercedes-Benz', model: 'GLC', year: 2024, rate: 0.48 },
    { brand: 'Audi', model: 'A6', year: 2024, rate: 0.42 },
    { brand: 'Audi', model: 'Q5', year: 2024, rate: 0.44 },
    { brand: 'Volvo', model: 'XC60', year: 2024, rate: 0.43 },
    { brand: 'Volvo', model: 'XC90', year: 2024, rate: 0.46 },
    { brand: 'Porsche', model: 'Cayenne', year: 2024, rate: 0.55 },
    { brand: 'Porsche', model: 'Macan', year: 2024, rate: 0.52 },
  ]

  let rateSeeded = 0
  for (const entry of sampleRates) {
    const brand = await prisma.brand.findFirst({ where: { name: entry.brand } })
    if (!brand) continue
    const carModel = await prisma.carModel.findFirst({
      where: { brandId: brand.id, name: entry.model },
    })
    if (!carModel) continue

    await prisma.residualValueRate.upsert({
      where: {
        brandId_carModelId_year: {
          brandId: brand.id,
          carModelId: carModel.id,
          year: entry.year,
        },
      },
      create: { brandId: brand.id, carModelId: carModel.id, year: entry.year, rate: entry.rate },
      update: { rate: entry.rate },
    })
    rateSeeded++
  }
  console.log(`  [OK] ${rateSeeded} residual value rates`)

  // ─── 5. Demo Contracts in All Statuses ───
  console.log('\nCreating demo contracts...')

  // Get some vehicles for contracts
  const vehicles = await prisma.vehicle.findMany({
    take: 20,
    include: {
      trim: {
        include: {
          generation: {
            include: { carModel: { include: { brand: true } } },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  if (vehicles.length < 13) {
    console.warn('  ! Not enough vehicles for contract demo data')
  }

  const now = new Date()
  const monthsAgo = (m: number) => new Date(now.getFullYear(), now.getMonth() - m, now.getDate())
  const monthsFromNow = (m: number) => new Date(now.getFullYear(), now.getMonth() + m, now.getDate())

  type ContractSpec = {
    type: 'RENTAL' | 'LEASE'
    status: 'DRAFT' | 'PENDING_EKYC' | 'PENDING_APPROVAL' | 'APPROVED' | 'ACTIVE' | 'COMPLETED' | 'CANCELED'
    monthly: number
    deposit: number
    startDate?: Date
    endDate?: Date
    residualRate?: number
  }

  const contractSpecs: ContractSpec[] = [
    // DRAFT (2)
    { type: 'RENTAL', status: 'DRAFT', monthly: 450000, deposit: 3000000 },
    { type: 'LEASE', status: 'DRAFT', monthly: 550000, deposit: 5000000, residualRate: 0.42 },
    // PENDING_EKYC (1)
    { type: 'RENTAL', status: 'PENDING_EKYC', monthly: 380000, deposit: 3000000 },
    // PENDING_APPROVAL (2)
    { type: 'RENTAL', status: 'PENDING_APPROVAL', monthly: 420000, deposit: 4000000 },
    { type: 'LEASE', status: 'PENDING_APPROVAL', monthly: 680000, deposit: 8000000, residualRate: 0.45 },
    // APPROVED (2)
    { type: 'RENTAL', status: 'APPROVED', monthly: 350000, deposit: 3000000 },
    { type: 'LEASE', status: 'APPROVED', monthly: 520000, deposit: 6000000, residualRate: 0.40 },
    // ACTIVE (3)
    { type: 'RENTAL', status: 'ACTIVE', monthly: 480000, deposit: 5000000, startDate: monthsAgo(3), endDate: monthsFromNow(9) },
    { type: 'RENTAL', status: 'ACTIVE', monthly: 320000, deposit: 3000000, startDate: monthsAgo(6), endDate: monthsFromNow(6) },
    { type: 'LEASE', status: 'ACTIVE', monthly: 750000, deposit: 10000000, startDate: monthsAgo(2), endDate: monthsFromNow(22), residualRate: 0.48 },
    // COMPLETED (2)
    { type: 'RENTAL', status: 'COMPLETED', monthly: 400000, deposit: 4000000, startDate: monthsAgo(14), endDate: monthsAgo(2) },
    { type: 'LEASE', status: 'COMPLETED', monthly: 600000, deposit: 7000000, startDate: monthsAgo(26), endDate: monthsAgo(2), residualRate: 0.44 },
    // CANCELED (1)
    { type: 'LEASE', status: 'CANCELED', monthly: 500000, deposit: 5000000, residualRate: 0.38 },
  ]

  let rentalCount = 0
  let leaseCount = 0

  for (let i = 0; i < contractSpecs.length; i++) {
    const spec = contractSpecs[i]
    const vehicle = vehicles[i % vehicles.length]
    const customerId = customerIds[i % customerIds.length]
    const dealerId = vehicle.dealerId
    const duration = spec.startDate && spec.endDate
      ? Math.round((spec.endDate.getTime() - spec.startDate.getTime()) / (1000 * 60 * 60 * 24 * 30))
      : 12
    const totalAmount = spec.monthly * duration + spec.deposit

    if (spec.type === 'RENTAL') {
      await prisma.rentalContract.create({
        data: {
          vehicleId: vehicle.id,
          customerId,
          dealerId,
          status: spec.status,
          startDate: spec.startDate ?? null,
          endDate: spec.endDate ?? null,
          monthlyPayment: spec.monthly,
          deposit: spec.deposit,
          totalAmount,
        },
      })
      rentalCount++
    } else {
      const residualValue = spec.residualRate
        ? Math.round(vehicle.price * spec.residualRate)
        : null
      await prisma.leaseContract.create({
        data: {
          vehicleId: vehicle.id,
          customerId,
          dealerId,
          status: spec.status,
          startDate: spec.startDate ?? null,
          endDate: spec.endDate ?? null,
          monthlyPayment: spec.monthly,
          deposit: spec.deposit,
          residualValue,
          residualRate: spec.residualRate ?? null,
          totalAmount,
        },
      })
      leaseCount++
    }

    // Create EkycVerification for contracts past PENDING_EKYC
    const pastEkyc = ['PENDING_APPROVAL', 'APPROVED', 'ACTIVE', 'COMPLETED'].includes(spec.status)
    if (pastEkyc) {
      const customer = DEMO_ACCOUNTS.customers[i % DEMO_ACCOUNTS.customers.length]
      await prisma.ekycVerification.create({
        data: {
          profileId: customerId,
          contractType: spec.type,
          name: customer.name,
          phone: customer.phone,
          carrier: randomPick(['SKT', 'KT', 'LG U+']),
          birthDate: `19${randomInt(85, 99)}${String(randomInt(1, 12)).padStart(2, '0')}${String(randomInt(1, 28)).padStart(2, '0')}`,
          gender: randomPick(['M', 'F']),
          verified: true,
          verifiedAt: new Date(),
        },
      })
    }
  }

  console.log(`  [OK] ${rentalCount} rental contracts, ${leaseCount} lease contracts`)
  console.log(`  Contract status distribution:`)
  console.log(`    DRAFT: 2, PENDING_EKYC: 1, PENDING_APPROVAL: 2`)
  console.log(`    APPROVED: 2, ACTIVE: 3, COMPLETED: 2, CANCELED: 1`)

  // ─── Summary ───
  const counts = await Promise.all([
    prisma.brand.count(),
    prisma.carModel.count(),
    prisma.trim.count(),
    prisma.vehicle.count(),
    prisma.vehicleImage.count(),
    prisma.residualValueRate.count(),
    prisma.profile.count(),
    prisma.rentalContract.count(),
    prisma.leaseContract.count(),
    prisma.ekycVerification.count(),
  ])
  console.log('\n===================================')
  console.log(`  Brands:          ${counts[0]}`)
  console.log(`  Models:          ${counts[1]}`)
  console.log(`  Trims:           ${counts[2]}`)
  console.log(`  Vehicles:        ${counts[3]}`)
  console.log(`  Images:          ${counts[4]}`)
  console.log(`  Residual Rates:  ${counts[5]}`)
  console.log(`  Profiles:        ${counts[6]}`)
  console.log(`  Rental Contracts:${counts[7]}`)
  console.log(`  Lease Contracts: ${counts[8]}`)
  console.log(`  eKYC Records:    ${counts[9]}`)
  console.log('===================================')
  console.log('Seed complete!')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
