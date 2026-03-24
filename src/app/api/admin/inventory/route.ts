import { type NextRequest } from 'next/server'
import { requireAdmin } from '@/lib/api/auth'
import { apiSuccess, apiError } from '@/lib/api/response'
import { getInventoryItemsQuery } from '@/features/inventory/queries/inventory'
import type { InventoryFilter, InventoryCategory } from '@/features/inventory/types'

const VALID_CATEGORIES: InventoryCategory[] = ['STRATEGIC', 'GENERAL']

function parseCategory(value: string | null): InventoryCategory | undefined {
  if (!value) return undefined
  return VALID_CATEGORIES.includes(value as InventoryCategory)
    ? (value as InventoryCategory)
    : undefined
}

export async function GET(request: NextRequest) {
  const auth = await requireAdmin()
  if (auth.error) return auth.error

  try {
    const url = new URL(request.url)
    const filter: InventoryFilter = {
      search: url.searchParams.get('search') ?? undefined,
      category: parseCategory(url.searchParams.get('category')),
      brand: url.searchParams.get('brand') ?? undefined,
    }

    const data = await getInventoryItemsQuery(filter)
    return apiSuccess(data)
  } catch {
    return apiError('서버 오류가 발생했습니다', 500)
  }
}
