'use client'

import { useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { ContractStatus } from '@prisma/client'
import type { RealtimeChannel } from '@supabase/supabase-js'

/**
 * Subscribe to real-time contract status updates via Supabase Realtime.
 *
 * Requires Supabase publication setup:
 * ALTER PUBLICATION supabase_realtime ADD TABLE rental_contracts, lease_contracts;
 */
export function useContractRealtime(
  contractId: string,
  contractType: 'RENTAL' | 'LEASE',
  onUpdate: (newStatus: ContractStatus) => void
) {
  const onUpdateRef = useRef(onUpdate)
  onUpdateRef.current = onUpdate

  useEffect(() => {
    const supabase = createClient()
    const table = contractType === 'RENTAL' ? 'rental_contracts' : 'lease_contracts'

    const channel: RealtimeChannel = supabase
      .channel(`contract-${contractId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table,
          filter: `id=eq.${contractId}`,
        },
        (payload) => {
          const newStatus = (payload.new as { status: ContractStatus }).status
          if (newStatus) {
            onUpdateRef.current(newStatus)
          }
        }
      )
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR') {
          console.warn(`[useContractRealtime] Channel error for contract ${contractId}`)
        }
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [contractId, contractType])
}
