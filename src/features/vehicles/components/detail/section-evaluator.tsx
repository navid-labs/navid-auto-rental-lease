import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BadgeCheck, User, Quote } from 'lucide-react'

type SectionEvaluatorProps = {
  evaluator: {
    name: string
    branch: string
    employeeId: string
    photoUrl: string | null
    recommendation: string
  } | null
}

export function SectionEvaluator({ evaluator }: SectionEvaluatorProps) {
  return (
    <section id="evaluator" className="scroll-mt-20">
      <Card className="border-l-4 border-l-accent">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Quote className="size-5 text-accent" />
            차량평가사 추천
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!evaluator ? (
            <p className="text-sm text-muted-foreground">
              평가사 정보가 등록되지 않았습니다
            </p>
          ) : (
            <div className="space-y-4">
              {/* Profile info */}
              <div className="flex items-center gap-4">
                {/* Avatar */}
                <div className="flex size-20 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted">
                  {evaluator.photoUrl ? (
                    <img
                      src={evaluator.photoUrl}
                      alt={evaluator.name}
                      className="size-full object-cover"
                    />
                  ) : (
                    <User className="size-8 text-muted-foreground" />
                  )}
                </div>

                {/* Name, branch, employee ID */}
                <div className="space-y-1">
                  <p className="text-lg font-semibold">{evaluator.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {evaluator.branch}
                  </p>
                  <p className="flex items-center gap-1 text-xs text-muted-foreground">
                    <BadgeCheck className="size-3.5 text-accent" />
                    {evaluator.employeeId}
                  </p>
                </div>
              </div>

              {/* Recommendation quote */}
              <div className="relative pl-4">
                <span className="absolute -left-1 -top-2 font-serif text-4xl leading-none text-muted-foreground/20">
                  &ldquo;
                </span>
                <p className="italic text-muted-foreground">
                  {evaluator.recommendation}
                </p>
                <span className="mt-1 inline-block font-serif text-4xl leading-none text-muted-foreground/20">
                  &rdquo;
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  )
}
