'use client'

import { useTransition } from 'react'
import { deleteAdminSettingsDefaultsId } from '@/lib/api/generated/settings/settings'

type SettingRow = {
  id: string
  key: string
  value: string
  label: string
  updatedAt: Date
}

type Props = {
  subsidies: SettingRow[]
}

export function SubsidyTable({ subsidies }: Props) {
  const [isPending, startTransition] = useTransition()

  function handleDelete(id: string) {
    if (!confirm('정말 삭제하시겠습니까?')) return
    startTransition(async () => {
      await deleteAdminSettingsDefaultsId(id)
    })
  }

  if (subsidies.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        등록된 보조금 설정이 없습니다.
      </p>
    )
  }

  return (
    <div className="overflow-x-auto rounded-md border">
      <table className="w-full text-sm">
        <thead className="border-b bg-muted/50">
          <tr>
            <th className="px-4 py-3 text-left font-medium">키</th>
            <th className="px-4 py-3 text-left font-medium">설명</th>
            <th className="px-4 py-3 text-left font-medium">금액 (원)</th>
            <th className="px-4 py-3 text-left font-medium">수정일</th>
            <th className="px-4 py-3 text-left font-medium">작업</th>
          </tr>
        </thead>
        <tbody>
          {subsidies.map((row) => (
            <tr key={row.id} className="border-b last:border-0">
              <td className="px-4 py-3 font-mono text-xs">{row.key}</td>
              <td className="px-4 py-3">{row.label}</td>
              <td className="px-4 py-3">
                {Number(row.value).toLocaleString('ko-KR')}원
              </td>
              <td className="px-4 py-3 text-muted-foreground">
                {new Date(row.updatedAt).toLocaleDateString('ko-KR')}
              </td>
              <td className="px-4 py-3">
                <button
                  onClick={() => handleDelete(row.id)}
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
    </div>
  )
}
