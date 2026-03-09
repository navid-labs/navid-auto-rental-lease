import { NextRequest } from 'next/server'
import { renderToBuffer } from '@react-pdf/renderer'
import { prisma } from '@/lib/db/prisma'
import { getCurrentUser } from '@/lib/auth/helpers'
import { ContractPDF } from '@/features/contracts/components/contract-pdf'
import type { ContractPDFData } from '@/features/contracts/types'
import { createElement } from 'react'

const pdfContractInclude = {
  vehicle: {
    include: {
      trim: {
        include: {
          generation: {
            include: { carModel: { include: { brand: true } } },
          },
        },
      },
      images: { orderBy: { order: 'asc' as const }, take: 1 },
    },
  },
  customer: true,
  dealer: true,
} as const

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { searchParams } = request.nextUrl
    const type = (searchParams.get('type') ?? 'RENTAL').toUpperCase()
    const isLease = type === 'LEASE'

    // Auth check
    const user = await getCurrentUser()
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Build PDF data from the correct contract type
    let pdfData: ContractPDFData

    if (isLease) {
      const contract = await prisma.leaseContract.findUnique({
        where: { id },
        include: pdfContractInclude,
      })
      if (!contract) {
        return Response.json({ error: 'Contract not found' }, { status: 404 })
      }
      // Ownership check
      if (user.role !== 'ADMIN' && contract.customerId !== user.id) {
        return Response.json({ error: 'Forbidden' }, { status: 403 })
      }
      const { vehicle, customer, dealer } = contract
      const { trim } = vehicle
      const { generation } = trim
      const { carModel } = generation
      const { brand } = carModel

      pdfData = {
        contractType: 'LEASE',
        contractId: contract.id,
        status: contract.status,
        vehicleName: `${brand.name} ${carModel.name} ${trim.name}`,
        vehicleYear: vehicle.year,
        vehiclePlateNumber: vehicle.licensePlate,
        vehicleMileage: vehicle.mileage,
        vehicleColor: vehicle.color,
        customerName: customer.name ?? customer.email,
        customerPhone: customer.phone,
        customerEmail: customer.email,
        dealerName: dealer.name,
        startDate: contract.startDate,
        endDate: contract.endDate,
        monthlyPayment: contract.monthlyPayment,
        deposit: contract.deposit,
        totalAmount: contract.totalAmount,
        residualValue: contract.residualValue,
        residualRate: contract.residualRate
          ? Number(contract.residualRate)
          : null,
        createdAt: contract.createdAt,
      }
    } else {
      const contract = await prisma.rentalContract.findUnique({
        where: { id },
        include: pdfContractInclude,
      })
      if (!contract) {
        return Response.json({ error: 'Contract not found' }, { status: 404 })
      }
      // Ownership check
      if (user.role !== 'ADMIN' && contract.customerId !== user.id) {
        return Response.json({ error: 'Forbidden' }, { status: 403 })
      }
      const { vehicle, customer, dealer } = contract
      const { trim } = vehicle
      const { generation } = trim
      const { carModel } = generation
      const { brand } = carModel

      pdfData = {
        contractType: 'RENTAL',
        contractId: contract.id,
        status: contract.status,
        vehicleName: `${brand.name} ${carModel.name} ${trim.name}`,
        vehicleYear: vehicle.year,
        vehiclePlateNumber: vehicle.licensePlate,
        vehicleMileage: vehicle.mileage,
        vehicleColor: vehicle.color,
        customerName: customer.name ?? customer.email,
        customerPhone: customer.phone,
        customerEmail: customer.email,
        dealerName: dealer.name,
        startDate: contract.startDate,
        endDate: contract.endDate,
        monthlyPayment: contract.monthlyPayment,
        deposit: contract.deposit,
        totalAmount: contract.totalAmount,
        createdAt: contract.createdAt,
      }
    }

    // Render PDF to buffer
    const buffer = await renderToBuffer(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      createElement(ContractPDF, { data: pdfData }) as any
    )

    return new Response(new Uint8Array(buffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="navid-contract-${id.slice(0, 8)}.pdf"`,
      },
    })
  } catch (error) {
    console.error('PDF generation error:', error)
    return Response.json(
      { error: 'Failed to generate PDF' },
      { status: 500 }
    )
  }
}
