import type { RawInventoryRow } from './types';
import type { InventoryTableRow, InventoryCategory } from '../types';

function parseCategory(raw: string): InventoryCategory {
  if (raw.includes('전략')) return 'STRATEGIC';
  return 'GENERAL';
}

function parseNumber(value: number | string): number {
  if (typeof value === 'number') return value;
  return parseInt(String(value).replace(/[^0-9-]/g, ''), 10) || 0;
}

function extractBrand(representModel: string): string | null {
  const parts = representModel.trim().split(/\s+/);
  return parts.length > 0 ? parts[0] : null;
}

export function loadFromJson(jsonData: string): InventoryTableRow[] {
  const rows: RawInventoryRow[] = JSON.parse(jsonData);

  if (!Array.isArray(rows)) {
    throw new Error('Expected JSON array of inventory rows');
  }

  return rows.map((row) => ({
    category: parseCategory(row['구분']),
    itemNumber: String(row['번호']),
    promotion: row['프로모션'] ?? null,
    representModel: row['대표차종'],
    modelName: row['차종명'],
    options: row['옵션'] ?? null,
    modelYear: Number(row['연식']),
    exteriorColor: row['외장색'],
    interiorColor: row['내장색'],
    price: parseNumber(row['가격']),
    subsidy: parseNumber(row['보조금']),
    availableQuantity: Number(row['판매가능수량']),
    immediateQuantity: Number(row['즉시출고수량']),
    productionDate: row['생산예시일'] ?? null,
    notice: row['공지'] ?? null,
    brand: extractBrand(row['대표차종']),
  }));
}
