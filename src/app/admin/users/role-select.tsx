'use client'

import { useTransition } from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { patchAdminUsersIdRole } from '@/lib/api/generated/admin/admin'

const ROLES = [
  { value: 'CUSTOMER', label: '고객' },
  { value: 'DEALER', label: '딜러' },
  { value: 'ADMIN', label: '관리자' },
] as const

type UserRole = 'CUSTOMER' | 'DEALER' | 'ADMIN'

interface RoleSelectProps {
  userId: string
  currentRole: UserRole
}

export function RoleSelect({ userId, currentRole }: RoleSelectProps) {
  const [isPending, startTransition] = useTransition()

  const handleRoleChange = (newRole: string | null) => {
    if (!newRole || newRole === currentRole) return

    startTransition(async () => {
      await patchAdminUsersIdRole(userId, { role: newRole as UserRole })
    })
  }

  return (
    <Select defaultValue={currentRole} onValueChange={handleRoleChange} disabled={isPending}>
      <SelectTrigger className="w-[120px]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {ROLES.map((role) => (
          <SelectItem key={role.value} value={role.value}>
            {isPending ? '변경 중...' : role.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
