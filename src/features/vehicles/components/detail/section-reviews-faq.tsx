'use client'

import { useCallback, useEffect, useState } from 'react'
import useEmblaCarousel from 'embla-carousel-react'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/accordion'
import { Button } from '@/components/ui/button'
import { Star, ChevronLeft, ChevronRight } from 'lucide-react'

type Review = {
  id: string
  name: string
  rating: number
  date: string
  comment: string
}

type SectionReviewsFaqProps = {
  reviews?: Review[]
}

const MOCK_REVIEWS: Review[] = [
  {
    id: '1',
    name: '김*수',
    rating: 5,
    date: '2026.02.15',
    comment:
      '차량 상태가 정말 깨끗했습니다. 홈서비스로 집 앞까지 배송받았는데 편하고 좋았어요. 다음에도 이용할 예정입니다.',
  },
  {
    id: '2',
    name: '이*영',
    rating: 4,
    date: '2026.01.28',
    comment:
      '가격 대비 만족스러운 차량이었습니다. 진단 결과도 투명하게 공개되어 있어서 믿음이 갔습니다.',
  },
  {
    id: '3',
    name: '박*준',
    rating: 5,
    date: '2026.01.10',
    comment:
      '3일 환불 보장이 있어서 안심하고 구매했습니다. 실제로 차량 컨디션이 매우 좋아 환불할 필요가 없었네요!',
  },
  {
    id: '4',
    name: '최*아',
    rating: 4,
    date: '2025.12.20',
    comment:
      '상담사분이 친절하게 안내해주셔서 처음 중고차 구매인데도 걱정 없이 진행했습니다. 추천합니다.',
  },
  {
    id: '5',
    name: '정*호',
    rating: 5,
    date: '2025.12.05',
    comment:
      '보증 서비스까지 포함되어 있어서 마음이 놓였습니다. 차량 품질 관리가 잘 되어 있다는 느낌을 받았어요.',
  },
]

const FAQ_DATA = {
  purchase: {
    label: '구매절차',
    items: [
      {
        q: '온라인 구매 절차가 어떻게 되나요?',
        a: '원하시는 차량을 선택 후 온라인으로 주문하시면, 상담사가 연락드립니다. 계약 조건 확인 후 결제를 진행하시면 원하시는 장소로 차량을 배송해드립니다.',
      },
      {
        q: '계약 후 취소가 가능한가요?',
        a: '계약 체결 전까지 언제든 취소 가능합니다. 계약 체결 후에도 차량 인수 전이라면 위약금 없이 취소할 수 있습니다.',
      },
      {
        q: '할부 구매 시 필요한 서류는?',
        a: '신분증, 소득증빙서류가 필요합니다. 직장인의 경우 재직증명서와 원천징수영수증, 사업자의 경우 사업자등록증과 소득금액증명원을 준비해주세요.',
      },
    ],
  },
  delivery: {
    label: '배송',
    items: [
      {
        q: '배송은 얼마나 걸리나요?',
        a: '주문 확정 후 평균 3-5 영업일 소요됩니다. 지역 및 차량 준비 상태에 따라 다소 차이가 있을 수 있습니다.',
      },
      {
        q: '배송비는 얼마인가요?',
        a: '전국 무료배송을 지원합니다. 도서산간 지역의 경우 별도 안내드립니다.',
      },
      {
        q: '배송 지역 제한이 있나요?',
        a: '대한민국 전 지역 배송 가능합니다. 제주도 및 도서산간 지역도 배송 가능하며, 일정은 별도 안내드립니다.',
      },
    ],
  },
  refund: {
    label: '환불',
    items: [
      {
        q: '3일 환불 보장 조건은?',
        a: '차량 인수 후 3일(72시간) 이내 무조건 환불이 가능합니다. 주행거리 300km 이내, 사고 이력이 없는 경우에 해당됩니다.',
      },
      {
        q: '환불 시 배송비는?',
        a: '환불 시 배송비는 무료입니다. 차량 수거부터 환불 처리까지 모든 비용을 당사에서 부담합니다.',
      },
      {
        q: '환불 절차는 어떻게 되나요?',
        a: '고객센터 연락 후 차량 수거 일정을 잡으면, 수거 완료 후 3 영업일 이내 환불 처리됩니다.',
      },
    ],
  },
  warranty: {
    label: '보증',
    items: [
      {
        q: '보증 기간은 얼마인가요?',
        a: '제조사 보증 + 자체 연장보증을 제공합니다. 차량별로 상이하며, 상세 보증 기간은 차량 상세 페이지에서 확인 가능합니다.',
      },
      {
        q: '보증 수리 범위는?',
        a: '엔진, 미션 등 주요 부품을 보장합니다. 소모품(타이어, 브레이크패드 등)은 보증 대상에서 제외됩니다.',
      },
      {
        q: '연장 보증은 어떻게 가입하나요?',
        a: '차량 구매 시 선택 가능합니다. 구매 상담 시 연장 보증 옵션과 비용에 대해 안내드립니다.',
      },
    ],
  },
} as const

function StarRating({ rating, size = 16 }: { rating: number; size?: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          className={i < rating ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/30'}
          style={{ width: size, height: size }}
        />
      ))}
    </div>
  )
}

export function SectionReviewsFaq({ reviews = MOCK_REVIEWS }: SectionReviewsFaqProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: 'start',
    containScroll: 'trimSnaps',
  })
  const [canScrollPrev, setCanScrollPrev] = useState(false)
  const [canScrollNext, setCanScrollNext] = useState(false)

  const onSelect = useCallback(() => {
    if (!emblaApi) return
    setCanScrollPrev(emblaApi.canScrollPrev())
    setCanScrollNext(emblaApi.canScrollNext())
  }, [emblaApi])

  useEffect(() => {
    if (!emblaApi) return
    onSelect()
    emblaApi.on('select', onSelect)
    emblaApi.on('reInit', onSelect)
    return () => {
      emblaApi.off('select', onSelect)
      emblaApi.off('reInit', onSelect)
    }
  }, [emblaApi, onSelect])

  // Calculate average rating
  const avgRating =
    reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0

  return (
    <section id="reviews-faq" className="scroll-mt-20 space-y-8">
      {/* Reviews section */}
      <Card>
        <CardContent className="space-y-4 pt-6">
          <h3 className="text-base font-semibold">구매후기</h3>

          {reviews.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              <p>아직 등록된 후기가 없습니다</p>
              <p className="mt-1">첫 번째 후기를 남겨주세요!</p>
            </div>
          ) : (
            <>
              {/* Average rating */}
              <div className="flex items-center gap-2">
                <StarRating rating={Math.round(avgRating)} />
                <span className="text-sm font-medium">
                  {avgRating.toFixed(1)}
                </span>
                <span className="text-sm text-muted-foreground">
                  ({reviews.length}개 후기)
                </span>
              </div>

              {/* Embla carousel */}
              <div className="relative">
                <div ref={emblaRef} className="overflow-hidden">
                  <div className="flex gap-3">
                    {reviews.map((review) => (
                      <div
                        key={review.id}
                        className="min-w-[280px] flex-shrink-0"
                      >
                        <Card size="sm" className="h-full p-4">
                          <div className="flex flex-col gap-2">
                            <StarRating rating={review.rating} size={14} />
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium">
                                {review.name}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {review.date}
                              </span>
                            </div>
                            <p className="line-clamp-3 text-sm text-muted-foreground">
                              {review.comment}
                            </p>
                          </div>
                        </Card>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Navigation buttons */}
                {canScrollPrev && (
                  <Button
                    variant="outline"
                    size="icon-sm"
                    className="absolute -left-3 top-1/2 hidden -translate-y-1/2 rounded-full shadow-md lg:flex"
                    onClick={() => emblaApi?.scrollPrev()}
                  >
                    <ChevronLeft className="size-4" />
                  </Button>
                )}
                {canScrollNext && (
                  <Button
                    variant="outline"
                    size="icon-sm"
                    className="absolute -right-3 top-1/2 hidden -translate-y-1/2 rounded-full shadow-md lg:flex"
                    onClick={() => emblaApi?.scrollNext()}
                  >
                    <ChevronRight className="size-4" />
                  </Button>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* FAQ section */}
      <Card>
        <CardContent className="space-y-4 pt-6">
          <h3 className="text-base font-semibold">자주 묻는 질문</h3>

          <Tabs defaultValue="purchase">
            <TabsList>
              {Object.entries(FAQ_DATA).map(([key, category]) => (
                <TabsTrigger key={key} value={key}>
                  {category.label}
                </TabsTrigger>
              ))}
            </TabsList>

            {Object.entries(FAQ_DATA).map(([key, category]) => (
              <TabsContent key={key} value={key}>
                <Accordion>
                  {category.items.map((item, idx) => (
                    <AccordionItem key={idx} value={`${key}-${idx}`}>
                      <AccordionTrigger>{item.q}</AccordionTrigger>
                      <AccordionContent>
                        <p className="text-muted-foreground">{item.a}</p>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </section>
  )
}
