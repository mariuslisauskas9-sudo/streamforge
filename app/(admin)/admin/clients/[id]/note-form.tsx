'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import toast from 'react-hot-toast'

export function AdminNoteForm({ profileId }: { profileId: string }) {
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!content.trim()) return
    setLoading(true)

    const supabase = createClient()
    const { error } = await supabase
      .from('admin_notes')
      .insert({ profile_id: profileId, content: content.trim() })

    if (error) {
      toast.error('Error saving note')
    } else {
      toast.success('Note saved')
      setContent('')
      router.refresh()
    }
    setLoading(false)
  }

  return (
    <Card>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <Textarea
          placeholder="Add a note about this client..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={3}
        />
        <div className="flex justify-end">
          <Button type="submit" size="sm" disabled={loading || !content.trim()}>
            {loading ? 'Saving...' : 'Add note'}
          </Button>
        </div>
      </form>
    </Card>
  )
}
