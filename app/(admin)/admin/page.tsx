import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import StatusBadge from '@/components/StatusBadge'
import {
  formatDate, formatDateTime, getInitials, eventTypeLabels, eventTypeColors,
} from '@/lib/utils'
import { Users, UserSearch, Radio, Video, CalendarDays } from 'lucide-react'
import Link from 'next/link'

type RecentClient = {
  id: string
  full_name: string | null
  username: string | null
  avatar_url: string | null
  status: string
}

type ClientNextEvent = {
  id: string
  profile_id: string
  title: string
  type: string
  scheduled_at: string
}

type UpcomingEvent = {
  id: string
  title: string
  type: string
  scheduled_at: string
  profiles:
    | { full_name: string | null; username: string | null }
    | { full_name: string | null; username: string | null }[]
    | null
}

function getClientName(profiles: UpcomingEvent['profiles']): string {
  if (!profiles) return '—'
  const p = Array.isArray(profiles) ? profiles[0] : profiles
  return p?.full_name ?? p?.username ?? '—'
}

export default async function AdminDashboard() {
  const supabase = await createClient()
  const now = new Date().toISOString()

  const [
    { count: activeClients },
    { count: candidatesCount },
    { count: upcomingStreams },
    { count: upcomingVideos },
    { data: recentClientsRaw },
    { data: upcomingEventsRaw },
  ] = await Promise.all([
    supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'client')
      .eq('status', 'active'),
    supabase
      .from('candidates')
      .select('*', { count: 'exact', head: true }),
    supabase
      .from('events')
      .select('*', { count: 'exact', head: true })
      .eq('type', 'stream')
      .gte('scheduled_at', now),
    supabase
      .from('events')
      .select('*', { count: 'exact', head: true })
      .eq('type', 'video')
      .gte('scheduled_at', now),
    supabase
      .from('profiles')
      .select('id, full_name, username, avatar_url, status')
      .eq('role', 'client')
      .order('created_at', { ascending: false })
      .limit(5),
    supabase
      .from('events')
      .select('id, title, type, scheduled_at, profiles(full_name, username)')
      .gte('scheduled_at', now)
      .order('scheduled_at', { ascending: true })
      .limit(5),
  ])

  const recentClients = (recentClientsRaw ?? []) as RecentClient[]
  const upcomingEvents = (upcomingEventsRaw ?? []) as UpcomingEvent[]

  // Fetch the next upcoming event for each recent client
  const clientIds = recentClients.map((c) => c.id)
  let clientNextEventsRaw: ClientNextEvent[] = []
  if (clientIds.length > 0) {
    const { data } = await supabase
      .from('events')
      .select('id, profile_id, title, type, scheduled_at')
      .in('profile_id', clientIds)
      .gte('scheduled_at', now)
      .order('scheduled_at', { ascending: true })
    clientNextEventsRaw = (data ?? []) as ClientNextEvent[]
  }

  const nextEventMap = new Map<string, ClientNextEvent>()
  for (const ev of clientNextEventsRaw) {
    if (!nextEventMap.has(ev.profile_id)) nextEventMap.set(ev.profile_id, ev)
  }

  const stats = [
    {
      label: 'Active clients',
      value: activeClients ?? 0,
      icon: Users,
      color: 'var(--color-accent)',
    },
    {
      label: 'Candidates',
      value: candidatesCount ?? 0,
      icon: UserSearch,
      color: 'var(--color-amber)',
    },
    {
      label: 'Upcoming streams',
      value: upcomingStreams ?? 0,
      icon: Radio,
      color: '#ff6b6b',
    },
    {
      label: 'YouTube videos',
      value: upcomingVideos ?? 0,
      icon: Video,
      color: '#34aaff',
    },
  ]

  return (
    <div className="p-6 max-w-6xl mx-auto animate-in">
      <div className="mb-7">
        <h1 className="text-2xl font-heading font-bold text-[var(--color-text-primary)]">
          Dashboard
        </h1>
        <p className="text-sm text-[var(--color-text-muted)] mt-1">{formatDate(new Date())}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-7">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <Card key={label} className="flex items-center gap-4">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: `${color}20` }}
            >
              <Icon className="w-5 h-5" style={{ color }} />
            </div>
            <div>
              <p className="text-2xl font-heading font-bold text-[var(--color-text-primary)] leading-none">
                {value}
              </p>
              <p className="text-xs text-[var(--color-text-muted)] mt-1">{label}</p>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Clients */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-heading font-semibold text-[var(--color-text-primary)]">
              Recent clients
            </h2>
            <Link href="/admin/clients" className="text-xs text-[var(--color-accent)] hover:underline">
              All clients →
            </Link>
          </div>
          <div className="flex flex-col gap-1">
            {recentClients.length ? (
              recentClients.map((c) => {
                const nextEvent = nextEventMap.get(c.id)
                return (
                  <Link
                    key={c.id}
                    href={`/admin/clients/${c.id}`}
                    className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-[var(--color-bg-hover)] transition-colors group"
                  >
                    <Avatar className="w-9 h-9 shrink-0">
                      <AvatarImage src={c.avatar_url ?? undefined} />
                      <AvatarFallback>{getInitials(c.full_name)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[var(--color-text-primary)] truncate group-hover:text-[var(--color-accent)] transition-colors">
                        {c.full_name ?? 'Unknown'}
                      </p>
                      {nextEvent ? (
                        <p className="text-xs text-[var(--color-text-muted)] truncate mt-0.5 flex items-center gap-1.5">
                          <span
                            className="w-1.5 h-1.5 rounded-full shrink-0"
                            style={{
                              backgroundColor: eventTypeColors[nextEvent.type] ?? '#9898b0',
                            }}
                          />
                          {nextEvent.title} · {formatDateTime(nextEvent.scheduled_at)}
                        </p>
                      ) : (
                        <p className="text-xs text-[var(--color-text-muted)] mt-0.5 flex items-center gap-1.5">
                          <CalendarDays className="w-3 h-3 shrink-0" />
                          No upcoming events
                        </p>
                      )}
                    </div>
                    <StatusBadge status={c.status} />
                  </Link>
                )
              })
            ) : (
              <p className="text-sm text-[var(--color-text-muted)] text-center py-4">
                No clients yet
              </p>
            )}
          </div>
        </Card>

        {/* Upcoming Events */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-heading font-semibold text-[var(--color-text-primary)]">
              Upcoming events
            </h2>
            <Link
              href="/admin/calendar"
              className="text-xs text-[var(--color-accent)] hover:underline"
            >
              Calendar →
            </Link>
          </div>
          <div className="flex flex-col gap-1">
            {upcomingEvents.length ? (
              upcomingEvents.map((e) => (
                <div
                  key={e.id}
                  className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-[var(--color-bg-hover)] transition-colors"
                >
                  <div
                    className="w-1 self-stretch rounded-full shrink-0 min-h-[36px]"
                    style={{ backgroundColor: eventTypeColors[e.type] ?? '#9898b0' }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">
                      {e.title}
                    </p>
                    <p className="text-xs text-[var(--color-text-muted)] mt-0.5 truncate">
                      {getClientName(e.profiles)} · {formatDateTime(e.scheduled_at)}
                    </p>
                  </div>
                  <span
                    className="text-xs px-2 py-0.5 rounded-md shrink-0 font-medium"
                    style={{
                      color: eventTypeColors[e.type] ?? '#9898b0',
                      background: `${eventTypeColors[e.type] ?? '#9898b0'}20`,
                    }}
                  >
                    {eventTypeLabels[e.type] ?? e.type}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-sm text-[var(--color-text-muted)] text-center py-4">
                No upcoming events
              </p>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}
