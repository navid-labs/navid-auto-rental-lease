'use client'

import { useRouter } from 'next/navigation'

type BrandFilterClientProps = {
  brands: { id: string; name: string; nameKo: string | null }[]
  selectedBrandId: string
}

export function BrandFilterClient({ brands, selectedBrandId }: BrandFilterClientProps) {
  const router = useRouter()

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const value = e.target.value
    if (value) {
      router.push(`/admin/residual-value?brandId=${value}`)
    } else {
      router.push('/admin/residual-value')
    }
  }

  return (
    <select
      id="brand-filter"
      value={selectedBrandId}
      onChange={handleChange}
      className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      <option value="">전체 브랜드</option>
      {brands.map((b) => (
        <option key={b.id} value={b.id}>
          {b.nameKo || b.name}
        </option>
      ))}
    </select>
  )
}
