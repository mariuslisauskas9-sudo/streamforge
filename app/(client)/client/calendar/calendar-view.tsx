'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import type { DateSelectArg, EventClickArg } from '@fullcalendar/core'
import { createClient } from '@/lib/supabase/client'
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
import { eventTypeColors, eventTypeLabels } from '@/lib/utils'
import toast from 'react-hot-toast'
import type { StreamEvent, EventType } from '@/types'

interface Props {
  events: StreamEvent[]
  profileId: string
}

type ModalMode = 'create' | 'edit'

interface FormState {
  title: string
  type: EventType
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

const CLIENT_EVENT_TYPES: EventType[] = ['stream', 'video']

export function ClientCalendarView({ events, profileId }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<ModalMode>('create')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(defaultForm)
  const [loading, setLoading] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const calEvents = events.map((e) => ({
    id: e.id,
    title: e.title,
    start: e.scheduled_at,
    end: e.duration_minutes
      ? new Date(new Date(e.scheduled_at).getTime() + e.duration_minutes * 60000).toISOString()
      : undefined,
    backgroundColor: eventTypeColors[e.type] ?? '#9898b0',
    borderColor: eventTypeColors[e.type] ?? '#9898b0',
    extendedProps: { event: e },
  }))

  function openCreate(date?: string) {
    setMode('create')
    setEditingId(null)
    setForm({ ...defaultForm, scheduled_at: date ?? '' })
    setOpen(true)
  }

  function openEdit(e: StreamEvent) {
    setMode('edit')
    setEditingId(e.id)
    setForm({
      title: e.title,
      type: e.type,
      scheduled_at: e.scheduled_at.slice(0, 16),
      duration_hours: e.duration_minutes ? (e.duration_minutes / 60).toString() : '',
      notes: e.notes ?? '',
    })
    setOpen(true)
  }

  function handleDateSelect(arg: DateSelectArg) {
    const dt = new Date(arg.start)
    dt.setHours(12, 0, 0)
    openCreate(dt.toISOString().slice(0, 16))
  }

  function handleEventClick(arg: EventClickArg) {
    openEdit(arg.event.extendedProps.event as StreamEvent)
  }

  async function handleSave() {
    if (!form.title.trim() || !form.scheduled_at) return
    setLoading(true)
    const supabase = createClient()

    const durationMinutes = form.duration_hours
      ? Math.round(parseFloat(form.duration_hours) * 60)
      : null

    const payload = {
      title: form.title.trim(),
      type: form.type,
      scheduled_at: new Date(form.scheduled_at).toISOString(),
      duration_minutes: durationMinutes || null,
      notes: form.notes.trim() || null,
    }

    let error
    if (mode === 'create') {
      const insertPayload = { ...payload, profile_id: profileId }
      console.log('[calendar] insert payload:', insertPayload)
      ;({ error } = await supabase.from('events').insert(insertPayload))
    } else {
      console.log('[calendar] update payload:', payload, 'id:', editingId)
      ;({ error } = await supabase.from('events').update(payload).eq('id', editingId!))
    }

    if (error) {
      console.error('[calendar] save error:', JSON.stringify(error), error?.message, error?.code, error?.details)
      toast.error(`Error: ${error.message ?? JSON.stringify(error)} (code: ${error.code})`)
    } else {
      toast.success(mode === 'create' ? 'Event created' : 'Event updated')
      setOpen(false)
      router.refresh()
    }
    setLoading(false)
  }

  async function handleDelete() {
    if (!editingId) return
    setDeleteLoading(true)
    const supabase = createClient()
    const { error } = await supabase.from('events').delete().eq('id', editingId)

    if (error) {
      console.error('[calendar] delete error:', error)
      toast.error(`Error: ${error.message} (code: ${error.code})`)
    } else {
      toast.success('Event deleted')
      setOpen(false)
      router.refresh()
    }
    setDeleteLoading(false)
  }

  return (
    <>
      <div className="flex-1 bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-4">
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          selectable
          selectMirror
          editable={false}
          customButtons={{
            addEvent: {
              text: '+ New event',
              click: () => openCreate(),
            },
          }}
          headerToolbar={{
            left: 'prev,next today addEvent',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay',
          }}
          events={calEvents}
          select={handleDateSelect}
          eventClick={handleEventClick}
          height="100%"
        />
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {mode === 'create' ? 'New event' : 'Edit event'}
            </DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="ev-title">Title</Label>
              <Input
                id="ev-title"
                placeholder="Event title"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>Type</Label>
              <Select
                value={form.type}
                onValueChange={(v) => setForm((f) => ({ ...f, type: v as EventType }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CLIENT_EVENT_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      <span className="flex items-center gap-2">
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: eventTypeColors[t] }}
                        />
                        {eventTypeLabels[t]}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="ev-date">Date & time</Label>
                <Input
                  id="ev-date"
                  type="datetime-local"
                  value={form.scheduled_at}
                  onChange={(e) => setForm((f) => ({ ...f, scheduled_at: e.target.value }))}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="ev-dur">Duration (hours)</Label>
                <Input
                  id="ev-dur"
                  type="number"
                  placeholder="e.g. 1.5"
                  min="0.25"
                  step="0.25"
                  value={form.duration_hours}
                  onChange={(e) => setForm((f) => ({ ...f, duration_hours: e.target.value }))}
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="ev-notes">Notes</Label>
              <Textarea
                id="ev-notes"
                placeholder="Additional info..."
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            {mode === 'edit' && (
              <Button
                variant="danger"
                size="sm"
                onClick={handleDelete}
                disabled={deleteLoading}
                className="mr-auto"
              >
                {deleteLoading ? 'Deleting...' : 'Delete'}
              </Button>
            )}
            <Button variant="secondary" size="sm" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={loading || !form.title.trim() || !form.scheduled_at}
            >
              {loading ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
