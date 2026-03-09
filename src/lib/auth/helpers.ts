import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'

export type UserProfile = {
  id: string
  email: string
  name: string | null
  phone: string | null
  role: 'CUSTOMER' | 'DEALER' | 'ADMIN'
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export const getCurrentUser = cache(async (): Promise<UserProfile | null> => {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return null
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return profile
})
