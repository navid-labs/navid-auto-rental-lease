export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex">
      {/* Left brand panel */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between bg-[#0f1e3c] p-12 relative overflow-hidden">
        {/* Decorative background circles */}
        <div className="absolute -top-24 -left-24 size-96 rounded-full bg-blue-600/10" />
        <div className="absolute -bottom-32 -right-16 size-[480px] rounded-full bg-blue-500/10" />
        {/* Grid pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />

        {/* Logo */}
        <div className="relative z-10">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 shadow-lg">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                className="size-5 text-white"
                aria-hidden="true"
              >
                <path
                  d="M5 17H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v3"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <rect
                  x="9"
                  y="11"
                  width="14"
                  height="10"
                  rx="2"
                  stroke="currentColor"
                  strokeWidth="2"
                />
                <circle cx="12" cy="16" r="1" fill="currentColor" />
                <circle cx="20" cy="16" r="1" fill="currentColor" />
              </svg>
            </div>
            <span className="text-xl font-bold tracking-tight text-white">Navid Auto</span>
          </div>
        </div>

        {/* Center content */}
        <div className="relative z-10 space-y-6">
          <h2 className="text-4xl font-bold leading-tight text-white">
            중고차 렌탈·리스,
            <br />
            <span className="text-blue-400">더 스마트하게</span>
          </h2>
          <p className="text-base leading-relaxed text-slate-300">
            투명한 비용 비교와 간편한 계약으로
            <br />
            최적의 차량 이용 방법을 찾아드립니다.
          </p>
          {/* Feature list */}
          <ul className="space-y-3">
            {[
              '렌탈 vs 리스 즉시 비용 비교',
              '100% 비대면 온라인 계약',
              '전국 2,000+ 차량 라인업',
            ].map((item) => (
              <li key={item} className="flex items-center gap-3 text-sm text-slate-300">
                <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-blue-500/20">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    className="size-3 text-blue-400"
                    aria-hidden="true"
                  >
                    <path
                      d="M5 13l4 4L19 7"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* Bottom tagline */}
        <p className="relative z-10 text-xs text-slate-500">
          © 2024 Navid Auto. 안전하고 투명한 중고차 플랫폼.
        </p>
      </div>

      {/* Right form panel */}
      <div className="flex flex-1 items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-6">
        <div className="w-full max-w-md">
          {/* Mobile logo (shown only on small screens) */}
          <div className="mb-8 flex items-center justify-center gap-2 lg:hidden">
            <div className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-blue-700">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                className="size-4 text-white"
                aria-hidden="true"
              >
                <path
                  d="M5 17H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v3"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <rect
                  x="9"
                  y="11"
                  width="14"
                  height="10"
                  rx="2"
                  stroke="currentColor"
                  strokeWidth="2"
                />
                <circle cx="12" cy="16" r="1" fill="currentColor" />
                <circle cx="20" cy="16" r="1" fill="currentColor" />
              </svg>
            </div>
            <span className="text-lg font-bold tracking-tight text-slate-800">Navid Auto</span>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white shadow-xl shadow-slate-200/50 p-8">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}
