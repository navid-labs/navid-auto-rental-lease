import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth/helpers'
import { ProfileForm } from '@/features/auth/components/profile-form'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { getMyContracts } from '@/features/contracts/actions/get-my-contracts'
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

  const contracts = await getMyContracts(user.id)

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="mb-8 text-2xl font-bold">마이페이지</h1>

      {/* Profile section */}
      <Card>
        <CardHeader>
          <CardTitle>프로필 정보</CardTitle>
          <CardDescription>이름과 전화번호를 수정할 수 있습니다.</CardDescription>
        </CardHeader>
        <CardContent>
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

      {/* Contract list section */}
      <div className="mt-10">
        <div className="mb-4 flex items-center gap-3">
          <h2 className="text-xl font-bold">내 계약</h2>
          <span className="inline-flex items-center rounded-full bg-navy-100 px-2.5 py-0.5 text-xs font-medium text-navy-900">
            {contracts.length}
          </span>
        </div>
        <Suspense fallback={<div className="py-8 text-center text-gray-500">로딩 중...</div>}>
          <ContractList contracts={contracts} />
        </Suspense>
      </div>
    </div>
  )
}
