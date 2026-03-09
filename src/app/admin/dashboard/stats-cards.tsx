'use client'

import Link from 'next/link'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Car, FileText, Users, Clock, TrendingUp } from 'lucide-react'

type StatsCardsProps = {
  vehicleCount: number
  activeContracts: number
  userCount: number
  pendingApprovals: number
}

const cards = [
  {
    key: 'vehicles',
    label: '전체 차량',
    icon: Car,
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    borderColor: 'border-l-blue-500',
    iconRing: 'ring-blue-100',
    trend: '이번 달 등록',
    href: '/admin/vehicles',
    prop: 'vehicleCount' as const,
  },
  {
    key: 'contracts',
    label: '활성 계약',
    icon: FileText,
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
    borderColor: 'border-l-emerald-500',
    iconRing: 'ring-emerald-100',
    trend: '진행 중',
    href: '/admin/contracts',
    prop: 'activeContracts' as const,
  },
  {
    key: 'users',
    label: '전체 사용자',
    icon: Users,
    color: 'text-violet-600',
    bg: 'bg-violet-50',
    borderColor: 'border-l-violet-500',
    iconRing: 'ring-violet-100',
    trend: '누적 회원',
    href: null,
    prop: 'userCount' as const,
  },
  {
    key: 'pending',
    label: '승인 대기',
    icon: Clock,
    color: 'text-amber-600',
    bg: 'bg-amber-50',
    borderColor: 'border-l-amber-500',
    iconRing: 'ring-amber-100',
    trend: '검토 필요',
    href: '/admin/vehicles?tab=approval-queue',
    prop: 'pendingApprovals' as const,
  },
]

export function StatsCards(props: StatsCardsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon
        const value = props[card.prop]

        const content = (
          <Card
            key={card.key}
            className={`border-l-4 ${card.borderColor} shadow-sm transition-shadow hover:shadow-md`}
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {card.label}
              </CardTitle>
              <div className={`rounded-lg p-2 ${card.bg} ring-1 ${card.iconRing}`}>
                <Icon className={`size-4 ${card.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold tracking-tight">{value.toLocaleString('ko-KR')}</p>
              <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                <TrendingUp className="size-3 text-emerald-500" />
                <span>{card.trend}</span>
              </p>
            </CardContent>
          </Card>
        )

        if (card.href) {
          return (
            <Link key={card.key} href={card.href} className="block">
              {content}
            </Link>
          )
        }

        return <div key={card.key}>{content}</div>
      })}
    </div>
  )
}
