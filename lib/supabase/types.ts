export type Role = 'admin' | 'client'
export type NegotiationStatus = 'pending' | 'contacted' | 'negotiating' | 'rejected'
export type Priority = 1 | 2 | 3
export type EventType = 'stream' | 'video' | 'collab' | 'meeting' | 'other'
export type Platform = 'twitch' | 'youtube' | 'kick' | 'tiktok' | 'instagram' | 'twitter' | 'clipper' | 'other'
export type UserStatus = 'active' | 'inactive' | 'pending'

export interface Profile {
  id: string
  role: Role
  full_name: string | null
  username: string | null
  avatar_url: string | null
  bio: string | null
  email: string | null
  discord: string | null
  timezone: string | null
  status: UserStatus
  client_since: string | null
  created_at: string
  updated_at: string
}

export interface PlatformLink {
  id: string
  profile_id: string
  platform: Platform
  url: string
  followers_count: number | null
  created_at: string
}

export interface StreamEvent {
  id: string
  profile_id: string
  title: string
  type: EventType
  scheduled_at: string
  duration_minutes: number | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface Candidate {
  id: string
  name: string
  platform: Platform
  channel_url: string | null
  audience_size: number | null
  average_views: number | null
  proposed_price: number | null
  notes: string | null
  comments: string | null
  negotiation_status: NegotiationStatus
  priority: Priority
  created_at: string
  updated_at: string
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

export interface ProfileWithDetails extends Profile {
  platform_links: PlatformLink[]
  events: StreamEvent[]
  admin_notes: AdminNote[]
}

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile
        Insert: Omit<Profile, 'created_at' | 'updated_at'>
        Update: Partial<Omit<Profile, 'id' | 'created_at' | 'updated_at'>>
      }
      platform_links: {
        Row: PlatformLink
        Insert: Omit<PlatformLink, 'id' | 'created_at'>
        Update: Partial<Omit<PlatformLink, 'id' | 'created_at'>>
      }
      events: {
        Row: StreamEvent
        Insert: Omit<StreamEvent, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<StreamEvent, 'id' | 'created_at' | 'updated_at'>>
      }
      candidates: {
        Row: Candidate
        Insert: Omit<Candidate, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Candidate, 'id' | 'created_at' | 'updated_at'>>
      }
      admin_notes: {
        Row: AdminNote
        Insert: Omit<AdminNote, 'id' | 'created_at'>
        Update: Partial<Omit<AdminNote, 'id' | 'created_at'>>
      }
    }
  }
}
