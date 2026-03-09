import Link from 'next/link'
import Image from 'next/image'
import { prisma } from '@/lib/db/prisma'
import { formatKRW, formatDistance, formatYearModel } from '@/lib/utils/format'

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000

type BadgeVariant = 'new' | '인기' | '특가' | null

function deriveBadge(vehicle: {
  approvedAt: Date | null
  monthlyRental: number | null
  monthlyLease: number | null
}): BadgeVariant {
  if (
    vehicle.approvedAt &&
    Date.now() - vehicle.approvedAt.getTime() < SEVEN_DAYS_MS
  ) {
    return 'new'
  }
  if (vehicle.monthlyRental != null && vehicle.monthlyLease != null) {
    return '인기'
  }
  if (vehicle.monthlyRental != null && vehicle.monthlyRental < 500000) {
    return '특가'
  }
  return null
}

const BADGE_STYLES: Record<NonNullable<BadgeVariant>, { bg: string; label: string }> = {
  new: { bg: '#0D0D0D', label: 'NEW' },
  인기: { bg: '#E42313', label: '인기' },
  특가: { bg: '#22C55E', label: '최대할인' },
}

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
    <section style={{ background: '#F9FAFB', paddingTop: 48, paddingBottom: 48 }}>
      <div className="mx-auto max-w-7xl px-4">
        {/* Section header */}
        <div className="mb-6 flex items-center justify-between">
          <h2 style={{ fontSize: 28, fontWeight: 700, color: '#0D0D0D', lineHeight: 1.2 }}>
            추천 차량
          </h2>
          <Link
            href="/vehicles"
            style={{ fontSize: 14, fontWeight: 500, color: '#1A6DFF' }}
            className="transition-opacity hover:opacity-70"
          >
            전체보기 &rarr;
          </Link>
        </div>

        {/* 4-column grid */}
        <div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
          style={{ gap: 20 }}
        >
          {vehicles.map((vehicle) => {
            const brand = vehicle.trim.generation.carModel.brand
            const model = vehicle.trim.generation.carModel
            const thumbnail = vehicle.images[0]?.url
            const monthlyPrice = vehicle.monthlyRental ?? vehicle.monthlyLease
            const badge = deriveBadge(vehicle)
            const badgeStyle = badge ? BADGE_STYLES[badge] : null
            const detailParts = [
              formatYearModel(vehicle.year),
              formatDistance(vehicle.mileage, { compact: true }),
            ]

            return (
              <Link
                key={vehicle.id}
                href={`/vehicles/${vehicle.id}`}
                className="group block transition-all duration-200 hover:scale-[1.02] hover:shadow-[0_8px_24px_rgba(0,0,0,0.12)]"
                style={{
                  background: '#FFFFFF',
                  borderRadius: 12,
                  border: '1px solid #EEEEEE',
                  overflow: 'hidden',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                }}
              >
                {/* Image area — 180px fixed height */}
                <div
                  className="relative w-full overflow-hidden"
                  style={{ height: 180, background: '#F3F4F6' }}
                >
                  {thumbnail ? (
                    <Image
                      src={thumbnail}
                      alt={`${brand.nameKo || brand.name} ${model.nameKo || model.name}`}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <svg
                        width="48"
                        height="48"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="#D1D5DB"
                        strokeWidth={1}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0H6.375c-.621 0-1.125-.504-1.125-1.125V14.25m0 0h13.5m-13.5 0V4.875c0-.621.504-1.125 1.125-1.125h5.25c.621 0 1.125.504 1.125 1.125v3.75m-6.5 5.625h6.5m6.5 0v-3.75m0 3.75h-6.5m0 0v-3.75m0 3.75h.375c.621 0 1.125-.504 1.125-1.125V8.25"
                        />
                      </svg>
                    </div>
                  )}
                </div>

                {/* Card info */}
                <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {/* Badge */}
                  {badgeStyle && (
                    <span
                      style={{
                        display: 'inline-block',
                        alignSelf: 'flex-start',
                        background: badgeStyle.bg,
                        color: '#FFFFFF',
                        fontSize: 11,
                        fontWeight: 600,
                        borderRadius: 4,
                        padding: '4px 8px',
                        letterSpacing: '0.02em',
                      }}
                    >
                      {badgeStyle.label}
                    </span>
                  )}

                  {/* Car name */}
                  <p
                    style={{
                      fontSize: 15,
                      fontWeight: 600,
                      color: '#0D0D0D',
                      lineHeight: 1.3,
                      margin: 0,
                    }}
                  >
                    {brand.nameKo || brand.name} {model.nameKo || model.name}
                  </p>

                  {/* Details: 연식 · 주행거리 */}
                  <p
                    style={{
                      fontSize: 12,
                      color: '#7A7A7A',
                      margin: 0,
                      lineHeight: 1.4,
                    }}
                  >
                    {detailParts.join(' · ')}
                  </p>

                  {/* Price */}
                  {monthlyPrice && (
                    <p
                      style={{
                        fontSize: 18,
                        fontWeight: 700,
                        color: '#1A6DFF',
                        margin: 0,
                        lineHeight: 1.2,
                      }}
                    >
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
