import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const formData = await request.formData()
  const raw = String(formData.get('email') ?? '').trim()
  const email = raw.includes('@') ? raw : `${raw}@streamforge.internal`
  const password = String(formData.get('password') ?? '')

  if (!raw || !password) {
    return NextResponse.redirect(
      new URL('/login?error=' + encodeURIComponent('Please enter your username and password'), request.url),
      303
    )
  }

  const cookieStore = await cookies()

  // Collect cookies that Supabase wants to set so we can stamp them onto the
  // redirect response — cookieStore.set() alone does NOT attach Set-Cookie
  // headers to a manually constructed NextResponse object.
  const cookiesToWrite: Array<{ name: string; value: string; options: Record<string, unknown> }> = []

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (incoming) => {
          incoming.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options)
            cookiesToWrite.push({ name, value, options })
          })
        },
      },
    }
  )

  const { data, error } = await supabase.auth.signInWithPassword({ email, password })

  if (error || !data.user) {
    return NextResponse.redirect(
      new URL('/login?error=' + encodeURIComponent(error?.message ?? 'Login failed'), request.url),
      303
    )
  }

  // Service role client — bypasses RLS to read role reliably
  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: profile } = await admin
    .from('profiles')
    .select('role')
    .eq('id', data.user.id)
    .single()

  const dest = profile?.role === 'admin' ? '/admin' : '/client'

  // Build the redirect and attach every auth cookie Supabase wrote
  const response = NextResponse.redirect(new URL(dest, request.url), 303)
  for (const { name, value, options } of cookiesToWrite) {
    response.cookies.set(name, value, options as Parameters<typeof response.cookies.set>[2])
  }
  return response
}
