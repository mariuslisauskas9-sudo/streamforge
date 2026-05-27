import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(dateStr: string | Date) {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(dateStr))
}

export function formatDateTime(dateStr: string | Date) {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateStr))
}

export function formatFollowers(n: number | null) {
  if (!n) return '—'
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return n.toString()
}

export function getInitials(name: string | null) {
  if (!name) return '?'
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
}

export const platformLabels: Record<string, string> = {
  twitch: 'Twitch',
  youtube: 'YouTube',
  kick: 'Kick',
  tiktok: 'TikTok',
  instagram: 'Instagram',
  twitter: 'X (Twitter)',
  other: 'Other',
}

export const eventTypeLabels: Record<string, string> = {
  stream: 'Stream',
  video: 'YouTube Video',
  collab: 'Collab',
  meeting: 'Meeting',
  other: 'Other',
}

export const eventTypeColors: Record<string, string> = {
  stream: '#ff6b6b',
  video: '#34aaff',
  collab: '#00d97e',
  meeting: '#ffb534',
  other: '#9898b0',
}

export const negotiationStatusLabels: Record<string, string> = {
  pending:     'Pending',
  contacted:   'Contacted',
  negotiating: 'Negotiating',
  rejected:    'Rejected',
}

export const priorityLabels: Record<string, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
}

export const statusLabels: Record<string, string> = {
  active: 'Active',
  inactive: 'Inactive',
  pending: 'Pending',
}

export const PLATFORM_LABELS = platformLabels
export const STATUS_LABELS = statusLabels
export const NEGOTIATION_LABELS = negotiationStatusLabels
