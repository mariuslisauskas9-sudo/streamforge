'use client'

import { useState } from 'react'
import { Eye, EyeOff, Copy, Check, KeyRound } from 'lucide-react'
import { formatDate } from '@/lib/utils'

type CredentialRow = {
  id: string
  username: string
  password: string
  created_at: string
  profiles: { full_name: string | null } | null
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  function copy() {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <button
      type="button"
      onClick={copy}
      title="Copy credentials"
      className="p-1.5 rounded-md text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)] transition-colors"
    >
      {copied
        ? <Check className="w-3.5 h-3.5 text-[#00d97e]" />
        : <Copy className="w-3.5 h-3.5" />}
    </button>
  )
}

function PasswordCell({ password }: { password: string }) {
  const [visible, setVisible] = useState(false)
  return (
    <div className="flex items-center gap-1.5">
      <span className="font-mono text-xs text-[var(--color-text-primary)]">
        {visible ? password : '••••••••'}
      </span>
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        title={visible ? 'Hide password' : 'Show password'}
        className="p-1 rounded text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
      >
        {visible
          ? <EyeOff className="w-3.5 h-3.5" />
          : <Eye className="w-3.5 h-3.5" />}
      </button>
    </div>
  )
}

export function CreatorCredentials({ credentials }: { credentials: CredentialRow[] }) {
  return (
    <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-2xl overflow-hidden mt-6">
      <div className="flex items-center gap-2.5 px-6 py-4 border-b border-[var(--color-border)]">
        <KeyRound className="w-4 h-4 text-[var(--color-accent)]" />
        <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">
          Creator logins
        </h2>
        <span className="text-xs text-[var(--color-text-muted)] bg-[var(--color-bg-hover)] px-2 py-0.5 rounded-full border border-[var(--color-border)]">
          {credentials.length}
        </span>
      </div>

      {credentials.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--color-border)]">
                <th className="text-left text-xs font-medium text-[var(--color-text-muted)] px-6 py-3">Creator</th>
                <th className="text-left text-xs font-medium text-[var(--color-text-muted)] px-4 py-3">Username</th>
                <th className="text-left text-xs font-medium text-[var(--color-text-muted)] px-4 py-3">Password</th>
                <th className="text-left text-xs font-medium text-[var(--color-text-muted)] px-4 py-3">Created</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {credentials.map((c) => (
                <tr key={c.id} className="hover:bg-[var(--color-bg-hover)] transition-colors">
                  <td className="px-6 py-3">
                    <span className="text-sm font-medium text-[var(--color-text-primary)]">
                      {c.profiles?.full_name ?? c.username}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-mono text-xs text-[var(--color-text-secondary)]">
                      {c.username}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <PasswordCell password={c.password} />
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs text-[var(--color-text-muted)]">
                      {formatDate(c.created_at)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <CopyButton text={`Username: ${c.username}\nPassword: ${c.password}`} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2 py-12 text-center">
          <p className="text-sm text-[var(--color-text-muted)]">No creator accounts yet</p>
          <p className="text-xs text-[var(--color-text-muted)]">Credentials appear here after you add a creator.</p>
        </div>
      )}
    </div>
  )
}
