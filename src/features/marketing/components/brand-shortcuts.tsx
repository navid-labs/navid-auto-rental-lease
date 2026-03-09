import Link from 'next/link'
import Image from 'next/image'
import { prisma } from '@/lib/db/prisma'

export async function BrandShortcuts() {
  const brands = await prisma.brand.findMany({
    orderBy: { nameKo: 'asc' },
    select: { id: true, name: true, nameKo: true, logoUrl: true },
  })

  if (brands.length === 0) return null

  return (
    <section className="py-12 md:py-16">
      <div className="mx-auto max-w-7xl px-4">
        <h2 className="mb-6 text-2xl font-bold text-primary md:text-3xl">
          브랜드 바로가기
        </h2>

        <div className="grid grid-cols-3 gap-4 sm:grid-cols-4 md:grid-cols-6">
          {brands.map((brand) => (
            <Link
              key={brand.id}
              href={`/vehicles?brand=${brand.id}`}
              className="flex flex-col items-center gap-2 rounded-xl border border-border bg-card p-4 transition hover:border-accent hover:shadow-sm"
            >
              {brand.logoUrl ? (
                <div className="relative h-12 w-12">
                  <Image
                    src={brand.logoUrl}
                    alt={brand.nameKo || brand.name}
                    fill
                    className="object-contain"
                    sizes="48px"
                  />
                </div>
              ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-lg font-bold text-primary">
                  {(brand.nameKo || brand.name).charAt(0)}
                </div>
              )}
              <span className="text-center text-xs font-medium text-muted-foreground">
                {brand.nameKo || brand.name}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
