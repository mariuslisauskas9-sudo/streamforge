import { cn } from '@/lib/utils'

interface StatusBadgeProps {
  status: string
  className?: string
}

const STATUS_CONFIG: Record<string, { label: string; color: string; dot: string }> = {
  active:      { label: 'Active',       color: 'text-[var(--color-green)] bg-[rgba(0,217,126,0.1)] border-[rgba(0,217,126,0.2)]',   dot: 'bg-[var(--color-green)]' },
  idle:        { label: 'Inactive',     color: 'text-[var(--color-text-muted)] bg-[var(--color-bg-hover)] border-[var(--color-border)]', dot: 'bg-[var(--color-text-muted)]' },
  inactive:    { label: 'Inactive',     color: 'text-[var(--color-text-muted)] bg-[var(--color-bg-hover)] border-[var(--color-border)]', dot: 'bg-[var(--color-text-muted)]' },
  blocked:     { label: 'Blocked',      color: 'text-[var(--color-coral)] bg-[rgba(255,107,107,0.1)] border-[rgba(255,107,107,0.2)]', dot: 'bg-[var(--color-coral)]' },
  live:        { label: 'Live',         color: 'text-[var(--color-coral)] bg-[rgba(255,107,107,0.1)] border-[rgba(255,107,107,0.2)]', dot: 'bg-[var(--color-coral)] animate-pulse' },
  soon:        { label: 'Soon',         color: 'text-[var(--color-amber)] bg-[rgba(255,181,52,0.1)] border-[rgba(255,181,52,0.2)]',   dot: 'bg-[var(--color-amber)]' },
  free:        { label: 'Free',         color: 'text-[var(--color-text-muted)] bg-[var(--color-bg-hover)] border-[var(--color-border)]', dot: 'bg-[var(--color-text-muted)]' },
  stream:      { label: 'Stream',       color: 'text-[var(--color-coral)] bg-[rgba(255,107,107,0.1)] border-[rgba(255,107,107,0.2)]', dot: 'bg-[var(--color-coral)]' },
  youtube_video: { label: 'YouTube',   color: 'text-[var(--color-blue)] bg-[rgba(52,170,255,0.1)] border-[rgba(52,170,255,0.2)]',   dot: 'bg-[var(--color-blue)]' },
  contacted:   { label: 'Contacted',   color: 'text-[var(--color-blue)] bg-[rgba(52,170,255,0.1)] border-[rgba(52,170,255,0.2)]',   dot: 'bg-[var(--color-blue)]' },
  negotiating: { label: 'Negotiating', color: 'text-[var(--color-amber)] bg-[rgba(255,181,52,0.1)] border-[rgba(255,181,52,0.2)]',  dot: 'bg-[var(--color-amber)]' },
  pending:     { label: 'Pending',     color: 'text-[var(--color-text-secondary)] bg-[var(--color-bg-hover)] border-[var(--color-border)]', dot: 'bg-[var(--color-text-secondary)]' },
  rejected:    { label: 'Rejected',    color: 'text-[var(--color-coral)] bg-[rgba(255,107,107,0.1)] border-[rgba(255,107,107,0.2)]', dot: 'bg-[var(--color-coral)]' },
}

export default function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status] ?? { label: status, color: 'text-[var(--color-text-muted)] bg-[var(--color-bg-hover)] border-[var(--color-border)]', dot: 'bg-[var(--color-text-muted)]' }
  return (
    <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border', config.color, className)}>
      <span className={cn('w-1.5 h-1.5 rounded-full', config.dot)} />
      {config.label}
    </span>
  )
}
