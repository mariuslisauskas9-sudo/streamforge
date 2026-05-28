import { createClient } from '@/lib/supabase/server'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import StatusBadge from '@/components/StatusBadge'
import PlatformBadge from '@/components/PlatformBadge'
import { CandidatesSection } from '@/components/admin/candidates-section'
import {
  formatFollowers, formatDateTime, getInitials,
  eventTypeColors, eventTypeLabels, platformLabels,
} from '@/lib/utils'
import { Users, UserSearch, CalendarDays } from 'lucide-react'
import Link from 'next/link'
import type { Platform } from '@/types'

type ClientRow = {
  id: string
  full_name: string | null
  username: string | null
  avatar_url: string | null
  status: string
  client_since: string | null
  platform_links: { platform: string; url: string; followers_count: number | null }[]
}

type CandidateRow = {
  id: string
  name: string
  platform: string
  channel_url: string | null
  audience_size: number | null
  average_views: number | null
  proposed_price: number | null
  notes: string | null
  comments: string | null
  negotiation_status: string
  priority: number
}

type NextEvent = {
  id: string
  profile_id: string
  title: string
  type: string
  scheduled_at: string
}

const PLATFORM_FILTER_MAP: Record<string, string[]> = {
  streamers:    ['twitch', 'kick'],
  youtubers:    ['youtube'],
  instagramers: ['instagram'],
  clippers:     ['clipper'],
  'x-creators': ['twitter'],
}

const SECTION_TITLE_MAP: Record<string, string> = {
  streamers:    'Streamers',
  youtubers:    'YouTubers',
  instagramers: 'Instagramers',
  clippers:     'Clippers',
  'x-creators': 'X Creators',
}

export default async function CreatorsPage({
  searchParams,
}: {
  searchParams: Promise<{ platform?: string }>
}) {
  const { platform } = await searchParams
  const supabase = await createClient()
  const now = new Date().toISOString()

  const [{ data: clientsRaw }, { data: candidatesRaw }, { data: eventsRaw }] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, full_name, username, avatar_url, status, client_since, platform_links(platform, url, followers_count)')
      .eq('role', 'client')
      .order('created_at', { ascending: false }),
    supabase
      .from('candidates')
      .select('*')
      .order('created_at', { ascending: false }),
    supabase
      .from('events')
      .select('id, profile_id, title, type, scheduled_at')
      .gte('scheduled_at', now)
      .order('scheduled_at', { ascending: true }),
  ])

  const allClients = (clientsRaw ?? []) as ClientRow[]
  const allCandidates = (candidatesRaw ?? []) as CandidateRow[]

  const platformFilter = platform ? (PLATFORM_FILTER_MAP[platform] ?? null) : null
  const sectionTitle = platform ? (SECTION_TITLE_MAP[platform] ?? 'Creators') : 'Creators'

  const clients = platformFilter
    ? allClients.filter((c) =>
        c.platform_links.some((pl) => platformFilter.includes(pl.platform))
      )
    : allClients

  const candidates = platformFilter
    ? allCandidates.filter((c) => platformFilter.includes(c.platform))
    : allCandidates

  const nextEventMap = new Map<string, NextEvent>()
  for (const ev of (eventsRaw ?? []) as NextEvent[]) {
    if (!nextEventMap.has(ev.profile_id)) nextEventMap.set(ev.profile_id, ev)
  }

  return (
    <div className="p-6 max-w-6xl mx-auto animate-in">
      <div className="flex items-start justify-between mb-7">
        <div>
          <h1 className="text-2xl font-heading font-bold text-[var(--color-text-primary)]">
            {sectionTitle}
          </h1>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">
            {clients.length} hired · {candidates.length} candidates
          </p>
        </div>
      </div>

      <Tabs defaultValue="hired">
        <TabsList>
          <TabsTrigger value="hired">
            <Users className="w-3.5 h-3.5" />
            Hired ({clients.length})
          </TabsTrigger>
          <TabsTrigger value="candidates">
            <UserSearch className="w-3.5 h-3.5" />
            Candidates ({candidates.length})
          </TabsTrigger>
        </TabsList>

        {/* Hired creators */}
        <TabsContent value="hired">
          {clients.length ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {clients.map((c) => {
                const platforms = c.platform_links ?? []
                const topPlatform = platforms[0]
                const nextEvent = nextEventMap.get(c.id)

                return (
                  <div
                    key={c.id}
                    className="group bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-5 flex flex-col hover:border-[var(--color-accent)]/40 hover:shadow-[0_0_20px_rgba(124,106,255,0.08)] transition-all duration-200"
                  >
                    {/* Identity */}
                    <div className="flex items-start gap-3 mb-4">
                      <Avatar className="w-11 h-11 shrink-0">
                        <AvatarImage src={c.avatar_url ?? undefined} />
                        <AvatarFallback>{getInitials(c.full_name)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-[var(--color-text-primary)] truncate group-hover:text-[var(--color-accent)] transition-colors">
                          {c.full_name ?? 'Unknown'}
                        </p>
                        <p className="text-xs text-[var(--color-text-muted)]">
                          @{c.username ?? '—'}
                        </p>
                      </div>
                      <StatusBadge status={c.status} />
                    </div>

                    {/* Platforms */}
                    {platforms.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {platforms.slice(0, 3).map((p) => (
                          <PlatformBadge key={p.platform} platform={p.platform as Platform} />
                        ))}
                        {platforms.length > 3 && (
                          <span className="text-xs text-[var(--color-text-muted)] px-2 py-1">
                            +{platforms.length - 3}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Follower count */}
                    {topPlatform?.followers_count != null && topPlatform.followers_count > 0 && (
                      <p className="text-xs text-[var(--color-text-muted)] mb-3">
                        {formatFollowers(topPlatform.followers_count)} followers ·{' '}
                        {platformLabels[topPlatform.platform] ?? topPlatform.platform}
                      </p>
                    )}

                    <div className="border-t border-[var(--color-border)] mb-3" />

                    {/* Next event */}
                    <div className="mb-4 min-h-[2.5rem]">
                      {nextEvent ? (
                        <div className="flex items-start gap-2 min-w-0">
                          <div
                            className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0"
                            style={{ backgroundColor: eventTypeColors[nextEvent.type] ?? '#9898b0' }}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-[var(--color-text-primary)] truncate">
                              {nextEvent.title}
                            </p>
                            <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                              {formatDateTime(nextEvent.scheduled_at)}
                            </p>
                          </div>
                          <span
                            className="text-xs px-1.5 py-0.5 rounded font-medium shrink-0"
                            style={{
                              color: eventTypeColors[nextEvent.type],
                              background: `${eventTypeColors[nextEvent.type]}20`,
                            }}
                          >
                            {eventTypeLabels[nextEvent.type] ?? nextEvent.type}
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-xs text-[var(--color-text-muted)]">
                          <CalendarDays className="w-3.5 h-3.5 shrink-0" />
                          No upcoming events
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 mt-auto">
                      <Button asChild variant="secondary" size="sm" className="flex-1">
                        <Link href={`/admin/clients/${c.id}`}>View profile →</Link>
                      </Button>
                      <Button asChild variant="secondary" size="icon-sm" title="View in calendar">
                        <Link href={`/admin/calendar?client=${c.id}`}>
                          <CalendarDays className="w-3.5 h-3.5" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <div className="w-12 h-12 rounded-xl bg-[var(--color-bg-card)] border border-[var(--color-border)] flex items-center justify-center">
                <Users className="w-5 h-5 text-[var(--color-text-muted)]" />
              </div>
              <p className="text-sm font-medium text-[var(--color-text-primary)]">No creators</p>
              <p className="text-xs text-[var(--color-text-muted)]">
                {platformFilter
                  ? `No hired creators for this platform yet.`
                  : `You don't have any hired creators yet.`}
              </p>
            </div>
          )}
        </TabsContent>

        {/* Candidates */}
        <TabsContent value="candidates">
          <CandidatesSection key={platform ?? 'all'} initialCandidates={candidates} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
