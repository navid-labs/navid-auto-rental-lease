export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth/helpers'
import { getBrands } from '@/features/vehicles/queries/cascade'
import { getPromoRatesQuery, getDefaultSettingsQuery } from '@/features/settings/queries/settings'
import { SettingsAuthGate } from '@/features/settings/components/settings-auth-gate'
import { PromoRateTable } from '@/features/settings/components/promo-rate-table'
import { PromoRateForm } from '@/features/settings/components/promo-rate-form'
import { SubsidyTable } from '@/features/settings/components/subsidy-table'
import { SubsidyForm } from '@/features/settings/components/subsidy-form'
import { DefaultRateForm } from '@/features/settings/components/default-rate-form'

type PageProps = {
  searchParams: Promise<{ tab?: string }>
}

export default async function AdminSettingsPage({ searchParams }: PageProps) {
  const user = await getCurrentUser()
  if (!user || user.role !== 'ADMIN') redirect('/login')

  const params = await searchParams
  const tab = params.tab ?? 'promo'

  const [promoRates, defaultSettings, brands] = await Promise.all([
    getPromoRatesQuery(),
    getDefaultSettingsQuery(),
    getBrands(),
  ])

  const subsidySettings = defaultSettings.filter((s) => s.key.startsWith('subsidy_'))

  const tabs = [
    { key: 'promo', label: '프로모션율' },
    { key: 'subsidy', label: '보조금' },
    { key: 'defaults', label: '기본 설정' },
  ] as const

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">설정 관리</h1>
        <p className="text-sm text-muted-foreground">
          프로모션율, 보조금, 기본 설정값을 관리합니다.
        </p>
      </div>

      <SettingsAuthGate>
        {/* Tabs */}
        <div className="flex gap-1 border-b">
          {tabs.map((t) => (
            <a
              key={t.key}
              href={`/admin/settings?tab=${t.key}`}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                tab === t.key
                  ? 'border-b-2 border-primary text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {t.label}
            </a>
          ))}
        </div>

        {/* Tab content */}
        <div className="mt-6 space-y-6">
          {tab === 'promo' && (
            <>
              <PromoRateTable promoRates={promoRates} />
              <PromoRateForm
                brands={brands.map((b) => ({ id: b.id, name: b.name, nameKo: b.nameKo }))}
              />
            </>
          )}

          {tab === 'subsidy' && (
            <>
              <SubsidyTable subsidies={subsidySettings} />
              <SubsidyForm />
            </>
          )}

          {tab === 'defaults' && (
            <DefaultRateForm defaultSettings={defaultSettings} />
          )}
        </div>
      </SettingsAuthGate>
    </div>
  )
}
