'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { useCallback } from 'react'
import { FileText } from 'lucide-react'
import Link from 'next/link'
import { ContractCard } from '@/features/contracts/components/contract-card'
import type { ContractListItem } from '@/features/contracts/types'
import type { ContractStatus } from '@prisma/client'

type Tab = 'all' | 'active' | 'completed' | 'canceled'

const TABS: { key: Tab; label: string }[] = [
  { key: 'all', label: '전체' },
  { key: 'active', label: '진행중' },
  { key: 'completed', label: '완료' },
  { key: 'canceled', label: '취소' },
]

const ACTIVE_STATUSES: ContractStatus[] = [
  'DRAFT',
  'PENDING_EKYC',
  'PENDING_APPROVAL',
  'APPROVED',
  'ACTIVE',
]

function filterContracts(contracts: ContractListItem[], tab: Tab): ContractListItem[] {
  switch (tab) {
    case 'active':
      return contracts.filter((c) => ACTIVE_STATUSES.includes(c.status))
    case 'completed':
      return contracts.filter((c) => c.status === 'COMPLETED')
    case 'canceled':
      return contracts.filter((c) => c.status === 'CANCELED')
    default:
      return contracts
  }
}

type ContractListProps = {
  contracts: ContractListItem[]
}

export function ContractList({ contracts }: ContractListProps) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const currentTab = (searchParams.get('tab') as Tab) || 'all'

  const handleTabChange = useCallback(
    (tab: Tab) => {
      const params = new URLSearchParams(searchParams.toString())
      if (tab === 'all') {
        params.delete('tab')
      } else {
        params.set('tab', tab)
      }
      const qs = params.toString()
      router.push(qs ? `/mypage?${qs}` : '/mypage')
    },
    [searchParams, router]
  )

  const filtered = filterContracts(contracts, currentTab)

  return (
    <div>
      {/* Tab filters */}
      <div className="mb-4 flex gap-2">
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => handleTabChange(key)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              currentTab === key
                ? 'bg-navy-900 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Contract list */}
      {filtered.length > 0 ? (
        <div className="flex flex-col gap-3">
          {filtered.map((contract) => (
            <ContractCard key={`${contract.contractType}-${contract.id}`} contract={contract} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 py-12 text-center">
          <FileText className="mb-3 size-10 text-gray-400" />
          {currentTab === 'all' ? (
            <>
              <p className="mb-1 font-medium text-gray-700">아직 계약이 없습니다</p>
              <p className="mb-4 text-sm text-gray-500">
                원하는 차량을 찾아 렌탈 또는 리스 계약을 시작해보세요.
              </p>
              <Link
                href="/vehicles"
                className="rounded-lg bg-navy-900 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-navy-800"
              >
                차량 둘러보기
              </Link>
            </>
          ) : (
            <p className="font-medium text-gray-700">해당 상태의 계약이 없습니다</p>
          )}
        </div>
      )}
    </div>
  )
}
