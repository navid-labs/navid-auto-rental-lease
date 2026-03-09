import Image from 'next/image'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { formatKRW, formatDistance, formatYearModel } from '@/lib/utils/format'
import { estimateMonthlyRental, formatEstimate } from '@/lib/finance/calculate'
import { ImageIcon } from 'lucide-react'
import type { VehicleWithDetails } from '@/features/vehicles/types'

type VehicleCardProps = {
  vehicle: VehicleWithDetails
}

export function VehicleCard({ vehicle }: VehicleCardProps) {
  const brand = vehicle.trim.generation.carModel.brand
  const model = vehicle.trim.generation.carModel
  const primaryImage =
    vehicle.images.find((img) => img.isPrimary) ?? vehicle.images[0]

  return (
    <Link href={`/vehicles/${vehicle.id}`}>
      <Card className="group overflow-hidden transition-all hover:-translate-y-0.5 hover:shadow-lg">
        <div className="relative aspect-[16/9] bg-muted">
          {primaryImage ? (
            <Image
              src={primaryImage.url}
              alt={`${brand.name} ${model.name}`}
              fill
              className="object-cover transition-transform group-hover:scale-105"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <ImageIcon className="size-10 text-muted-foreground/40" />
            </div>
          )}
        </div>
        <CardContent className="p-4">
          <h3 className="truncate font-semibold">
            {brand.name} {model.name}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {formatYearModel(vehicle.year)} &middot;{' '}
            {formatDistance(vehicle.mileage, { compact: true })}
          </p>
          <p className="mt-2 text-lg font-bold text-accent">
            {vehicle.monthlyRental
              ? formatKRW(vehicle.monthlyRental, { monthly: true })
              : formatKRW(vehicle.price)}
          </p>
          {vehicle.price > 0 && !vehicle.monthlyRental && (
            <p className="mt-1 text-xs text-muted-foreground">
              {formatEstimate(estimateMonthlyRental(vehicle.price))}
            </p>
          )}
        </CardContent>
      </Card>
    </Link>
  )
}
