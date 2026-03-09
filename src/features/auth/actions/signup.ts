'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { signupSchema } from '../schemas/auth'
import { getAuthErrorMessage } from '../utils/error-messages'

export async function signup(formData: FormData) {
  const parsed = signupSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
    confirmPassword: formData.get('confirmPassword'),
    name: formData.get('name'),
    phone: formData.get('phone') || undefined,
  })

  if (!parsed.success) {
    return { error: '입력 정보를 확인해주세요.' }
  }

  const supabase = await createClient()

  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: { data: { name: parsed.data.name } },
  })

  if (error) {
    return { error: getAuthErrorMessage(error.message) }
  }

  redirect('/login')
}
