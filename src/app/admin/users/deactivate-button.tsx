'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { deactivateUser } from '@/features/admin/actions/deactivate-user'
import { UserX, Loader2 } from 'lucide-react'

type DeactivateButtonProps = {
  userId: string
  isDeactivated: boolean
}

export function DeactivateButton({ userId, isDeactivated }: DeactivateButtonProps) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  if (isDeactivated) {
    return (
      <span className="text-xs text-muted-foreground">비활성</span>
    )
  }

  function handleDeactivate() {
    if (!confirm('이 사용자를 비활성화하시겠습니까?')) return

    startTransition(async () => {
      const result = await deactivateUser(userId)
      if ('error' in result) {
        toast.error(result.error)
        return
      }
      toast.success('사용자가 비활성화되었습니다.')
      router.refresh()
    })
  }

  return (
    <Button
      variant="ghost"
      size="xs"
      onClick={handleDeactivate}
      disabled={isPending}
      className="text-destructive hover:text-destructive"
    >
      {isPending ? (
        <Loader2 className="size-3 animate-spin" />
      ) : (
        <UserX className="size-3" />
      )}
      비활성화
    </Button>
  )
}
