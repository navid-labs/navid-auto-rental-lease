import { SearchX } from 'lucide-react'
import Link from 'next/link'
import { VehicleCard } from './vehicle-card'
import { VehicleCardList } from './vehicle-card-list'
import type { VehicleWithDetails } from '@/features/vehicles/types/index'

type Props = {
  vehicles: VehicleWithDetails[]
  viewMode?: 'grid' | 'list'
}

export function VehicleGrid({ vehicles, viewMode = 'grid' }: Props) {
  if (vehicles.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <SearchX className="mb-4 size-12 text-muted-foreground/40" />
        <h3 className="text-lg font-medium text-foreground">
          검색 결과가 없습니다
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">
          필터 조건을 변경하거나 초기화해 보세요
        </p>
        <Link
          href="/vehicles"
          className="mt-4 text-sm font-medium text-accent underline-offset-4 hover:underline"
        >
          필터 초기화
        </Link>
      </div>
    )
  }

  if (viewMode === 'list') {
    return (
      <div className="flex flex-col gap-3">
        {vehicles.map((vehicle) => (
          <VehicleCardList key={vehicle.id} vehicle={vehicle} />
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {vehicles.map((vehicle) => (
        <VehicleCard key={vehicle.id} vehicle={vehicle} />
      ))}
    </div>
  )
}
