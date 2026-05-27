import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ProfileForm } from './profile-form'
import { Card } from '@/components/ui/card'
import type { ProfileWithLinks } from '@/types'
import { CalendarDays, Clock, Radio, Video } from 'lucide-react'

export default async function ClientProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString()

  const [
    { data: profile },
    { count: totalEvents },
    { count: upcomingEvents },
    { count: streamsThisMonth },
    { count: videosThisMonth },
  ] = await Promise.all([
    supabase
      .from('profiles')
      .select('*, platform_links(*)')
      .eq('id', user.id)
      .single(),
    supabase
      .from('events')
      .select('*', { count: 'exact', head: true })
      .eq('profile_id', user.id),
    supabase
      .from('events')
      .select('*', { count: 'exact', head: true })
      .eq('profile_id', user.id)
      .gte('scheduled_at', now.toISOString()),
    supabase
      .from('events')
      .select('*', { count: 'exact', head: true })
      .eq('profile_id', user.id)
      .eq('type', 'stream')
      .gte('scheduled_at', monthStart)
      .lt('scheduled_at', monthEnd),
    supabase
      .from('events')
      .select('*', { count: 'exact', head: true })
      .eq('profile_id', user.id)
      .eq('type', 'video')
      .gte('scheduled_at', monthStart)
      .lt('scheduled_at', monthEnd),
  ])

  if (!profile) redirect('/login')

  return (
    <div className="p-6 max-w-2xl mx-auto animate-in">
      <div className="mb-7">
        <h1 className="text-2xl font-heading font-bold text-[var(--color-text-primary)]">
          My profile
        </h1>
        <p className="text-sm text-[var(--color-text-muted)] mt-1">
          Edit your personal information
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-6">
        <StatCard
          icon={CalendarDays}
          bg="rgba(124,106,255,0.15)"
          color="var(--color-accent)"
          value={totalEvents ?? 0}
          label="Total events"
        />
        <StatCard
          icon={Clock}
          bg="rgba(0,217,126,0.15)"
          color="var(--color-green)"
          value={upcomingEvents ?? 0}
          label="Upcoming events"
        />
        <StatCard
          icon={Radio}
          bg="rgba(255,107,107,0.15)"
          color="#ff6b6b"
          value={streamsThisMonth ?? 0}
          label="Streams this month"
        />
        <StatCard
          icon={Video}
          bg="rgba(52,170,255,0.15)"
          color="#34aaff"
          value={videosThisMonth ?? 0}
          label="Videos this month"
        />
      </div>

      <ProfileForm profile={profile as ProfileWithLinks} />
    </div>
  )
}

function StatCard({
  icon: Icon,
  bg,
  color,
  value,
  label,
}: {
  icon: React.ElementType
  bg: string
  color: string
  value: number
  label: string
}) {
  return (
    <Card className="flex items-center gap-3 p-4">
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: bg }}
      >
        <Icon className="w-4 h-4" style={{ color }} />
      </div>
      <div>
        <p className="text-xl font-heading font-bold text-[var(--color-text-primary)] leading-none">
          {value}
        </p>
        <p className="text-xs text-[var(--color-text-muted)] mt-0.5">{label}</p>
      </div>
    </Card>
  )
}
