import Link from 'next/link'
import Image from 'next/image'
import { prisma } from '@/lib/db/prisma'
import { formatKRW } from '@/lib/utils/format'

/**
 * Determines the badge type for a vehicle card.
 * "특가" — monthlyRental below 500,000 KRW
 * "인기" — both rental and lease are available
 */
function resolveBadge(
  monthlyRental: number,
  hasLease: boolean,
): { label: string; color: string } | null {
  if (monthlyRental < 500_000) {
    return { label: '특가', color: '#FF6B00' }
  }
  if (hasLease) {
    return { label: '인기', color: '#E42313' }
  }
  return null
}

export async function RentSubscription() {
  const vehicles = await prisma.vehicle.findMany({
    where: {
      approvalStatus: 'APPROVED',
      monthlyRental: { not: null },
    },
    orderBy: { monthlyRental: 'asc' },
    take: 3,
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
    <section style={{ background: '#F0F4FF', paddingTop: '48px', paddingBottom: '48px' }}>
      <div className="mx-auto max-w-7xl px-4">
        {/* Section header */}
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h2
              className="font-bold leading-tight"
              style={{ fontSize: '28px', color: '#0D0D0D' }}
            >
              렌트 / 구독
            </h2>
            <p className="mt-1" style={{ fontSize: '14px', color: '#7A7A7A' }}>
              월 구독료로 부담없이
            </p>
          </div>
          <Link
            href="/vehicles?type=rental"
            className="shrink-0 transition-opacity hover:opacity-70"
            style={{ fontSize: '14px', fontWeight: 500, color: '#1A6DFF' }}
          >
            전체보기 &rarr;
          </Link>
        </div>

        {/* Card grid: 1 col mobile → 2 col sm → 3 col lg */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {vehicles.map((vehicle) => {
            const brand = vehicle.trim.generation.carModel.brand
            const model = vehicle.trim.generation.carModel
            const thumbnail = vehicle.images[0]?.url
            const monthlyRental = vehicle.monthlyRental as number
            const hasLease = vehicle.monthlyLease != null
            const badge = resolveBadge(monthlyRental, hasLease)
            const displayName = `${brand.nameKo ?? brand.name} ${model.nameKo ?? model.name}`

            return (
              <Link
                key={vehicle.id}
                href={`/vehicles/${vehicle.id}`}
                className="group block overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-xl"
                style={{
                  background: '#ffffff',
                  borderRadius: '12px',
                  border: '1px solid #E8E8E8',
                }}
              >
                {/* Car image */}
                <div
                  className="relative w-full overflow-hidden bg-gray-100"
                  style={{ height: '180px' }}
                >
                  {thumbnail ? (
                    <Image
                      src={thumbnail}
                      alt={displayName}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-gray-300">
                      <svg
                        className="h-14 w-14"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={1}
                        aria-hidden="true"
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

                {/* Card info */}
                <div className="flex flex-col gap-2 p-4">
                  {/* Badge */}
                  {badge && (
                    <span
                      className="self-start px-2 py-0.5 text-xs font-semibold text-white"
                      style={{ background: badge.color, borderRadius: '4px' }}
                    >
                      {badge.label}
                    </span>
                  )}

                  {/* Car name */}
                  <p
                    className="truncate font-semibold leading-snug"
                    style={{ fontSize: '15px', color: '#0D0D0D' }}
                  >
                    {displayName}
                  </p>

                  {/* Details */}
                  <p style={{ fontSize: '12px', color: '#7A7A7A' }}>
                    연식 · 무보증금 · 보험포함
                  </p>

                  {/* Monthly price */}
                  <p
                    className="font-bold leading-tight tracking-tight"
                    style={{ fontSize: '20px', color: '#1A6DFF' }}
                  >
                    {formatKRW(monthlyRental, { monthly: true })}
                  </p>

                  {/* VAT note */}
                  <p style={{ fontSize: '11px', color: '#B0B0B0' }}>
                    VAT, 취등록세, 보험료 포함
                  </p>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}
