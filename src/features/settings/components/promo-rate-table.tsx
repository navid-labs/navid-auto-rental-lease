'use client'

import { useState, useTransition } from 'react'
import { deleteAdminSettingsPromoRatesId } from '@/lib/api/generated/settings/settings'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
type PromoRateRow = {
  id: string
  rate: number | { toString(): string }
  label: string | null
  isActive: boolean
  updatedAt: Date
  brand: { id: string; name: string; nameKo: string | null }
}

type Props = {
  promoRates: PromoRateRow[]
}

export function PromoRateTable({ promoRates }: Props) {
  const [isPending, startTransition] = useTransition()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)

  function handleDelete(id: string) {
    startTransition(async () => {
      await deleteAdminSettingsPromoRatesId(id)
    })
  }

  if (promoRates.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        등록된 프로모션율이 없습니다.
      </p>
    )
  }

  return (
    <div className="overflow-x-auto rounded-md border">
      <table className="w-full text-sm">
        <thead className="border-b bg-muted/50">
          <tr>
            <th className="px-4 py-3 text-left font-medium">브랜드</th>
            <th className="px-4 py-3 text-left font-medium">프로모션율(%)</th>
            <th className="px-4 py-3 text-left font-medium">라벨</th>
            <th className="px-4 py-3 text-left font-medium">활성</th>
            <th className="px-4 py-3 text-left font-medium">수정일</th>
            <th className="px-4 py-3 text-left font-medium">작업</th>
          </tr>
        </thead>
        <tbody>
          {promoRates.map((row) => (
            <tr key={row.id} className="border-b last:border-0">
              <td className="px-4 py-3">{row.brand.nameKo ?? row.brand.name}</td>
              <td className="px-4 py-3">{(Number(row.rate) * 100).toFixed(1)}%</td>
              <td className="px-4 py-3">{row.label ?? '-'}</td>
              <td className="px-4 py-3">
                <span
                  className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                    row.isActive
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {row.isActive ? '활성' : '비활성'}
                </span>
              </td>
              <td className="px-4 py-3 text-muted-foreground">
                {new Date(row.updatedAt).toLocaleDateString('ko-KR')}
              </td>
              <td className="px-4 py-3">
                <button
                  onClick={() => {
                    setPendingDeleteId(row.id)
                    setConfirmOpen(true)
                  }}
                  disabled={isPending}
                  className="text-destructive hover:underline disabled:opacity-50"
                >
                  삭제
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="프로모션율 삭제"
        description="정말 삭제하시겠습니까?"
        confirmLabel="삭제"
        onConfirm={() => {
          if (pendingDeleteId) handleDelete(pendingDeleteId)
        }}
      />
    </div>
  )
}
