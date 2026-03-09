'use client'

import { useTransition, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { profileUpdateSchema, type ProfileUpdateInput } from '@/features/auth/schemas/auth'
import { updateProfile } from '@/features/auth/actions/profile'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface ProfileFormProps {
  defaultValues: {
    name: string
    phone: string
    email: string
    role: string
  }
}

export function ProfileForm({ defaultValues }: ProfileFormProps) {
  const [isPending, startTransition] = useTransition()
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileUpdateInput>({
    resolver: zodResolver(profileUpdateSchema),
    defaultValues: {
      name: defaultValues.name,
      phone: defaultValues.phone,
    },
  })

  const onSubmit = (data: ProfileUpdateInput) => {
    setMessage(null)
    startTransition(async () => {
      const formData = new FormData()
      formData.set('name', data.name)
      if (data.phone) formData.set('phone', data.phone)

      const result = await updateProfile(formData)
      if (result.error) {
        setMessage({ type: 'error', text: result.error })
      } else {
        setMessage({ type: 'success', text: '프로필이 업데이트되었습니다.' })
      }
    })
  }

  const roleLabelMap: Record<string, string> = {
    CUSTOMER: '고객',
    DEALER: '딜러',
    ADMIN: '관리자',
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Read-only email */}
      <div className="space-y-2">
        <Label>이메일</Label>
        <Input value={defaultValues.email} disabled className="bg-muted" />
      </div>

      {/* Read-only role badge */}
      <div className="space-y-2">
        <Label>역할</Label>
        <div>
          <span className="inline-flex items-center rounded-full bg-accent/10 px-3 py-1 text-sm font-medium text-accent">
            {roleLabelMap[defaultValues.role] || defaultValues.role}
          </span>
        </div>
      </div>

      {/* Editable name */}
      <div className="space-y-2">
        <Label htmlFor="name">이름</Label>
        <Input
          id="name"
          {...register('name')}
          placeholder="이름을 입력하세요"
        />
        {errors.name && (
          <p className="text-sm text-destructive">{errors.name.message}</p>
        )}
      </div>

      {/* Editable phone */}
      <div className="space-y-2">
        <Label htmlFor="phone">전화번호</Label>
        <Input
          id="phone"
          {...register('phone')}
          placeholder="010-0000-0000"
        />
        {errors.phone && (
          <p className="text-sm text-destructive">{errors.phone.message}</p>
        )}
      </div>

      {/* Status message */}
      {message && (
        <p
          className={`text-sm ${
            message.type === 'success' ? 'text-green-600' : 'text-destructive'
          }`}
        >
          {message.text}
        </p>
      )}

      <Button type="submit" disabled={isPending} className="w-full">
        {isPending ? '저장 중...' : '프로필 저장'}
      </Button>
    </form>
  )
}
