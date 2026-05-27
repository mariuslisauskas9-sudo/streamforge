'use client'

import { useState } from 'react'
import { deleteAdmin } from '@/app/actions/users'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Trash2, ShieldAlert } from 'lucide-react'
import { formatDate, getInitials } from '@/lib/utils'
import toast from 'react-hot-toast'

type AdminRow = {
  id: string
  full_name: string | null
  username: string | null
  avatar_url: string | null
  email: string | null
  created_at: string
}

export function AdminList({
  initialAdmins,
  currentUserId,
}: {
  initialAdmins: AdminRow[]
  currentUserId: string
}) {
  const [admins, setAdmins] = useState<AdminRow[]>(initialAdmins)
  const [confirmingId, setConfirmingId] = useState<string | null>(null)

  const confirmingAdmin = admins.find((a) => a.id === confirmingId) ?? null

  async function handleDelete() {
    if (!confirmingId) return

    const id = confirmingId
    const target = admins.find((a) => a.id === id)
    const snapshot = admins

    setAdmins((prev) => prev.filter((a) => a.id !== id))
    setConfirmingId(null)

    const result = await deleteAdmin(id)

    if ('error' in result) {
      setAdmins(snapshot)
      toast.error(result.error)
    } else {
      toast.success(`${target?.full_name ?? target?.email ?? 'Admin'} removed`)
    }
  }

  return (
    <>
      {admins.length > 0 ? (
        <div className="divide-y divide-[var(--color-border)]">
          {admins.map((a) => {
            const isSelf = a.id === currentUserId
            return (
              <div key={a.id} className="flex items-center gap-4 px-6 py-4">
                <Avatar className="w-9 h-9 shrink-0">
                  <AvatarImage src={a.avatar_url ?? undefined} />
                  <AvatarFallback>{getInitials(a.full_name)}</AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">
                    {a.full_name ?? a.username ?? 'Unnamed admin'}
                    {isSelf && (
                      <span className="ml-2 text-xs text-[var(--color-text-muted)]">(you)</span>
                    )}
                  </p>
                  <p className="text-xs text-[var(--color-text-muted)] truncate">
                    {a.email ?? '—'}
                  </p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border text-[var(--color-accent)] bg-[rgba(124,106,255,0.1)] border-[rgba(124,106,255,0.2)]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-accent)]" />
                    Admin
                  </span>
                  <span className="text-xs text-[var(--color-text-muted)] hidden sm:block">
                    Since {formatDate(a.created_at)}
                  </span>
                  {isSelf ? (
                    <span title="Cannot delete your own account">
                      <button
                        disabled
                        className="p-1.5 rounded-md text-[var(--color-text-muted)] opacity-30 cursor-not-allowed"
                        aria-label="Cannot delete your own account"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  ) : (
                    <button
                      onClick={() => setConfirmingId(a.id)}
                      className="p-1.5 rounded-md text-[var(--color-text-muted)] hover:text-[#ff6b6b] hover:bg-[rgba(255,107,107,0.1)] transition-colors"
                      aria-label={`Remove ${a.full_name ?? a.email ?? 'admin'}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <p className="text-sm text-[var(--color-text-muted)]">No admins found</p>
        </div>
      )}

      <Dialog
        open={confirmingId !== null}
        onOpenChange={(open) => { if (!open) setConfirmingId(null) }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove admin access?</DialogTitle>
          </DialogHeader>

          <div className="flex items-start gap-3 p-3 rounded-xl bg-[rgba(255,107,107,0.08)] border border-[rgba(255,107,107,0.2)]">
            <ShieldAlert className="w-4 h-4 text-[#ff6b6b] shrink-0 mt-0.5" />
            <p className="text-sm text-[var(--color-text-secondary)]">
              This will permanently delete{' '}
              <span className="font-semibold text-[var(--color-text-primary)]">
                {confirmingAdmin?.full_name ?? confirmingAdmin?.email ?? 'this admin'}
              </span>
              's account. They will lose all access immediately and cannot be recovered.
            </p>
          </div>

          <DialogFooter>
            <Button variant="secondary" size="sm" onClick={() => setConfirmingId(null)}>
              Cancel
            </Button>
            <Button variant="danger" size="sm" onClick={handleDelete}>
              Delete account
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
