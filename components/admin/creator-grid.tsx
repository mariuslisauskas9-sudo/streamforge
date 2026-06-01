'use client'

import { useState } from 'react'
import Link from 'next/link'
import { deleteCreator } from '@/app/actions/users'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import StatusBadge from '@/components/StatusBadge'
import PlatformBadge from '@/components/PlatformBadge'
import {
  formatFollowers, formatDateTime, getInitials,
  eventTypeColors, eventTypeLabels, platformLabels,
} from '@/lib/utils'
import { Users, CalendarDays, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import type { Platform } from '@/types'

type PlatformLink = { platform: string; url: string; followers_count: number | null }

type ClientRow = {
  id: string
  full_name: string | null
  username: string | null
  avatar_url: string | null
  status: string
  client_since: string | null
  platform_links: PlatformLink[]
}

type NextEvent = {
  id: string
  title: string
  type: string
  scheduled_at: string
}

export function CreatorGrid({
  initialClients,
  nextEvents,
  platformFilter,
}: {
  initialClients: ClientRow[]
  nextEvents: Record<string, NextEvent>
  platformFilter: string[] | null
}) {
  const [clients, setClients] = useState<ClientRow[]>(initialClients)
  const [confirmingId, setConfirmingId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const confirmingClient = clients.find((c) => c.id === confirmingId) ?? null

  async function handleDelete() {
    if (!confirmingId) return
    const id = confirmingId
    const target = clients.find((c) => c.id === id)
    const snapshot = clients

    setDeleting(true)
    setClients((prev) => prev.filter((c) => c.id !== id))
    setConfirmingId(null)

    const result = await deleteCreator(id)
    setDeleting(false)

    if ('error' in result) {
      setClients(snapshot)
      toast.error(result.error)
    } else {
      toast.success(`${target?.full_name ?? 'Creator'} deleted`)
    }
  }

  return (
    <>
      {clients.length ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {clients.map((c) => {
            const platforms = c.platform_links ?? []
            const topPlatform = platforms[0]
            const nextEvent = nextEvents[c.id]

            return (
              <div
                key={c.id}
                className="group bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-5 flex flex-col hover:border-[var(--color-accent)]/40 hover:shadow-[0_0_20px_rgba(124,106,255,0.08)] transition-all duration-200"
              >
                {/* Identity */}
                <div className="flex items-start gap-3 mb-4">
                  <Avatar className="w-11 h-11 shrink-0">
                    <AvatarImage src={c.avatar_url ?? undefined} />
                    <AvatarFallback>{getInitials(c.full_name)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-[var(--color-text-primary)] truncate group-hover:text-[var(--color-accent)] transition-colors">
                      {c.full_name ?? 'Unknown'}
                    </p>
                    <p className="text-xs text-[var(--color-text-muted)]">
                      @{c.username ?? '—'}
                    </p>
                  </div>
                  <StatusBadge status={c.status} />
                </div>

                {/* Platforms */}
                {platforms.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {platforms.slice(0, 3).map((p) => (
                      <PlatformBadge key={p.platform} platform={p.platform as Platform} />
                    ))}
                    {platforms.length > 3 && (
                      <span className="text-xs text-[var(--color-text-muted)] px-2 py-1">
                        +{platforms.length - 3}
                      </span>
                    )}
                  </div>
                )}

                {/* Follower count */}
                {topPlatform?.followers_count != null && topPlatform.followers_count > 0 && (
                  <p className="text-xs text-[var(--color-text-muted)] mb-3">
                    {formatFollowers(topPlatform.followers_count)} followers ·{' '}
                    {platformLabels[topPlatform.platform] ?? topPlatform.platform}
                  </p>
                )}

                <div className="border-t border-[var(--color-border)] mb-3" />

                {/* Next event */}
                <div className="mb-4 min-h-[2.5rem]">
                  {nextEvent ? (
                    <div className="flex items-start gap-2 min-w-0">
                      <div
                        className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0"
                        style={{ backgroundColor: eventTypeColors[nextEvent.type] ?? '#9898b0' }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-[var(--color-text-primary)] truncate">
                          {nextEvent.title}
                        </p>
                        <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                          {formatDateTime(nextEvent.scheduled_at)}
                        </p>
                      </div>
                      <span
                        className="text-xs px-1.5 py-0.5 rounded font-medium shrink-0"
                        style={{
                          color: eventTypeColors[nextEvent.type],
                          background: `${eventTypeColors[nextEvent.type]}20`,
                        }}
                      >
                        {eventTypeLabels[nextEvent.type] ?? nextEvent.type}
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-xs text-[var(--color-text-muted)]">
                      <CalendarDays className="w-3.5 h-3.5 shrink-0" />
                      No upcoming events
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2 mt-auto">
                  <Button asChild variant="secondary" size="sm" className="flex-1">
                    <Link href={`/admin/clients/${c.id}`}>View profile →</Link>
                  </Button>
                  <Button asChild variant="secondary" size="icon-sm" title="View in calendar">
                    <Link href={`/admin/calendar?client=${c.id}`}>
                      <CalendarDays className="w-3.5 h-3.5" />
                    </Link>
                  </Button>
                  <Button
                    variant="secondary"
                    size="icon-sm"
                    title="Delete creator"
                    onClick={() => setConfirmingId(c.id)}
                    className="hover:text-[#ff6b6b] hover:bg-[rgba(255,107,107,0.1)] hover:border-[rgba(255,107,107,0.2)]"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <div className="w-12 h-12 rounded-xl bg-[var(--color-bg-card)] border border-[var(--color-border)] flex items-center justify-center">
            <Users className="w-5 h-5 text-[var(--color-text-muted)]" />
          </div>
          <p className="text-sm font-medium text-[var(--color-text-primary)]">No creators</p>
          <p className="text-xs text-[var(--color-text-muted)]">
            {platformFilter
              ? 'No hired creators for this platform yet.'
              : "You don't have any hired creators yet."}
          </p>
        </div>
      )}

      <Dialog
        open={confirmingId !== null}
        onOpenChange={(open) => { if (!open) setConfirmingId(null) }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete creator?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-[var(--color-text-secondary)]">
            Are you sure you want to delete{' '}
            <span className="font-semibold text-[var(--color-text-primary)]">
              {confirmingClient?.full_name ?? confirmingClient?.username ?? 'this creator'}
            </span>
            ? This action cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="secondary" size="sm" onClick={() => setConfirmingId(null)}>
              Cancel
            </Button>
            <Button variant="danger" size="sm" onClick={handleDelete} disabled={deleting}>
              {deleting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
