'use client'

import { useQueryStates } from 'nuqs'
import { searchParamsParsers } from '../lib/search-params'
import { Truck, Zap, Leaf, Car, ShieldCheck } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

type QuickFilter = {
  key: string
  label: string
  icon: LucideIcon
  paramValue: string
}

const QUICK_FILTERS: QuickFilter[] = [
  { key: 'homeService', label: '무료배송', icon: Truck, paramValue: 'true' },
  { key: 'timeDeal', label: '타임딜', icon: Zap, paramValue: 'true' },
  { key: 'fuel', label: '친환경', icon: Leaf, paramValue: 'ELECTRIC,HYBRID,HYDROGEN' },
  { key: 'hasRental', label: '렌트가능', icon: Car, paramValue: 'true' },
  { key: 'noAccident', label: '무사고', icon: ShieldCheck, paramValue: 'true' },
]

export function QuickFilterBadges() {
  const [filters, setFilters] = useQueryStates(searchParamsParsers, {
    shallow: false,
  })

  const isActive = (filter: QuickFilter): boolean => {
    const currentValue = filters[filter.key as keyof typeof filters]
    if (filter.key === 'fuel') {
      return currentValue === 'ELECTRIC,HYBRID,HYDROGEN'
    }
    return currentValue === filter.paramValue
  }

  const handleToggle = (filter: QuickFilter) => {
    if (isActive(filter)) {
      // Deactivate
      if (filter.key === 'fuel') {
        setFilters({ fuel: '', page: 1 })
      } else {
        setFilters({ [filter.key]: '', page: 1 })
      }
    } else {
      // Activate
      if (filter.key === 'fuel') {
        setFilters({ fuel: filter.paramValue, page: 1 })
      } else {
        setFilters({ [filter.key]: filter.paramValue, page: 1 })
      }
    }
  }

  return (
    <div className="mb-4 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {QUICK_FILTERS.map((filter) => {
        const active = isActive(filter)
        const Icon = filter.icon

        return (
          <button
            key={filter.key}
            type="button"
            onClick={() => handleToggle(filter)}
            className={`shrink-0 rounded-full border px-4 py-1.5 text-sm font-medium cursor-pointer whitespace-nowrap transition-colors ${
              active
                ? 'border-accent bg-accent text-accent-foreground'
                : 'border-border bg-card text-foreground hover:border-accent hover:text-accent'
            }`}
          >
            <Icon className="size-3.5 mr-1.5 inline-block" />
            {filter.label}
          </button>
        )
      })}
    </div>
  )
}
