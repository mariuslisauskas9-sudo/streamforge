import { cn } from '@/lib/utils'
import type { Platform } from '@/types'

interface PlatformBadgeProps {
  platform: Platform | string
  className?: string
  showLabel?: boolean
}

const PLATFORM_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  twitch:    { label: 'Twitch',      color: '#9146ff', bg: 'rgba(145,70,255,0.15)' },
  youtube:   { label: 'YouTube',     color: '#ff0000', bg: 'rgba(255,0,0,0.12)' },
  kick:      { label: 'Kick',        color: '#53fc18', bg: 'rgba(83,252,24,0.12)' },
  instagram: { label: 'Instagram',   color: '#e1306c', bg: 'rgba(225,48,108,0.12)' },
  tiktok:    { label: 'TikTok',      color: '#f0f0f5', bg: 'rgba(240,240,245,0.1)' },
  twitter:   { label: 'X (Twitter)', color: '#1d9bf0', bg: 'rgba(29,155,240,0.12)' },
  clipper:   { label: 'Clipper',     color: '#ff8c00', bg: 'rgba(255,140,0,0.12)' },
}

const PlatformIcon = ({ platform }: { platform: string }) => {
  const icons: Record<string, string> = {
    twitch: 'T', youtube: 'YT', kick: 'K', instagram: 'IG', tiktok: 'TK', twitter: 'X', clipper: 'CL',
  }
  return <span className="text-xs font-bold">{icons[platform] ?? platform[0].toUpperCase()}</span>
}

export default function PlatformBadge({ platform, className, showLabel = true }: PlatformBadgeProps) {
  const cfg = PLATFORM_CONFIG[platform] ?? { label: platform, color: 'var(--color-text-muted)', bg: 'var(--color-bg-hover)' }
  return (
    <span
      className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border', className)}
      style={{ color: cfg.color, background: cfg.bg, borderColor: `${cfg.color}33` }}
    >
      <PlatformIcon platform={platform} />
      {showLabel && cfg.label}
    </span>
  )
}
