'use server'

import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'

async function verifyAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const admin = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
  const { data: profile } = await admin
    .from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return null

  return admin
}

export async function createEvent(data: {
  profileId: string
  title: string
  type: string
  scheduledAt: string
  durationMinutes: number | null
  notes: string
}): Promise<{ data: any } | { error: string }> {
  const admin = await verifyAdmin()
  if (!admin) return { error: 'Unauthorized' }

  const { data: event, error } = await admin
    .from('events')
    .insert({
      profile_id: data.profileId,
      title: data.title,
      type: data.type,
      scheduled_at: data.scheduledAt,
      duration_minutes: data.durationMinutes,
      notes: data.notes.trim() || null,
    })
    .select('id, title, type, scheduled_at, duration_minutes, notes, profile_id, profiles(id, full_name, username)')
    .single()

  if (error || !event) return { error: error?.message ?? 'Failed to create event' }
  return { data: event }
}
