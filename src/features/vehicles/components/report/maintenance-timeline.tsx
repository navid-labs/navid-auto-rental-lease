'use client'

import type { KotsaMaintenanceRecord } from '@/lib/kotsa/types/maintenance'

type Props = {
  records: KotsaMaintenanceRecord[]
}

const SHOP_TYPE_STYLES: Record<string, string> = {
  '공식': 'bg-blue-100 text-blue-700',
  '직영': 'bg-purple-100 text-purple-700',
  '일반': 'bg-zinc-100 text-zinc-600',
}

function formatCost(cost: number): string {
  if (cost >= 10_000) return `${(cost / 10_000).toFixed(1)}만원`
  return `${cost.toLocaleString()}원`
}

/**
 * 정비 이력을 수직 타임라인으로 표시한다.
 * 각 항목은 날짜, 분류 배지, 정비 내용, 주행거리/업체/비용을 보여준다.
 */
export function MaintenanceTimeline({ records }: Props) {
  if (records.length === 0) {
    return (
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-zinc-900">정비 이력</h2>
        <p className="text-sm text-zinc-400">정비 이력이 없습니다.</p>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
      <h2 className="mb-6 text-lg font-semibold text-zinc-900">
        정비 이력 ({records.length}건)
      </h2>

      <ol className="relative border-l-2 border-zinc-100 pl-6">
        {records.map((record, index) => {
          const shopStyle = SHOP_TYPE_STYLES[record.shopType] ?? SHOP_TYPE_STYLES['일반']
          return (
            <li key={`${record.reportNumber}-${index}`} className="mb-8 last:mb-0">
              {/* 타임라인 점 */}
              <span className="absolute -left-[9px] flex h-4 w-4 items-center justify-center rounded-full bg-white ring-2 ring-zinc-300" />

              <div className="flex flex-col gap-1">
                {/* 날짜 + 분류 배지 */}
                <div className="flex flex-wrap items-center gap-2">
                  <time className="text-xs text-zinc-400">{record.date}</time>
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${shopStyle}`}
                  >
                    {record.shopType}
                  </span>
                  <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600">
                    {record.category}
                  </span>
                </div>

                {/* 정비 내용 */}
                <p className="text-sm font-medium text-zinc-800">{record.description}</p>

                {/* 메타 정보 */}
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-400">
                  <span>{record.mileage.toLocaleString()} km</span>
                  <span>{record.shopName}</span>
                  {record.totalCost > 0 && (
                    <span className="font-medium text-zinc-600">
                      {formatCost(record.totalCost)}
                    </span>
                  )}
                  {record.warranty && (
                    <span className="text-blue-500">보증수리</span>
                  )}
                  {record.recallRelated && (
                    <span className="text-orange-500">리콜 관련</span>
                  )}
                </div>
              </div>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
