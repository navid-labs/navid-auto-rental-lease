'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StepVehicleConfirm } from './step-vehicle-confirm'
import { StepTerms } from './step-terms'
import { StepEkyc } from './step-ekyc'
import { StepReview } from './step-review'
import {
  postContracts,
  postContractsIdEkyc,
} from '@/lib/api/generated/contracts/contracts'
import { ApiError } from '@/lib/api/fetcher'
import { calculateRental, calculateLease } from '@/lib/finance/calculate'
import { cn } from '@/lib/utils'
import type { VehicleWithDetails, ContractFormData } from '@/features/contracts/types'
import type { TermsData, EkycData } from '@/features/contracts/schemas/contract'
import type { ContractWizardStep } from '@/features/contracts/types'

type ContractType = 'RENTAL' | 'LEASE'

type ContractWizardProps = {
  vehicle: VehicleWithDetails
  residualRate: number
}

const STEPS = [
  { label: '차량확인', number: 1 },
  { label: '조건설정', number: 2 },
  { label: '본인인증', number: 3 },
  { label: '검토 서명', number: 4 },
]

export function ContractWizard({ vehicle, residualRate }: ContractWizardProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [currentStep, setCurrentStep] = useState<ContractWizardStep>(1)
  const [contractId, setContractId] = useState<string | null>(null)
  const [contractType, setContractType] = useState<ContractType>('RENTAL')
  const [formData, setFormData] = useState<Partial<ContractFormData>>({
    vehicleId: vehicle.id,
  })
  const [error, setError] = useState('')

  // Step 2: Terms submission -> creates contract
  const handleTermsSubmit = (data: TermsData) => {
    startTransition(async () => {
      setError('')
      try {
        const result = await postContracts({
          vehicleId: vehicle.id,
          contractType: data.contractType,
          periodMonths: data.periodMonths,
          deposit: data.deposit,
        })

        // customFetch throws ApiError on non-2xx; if we reach here it's success
        const body = (result as { contractId?: string; contractType?: ContractType })
        setContractId(body.contractId ?? null)
        setContractType(body.contractType ?? data.contractType)
        setFormData((prev) => ({
          ...prev,
          contractType: data.contractType,
          periodMonths: data.periodMonths,
          deposit: data.deposit,
        }))
        setCurrentStep(3)
      } catch (err) {
        setError(err instanceof ApiError ? err.message : '계약 생성에 실패했습니다.')
      }
    })
  }

  // Step 3: eKYC submission
  const handleEkycSubmit = (data: EkycData) => {
    if (!contractId) return
    startTransition(async () => {
      setError('')
      try {
        await postContractsIdEkyc(contractId, {
          contractType,
          ekycData: {
            name: data.name,
            phone: data.phone,
            carrier: data.carrier as 'SKT' | 'KT' | 'LGU',
            birthDate: data.birthDate,
            gender: data.gender as 'M' | 'F',
            verificationCode: data.verificationCode,
          },
        })
        setFormData((prev) => ({
          ...prev,
          ekyc: data,
        }))
        setCurrentStep(4)
      } catch (err) {
        setError(err instanceof ApiError ? err.message : '본인인증에 실패했습니다.')
      }
    })
  }

  // Step 4: Final submission
  const handleFinalSubmit = () => {
    if (!contractId) return
    startTransition(async () => {
      setError('')
      // Contract is already PENDING_APPROVAL after eKYC
      // Redirect to a confirmation/status page
      router.push(`/vehicles/${vehicle.id}?contractSubmitted=true`)
      router.refresh()
    })
  }

  // Calculate for review step
  const currentCalc =
    formData.contractType === 'LEASE'
      ? calculateLease(
          vehicle.price,
          formData.periodMonths ?? 36,
          formData.deposit ?? 0,
          residualRate
        )
      : calculateRental(
          vehicle.price,
          formData.periodMonths ?? 36,
          formData.deposit ?? 0
        )

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Progress bar */}
      <div className="flex items-center gap-2">
        {STEPS.map((step) => (
          <div key={step.number} className="flex flex-1 flex-col items-center gap-1">
            <div
              className={cn(
                'h-2 w-full rounded-full transition-colors',
                currentStep >= step.number ? 'bg-accent' : 'bg-muted'
              )}
            />
            <span
              className={cn(
                'text-xs',
                currentStep >= step.number
                  ? 'font-medium text-foreground'
                  : 'text-muted-foreground'
              )}
            >
              {step.label}
            </span>
          </div>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>계약 신청</CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}

          {currentStep === 1 && (
            <StepVehicleConfirm
              vehicle={vehicle}
              onNext={() => setCurrentStep(2)}
            />
          )}

          {currentStep === 2 && (
            <StepTerms
              vehiclePrice={vehicle.price}
              residualRate={residualRate}
              onSubmit={handleTermsSubmit}
              onBack={() => setCurrentStep(1)}
              isSubmitting={isPending}
            />
          )}

          {currentStep === 3 && (
            <StepEkyc
              onSubmit={handleEkycSubmit}
              onBack={() => setCurrentStep(2)}
              isSubmitting={isPending}
            />
          )}

          {currentStep === 4 && formData.ekyc && (
            <StepReview
              vehicle={vehicle}
              formData={formData as ContractFormData}
              calculation={currentCalc}
              onSubmit={handleFinalSubmit}
              onBack={() => setCurrentStep(3)}
              isSubmitting={isPending}
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
