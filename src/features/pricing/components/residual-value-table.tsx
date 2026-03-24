'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import {
  putPricingResidualRates,
  deletePricingResidualRatesId,
} from '@/lib/api/generated/pricing/pricing'
import { ApiError } from '@/lib/api/fetcher'
import { Pencil, Trash2, Check, X, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

type ResidualRateRow = {
  id: string
  brandId: string
  brandName: string
  carModelId: string
  carModelName: string
  year: number
  rate: number
}

type ResidualValueTableProps = {
  rates: ResidualRateRow[]
}

export function ResidualValueTable({ rates }: ResidualValueTableProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)

  function startEdit(row: ResidualRateRow) {
    setEditingId(row.id)
    setEditValue(String(Math.round(row.rate * 100 * 10) / 10))
  }

  function cancelEdit() {
    setEditingId(null)
    setEditValue('')
  }

  function saveEdit(row: ResidualRateRow) {
    const percentValue = parseFloat(editValue)
    if (isNaN(percentValue) || percentValue < 1 || percentValue > 99) {
      toast.error('1~99 사이의 값을 입력해주세요.')
      return
    }

    startTransition(async () => {
      try {
        await putPricingResidualRates({
          brandId: row.brandId,
          carModelId: row.carModelId,
          year: row.year,
          rate: percentValue / 100,
        })
        setEditingId(null)
        setEditValue('')
        router.refresh()
      } catch (err) {
        toast.error(err instanceof ApiError ? err.message : '저장에 실패했습니다.')
      }
    })
  }

  function handleDelete(id: string) {
    if (!confirm('이 잔존가치율을 삭제하시겠습니까?')) return

    setDeletingId(id)
    startTransition(async () => {
      try {
        await deletePricingResidualRatesId(id)
        router.refresh()
      } catch (err) {
        toast.error(err instanceof ApiError ? err.message : '삭제에 실패했습니다.')
      } finally {
        setDeletingId(null)
      }
    })
  }

  if (rates.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
        등록된 잔존가치율이 없습니다
      </div>
    )
  }

  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="px-4 py-3 text-left font-medium">브랜드</th>
            <th className="px-4 py-3 text-left font-medium">모델</th>
            <th className="px-4 py-3 text-left font-medium">연식</th>
            <th className="px-4 py-3 text-left font-medium">잔존가치율(%)</th>
            <th className="px-4 py-3 text-left font-medium">작업</th>
          </tr>
        </thead>
        <tbody>
          {rates.map((row) => (
            <tr key={row.id} className="border-b last:border-b-0">
              <td className="px-4 py-3">{row.brandName}</td>
              <td className="px-4 py-3">{row.carModelName}</td>
              <td className="px-4 py-3">{row.year}</td>
              <td className="px-4 py-3">
                {editingId === row.id ? (
                  <div className="flex items-center gap-1">
                    <Input
                      type="number"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') saveEdit(row)
                        if (e.key === 'Escape') cancelEdit()
                      }}
                      className="h-7 w-20"
                      min={1}
                      max={99}
                      step={0.1}
                      autoFocus
                    />
                    <span className="text-muted-foreground">%</span>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => saveEdit(row)}
                      disabled={isPending}
                    >
                      {isPending ? (
                        <Loader2 className="animate-spin" />
                      ) : (
                        <Check className="text-green-600" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={cancelEdit}
                      disabled={isPending}
                    >
                      <X className="text-muted-foreground" />
                    </Button>
                  </div>
                ) : (
                  <button
                    onClick={() => startEdit(row)}
                    className="inline-flex items-center gap-1 rounded px-1 py-0.5 hover:bg-muted"
                  >
                    {(row.rate * 100).toFixed(1)}%
                    <Pencil className="size-3 text-muted-foreground" />
                  </button>
                )}
              </td>
              <td className="px-4 py-3">
                <Button
                  variant="destructive"
                  size="xs"
                  onClick={() => handleDelete(row.id)}
                  disabled={isPending || deletingId === row.id}
                >
                  {deletingId === row.id ? (
                    <Loader2 className="animate-spin" />
                  ) : (
                    <Trash2 />
                  )}
                  삭제
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
