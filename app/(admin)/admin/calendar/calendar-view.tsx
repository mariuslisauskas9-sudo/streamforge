'use client'

import { useState, useMemo } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import { eventTypeColors, eventTypeLabels, formatDateTime } from '@/lib/utils'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { createEvent } from '@/app/actions/events'
import toast from 'react-hot-toast'
import { Plus } from 'lucide-react'

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

interface EventForm {
  profileId: string
  title: string
  type: 'stream' | 'video'
  date: string
  time: string
  duration: string
  notes: string
}

const FILTER_TYPES = ['stream', 'video'] as const

const EVENT_TYPES: { value: 'stream' | 'video'; label: string }[] = [
  { value: 'stream', label: 'Stream' },
  { value: 'video', label: 'YouTube Video' },
]

function getProfile(profiles: CalEvent['profiles']) {
  if (!profiles) return null
  return Array.isArray(profiles) ? profiles[0] : profiles
}

function todayStr() {
  return new Date().toISOString().split('T')[0]
}

export function AdminCalendarView({ events: initialEvents, clients, initialClientId }: Props) {
  const [allEvents, setAllEvents] = useState<CalEvent[]>(initialEvents)
  const [selectedClientId, setSelectedClientId] = useState<string>(initialClientId ?? 'all')
  const [selectedType, setSelectedType] = useState<string>('all')
  const [selectedEvent, setSelectedEvent] = useState<CalEvent | null>(null)

  // Add event modal
  const [addOpen, setAddOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<EventForm>({
    profileId: clients[0]?.id ?? '',
    title: '',
    type: 'stream',
    date: todayStr(),
    time: '20:00',
    duration: '2',
    notes: '',
  })

  function setField<K extends keyof EventForm>(key: K, value: EventForm[K]) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  function openAdd() {
    setForm({
      profileId: clients[0]?.id ?? '',
      title: '',
      type: 'stream',
      date: todayStr(),
      time: '20:00',
      duration: '2',
      notes: '',
    })
    setAddOpen(true)
  }

  async function handleAdd() {
    if (!form.profileId || !form.title.trim() || !form.date || !form.time) return
    setSaving(true)

    const scheduledAt = new Date(`${form.date}T${form.time}`).toISOString()
    const durationMinutes = form.duration ? Math.round(parseFloat(form.duration) * 60) : null

    const result = await createEvent({
      profileId: form.profileId,
      title: form.title.trim(),
      type: form.type,
      scheduledAt,
      durationMinutes,
      notes: form.notes,
    })

    if ('error' in result) {
      toast.error(result.error)
    } else {
      setAllEvents((prev) => [...prev, result.data as CalEvent])
      toast.success('Event added')
      setAddOpen(false)
    }
    setSaving(false)
  }

  const canSubmit = form.profileId && form.title.trim() && form.date && form.time

  const filteredEvents = useMemo(() => {
    return allEvents.filter((e) => {
      if (selectedClientId !== 'all' && e.profile_id !== selectedClientId) return false
      if (selectedType !== 'all' && e.type !== selectedType) return false
      return true
    })
  }, [allEvents, selectedClientId, selectedType])

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
    <div className="flex flex-col flex-1 min-h-0 gap-4">

      {/* Add Event button */}
      <div className="flex justify-end">
        <Button size="sm" onClick={openAdd}>
          <Plus className="w-4 h-4 mr-2" />
          Add Event
        </Button>
      </div>

      {/* Filters + Calendar */}
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
      </div>

      {/* Add Event modal */}
      <Dialog open={addOpen} onOpenChange={(v) => { if (!v) setAddOpen(false) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add event</DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label>Creator</Label>
              <Select value={form.profileId} onValueChange={(v) => setField('profileId', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select creator" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.full_name ?? c.username ?? 'Unknown'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="ev-title">Event title</Label>
                <Input
                  id="ev-title"
                  placeholder="e.g. Weekly stream"
                  value={form.title}
                  onChange={(e) => setField('title', e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Type</Label>
                <Select value={form.type} onValueChange={(v) => setField('type', v as EventForm['type'])}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EVENT_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="flex flex-col gap-1.5 col-span-1">
                <Label htmlFor="ev-date">Date</Label>
                <Input
                  id="ev-date"
                  type="date"
                  value={form.date}
                  onChange={(e) => setField('date', e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1.5 col-span-1">
                <Label htmlFor="ev-time">Time</Label>
                <Input
                  id="ev-time"
                  type="time"
                  value={form.time}
                  onChange={(e) => setField('time', e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1.5 col-span-1">
                <Label htmlFor="ev-duration">Duration (hrs)</Label>
                <Input
                  id="ev-duration"
                  type="number"
                  min="0.5"
                  step="0.5"
                  placeholder="2"
                  value={form.duration}
                  onChange={(e) => setField('duration', e.target.value)}
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="ev-notes">Notes</Label>
              <Textarea
                id="ev-notes"
                placeholder="Any additional notes..."
                rows={2}
                value={form.notes}
                onChange={(e) => setField('notes', e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="secondary" size="sm" onClick={() => setAddOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleAdd} disabled={saving || !canSubmit}>
              {saving ? 'Adding...' : 'Add event'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
