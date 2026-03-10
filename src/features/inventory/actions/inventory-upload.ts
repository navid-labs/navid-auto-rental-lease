'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/auth/helpers';
import { csvRowSchema } from '../schemas/inventory-upload';
import type { InventoryCategory } from '../types';
import type { InventoryCategory as PrismaInventoryCategory } from '@prisma/client';

type RowError = { row: number; message: string };

type UploadResult =
  | { success: true; count: number }
  | { success: false; error: string; rowErrors?: RowError[] };

/** Korean header -> field mapping (same as json-adapter) */
const HEADER_MAP: Record<string, string> = {
  '구분': 'category',
  '번호': 'itemNumber',
  '프로모션': 'promotion',
  '대표차종': 'representModel',
  '차종명': 'modelName',
  '옵션': 'options',
  '연식': 'modelYear',
  '외장색': 'exteriorColor',
  '내장색': 'interiorColor',
  '가격': 'price',
  '보조금': 'subsidy',
  '판매가능수량': 'availableQuantity',
  '즉시출고수량': 'immediateQuantity',
  '생산예시일': 'productionDate',
  '공지': 'notice',
};

function parseCategory(raw: string): InventoryCategory {
  if (raw.includes('전략')) return 'STRATEGIC';
  return 'GENERAL';
}

function parseNumber(value: string): number {
  return parseInt(String(value).replace(/[^0-9-]/g, ''), 10) || 0;
}

function extractBrand(representModel: string): string | null {
  const parts = representModel.trim().split(/\s+/);
  return parts.length > 0 ? parts[0] : null;
}

export async function uploadInventoryCsv(formData: FormData): Promise<UploadResult> {
  const user = await getCurrentUser();
  if (!user || user.role !== 'ADMIN') {
    return { success: false, error: '관리자 권한이 필요합니다.' };
  }

  const file = formData.get('file');
  if (!file || !(file instanceof File)) {
    return { success: false, error: 'CSV 파일을 선택해주세요.' };
  }

  if (!file.name.endsWith('.csv')) {
    return { success: false, error: 'CSV 파일만 업로드 가능합니다.' };
  }

  let text = await file.text();

  // Handle BOM and CRLF
  text = text.replace(/^\uFEFF/, '');
  text = text.replace(/\r\n/g, '\n');

  const lines = text.split('\n').filter((line) => line.trim().length > 0);

  if (lines.length < 2) {
    return { success: false, error: 'CSV 파일에 데이터가 없습니다.' };
  }

  // Parse headers
  const headers = lines[0].split(',').map((h) => h.trim());
  const fieldNames = headers.map((h) => HEADER_MAP[h] || h);

  const rowErrors: RowError[] = [];
  const validRows: Array<{
    category: PrismaInventoryCategory;
    itemNumber: string;
    promotion: string | null;
    representModel: string;
    modelName: string;
    options: string | null;
    modelYear: number;
    exteriorColor: string;
    interiorColor: string;
    price: number;
    subsidy: number;
    availableQuantity: number;
    immediateQuantity: number;
    productionDate: string | null;
    notice: string | null;
    brand: string | null;
  }> = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map((v) => v.trim());
    const rawObj: Record<string, string> = {};

    fieldNames.forEach((field, idx) => {
      rawObj[field] = values[idx] || '';
    });

    // Transform category from Korean
    if (rawObj.category) {
      rawObj.category = parseCategory(rawObj.category);
    }

    // Strip commas from numeric fields before parsing
    for (const numField of ['price', 'subsidy', 'availableQuantity', 'immediateQuantity']) {
      if (rawObj[numField]) {
        rawObj[numField] = String(parseNumber(rawObj[numField]));
      }
    }

    const result = csvRowSchema.safeParse(rawObj);

    if (!result.success) {
      const messages = result.error.issues.map(
        (issue) => `${issue.path.join('.')}: ${issue.message}`
      );
      rowErrors.push({ row: i + 1, message: messages.join('; ') });
      continue;
    }

    const data = result.data;
    validRows.push({
      category: data.category as PrismaInventoryCategory,
      itemNumber: data.itemNumber,
      promotion: data.promotion || null,
      representModel: data.representModel,
      modelName: data.modelName,
      options: data.options || null,
      modelYear: data.modelYear,
      exteriorColor: data.exteriorColor,
      interiorColor: data.interiorColor,
      price: data.price,
      subsidy: data.subsidy,
      availableQuantity: data.availableQuantity,
      immediateQuantity: data.immediateQuantity,
      productionDate: data.productionDate || null,
      notice: data.notice || null,
      brand: extractBrand(data.representModel),
    });
  }

  if (rowErrors.length > 0) {
    return {
      success: false,
      error: `${rowErrors.length}개 행에서 오류 발생`,
      rowErrors,
    };
  }

  if (validRows.length === 0) {
    return { success: false, error: '유효한 데이터가 없습니다.' };
  }

  // Delete existing and insert new (full refresh)
  await prisma.inventoryItem.deleteMany();
  await prisma.inventoryItem.createMany({ data: validRows });

  revalidatePath('/admin/inventory');

  return { success: true, count: validRows.length };
}

export async function getLastUploadTime(): Promise<Date | null> {
  const item = await prisma.inventoryItem.findFirst({
    orderBy: { loadedAt: 'desc' },
    select: { loadedAt: true },
  });

  return item?.loadedAt ?? null;
}
