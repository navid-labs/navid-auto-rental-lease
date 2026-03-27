'use client'

import { useState, useRef, useCallback } from 'react'
import Link from 'next/link'
import { MENU_DATA } from './mega-menu-data'

export function MegaMenu() {
  const [activeMenu, setActiveMenu] = useState<string | null>(null)
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleMouseEnter = useCallback((label: string) => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current)
      closeTimerRef.current = null
    }
    setActiveMenu(label)
  }, [])

  const handleMouseLeave = useCallback(() => {
    closeTimerRef.current = setTimeout(() => {
      setActiveMenu(null)
    }, 200) // 200ms delay to prevent flicker (RESEARCH.md Pitfall 3)
  }, [])

  return (
    <nav className="hidden border-t border-surface-hover md:block">
      <div className="mx-auto flex max-w-7xl items-center gap-0 px-4 md:px-[120px]">
        {MENU_DATA.map((category) => (
          <div
            key={category.label}
            className="relative"
            onMouseEnter={() =>
              category.hasMegaMenu && handleMouseEnter(category.label)
            }
            onMouseLeave={handleMouseLeave}
          >
            <Link
              href={category.href}
              className={`flex h-[52px] items-center px-5 text-[14px] font-medium transition-colors ${
                activeMenu === category.label
                  ? 'border-b-2 border-brand-blue text-brand-blue'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {category.label}
            </Link>

            {/* Mega menu dropdown */}
            {category.hasMegaMenu &&
              activeMenu === category.label &&
              category.sections && (
                <div
                  className="absolute left-0 top-full z-50 w-[600px] rounded-b-xl border border-t-0 border-border-subtle bg-white p-6 shadow-lg"
                  onMouseEnter={() => handleMouseEnter(category.label)}
                  onMouseLeave={handleMouseLeave}
                >
                  <div className="grid grid-cols-3 gap-6">
                    {category.sections.map((section) => (
                      <div key={section.title}>
                        <p className="mb-2 text-[13px] font-bold text-foreground">
                          {section.title}
                        </p>
                        <ul className="flex flex-col gap-1.5">
                          {section.links.map((link) => (
                            <li key={link.href}>
                              <Link
                                href={link.href}
                                className="text-[13px] text-muted-foreground transition-colors hover:text-brand-blue"
                                onClick={() => setActiveMenu(null)}
                              >
                                {link.label}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              )}
          </div>
        ))}
      </div>
    </nav>
  )
}
