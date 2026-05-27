'use client'

import { useState, useMemo } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import { eventTypeColors, eventTypeLabels, formatDateTime } from '@/lib/utils'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'

interface CalEvent {
  id: string
  title: string
  type: string
  scheduled_at: string
  duration_minutes: number | null
  notes: string | null
  profile_id: string
  profiles: { id: string; full_name: string | null; username: string | null } | { id: string; full_name: string | null; username: string | null }[] | null
}

interface Client {
  id: string
  full_name: string | null
  username: string | null
  platform_links: { platform: string }[]
}

interface Props {
  events: CalEvent[]
  clients: Client[]
  initialClientId?: string
}

const FILTER_TYPES = ['stream', 'video'] as const

function getProfile(profiles: CalEvent['profiles']) {
  if (!profiles) return null
  return Array.isArray(profiles) ? profiles[0] : profiles
}

export function AdminCalendarView({ events, clients, initialClientId }: Props) {
  const [selectedClientId, setSelectedClientId] = useState<string>(initialClientId ?? 'all')
  const [selectedType, setSelectedType] = useState<string>('all')
  const [selectedEvent, setSelectedEvent] = useState<CalEvent | null>(null)

  const filteredEvents = useMemo(() => {
    return events.filter((e) => {
      if (selectedClientId !== 'all' && e.profile_id !== selectedClientId) return false
      if (selectedType !== 'all' && e.type !== selectedType) return false
      return true
    })
  }, [events, selectedClientId, selectedType])

  const calendarEvents = filteredEvents.map((e) => {
    const profile = getProfile(e.profiles)
    const clientName = profile?.full_name ?? profile?.username ?? 'Unknown'
    return {
      id: e.id,
      title: `${clientName} · ${e.title}`,
      start: e.scheduled_at,
      end: e.duration_minutes
        ? new Date(new Date(e.scheduled_at).getTime() + e.duration_minutes * 60000).toISOString()
        : undefined,
      backgroundColor: eventTypeColors[e.type] ?? '#9898b0',
      borderColor: eventTypeColors[e.type] ?? '#9898b0',
      extendedProps: { event: e },
    }
  })

  return (
    <div className="flex gap-4 flex-1 min-h-0">
      {/* Filters */}
      <div className="w-52 shrink-0 flex flex-col gap-4">
        <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--color-text-muted)] mb-3">
            Client
          </p>
          <div className="flex flex-col gap-1">
            <FilterBtn active={selectedClientId === 'all'} onClick={() => setSelectedClientId('all')}>
              All clients
            </FilterBtn>
            {clients.map((c) => (
              <FilterBtn
                key={c.id}
                active={selectedClientId === c.id}
                onClick={() => setSelectedClientId(c.id)}
              >
                {c.full_name ?? c.username ?? 'Unknown'}
              </FilterBtn>
            ))}
          </div>
        </div>

        <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--color-text-muted)] mb-3">
            Type
          </p>
          <div className="flex flex-col gap-1">
            <FilterBtn active={selectedType === 'all'} onClick={() => setSelectedType('all')}>
              All types
            </FilterBtn>
            {FILTER_TYPES.map((t) => (
              <FilterBtn
                key={t}
                active={selectedType === t}
                onClick={() => setSelectedType(t)}
              >
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: eventTypeColors[t] }}
                />
                {eventTypeLabels[t]}
              </FilterBtn>
            ))}
          </div>
        </div>
      </div>

      {/* Calendar */}
      <div className="flex-1 bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-4 min-h-0 overflow-hidden">
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay',
          }}
          events={calendarEvents}
          eventClick={(info) => {
            setSelectedEvent(info.event.extendedProps.event as CalEvent)
          }}
          height="100%"
        />
      </div>

      {/* Event detail dialog */}
      <Dialog open={!!selectedEvent} onOpenChange={() => setSelectedEvent(null)}>
        <DialogContent>
          {selectedEvent && (() => {
            const profile = getProfile(selectedEvent.profiles)
            const clientName = profile?.full_name ?? profile?.username ?? '—'
            const durationHours = selectedEvent.duration_minutes
              ? (selectedEvent.duration_minutes / 60)
              : null
            return (
              <>
                <DialogHeader>
                  <DialogTitle>{selectedEvent.title}</DialogTitle>
                </DialogHeader>
                <div className="flex flex-col gap-3 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-[var(--color-text-muted)] shrink-0">Type:</span>
                    <Badge
                      style={{
                        color: eventTypeColors[selectedEvent.type],
                        background: `${eventTypeColors[selectedEvent.type]}20`,
                      }}
                    >
                      {eventTypeLabels[selectedEvent.type] ?? selectedEvent.type}
                    </Badge>
                  </div>
                  <div>
                    <span className="text-[var(--color-text-muted)]">Client: </span>
                    <span className="text-[var(--color-text-primary)] font-medium">{clientName}</span>
                  </div>
                  <div>
                    <span className="text-[var(--color-text-muted)]">Date: </span>
                    <span className="text-[var(--color-text-primary)]">
                      {formatDateTime(selectedEvent.scheduled_at)}
                    </span>
                  </div>
                  {durationHours !== null && (
                    <div>
                      <span className="text-[var(--color-text-muted)]">Duration: </span>
                      <span className="text-[var(--color-text-primary)]">
                        {durationHours % 1 === 0 ? durationHours : durationHours.toFixed(1)} hr
                        {durationHours !== 1 ? 's' : ''}
                      </span>
                    </div>
                  )}
                  {selectedEvent.notes && (
                    <div>
                      <p className="text-[var(--color-text-muted)] mb-1">Notes:</p>
                      <p className="text-[var(--color-text-primary)] text-xs bg-[var(--color-bg-secondary)] rounded-lg p-3 leading-relaxed">
                        {selectedEvent.notes}
                      </p>
                    </div>
                  )}
                </div>
              </>
            )
          })()}
        </DialogContent>
      </Dialog>
    </div>
  )
}

function FilterBtn({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 w-full text-left px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
        active
          ? 'bg-[var(--color-accent)] text-white'
          : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text-primary)]'
      }`}
    >
      {children}
    </button>
  )
}
