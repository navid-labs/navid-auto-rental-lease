import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth/helpers'
import { ProfileForm } from '@/features/auth/components/profile-form'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export const metadata = {
  title: '마이페이지 | 나비드오토',
}

export default async function MyPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="mb-8 text-2xl font-bold">마이페이지</h1>

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
    </div>
  )
}
