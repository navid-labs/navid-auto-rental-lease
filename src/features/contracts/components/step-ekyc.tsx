'use client'

import { useState, useEffect, useCallback } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ekycSchema, type EkycData } from '@/features/contracts/schemas/contract'
import { postContractsEkycSendCode } from '@/lib/api/generated/contracts/contracts'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { Resolver } from 'react-hook-form'

type StepEkycProps = {
  onSubmit: (data: EkycData) => void
  onBack: () => void
  isSubmitting: boolean
}

export function StepEkyc({ onSubmit, onBack, isSubmitting }: StepEkycProps) {
  const [codeSent, setCodeSent] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const [sendingCode, setSendingCode] = useState(false)

  const form = useForm<EkycData>({
    resolver: zodResolver(ekycSchema) as Resolver<EkycData>,
    defaultValues: {
      name: '',
      phone: '',
      carrier: 'SKT',
      birthDate: '',
      gender: 'M',
      verificationCode: '',
    },
  })

  const phone = useWatch({ control: form.control, name: 'phone' })

  // Countdown timer
  useEffect(() => {
    if (countdown <= 0) return
    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1)
    }, 1000)
    return () => clearInterval(timer)
  }, [countdown])

  const formatCountdown = useCallback((seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${String(s).padStart(2, '0')}`
  }, [])

  const handleSendCode = async () => {
    if (!phone || phone.length < 10) return
    setSendingCode(true)
    try {
      await postContractsEkycSendCode({ phone })
      setCodeSent(true)
      setCountdown(180) // 3 minutes
    } catch {
      // silently fail — user can retry
    } finally {
      setSendingCode(false)
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
      <div className="rounded-lg border border-accent/20 bg-accent/5 p-3 text-center text-sm">
        본인인증을 진행해주세요
      </div>

      {/* Name */}
      <div className="space-y-1.5">
        <Label htmlFor="ekyc-name">이름</Label>
        <Input
          id="ekyc-name"
          placeholder="홍길동"
          {...form.register('name')}
        />
        {form.formState.errors.name && (
          <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
        )}
      </div>

      {/* Phone + send code */}
      <div className="space-y-1.5">
        <Label htmlFor="ekyc-phone">휴대폰번호</Label>
        <div className="flex gap-2">
          <Input
            id="ekyc-phone"
            placeholder="01012345678"
            {...form.register('phone')}
            className="flex-1"
          />
          <Button
            type="button"
            variant="outline"
            onClick={handleSendCode}
            disabled={sendingCode || countdown > 0 || !phone}
            className="shrink-0"
          >
            {sendingCode
              ? '발송중...'
              : countdown > 0
                ? formatCountdown(countdown)
                : '인증번호 발송'}
          </Button>
        </div>
        {form.formState.errors.phone && (
          <p className="text-xs text-destructive">{form.formState.errors.phone.message}</p>
        )}
      </div>

      {/* Carrier */}
      <div className="space-y-1.5">
        <Label htmlFor="ekyc-carrier">통신사</Label>
        <select
          id="ekyc-carrier"
          {...form.register('carrier')}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="SKT">SKT</option>
          <option value="KT">KT</option>
          <option value="LGU">LG U+</option>
        </select>
      </div>

      {/* Birth date */}
      <div className="space-y-1.5">
        <Label htmlFor="ekyc-birthdate">생년월일</Label>
        <Input
          id="ekyc-birthdate"
          type="date"
          {...form.register('birthDate')}
        />
        {form.formState.errors.birthDate && (
          <p className="text-xs text-destructive">{form.formState.errors.birthDate.message}</p>
        )}
      </div>

      {/* Gender */}
      <div className="space-y-1.5">
        <Label>성별</Label>
        <div className="flex gap-3">
          {(['M', 'F'] as const).map((g) => (
            <label key={g} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                value={g}
                {...form.register('gender')}
                className="accent-accent"
              />
              <span className="text-sm">{g === 'M' ? '남성' : '여성'}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Verification code */}
      {codeSent && (
        <div className="space-y-1.5">
          <Label htmlFor="ekyc-code">인증번호</Label>
          <Input
            id="ekyc-code"
            placeholder="6자리 숫자"
            maxLength={6}
            {...form.register('verificationCode')}
          />
          {form.formState.errors.verificationCode && (
            <p className="text-xs text-destructive">
              {form.formState.errors.verificationCode.message}
            </p>
          )}
          {process.env.NODE_ENV === 'development' && (
            <p className="text-xs text-muted-foreground">
              테스트 인증번호: 123456
            </p>
          )}
        </div>
      )}

      {/* Navigation */}
      <div className="flex gap-3">
        <Button type="button" variant="outline" onClick={onBack} className="flex-1">
          이전
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting || !codeSent}
          className="flex-1"
        >
          {isSubmitting ? '인증 중...' : '본인인증 완료'}
        </Button>
      </div>
    </form>
  )
}
