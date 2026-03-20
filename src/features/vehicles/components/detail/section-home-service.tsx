'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { InquiryForm } from '@/features/vehicles/components/inquiry-form'
import { ShoppingCart, CreditCard, Truck, RotateCcw, Home } from 'lucide-react'

type SectionHomeServiceProps = {
  vehicleId: string
  vehicleName: string
}

const STEPS = [
  {
    icon: ShoppingCart,
    label: '주문',
    description: '원하는 차량을 선택하고 주문하세요',
  },
  {
    icon: CreditCard,
    label: '결제',
    description: '안전한 결제 시스템으로 결제하세요',
  },
  {
    icon: Truck,
    label: '배송',
    description: '원하는 장소로 차량을 배송해드립니다',
  },
  {
    icon: RotateCcw,
    label: '3일 환불',
    description: '3일 이내 무조건 환불 보장',
  },
] as const

export function SectionHomeService({
  vehicleId,
  vehicleName,
}: SectionHomeServiceProps) {
  const [dialogOpen, setDialogOpen] = useState(false)

  return (
    <section id="home-service" className="scroll-mt-20">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Home className="size-5 text-accent" />
            홈서비스 구매안내
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 4-step indicator */}
          <div className="grid grid-cols-2 gap-4 lg:flex lg:items-start lg:justify-between">
            {STEPS.map((step, idx) => {
              const Icon = step.icon
              return (
                <div key={step.label} className="relative flex flex-col items-center text-center">
                  {/* Connector line (desktop only, not on first item) */}
                  {idx > 0 && (
                    <div className="absolute top-6 right-full hidden h-0.5 w-full bg-muted lg:block" />
                  )}
                  <div className="flex size-12 items-center justify-center rounded-full bg-accent/10 text-accent">
                    <Icon className="size-5" />
                  </div>
                  <span className="mt-2 text-sm font-bold">{step.label}</span>
                  <span className="mt-1 text-xs text-muted-foreground">
                    {step.description}
                  </span>
                </div>
              )
            })}
          </div>

          {/* Visit reservation button */}
          <div className="flex justify-center">
            <Button
              variant="outline"
              onClick={() => setDialogOpen(true)}
            >
              직영점 방문예약
            </Button>
          </div>

          {/* Reservation dialog */}
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>직영점 방문예약</DialogTitle>
                <DialogDescription>
                  방문 예약을 신청하시면 상담사가 연락드립니다
                </DialogDescription>
              </DialogHeader>
              <InquiryForm
                vehicleId={vehicleId}
                vehicleTitle={vehicleName}
                onSuccess={() => setDialogOpen(false)}
              />
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    </section>
  )
}
