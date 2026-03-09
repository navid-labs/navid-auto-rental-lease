import { z } from 'zod'

/** 잔가율 관리 폼 Zod 스키마 */
export const residualValueRateSchema = z.object({
  brandId: z.string().uuid('브랜드를 선택해주세요.'),
  carModelId: z.string().uuid('모델을 선택해주세요.'),
  year: z
    .number()
    .int()
    .min(2010, '2010년 이후만 입력 가능합니다.')
    .max(2030, '2030년 이전만 입력 가능합니다.'),
  rate: z
    .number()
    .min(0.01, '잔가율은 1% 이상이어야 합니다.')
    .max(0.99, '잔가율은 99% 이하여야 합니다.'),
})

export type ResidualValueRateInput = z.infer<typeof residualValueRateSchema>
