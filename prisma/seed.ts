import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

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

async function main() {
  console.log('🌱 Starting comprehensive seed...\n')

  // 1. Profiles (딜러 + 어드민) — Supabase Auth 없이 직접 생성
  console.log('👤 Creating profiles...')
  const adminId = '00000000-0000-0000-0000-000000000001'
  const dealer1Id = '00000000-0000-0000-0000-000000000002'
  const dealer2Id = '00000000-0000-0000-0000-000000000003'

  const profiles = [
    { id: adminId, email: 'admin@navid-auto.kr', name: '관리자', role: 'ADMIN' as const },
    { id: dealer1Id, email: 'dealer1@navid-auto.kr', name: '서울모터스', phone: '02-1234-5678', role: 'DEALER' as const },
    { id: dealer2Id, email: 'dealer2@navid-auto.kr', name: '강남오토', phone: '02-9876-5432', role: 'DEALER' as const },
  ]

  for (const p of profiles) {
    await prisma.profile.upsert({
      where: { id: p.id },
      create: p,
      update: { name: p.name, role: p.role },
    })
  }
  console.log(`  ✓ ${profiles.length} profiles created`)

  // 2. Brands → CarModels → Generations → Trims
  console.log('\n🚗 Creating brand/model/trim hierarchy...')
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
    console.log(`  ✓ ${brandData.nameKo} (${brandData.name}): ${brandData.models.length}모델`)
  }

  // 3. Vehicles (각 트림에서 1~2대 중고차 생성)
  console.log('\n🏷️  Creating vehicles...')
  let vehicleCount = 0
  let imageCount = 0
  const dealers = [dealer1Id, dealer2Id]

  for (const t of trimIds) {
    const numVehicles = randomInt(1, 2)
    const basePriceMW = BASE_PRICES[t.brandName]?.[t.modelName] || 3000

    for (let i = 0; i < numVehicles; i++) {
      const year = randomPick(YEARS)
      const price = depreciatedPrice(basePriceMW, year)
      const mileage = mileageForYear(year)
      const dealerId = randomPick(dealers)

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
  console.log(`  ✓ ${vehicleCount}대 차량, ${imageCount}장 이미지 생성`)

  // 4. Residual Value Rates
  console.log('\n📊 Seeding residual value rates...')
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
  console.log(`  ✓ ${rateSeeded} residual value rates seeded`)

  // Summary
  const counts = await Promise.all([
    prisma.brand.count(),
    prisma.carModel.count(),
    prisma.trim.count(),
    prisma.vehicle.count(),
    prisma.vehicleImage.count(),
    prisma.residualValueRate.count(),
  ])
  console.log('\n═══════════════════════════════════')
  console.log(`  브랜드: ${counts[0]}개`)
  console.log(`  모델:   ${counts[1]}개`)
  console.log(`  트림:   ${counts[2]}개`)
  console.log(`  차량:   ${counts[3]}대`)
  console.log(`  이미지: ${counts[4]}장`)
  console.log(`  잔존가치율: ${counts[5]}개`)
  console.log('═══════════════════════════════════')
  console.log('🌱 Seed complete!')
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
