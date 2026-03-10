import { z } from 'zod'

export const promoRateSchema = z.object({
  brandId: z.string().uuid(),
  rate: z.number().min(0).max(1),
  label: z.string().optional(),
})

export type PromoRateInput = z.infer<typeof promoRateSchema>

export const defaultSettingSchema = z.object({
  key: z.string().min(1),
  value: z.string().min(1),
  label: z.string().min(1),
})

export type DefaultSettingInput = z.infer<typeof defaultSettingSchema>

export const settingsPasswordSchema = z.object({
  password: z.string().min(1),
})

export type SettingsPasswordInput = z.infer<typeof settingsPasswordSchema>
