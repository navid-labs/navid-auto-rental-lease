import Link from 'next/link'
import Image from 'next/image'
import { prisma } from '@/lib/db/prisma'
import { formatKRW, formatDistance, formatYearModel } from '@/lib/utils/format'

export async function FeaturedVehicles() {
  const vehicles = await prisma.vehicle.findMany({
    where: { approvalStatus: 'APPROVED' },
    orderBy: { approvedAt: 'desc' },
    take: 8,
    include: {
      trim: {
        include: {
          generation: {
            include: {
              carModel: {
                include: { brand: true },
              },
            },
          },
        },
      },
      images: {
        orderBy: { order: 'asc' },
        take: 1,
      },
    },
  })

  if (vehicles.length === 0) return null

  return (
    <section className="py-12 md:py-16">
      <div className="mx-auto max-w-7xl px-4">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-primary md:text-3xl">신착 차량</h2>
          <Link
            href="/vehicles"
            className="text-sm font-medium text-accent hover:text-accent/80"
          >
            전체 보기 &rarr;
          </Link>
        </div>

        <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide">
          {vehicles.map((vehicle) => {
            const brand = vehicle.trim.generation.carModel.brand
            const model = vehicle.trim.generation.carModel
            const thumbnail = vehicle.images[0]?.url
            const monthlyPrice = vehicle.monthlyRental ?? vehicle.monthlyLease

            return (
              <Link
                key={vehicle.id}
                href={`/vehicles/${vehicle.id}`}
                className="min-w-[280px] max-w-[280px] flex-shrink-0 snap-start overflow-hidden rounded-xl border border-border bg-card shadow-sm transition hover:shadow-md"
              >
                <div className="relative aspect-video w-full bg-muted">
                  {thumbnail ? (
                    <Image
                      src={thumbnail}
                      alt={`${brand.nameKo || brand.name} ${model.nameKo || model.name}`}
                      fill
                      className="object-cover"
                      sizes="280px"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-muted-foreground">
                      <svg
                        className="h-12 w-12"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={1.5}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0H6.375c-.621 0-1.125-.504-1.125-1.125V14.25m0 0h13.5m-13.5 0V4.875c0-.621.504-1.125 1.125-1.125h5.25c.621 0 1.125.504 1.125 1.125v3.75m-6.5 5.625h6.5m6.5 0v-3.75m0 3.75h-6.5m0 0v-3.75m0 3.75h.375c.621 0 1.125-.504 1.125-1.125V8.25m-3.75 5.625V8.25"
                        />
                      </svg>
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <p className="text-sm font-semibold text-primary">
                    {brand.nameKo || brand.name} {model.nameKo || model.name}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatYearModel(vehicle.year)} &middot;{' '}
                    {formatDistance(vehicle.mileage, { compact: true })}
                  </p>
                  {monthlyPrice && (
                    <p className="mt-2 text-base font-bold text-accent">
                      {formatKRW(monthlyPrice, { monthly: true })}
                    </p>
                  )}
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}
