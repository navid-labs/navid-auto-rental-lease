'use client'

import { useState } from 'react'
import {
  Navigation2,
  Camera,
  Video,
  Flame,
  Wind,
  Armchair,
  Gauge,
  KeyRound,
  Sun,
  Monitor,
  ShieldCheck,
  Shield,
  CreditCard,
  Bluetooth,
  Usb,
  Zap,
  Lightbulb,
  ParkingSquare,
  CircleDot,
  ChevronDown,
  ChevronUp,
  type LucideIcon,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from '@/components/ui/collapsible'

type SectionOptionsProps = {
  options: string[]
}

const OPTION_ICONS: Record<string, LucideIcon> = {
  '네비게이션': Navigation2,
  '후방카메라': Camera,
  '블랙박스': Video,
  '열선시트': Flame,
  '통풍시트': Wind,
  '전동시트': Armchair,
  '크루즈컨트롤': Gauge,
  '스마트키': KeyRound,
  '선루프': Sun,
  'HUD': Monitor,
  'ABS': ShieldCheck,
  '에어백': Shield,
  '하이패스': CreditCard,
  '블루투스': Bluetooth,
  'USB': Usb,
  '무선충전': Zap,
  'LED헤드램프': Lightbulb,
  '자동주차': ParkingSquare,
}

const VISIBLE_COUNT = 8

export function SectionOptions({ options }: SectionOptionsProps) {
  const [open, setOpen] = useState(false)

  const visibleOptions = options.slice(0, VISIBLE_COUNT)
  const hiddenOptions = options.slice(VISIBLE_COUNT)
  const hasMore = hiddenOptions.length > 0

  return (
    <Card id="options" className="p-0">
      <CardContent>
        <h3 className="text-lg font-semibold mb-4">주요옵션</h3>

        {options.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            등록된 옵션 정보가 없습니다
          </p>
        ) : (
          <Collapsible open={open} onOpenChange={setOpen}>
            <div className="grid grid-cols-3 lg:grid-cols-4 gap-3">
              {visibleOptions.map((opt) => (
                <OptionItem key={opt} name={opt} />
              ))}
            </div>

            {hasMore && (
              <>
                <CollapsibleContent>
                  <div className="grid grid-cols-3 lg:grid-cols-4 gap-3 mt-3">
                    {hiddenOptions.map((opt) => (
                      <OptionItem key={opt} name={opt} />
                    ))}
                  </div>
                </CollapsibleContent>

                <CollapsibleTrigger className="mt-3 flex items-center gap-1 text-sm font-medium text-accent cursor-pointer mx-auto">
                  {open ? (
                    <>
                      접기 <ChevronUp className="size-4" />
                    </>
                  ) : (
                    <>
                      옵션 모두 보기 <ChevronDown className="size-4" />
                    </>
                  )}
                </CollapsibleTrigger>
              </>
            )}
          </Collapsible>
        )}
      </CardContent>
    </Card>
  )
}

function OptionItem({ name }: { name: string }) {
  const Icon = OPTION_ICONS[name] ?? CircleDot
  return (
    <div className="flex flex-col items-center gap-1.5 py-2">
      <Icon className="size-5 text-muted-foreground" />
      <span className="text-[13px] text-center leading-tight">{name}</span>
    </div>
  )
}
