import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const images = await prisma.vehicleImage.findMany({
    where: { vehicleId: id },
    orderBy: { order: 'asc' },
    select: { id: true, url: true, order: true },
  })

  return NextResponse.json({ images })
}
