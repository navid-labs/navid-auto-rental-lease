import { describe, it, expect } from 'vitest';
import { loadFromJson } from '@/features/inventory/adapters/json-adapter';

const sampleRow = {
  '구분': '전략구매',
  '번호': '001',
  '프로모션': '특가',
  '대표차종': '현대 아반떼',
  '차종명': '아반떼 1.6 가솔린',
  '옵션': '스마트',
  '연식': 2025,
  '외장색': '흰색',
  '내장색': '블랙',
  '가격': 25000000,
  '보조금': 0,
  '판매가능수량': 10,
  '즉시출고수량': 3,
  '생산예시일': '2025-03',
  '공지': '인기차종',
};

const generalRow = {
  '구분': '일반구매(현대/기아)',
  '번호': '002',
  '프로모션': null,
  '대표차종': '기아 K5',
  '차종명': 'K5 2.0 가솔린',
  '옵션': '프레스티지',
  '연식': 2026,
  '외장색': '검정',
  '내장색': '베이지',
  '가격': 32000000,
  '보조금': 1500000,
  '판매가능수량': 5,
  '즉시출고수량': 0,
  '생산예시일': null,
  '공지': null,
};

describe('loadFromJson', () => {
  it('parses valid JSON array into InventoryItem[] with correct field mapping', () => {
    const json = JSON.stringify([sampleRow]);
    const result = loadFromJson(json);

    expect(result).toHaveLength(1);
    const item = result[0];
    expect(item.category).toBe('STRATEGIC');
    expect(item.itemNumber).toBe('001');
    expect(item.promotion).toBe('특가');
    expect(item.representModel).toBe('현대 아반떼');
    expect(item.modelName).toBe('아반떼 1.6 가솔린');
    expect(item.options).toBe('스마트');
    expect(item.modelYear).toBe(2025);
    expect(item.exteriorColor).toBe('흰색');
    expect(item.interiorColor).toBe('블랙');
    expect(item.price).toBe(25000000);
    expect(item.subsidy).toBe(0);
    expect(item.availableQuantity).toBe(10);
    expect(item.immediateQuantity).toBe(3);
    expect(item.productionDate).toBe('2025-03');
    expect(item.notice).toBe('인기차종');
    expect(item.brand).toBe('현대');
  });

  it('handles 전략구매 vs 일반구매(현대/기아) category correctly', () => {
    const json = JSON.stringify([sampleRow, generalRow]);
    const result = loadFromJson(json);

    expect(result).toHaveLength(2);
    expect(result[0].category).toBe('STRATEGIC');
    expect(result[1].category).toBe('GENERAL');
  });

  it('returns empty array for empty input', () => {
    const result = loadFromJson('[]');
    expect(result).toEqual([]);
  });

  it('throws on malformed JSON', () => {
    expect(() => loadFromJson('not json')).toThrow();
  });

  it('extracts brand from representModel (first word before space)', () => {
    const json = JSON.stringify([
      { ...sampleRow, '대표차종': '제네시스 G80' },
      { ...generalRow, '대표차종': 'BMW 5시리즈' },
    ]);
    const result = loadFromJson(json);
    expect(result[0].brand).toBe('제네시스');
    expect(result[1].brand).toBe('BMW');
  });

  it('handles price as string with commas', () => {
    const json = JSON.stringify([
      { ...sampleRow, '가격': '25,000,000', '보조금': '1,500,000' },
    ]);
    const result = loadFromJson(json);
    expect(result[0].price).toBe(25000000);
    expect(result[0].subsidy).toBe(1500000);
  });
});
