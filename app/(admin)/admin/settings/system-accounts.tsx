'use client'

import { useState } from 'react'
import { createSystemAccount } from '@/app/actions/users'
import { Button } from '@/components/ui/button'
import { CheckCircle2, Settings2, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

export function SystemAccounts({ initialExists }: { initialExists: boolean }) {
  const [exists, setExists] = useState(initialExists)
  const [loading, setLoading] = useState(false)

  async function handleCreate() {
    setLoading(true)
    const result = await createSystemAccount()
    setLoading(false)

    if ('error' in result) {
      toast.error(result.error)
    } else if (!result.created) {
      toast.success('Account already exists')
      setExists(true)
    } else {
      toast.success('X Posts Schedule account created')
      setExists(true)
    }
  }

  return (
    <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-2xl overflow-hidden mt-6">
      <div className="flex items-center gap-2.5 px-6 py-4 border-b border-[var(--color-border)]">
        <Settings2 className="w-4 h-4 text-[var(--color-accent)]" />
        <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">System accounts</h2>
      </div>

      <div className="px-6 py-4 flex items-center gap-4">
        <div className="w-9 h-9 rounded-full bg-black border border-[rgba(29,155,240,0.35)] flex items-center justify-center shrink-0">
          <span className="text-xs font-black text-[#1d9bf0]">X</span>
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-[var(--color-text-primary)]">X Posts Schedule</p>
          <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
            {exists
              ? 'Shared creator account for the X posting calendar'
              : 'Shared creator account — not set up yet'}
          </p>
        </div>

        {exists ? (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--color-green)] shrink-0">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Active
          </span>
        ) : (
          <Button size="sm" onClick={handleCreate} disabled={loading} className="shrink-0">
            {loading
              ? <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />Creating…</>
              : 'Set up account'}
          </Button>
        )}
      </div>
    </div>
  )
}
