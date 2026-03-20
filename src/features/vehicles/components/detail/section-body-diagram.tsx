'use client'

import { useState, useCallback } from 'react'
import { Card } from '@/components/ui/card'
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from '@/components/ui/tooltip'
import { BodyDiagramSvg } from './body-diagram-svg'
import { VIEW_LABELS, type ViewDirection } from './body-diagram-paths'
import { PANEL_COLORS, PANEL_LABELS } from './types'
import { cn } from '@/lib/utils'

type PanelStatus = 'normal' | 'repainted' | 'replaced'

type SectionBodyDiagramProps = {
  panels: Record<string, PanelStatus> | null
  repaintCount: number
  replacedCount: number
}

/** Korean names for each body panel key */
const PANEL_NAMES: Record<string, string> = {
  hood: '후드',
  frontBumper: '앞범퍼',
  rearBumper: '뒷범퍼',
  trunk: '트렁크',
  roof: '루프',
  frontLeftFender: '좌앞펜더',
  frontRightFender: '우앞펜더',
  rearLeftFender: '좌뒷펜더',
  rearRightFender: '우뒷펜더',
  frontLeftDoor: '좌앞도어',
  frontRightDoor: '우앞도어',
  rearLeftDoor: '좌뒷도어',
  rearRightDoor: '우뒷도어',
  leftRocker: '좌로커',
  rightRocker: '우로커',
}

const VIEW_ORDER: ViewDirection[] = ['front', 'rear', 'left', 'right', 'top']

export function SectionBodyDiagram({
  panels,
  repaintCount,
  replacedCount,
}: SectionBodyDiagramProps) {
  const [activeView, setActiveView] = useState<ViewDirection>('top')
  const [hoveredPanel, setHoveredPanel] = useState<string | null>(null)
  // Mobile tooltip state (toggled on tap)
  const [tappedPanel, setTappedPanel] = useState<string | null>(null)

  const handlePanelHover = useCallback((panelKey: string | null) => {
    setHoveredPanel(panelKey)
  }, [])

  const handlePanelClick = useCallback((panelKey: string) => {
    // On mobile, toggle tooltip; on desktop, hover handles it
    setTappedPanel((prev) => (prev === panelKey ? null : panelKey))
  }, [])

  // Dismiss mobile tooltip on tap elsewhere
  const handleContainerClick = useCallback(() => {
    setTappedPanel(null)
  }, [])

  if (!panels) {
    return (
      <section id="body-diagram">
        <h3 className="text-lg font-semibold mb-4">외부패널 진단</h3>
        <Card className="p-6">
          <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
            <p className="text-sm font-medium">
              진단 정보가 아직 등록되지 않았습니다
            </p>
            <p className="text-xs mt-1">
              차량 진단이 완료되면 상세 결과를 확인하실 수 있습니다.
            </p>
          </div>
        </Card>
      </section>
    )
  }

  const displayedPanel = hoveredPanel ?? tappedPanel
  const panelStatus = displayedPanel ? (panels[displayedPanel] ?? 'normal') : null

  return (
    <section id="body-diagram">
      <h3 className="text-lg font-semibold mb-4">외부패널 진단</h3>
      <Card className="p-6">
        {/* View selector */}
        <div className="flex gap-1 mb-4">
          {VIEW_ORDER.map((view) => (
            <button
              key={view}
              type="button"
              onClick={() => {
                setActiveView(view)
                setTappedPanel(null)
              }}
              className={cn(
                'flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                activeView === view
                  ? 'bg-foreground text-background'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80',
              )}
            >
              {VIEW_LABELS[view]}
            </button>
          ))}
        </div>

        {/* SVG diagram with tooltip */}
        <TooltipProvider>
          <div
            className="relative aspect-[2/1] lg:aspect-[2/1] w-full"
            onClick={handleContainerClick}
          >
            <Tooltip open={!!displayedPanel}>
              <TooltipTrigger
                render={<div className="w-full h-full" />}
              >
                <BodyDiagramSvg
                  view={activeView}
                  panels={panels}
                  hoveredPanel={displayedPanel}
                  onPanelHover={handlePanelHover}
                  onPanelClick={handlePanelClick}
                />
              </TooltipTrigger>
              {displayedPanel && panelStatus && (
                <TooltipContent side="top">
                  <span className="font-medium">
                    {PANEL_NAMES[displayedPanel] ?? displayedPanel}
                  </span>
                  <span className="mx-1">·</span>
                  <span
                    style={{ color: PANEL_COLORS[panelStatus] }}
                    className="font-medium"
                  >
                    {PANEL_LABELS[panelStatus]}
                  </span>
                </TooltipContent>
              )}
            </Tooltip>
          </div>
        </TooltipProvider>

        {/* Legend */}
        <div className="flex items-center gap-4 mt-4">
          {(Object.entries(PANEL_LABELS) as [PanelStatus, string][]).map(
            ([status, label]) => (
              <div key={status} className="flex items-center gap-1.5">
                <div
                  className="size-3 rounded-sm"
                  style={{ backgroundColor: PANEL_COLORS[status] }}
                />
                <span className="text-xs text-muted-foreground">{label}</span>
              </div>
            ),
          )}
        </div>

        {/* Summary counts */}
        <p className="text-sm text-muted-foreground mt-2">
          판금 {repaintCount}건 / 교환 {replacedCount}건
        </p>
      </Card>
    </section>
  )
}
