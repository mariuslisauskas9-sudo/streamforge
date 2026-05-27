export type UserRole = 'admin' | 'client'
export type UserStatus = 'active' | 'idle' | 'blocked'
export type Platform = 'twitch' | 'youtube' | 'kick' | 'instagram' | 'tiktok'
export type EventType = 'stream' | 'youtube_video'
export type NegotiationStatus = 'contacted' | 'negotiating' | 'pending' | 'rejected'

export interface Profile {
  id: string
  role: UserRole
  full_name: string | null
  username: string | null
  avatar_url: string | null
  bio: string | null
  email: string | null
  discord: string | null
  status: UserStatus | null
  client_since: string | null
  created_at: string
}

export interface PlatformLink {
  id: string
  profile_id: string
  platform: Platform
  url: string
  followers_count: number | null
}

export interface Event {
  id: string
  profile_id: string
  title: string
  type: EventType
  scheduled_at: string
  duration_minutes: number | null
  notes: string | null
  created_at: string
  profile?: Profile
}

export interface Candidate {
  id: string
  name: string | null
  platform: string | null
  audience_size: number | null
  notes: string | null
  negotiation_status: NegotiationStatus | null
  priority: number | null
  created_at: string
}

export interface AdminNote {
  id: string
  profile_id: string
  content: string
  created_at: string
}

export interface ProfileWithLinks extends Profile {
  platform_links: PlatformLink[]
}

export interface ProfileWithEvents extends Profile {
  events: Event[]
}
