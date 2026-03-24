import { prisma } from '@/lib/db/prisma'

/**
 * Get all brands sorted by Korean name.
 */
export async function getBrands() {
  return prisma.brand.findMany({
    orderBy: { nameKo: 'asc' },
    select: { id: true, name: true, nameKo: true, logoUrl: true },
  })
}

/**
 * Get car models for a specific brand.
 */
export async function getModelsByBrand(brandId: string) {
  return prisma.carModel.findMany({
    where: { brandId },
    orderBy: { nameKo: 'asc' },
    select: { id: true, name: true, nameKo: true },
  })
}

/**
 * Get generations for a specific car model.
 */
export async function getGenerationsByModel(modelId: string) {
  return prisma.generation.findMany({
    where: { carModelId: modelId },
    orderBy: { startYear: 'desc' },
    select: { id: true, name: true, startYear: true, endYear: true },
  })
}

/**
 * Get trims for a specific generation.
 */
export async function getTrimsByGeneration(generationId: string) {
  return prisma.trim.findMany({
    where: { generationId },
    orderBy: { name: 'asc' },
    select: { id: true, name: true, fuelType: true, engineCC: true, transmission: true },
  })
}
