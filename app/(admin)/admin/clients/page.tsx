import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { AddCreatorModal } from '@/components/admin/add-creator-modal'
import { CreatorGrid } from '@/components/admin/creator-grid'
import { XPostsSection } from '@/components/admin/x-posts-section'
import { Button } from '@/components/ui/button'
import StatusBadge from '@/components/StatusBadge'
import PlatformBadge from '@/components/PlatformBadge'
import { CalendarDays } from 'lucide-react'
import type { XPost } from '@/app/actions/x-posts'

type ClientRow = {
  id: string
  full_name: string | null
  username: string | null
  avatar_url: string | null
  status: string
  client_since: string | null
  platform_links: { platform: string; url: string; followers_count: number | null }[]
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
  const isXCreators = platform === 'x-creators'
  const sectionTitle = platform ? (SECTION_TITLE_MAP[platform] ?? 'Creators') : 'Creators'

  // X Creators: fetch posts + the shared x-posts profile
  if (isXCreators) {
    const [{ data: postsRaw }, { data: xPostsProfile }] = await Promise.all([
      supabase
        .from('x_posts')
        .select('*')
        .order('created_at', { ascending: false }),
      supabase
        .from('profiles')
        .select('id')
        .eq('username', 'x-posts')
        .maybeSingle(),
    ])

    const xPosts = (postsRaw ?? []) as XPost[]

    console.log('[x-posts card] xPostsProfile:', xPostsProfile)

    return (
      <div className="p-6 max-w-6xl mx-auto animate-in">
        <div className="mb-7">
          <h1 className="text-2xl font-heading font-bold text-[var(--color-text-primary)]">
            {sectionTitle}
          </h1>
        </div>

        {/* Fixed X Posts Schedule card */}
        <div className="bg-[var(--color-bg-card)] border border-[rgba(29,155,240,0.25)] rounded-xl p-5 flex items-center gap-4 mb-6 hover:border-[rgba(29,155,240,0.4)] transition-colors">
          <div className="w-11 h-11 rounded-full bg-black border border-[rgba(29,155,240,0.35)] flex items-center justify-center shrink-0">
            <span className="text-sm font-black text-[#1d9bf0]">X</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-semibold text-[var(--color-text-primary)]">X Posts Schedule</p>
              <StatusBadge status={xPostsProfile ? 'active' : 'pending'} />
            </div>
            <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
              {xPostsProfile
                ? '@x-posts · Shared creator for the X posting calendar'
                : 'Account not set up — go to Settings → System accounts'}
            </p>
          </div>
          <PlatformBadge platform="twitter" className="shrink-0 hidden sm:inline-flex" />
          {xPostsProfile?.id ? (
            <Button asChild size="sm" className="shrink-0">
              <Link href={`/admin/calendar?client=${xPostsProfile.id}`}>
                <CalendarDays className="w-3.5 h-3.5 mr-1.5" />
                View Calendar
              </Link>
            </Button>
          ) : (
            <Button size="sm" className="shrink-0" disabled>
              <CalendarDays className="w-3.5 h-3.5 mr-1.5" />
              Not set up
            </Button>
          )}
        </div>

        <XPostsSection initialPosts={xPosts} />
      </div>
    )
  }

  // All other platforms: fetch creators + events
  const now = new Date().toISOString()
  const [{ data: clientsRaw }, { data: eventsRaw }] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, full_name, username, avatar_url, status, client_since, platform_links(platform, url, followers_count)')
      .eq('role', 'client')
      .order('created_at', { ascending: false }),
    supabase
      .from('events')
      .select('id, profile_id, title, type, scheduled_at')
      .gte('scheduled_at', now)
      .order('scheduled_at', { ascending: true }),
  ])

  const allClients = (clientsRaw ?? []) as ClientRow[]
  const platformFilter = platform ? (PLATFORM_FILTER_MAP[platform] ?? null) : null

  const clients = platformFilter
    ? allClients.filter((c) =>
        c.platform_links.some((pl) => platformFilter.includes(pl.platform))
      )
    : allClients

  const nextEvents: Record<string, NextEvent> = {}
  for (const ev of (eventsRaw ?? []) as NextEvent[]) {
    if (!nextEvents[ev.profile_id]) nextEvents[ev.profile_id] = ev
  }

  return (
    <div className="p-6 max-w-6xl mx-auto animate-in">
      <div className="flex items-start justify-between mb-7">
        <div>
          <h1 className="text-2xl font-heading font-bold text-[var(--color-text-primary)]">
            {sectionTitle}
          </h1>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">
            {clients.length} creator{clients.length !== 1 ? 's' : ''}
          </p>
        </div>
        <AddCreatorModal />
      </div>

      <CreatorGrid
        key={platform ?? 'all'}
        initialClients={clients}
        nextEvents={nextEvents}
        platformFilter={platformFilter}
      />
    </div>
  )
}
