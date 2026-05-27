import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { formatDateTime, getInitials, eventTypeColors, eventTypeLabels } from '@/lib/utils'
import { CalendarDays, Clock, Zap } from 'lucide-react'
import Link from 'next/link'

export default async function ClientDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: profile }, { data: upcomingEvents }, { count: monthCount }] = await Promise.all([
    supabase
      .from('profiles')
      .select('*, platform_links(*)')
      .eq('id', user.id)
      .single(),
    supabase
      .from('events')
      .select('*')
      .eq('profile_id', user.id)
      .gte('scheduled_at', new Date().toISOString())
      .order('scheduled_at', { ascending: true })
      .limit(5),
    supabase
      .from('events')
      .select('*', { count: 'exact', head: true })
      .eq('profile_id', user.id)
      .gte('scheduled_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString())
      .lt('scheduled_at', new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toISOString()),
  ])

  const greeting = getGreeting()

  return (
    <div className="p-6 max-w-4xl mx-auto animate-in">
      {/* Welcome */}
      <div className="flex items-center gap-4 mb-7">
        <Avatar className="w-14 h-14">
          <AvatarImage src={profile?.avatar_url ?? undefined} />
          <AvatarFallback className="text-lg">{getInitials(profile?.full_name)}</AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-2xl font-heading font-bold text-[var(--color-text-primary)]">
            {greeting}, {profile?.full_name?.split(' ')[0] ?? 'there'}!
          </h1>
          <p className="text-sm text-[var(--color-text-muted)]">
            @{profile?.username ?? '—'}
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-7">
        <Card className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-[rgba(124,106,255,0.15)] flex items-center justify-center">
            <CalendarDays className="w-5 h-5 text-[var(--color-accent)]" />
          </div>
          <div>
            <p className="text-2xl font-heading font-bold text-[var(--color-text-primary)] leading-none">
              {upcomingEvents?.length ?? 0}
            </p>
            <p className="text-xs text-[var(--color-text-muted)] mt-1">Upcoming events</p>
          </div>
        </Card>
        <Card className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-[rgba(0,217,126,0.15)] flex items-center justify-center">
            <Zap className="w-5 h-5 text-[var(--color-green)]" />
          </div>
          <div>
            <p className="text-2xl font-heading font-bold text-[var(--color-text-primary)] leading-none">
              {monthCount ?? 0}
            </p>
            <p className="text-xs text-[var(--color-text-muted)] mt-1">This month's events</p>
          </div>
        </Card>
      </div>

      {/* Upcoming Events */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-heading font-semibold text-[var(--color-text-primary)]">
            Upcoming events
          </h2>
          <Link
            href="/client/calendar"
            className="text-xs text-[var(--color-accent)] hover:underline"
          >
            View all →
          </Link>
        </div>

        {upcomingEvents?.length ? (
          <div className="flex flex-col gap-2">
            {upcomingEvents.map((e) => (
              <div
                key={e.id}
                className="flex items-start gap-3 p-3 rounded-lg bg-[var(--color-bg-secondary)] border border-[var(--color-border)]"
              >
                <div
                  className="w-1 rounded-full shrink-0 self-stretch min-h-[40px]"
                  style={{ backgroundColor: eventTypeColors[e.type] ?? '#9898b0' }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">
                    {e.title}
                  </p>
                  <div className="flex items-center gap-1 text-xs text-[var(--color-text-muted)] mt-0.5">
                    <Clock className="w-3 h-3" />
                    {formatDateTime(e.scheduled_at)}
                    {e.duration_minutes && ` · ${e.duration_minutes} min`}
                  </div>
                </div>
                <span
                  className="text-xs px-2 py-0.5 rounded-md shrink-0"
                  style={{
                    color: eventTypeColors[e.type],
                    background: `${eventTypeColors[e.type]}20`,
                  }}
                >
                  {eventTypeLabels[e.type] ?? e.type}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <CalendarDays className="w-8 h-8 text-[var(--color-text-muted)] mx-auto mb-2" />
            <p className="text-sm text-[var(--color-text-muted)]">
              No upcoming events
            </p>
            <Link
              href="/client/calendar"
              className="text-xs text-[var(--color-accent)] hover:underline mt-1 inline-block"
            >
              Add event →
            </Link>
          </div>
        )}
      </Card>
    </div>
  )
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}
