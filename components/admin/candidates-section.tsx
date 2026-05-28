'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { hireCandidate } from '@/app/actions/users'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import PlatformBadge from '@/components/PlatformBadge'
import { formatFollowers, negotiationStatusLabels, platformLabels } from '@/lib/utils'
import toast from 'react-hot-toast'
import { Plus, Pencil, Trash2, Users, Star, UserCheck, ExternalLink, Eye } from 'lucide-react'
import type { Platform } from '@/types'

type CandidateRow = {
  id: string
  name: string
  platform: string
  channel_url: string | null
  audience_size: number | null
  average_views: number | null
  proposed_price: number | null
  notes: string | null
  comments: string | null
  negotiation_status: string
  priority: number
}

interface FormState {
  name: string
  platform: string
  channel_url: string
  audience_size: string
  average_views: string
  proposed_price: string
  negotiation_status: string
  priority: number
  notes: string
}

const defaultForm: FormState = {
  name: '',
  platform: 'twitch',
  channel_url: '',
  audience_size: '',
  average_views: '',
  proposed_price: '',
  negotiation_status: 'pending',
  priority: 2,
  notes: '',
}

const PRIORITY_LABEL: Record<number, string> = { 1: 'Low', 2: 'Medium', 3: 'High' }

const NEGOTIATION_OPTIONS = [
  { value: 'pending',     label: 'Pending' },
  { value: 'contacted',   label: 'Contacted' },
  { value: 'negotiating', label: 'Negotiating' },
  { value: 'rejected',    label: 'Rejected' },
]

const CANDIDATE_PLATFORMS = ['twitch', 'youtube', 'kick', 'tiktok', 'instagram', 'twitter', 'clipper', 'other']

const NEG_COLORS: Record<string, { bg: string; color: string }> = {
  pending:     { bg: 'rgba(152,152,176,0.15)', color: 'var(--color-text-muted)' },
  contacted:   { bg: 'rgba(52,170,255,0.15)',  color: '#34aaff' },
  negotiating: { bg: 'rgba(255,181,52,0.15)',  color: 'var(--color-amber)' },
  rejected:    { bg: 'rgba(255,107,107,0.15)', color: '#ff6b6b' },
}

function formatPrice(n: number): string {
  if (n >= 1_000) return `€${(n / 1_000).toFixed(n % 1_000 === 0 ? 0 : 1)}K`
  return `€${n % 1 === 0 ? n.toFixed(0) : n.toFixed(2)}`
}

function StarRating({ value, onChange }: { value: number; onChange?: (v: number) => void }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange?.(n)}
          disabled={!onChange}
          className={`transition-transform ${onChange ? 'hover:scale-110' : ''}`}
        >
          <Star
            className="w-4 h-4"
            fill={n <= value ? '#ffb534' : 'transparent'}
            strokeWidth={1.5}
            stroke={n <= value ? '#ffb534' : 'var(--color-border)'}
          />
        </button>
      ))}
    </div>
  )
}

function NegBadge({ status }: { status: string }) {
  const c = NEG_COLORS[status] ?? NEG_COLORS.pending
  return (
    <span
      className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium"
      style={{ background: c.bg, color: c.color }}
    >
      {negotiationStatusLabels[status] ?? status}
    </span>
  )
}

export function CandidatesSection({ initialCandidates }: { initialCandidates: CandidateRow[] }) {
  const router = useRouter()
  const [candidates, setCandidates] = useState<CandidateRow[]>(initialCandidates)

  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(defaultForm)
  const set = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm((f) => ({ ...f, [k]: v }))

  const [hiringCandidate, setHiringCandidate] = useState<CandidateRow | null>(null)
  const [hireEmail, setHireEmail] = useState('')
  const [hireLoading, setHireLoading] = useState(false)

  function openAdd() {
    setEditingId(null)
    setForm(defaultForm)
    setModalOpen(true)
  }

  function openEdit(c: CandidateRow) {
    setEditingId(c.id)
    setForm({
      name: c.name,
      platform: c.platform,
      channel_url: c.channel_url ?? '',
      audience_size: c.audience_size?.toString() ?? '',
      average_views: c.average_views?.toString() ?? '',
      proposed_price: c.proposed_price?.toString() ?? '',
      negotiation_status: c.negotiation_status,
      priority: c.priority,
      notes: c.notes ?? '',
    })
    setModalOpen(true)
  }

  function openHire(c: CandidateRow) {
    setHiringCandidate(c)
    setHireEmail('')
  }

  async function handleSave() {
    if (!form.name.trim()) return
    const supabase = createClient()

    const payload = {
      name: form.name.trim(),
      platform: form.platform,
      channel_url: form.channel_url.trim() || null,
      audience_size: form.audience_size ? parseInt(form.audience_size) : null,
      average_views: form.average_views ? parseInt(form.average_views) : null,
      proposed_price: form.proposed_price ? parseFloat(form.proposed_price) : null,
      negotiation_status: form.negotiation_status,
      priority: form.priority,
      notes: form.notes.trim() || null,
    }

    if (editingId) {
      const snapshot = candidates
      setCandidates((prev) =>
        prev.map((c) => (c.id === editingId ? { ...c, ...payload } : c))
      )
      setModalOpen(false)

      const { data, error } = await supabase
        .from('candidates').update(payload).eq('id', editingId).select().single()

      if (error || !data) {
        setCandidates(snapshot)
        setModalOpen(true)
        toast.error(`Failed to update: ${error?.message ?? 'No data returned'}`)
      } else {
        setCandidates((prev) => prev.map((c) => (c.id === editingId ? data : c)))
        toast.success('Candidate updated')
      }
    } else {
      const tempId = `__temp__${Date.now()}`
      const optimistic: CandidateRow = {
        id: tempId,
        comments: null,
        ...payload,
      }
      setCandidates((prev) => [optimistic, ...prev])
      setModalOpen(false)

      const { data, error } = await supabase
        .from('candidates').insert(payload).select().single()

      if (error || !data) {
        setCandidates((prev) => prev.filter((c) => c.id !== tempId))
        toast.error(`Failed to save: ${error?.message ?? 'No data returned'}`)
      } else {
        setCandidates((prev) => prev.map((c) => (c.id === tempId ? data : c)))
        toast.success('Candidate added')
      }
    }
  }

  async function handleDelete(id: string) {
    const snapshot = candidates
    setCandidates((prev) => prev.filter((c) => c.id !== id))

    const supabase = createClient()
    const { error } = await supabase.from('candidates').delete().eq('id', id)
    if (error) {
      setCandidates(snapshot)
      toast.error('Error deleting candidate')
    } else {
      toast.success('Candidate removed')
    }
  }

  async function handleHireSubmit() {
    if (!hiringCandidate || !hireEmail.trim()) return

    const candidate = hiringCandidate
    const email = hireEmail.trim()

    setHireLoading(true)

    const snapshot = candidates
    setCandidates((prev) => prev.filter((c) => c.id !== candidate.id))
    setHiringCandidate(null)

    const result = await hireCandidate({
      candidateId: candidate.id,
      name: candidate.name,
      platform: candidate.platform,
      audienceSize: candidate.audience_size,
      email,
    })

    setHireLoading(false)

    if ('error' in result) {
      setCandidates(snapshot)
      setHiringCandidate(candidate)
      setHireEmail(email)
      toast.error(result.error)
    } else {
      toast.success(`Invite sent to ${email}`)
      router.refresh()
    }
  }

  return (
    <>
      <div className="flex justify-end mb-5">
        <Button size="sm" onClick={openAdd}>
          <Plus className="w-4 h-4" />
          Add candidate
        </Button>
      </div>

      {candidates.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {candidates.map((c) => (
            <div
              key={c.id}
              className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-5 flex flex-col gap-3 hover:border-[var(--color-border-hover)] transition-colors"
            >
              {/* Name + link + platform | stars */}
              <div className="flex items-start gap-2 justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <p className="font-semibold text-[var(--color-text-primary)] truncate">{c.name}</p>
                    {c.channel_url && (
                      <a
                        href={c.channel_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="shrink-0 text-[var(--color-text-muted)] hover:text-[var(--color-accent)] transition-colors"
                        title="View channel"
                      >
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                  <PlatformBadge platform={c.platform as Platform} className="mt-1.5" />
                </div>
                <StarRating value={c.priority} />
              </div>

              {/* Stats row */}
              {(c.audience_size != null || c.average_views != null || c.proposed_price != null) && (
                <div className="flex flex-wrap gap-x-3 gap-y-1">
                  {c.audience_size != null && (
                    <div className="flex items-center gap-1 text-xs text-[var(--color-text-secondary)]">
                      <Users className="w-3 h-3 shrink-0" />
                      {formatFollowers(c.audience_size)}
                    </div>
                  )}
                  {c.average_views != null && (
                    <div className="flex items-center gap-1 text-xs text-[var(--color-text-secondary)]">
                      <Eye className="w-3 h-3 shrink-0" />
                      {formatFollowers(c.average_views)} avg
                    </div>
                  )}
                  {c.proposed_price != null && (
                    <div className="flex items-center gap-1 text-xs font-semibold text-[var(--color-text-primary)]">
                      {formatPrice(c.proposed_price)}
                    </div>
                  )}
                </div>
              )}

              {c.notes && (
                <p className="text-xs text-[var(--color-text-muted)] line-clamp-2 leading-relaxed">
                  {c.notes}
                </p>
              )}

              <div className="flex items-center justify-between mt-auto pt-1">
                <NegBadge status={c.negotiation_status} />
                <div className="flex gap-1">
                  <button
                    onClick={() => openHire(c)}
                    className="p-1.5 rounded-md text-[var(--color-green)] hover:bg-[rgba(0,217,126,0.1)] transition-colors"
                    aria-label="Hire as client"
                    title="Hire as client"
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => openEdit(c)}
                    className="p-1.5 rounded-md text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)] transition-colors"
                    aria-label="Edit candidate"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(c.id)}
                    className="p-1.5 rounded-md text-[var(--color-text-muted)] hover:text-[#ff6b6b] hover:bg-[rgba(255,107,107,0.1)] transition-colors"
                    aria-label="Delete candidate"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <div className="w-12 h-12 rounded-xl bg-[var(--color-bg-card)] border border-[var(--color-border)] flex items-center justify-center">
            <Users className="w-5 h-5 text-[var(--color-text-muted)]" />
          </div>
          <p className="text-sm font-medium text-[var(--color-text-primary)]">No candidates</p>
          <p className="text-xs text-[var(--color-text-muted)]">
            Add creators you're interested in working with.
          </p>
        </div>
      )}

      {/* Add / Edit modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit candidate' : 'Add candidate'}</DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-4 max-h-[65vh] overflow-y-auto pr-1">
            {/* Name */}
            <div className="flex flex-col gap-1.5">
              <Label>Name</Label>
              <Input
                placeholder="Creator name"
                value={form.name}
                onChange={(e) => set('name', e.target.value)}
              />
            </div>

            {/* Platform + Audience */}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label>Platform</Label>
                <Select value={form.platform} onValueChange={(v) => set('platform', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CANDIDATE_PLATFORMS.map((p) => (
                      <SelectItem key={p} value={p}>{platformLabels[p] ?? p}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Followers</Label>
                <Input
                  type="number"
                  placeholder="e.g. 50000"
                  value={form.audience_size}
                  onChange={(e) => set('audience_size', e.target.value)}
                />
              </div>
            </div>

            {/* Channel URL */}
            <div className="flex flex-col gap-1.5">
              <Label>Channel URL</Label>
              <Input
                type="url"
                placeholder="https://twitch.tv/username"
                value={form.channel_url}
                onChange={(e) => set('channel_url', e.target.value)}
              />
            </div>

            {/* Avg views + Proposed price */}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label>Avg views</Label>
                <Input
                  type="number"
                  placeholder="e.g. 5000"
                  value={form.average_views}
                  onChange={(e) => set('average_views', e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Proposed price</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[var(--color-text-muted)] pointer-events-none select-none">
                    €
                  </span>
                  <Input
                    type="number"
                    className="pl-7"
                    placeholder="0"
                    value={form.proposed_price}
                    onChange={(e) => set('proposed_price', e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Status + Priority */}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label>Status</Label>
                <Select value={form.negotiation_status} onValueChange={(v) => set('negotiation_status', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {NEGOTIATION_OPTIONS.map((s) => (
                      <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Priority</Label>
                <div className="flex items-center gap-2 h-9">
                  <StarRating value={form.priority} onChange={(v) => set('priority', v)} />
                  <span className="text-xs text-[var(--color-text-muted)]">
                    {PRIORITY_LABEL[form.priority]}
                  </span>
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="flex flex-col gap-1.5">
              <Label>Notes / Comments</Label>
              <Textarea
                placeholder="Notes about this creator..."
                value={form.notes}
                onChange={(e) => set('notes', e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="secondary" size="sm" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button size="sm" onClick={handleSave} disabled={!form.name.trim()}>
              {editingId ? 'Update' : 'Add candidate'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Hire modal */}
      <Dialog
        open={hiringCandidate !== null}
        onOpenChange={(open) => { if (!open) setHiringCandidate(null) }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hire as client</DialogTitle>
          </DialogHeader>

          {hiringCandidate && (
            <>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border)]">
                <div className="w-9 h-9 rounded-lg bg-[var(--color-bg-hover)] border border-[var(--color-border)] flex items-center justify-center shrink-0">
                  <UserCheck className="w-4 h-4 text-[var(--color-green)]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[var(--color-text-primary)] truncate">
                    {hiringCandidate.name}
                  </p>
                  <p className="text-xs text-[var(--color-text-muted)]">
                    {platformLabels[hiringCandidate.platform] ?? hiringCandidate.platform}
                    {hiringCandidate.audience_size != null &&
                      ` · ${formatFollowers(hiringCandidate.audience_size)} followers`}
                    {hiringCandidate.proposed_price != null &&
                      ` · ${formatPrice(hiringCandidate.proposed_price)}`}
                  </p>
                </div>
                <StarRating value={hiringCandidate.priority} />
              </div>

              <p className="text-xs text-[var(--color-text-muted)] -mt-1">
                Set up login credentials for this client's account.
              </p>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="hire-email">
                  Client email <span className="text-[#ff6b6b]">*</span>
                </Label>
                <Input
                  id="hire-email"
                  type="email"
                  placeholder="client@example.com"
                  value={hireEmail}
                  onChange={(e) => setHireEmail(e.target.value)}
                />
                <p className="text-xs text-[var(--color-text-muted)]">
                  They'll receive an invite email with a link to set their password.
                </p>
              </div>
            </>
          )}

          <DialogFooter>
            <Button variant="secondary" size="sm" onClick={() => setHiringCandidate(null)}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleHireSubmit}
              disabled={hireLoading || !hireEmail.trim()}
              className="bg-[rgba(0,217,126,0.15)] text-[var(--color-green)] hover:bg-[rgba(0,217,126,0.25)] border border-[rgba(0,217,126,0.2)]"
            >
              {hireLoading ? 'Hiring...' : `Hire ${hiringCandidate?.name ?? ''}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
