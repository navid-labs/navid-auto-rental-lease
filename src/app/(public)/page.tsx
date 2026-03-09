import Link from 'next/link'

export default function HomePage() {
  return (
    <section className="flex flex-1 flex-col items-center justify-center px-4 py-24 md:py-32">
      <div className="mx-auto max-w-3xl text-center">
        <h1 className="text-4xl font-bold tracking-tight text-primary md:text-5xl lg:text-6xl">
          프리미엄 중고차
          <br />
          <span className="text-accent">렌탈 &amp; 리스</span>
        </h1>
        <p className="mt-6 text-lg text-muted-foreground md:text-xl">
          Navid Auto에서 시작하세요.
          <br className="hidden sm:block" />
          온라인으로 간편하게 비교하고 계약까지 완료하세요.
        </p>
        <div className="mt-10">
          <Link
            href="/vehicles"
            className="inline-flex items-center rounded-xl bg-accent px-8 py-3.5 text-base font-semibold text-accent-foreground shadow-lg shadow-accent/20 backdrop-blur-sm transition-all hover:bg-accent/90 hover:shadow-xl hover:shadow-accent/30"
          >
            차량 둘러보기
          </Link>
        </div>
      </div>
    </section>
  )
}
