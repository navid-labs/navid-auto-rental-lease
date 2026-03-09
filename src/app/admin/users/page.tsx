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
import { formatDate } from '@/lib/utils/format'

type UserRole = 'ADMIN' | 'DEALER' | 'CUSTOMER'

const ROLE_BADGE: Record<UserRole, { label: string; className: string }> = {
  ADMIN: { label: '관리자', className: 'bg-blue-100 text-blue-700' },
  DEALER: { label: '딜러', className: 'bg-green-100 text-green-700' },
  CUSTOMER: { label: '고객', className: 'bg-slate-100 text-slate-600' },
}

const AVATAR_COLOR: Record<UserRole, string> = {
  ADMIN: 'bg-blue-100 text-blue-700',
  DEALER: 'bg-green-100 text-green-700',
  CUSTOMER: 'bg-slate-100 text-slate-600',
}

function UserAvatar({ name, role }: { name: string | null; role: UserRole }) {
  const initial = (name ?? '?').charAt(0).toUpperCase()
  return (
    <div
      className={`flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${AVATAR_COLOR[role]}`}
    >
      {initial}
    </div>
  )
}

function RoleBadge({ role }: { role: UserRole }) {
  const { label, className } = ROLE_BADGE[role]
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${className}`}>
      {label}
    </span>
  )
}

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
          <div className="hidden overflow-hidden rounded-lg border shadow-sm md:block">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow className="hover:bg-slate-50">
                  <TableHead className="text-xs font-medium uppercase tracking-wide text-slate-500">이름</TableHead>
                  <TableHead className="text-xs font-medium uppercase tracking-wide text-slate-500">이메일</TableHead>
                  <TableHead className="text-xs font-medium uppercase tracking-wide text-slate-500">전화번호</TableHead>
                  <TableHead className="text-xs font-medium uppercase tracking-wide text-slate-500">역할</TableHead>
                  <TableHead className="text-xs font-medium uppercase tracking-wide text-slate-500">가입일</TableHead>
                  <TableHead className="text-right text-xs font-medium uppercase tracking-wide text-slate-500">관리</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((u) => {
                  const isDeactivated = u.name?.includes('(비활성)') ?? false
                  return (
                    <TableRow
                      key={u.id}
                      className={`hover:bg-slate-50 ${isDeactivated ? 'opacity-50' : ''}`}
                    >
                      <TableCell>
                        <div className="flex items-center gap-2.5">
                          <UserAvatar name={u.name} role={u.role as UserRole} />
                          <span className="font-medium">{u.name || '-'}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-slate-600">{u.email}</TableCell>
                      <TableCell className="text-slate-600">{u.phone || '-'}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <RoleBadge role={u.role as UserRole} />
                          <RoleSelect userId={u.id} currentRole={u.role as UserRole} />
                        </div>
                      </TableCell>
                      <TableCell className="text-slate-500">
                        {formatDate(u.createdAt, { short: true })}
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
                  className={`rounded-lg border shadow-sm p-4 space-y-3 ${isDeactivated ? 'opacity-50' : ''}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <UserAvatar name={u.name} role={u.role as UserRole} />
                      <div>
                        <p className="font-medium">{u.name || '-'}</p>
                        <p className="text-xs text-muted-foreground">{u.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <RoleBadge role={u.role as UserRole} />
                      <RoleSelect userId={u.id} currentRole={u.role as UserRole} />
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {u.phone || '전화번호 없음'} | {formatDate(u.createdAt, { short: true })}
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
