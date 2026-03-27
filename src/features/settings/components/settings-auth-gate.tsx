'use client'

import { useState, useTransition, type ReactNode } from 'react'
import { postAdminSettingsVerifyPassword } from '@/lib/api/generated/settings/settings'

type Props = {
  children: ReactNode
}

export function SettingsAuthGate({ children }: Props) {
  // Lazy initializer reads sessionStorage once on mount — avoids useEffect setState pattern
  const [authenticated, setAuthenticated] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false
    return sessionStorage.getItem('settings_auth') === 'true'
  })
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    startTransition(async () => {
      try {
        await postAdminSettingsVerifyPassword({ password })
        sessionStorage.setItem('settings_auth', 'true')
        setAuthenticated(true)
      } catch {
        setError('비밀번호가 올바르지 않습니다.')
      }
    })
  }

  if (authenticated) {
    return <>{children}</>
  }

  return (
    <div className="flex min-h-[400px] items-center justify-center">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm space-y-4 rounded-lg border bg-card p-6 shadow-sm"
      >
        <div className="space-y-1 text-center">
          <h2 className="text-lg font-semibold">설정 접근</h2>
          <p className="text-sm text-muted-foreground">
            설정 페이지에 접근하려면 비밀번호를 입력하세요.
          </p>
        </div>

        <div className="space-y-2">
          <label htmlFor="settings-password" className="text-sm font-medium">
            비밀번호
          </label>
          <input
            id="settings-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:ring-offset-2"
            placeholder="비밀번호 입력"
            autoFocus
          />
        </div>

        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}

        <button
          type="submit"
          disabled={isPending || !password}
          className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {isPending ? '확인 중...' : '확인'}
        </button>
      </form>
    </div>
  )
}
