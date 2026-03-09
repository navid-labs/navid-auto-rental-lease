'use server'

import { prisma } from '@/lib/db/prisma'
import { z } from 'zod'

const inquirySchema = z.object({
  vehicleId: z.string().uuid(),
  name: z.string().min(2, '이름을 입력해 주세요'),
  phone: z.string().regex(
    /^01[016789]-?\d{3,4}-?\d{4}$/,
    '올바른 전화번호를 입력해 주세요'
  ),
  message: z
    .string()
    .min(10, '10자 이상 입력해 주세요')
    .max(500, '500자 이하로 입력해 주세요'),
})

export type InquiryFormData = z.infer<typeof inquirySchema>

export async function createInquiry(formData: InquiryFormData) {
  const parsed = inquirySchema.parse(formData)

  await prisma.inquiry.create({
    data: {
      vehicleId: parsed.vehicleId,
      name: parsed.name,
      phone: parsed.phone,
      message: parsed.message,
      status: 'NEW',
    },
  })

  return { success: true }
}
