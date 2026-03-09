export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/db/prisma'
import { getCurrentUser } from '@/lib/auth/helpers'
import { RoleSelect } from './role-select'
import { DeactivateButton } from './deactivate-button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Users } from 'lucide-react'

export const metadata = {
  title: '사용자 관리 | 관리자',
}

const ROLE_TABS = [
  { key: 'all', label: '전체', role: null },
  { key: 'customer', label: '고객', role: 'CUSTOMER' as const },
  { key: 'dealer', label: '딜러', role: 'DEALER' as const },
  { key: 'admin', label: '관리자', role: 'ADMIN' as const },
] as const

type AdminUsersPageProps = {
  searchParams: Promise<{ tab?: string }>
}

export default async function AdminUsersPage({ searchParams }: AdminUsersPageProps) {
  const user = await getCurrentUser()
  if (!user || user.role !== 'ADMIN') redirect('/login')

  const params = await searchParams
  const activeTab = params.tab ?? 'all'

  const users = await prisma.profile.findMany({
    orderBy: { createdAt: 'desc' },
  })

  const currentFilter = ROLE_TABS.find((t) => t.key === activeTab)
  const filteredUsers = currentFilter?.role
    ? users.filter((u) => u.role === currentFilter.role)
    : users

  const roleCounts = {
    all: users.length,
    customer: users.filter((u) => u.role === 'CUSTOMER').length,
    dealer: users.filter((u) => u.role === 'DEALER').length,
    admin: users.filter((u) => u.role === 'ADMIN').length,
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">사용자 관리</h1>
        <p className="text-sm text-muted-foreground">
          전체 사용자를 관리합니다. ({users.length}명)
        </p>
      </div>

      {/* Role filter tabs */}
      <div className="flex gap-1 border-b">
        {ROLE_TABS.map((tab) => (
          <Link
            key={tab.key}
            href={tab.key === 'all' ? '/admin/users' : `/admin/users?tab=${tab.key}`}
            className={`relative px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? 'text-foreground after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.label}
            <span className="ml-1.5 text-xs opacity-70">
              ({roleCounts[tab.key as keyof typeof roleCounts]})
            </span>
          </Link>
        ))}
      </div>

      {filteredUsers.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 py-12 text-muted-foreground">
          <Users className="size-8" />
          <p>등록된 사용자가 없습니다.</p>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden rounded-md border md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>이름</TableHead>
                  <TableHead>이메일</TableHead>
                  <TableHead>전화번호</TableHead>
                  <TableHead>역할</TableHead>
                  <TableHead>가입일</TableHead>
                  <TableHead className="text-right">관리</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((u) => {
                  const isDeactivated = u.name?.includes('(비활성)') ?? false
                  return (
                    <TableRow key={u.id} className={isDeactivated ? 'opacity-50' : ''}>
                      <TableCell className="font-medium">
                        {u.name || '-'}
                      </TableCell>
                      <TableCell>{u.email}</TableCell>
                      <TableCell>{u.phone || '-'}</TableCell>
                      <TableCell>
                        <RoleSelect userId={u.id} currentRole={u.role} />
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {u.createdAt.toLocaleDateString('ko-KR')}
                      </TableCell>
                      <TableCell className="text-right">
                        <DeactivateButton userId={u.id} isDeactivated={isDeactivated} />
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>

          {/* Mobile card layout */}
          <div className="space-y-3 md:hidden">
            {filteredUsers.map((u) => {
              const isDeactivated = u.name?.includes('(비활성)') ?? false
              return (
                <div
                  key={u.id}
                  className={`rounded-lg border p-4 space-y-3 ${isDeactivated ? 'opacity-50' : ''}`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{u.name || '-'}</p>
                      <p className="text-xs text-muted-foreground">{u.email}</p>
                    </div>
                    <RoleSelect userId={u.id} currentRole={u.role} />
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {u.phone || '전화번호 없음'} | {u.createdAt.toLocaleDateString('ko-KR')}
                    </span>
                    <DeactivateButton userId={u.id} isDeactivated={isDeactivated} />
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
