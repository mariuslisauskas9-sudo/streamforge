'use client'

import { Suspense } from 'react'
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { logout } from '@/app/actions/auth'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  CalendarDays,
  Settings,
  LogOut,
  Zap,
  Tv2,
  PlayCircle,
  Camera,
  Scissors,
  XCircle,
} from 'lucide-react'

const CREATOR_ITEMS = [
  { label: 'Streamers', platform: 'streamers', icon: Tv2 },
  { label: 'YouTubers', platform: 'youtubers', icon: PlayCircle },
  { label: 'Instagramers', platform: 'instagramers', icon: Camera },
  { label: 'Clippers', platform: 'clippers', icon: Scissors },
  { label: 'X Creators', platform: 'x-creators', icon: XCircle },
]

function SidebarNav() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const currentPlatform = searchParams.get('platform')
  const onCreators = pathname.startsWith('/admin/clients')

  return (
    <nav className="flex-1 px-3 flex flex-col gap-1 overflow-y-auto py-1">
      <Link
        href="/admin"
        className={cn(
          'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
          pathname === '/admin'
            ? 'bg-[var(--color-accent)] text-white shadow-[0_0_15px_rgba(124,106,255,0.25)]'
            : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)]'
        )}
      >
        <LayoutDashboard className="w-4 h-4 shrink-0" />
        Dashboard
      </Link>

      {CREATOR_ITEMS.map(({ label, platform, icon: Icon }) => {
        const active = onCreators && currentPlatform === platform
        return (
          <Link
            key={platform}
            href={`/admin/clients?platform=${platform}`}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
              active
                ? 'bg-[var(--color-accent)] text-white shadow-[0_0_15px_rgba(124,106,255,0.25)]'
                : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)]'
            )}
          >
            <Icon className="w-4 h-4 shrink-0" />
            {label}
          </Link>
        )
      })}

      <Link
        href="/admin/calendar"
        className={cn(
          'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
          pathname.startsWith('/admin/calendar')
            ? 'bg-[var(--color-accent)] text-white shadow-[0_0_15px_rgba(124,106,255,0.25)]'
            : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)]'
        )}
      >
        <CalendarDays className="w-4 h-4 shrink-0" />
        Calendar
      </Link>

      <Link
        href="/admin/settings"
        className={cn(
          'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
          pathname.startsWith('/admin/settings')
            ? 'bg-[var(--color-accent)] text-white shadow-[0_0_15px_rgba(124,106,255,0.25)]'
            : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)]'
        )}
      >
        <Settings className="w-4 h-4 shrink-0" />
        Settings
      </Link>
    </nav>
  )
}

export function AdminSidebar() {
  return (
    <aside className="w-56 shrink-0 flex flex-col h-screen sticky top-0 bg-[var(--color-bg-secondary)] border-r border-[var(--color-border)]">
      {/* Logo */}
      <div className="px-5 py-5 flex items-center gap-2.5 border-b border-[var(--color-border)]">
        <div className="w-8 h-8 rounded-lg bg-[var(--color-accent)] flex items-center justify-center shadow-[0_0_20px_rgba(124,106,255,0.3)]">
          <Zap className="w-4 h-4 text-white" />
        </div>
        <span className="font-heading font-bold text-[var(--color-text-primary)] text-base tracking-tight">
          StreamForge
        </span>
      </div>

      {/* Role label */}
      <div className="px-5 pt-4 pb-2">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-[var(--color-text-muted)]">
          Administrator
        </span>
      </div>

      {/* Nav */}
      <Suspense fallback={<nav className="flex-1 px-3 flex flex-col gap-1" />}>
        <SidebarNav />
      </Suspense>

      {/* Logout */}
      <div className="px-3 pb-4 border-t border-[var(--color-border)] pt-3">
        <form action={logout}>
          <button
            type="submit"
            className="flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-[var(--color-text-muted)] hover:text-[var(--color-coral)] hover:bg-[rgba(255,107,107,0.08)] transition-all duration-150"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            Sign out
          </button>
        </form>
      </div>
    </aside>
  )
}
