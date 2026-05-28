'use client'

import { Suspense, useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { logout } from '@/app/actions/auth'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Users,
  CalendarDays,
  Settings,
  LogOut,
  Zap,
  ChevronDown,
} from 'lucide-react'

const CREATOR_SUB_ITEMS = [
  { label: 'All Creators', platform: null },
  { label: 'Streamers', platform: 'streamers' },
  { label: 'YouTubers', platform: 'youtubers' },
  { label: 'Instagramers', platform: 'instagramers' },
  { label: 'Clippers', platform: 'clippers' },
  { label: 'X Creators', platform: 'x-creators' },
]

function SidebarNav() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const currentPlatform = searchParams.get('platform')
  const onCreators = pathname.startsWith('/admin/clients')
  const [creatorsOpen, setCreatorsOpen] = useState(onCreators)

  useEffect(() => {
    if (onCreators) setCreatorsOpen(true)
  }, [onCreators])

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

      <div>
        <button
          type="button"
          onClick={() => setCreatorsOpen((o) => !o)}
          className={cn(
            'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
            onCreators
              ? 'text-[var(--color-accent)] bg-[rgba(124,106,255,0.08)]'
              : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)]'
          )}
        >
          <Users className="w-4 h-4 shrink-0" />
          <span className="flex-1 text-left">Creators</span>
          <ChevronDown
            className={cn(
              'w-3.5 h-3.5 transition-transform duration-200',
              creatorsOpen && 'rotate-180'
            )}
          />
        </button>

        {creatorsOpen && (
          <div className="ml-4 mt-1 mb-1 flex flex-col gap-0.5 border-l border-[var(--color-border)] pl-3">
            {CREATOR_SUB_ITEMS.map(({ label, platform }) => {
              const href = platform ? `/admin/clients?platform=${platform}` : '/admin/clients'
              const active = onCreators && (
                platform ? currentPlatform === platform : currentPlatform === null
              )
              return (
                <Link
                  key={label}
                  href={href}
                  className={cn(
                    'px-2.5 py-1.5 rounded-md text-xs font-medium transition-all duration-150',
                    active
                      ? 'text-[var(--color-accent)] bg-[rgba(124,106,255,0.12)]'
                      : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)]'
                  )}
                >
                  {label}
                </Link>
              )
            })}
          </div>
        )}
      </div>

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
