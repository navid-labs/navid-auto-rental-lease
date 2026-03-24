import { prisma } from '@/lib/db/prisma';
import { loadFromJson } from '../adapters/json-adapter';
import type { InventoryFilter } from '../types';
import type { InventoryCategory as PrismaInventoryCategory } from '@prisma/client';
import type { Prisma } from '@prisma/client';
import sampleData from '../data/sample-inventory.json';

export async function getInventoryItemsQuery(filter: InventoryFilter = {}) {
  const where: Prisma.InventoryItemWhereInput = {};
  const conditions: Prisma.InventoryItemWhereInput[] = [];

  if (filter.search) {
    const search = filter.search;
    conditions.push({
      OR: [
        { modelName: { contains: search, mode: 'insensitive' } },
        { options: { contains: search, mode: 'insensitive' } },
        { exteriorColor: { contains: search, mode: 'insensitive' } },
        { interiorColor: { contains: search, mode: 'insensitive' } },
        { representModel: { contains: search, mode: 'insensitive' } },
      ],
    });
  }

  if (filter.category) {
    conditions.push({ category: filter.category as PrismaInventoryCategory });
  }

  if (filter.brand) {
    conditions.push({ brand: filter.brand });
  }

  if (conditions.length > 0) {
    where.AND = conditions;
  }

  const [items, count] = await Promise.all([
    prisma.inventoryItem.findMany({
      where,
      orderBy: { itemNumber: 'asc' },
    }),
    prisma.inventoryItem.count({ where }),
  ]);

  return { items, count };
}

export async function getInventoryCountQuery() {
  return prisma.inventoryItem.count();
}

export async function getLastUploadTimeQuery(): Promise<Date | null> {
  const item = await prisma.inventoryItem.findFirst({
    orderBy: { loadedAt: 'desc' },
    select: { loadedAt: true },
  });

  return item?.loadedAt ?? null;
}

export async function loadInventoryDataMutation() {
  const jsonStr = JSON.stringify(sampleData);
  const items = loadFromJson(jsonStr);

  await prisma.inventoryItem.deleteMany();

  const data = items.map((item) => ({
    category: item.category as PrismaInventoryCategory,
    itemNumber: item.itemNumber,
    promotion: item.promotion,
    representModel: item.representModel,
    modelName: item.modelName,
    options: item.options,
    modelYear: item.modelYear,
    exteriorColor: item.exteriorColor,
    interiorColor: item.interiorColor,
    price: item.price,
    subsidy: item.subsidy,
    availableQuantity: item.availableQuantity,
    immediateQuantity: item.immediateQuantity,
    productionDate: item.productionDate,
    notice: item.notice,
    brand: item.brand,
  }));

  await prisma.inventoryItem.createMany({ data });

  return { count: data.length };
}
