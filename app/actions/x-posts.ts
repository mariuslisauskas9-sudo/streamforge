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

export type XPost = {
  id: string
  profile_link: string
  followers_count: number | null
  post_link: string | null
  payment_link: string | null
  payment_amount: number | null
  notes: string | null
  created_at: string
}

interface PostData {
  profileLink: string
  followersCount: string
  postLink: string
  paymentLink: string
  paymentAmount: string
  notes: string
}

function toRow(data: PostData) {
  return {
    profile_link: data.profileLink.trim(),
    followers_count: data.followersCount ? parseInt(data.followersCount, 10) : null,
    post_link: data.postLink.trim() || null,
    payment_link: data.paymentLink.trim() || null,
    payment_amount: data.paymentAmount ? parseFloat(data.paymentAmount) : null,
    notes: data.notes.trim() || null,
  }
}

export async function createXPost(
  data: PostData,
): Promise<{ data: XPost } | { error: string }> {
  const admin = await verifyAdmin()
  if (!admin) return { error: 'Unauthorized' }

  const { data: created, error } = await admin
    .from('x_posts')
    .insert(toRow(data))
    .select()
    .single()

  if (error || !created) return { error: error?.message ?? 'Failed to create post' }
  return { data: created as XPost }
}

export async function updateXPost(
  id: string,
  data: PostData,
): Promise<{ data: XPost } | { error: string }> {
  const admin = await verifyAdmin()
  if (!admin) return { error: 'Unauthorized' }

  const { data: updated, error } = await admin
    .from('x_posts')
    .update(toRow(data))
    .eq('id', id)
    .select()
    .single()

  if (error || !updated) return { error: error?.message ?? 'Failed to update post' }
  return { data: updated as XPost }
}

export async function deleteXPost(
  id: string,
): Promise<{ success: true } | { error: string }> {
  const admin = await verifyAdmin()
  if (!admin) return { error: 'Unauthorized' }

  const { error } = await admin.from('x_posts').delete().eq('id', id)
  if (error) return { error: error.message }
  return { success: true }
}
