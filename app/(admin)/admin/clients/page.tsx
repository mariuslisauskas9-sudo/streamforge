import { createClient } from '@/lib/supabase/server'
import { AddCreatorModal } from '@/components/admin/add-creator-modal'
import { CreatorGrid } from '@/components/admin/creator-grid'
import { XPostsSection } from '@/components/admin/x-posts-section'
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

  // X Creators: fetch posts only
  if (isXCreators) {
    const { data: postsRaw } = await supabase
      .from('x_posts')
      .select('*')
      .order('created_at', { ascending: false })

    const xPosts = (postsRaw ?? []) as XPost[]

    return (
      <div className="p-6 max-w-6xl mx-auto animate-in">
        <div className="mb-7">
          <h1 className="text-2xl font-heading font-bold text-[var(--color-text-primary)]">
            {sectionTitle}
          </h1>
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
