'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createCreator } from '@/app/actions/users'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { platformLabels } from '@/lib/utils'
import toast from 'react-hot-toast'
import { UserPlus, Copy, Check, ExternalLink } from 'lucide-react'

const PLATFORM_OPTIONS = ['twitch', 'youtube', 'kick', 'tiktok', 'instagram', 'twitter', 'clipper']

interface FormState {
  fullName: string
  username: string
  password: string
  platform: string
  channelUrl: string
  followers: string
  contact: string
  bio: string
}

const defaultForm: FormState = {
  fullName: '',
  username: '',
  password: '',
  platform: 'twitch',
  channelUrl: '',
  followers: '',
  contact: '',
  bio: '',
}

interface SuccessInfo {
  username: string
  password: string
  loginUrl: string
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
      className="shrink-0 p-1.5 rounded-md text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)] transition-colors"
      title="Copy"
    >
      {copied ? <Check className="w-3.5 h-3.5 text-[#00d97e]" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  )
}

function SuccessView({ info, onClose }: { info: SuccessInfo; onClose: () => void }) {
  return (
    <>
      <DialogHeader>
        <DialogTitle>Creator added</DialogTitle>
      </DialogHeader>

      <div className="flex flex-col gap-3">
        <p className="text-sm text-[var(--color-text-muted)]">
          Share these credentials with the creator so they can log in.
        </p>

        <div className="flex flex-col gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-4">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-wider text-[var(--color-text-muted)] mb-0.5">Username</p>
              <p className="text-sm font-mono font-medium text-[var(--color-text-primary)] truncate">{info.username}</p>
            </div>
            <CopyButton text={info.username} />
          </div>

          <div className="border-t border-[var(--color-border)]" />

          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-wider text-[var(--color-text-muted)] mb-0.5">Password</p>
              <p className="text-sm font-mono font-medium text-[var(--color-text-primary)] truncate">{info.password}</p>
            </div>
            <CopyButton text={info.password} />
          </div>

          <div className="border-t border-[var(--color-border)]" />

          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-wider text-[var(--color-text-muted)] mb-0.5">Login link</p>
              <a
                href={info.loginUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-mono text-[var(--color-accent)] hover:underline truncate flex items-center gap-1"
              >
                {info.loginUrl}
                <ExternalLink className="w-3 h-3 shrink-0" />
              </a>
            </div>
            <CopyButton text={info.loginUrl} />
          </div>
        </div>
      </div>

      <DialogFooter>
        <Button size="sm" onClick={onClose}>Done</Button>
      </DialogFooter>
    </>
  )
}

export function AddCreatorModal() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<FormState>(defaultForm)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState<SuccessInfo | null>(null)

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  function handleClose() {
    setOpen(false)
    setSuccess(null)
    setForm(defaultForm)
  }

  async function handleSubmit() {
    if (!form.username.trim() || !form.password.trim()) return
    setLoading(true)
    const result = await createCreator(form)
    if ('error' in result) {
      toast.error(result.error)
    } else {
      setSuccess({
        username: form.username.trim().toLowerCase(),
        password: form.password,
        loginUrl: window.location.origin + '/login',
      })
      router.refresh()
    }
    setLoading(false)
  }

  const canSubmit = form.username.trim() && form.password.trim()

  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)}>
        <UserPlus className="w-4 h-4 mr-2" />
        Add Creator
      </Button>

      <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose() }}>
        <DialogContent>
          {success ? (
            <SuccessView info={success} onClose={handleClose} />
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>Add creator</DialogTitle>
              </DialogHeader>

              <div className="flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="ac-name">Full name</Label>
                    <Input
                      id="ac-name"
                      placeholder="First Last"
                      value={form.fullName}
                      onChange={(e) => set('fullName', e.target.value)}
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="ac-username">
                      Username <span className="text-[var(--color-coral)]">*</span>
                    </Label>
                    <Input
                      id="ac-username"
                      placeholder="handle"
                      value={form.username}
                      onChange={(e) => set('username', e.target.value.replace(/\s/g, '').toLowerCase())}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="ac-password">
                      Password <span className="text-[var(--color-coral)]">*</span>
                    </Label>
                    <Input
                      id="ac-password"
                      type="text"
                      placeholder="Min. 6 characters"
                      value={form.password}
                      onChange={(e) => set('password', e.target.value)}
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <Label>Platform</Label>
                    <Select value={form.platform} onValueChange={(v) => set('platform', v)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PLATFORM_OPTIONS.map((p) => (
                          <SelectItem key={p} value={p}>
                            {platformLabels[p] ?? p}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="ac-url">Channel URL</Label>
                    <Input
                      id="ac-url"
                      placeholder="https://twitch.tv/..."
                      value={form.channelUrl}
                      onChange={(e) => set('channelUrl', e.target.value)}
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="ac-followers">Followers count</Label>
                    <Input
                      id="ac-followers"
                      type="number"
                      min="0"
                      placeholder="e.g. 50000"
                      value={form.followers}
                      onChange={(e) => set('followers', e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="ac-contact">Contact details</Label>
                  <Textarea
                    id="ac-contact"
                    placeholder="Discord, WhatsApp, Telegram, email…"
                    rows={2}
                    value={form.contact}
                    onChange={(e) => set('contact', e.target.value)}
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="ac-bio">Details / Notes</Label>
                  <Textarea
                    id="ac-bio"
                    placeholder="Any additional info about this creator…"
                    rows={2}
                    value={form.bio}
                    onChange={(e) => set('bio', e.target.value)}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button variant="secondary" size="sm" onClick={handleClose}>
                  Cancel
                </Button>
                <Button size="sm" onClick={handleSubmit} disabled={loading || !canSubmit}>
                  {loading ? 'Creating...' : 'Add creator'}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
