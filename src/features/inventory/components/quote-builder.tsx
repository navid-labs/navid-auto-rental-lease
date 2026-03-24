'use client'

import { useTransition, useState, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import type { Resolver } from 'react-hook-form'
import { LEASE_PERIOD_OPTIONS } from '@/lib/finance'
import { quoteParamsSchema } from '../schemas/quote-schema'
import type { QuoteParams, InventoryVehicleForQuote, QuoteGenerationResult } from '../types/quote'
import type { QuotePDFData } from './quote-pdf'
import { postAdminInventoryQuote } from '@/lib/api/generated/inventory/inventory'
import { QuoteResultCard } from './quote-result-card'

type Props = {
  selectedVehicles: InventoryVehicleForQuote[]
  onClose?: () => void
}

export function QuoteBuilder({ selectedVehicles, onClose }: Props) {
  const [isPending, startTransition] = useTransition()
  const [results, setResults] = useState<QuoteGenerationResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isDownloading, setIsDownloading] = useState(false)

  const downloadQuotePDF = useCallback(async (quoteResult: QuoteGenerationResult) => {
    setIsDownloading(true)
    try {
      const pdfData: QuotePDFData = {
        params: {
          leasePeriodMonths: quoteResult.params.leasePeriodMonths,
          residualRate: quoteResult.params.residualRate,
          depositRate: quoteResult.params.depositRate,
          creditGroup: quoteResult.params.creditGroup,
        },
        vehicles: quoteResult.vehicles.map((vr) => ({
          vehicleName: vr.vehicle.vehicleName,
          vehiclePrice: vr.vehicle.vehiclePrice,
          brand: vr.vehicle.brand,
          year: vr.vehicle.year,
          exteriorColor: vr.vehicle.exteriorColor,
          options: vr.vehicle.options,
          effectivePrice: vr.effectivePrice,
          promotionRate: vr.vehicle.promotionRate,
          subsidyAmount: vr.vehicle.subsidyAmount,
          leaseMonthly: vr.leaseResult.monthlyPayment,
          leaseTotalPayment: vr.leaseResult.totalPayment,
          leaseDeposit: vr.leaseResult.depositAmount,
          leaseResidualValue: vr.leaseResult.residualValue,
          leaseAnnualRate: vr.leaseResult.annualRate,
          leaseAcquisitionTax: vr.leaseResult.acquisitionTax,
          rentalMonthly: vr.rentalEstimate.monthlyPayment,
          rentalTotalPayment: vr.rentalEstimate.totalPayment,
        })),
        generatedAt: quoteResult.generatedAt.toISOString(),
      }

      const res = await fetch('/api/admin/inventory/quote-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pdfData),
      })

      if (!res.ok) {
        throw new Error('PDF 생성에 실패했습니다')
      }

      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '')
      a.download = `navid-quote-${timestamp}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (e) {
      console.error('PDF download error:', e)
      alert(e instanceof Error ? e.message : 'PDF 다운로드 중 오류가 발생했습니다')
    } finally {
      setIsDownloading(false)
    }
  }, [])

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<QuoteParams>({
    resolver: zodResolver(quoteParamsSchema) as Resolver<QuoteParams>,
    defaultValues: {
      leasePeriodMonths: 36,
      residualMethod: 'VEHICLE_PRICE',
      residualRate: 0.4,
      depositRate: 0.3,
      advancePayment: 0,
      creditGroup: 1,
    },
  })

  const isEmpty = selectedVehicles.length === 0

  function onSubmit(data: QuoteParams) {
    setError(null)
    startTransition(async () => {
      try {
        const res = await postAdminInventoryQuote({ vehicles: selectedVehicles as never[], params: data })
        setResults((res.data as { data: QuoteGenerationResult }).data)
      } catch (e) {
        setError(e instanceof Error ? e.message : '견적 계산 중 오류가 발생했습니다')
      }
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">견적 생성</h2>
          <p className="text-sm text-gray-500">
            선택된 차량 {selectedVehicles.length}대
          </p>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-3 py-1.5 text-sm text-gray-500 hover:bg-gray-100"
          >
            닫기
          </button>
        )}
      </div>

      {isEmpty ? (
        <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 px-6 py-10 text-center">
          <p className="text-sm text-gray-500">차량을 선택해주세요</p>
        </div>
      ) : (
        <>
          {/* Parameters form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {/* 리스기간 */}
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700">
                  리스기간
                </label>
                <select
                  {...register('leasePeriodMonths', { valueAsNumber: true })}
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  {LEASE_PERIOD_OPTIONS.map((m) => (
                    <option key={m} value={m}>
                      {m}개월
                    </option>
                  ))}
                </select>
                {errors.leasePeriodMonths && (
                  <p className="mt-1 text-xs text-red-500">{errors.leasePeriodMonths.message}</p>
                )}
              </div>

              {/* 잔가방식 */}
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700">
                  잔가방식
                </label>
                <select
                  {...register('residualMethod')}
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="VEHICLE_PRICE">차량가 기준</option>
                  <option value="ACQUISITION_COST">취득원가 기준</option>
                </select>
              </div>

              {/* 잔존가율 */}
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700">
                  잔존가율 (%)
                </label>
                <input
                  type="number"
                  step="1"
                  min="0"
                  max="100"
                  {...register('residualRate', {
                    setValueAs: (v: string) => Number(v) / 100,
                  })}
                  defaultValue={40}
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                {errors.residualRate && (
                  <p className="mt-1 text-xs text-red-500">{errors.residualRate.message}</p>
                )}
              </div>

              {/* 보증금율 */}
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700">
                  보증금율 (%)
                </label>
                <input
                  type="number"
                  step="1"
                  min="0"
                  max="40"
                  {...register('depositRate', {
                    setValueAs: (v: string) => Number(v) / 100,
                  })}
                  defaultValue={30}
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                {errors.depositRate && (
                  <p className="mt-1 text-xs text-red-500">{errors.depositRate.message}</p>
                )}
              </div>

              {/* 선납금 */}
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700">
                  선납금 (원)
                </label>
                <input
                  type="number"
                  step="10000"
                  min="0"
                  {...register('advancePayment', { valueAsNumber: true })}
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                {errors.advancePayment && (
                  <p className="mt-1 text-xs text-red-500">{errors.advancePayment.message}</p>
                )}
              </div>

              {/* 신용등급 */}
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700">
                  신용등급
                </label>
                <select
                  {...register('creditGroup', { valueAsNumber: true })}
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value={1}>1등급 (우수)</option>
                  <option value={2}>2등급 (양호)</option>
                  <option value={3}>3등급 (보통)</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={isPending}
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {isPending ? '계산 중...' : '견적 계산'}
              </button>

              {results && (
                <button
                  type="button"
                  disabled={isDownloading}
                  data-testid="quote-pdf-download"
                  onClick={() => downloadQuotePDF(results)}
                  className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isDownloading ? 'PDF 생성 중...' : '견적서 PDF 다운로드'}
                </button>
              )}
            </div>
          </form>

          {/* Error */}
          {error && (
            <div className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Results */}
          {results && (
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-700">
                견적 결과 ({results.vehicles.length}대)
              </h3>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {results.vehicles.map((vr) => (
                  <QuoteResultCard key={vr.vehicle.id} result={vr} />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
