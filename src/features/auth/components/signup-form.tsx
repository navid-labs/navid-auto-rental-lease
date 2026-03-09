'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTransition } from 'react'
import Link from 'next/link'
import { signupSchema, type SignupInput } from '../schemas/auth'
import { signup } from '../actions/signup'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function SignupForm() {
  const [isPending, startTransition] = useTransition()
  const form = useForm<SignupInput>({
    resolver: zodResolver(signupSchema),
    defaultValues: { email: '', password: '', confirmPassword: '', name: '', phone: '' },
  })

  const onSubmit = form.handleSubmit((data) => {
    startTransition(async () => {
      const formData = new FormData()
      formData.set('email', data.email)
      formData.set('password', data.password)
      formData.set('confirmPassword', data.confirmPassword)
      formData.set('name', data.name)
      if (data.phone) formData.set('phone', data.phone)
      const result = await signup(formData)
      if (result?.error) {
        form.setError('root', { message: result.error })
      }
    })
  })

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">이름</Label>
        <Input
          id="name"
          placeholder="홍길동"
          {...form.register('name')}
          disabled={isPending}
        />
        {form.formState.errors.name && (
          <p className="text-sm text-red-500">{form.formState.errors.name.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">이메일</Label>
        <Input
          id="email"
          type="email"
          placeholder="name@example.com"
          {...form.register('email')}
          disabled={isPending}
        />
        {form.formState.errors.email && (
          <p className="text-sm text-red-500">{form.formState.errors.email.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">비밀번호</Label>
        <Input
          id="password"
          type="password"
          placeholder="8자 이상"
          {...form.register('password')}
          disabled={isPending}
        />
        {form.formState.errors.password && (
          <p className="text-sm text-red-500">{form.formState.errors.password.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">비밀번호 확인</Label>
        <Input
          id="confirmPassword"
          type="password"
          {...form.register('confirmPassword')}
          disabled={isPending}
        />
        {form.formState.errors.confirmPassword && (
          <p className="text-sm text-red-500">{form.formState.errors.confirmPassword.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">전화번호 (선택)</Label>
        <Input
          id="phone"
          type="tel"
          placeholder="010-1234-5678"
          {...form.register('phone')}
          disabled={isPending}
        />
      </div>

      {form.formState.errors.root && (
        <p className="text-sm text-red-500 text-center">{form.formState.errors.root.message}</p>
      )}

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? '가입 중...' : '회원가입'}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        이미 계정이 있으신가요?{' '}
        <Link href="/login" className="text-primary underline-offset-4 hover:underline">
          로그인
        </Link>
      </p>
    </form>
  )
}
