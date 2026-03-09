'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { loginSchema } from '../schemas/auth'
import { getAuthErrorMessage } from '../utils/error-messages'

export async function login(formData: FormData) {
  const parsed = loginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  })

  if (!parsed.success) {
    return { error: '입력 정보를 확인해주세요.' }
  }

  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithPassword(parsed.data)

  if (error) {
    return { error: getAuthErrorMessage(error.message) }
  }

  // Get user and profile for role-based redirect
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user!.id)
    .single()

  const redirectPath = profile?.role === 'ADMIN'
    ? '/admin/dashboard'
    : profile?.role === 'DEALER'
      ? '/dealer/dashboard'
      : '/mypage'

  redirect(redirectPath)
}
