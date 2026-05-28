import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import StatusBadge from '@/components/StatusBadge'
import { AnalyticsCharts } from '@/components/admin/analytics-charts'
import {
  formatDate, formatDateTime, getInitials, eventTypeLabels, eventTypeColors,
} from '@/lib/utils'
import { Users, UserSearch, Radio, Video, CalendarDays, BarChart3, Award } from 'lucide-react'
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

type MonthEvent = {
  id: string
  profile_id: string
  type: string
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

function getMonthCreatorName(profiles: MonthEvent['profiles']): string {
  if (!profiles) return 'Unknown'
  const p = Array.isArray(profiles) ? profiles[0] : profiles
  return p?.full_name ?? p?.username ?? 'Unknown'
}

export default async function AdminDashboard() {
  const supabase = await createClient()

  const today = new Date()
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1).toISOString()
  const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 1).toISOString()
  const now = today.toISOString()
  const monthLabel = today.toLocaleString('en-US', { month: 'long' })

  const [
    { count: activeClients },
    { count: candidatesCount },
    { count: upcomingStreams },
    { count: upcomingVideos },
    { data: recentClientsRaw },
    { data: upcomingEventsRaw },
    { data: monthEventsRaw },
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
    supabase
      .from('events')
      .select('id, profile_id, type, profiles(full_name, username)')
      .gte('scheduled_at', monthStart)
      .lt('scheduled_at', monthEnd),
  ])

  const recentClients = (recentClientsRaw ?? []) as RecentClient[]
  const upcomingEvents = (upcomingEventsRaw ?? []) as UpcomingEvent[]
  const monthEvents = (monthEventsRaw ?? []) as MonthEvent[]

  // Fetch next event per recent client
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

  // --- This month analytics ---
  const monthStreams = monthEvents.filter((e) => e.type === 'stream').length
  const monthVideos = monthEvents.filter((e) => e.type === 'video').length
  const totalMonthEvents = monthEvents.length

  const creatorCountMap = new Map<string, { name: string; count: number }>()
  for (const ev of monthEvents) {
    const entry = creatorCountMap.get(ev.profile_id)
    if (entry) {
      entry.count++
    } else {
      creatorCountMap.set(ev.profile_id, { name: getMonthCreatorName(ev.profiles), count: 1 })
    }
  }
  const sortedCreators = Array.from(creatorCountMap.values()).sort((a, b) => b.count - a.count)
  const mostActiveCreator = sortedCreators[0] ?? null

  const creatorChartData = sortedCreators.slice(0, 5).map((c) => ({
    name: c.name.length > 13 ? `${c.name.slice(0, 12)}…` : c.name,
    count: c.count,
  }))

  const typeChartData = [
    { name: 'Streams',  count: monthStreams,                                                          color: '#ff6b6b' },
    { name: 'YouTube',  count: monthVideos,                                                           color: '#34aaff' },
    { name: 'Collabs',  count: monthEvents.filter((e) => e.type === 'collab').length,                 color: '#00d97e' },
    { name: 'Meetings', count: monthEvents.filter((e) => e.type === 'meeting').length,                color: '#ffb534' },
    { name: 'Other',    count: monthEvents.filter((e) => e.type === 'other').length,                  color: '#9898b0' },
  ].filter((t) => t.count > 0)

  // --- Overall stats ---
  const overallStats = [
    { label: 'Active creators',  value: activeClients ?? 0,   icon: Users,      color: 'var(--color-accent)' },
    { label: 'Candidates',       value: candidatesCount ?? 0,  icon: UserSearch, color: 'var(--color-amber)' },
    { label: 'Upcoming streams', value: upcomingStreams ?? 0,  icon: Radio,      color: '#ff6b6b' },
    { label: 'YouTube videos',   value: upcomingVideos ?? 0,   icon: Video,      color: '#34aaff' },
  ]

  return (
    <div className="p-6 max-w-6xl mx-auto animate-in">
      <div className="mb-7">
        <h1 className="text-2xl font-heading font-bold text-[var(--color-text-primary)]">
          Dashboard
        </h1>
        <p className="text-sm text-[var(--color-text-muted)] mt-1">{formatDate(new Date())}</p>
      </div>

      {/* Overall stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {overallStats.map(({ label, value, icon: Icon, color }) => (
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

      {/* Analytics section */}
      <div className="mb-8">
        <div className="flex items-center gap-2.5 mb-5">
          <h2 className="text-base font-heading font-semibold text-[var(--color-text-primary)]">
            {monthLabel}
          </h2>
          <span className="text-xs text-[var(--color-text-muted)] bg-[var(--color-bg-card)] border border-[var(--color-border)] px-2 py-0.5 rounded-full">
            This month
          </span>
        </div>

        {/* This month stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(255,107,107,0.12)' }}>
              <Radio className="w-5 h-5" style={{ color: '#ff6b6b' }} />
            </div>
            <div>
              <p className="text-2xl font-heading font-bold text-[var(--color-text-primary)] leading-none">
                {monthStreams}
              </p>
              <p className="text-xs text-[var(--color-text-muted)] mt-1">Streams</p>
            </div>
          </Card>

          <Card className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(52,170,255,0.12)' }}>
              <Video className="w-5 h-5" style={{ color: '#34aaff' }} />
            </div>
            <div>
              <p className="text-2xl font-heading font-bold text-[var(--color-text-primary)] leading-none">
                {monthVideos}
              </p>
              <p className="text-xs text-[var(--color-text-muted)] mt-1">YouTube videos</p>
            </div>
          </Card>

          <Card className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(124,106,255,0.12)' }}>
              <BarChart3 className="w-5 h-5" style={{ color: '#7c6aff' }} />
            </div>
            <div>
              <p className="text-2xl font-heading font-bold text-[var(--color-text-primary)] leading-none">
                {totalMonthEvents}
              </p>
              <p className="text-xs text-[var(--color-text-muted)] mt-1">Total events</p>
            </div>
          </Card>

          <Card className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(255,181,52,0.12)' }}>
              <Award className="w-5 h-5" style={{ color: '#ffb534' }} />
            </div>
            <div className="min-w-0 flex-1">
              {mostActiveCreator ? (
                <>
                  <p className="text-sm font-heading font-bold text-[var(--color-text-primary)] leading-none truncate">
                    {mostActiveCreator.name}
                  </p>
                  <p className="text-xs text-[var(--color-text-muted)] mt-1">
                    {mostActiveCreator.count} event{mostActiveCreator.count !== 1 ? 's' : ''} · Most active
                  </p>
                </>
              ) : (
                <>
                  <p className="text-2xl font-heading font-bold text-[var(--color-text-primary)] leading-none">—</p>
                  <p className="text-xs text-[var(--color-text-muted)] mt-1">Most active</p>
                </>
              )}
            </div>
          </Card>
        </div>

        {/* Charts */}
        <AnalyticsCharts creatorData={creatorChartData} typeData={typeChartData} />
      </div>

      {/* Recent + Upcoming */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Creators */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-heading font-semibold text-[var(--color-text-primary)]">
              Recent creators
            </h2>
            <Link href="/admin/clients" className="text-xs text-[var(--color-accent)] hover:underline">
              All creators →
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
                            style={{ backgroundColor: eventTypeColors[nextEvent.type] ?? '#9898b0' }}
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
                No creators yet
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
            <Link href="/admin/calendar" className="text-xs text-[var(--color-accent)] hover:underline">
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
