'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { MessageSquare, Trash2 } from 'lucide-react'
import { formatDateTime } from '@/lib/utils'
import toast from 'react-hot-toast'

type NoteRow = {
  id: string
  profile_id: string
  content: string
  created_at: string
}

export function NotesSection({
  initialNotes,
  profileId,
}: {
  initialNotes: NoteRow[]
  profileId: string
}) {
  const [notes, setNotes] = useState<NoteRow[]>(initialNotes)
  const [content, setContent] = useState('')

  async function handleAdd() {
    if (!content.trim()) return

    const saved = content.trim()
    const tempId = `__temp__${Date.now()}`
    const optimistic: NoteRow = {
      id: tempId,
      profile_id: profileId,
      content: saved,
      created_at: new Date().toISOString(),
    }

    setNotes((prev) => [optimistic, ...prev])
    setContent('')

    const supabase = createClient()
    const { data, error } = await supabase
      .from('admin_notes')
      .insert({ profile_id: profileId, content: saved })
      .select()
      .single()

    if (error || !data) {
      setNotes((prev) => prev.filter((n) => n.id !== tempId))
      setContent(saved)
      toast.error('Failed to save note')
    } else {
      setNotes((prev) => prev.map((n) => (n.id === tempId ? data : n)))
      toast.success('Note saved')
    }
  }

  async function handleDelete(id: string) {
    const snapshot = notes
    setNotes((prev) => prev.filter((n) => n.id !== id))

    const supabase = createClient()
    const { error } = await supabase.from('admin_notes').delete().eq('id', id)

    if (error) {
      setNotes(snapshot)
      toast.error('Error deleting note')
    } else {
      toast.success('Note deleted')
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-4">
        <div className="flex flex-col gap-3">
          <Textarea
            placeholder="Add a private note about this client..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={3}
          />
          <div className="flex justify-end">
            <Button size="sm" onClick={handleAdd} disabled={!content.trim()}>
              Add note
            </Button>
          </div>
        </div>
      </div>

      {notes.length > 0 ? (
        <div className="flex flex-col gap-3">
          {notes.map((n) => (
            <div
              key={n.id}
              className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-4 group"
            >
              <div className="flex items-start gap-3">
                <p className="flex-1 text-sm text-[var(--color-text-secondary)] whitespace-pre-wrap leading-relaxed">
                  {n.content}
                </p>
                <button
                  onClick={() => handleDelete(n.id)}
                  className="p-1.5 rounded-md text-[var(--color-text-muted)] hover:text-[#ff6b6b] hover:bg-[rgba(255,107,107,0.1)] transition-colors opacity-0 group-hover:opacity-100 shrink-0"
                  aria-label="Delete note"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <p className="text-xs text-[var(--color-text-muted)] mt-2">
                {formatDateTime(n.created_at)}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <div className="w-12 h-12 rounded-xl bg-[var(--color-bg-card)] border border-[var(--color-border)] flex items-center justify-center">
            <MessageSquare className="w-5 h-5 text-[var(--color-text-muted)]" />
          </div>
          <p className="text-sm font-medium text-[var(--color-text-primary)]">No notes</p>
          <p className="text-xs text-[var(--color-text-muted)]">
            Private notes are only visible to admins.
          </p>
        </div>
      )}
    </div>
  )
}
