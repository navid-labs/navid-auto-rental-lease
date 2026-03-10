'use client'

import { useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function SettingsError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[Settings Error]', error)
  }, [error])

  return (
    <div className="flex items-center justify-center p-8">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-destructive">오류 발생</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            설정 페이지를 불러오는 중 오류가 발생했습니다.
          </p>
          <p className="text-xs text-muted-foreground/70">
            {error.message}
          </p>
          <Button onClick={reset} variant="outline">
            다시 시도
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
