import { prisma } from '@/lib/db/prisma'
import { calculateRental, calculateLease } from '@/lib/finance/calculate'
import type { UserProfile } from '@/lib/auth/helpers'
import type { ContractType } from '@prisma/client'

export type CreateContractInput = {
  vehicleId: string
  contractType: 'RENTAL' | 'LEASE'
  periodMonths: number
  deposit: number
}

export type CreateContractResult =
  | { contractId: string; contractType: ContractType }
  | { error: string }

const DEFAULT_RESIDUAL_RATE = 0.4

const vehicleInclude = {
  trim: {
    include: {
      generation: {
        include: {
          carModel: {
            include: {
              brand: true,
            },
          },
        },
      },
    },
  },
  images: true,
  dealer: {
    select: { id: true, name: true, email: true, phone: true },
  },
} as const

/**
 * Create a contract application with double-booking prevention.
 * Atomically reserves the vehicle and creates a DRAFT contract.
 */
export async function createContractMutation(
  input: CreateContractInput,
  user: UserProfile
): Promise<CreateContractResult> {
  if (user.role !== 'CUSTOMER') return { error: '고객만 계약 신청이 가능합니다.' }

  const { vehicleId, contractType, periodMonths, deposit } = input

  try {
    const result = await prisma.$transaction(async (tx) => {
      // 1. Fetch vehicle and verify availability
      const vehicle = await tx.vehicle.findUnique({
        where: { id: vehicleId },
        include: vehicleInclude,
      })

      if (!vehicle) {
        throw new Error('차량을 찾을 수 없습니다.')
      }

      if (vehicle.status !== 'AVAILABLE') {
        throw new Error('이 차량은 현재 계약 신청이 불가합니다.')
      }

      // 2. Check for existing active contracts (double-booking prevention)
      const [existingRentals, existingLeases] = await Promise.all([
        tx.rentalContract.count({
          where: {
            vehicleId,
            status: { notIn: ['CANCELED', 'COMPLETED'] },
          },
        }),
        tx.leaseContract.count({
          where: {
            vehicleId,
            status: { notIn: ['CANCELED', 'COMPLETED'] },
          },
        }),
      ])

      if (existingRentals > 0 || existingLeases > 0) {
        throw new Error('이 차량에 대한 진행 중인 계약이 있습니다.')
      }

      // 3. Reserve vehicle
      await tx.vehicle.update({
        where: { id: vehicleId },
        data: { status: 'RESERVED' },
      })

      // 4. Calculate payment
      const dealerId = vehicle.dealerId

      if (contractType === 'RENTAL') {
        const calc = calculateRental(vehicle.price, periodMonths, deposit)
        const contract = await tx.rentalContract.create({
          data: {
            vehicleId,
            customerId: user.id,
            dealerId,
            status: 'DRAFT',
            monthlyPayment: calc.monthlyPayment,
            deposit: calc.deposit,
            totalAmount: calc.totalCost,
          },
        })
        return { contractId: contract.id, contractType: 'RENTAL' as const }
      } else {
        // LEASE: fetch residual rate
        const residualRecord = await tx.residualValueRate.findUnique({
          where: {
            brandId_carModelId_year: {
              brandId: vehicle.trim.generation.carModel.brand.id,
              carModelId: vehicle.trim.generation.carModel.id,
              year: vehicle.year,
            },
          },
        })
        const residualRate = residualRecord
          ? residualRecord.rate.toNumber()
          : DEFAULT_RESIDUAL_RATE

        const calc = calculateLease(vehicle.price, periodMonths, deposit, residualRate)
        const contract = await tx.leaseContract.create({
          data: {
            vehicleId,
            customerId: user.id,
            dealerId,
            status: 'DRAFT',
            monthlyPayment: calc.monthlyPayment,
            deposit: calc.deposit,
            residualValue: calc.residualValue,
            residualRate: residualRate,
            totalAmount: calc.totalCost,
          },
        })
        return { contractId: contract.id, contractType: 'LEASE' as const }
      }
    })

    return result
  } catch (error) {
    if (error instanceof Error) {
      return { error: error.message }
    }
    return { error: '계약 생성 중 오류가 발생했습니다.' }
  }
}
