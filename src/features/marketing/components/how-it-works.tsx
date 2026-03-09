import { Search, BarChart3, FileCheck } from 'lucide-react'

const steps = [
  {
    icon: Search,
    step: 1,
    title: '검색',
    description: '원하는 차량을 검색하세요',
  },
  {
    icon: BarChart3,
    step: 2,
    title: '비교',
    description: '조건을 비교해 보세요',
  },
  {
    icon: FileCheck,
    step: 3,
    title: '계약',
    description: '비대면으로 계약하세요',
  },
] as const

export function HowItWorks() {
  return (
    <section className="py-12 md:py-16">
      <div className="mx-auto max-w-7xl px-4">
        <h2 className="mb-8 text-center text-2xl font-bold text-primary md:text-3xl">
          이용 방법
        </h2>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {steps.map(({ icon: Icon, step, title, description }) => (
            <div
              key={step}
              className="flex flex-col items-center rounded-xl border border-border bg-card p-8 text-center shadow-sm"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-accent/10 text-accent">
                <Icon className="h-7 w-7" />
              </div>
              <span className="mt-4 text-sm font-medium text-accent">
                Step {step}
              </span>
              <h3 className="mt-2 text-lg font-bold text-primary">{title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
