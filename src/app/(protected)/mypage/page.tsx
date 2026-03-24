import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth/helpers'
import { ProfileForm } from '@/features/auth/components/profile-form'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { getMyContractsQuery } from '@/features/contracts/queries/my-contracts'
import { ContractList } from '@/features/contracts/components/contract-list'
import { Suspense } from 'react'

export const metadata = {
  title: '마이페이지 | 나비드오토',
}

export default async function MyPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  const contracts = await getMyContractsQuery(user.id)

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      {/* Page hero header */}
      <div className="mb-8 rounded-2xl bg-gradient-to-r from-[#0f1e3c] to-[#1a3a6e] px-8 py-8">
        <div className="flex items-center gap-4">
          {/* Avatar circle */}
          <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-white/15 text-white">
            <svg viewBox="0 0 24 24" fill="none" className="size-7" aria-hidden="true">
              <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.5" />
              <path
                d="M4 20c0-4 3.6-7 8-7s8 3 8 7"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-blue-300">
              My Account
            </p>
            <h1 className="mt-0.5 text-2xl font-bold text-white">
              {user.name ? `${user.name}님` : '마이페이지'}
            </h1>
            <p className="mt-0.5 text-sm text-slate-300">{user.email}</p>
          </div>
        </div>
      </div>

      {/* Profile section */}
      <Card className="shadow-sm">
        <CardHeader className="border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex size-8 items-center justify-center rounded-lg bg-slate-100">
              <svg viewBox="0 0 24 24" fill="none" className="size-4 text-slate-600" aria-hidden="true">
                <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.5" />
                <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>
            <div>
              <CardTitle className="text-base">프로필 정보</CardTitle>
              <CardDescription className="text-xs">이름과 전화번호를 수정할 수 있습니다.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <ProfileForm
            defaultValues={{
              name: user.name || '',
              phone: user.phone || '',
              email: user.email,
              role: user.role,
            }}
          />
        </CardContent>
      </Card>

      {/* Divider */}
      <div className="my-8 flex items-center gap-4">
        <div className="h-px flex-1 bg-slate-200" />
        <span className="text-xs font-medium uppercase tracking-wider text-slate-400">내 계약 목록</span>
        <div className="h-px flex-1 bg-slate-200" />
      </div>

      {/* Contract list section */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex size-8 items-center justify-center rounded-lg bg-slate-100">
              <svg viewBox="0 0 24 24" fill="none" className="size-4 text-slate-600" aria-hidden="true">
                <rect x="4" y="2" width="16" height="20" rx="2" stroke="currentColor" strokeWidth="1.5" />
                <path d="M8 7h8M8 11h8M8 15h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-slate-900">계약 내역</h2>
          </div>
          <span className="inline-flex items-center rounded-full bg-[#0f1e3c] px-3 py-1 text-xs font-semibold text-white">
            {contracts.length}건
          </span>
        </div>
        <Suspense fallback={<div className="py-8 text-center text-gray-500">로딩 중...</div>}>
          <ContractList contracts={contracts} />
        </Suspense>
      </div>
    </div>
  )
}
