'use client'

import type { InspectionData } from '@/features/vehicles/schemas/inspection-data'

type PanelKey = keyof InspectionData['panels']
type PanelStatus = 'normal' | 'repainted' | 'replaced'

type Props = {
  panels: InspectionData['panels']
  repaintCount: number
  replacedCount: number
}

const PANEL_LABELS: Record<PanelKey, string> = {
  hood:             '후드',
  frontBumper:      '앞 범퍼',
  rearBumper:       '뒤 범퍼',
  trunk:            '트렁크',
  roof:             '루프',
  frontLeftFender:  '앞좌 펜더',
  frontRightFender: '앞우 펜더',
  rearLeftFender:   '뒤좌 펜더',
  rearRightFender:  '뒤우 펜더',
  frontLeftDoor:    '앞좌 도어',
  frontRightDoor:   '앞우 도어',
  rearLeftDoor:     '뒤좌 도어',
  rearRightDoor:    '뒤우 도어',
  leftRocker:       '좌 사이드실',
  rightRocker:      '우 사이드실',
}

const STATUS_STYLES: Record<PanelStatus, { bg: string; text: string; dot: string }> = {
  normal:   { bg: 'bg-emerald-50',  text: 'text-emerald-700', dot: 'bg-emerald-500' },
  repainted:{ bg: 'bg-yellow-50',   text: 'text-yellow-700',  dot: 'bg-yellow-500'  },
  replaced: { bg: 'bg-red-50',      text: 'text-red-700',     dot: 'bg-red-500'     },
}

const STATUS_LABEL: Record<PanelStatus, string> = {
  normal:    '정상',
  repainted: '도색',
  replaced:  '교체',
}

const PANEL_ORDER: PanelKey[] = [
  'hood', 'frontBumper', 'frontLeftFender', 'frontRightFender',
  'frontLeftDoor', 'frontRightDoor', 'rearLeftDoor', 'rearRightDoor',
  'rearLeftFender', 'rearRightFender', 'leftRocker', 'rightRocker',
  'roof', 'trunk', 'rearBumper',
]

/**
 * 차체 15개 패널 상태를 그리드로 시각화한다.
 * 정상(초록), 도색(노랑), 교체(빨강)으로 색상 구분한다.
 */
export function PanelDiagram({ panels, repaintCount, replacedCount }: Props) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-zinc-900">차체 패널 상태</h2>
        <div className="flex gap-3 text-sm text-zinc-500">
          <span>도색 {repaintCount}개</span>
          <span>교체 {replacedCount}개</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
        {PANEL_ORDER.map((key) => {
          const status = panels[key]
          const style = STATUS_STYLES[status]
          return (
            <div
              key={key}
              className={`flex flex-col items-center gap-1 rounded-lg p-3 ${style.bg}`}
            >
              <div className={`h-2 w-2 rounded-full ${style.dot}`} />
              <span className={`text-center text-xs font-medium leading-tight ${style.text}`}>
                {PANEL_LABELS[key]}
              </span>
              <span className={`text-xs ${style.text} opacity-75`}>
                {STATUS_LABEL[status]}
              </span>
            </div>
          )
        })}
      </div>

      {/* 범례 */}
      <div className="mt-4 flex gap-4 border-t border-zinc-100 pt-4">
        {(['normal', 'repainted', 'replaced'] as PanelStatus[]).map((s) => (
          <div key={s} className="flex items-center gap-1.5 text-xs text-zinc-500">
            <span className={`h-3 w-3 rounded-full ${STATUS_STYLES[s].dot}`} />
            {STATUS_LABEL[s]}
          </div>
        ))}
      </div>
    </div>
  )
}
