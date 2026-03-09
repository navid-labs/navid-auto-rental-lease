import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * Seed sample residual value rates for common Korean vehicle brands/models.
 * Uses upsert to be idempotent -- safe to re-run.
 */
async function main() {
  console.log('Seeding residual value rates...')

  // Sample rates: brand name -> model name -> year -> rate
  const sampleRates = [
    { brand: 'Hyundai', model: 'Sonata', year: 2024, rate: 0.42 },
    { brand: 'Hyundai', model: 'Sonata', year: 2023, rate: 0.38 },
    { brand: 'Hyundai', model: 'Tucson', year: 2024, rate: 0.45 },
    { brand: 'Kia', model: 'K5', year: 2024, rate: 0.40 },
    { brand: 'Kia', model: 'Sportage', year: 2024, rate: 0.44 },
    { brand: 'Genesis', model: 'G80', year: 2024, rate: 0.48 },
    { brand: 'Genesis', model: 'GV70', year: 2024, rate: 0.50 },
    { brand: 'BMW', model: '3 Series', year: 2024, rate: 0.46 },
    { brand: 'Mercedes-Benz', model: 'E-Class', year: 2024, rate: 0.47 },
  ]

  let seeded = 0
  let skipped = 0

  for (const entry of sampleRates) {
    // Look up brand by name
    const brand = await prisma.brand.findFirst({
      where: { name: entry.brand },
    })
    if (!brand) {
      console.log(`  Skip: brand "${entry.brand}" not found`)
      skipped++
      continue
    }

    // Look up car model by name under this brand
    const carModel = await prisma.carModel.findFirst({
      where: { brandId: brand.id, name: entry.model },
    })
    if (!carModel) {
      console.log(`  Skip: model "${entry.model}" under "${entry.brand}" not found`)
      skipped++
      continue
    }

    await prisma.residualValueRate.upsert({
      where: {
        brandId_carModelId_year: {
          brandId: brand.id,
          carModelId: carModel.id,
          year: entry.year,
        },
      },
      create: {
        brandId: brand.id,
        carModelId: carModel.id,
        year: entry.year,
        rate: entry.rate,
      },
      update: {
        rate: entry.rate,
      },
    })
    console.log(`  Seeded: ${entry.brand} ${entry.model} ${entry.year} -> ${entry.rate * 100}%`)
    seeded++
  }

  console.log(`Done. Seeded: ${seeded}, Skipped: ${skipped}`)
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
