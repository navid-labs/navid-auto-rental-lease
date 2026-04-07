'use client'

import type { KotsaVehicleData } from '@/lib/kotsa'

type Props = {
  basicInfo: KotsaVehicleData['basicInfo']
  spec: KotsaVehicleData['spec']
}

type SpecRow = {
  label: string
  value: string | number | null | undefined
  unit?: string
}

type SpecGroup = {
  title: string
  rows: SpecRow[]
}

function formatValue(value: string | number | null | undefined, unit?: string): string {
  if (value === null || value === undefined) return '-'
  if (unit) return `${value}${unit}`
  return String(value)
}

/**
 * 차량 제원을 4개 그룹(기본정보, 엔진, 차체, 하체) 카드로 표시한다.
 */
export function SpecTable({ basicInfo, spec }: Props) {
  const groups: SpecGroup[] = [
    {
      title: '기본 정보',
      rows: [
        { label: '차종',      value: basicInfo.vehicleType },
        { label: '용도',      value: basicInfo.vehicleUse },
        { label: '연식',      value: basicInfo.modelYear, unit: '년' },
        { label: '색상',      value: basicInfo.color },
        { label: '연료',      value: basicInfo.fuelType },
        { label: '변속기',    value: basicInfo.transmissionType },
        { label: '승차정원',  value: basicInfo.numberOfSeats, unit: '명' },
        { label: '복합연비',  value: spec.engine.fuelEfficiency, unit: 'km/L' },
      ],
    },
    {
      title: '엔진',
      rows: [
        { label: '엔진형식',    value: spec.engine.type },
        { label: '배기량',      value: spec.engine.displacement, unit: 'cc' },
        { label: '연료공급',    value: spec.engine.fuelSystem },
        { label: '최고출력',    value: spec.engine.maxPower },
        { label: '최대토크',    value: spec.engine.maxTorque },
        { label: '배출가스',    value: spec.engine.emissionStandard },
        { label: '터보',        value: spec.engine.turbocharger ? '있음' : '없음' },
        { label: 'CO₂ 배출',   value: spec.engine.co2Emission, unit: 'g/km' },
      ],
    },
    {
      title: '차체',
      rows: [
        { label: '차체형태',  value: spec.body.type },
        { label: '도어수',    value: spec.body.numberOfDoors, unit: '개' },
        { label: '전장',      value: spec.body.length, unit: 'mm' },
        { label: '전폭',      value: spec.body.width, unit: 'mm' },
        { label: '전고',      value: spec.body.height, unit: 'mm' },
        { label: '축거',      value: spec.body.wheelbase, unit: 'mm' },
        { label: '공차중량',  value: spec.body.curbWeight, unit: 'kg' },
        { label: '구동방식',  value: spec.transmission.driveType },
      ],
    },
    {
      title: '하체',
      rows: [
        { label: '앞 현가장치', value: spec.suspension.front },
        { label: '뒤 현가장치', value: spec.suspension.rear },
        { label: '앞 브레이크', value: spec.brake.front },
        { label: '뒤 브레이크', value: spec.brake.rear },
        { label: '주차브레이크', value: spec.brake.parkingBrake },
        { label: '앞 타이어',   value: spec.tire.frontSize },
        { label: '뒤 타이어',   value: spec.tire.rearSize },
        { label: '최소회전반경', value: spec.steering.turningRadius, unit: 'm' },
      ],
    },
  ]

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-lg font-semibold text-zinc-900">차량 제원</h2>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {groups.map((group) => (
          <div key={group.title} className="rounded-xl bg-zinc-50 p-4">
            <h3 className="mb-3 text-sm font-semibold text-zinc-700">{group.title}</h3>
            <dl className="space-y-1.5">
              {group.rows.map((row) => (
                <div key={row.label} className="flex items-baseline justify-between gap-2">
                  <dt className="shrink-0 text-xs text-zinc-400">{row.label}</dt>
                  <dd className="text-right text-xs font-medium text-zinc-700">
                    {formatValue(row.value, row.unit)}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        ))}
      </div>
    </div>
  )
}
