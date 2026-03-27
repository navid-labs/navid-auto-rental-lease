import Link from 'next/link'

type Banner = {
  tag: string
  title: string
  gradient: string
  link: string
}

const BANNERS: Banner[] = [
  {
    tag: 'EVENT',
    title: '1,000만원대\n인기 차량 모음',
    gradient: 'from-blue-600 to-indigo-800',
    link: '/vehicles?maxPrice=19999999',
  },
  {
    tag: 'HOT',
    title: '신차급 차량\n특가 세일',
    gradient: 'from-rose-600 to-red-800',
    link: '/vehicles?sort=newest',
  },
  {
    tag: 'SALE',
    title: '최대 할인\n금주의 특가',
    gradient: 'from-emerald-600 to-teal-800',
    link: '/vehicles?sort=price_asc',
  },
]

export function EventBanners() {
  return (
    <section className="bg-white py-12 md:py-[48px]">
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        {/* Section header */}
        <h2 className="mb-5 text-[28px] font-bold leading-tight text-foreground">기획전</h2>

        {/* Banner grid */}
        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          {BANNERS.map((banner) => (
            <Link
              key={banner.tag}
              href={banner.link}
              className={`group relative flex h-40 w-full overflow-hidden rounded-2xl bg-gradient-to-r ${banner.gradient} transition-all duration-300 hover:scale-[1.02] hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2`}
            >
              {/* Content overlay */}
              <div className="relative z-10 flex flex-col justify-center gap-3 px-9 py-8">
                {/* Tag badge */}
                <span className="inline-flex w-fit items-center rounded-xl bg-white/20 px-[10px] py-1 text-[11px] font-bold text-white">
                  {banner.tag}
                </span>

                {/* Title */}
                <p className="whitespace-pre-line text-[22px] font-bold leading-[1.3] text-white">
                  {banner.title}
                </p>
              </div>

              {/* Decorative circles */}
              <div className="pointer-events-none absolute right-0 top-0 h-full w-1/2 overflow-hidden">
                <div className="absolute -right-10 -top-10 h-44 w-44 rounded-full bg-white/10" />
                <div className="absolute -right-4 bottom-0 translate-y-1/3 h-32 w-32 rounded-full bg-white/[0.07]" />
                <div className="absolute right-16 top-1/2 -translate-y-1/2 h-20 w-20 rounded-full bg-white/[0.06]" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
