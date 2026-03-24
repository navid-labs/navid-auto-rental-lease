'use client'

import { useState, useTransition } from 'react'
import { putAdminSettingsDefaults } from '@/lib/api/generated/settings/settings'
import { ApiError } from '@/lib/api/fetcher'

type SettingRow = {
  id: string
  key: string
  value: string
  label: string
}

type Props = {
  defaultSettings: SettingRow[]
}

export function DefaultRateForm({ defaultSettings }: Props) {
  // Filter non-subsidy, non-password settings for display
  const rateSettings = defaultSettings.filter(
    (s) => !s.key.startsWith('subsidy_') && s.key !== 'settings_password'
  )

  const passwordSetting = defaultSettings.find((s) => s.key === 'settings_password')

  return (
    <div className="space-y-6">
      {/* Rate settings */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold">기본 설정값</h3>
        {rateSettings.length === 0 ? (
          <p className="text-sm text-muted-foreground">등록된 기본 설정이 없습니다.</p>
        ) : (
          <div className="space-y-3">
            {rateSettings.map((setting) => (
              <SettingRow key={setting.id} setting={setting} />
            ))}
          </div>
        )}
        <AddDefaultForm />
      </div>

      {/* Password change */}
      <div className="space-y-4 border-t pt-6">
        <h3 className="text-sm font-semibold">비밀번호 변경</h3>
        <PasswordChangeForm current={passwordSetting?.value} />
      </div>
    </div>
  )
}

function SettingRow({ setting }: { setting: SettingRow }) {
  const [value, setValue] = useState(setting.value)
  const [label, setLabel] = useState(setting.label)
  const [isPending, startTransition] = useTransition()
  const [message, setMessage] = useState('')

  function handleSave() {
    setMessage('')
    startTransition(async () => {
      try {
        await putAdminSettingsDefaults({ key: setting.key, value, label })
        setMessage('저장됨')
        setTimeout(() => setMessage(''), 2000)
      } catch (err) {
        setMessage(err instanceof ApiError ? err.message : '저장에 실패했습니다.')
      }
    })
  }

  return (
    <div className="flex items-end gap-3 rounded-md border bg-card p-3">
      <div className="space-y-1">
        <span className="text-xs text-muted-foreground">키</span>
        <p className="font-mono text-sm">{setting.key}</p>
      </div>
      <div className="flex-1 space-y-1">
        <label className="text-xs text-muted-foreground">설명</label>
        <input
          type="text"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          className="w-full rounded-md border bg-background px-3 py-1.5 text-sm"
        />
      </div>
      <div className="w-40 space-y-1">
        <label className="text-xs text-muted-foreground">값</label>
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="w-full rounded-md border bg-background px-3 py-1.5 text-sm"
        />
      </div>
      <button
        onClick={handleSave}
        disabled={isPending}
        className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
      >
        {isPending ? '...' : '저장'}
      </button>
      {message && <span className="text-xs text-green-600">{message}</span>}
    </div>
  )
}

function AddDefaultForm() {
  const [key, setKey] = useState('')
  const [value, setValue] = useState('')
  const [label, setLabel] = useState('')
  const [isPending, startTransition] = useTransition()
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  function handleAdd() {
    if (!key || !value || !label) return
    setMessage(null)
    startTransition(async () => {
      try {
        await putAdminSettingsDefaults({ key, value, label })
        setMessage({ type: 'success', text: '추가되었습니다.' })
        setKey('')
        setValue('')
        setLabel('')
      } catch (err) {
        setMessage({
          type: 'error',
          text: err instanceof ApiError ? err.message : '추가에 실패했습니다.',
        })
      }
    })
  }

  return (
    <div className="space-y-3 rounded-md border bg-card p-4">
      <h4 className="text-sm font-medium">새 기본 설정 추가</h4>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <input
          type="text"
          value={key}
          onChange={(e) => setKey(e.target.value)}
          placeholder="키 (예: default_annual_rate)"
          className="rounded-md border bg-background px-3 py-2 text-sm"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="값 (예: 0.084)"
          className="rounded-md border bg-background px-3 py-2 text-sm"
        />
        <input
          type="text"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="설명 (예: 기본 연이율)"
          className="rounded-md border bg-background px-3 py-2 text-sm"
        />
      </div>
      {message && (
        <p className={`text-sm ${message.type === 'success' ? 'text-green-600' : 'text-destructive'}`}>
          {message.text}
        </p>
      )}
      <button
        onClick={handleAdd}
        disabled={isPending || !key || !value || !label}
        className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
      >
        {isPending ? '추가 중...' : '추가'}
      </button>
    </div>
  )
}

function PasswordChangeForm({ current }: { current?: string }) {
  const [newPassword, setNewPassword] = useState('')
  const [isPending, startTransition] = useTransition()
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  function handleChange() {
    if (!newPassword) return
    setMessage(null)
    startTransition(async () => {
      try {
        await putAdminSettingsDefaults({
          key: 'settings_password',
          value: newPassword,
          label: '설정 페이지 비밀번호',
        })
        setMessage({ type: 'success', text: '비밀번호가 변경되었습니다.' })
        setNewPassword('')
      } catch (err) {
        setMessage({
          type: 'error',
          text: err instanceof ApiError ? err.message : '변경에 실패했습니다.',
        })
      }
    })
  }

  return (
    <div className="flex items-end gap-3">
      <div className="flex-1 space-y-1">
        <label className="text-sm font-medium">새 비밀번호</label>
        <input
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          placeholder={current ? '새 비밀번호 입력' : '비밀번호 설정 (기본: admin1234)'}
          className="w-full rounded-md border bg-background px-3 py-2 text-sm"
        />
      </div>
      <button
        onClick={handleChange}
        disabled={isPending || !newPassword}
        className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
      >
        {isPending ? '변경 중...' : '변경'}
      </button>
      {message && (
        <span
          className={`text-sm ${message.type === 'success' ? 'text-green-600' : 'text-destructive'}`}
        >
          {message.text}
        </span>
      )}
    </div>
  )
}
