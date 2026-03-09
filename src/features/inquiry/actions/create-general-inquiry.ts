'use server'

import { prisma } from '@/lib/db/prisma'
import { z } from 'zod'

const generalInquirySchema = z.object({
  name: z.string().min(2, '이름을 입력해 주세요'),
  phone: z.string().regex(
    /^01[016789]-?\d{3,4}-?\d{4}$/,
    '올바른 전화번호를 입력해 주세요'
  ),
  email: z.string().email().optional(),
  message: z
    .string()
    .min(10, '10자 이상 입력해 주세요')
    .max(500, '500자 이하로 입력해 주세요'),
})

export type GeneralInquiryData = z.infer<typeof generalInquirySchema>

export async function createGeneralInquiry(formData: GeneralInquiryData) {
  const parsed = generalInquirySchema.parse(formData)

  await prisma.inquiry.create({
    data: {
      name: parsed.name,
      phone: parsed.phone,
      email: parsed.email || null,
      message: parsed.message,
      status: 'NEW',
    },
  })

  return { success: true }
}
