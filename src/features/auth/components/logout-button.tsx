'use client'

import { useTransition } from 'react'
import { logout } from '../actions/logout'
import { Button } from '@/components/ui/button'
import { LogOut } from 'lucide-react'

export function LogoutButton() {
  const [isPending, startTransition] = useTransition()

  const handleLogout = () => {
    startTransition(async () => {
      await logout()
    })
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleLogout}
      disabled={isPending}
    >
      <LogOut className="mr-2 h-4 w-4" />
      {isPending ? '로그아웃 중...' : '로그아웃'}
    </Button>
  )
}
