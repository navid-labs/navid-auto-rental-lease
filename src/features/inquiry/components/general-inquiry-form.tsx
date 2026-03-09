'use client'

import { useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { createGeneralInquiry } from '@/features/inquiry/actions/create-general-inquiry'
import { CheckCircle2 } from 'lucide-react'
import type { Resolver } from 'react-hook-form'

const generalInquirySchema = z.object({
  name: z.string().min(2, '이름을 입력해 주세요'),
  phone: z.string().regex(
    /^01[016789]-?\d{3,4}-?\d{4}$/,
    '올바른 전화번호를 입력해 주세요'
  ),
  email: z.string().email('올바른 이메일을 입력해 주세요').optional().or(z.literal('')),
  message: z
    .string()
    .min(10, '10자 이상 입력해 주세요')
    .max(500, '500자 이하로 입력해 주세요'),
})

type GeneralInquiryValues = z.infer<typeof generalInquirySchema>

export function GeneralInquiryForm() {
  const [isPending, startTransition] = useTransition()
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<GeneralInquiryValues>({
    resolver: zodResolver(generalInquirySchema) as Resolver<GeneralInquiryValues>,
    defaultValues: {
      name: '',
      phone: '',
      email: '',
      message: '',
    },
  })

  const onSubmit = (data: GeneralInquiryValues) => {
    setError(null)
    startTransition(async () => {
      try {
        await createGeneralInquiry({
          name: data.name,
          phone: data.phone,
          email: data.email || undefined,
          message: data.message,
        })
        setSubmitted(true)
      } catch {
        setError('문의 접수에 실패했습니다. 다시 시도해 주세요.')
      }
    })
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center gap-3 py-8 text-center">
        <CheckCircle2 className="size-10 text-green-500" />
        <h3 className="font-semibold">문의가 접수되었습니다</h3>
        <p className="text-sm text-muted-foreground">
          빠른 시일 내에 연락 드리겠습니다
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="gen-name">이름 *</Label>
        <Input
          id="gen-name"
          placeholder="홍길동"
          {...register('name')}
          aria-invalid={!!errors.name}
        />
        {errors.name && (
          <p className="text-xs text-destructive">{errors.name.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="gen-phone">연락처 *</Label>
        <Input
          id="gen-phone"
          type="tel"
          placeholder="010-1234-5678"
          {...register('phone')}
          aria-invalid={!!errors.phone}
        />
        {errors.phone && (
          <p className="text-xs text-destructive">{errors.phone.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="gen-email">이메일</Label>
        <Input
          id="gen-email"
          type="email"
          placeholder="example@email.com"
          {...register('email')}
          aria-invalid={!!errors.email}
        />
        {errors.email && (
          <p className="text-xs text-destructive">{errors.email.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="gen-message">문의 내용 *</Label>
        <Textarea
          id="gen-message"
          placeholder="렌탈/리스 관련 문의 사항을 입력해 주세요 (10자 이상)"
          rows={5}
          {...register('message')}
          aria-invalid={!!errors.message}
        />
        {errors.message && (
          <p className="text-xs text-destructive">{errors.message.message}</p>
        )}
      </div>

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? '접수 중...' : '문의하기'}
      </Button>
    </form>
  )
}
