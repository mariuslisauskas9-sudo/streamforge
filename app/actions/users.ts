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
  username?: string
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
    ...(data.username ? { username: data.username } : {}),
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

export async function createCreator(data: {
  fullName: string
  username: string
  password: string
  platform: string
  channelUrl: string
  followers: string
  contact: string
  bio: string
}): Promise<{ success: true } | { error: string }> {
  const admin = await verifyAdmin()
  if (!admin) return { error: 'Unauthorized' }

  const slug = data.username.trim().toLowerCase()
  if (!slug) return { error: 'Username is required' }

  const email = `${slug}@streamforge.internal`
  const followersNum = data.followers ? parseInt(data.followers, 10) : null

  const { data: created, error: authError } = await admin.auth.admin.createUser({
    email,
    password: data.password,
    email_confirm: true,
  })
  if (authError || !created.user) return { error: authError?.message ?? 'Failed to create user' }

  const { error: profileError } = await admin.from('profiles').upsert({
    id: created.user.id,
    full_name: data.fullName || null,
    username: slug,
    email,
    role: 'client',
    status: 'active',
    ...(data.contact ? { discord: data.contact } : {}),
    ...(data.bio ? { bio: data.bio } : {}),
  })
  if (profileError) {
    await admin.auth.admin.deleteUser(created.user.id)
    return { error: profileError.message }
  }

  if (data.platform) {
    await admin.from('platform_links').insert({
      profile_id: created.user.id,
      platform: data.platform,
      url: data.channelUrl || '',
      ...(followersNum !== null && !isNaN(followersNum) ? { followers_count: followersNum } : {}),
    })
  }

  await admin.from('creator_credentials').insert({
    profile_id: created.user.id,
    username: slug,
    password: data.password,
  })

  return { success: true }
}

export async function inviteCreator(data: {
  fullName: string
  email: string
  platform: string
  username: string
  channelUrl: string
  followersCount: string
  details: string
}): Promise<{ success: true } | { error: string }> {
  const admin = await verifyAdmin()
  if (!admin) return { error: 'Unauthorized' }

  const { data: invited, error: authError } = await admin.auth.admin.inviteUserByEmail(
    data.email,
    { data: { full_name: data.fullName || undefined } },
  )
  if (authError || !invited.user) return { error: authError?.message ?? 'Failed to send invite' }

  const userId = invited.user.id
  const followers = data.followersCount ? parseInt(data.followersCount, 10) : null

  const { error: profileError } = await admin.from('profiles').upsert({
    id: userId,
    full_name: data.fullName || null,
    email: data.email,
    role: 'client',
    status: 'active',
    ...(data.username ? { username: data.username } : {}),
    ...(data.details ? { bio: data.details } : {}),
  })
  if (profileError) {
    await admin.auth.admin.deleteUser(userId)
    return { error: profileError.message }
  }

  if (data.platform) {
    await admin.from('platform_links').insert({
      profile_id: userId,
      platform: data.platform,
      url: data.channelUrl || '',
      ...(followers !== null && !isNaN(followers) ? { followers_count: followers } : {}),
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

export async function deleteCreator(
  userId: string,
): Promise<{ success: true } | { error: string }> {
  const admin = await verifyAdmin()
  if (!admin) return { error: 'Unauthorized' }

  await admin.from('profiles').delete().eq('id', userId)
  const { error } = await admin.auth.admin.deleteUser(userId)
  if (error) return { error: error.message }

  return { success: true }
}

export async function createSystemAccount(): Promise<
  { success: true; created: boolean } | { error: string }
> {
  const admin = await verifyAdmin()
  if (!admin) return { error: 'Unauthorized' }

  // Idempotent — bail out if the profile already exists
  const { data: existing } = await admin
    .from('profiles')
    .select('id')
    .eq('username', 'x-posts')
    .maybeSingle()
  if (existing) return { success: true, created: false }

  const { data: created, error: authError } = await admin.auth.admin.createUser({
    email: 'x-posts@streamforge.internal',
    password: crypto.randomUUID(),
    email_confirm: true,
  })
  if (authError || !created.user) return { error: authError?.message ?? 'Failed to create user' }

  const userId = created.user.id

  const { error: profileError } = await admin.from('profiles').upsert({
    id: userId,
    email: 'x-posts@streamforge.internal',
    role: 'client',
    full_name: 'X Posts Schedule',
    username: 'x-posts',
    status: 'active',
  })
  if (profileError) {
    await admin.auth.admin.deleteUser(userId)
    return { error: profileError.message }
  }

  await admin.from('platform_links').insert({
    profile_id: userId,
    platform: 'twitter',
    url: '',
  })

  return { success: true, created: true }
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
