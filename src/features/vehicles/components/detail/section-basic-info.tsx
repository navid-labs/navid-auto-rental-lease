import { Card, CardContent } from '@/components/ui/card'
import { formatYearModel, formatDistance } from '@/lib/utils/format'
import type { VehicleDetailData } from '../../types'

type SectionBasicInfoProps = {
  vehicle: VehicleDetailData
}

const FUEL_LABELS: Record<string, string> = {
  GASOLINE: '가솔린',
  DIESEL: '디젤',
  LPG: 'LPG',
  HYBRID: '하이브리드',
  ELECTRIC: '전기',
  HYDROGEN: '수소',
}

const TRANSMISSION_LABELS: Record<string, string> = {
  AUTOMATIC: '자동',
  MANUAL: '수동',
  CVT: 'CVT',
  DCT: 'DCT',
}

export function SectionBasicInfo({ vehicle }: SectionBasicInfoProps) {
  const specs = [
    { label: '연식', value: formatYearModel(vehicle.year) },
    { label: '주행거리', value: formatDistance(vehicle.mileage) },
    {
      label: '연료',
      value: FUEL_LABELS[vehicle.trim.fuelType] ?? vehicle.trim.fuelType,
    },
    {
      label: '변속기',
      value:
        TRANSMISSION_LABELS[vehicle.trim.transmission] ?? vehicle.trim.transmission,
    },
    { label: '색상', value: vehicle.color },
    { label: '번호판', value: vehicle.licensePlate || '-' },
  ]

  return (
    <Card id="basic-info" className="p-0">
      <CardContent>
        <h3 className="text-lg font-semibold mb-4">기본정보</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {specs.map(({ label, value }) => (
            <div key={label} className="flex justify-between sm:flex-col sm:gap-0.5">
              <span className="text-[13px] font-medium text-muted-foreground">
                {label}
              </span>
              <span className="text-sm">{value}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
