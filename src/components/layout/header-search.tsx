'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search } from 'lucide-react'

export function HeaderSearch() {
  const router = useRouter()
  const [keyword, setKeyword] = useState('')

  function handleSearch() {
    const trimmed = keyword.trim()
    if (!trimmed) return
    router.push(`/vehicles?keyword=${encodeURIComponent(trimmed)}`)
    setKeyword('')
  }

  return (
    <div className="relative hidden w-full max-w-md md:block">
      <input
        type="text"
        value={keyword}
        onChange={(e) => setKeyword(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
        placeholder="차량 검색 (브랜드, 모델명)"
        className="h-10 w-full rounded-full border border-border-subtle bg-secondary pl-4 pr-10 text-sm text-foreground placeholder-text-tertiary outline-none focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:ring-offset-2 transition-colors focus:border-brand-blue"
      />
      <button
        type="button"
        onClick={handleSearch}
        className="absolute right-1 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-full text-text-tertiary transition-colors hover:bg-border-subtle hover:text-muted-foreground"
        aria-label="검색"
      >
        <Search className="size-4" />
      </button>
    </div>
  )
}
