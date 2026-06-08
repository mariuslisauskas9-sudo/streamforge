import { createClient } from '@/lib/supabase/server'
import { AdminCalendarView } from './calendar-view'

export default async function AdminCalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ client?: string }>
}) {
  const sp = await searchParams
  const supabase = await createClient()

  const { data: clients } = await supabase
    .from('profiles')
    .select('id, full_name, username, platform_links(platform)')
    .eq('role', 'client')

  return (
    <div className="p-6 max-w-full mx-auto animate-in h-full flex flex-col">
      <div className="mb-5">
        <h1 className="text-2xl font-heading font-bold text-[var(--color-text-primary)]">
          Calendar
        </h1>
        <p className="text-sm text-[var(--color-text-muted)] mt-1">
          All clients' events
        </p>
      </div>
      <AdminCalendarView
        clients={(clients ?? []) as any[]}
        initialClientId={sp.client}
      />
    </div>
  )
}
