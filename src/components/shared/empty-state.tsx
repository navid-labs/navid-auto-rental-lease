import Link from 'next/link'
import { Button } from '@/components/ui/button'
import type { LucideIcon } from 'lucide-react'

type EmptyStateProps = {
  icon: LucideIcon
  title: string
  description: string
  action?: {
    label: string
    href: string
  }
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
      <Icon className="size-12 text-muted-foreground" />
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="max-w-sm text-sm text-muted-foreground">{description}</p>
      {action && (
        <Button render={<Link href={action.href} />} className="mt-2">
          {action.label}
        </Button>
      )}
    </div>
  )
}
