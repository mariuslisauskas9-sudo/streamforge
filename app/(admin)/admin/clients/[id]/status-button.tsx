'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Pencil } from 'lucide-react'
import toast from 'react-hot-toast'

const STATUS_OPTIONS = [
  { value: 'active',   label: 'Active',   color: 'var(--color-green)' },
  { value: 'inactive', label: 'Inactive', color: 'var(--color-text-muted)' },
  { value: 'blocked',  label: 'Blocked',  color: 'var(--color-coral)' },
] as const

type Status = typeof STATUS_OPTIONS[number]['value']

export function StatusButton({
  profileId,
  currentStatus,
}: {
  profileId: string
  currentStatus: string
}) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSelect(status: Status) {
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase
      .from('profiles')
      .update({ status })
      .eq('id', profileId)

    setLoading(false)
    if (error) {
      toast.error('Failed to update status')
    } else {
      toast.success('Status updated')
      setOpen(false)
      router.refresh()
    }
  }

  return (
    <>
      <Button variant="secondary" size="sm" onClick={() => setOpen(true)}>
        <Pencil className="w-3 h-3" />
        Edit status
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change status</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-2 pt-1">
            {STATUS_OPTIONS.map((s) => {
              const isCurrent = s.value === currentStatus
              return (
                <button
                  key={s.value}
                  disabled={loading || isCurrent}
                  onClick={() => handleSelect(s.value)}
                  className="flex items-center gap-3 w-full px-4 py-3 rounded-xl border transition-all text-left disabled:pointer-events-none"
                  style={{
                    borderColor: isCurrent ? `${s.color}40` : 'var(--color-border)',
                    background: isCurrent ? `${s.color}10` : 'transparent',
                    opacity: loading && !isCurrent ? 0.5 : 1,
                  }}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: s.color }}
                  />
                  <span
                    className="text-sm font-medium"
                    style={{ color: isCurrent ? s.color : 'var(--color-text-primary)' }}
                  >
                    {s.label}
                  </span>
                  {isCurrent && (
                    <span className="ml-auto text-xs text-[var(--color-text-muted)]">
                      Current
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
