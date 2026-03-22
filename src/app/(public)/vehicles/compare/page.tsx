'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useVehicleInteractionStore } from '@/lib/stores/vehicle-interaction-store'
import { formatKRW, formatDistance, formatYearModel } from '@/lib/utils/format'
import { BreadcrumbNav } from '@/components/layout/breadcrumb-nav'
import {
  ArrowLeft,
  ImageIcon,
  X,
  GitCompareArrows,
  Search,
} from 'lucide-react'
import { useEffect, useState } from 'react'

const COMPARE_FIELDS = [
  { key: 'year', label: '연식', format: (v: number) => formatYearModel(v) },
  {
    key: 'mileage',
    label: '주행거리',
    format: (v: number) => formatDistance(v, { compact: true }),
  },
  { key: 'price', label: '차량가격', format: (v: number) => formatKRW(v) },
  {
    key: 'monthlyRental',
    label: '월 렌탈료',
    format: (v: number | null | undefined) =>
      v ? formatKRW(v, { monthly: true }) : '-',
  },
  {
    key: 'monthlyLease',
    label: '월 리스료',
    format: (v: number | null | undefined) =>
      v ? formatKRW(v, { monthly: true }) : '-',
  },
] as const

export default function ComparePage() {
  const [mounted, setMounted] = useState(false)
  const { comparison, removeFromComparison, clearComparison } =
    useVehicleInteractionStore()

  useEffect(() => {
    setMounted(true)
  }, [])

  const breadcrumb = (
    <BreadcrumbNav
      items={[
        { label: '내차사기', href: '/vehicles' },
        { label: '비교하기' },
      ]}
    />
  )

  if (!mounted) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8">
        {breadcrumb}
        <div className="h-96 animate-pulse rounded-xl bg-muted" />
      </div>
    )
  }

  if (comparison.length === 0) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8">
        {breadcrumb}
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <GitCompareArrows className="mb-4 size-16 text-muted-foreground/30" />
          <h2 className="text-xl font-bold">비교할 차량이 없습니다</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            차량 목록에서 비교 버튼을 눌러 차량을 추가하세요
          </p>
          <Link
            href="/vehicles"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-accent px-6 py-3 font-semibold text-white transition-colors hover:bg-accent/90"
          >
            <Search className="size-4" />
            차량 검색하기
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {breadcrumb}

      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/vehicles"
            className="rounded-lg p-2 transition-colors hover:bg-muted"
          >
            <ArrowLeft className="size-5" />
          </Link>
          <h1 className="text-2xl font-bold">차량 비교</h1>
          <span className="rounded-full bg-accent/10 px-3 py-1 text-sm font-medium text-accent">
            {comparison.length}대
          </span>
        </div>
        <button
          type="button"
          onClick={clearComparison}
          className="rounded-lg px-4 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted"
        >
          전체 초기화
        </button>
      </div>

      {/* Comparison Table */}
      <div className="overflow-x-auto rounded-xl border bg-white shadow-sm">
        <table className="w-full min-w-[640px]">
          {/* Vehicle headers */}
          <thead>
            <tr className="border-b">
              <th className="w-36 bg-muted/30 px-4 py-4 text-left text-sm font-medium text-muted-foreground">
                차량 정보
              </th>
              {comparison.map((vehicle) => (
                <th key={vehicle.id} className="px-4 py-4">
                  <div className="relative flex flex-col items-center">
                    <button
                      type="button"
                      onClick={() => removeFromComparison(vehicle.id)}
                      className="absolute -right-1 -top-1 rounded-full bg-muted p-1 transition-colors hover:bg-red-100"
                    >
                      <X className="size-3 text-muted-foreground" />
                    </button>
                    <Link
                      href={`/vehicles/${vehicle.id}`}
                      className="group flex flex-col items-center"
                    >
                      <div className="relative mb-3 size-24 overflow-hidden rounded-xl bg-muted sm:size-32">
                        {vehicle.thumbnailUrl ? (
                          <Image
                            src={vehicle.thumbnailUrl}
                            alt={`${vehicle.brandName} ${vehicle.modelName}`}
                            fill
                            className="object-cover transition-transform group-hover:scale-105"
                            sizes="128px"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center">
                            <ImageIcon className="size-8 text-muted-foreground/40" />
                          </div>
                        )}
                      </div>
                      <p className="text-sm font-semibold group-hover:text-accent">
                        {vehicle.brandName}
                      </p>
                      <p className="text-sm font-semibold group-hover:text-accent">
                        {vehicle.modelName}
                      </p>
                    </Link>
                  </div>
                </th>
              ))}
              {/* Add more slot */}
              {comparison.length < 4 && (
                <th className="px-4 py-4">
                  <Link
                    href="/vehicles"
                    className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border/60 px-6 py-8 transition-colors hover:border-accent hover:bg-accent/5"
                  >
                    <div className="flex size-12 items-center justify-center rounded-full bg-muted">
                      <Search className="size-5 text-muted-foreground" />
                    </div>
                    <span className="mt-2 text-sm text-muted-foreground">
                      차량 추가
                    </span>
                  </Link>
                </th>
              )}
            </tr>
          </thead>

          {/* Comparison rows */}
          <tbody>
            {COMPARE_FIELDS.map((field, idx) => (
              <tr
                key={field.key}
                className={idx % 2 === 0 ? 'bg-muted/20' : ''}
              >
                <td className="px-4 py-3 text-sm font-medium text-muted-foreground">
                  {field.label}
                </td>
                {comparison.map((vehicle) => {
                  const value = vehicle[field.key as keyof typeof vehicle]
                  const isPrice =
                    field.key === 'monthlyRental' || field.key === 'monthlyLease'

                  return (
                    <td key={vehicle.id} className="px-4 py-3 text-center">
                      <span
                        className={`text-sm ${
                          isPrice && value
                            ? 'font-bold text-accent'
                            : 'font-medium'
                        }`}
                      >
                        {field.format(value as never)}
                      </span>
                    </td>
                  )
                })}
                {comparison.length < 4 && <td />}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* CTA */}
      <div className="mt-8 text-center">
        <Link
          href="/inquiry"
          className="inline-flex items-center gap-2 rounded-xl bg-accent px-8 py-3 font-semibold text-white shadow-lg shadow-accent/20 transition-all hover:bg-accent/90 hover:shadow-xl"
        >
          비교 차량 상담 신청
        </Link>
      </div>
    </div>
  )
}
