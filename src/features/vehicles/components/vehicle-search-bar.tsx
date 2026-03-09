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
    <div className="bg-[#F4F4F4] px-4 py-4 lg:px-[120px]">
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-5 -translate-y-1/2 text-[#71717A]" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="차종이나 모델명으로 검색"
            className="h-12 w-full rounded-xl bg-white pl-10 pr-4 text-sm text-[#0D0D0D] placeholder:text-[#71717A] focus:outline-none focus:ring-2 focus:ring-[#1A6DFF]/30"
          />
        </div>
        <button
          type="button"
          onClick={handleSearch}
          className="h-12 shrink-0 rounded-xl bg-[#1A6DFF] px-6 text-sm font-semibold text-white transition-opacity hover:opacity-90"
        >
          검색
        </button>
      </div>
    </div>
  )
}
