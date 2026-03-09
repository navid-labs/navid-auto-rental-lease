import { z } from 'zod'

/** Step 1: Vehicle identification (brand/model/trim cascade or plate lookup) */
export const vehicleStep1Schema = z.object({
  brandId: z.string().uuid('브랜드를 선택해주세요.'),
  modelId: z.string().uuid('모델을 선택해주세요.'),
  generationId: z.string().uuid('세대를 선택해주세요.'),
  trimId: z.string().uuid('트림을 선택해주세요.'),
  licensePlate: z.string().optional(),
})

/** Step 2: Vehicle details (year, mileage, color, price) */
export const vehicleStep2Schema = z.object({
  year: z.coerce
    .number()
    .int('연식은 정수여야 합니다.')
    .min(1990, '1990년 이후 차량만 등록 가능합니다.')
    .max(
      new Date().getFullYear() + 1,
      `${new Date().getFullYear() + 1}년 이후는 등록할 수 없습니다.`
    ),
  mileage: z.coerce
    .number()
    .int('주행거리는 정수여야 합니다.')
    .min(0, '주행거리는 0 이상이어야 합니다.'),
  color: z.string().min(1, '색상을 입력해주세요.'),
  price: z.coerce
    .number()
    .int('가격은 정수여야 합니다.')
    .positive('가격은 0보다 커야 합니다.'),
  monthlyRental: z.coerce.number().int().positive().optional(),
  monthlyLease: z.coerce.number().int().positive().optional(),
  description: z.string().optional(),
})

/** Combined schema for full vehicle form submission */
export const vehicleFormSchema = vehicleStep1Schema.merge(vehicleStep2Schema)

/** Inferred types */
export type VehicleStep1Data = z.infer<typeof vehicleStep1Schema>
export type VehicleStep2Data = z.infer<typeof vehicleStep2Schema>
export type VehicleFormSchemaData = z.infer<typeof vehicleFormSchema>
