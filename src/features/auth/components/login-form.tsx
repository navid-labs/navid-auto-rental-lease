'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTransition } from 'react'
import Link from 'next/link'
import { loginSchema, type LoginInput } from '../schemas/auth'
import { login } from '../actions/login'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function LoginForm() {
  const [isPending, startTransition] = useTransition()
  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  const onSubmit = form.handleSubmit((data) => {
    startTransition(async () => {
      const formData = new FormData()
      formData.set('email', data.email)
      formData.set('password', data.password)
      const result = await login(formData)
      if (result?.error) {
        form.setError('root', { message: result.error })
      }
    })
  })

  return (
    <form onSubmit={onSubmit} className="space-y-4">
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
          {...form.register('password')}
          disabled={isPending}
        />
        {form.formState.errors.password && (
          <p className="text-sm text-red-500">{form.formState.errors.password.message}</p>
        )}
      </div>

      {form.formState.errors.root && (
        <p className="text-sm text-red-500 text-center">{form.formState.errors.root.message}</p>
      )}

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? '로그인 중...' : '로그인'}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        계정이 없으신가요?{' '}
        <Link href="/signup" className="text-primary underline-offset-4 hover:underline">
          회원가입
        </Link>
      </p>
    </form>
  )
}
