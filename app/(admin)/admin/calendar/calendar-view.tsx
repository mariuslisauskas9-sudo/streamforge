'use client'

import { useState, useMemo, useRef, useCallback } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import { eventTypeColors, eventTypeLabels } from '@/lib/utils'
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
import { TimeSelect } from '@/components/ui/time-select'
import { createEvent } from '@/app/actions/events'
import toast from 'react-hot-toast'
import { Plus, ExternalLink, Loader2 } from 'lucide-react'
import type { DatesSetArg } from '@fullcalendar/core'

type CalProfile = { id: string; full_name: string | null; username: string | null; timezone: string | null }

interface CalEvent {
  id: string
  title: string
  type: string
  scheduled_at: string
  duration_minutes: number | null
  notes: string | null
  profile_id: string
  profiles: CalProfile | CalProfile[] | null
}

interface Client {
  id: string
  full_name: string | null
  username: string | null
  platform_links: { platform: string }[]
}

interface Props {
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
  xProfileLink: string
  xPostLink: string
  xAmount: string
}

const TYPE_FILTERS: { value: string; label: string; color: string }[] = [
  { value: 'stream',  label: 'Stream',        color: eventTypeColors.stream },
  { value: 'video',   label: 'YouTube Video', color: eventTypeColors.video },
  { value: 'x-post',  label: 'X Post',        color: '#00d97e' },
]

const EVENT_TYPES: { value: 'stream' | 'video'; label: string }[] = [
  { value: 'stream', label: 'Stream' },
  { value: 'video', label: 'YouTube Video' },
]

function getProfile(profiles: CalEvent['profiles']) {
  if (!profiles) return null
  return Array.isArray(profiles) ? profiles[0] : profiles
}

function formatInTz(isoStr: string, tz: string) {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    year: 'numeric', month: 'short', day: 'numeric',
    hour: 'numeric', minute: '2-digit', hour12: true,
  }).format(new Date(isoStr))
}

function formatTimeInTz(isoStr: string, tz?: string) {
  return new Intl.DateTimeFormat('en-US', {
    ...(tz ? { timeZone: tz } : {}),
    hour: 'numeric', minute: '2-digit', hour12: true,
  }).format(new Date(isoStr))
}

function todayStr() {
  return new Date().toISOString().split('T')[0]
}

interface ParsedNotes {
  xProfileUrl: string | null
  xPostUrl: string | null
  xAmount: string | null
  text: string | null
}

function parseNotes(notes: string | null): ParsedNotes {
  if (!notes) return { xProfileUrl: null, xPostUrl: null, xAmount: null, text: null }
  const lines = notes.split('\n')
  const meta: Record<string, string> = {}
  let i = 0
  for (; i < lines.length; i++) {
    const line = lines[i].trim()           // strip \r and any stray whitespace
    if (!line) { i++; break }             // blank line ends metadata block
    const m = line.match(/^(x_\w+):\s*(.+)$/)
    if (m) meta[m[1]] = m[2].trim()
    else break
  }
  const text = lines.slice(i).join('\n').trim() || null
  return {
    xProfileUrl: meta['x_profile'] ?? null,
    xPostUrl: meta['x_post'] ?? null,
    xAmount: meta['x_amount'] ?? null,
    text,
  }
}

export function AdminCalendarView({ clients, initialClientId }: Props) {
  const [allEvents, setAllEvents] = useState<CalEvent[]>([])
  const [eventsLoading, setEventsLoading] = useState(false)
  const currentRangeRef = useRef<{ start: string; end: string } | null>(null)
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
    xProfileLink: '',
    xPostLink: '',
    xAmount: '',
  })

  const fetchEvents = useCallback(async (start: string, end: string) => {
    setEventsLoading(true)
    try {
      const res = await fetch(`/api/events/admin?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`)
      if (res.ok) {
        const data = await res.json()
        setAllEvents(data)
      }
    } finally {
      setEventsLoading(false)
    }
  }, [])

  function handleDatesSet(info: DatesSetArg) {
    currentRangeRef.current = { start: info.startStr, end: info.endStr }
    fetchEvents(info.startStr, info.endStr)
  }

  function setField<K extends keyof EventForm>(key: K, value: EventForm[K]) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  function openAdd() {
    const openingForXPosts = clients.find((c) => c.id === selectedClientId)?.username === 'x-posts'
    setForm({
      profileId: openingForXPosts ? selectedClientId : (clients.find((c) => c.username !== 'x-posts')?.id ?? clients[0]?.id ?? ''),
      title: '',
      type: 'stream',
      date: todayStr(),
      time: openingForXPosts ? '12:00' : '20:00',
      duration: openingForXPosts ? '' : '2',
      notes: '',
      xProfileLink: '',
      xPostLink: '',
      xAmount: '',
    })
    setAddOpen(true)
  }

  async function handleAdd() {
    if (!form.profileId || !form.title.trim() || !form.date || !form.time) return
    setSaving(true)

    const isXPosts = clients.find((c) => c.id === form.profileId)?.username === 'x-posts'

    let type: string
    let notes: string
    if (isXPosts) {
      type = 'other'
      const parts: string[] = []
      if (form.xProfileLink.trim()) parts.push(`x_profile: ${form.xProfileLink.trim()}`)
      if (form.xPostLink.trim()) parts.push(`x_post: ${form.xPostLink.trim()}`)
      if (form.xAmount.trim()) parts.push(`x_amount: ${form.xAmount.trim()}`)
      if (form.notes.trim()) parts.push(form.notes.trim())
      notes = parts.join('\n')
    } else {
      type = form.type
      const xLink = form.xProfileLink.trim()
      notes = xLink
        ? `x_profile: ${xLink}${form.notes.trim() ? '\n' + form.notes.trim() : ''}`
        : form.notes
    }

    const scheduledAt = new Date(`${form.date}T${form.time}`).toISOString()
    const durationMinutes = form.duration ? Math.round(parseFloat(form.duration) * 60) : null

    const result = await createEvent({
      profileId: form.profileId,
      title: form.title.trim(),
      type,
      scheduledAt,
      durationMinutes,
      notes,
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

  const isXPostsModal = clients.some((c) => c.id === form.profileId && c.username === 'x-posts')
  const canSubmit = form.profileId && form.title.trim() && form.date && form.time

  const filteredEvents = useMemo(() => {
    return allEvents.filter((e) => {
      if (selectedClientId !== 'all' && e.profile_id !== selectedClientId) return false
      if (selectedType === 'x-post') {
        const profile = getProfile(e.profiles)
        return e.type === 'other' && profile?.username === 'x-posts'
      }
      if (selectedType !== 'all' && e.type !== selectedType) return false
      return true
    })
  }, [allEvents, selectedClientId, selectedType])

  const calendarEvents = useMemo(() => filteredEvents.map((e) => {
    const profile = getProfile(e.profiles)
    const clientName = profile?.full_name ?? profile?.username ?? 'Unknown'
    const isXPost = e.type === 'other' && profile?.username === 'x-posts'
    const color = isXPost ? '#00d97e' : (eventTypeColors[e.type] ?? '#9898b0')
    return {
      id: e.id,
      title: `${clientName} · ${e.title}`,
      start: e.scheduled_at,
      end: e.duration_minutes
        ? new Date(new Date(e.scheduled_at).getTime() + e.duration_minutes * 60000).toISOString()
        : undefined,
      backgroundColor: color,
      borderColor: color,
      extendedProps: { event: e },
    }
  }), [filteredEvents])

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
              {TYPE_FILTERS.map((f) => (
                <FilterBtn
                  key={f.value}
                  active={selectedType === f.value}
                  onClick={() => setSelectedType(f.value)}
                >
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: f.color }}
                  />
                  {f.label}
                </FilterBtn>
              ))}
            </div>
          </div>
        </div>

        {/* Calendar */}
        <div className="flex-1 bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-4 min-h-0 overflow-hidden relative">
          {eventsLoading && (
            <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5 text-xs text-[var(--color-text-muted)]">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Loading…
            </div>
          )}
          <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: 'dayGridMonth,timeGridWeek,timeGridDay',
            }}
            events={calendarEvents}
            datesSet={handleDatesSet}
            eventClick={(info) => {
              const ev = info.event.extendedProps.event as CalEvent
              setSelectedEvent(ev)
            }}
            height="100%"
          />
        </div>
      </div>

      {/* Add Event modal */}
      <Dialog open={addOpen} onOpenChange={(v) => { if (!v) setAddOpen(false) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isXPostsModal ? 'Add X post' : 'Add event'}</DialogTitle>
          </DialogHeader>

          {isXPostsModal ? (
            /* ── X Posts form ─────────────────────────────────────── */
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="xp-profile">X Profile Link</Label>
                <Input
                  id="xp-profile"
                  type="url"
                  placeholder="https://x.com/username"
                  value={form.xProfileLink}
                  onChange={(e) => setField('xProfileLink', e.target.value)}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="xp-post">Post Link</Label>
                <Input
                  id="xp-post"
                  type="url"
                  placeholder="https://x.com/username/status/..."
                  value={form.xPostLink}
                  onChange={(e) => setField('xPostLink', e.target.value)}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="xp-title">Title</Label>
                <Input
                  id="xp-title"
                  placeholder="Short description"
                  value={form.title}
                  onChange={(e) => setField('title', e.target.value)}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="xp-date">Date</Label>
                <Input
                  id="xp-date"
                  type="date"
                  value={form.date}
                  onChange={(e) => setField('date', e.target.value)}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label>Time</Label>
                <TimeSelect value={form.time} onChange={(v) => setField('time', v)} />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="xp-amount">Amount paid ($)</Label>
                <Input
                  id="xp-amount"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={form.xAmount}
                  onChange={(e) => setField('xAmount', e.target.value)}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="xp-notes">Notes</Label>
                <Textarea
                  id="xp-notes"
                  placeholder="Any additional notes..."
                  rows={2}
                  value={form.notes}
                  onChange={(e) => setField('notes', e.target.value)}
                />
              </div>
            </div>
          ) : (
            /* ── Normal event form ────────────────────────────────── */
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label>Creator</Label>
                <Select
                  value={form.profileId}
                  onValueChange={(v) => setForm((f) => ({ ...f, profileId: v, xProfileLink: '' }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select creator" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.filter((c) => c.username !== 'x-posts').map((c) => (
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

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="ev-date">Date</Label>
                  <Input
                    id="ev-date"
                    type="date"
                    value={form.date}
                    onChange={(e) => setField('date', e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
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
                <Label>Time</Label>
                <TimeSelect value={form.time} onChange={(v) => setField('time', v)} />
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
          )}

          <DialogFooter>
            <Button variant="secondary" size="sm" onClick={() => setAddOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleAdd} disabled={saving || !canSubmit}>
              {saving ? 'Adding…' : isXPostsModal ? 'Add post' : 'Add event'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Event detail dialog */}
      <Dialog open={!!selectedEvent} onOpenChange={() => setSelectedEvent(null)}>
        <DialogContent>
          {selectedEvent && (() => {
            const profile = getProfile(selectedEvent.profiles)
            const creatorTz = profile?.timezone || 'UTC'
            const durationHours = selectedEvent.duration_minutes
              ? (selectedEvent.duration_minutes / 60)
              : null
            const creatorTime = formatTimeInTz(selectedEvent.scheduled_at, creatorTz)
            const adminTime = formatTimeInTz(selectedEvent.scheduled_at)
            const showDualTime = creatorTz !== Intl.DateTimeFormat().resolvedOptions().timeZone
            console.log('[popup] selectedEvent.scheduled_at:', selectedEvent.scheduled_at)
            console.log('[popup] raw notes:', JSON.stringify(selectedEvent.notes))
            const parsed = parseNotes(selectedEvent.notes)
            console.log('parsed:', parsed)
            const { xProfileUrl, xPostUrl, xAmount, text } = parsed
            const isXPost = profile?.username === 'x-posts'

            return (
              <>
                <DialogHeader>
                  <DialogTitle>{selectedEvent.title}</DialogTitle>
                </DialogHeader>
                <div className="flex flex-col gap-3 text-sm">

                  {/* Type */}
                  <div className="flex items-center gap-2">
                    <span className="text-[var(--color-text-muted)] shrink-0">Type:</span>
                    {isXPost ? (
                      xPostUrl ? (
                        <a
                          href={xPostUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold border hover:opacity-80 transition-opacity"
                          style={{ color: '#1d9bf0', background: 'rgba(29,155,240,0.15)', borderColor: 'rgba(29,155,240,0.3)' }}
                        >
                          X Post
                          <ExternalLink className="w-3 h-3 shrink-0" />
                        </a>
                      ) : (
                        <Badge style={{ color: '#1d9bf0', background: 'rgba(29,155,240,0.15)' }}>
                          X Post
                        </Badge>
                      )
                    ) : (
                      <Badge
                        style={{
                          color: eventTypeColors[selectedEvent.type],
                          background: `${eventTypeColors[selectedEvent.type]}20`,
                        }}
                      >
                        {eventTypeLabels[selectedEvent.type] ?? selectedEvent.type}
                      </Badge>
                    )}
                  </div>

                  {/* Profile (x-posts) / Client (regular) */}
                  {isXPost ? (
                    xProfileUrl && (
                      <div className="flex items-center gap-2">
                        <span className="text-[var(--color-text-muted)] shrink-0">Profile:</span>
                        <a
                          href={xProfileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#1d9bf0] hover:underline text-xs flex items-center gap-1 min-w-0"
                        >
                          <span className="truncate">{xProfileUrl}</span>
                          <ExternalLink className="w-3 h-3 shrink-0" />
                        </a>
                      </div>
                    )
                  ) : (
                    <div>
                      <span className="text-[var(--color-text-muted)]">Client: </span>
                      <span className="text-[var(--color-text-primary)] font-medium">
                        {profile?.full_name ?? profile?.username ?? '—'}
                      </span>
                    </div>
                  )}

                  {/* Amount paid (x-posts only, right after client) */}
                  {isXPost && xAmount && (
                    <div>
                      <span className="text-[var(--color-text-muted)]">Amount paid: </span>
                      <span className="text-[var(--color-green)] font-semibold">
                        ${parseFloat(xAmount).toFixed(2)}
                      </span>
                    </div>
                  )}

                  {/* Date */}
                  <div>
                    <span className="text-[var(--color-text-muted)]">Date: </span>
                    <span className="text-[var(--color-text-primary)]">
                      {new Date(selectedEvent.scheduled_at).toLocaleString('en-US', {
                        month: 'long', day: 'numeric', year: 'numeric',
                        hour: 'numeric', minute: '2-digit', hour12: true,
                      })}
                    </span>
                  </div>

                  {/* Dual timezone (regular events only) */}
                  {!isXPost && showDualTime && (
                    <div className="flex flex-col gap-0.5">
                      <p className="text-[var(--color-text-muted)] text-xs mb-1">Time comparison</p>
                      <div className="flex items-center gap-2 text-xs bg-[var(--color-bg-secondary)] rounded-lg px-3 py-2.5">
                        <span className="text-[var(--color-text-primary)] font-medium">{creatorTime}</span>
                        <span className="text-[var(--color-text-muted)]">(creator)</span>
                        <span className="text-[var(--color-text-muted)] mx-0.5">·</span>
                        <span className="text-[var(--color-text-primary)] font-medium">{adminTime}</span>
                        <span className="text-[var(--color-text-muted)]">(your time)</span>
                      </div>
                    </div>
                  )}

                  {/* Duration (regular events only) */}
                  {!isXPost && durationHours !== null && (
                    <div>
                      <span className="text-[var(--color-text-muted)]">Duration: </span>
                      <span className="text-[var(--color-text-primary)]">
                        {durationHours % 1 === 0 ? durationHours : durationHours.toFixed(1)} hr
                        {durationHours !== 1 ? 's' : ''}
                      </span>
                    </div>
                  )}

                  {/* Free-text notes (regular events only) */}
                  {!isXPost && text && (
                    <div>
                      <p className="text-[var(--color-text-muted)] mb-1">Notes:</p>
                      <p className="text-[var(--color-text-primary)] text-xs bg-[var(--color-bg-secondary)] rounded-lg p-3 leading-relaxed">
                        {text}
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
