'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search } from 'lucide-react'

export function VehicleSearchBar() {
  const router = useRouter()
  const [query, setQuery] = useState('')

  const handleSearch = () => {
    if (!query.trim()) return
    const params = new URLSearchParams({ q: query.trim() })
    router.push(`/vehicles?${params.toString()}`)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  return (
    <div className="bg-surface-hover px-4 py-4 lg:px-[120px]">
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="차종이나 모델명으로 검색"
            className="h-12 w-full rounded-xl bg-white pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground outline-none focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:ring-offset-2"
          />
        </div>
        <button
          type="button"
          onClick={handleSearch}
          className="h-12 shrink-0 rounded-xl bg-brand-blue px-6 text-sm font-semibold text-white transition-opacity hover:opacity-90"
        >
          검색
        </button>
      </div>
    </div>
  )
}
