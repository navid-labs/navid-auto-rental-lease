'use client'

import { useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { createVehicleInquiry } from '@/lib/api/generated/vehicles/vehicles'
import { CheckCircle2 } from 'lucide-react'
import type { Resolver } from 'react-hook-form'

const inquiryFormSchema = z.object({
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

type InquiryFormValues = z.infer<typeof inquiryFormSchema>

type InquiryFormProps = {
  vehicleId: string
  vehicleTitle: string
  onSuccess?: () => void
}

export function InquiryForm({
  vehicleId,
  vehicleTitle,
  onSuccess,
}: InquiryFormProps) {
  const [isPending, startTransition] = useTransition()
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<InquiryFormValues>({
    resolver: zodResolver(inquiryFormSchema) as Resolver<InquiryFormValues>,
    defaultValues: {
      name: '',
      phone: '',
      message: '',
    },
  })

  const onSubmit = (data: InquiryFormValues) => {
    setError(null)
    startTransition(async () => {
      try {
        await createVehicleInquiry(vehicleId, data)
        setSubmitted(true)
        setTimeout(() => {
          onSuccess?.()
        }, 2000)
      } catch {
        setError('상담 신청에 실패했습니다. 다시 시도해 주세요.')
      }
    })
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center gap-3 py-8 text-center">
        <CheckCircle2 className="size-10 text-green-500" />
        <h3 className="font-semibold">상담 신청이 접수되었습니다</h3>
        <p className="text-sm text-muted-foreground">
          빠른 시일 내에 연락 드리겠습니다
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <p className="text-sm text-muted-foreground">{vehicleTitle}</p>

      <div className="space-y-2">
        <Label htmlFor="name">이름</Label>
        <Input
          id="name"
          placeholder="홍길동"
          {...register('name')}
          aria-invalid={!!errors.name}
        />
        {errors.name && (
          <p className="text-xs text-destructive">{errors.name.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">연락처</Label>
        <Input
          id="phone"
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
        <Label htmlFor="message">상담 내용</Label>
        <Textarea
          id="message"
          placeholder="문의하실 내용을 입력해 주세요 (10자 이상)"
          rows={4}
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
        {isPending ? '신청 중...' : '상담 신청하기'}
      </Button>
    </form>
  )
}
