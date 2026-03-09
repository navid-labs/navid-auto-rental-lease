import { prisma } from '@/lib/db/prisma'
import { getCurrentUser } from '@/lib/auth/helpers'
import { DealerLayoutClient } from './layout-client'

export default async function DealerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getCurrentUser()

  let latestApprovalChange: string | null = null

  if (user && user.role === 'DEALER') {
    const latest = await prisma.vehicleApprovalLog.findFirst({
      where: { vehicle: { dealerId: user.id } },
      orderBy: { createdAt: 'desc' },
      select: { createdAt: true },
    })
    latestApprovalChange = latest?.createdAt?.toISOString() ?? null
  }

  return (
    <DealerLayoutClient latestApprovalChange={latestApprovalChange}>
      {children}
    </DealerLayoutClient>
  )
}
