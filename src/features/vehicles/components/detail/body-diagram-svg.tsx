'use client'

import { memo } from 'react'
import { VIEW_PATHS, type ViewDirection } from './body-diagram-paths'
import { PANEL_COLORS } from './types'

type PanelStatus = 'normal' | 'repainted' | 'replaced'

type BodyDiagramSvgProps = {
  view: ViewDirection
  panels: Record<string, PanelStatus>
  hoveredPanel: string | null
  onPanelHover: (panelKey: string | null) => void
  onPanelClick: (panelKey: string) => void
}

function BodyDiagramSvgInner({
  view,
  panels,
  hoveredPanel,
  onPanelHover,
  onPanelClick,
}: BodyDiagramSvgProps) {
  const paths = VIEW_PATHS[view]

  return (
    <svg
      viewBox="0 0 400 300"
      width="100%"
      preserveAspectRatio="xMidYMid meet"
      className="select-none"
      role="img"
      aria-label={`차량 외부패널 ${view} 방향 진단도`}
    >
      {paths.map(({ panelKey, d }) => {
        const status = panels[panelKey] ?? 'normal'
        const fill = PANEL_COLORS[status]
        const isHovered = hoveredPanel === panelKey

        return (
          <path
            key={panelKey}
            data-panel={panelKey}
            d={d}
            fill={fill}
            stroke="#94A3B8"
            strokeWidth="1.5"
            className="cursor-pointer transition-opacity duration-200"
            opacity={isHovered ? 1 : 0.8}
            onMouseEnter={() => onPanelHover(panelKey)}
            onMouseLeave={() => onPanelHover(null)}
            onClick={() => onPanelClick(panelKey)}
          />
        )
      })}
    </svg>
  )
}

export const BodyDiagramSvg = memo(BodyDiagramSvgInner)
