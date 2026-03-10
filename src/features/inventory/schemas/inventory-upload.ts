import { z } from 'zod';

export const csvRowSchema = z.object({
  category: z.enum(['STRATEGIC', 'GENERAL']),
  itemNumber: z.string().min(1),
  promotion: z.string().optional(),
  representModel: z.string().min(1),
  modelName: z.string().min(1),
  options: z.string().optional(),
  modelYear: z.coerce.number().int().min(2000),
  exteriorColor: z.string().min(1),
  interiorColor: z.string().min(1),
  price: z.coerce.number().int().min(0),
  subsidy: z.coerce.number().int().default(0),
  availableQuantity: z.coerce.number().int().min(0),
  immediateQuantity: z.coerce.number().int().min(0),
  productionDate: z.string().optional(),
  notice: z.string().optional(),
});

export type CsvRow = z.infer<typeof csvRowSchema>;
