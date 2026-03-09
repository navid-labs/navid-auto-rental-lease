import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth/helpers'
import { VehicleWizard } from '@/features/vehicles/components/vehicle-wizard'

export default async function AdminVehicleNewPage() {
  const user = await getCurrentUser()
  if (!user || user.role !== 'ADMIN') redirect('/login')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">차량 등록</h1>
        <p className="text-sm text-muted-foreground">새 차량을 등록합니다.</p>
      </div>

      <VehicleWizard mode="create" userRole="ADMIN" />
    </div>
  )
}
