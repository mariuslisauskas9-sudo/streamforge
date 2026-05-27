'use server'

import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'

async function getAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

async function verifyAdmin() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const admin = await getAdminClient()
  const { data: profile } = await admin
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  if (profile?.role !== 'admin') return null

  return admin
}

export async function createUser(data: {
  fullName: string
  email: string
  password: string
  role: 'admin' | 'client'
  platform: string
}): Promise<{ success: true } | { error: string }> {
  const admin = await verifyAdmin()
  if (!admin) return { error: 'Unauthorized' }

  const { data: created, error: authError } = await admin.auth.admin.createUser({
    email: data.email,
    password: data.password,
    email_confirm: true,
  })
  if (authError || !created.user) return { error: authError?.message ?? 'Failed to create user' }

  const { error: profileError } = await admin.from('profiles').upsert({
    id: created.user.id,
    full_name: data.fullName || null,
    email: data.email,
    role: data.role,
    status: 'active',
  })
  if (profileError) {
    await admin.auth.admin.deleteUser(created.user.id)
    return { error: profileError.message }
  }

  if (data.platform) {
    await admin.from('platform_links').insert({
      profile_id: created.user.id,
      platform: data.platform,
      url: '',
    })
  }

  return { success: true }
}

export async function hireCandidate(data: {
  candidateId: string
  name: string
  platform: string
  audienceSize: number | null
  email: string
}): Promise<{ success: true } | { error: string }> {
  const admin = await verifyAdmin()
  if (!admin) return { error: 'Unauthorized' }

  // 1. Send invite email — creates the auth user and emails a set-password link
  const { data: invited, error: authError } = await admin.auth.admin.inviteUserByEmail(
    data.email,
    { data: { full_name: data.name } },
  )
  if (authError || !invited.user) return { error: authError?.message ?? 'Failed to send invite' }

  const userId = invited.user.id

  // 2. Create profile
  const { error: profileError } = await admin.from('profiles').upsert({
    id: userId,
    full_name: data.name || null,
    email: data.email,
    role: 'client',
    status: 'active',
  })
  if (profileError) {
    await admin.auth.admin.deleteUser(userId)
    return { error: profileError.message }
  }

  // 3. Create platform link (carries over audience size)
  await admin.from('platform_links').insert({
    profile_id: userId,
    platform: data.platform,
    url: '',
    followers_count: data.audienceSize,
  })

  // 4. Delete the candidate — rollback user+profile if this fails
  const { error: deleteError } = await admin
    .from('candidates')
    .delete()
    .eq('id', data.candidateId)
  if (deleteError) {
    await admin.from('profiles').delete().eq('id', userId)
    await admin.auth.admin.deleteUser(userId)
    return { error: deleteError.message }
  }

  return { success: true }
}

export async function deleteAdmin(
  userId: string,
): Promise<{ success: true } | { error: string }> {
  const admin = await verifyAdmin()
  if (!admin) return { error: 'Unauthorized' }

  // Server-side self-deletion guard
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (user?.id === userId) return { error: 'Cannot delete your own account' }

  // Delete profile first, then the auth user
  await admin.from('profiles').delete().eq('id', userId)
  const { error } = await admin.auth.admin.deleteUser(userId)
  if (error) return { error: error.message }

  return { success: true }
}
