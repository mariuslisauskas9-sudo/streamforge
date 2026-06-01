'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Zap, ArrowLeft, MailCheck } from 'lucide-react'

type View = 'login' | 'forgot' | 'sent'

const inputStyle: React.CSSProperties = {
  padding: '10px 12px',
  borderRadius: 8,
  border: '1px solid #2a2a3a',
  background: '#111118',
  color: 'white',
  fontSize: 14,
  outline: 'none',
  width: '100%',
  boxSizing: 'border-box',
}

const btnPrimary: React.CSSProperties = {
  padding: '10px',
  borderRadius: 8,
  border: 'none',
  background: '#7c6aff',
  color: 'white',
  fontSize: 14,
  fontWeight: 600,
  cursor: 'pointer',
  width: '100%',
}

const btnDisabled: React.CSSProperties = {
  ...btnPrimary,
  opacity: 0.6,
  cursor: 'not-allowed',
}

interface Props {
  initialError?: string
}

export function LoginForm({ initialError }: Props) {
  const [view, setView] = useState<View>('login')
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotError, setForgotError] = useState<string | null>(null)
  const [forgotPending, setForgotPending] = useState(false)

  async function handleForgotSubmit(e: React.FormEvent) {
    e.preventDefault()
    const email = forgotEmail.trim()
    if (!email) return

    setForgotPending(true)
    setForgotError(null)

    const supabase = createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + '/auth/reset-password',
    })

    setForgotPending(false)

    if (error) {
      setForgotError(error.message)
    } else {
      setView('sent')
    }
  }

  const wrap: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    background: '#0a0a0f',
    fontFamily: 'sans-serif',
    color: 'white',
    padding: '16px',
  }

  const card: React.CSSProperties = {
    width: '100%',
    maxWidth: 360,
    display: 'flex',
    flexDirection: 'column',
    gap: 0,
  }

  // ── Login view ──────────────────────────────────────────────────────────────
  if (view === 'login') {
    return (
      <div style={wrap}>
        <div style={card}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: '#7c6aff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 24px rgba(124,106,255,0.35)' }}>
              <Zap size={18} color="white" />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 16, lineHeight: 1.2 }}>StreamForge</div>
              <div style={{ color: '#9898b0', fontSize: 12 }}>Creator management platform</div>
            </div>
          </div>

          <form method="POST" action="/api/login" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <input
              name="email"
              type="text"
              placeholder="Username"
              required
              autoComplete="username"
              style={inputStyle}
            />
            <input
              name="password"
              type="password"
              placeholder="Password"
              required
              autoComplete="current-password"
              style={inputStyle}
            />

            {initialError && (
              <p style={{ margin: 0, padding: '8px 12px', background: 'rgba(255,107,107,0.1)', border: '1px solid rgba(255,107,107,0.3)', borderRadius: 8, color: '#ff6b6b', fontSize: 13 }}>
                {initialError}
              </p>
            )}

            <button type="submit" style={btnPrimary}>
              Sign in
            </button>

            <button
              type="button"
              onClick={() => { setForgotError(null); setView('forgot') }}
              style={{ background: 'none', border: 'none', color: '#9898b0', fontSize: 13, cursor: 'pointer', padding: '2px 0', textAlign: 'center' }}
            >
              Forgot password?
            </button>
          </form>
        </div>
      </div>
    )
  }

  // ── Forgot password view ────────────────────────────────────────────────────
  if (view === 'forgot') {
    return (
      <div style={wrap}>
        <div style={card}>
          <button
            type="button"
            onClick={() => setView('login')}
            style={{ background: 'none', border: 'none', color: '#9898b0', fontSize: 13, cursor: 'pointer', padding: '0 0 20px 0', display: 'flex', alignItems: 'center', gap: 6, alignSelf: 'flex-start' }}
          >
            <ArrowLeft size={14} />
            Back to sign in
          </button>

          <div style={{ marginBottom: 20 }}>
            <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 6 }}>Reset password</div>
            <div style={{ color: '#9898b0', fontSize: 14 }}>
              Enter your email and we'll send you a reset link.
            </div>
          </div>

          <form onSubmit={handleForgotSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <input
              type="email"
              placeholder="Email"
              required
              autoComplete="email"
              value={forgotEmail}
              onChange={(e) => setForgotEmail(e.target.value)}
              style={inputStyle}
            />

            {forgotError && (
              <p style={{ margin: 0, padding: '8px 12px', background: 'rgba(255,107,107,0.1)', border: '1px solid rgba(255,107,107,0.3)', borderRadius: 8, color: '#ff6b6b', fontSize: 13 }}>
                {forgotError}
              </p>
            )}

            <button
              type="submit"
              disabled={forgotPending}
              style={forgotPending ? btnDisabled : btnPrimary}
            >
              {forgotPending ? 'Sending…' : 'Send reset link'}
            </button>
          </form>
        </div>
      </div>
    )
  }

  // ── Sent view ───────────────────────────────────────────────────────────────
  return (
    <div style={wrap}>
      <div style={{ ...card, alignItems: 'center', textAlign: 'center', gap: 16 }}>
        <div style={{ width: 52, height: 52, borderRadius: 14, background: 'rgba(0,217,126,0.12)', border: '1px solid rgba(0,217,126,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <MailCheck size={24} color="#00d97e" />
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 6 }}>Check your email</div>
          <div style={{ color: '#9898b0', fontSize: 14, lineHeight: 1.5 }}>
            We sent a reset link to<br />
            <span style={{ color: 'white', fontWeight: 500 }}>{forgotEmail}</span>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setView('login')}
          style={{ background: 'none', border: 'none', color: '#9898b0', fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}
        >
          <ArrowLeft size={14} />
          Back to sign in
        </button>
      </div>
    </div>
  )
}
