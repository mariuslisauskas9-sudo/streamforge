import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ClientCalendarView } from './calendar-view'

export default async function ClientCalendarPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <div className="p-6 h-full flex flex-col animate-in">
      <div className="mb-5">
        <h1 className="text-2xl font-heading font-bold text-[var(--color-text-primary)]">
          My calendar
        </h1>
        <p className="text-sm text-[var(--color-text-muted)] mt-1">
          Manage your upcoming events
        </p>
      </div>
      <ClientCalendarView profileId={user.id} />
    </div>
  )
}
