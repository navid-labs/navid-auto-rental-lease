'use client'

import { useCallback } from 'react'
import { SECTION_IDS, SECTION_LABELS } from './types'
import type { SectionId } from './types'

type StickyTabNavProps = {
  activeSection: SectionId
}

export function StickyTabNav({ activeSection }: StickyTabNavProps) {
  const handleTabClick = useCallback((sectionId: string) => {
    const el = document.getElementById(sectionId)
    if (el) {
      // Offset for header (64px) + tab bar (48px) + gap (16px) = 128px
      window.scrollTo({ top: el.offsetTop - 128, behavior: 'smooth' })
    }
  }, [])

  return (
    <nav
      className="sticky top-16 z-30 border-b bg-white"
      aria-label="섹션 탭 네비게이션"
    >
      <div className="scrollbar-hide flex h-12 snap-x snap-mandatory overflow-x-auto">
        {SECTION_IDS.map((id) => {
          const isActive = activeSection === id
          return (
            <button
              key={id}
              type="button"
              onClick={() => handleTabClick(id)}
              className={`flex shrink-0 snap-start items-center whitespace-nowrap px-4 py-3 text-sm transition-colors ${
                isActive
                  ? 'border-b-2 border-accent font-medium text-accent'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              style={{ minHeight: 44 }}
              aria-current={isActive ? 'true' : undefined}
            >
              {SECTION_LABELS[id].tab}
            </button>
          )
        })}
      </div>
    </nav>
  )
}
