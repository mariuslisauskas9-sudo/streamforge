'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { formatDateTime, eventTypeColors, eventTypeLabels } from '@/lib/utils'
import { TimeSelect } from '@/components/ui/time-select'
import { Plus, Pencil, Trash2, CalendarDays } from 'lucide-react'
import toast from 'react-hot-toast'

type EventRow = {
  id: string
  profile_id: string
  title: string
  type: string
  scheduled_at: string
  duration_minutes: number | null
  notes: string | null
  created_at?: string
  updated_at?: string
}

type FormState = {
  title: string
  type: string
  scheduled_at: string
  duration_hours: string
  notes: string
}

const defaultForm: FormState = {
  title: '',
  type: 'stream',
  scheduled_at: '',
  duration_hours: '',
  notes: '',
}

const ADMIN_EVENT_TYPES = ['stream', 'video', 'collab', 'meeting', 'other'] as const

function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (m === 0) return `${h}h`
  if (h === 0) return `${m}min`
  return `${h}h ${m}min`
}

export function EventsSection({
  initialEvents,
  profileId,
}: {
  initialEvents: EventRow[]
  profileId: string
}) {
  const [events, setEvents] = useState<EventRow[]>(initialEvents)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(defaultForm)

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm((f) => ({ ...f, [k]: v }))

  function openAdd() {
    setEditingId(null)
    setForm(defaultForm)
    setModalOpen(true)
  }

  function openEdit(e: EventRow) {
    setEditingId(e.id)
    setForm({
      title: e.title,
      type: e.type,
      scheduled_at: e.scheduled_at.slice(0, 16),
      duration_hours: e.duration_minutes ? (e.duration_minutes / 60).toString() : '',
      notes: e.notes ?? '',
    })
    setModalOpen(true)
  }

  async function handleSave() {
    if (!form.title.trim() || !form.scheduled_at) return

    const rawHours = parseFloat(form.duration_hours)
    const durationMinutes =
      form.duration_hours && rawHours > 0
        ? Math.round(rawHours * 60)
        : null

    const payload = {
      title: form.title.trim(),
      type: form.type,
      scheduled_at: new Date(form.scheduled_at).toISOString(),
      duration_minutes: durationMinutes,
      notes: form.notes.trim() || null,
    }

    const supabase = createClient()

    if (editingId) {
      const snapshot = events
      setEvents((prev) =>
        prev.map((e) => (e.id === editingId ? { ...e, ...payload } : e))
      )
      setModalOpen(false)

      const { data, error } = await supabase
        .from('events')
        .update(payload)
        .eq('id', editingId)
        .select()
        .single()

      if (error || !data) {
        setEvents(snapshot)
        setModalOpen(true)
        toast.error(`Failed to update: ${error?.message ?? 'No data returned'}`)
      } else {
        setEvents((prev) => prev.map((e) => (e.id === editingId ? data : e)))
        toast.success('Event updated')
      }
    } else {
      const tempId = `__temp__${Date.now()}`
      const optimistic: EventRow = {
        id: tempId,
        profile_id: profileId,
        ...payload,
      }
      setEvents((prev) =>
        [...prev, optimistic].sort(
          (a, b) =>
            new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime()
        )
      )
      setModalOpen(false)

      const { data, error } = await supabase
        .from('events')
        .insert({ ...payload, profile_id: profileId })
        .select()
        .single()

      if (error || !data) {
        setEvents((prev) => prev.filter((e) => e.id !== tempId))
        toast.error(`Failed to save: ${error?.message ?? 'No data returned'}`)
      } else {
        setEvents((prev) => prev.map((e) => (e.id === tempId ? data : e)))
        toast.success('Event added')
      }
    }
  }

  async function handleDelete(id: string) {
    const snapshot = events
    setEvents((prev) => prev.filter((e) => e.id !== id))

    const supabase = createClient()
    const { error } = await supabase.from('events').delete().eq('id', id)

    if (error) {
      setEvents(snapshot)
      toast.error('Error deleting event')
    } else {
      toast.success('Event deleted')
    }
  }

  return (
    <>
      <div className="flex justify-end mb-4">
        <Button size="sm" onClick={openAdd}>
          <Plus className="w-4 h-4" />
          Add event
        </Button>
      </div>

      {events.length > 0 ? (
        <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl overflow-hidden">
          {events.map((e) => (
            <div
              key={e.id}
              className="flex items-start gap-4 p-4 border-b border-[var(--color-border)] last:border-b-0 hover:bg-[var(--color-bg-hover)] transition-colors"
            >
              <div
                className="w-1 self-stretch rounded-full shrink-0 min-h-[44px]"
                style={{ backgroundColor: eventTypeColors[e.type] ?? '#9898b0' }}
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[var(--color-text-primary)]">
                  {e.title}
                </p>
                <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                  {formatDateTime(e.scheduled_at)}
                  {e.duration_minutes ? ` · ${formatDuration(e.duration_minutes)}` : ''}
                </p>
                {e.notes && (
                  <p className="text-xs text-[var(--color-text-secondary)] mt-1 line-clamp-2">
                    {e.notes}
                  </p>
                )}
              </div>
              <span
                className="text-xs px-2 py-0.5 rounded-md shrink-0 font-medium"
                style={{
                  color: eventTypeColors[e.type] ?? '#9898b0',
                  background: `${eventTypeColors[e.type] ?? '#9898b0'}20`,
                }}
              >
                {eventTypeLabels[e.type] ?? e.type}
              </span>
              <div className="flex gap-1 shrink-0">
                <button
                  onClick={() => openEdit(e)}
                  className="p-1.5 rounded-md text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)] transition-colors"
                  aria-label="Edit event"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleDelete(e.id)}
                  className="p-1.5 rounded-md text-[var(--color-text-muted)] hover:text-[#ff6b6b] hover:bg-[rgba(255,107,107,0.1)] transition-colors"
                  aria-label="Delete event"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <div className="w-12 h-12 rounded-xl bg-[var(--color-bg-card)] border border-[var(--color-border)] flex items-center justify-center">
            <CalendarDays className="w-5 h-5 text-[var(--color-text-muted)]" />
          </div>
          <p className="text-sm font-medium text-[var(--color-text-primary)]">No events</p>
          <p className="text-xs text-[var(--color-text-muted)]">
            Add events on behalf of this client.
          </p>
        </div>
      )}

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit event' : 'Add event'}</DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label>Title</Label>
              <Input
                placeholder="Event title"
                value={form.title}
                onChange={(e) => set('title', e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>Type</Label>
              <Select value={form.type} onValueChange={(v) => set('type', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ADMIN_EVENT_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      <span className="flex items-center gap-2">
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: eventTypeColors[t] ?? '#9898b0' }}
                        />
                        {eventTypeLabels[t] ?? t}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label>Date</Label>
                <Input
                  type="date"
                  value={form.scheduled_at.slice(0, 10)}
                  onChange={(e) => set('scheduled_at', `${e.target.value}T${form.scheduled_at.slice(11, 16) || '12:00'}`)}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Duration (hours)</Label>
                <Input
                  type="number"
                  placeholder="e.g. 1.5"
                  min="0.25"
                  step="0.25"
                  value={form.duration_hours}
                  onChange={(e) => set('duration_hours', e.target.value)}
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>Time</Label>
              <TimeSelect
                value={form.scheduled_at.slice(11, 16) || '12:00'}
                onChange={(t) => set('scheduled_at', `${form.scheduled_at.slice(0, 10) || new Date().toISOString().slice(0, 10)}T${t}`)}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>Notes</Label>
              <Textarea
                placeholder="Additional info..."
                value={form.notes}
                onChange={(e) => set('notes', e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            {editingId && (
              <Button
                variant="danger"
                size="sm"
                onClick={() => {
                  setModalOpen(false)
                  handleDelete(editingId)
                }}
                className="mr-auto"
              >
                Delete
              </Button>
            )}
            <Button variant="secondary" size="sm" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={!form.title.trim() || !form.scheduled_at.slice(0, 10)}
            >
              {editingId ? 'Update' : 'Add event'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
