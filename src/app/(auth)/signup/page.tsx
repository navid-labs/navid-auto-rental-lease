import type { Metadata } from 'next'
import { SignupForm } from '@/features/auth/components/signup-form'

export const metadata: Metadata = {
  title: '회원가입 | 나비드 오토',
  description: '나비드 오토 렌탈/리스 서비스에 가입하세요.',
}

export default function SignupPage() {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">회원가입</h1>
        <p className="text-sm text-muted-foreground">
          계정을 만들어 서비스를 이용하세요
        </p>
      </div>
      <SignupForm />
    </div>
  )
}
