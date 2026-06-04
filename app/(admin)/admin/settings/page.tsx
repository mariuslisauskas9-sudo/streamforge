import { createClient } from '@/lib/supabase/server'
import { AddAdminModal } from './add-admin-modal'
import { AdminList } from './admin-list'
import { CreatorCredentials } from './creator-credentials'
import { SystemAccounts } from './system-accounts'
import { ShieldCheck } from 'lucide-react'

type AdminRow = {
  id: string
  full_name: string | null
  username: string | null
  avatar_url: string | null
  email: string | null
  created_at: string
}

type CredentialRow = {
  id: string
  username: string
  password: string
  created_at: string
  profiles: { full_name: string | null }[]
}

export default async function SettingsPage() {
  const supabase = await createClient()

  const [
    { data: { user } },
    { data: adminsRaw },
    { data: credentialsRaw },
    { data: xPostsProfile },
  ] = await Promise.all([
    supabase.auth.getUser(),
    supabase
      .from('profiles')
      .select('id, full_name, username, avatar_url, email, created_at')
      .eq('role', 'admin')
      .order('created_at', { ascending: true }),
    supabase
      .from('creator_credentials')
      .select('id, username, password, created_at, profiles(full_name)')
      .order('created_at', { ascending: false }),
    supabase
      .from('profiles')
      .select('id')
      .eq('username', 'x-posts')
      .maybeSingle(),
  ])

  const admins = (adminsRaw ?? []) as AdminRow[]
  const credentials = (credentialsRaw ?? []) as CredentialRow[]
  const currentUserId = user?.id ?? ''

  return (
    <div className="p-6 max-w-3xl mx-auto animate-in">
      <div className="mb-7">
        <h1 className="text-2xl font-heading font-bold text-[var(--color-text-primary)]">
          Settings
        </h1>
        <p className="text-sm text-[var(--color-text-muted)] mt-1">
          Manage admin accounts and workspace configuration.
        </p>
      </div>

      <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border)]">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-4 h-4 text-[var(--color-accent)]" />
            <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">
              Admin accounts
            </h2>
            <span className="text-xs text-[var(--color-text-muted)] bg-[var(--color-bg-hover)] px-2 py-0.5 rounded-full border border-[var(--color-border)]">
              {admins.length}
            </span>
          </div>
          <AddAdminModal />
        </div>

        <AdminList initialAdmins={admins} currentUserId={currentUserId} />
      </div>

      <CreatorCredentials credentials={credentials} />
      <SystemAccounts initialExists={!!xPostsProfile} />
    </div>
  )
}
