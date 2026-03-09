export type InventoryCategory = 'STRATEGIC' | 'GENERAL';

export type InventoryItem = {
  id: string;
  category: InventoryCategory;
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
  loadedAt: Date;
  createdAt: Date;
};

export type InventoryTableRow = Omit<InventoryItem, 'id' | 'loadedAt' | 'createdAt'>;

export type InventoryFilter = {
  search?: string;
  category?: InventoryCategory;
  brand?: string;
};
