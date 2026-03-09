import type { Metadata } from 'next'
import { LoginForm } from '@/features/auth/components/login-form'

export const metadata: Metadata = {
  title: '로그인 | 나비드 오토',
  description: '나비드 오토 렌탈/리스 서비스에 로그인하세요.',
}

export default function LoginPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">로그인</h1>
        <p className="text-sm text-slate-500">
          이메일과 비밀번호로 로그인하세요
        </p>
      </div>
      <LoginForm />
    </div>
  )
}
