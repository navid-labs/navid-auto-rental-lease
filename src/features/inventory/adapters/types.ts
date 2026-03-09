export type RawInventoryRow = {
  '구분': string;
  '번호': string;
  '프로모션': string | null;
  '대표차종': string;
  '차종명': string;
  '옵션': string | null;
  '연식': number;
  '외장색': string;
  '내장색': string;
  '가격': number | string;
  '보조금': number | string;
  '판매가능수량': number;
  '즉시출고수량': number;
  '생산예시일': string | null;
  '공지': string | null;
};

export type InventoryDataAdapter = {
  load(): Promise<RawInventoryRow[]>;
};
