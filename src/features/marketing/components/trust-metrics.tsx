import { prisma } from '@/lib/db/prisma'

export async function TrustMetrics() {
  const [vehicleCount, brandCount, dealerCount] = await Promise.all([
    prisma.vehicle.count({ where: { approvalStatus: 'APPROVED' } }),
    prisma.brand.count(),
    prisma.profile.count({ where: { role: 'DEALER' } }),
  ])

  const stats = [
    { label: '등록 차량', value: vehicleCount },
    { label: '제휴 브랜드', value: brandCount },
    { label: '협력 딜러', value: dealerCount },
  ]

  return (
    <section className="bg-muted/50 py-12 md:py-16">
      <div className="mx-auto max-w-7xl px-4">
        <div className="grid grid-cols-3 gap-4 md:gap-8">
          {stats.map(({ label, value }) => (
            <div key={label} className="text-center">
              <p className="text-3xl font-bold text-primary md:text-4xl">
                {value.toLocaleString('ko-KR')}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
