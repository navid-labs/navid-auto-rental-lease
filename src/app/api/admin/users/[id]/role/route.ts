import { requireAdmin } from '@/lib/api/auth'
import { apiSuccess, apiError } from '@/lib/api/response'
import { changeUserRoleMutation } from '@/features/admin/mutations/users'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin()
  if (auth.error) return auth.error

  try {
    const { id } = await params
    const { role } = await request.json()

    if (!role) {
      return apiError('role 필드가 필요합니다', 400)
    }

    const result = await changeUserRoleMutation(id, role, auth.user)

    if ('error' in result) {
      return apiError(result.error, 422)
    }

    return apiSuccess(result)
  } catch {
    return apiError('서버 오류가 발생했습니다', 500)
  }
}
