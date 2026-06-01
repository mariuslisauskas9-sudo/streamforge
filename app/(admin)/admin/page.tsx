import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { formatDate, formatDateTime, getInitials, eventTypeLabels, eventTypeColors } from '@/lib/utils'
import {
  Radio, Video, Users, CalendarDays, BarChart3, Award,
  CheckCircle2, Clock, Tv2, PlayCircle, XCircle,
} from 'lucide-react'
import Link from 'next/link'
import type { ElementType } from 'react'

// ─── Types ────────────────────────────────────────────────────────────────────

type ProfileSnippet = {
  full_name: string | null
  username: string | null
  avatar_url?: string | null
}

type EventWithProfile = {
  id: string
  title: string
  type: string
  scheduled_at: string
  profiles: ProfileSnippet | ProfileSnippet[] | null
}

type MonthEvent = {
  id: string
  profile_id: string
  type: string
  profiles: { full_name: string | null; username: string | null } | { full_name: string | null; username: string | null }[] | null
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getProfile(profiles: EventWithProfile['profiles']): ProfileSnippet | null {
  if (!profiles) return null
  return Array.isArray(profiles) ? profiles[0] : profiles
}

function getMonthProfile(profiles: MonthEvent['profiles']): { full_name: string | null; username: string | null } | null {
  if (!profiles) return null
  return Array.isArray(profiles) ? profiles[0] : profiles
}

function daysUntilLabel(dateStr: string, now: Date): string {
  const diff = Math.floor((new Date(dateStr).getTime() - now.getTime()) / 86400000)
  if (diff <= 0) return 'Today'
  if (diff === 1) return 'Tomorrow'
  return `in ${diff} days`
}

function daysUntilStyle(dateStr: string, now: Date): { color: string; bg: string } {
  const diff = Math.floor((new Date(dateStr).getTime() - now.getTime()) / 86400000)
  if (diff <= 1) return { color: '#00d97e', bg: 'rgba(0,217,126,0.12)' }
  if (diff <= 3) return { color: '#ffb534', bg: 'rgba(255,181,52,0.12)' }
  return { color: '#9898b0', bg: 'rgba(152,152,176,0.1)' }
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: string }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-muted)] shrink-0">
        {children}
      </span>
      <div className="flex-1 h-px bg-[var(--color-border)]" />
    </div>
  )
}

function StatCard({
  icon: Icon,
  iconColor,
  iconBg,
  value,
  label,
  sub,
}: {
  icon: ElementType
  iconColor: string
  iconBg: string
  value: number | string
  label: string
  sub?: string
}) {
  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-muted)]">
          {label}
        </p>
        <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: iconBg }}>
          <Icon className="w-3.5 h-3.5" style={{ color: iconColor }} />
        </div>
      </div>
      <p className="text-3xl font-heading font-bold text-[var(--color-text-primary)] leading-none">
        {value}
      </p>
      {sub && (
        <p className="text-xs text-[var(--color-text-muted)] -mt-1">{sub}</p>
      )}
    </Card>
  )
}

function EmptyState({ label }: { label: string }) {
  return (
    <p className="text-sm text-[var(--color-text-muted)] text-center py-8">{label}</p>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function AdminDashboard() {
  const supabase = await createClient()

  const today = new Date()
  const now = today.toISOString()
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1).toISOString()
  const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 1).toISOString()
  const next7 = new Date(today.getTime() + 7 * 86400000).toISOString()
  const monthLabel = today.toLocaleString('en-US', { month: 'long' })

  const [
    { count: streamsThisMonth },
    { count: streamsCompleted },
    { count: videosThisMonth },
    { count: videosCompleted },
    { count: activeCreators },
    { count: next7DaysCount },
    { data: monthEventsRaw },
    { data: upcomingStreamsRaw },
    { data: upcomingVideosRaw },
    { data: recentActivityRaw },
    { data: xPostsMonthRaw },
  ] = await Promise.all([
    supabase.from('events').select('*', { count: 'exact', head: true })
      .eq('type', 'stream').gte('scheduled_at', monthStart).lt('scheduled_at', monthEnd),
    supabase.from('events').select('*', { count: 'exact', head: true })
      .eq('type', 'stream').gte('scheduled_at', monthStart).lt('scheduled_at', now),
    supabase.from('events').select('*', { count: 'exact', head: true })
      .eq('type', 'video').gte('scheduled_at', monthStart).lt('scheduled_at', monthEnd),
    supabase.from('events').select('*', { count: 'exact', head: true })
      .eq('type', 'video').gte('scheduled_at', monthStart).lt('scheduled_at', now),
    supabase.from('profiles').select('*', { count: 'exact', head: true })
      .eq('role', 'client').eq('status', 'active'),
    supabase.from('events').select('*', { count: 'exact', head: true })
      .gte('scheduled_at', now).lt('scheduled_at', next7),
    supabase.from('events')
      .select('id, profile_id, type, profiles(full_name, username)')
      .gte('scheduled_at', monthStart).lt('scheduled_at', monthEnd),
    supabase.from('events')
      .select('id, title, scheduled_at, profiles(full_name, username, avatar_url)')
      .eq('type', 'stream').gte('scheduled_at', now)
      .order('scheduled_at', { ascending: true }).limit(5),
    supabase.from('events')
      .select('id, title, scheduled_at, profiles(full_name, username, avatar_url)')
      .eq('type', 'video').gte('scheduled_at', now)
      .order('scheduled_at', { ascending: true }).limit(5),
    supabase.from('events')
      .select('id, title, type, scheduled_at, profiles(full_name, username, avatar_url)')
      .lt('scheduled_at', now)
      .order('scheduled_at', { ascending: false }).limit(5),
    supabase.from('x_posts')
      .select('payment_amount')
      .gte('created_at', monthStart).lt('created_at', monthEnd),
  ])

  const monthEvents = (monthEventsRaw ?? []) as MonthEvent[]
  const upcomingStreams = (upcomingStreamsRaw ?? []) as EventWithProfile[]
  const upcomingVideos = (upcomingVideosRaw ?? []) as EventWithProfile[]
  const recentActivity = (recentActivityRaw ?? []) as EventWithProfile[]

  const totalMonthEvents = monthEvents.length

  const xPostsThisMonth = xPostsMonthRaw?.length ?? 0

  // Most active creator this month
  const creatorMap = new Map<string, { name: string; count: number }>()
  for (const ev of monthEvents) {
    const p = getMonthProfile(ev.profiles)
    const name = p?.full_name ?? p?.username ?? 'Unknown'
    const entry = creatorMap.get(ev.profile_id)
    entry ? entry.count++ : creatorMap.set(ev.profile_id, { name, count: 1 })
  }
  const mostActive = Array.from(creatorMap.values()).sort((a, b) => b.count - a.count)[0] ?? null

  return (
    <div className="p-6 max-w-6xl mx-auto animate-in">

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-heading font-bold text-[var(--color-text-primary)]">
          Dashboard
        </h1>
        <p className="text-sm text-[var(--color-text-muted)] mt-1">{formatDate(today)}</p>
      </div>

      {/* Row 1 — This month */}
      <div className="mb-8">
        <SectionLabel>{`${monthLabel} — this month`}</SectionLabel>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <StatCard
            icon={Radio}
            iconColor="#ff6b6b"
            iconBg="rgba(255,107,107,0.12)"
            value={streamsThisMonth ?? 0}
            label="Streams scheduled"
            sub="Total this month"
          />
          <StatCard
            icon={CheckCircle2}
            iconColor="#00d97e"
            iconBg="rgba(0,217,126,0.12)"
            value={streamsCompleted ?? 0}
            label="Streams completed"
            sub="Done this month"
          />
          <StatCard
            icon={Video}
            iconColor="#34aaff"
            iconBg="rgba(52,170,255,0.12)"
            value={videosThisMonth ?? 0}
            label="Videos scheduled"
            sub="Total this month"
          />
          <StatCard
            icon={CheckCircle2}
            iconColor="#7c6aff"
            iconBg="rgba(124,106,255,0.12)"
            value={videosCompleted ?? 0}
            label="Videos completed"
            sub="Done this month"
          />
          <StatCard
            icon={XCircle}
            iconColor="#1d9bf0"
            iconBg="rgba(29,155,240,0.12)"
            value={xPostsThisMonth}
            label="X posts"
            sub="This month"
          />
        </div>
      </div>

      {/* Row 2 — Overview */}
      <div className="mb-8">
        <SectionLabel>Overview</SectionLabel>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={Users}
            iconColor="var(--color-accent)"
            iconBg="rgba(124,106,255,0.12)"
            value={activeCreators ?? 0}
            label="Active creators"
            sub="On the roster"
          />
          <StatCard
            icon={BarChart3}
            iconColor="#ffb534"
            iconBg="rgba(255,181,52,0.12)"
            value={totalMonthEvents}
            label="Events this month"
            sub="All types"
          />
          <StatCard
            icon={Clock}
            iconColor="#00d97e"
            iconBg="rgba(0,217,126,0.12)"
            value={next7DaysCount ?? 0}
            label="Next 7 days"
            sub="Upcoming events"
          />
          <Card className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-muted)]">
                Most active
              </p>
              <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 bg-[rgba(255,181,52,0.12)]">
                <Award className="w-3.5 h-3.5 text-[#ffb534]" />
              </div>
            </div>
            {mostActive ? (
              <>
                <p className="text-lg font-heading font-bold text-[var(--color-text-primary)] leading-tight truncate">
                  {mostActive.name}
                </p>
                <p className="text-xs text-[var(--color-text-muted)] -mt-1">
                  {mostActive.count} event{mostActive.count !== 1 ? 's' : ''} this month
                </p>
              </>
            ) : (
              <>
                <p className="text-3xl font-heading font-bold text-[var(--color-text-primary)] leading-none">—</p>
                <p className="text-xs text-[var(--color-text-muted)] -mt-1">No events yet</p>
              </>
            )}
          </Card>
        </div>
      </div>

      {/* Upcoming streams + videos */}
      <div className="grid lg:grid-cols-2 gap-6 mb-6">

        {/* Upcoming streams */}
        <Card className="flex flex-col gap-0 p-0 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--color-border)]">
            <div className="flex items-center gap-2">
              <Tv2 className="w-4 h-4 text-[#ff6b6b]" />
              <h2 className="text-sm font-heading font-semibold text-[var(--color-text-primary)]">
                Upcoming streams
              </h2>
            </div>
            <Link href="/admin/calendar" className="text-xs text-[var(--color-accent)] hover:underline">
              Calendar →
            </Link>
          </div>
          <div className="divide-y divide-[var(--color-border)]">
            {upcomingStreams.length ? upcomingStreams.map((ev) => {
              const p = getProfile(ev.profiles)
              const style = daysUntilStyle(ev.scheduled_at, today)
              return (
                <div key={ev.id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-[var(--color-bg-hover)] transition-colors">
                  <Avatar className="w-8 h-8 shrink-0">
                    <AvatarImage src={p?.avatar_url ?? undefined} />
                    <AvatarFallback className="text-xs">{getInitials(p?.full_name ?? null)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">
                      {ev.title}
                    </p>
                    <p className="text-xs text-[var(--color-text-muted)] truncate mt-0.5">
                      {p?.full_name ?? p?.username ?? '—'} · {formatDateTime(ev.scheduled_at)}
                    </p>
                  </div>
                  <span
                    className="text-xs font-semibold px-2 py-0.5 rounded-md shrink-0"
                    style={{ color: style.color, background: style.bg }}
                  >
                    {daysUntilLabel(ev.scheduled_at, today)}
                  </span>
                </div>
              )
            }) : (
              <EmptyState label="No upcoming streams" />
            )}
          </div>
        </Card>

        {/* Upcoming videos */}
        <Card className="flex flex-col gap-0 p-0 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--color-border)]">
            <div className="flex items-center gap-2">
              <PlayCircle className="w-4 h-4 text-[#34aaff]" />
              <h2 className="text-sm font-heading font-semibold text-[var(--color-text-primary)]">
                Upcoming YouTube videos
              </h2>
            </div>
            <Link href="/admin/calendar" className="text-xs text-[var(--color-accent)] hover:underline">
              Calendar →
            </Link>
          </div>
          <div className="divide-y divide-[var(--color-border)]">
            {upcomingVideos.length ? upcomingVideos.map((ev) => {
              const p = getProfile(ev.profiles)
              const style = daysUntilStyle(ev.scheduled_at, today)
              return (
                <div key={ev.id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-[var(--color-bg-hover)] transition-colors">
                  <Avatar className="w-8 h-8 shrink-0">
                    <AvatarImage src={p?.avatar_url ?? undefined} />
                    <AvatarFallback className="text-xs">{getInitials(p?.full_name ?? null)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">
                      {ev.title}
                    </p>
                    <p className="text-xs text-[var(--color-text-muted)] truncate mt-0.5">
                      {p?.full_name ?? p?.username ?? '—'} · {formatDateTime(ev.scheduled_at)}
                    </p>
                  </div>
                  <span
                    className="text-xs font-semibold px-2 py-0.5 rounded-md shrink-0"
                    style={{ color: style.color, background: style.bg }}
                  >
                    {daysUntilLabel(ev.scheduled_at, today)}
                  </span>
                </div>
              )
            }) : (
              <EmptyState label="No upcoming videos" />
            )}
          </div>
        </Card>

      </div>

      {/* Recent activity */}
      <Card className="p-0 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--color-border)]">
          <div className="flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-[var(--color-accent)]" />
            <h2 className="text-sm font-heading font-semibold text-[var(--color-text-primary)]">
              Recent activity
            </h2>
          </div>
          <span className="text-xs text-[var(--color-text-muted)]">Last 5 completed events</span>
        </div>
        <div className="divide-y divide-[var(--color-border)]">
          {recentActivity.length ? recentActivity.map((ev) => {
            const p = getProfile(ev.profiles)
            const typeColor = eventTypeColors[ev.type] ?? '#9898b0'
            return (
              <div key={ev.id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-[var(--color-bg-hover)] transition-colors">
                <Avatar className="w-8 h-8 shrink-0">
                  <AvatarImage src={p?.avatar_url ?? undefined} />
                  <AvatarFallback className="text-xs">{getInitials(p?.full_name ?? null)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">
                    {ev.title}
                  </p>
                  <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                    {p?.full_name ?? p?.username ?? '—'}
                  </p>
                </div>
                <span
                  className="text-xs font-semibold px-2 py-0.5 rounded-md shrink-0"
                  style={{ color: typeColor, background: `${typeColor}20` }}
                >
                  {eventTypeLabels[ev.type] ?? ev.type}
                </span>
                <p className="text-xs text-[var(--color-text-muted)] shrink-0 hidden sm:block">
                  {formatDateTime(ev.scheduled_at)}
                </p>
              </div>
            )
          }) : (
            <EmptyState label="No completed events yet" />
          )}
        </div>
      </Card>

    </div>
  )
}
