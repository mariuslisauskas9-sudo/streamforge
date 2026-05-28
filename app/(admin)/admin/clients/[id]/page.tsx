import { type ReactNode } from 'react'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import StatusBadge from '@/components/StatusBadge'
import PlatformBadge from '@/components/PlatformBadge'
import { StatusButton } from './status-button'
import { EventsSection } from './events-section'
import { NotesSection } from './notes-section'
import {
  formatDate, formatFollowers, getInitials,
} from '@/lib/utils'
import {
  ArrowLeft, BarChart3, CalendarDays, LinkIcon, MessageSquare, Radio, Users, Video,
} from 'lucide-react'
import Link from 'next/link'
import type { Platform } from '@/types'

type PlatformLinkRow = {
  id: string
  platform: string
  url: string
  followers_count: number | null
}

type EventRow = {
  id: string
  profile_id: string
  title: string
  type: string
  scheduled_at: string
  duration_minutes: number | null
  notes: string | null
}

type NoteRow = {
  id: string
  profile_id: string
  content: string
  created_at: string
}

function StatCard({
  icon,
  value,
  label,
  color,
}: {
  icon: ReactNode
  value: number
  label: string
  color: string
}) {
  return (
    <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-4 flex items-center gap-3">
      <div
        className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
        style={{ background: `${color}20` }}
      >
        <span style={{ color }}>{icon}</span>
      </div>
      <div className="min-w-0">
        <p className="text-xl font-bold font-heading text-[var(--color-text-primary)]">{value}</p>
        <p className="text-xs text-[var(--color-text-muted)] truncate">{label}</p>
      </div>
    </div>
  )
}

export default async function ClientProfilePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const [{ data: profile }, { data: linksRaw }, { data: eventsRaw }, { data: notesRaw }] =
    await Promise.all([
      supabase
        .from('profiles')
        .select('id, full_name, username, avatar_url, bio, email, discord, status, client_since')
        .eq('id', id)
        .eq('role', 'client')
        .single(),
      supabase
        .from('platform_links')
        .select('id, platform, url, followers_count')
        .eq('profile_id', id)
        .order('created_at', { ascending: true }),
      supabase
        .from('events')
        .select('id, profile_id, title, type, scheduled_at, duration_minutes, notes')
        .eq('profile_id', id)
        .order('scheduled_at', { ascending: true }),
      supabase
        .from('admin_notes')
        .select('id, profile_id, content, created_at')
        .eq('profile_id', id)
        .order('created_at', { ascending: false }),
    ])

  if (!profile) notFound()

  const platformLinks = (linksRaw ?? []) as PlatformLinkRow[]
  const events = (eventsRaw ?? []) as EventRow[]
  const notes = (notesRaw ?? []) as NoteRow[]

  const now = new Date()
  const nowIso = now.toISOString()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

  const totalEvents = events.length
  const upcomingEvents = events.filter((e) => e.scheduled_at >= nowIso).length
  const streamsThisMonth = events.filter(
    (e) => e.type === 'stream' && e.scheduled_at >= monthStart,
  ).length
  const videosThisMonth = events.filter(
    (e) => e.type === 'video' && e.scheduled_at >= monthStart,
  ).length

  const totalFollowers = platformLinks.reduce(
    (sum, p) => sum + (p.followers_count ?? 0),
    0,
  )

  return (
    <div className="p-6 max-w-5xl mx-auto animate-in">
      {/* Back */}
      <Link
        href="/admin/clients"
        className="inline-flex items-center gap-1.5 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to creators
      </Link>

      {/* Header card */}
      <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-2xl p-6 mb-5">
        <div className="flex items-start gap-5">
          <Avatar className="w-20 h-20 shrink-0">
            <AvatarImage src={profile.avatar_url ?? undefined} />
            <AvatarFallback className="text-2xl">{getInitials(profile.full_name)}</AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div className="min-w-0">
                <h1 className="text-xl font-heading font-bold text-[var(--color-text-primary)] truncate">
                  {profile.full_name ?? 'Unknown'}
                </h1>
                <p className="text-sm text-[var(--color-text-muted)]">
                  @{profile.username ?? '—'}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <StatusBadge status={profile.status ?? 'inactive'} />
                <StatusButton profileId={id} currentStatus={profile.status ?? 'inactive'} />
              </div>
            </div>

            {profile.bio && (
              <p className="text-sm text-[var(--color-text-secondary)] mt-2 max-w-lg">
                {profile.bio}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-[var(--color-text-muted)]">
              {profile.email && <span>{profile.email}</span>}
              {profile.discord && <span>Discord: {profile.discord}</span>}
              {profile.client_since && (
                <span>Client since {formatDate(profile.client_since)}</span>
              )}
            </div>
          </div>
        </div>

        {platformLinks.length > 0 && (
          <>
            <Separator className="my-4" />
            <div className="flex flex-wrap gap-3 items-center">
              {platformLinks.map((p) => (
                <div key={p.id} className="flex items-center gap-1.5">
                  <PlatformBadge platform={p.platform as Platform} />
                  {p.followers_count != null && p.followers_count > 0 && (
                    <span className="text-xs text-[var(--color-text-muted)]">
                      {formatFollowers(p.followers_count)}
                    </span>
                  )}
                  {p.url && (
                    <a
                      href={p.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[var(--color-text-muted)] hover:text-[var(--color-accent)] transition-colors"
                    >
                      <LinkIcon className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              ))}
              {totalFollowers > 0 && (
                <span className="text-xs text-[var(--color-text-muted)] flex items-center gap-1 ml-1">
                  <Users className="w-3.5 h-3.5" />
                  {formatFollowers(totalFollowers)} total
                </span>
              )}
            </div>
          </>
        )}
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <StatCard
          icon={<BarChart3 className="w-4 h-4" />}
          value={totalEvents}
          label="Total events"
          color="#7c6aff"
        />
        <StatCard
          icon={<CalendarDays className="w-4 h-4" />}
          value={upcomingEvents}
          label="Upcoming"
          color="#00d97e"
        />
        <StatCard
          icon={<Radio className="w-4 h-4" />}
          value={streamsThisMonth}
          label="Streams this month"
          color="#ff6b6b"
        />
        <StatCard
          icon={<Video className="w-4 h-4" />}
          value={videosThisMonth}
          label="Videos this month"
          color="#34aaff"
        />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="events">
        <TabsList>
          <TabsTrigger value="events">
            <CalendarDays className="w-3.5 h-3.5" />
            Events ({totalEvents})
          </TabsTrigger>
          <TabsTrigger value="notes">
            <MessageSquare className="w-3.5 h-3.5" />
            Notes ({notes.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="events">
          <EventsSection initialEvents={events} profileId={id} />
        </TabsContent>

        <TabsContent value="notes">
          <NotesSection initialNotes={notes} profileId={id} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
