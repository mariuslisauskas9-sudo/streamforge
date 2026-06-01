'use client'

import { useState } from 'react'
import { createXPost, updateXPost, deleteXPost } from '@/app/actions/x-posts'
import type { XPost } from '@/app/actions/x-posts'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { formatFollowers } from '@/lib/utils'
import toast from 'react-hot-toast'
import { Plus, Pencil, Trash2, ExternalLink, Users, DollarSign, FileText } from 'lucide-react'

interface PostForm {
  profileLink: string
  followersCount: string
  postLink: string
  paymentLink: string
  paymentAmount: string
  notes: string
}

const defaultForm: PostForm = {
  profileLink: '',
  followersCount: '',
  postLink: '',
  paymentLink: '',
  paymentAmount: '',
  notes: '',
}

function postToForm(post: XPost): PostForm {
  return {
    profileLink: post.profile_link,
    followersCount: post.followers_count?.toString() ?? '',
    postLink: post.post_link ?? '',
    paymentLink: post.payment_link ?? '',
    paymentAmount: post.payment_amount?.toString() ?? '',
    notes: post.notes ?? '',
  }
}

function truncateUrl(url: string): string {
  try {
    const u = new URL(url)
    return u.hostname.replace('www.', '') + u.pathname
  } catch {
    return url
  }
}

// ─── Post form dialog (shared for add + edit) ─────────────────────────────────

function PostFormDialog({
  open,
  mode,
  form,
  saving,
  onClose,
  onChange,
  onSubmit,
}: {
  open: boolean
  mode: 'add' | 'edit'
  form: PostForm
  saving: boolean
  onClose: () => void
  onChange: (field: keyof PostForm, value: string) => void
  onSubmit: () => void
}) {
  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose() }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{mode === 'add' ? 'Add X post' : 'Edit X post'}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="xp-profile">
                Profile link <span className="text-[var(--color-coral)]">*</span>
              </Label>
              <Input
                id="xp-profile"
                placeholder="https://x.com/username"
                value={form.profileLink}
                onChange={(e) => onChange('profileLink', e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="xp-followers">Followers count</Label>
              <Input
                id="xp-followers"
                type="number"
                min="0"
                placeholder="e.g. 50000"
                value={form.followersCount}
                onChange={(e) => onChange('followersCount', e.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="xp-post">Post link</Label>
            <Input
              id="xp-post"
              placeholder="https://x.com/user/status/..."
              value={form.postLink}
              onChange={(e) => onChange('postLink', e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="xp-payment-link">Payment link</Label>
              <Input
                id="xp-payment-link"
                placeholder="https://invoice.example.com/..."
                value={form.paymentLink}
                onChange={(e) => onChange('paymentLink', e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="xp-amount">Amount paid ($)</Label>
              <Input
                id="xp-amount"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={form.paymentAmount}
                onChange={(e) => onChange('paymentAmount', e.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="xp-notes">Notes</Label>
            <Textarea
              id="xp-notes"
              placeholder="Any additional notes..."
              rows={3}
              value={form.notes}
              onChange={(e) => onChange('notes', e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="secondary" size="sm" onClick={onClose}>Cancel</Button>
          <Button
            size="sm"
            onClick={onSubmit}
            disabled={saving || !form.profileLink.trim()}
          >
            {saving ? 'Saving...' : mode === 'add' ? 'Add post' : 'Save changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Post card ────────────────────────────────────────────────────────────────

function PostCard({
  post,
  onEdit,
  onDelete,
}: {
  post: XPost
  onEdit: (post: XPost) => void
  onDelete: (id: string) => void
}) {
  return (
    <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-5 flex flex-col gap-4 hover:border-[var(--color-accent)]/40 hover:shadow-[0_0_20px_rgba(124,106,255,0.08)] transition-all duration-200">

      {/* Profile + followers */}
      <div className="flex items-start justify-between gap-3">
        <a
          href={post.profile_link}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-sm font-medium text-[var(--color-accent)] hover:underline min-w-0"
        >
          <ExternalLink className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">{truncateUrl(post.profile_link)}</span>
        </a>
        {post.followers_count != null && (
          <div className="flex items-center gap-1 text-xs text-[var(--color-text-muted)] shrink-0">
            <Users className="w-3 h-3" />
            {formatFollowers(post.followers_count)}
          </div>
        )}
      </div>

      {/* Post link */}
      {post.post_link && (
        <a
          href={post.post_link}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-accent)] transition-colors min-w-0"
        >
          <FileText className="w-3.5 h-3.5 shrink-0 text-[var(--color-text-muted)]" />
          <span className="truncate">{truncateUrl(post.post_link)}</span>
          <ExternalLink className="w-3 h-3 shrink-0 text-[var(--color-text-muted)]" />
        </a>
      )}

      {/* Notes */}
      {post.notes && (
        <p className="text-xs text-[var(--color-text-muted)] leading-relaxed line-clamp-3">
          {post.notes}
        </p>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between gap-2 pt-1 mt-auto border-t border-[var(--color-border)]">
        <div className="flex items-center gap-3 min-w-0">
          {post.payment_link && (
            <a
              href={post.payment_link}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-accent)] transition-colors min-w-0"
              title="Payment link"
            >
              <DollarSign className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{truncateUrl(post.payment_link)}</span>
              <ExternalLink className="w-3 h-3 shrink-0" />
            </a>
          )}
          {post.payment_amount != null && (
            <div className="flex items-center gap-0.5 font-semibold text-sm text-[#00d97e] shrink-0">
              <DollarSign className="w-3.5 h-3.5" />
              <span>{Number(post.payment_amount).toFixed(2)}</span>
            </div>
          )}
          {!post.payment_link && post.payment_amount == null && (
            <span className="text-xs text-[var(--color-text-muted)]">No payment set</span>
          )}
        </div>
        <div className="flex gap-1.5 shrink-0">
          <button
            onClick={() => onEdit(post)}
            className="p-1.5 rounded-md text-[var(--color-text-muted)] hover:text-[var(--color-accent)] hover:bg-[rgba(124,106,255,0.1)] transition-colors"
            title="Edit post"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onDelete(post.id)}
            className="p-1.5 rounded-md text-[var(--color-text-muted)] hover:text-[#ff6b6b] hover:bg-[rgba(255,107,107,0.1)] transition-colors"
            title="Delete post"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Section ──────────────────────────────────────────────────────────────────

export function XPostsSection({ initialPosts }: { initialPosts: XPost[] }) {
  const [posts, setPosts] = useState<XPost[]>(initialPosts)
  const [formOpen, setFormOpen] = useState(false)
  const [formMode, setFormMode] = useState<'add' | 'edit'>('add')
  const [editingPost, setEditingPost] = useState<XPost | null>(null)
  const [form, setForm] = useState<PostForm>(defaultForm)
  const [saving, setSaving] = useState(false)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  function setField(field: keyof PostForm, value: string) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  function openAdd() {
    setForm(defaultForm)
    setFormMode('add')
    setEditingPost(null)
    setFormOpen(true)
  }

  function openEdit(post: XPost) {
    setForm(postToForm(post))
    setFormMode('edit')
    setEditingPost(post)
    setFormOpen(true)
  }

  function closeForm() {
    setFormOpen(false)
    setEditingPost(null)
  }

  async function handleSubmit() {
    setSaving(true)
    if (formMode === 'add') {
      const result = await createXPost(form)
      if ('error' in result) {
        toast.error(result.error)
      } else {
        setPosts((prev) => [result.data, ...prev])
        toast.success('Post added')
        closeForm()
      }
    } else if (editingPost) {
      const result = await updateXPost(editingPost.id, form)
      if ('error' in result) {
        toast.error(result.error)
      } else {
        setPosts((prev) => prev.map((p) => p.id === editingPost.id ? result.data : p))
        toast.success('Post updated')
        closeForm()
      }
    }
    setSaving(false)
  }

  async function handleDelete() {
    if (!confirmDeleteId) return
    const id = confirmDeleteId
    const snapshot = posts
    setDeleting(true)
    setPosts((prev) => prev.filter((p) => p.id !== id))
    setConfirmDeleteId(null)

    const result = await deleteXPost(id)
    setDeleting(false)
    if ('error' in result) {
      setPosts(snapshot)
      toast.error(result.error)
    } else {
      toast.success('Post deleted')
    }
  }

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-[var(--color-text-muted)]">
          {posts.length} post{posts.length !== 1 ? 's' : ''}
        </p>
        <Button size="sm" onClick={openAdd}>
          <Plus className="w-4 h-4 mr-2" />
          Add Post
        </Button>
      </div>

      {/* Grid */}
      {posts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onEdit={openEdit}
              onDelete={setConfirmDeleteId}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <div className="w-12 h-12 rounded-xl bg-[var(--color-bg-card)] border border-[var(--color-border)] flex items-center justify-center">
            <FileText className="w-5 h-5 text-[var(--color-text-muted)]" />
          </div>
          <p className="text-sm font-medium text-[var(--color-text-primary)]">No posts yet</p>
          <p className="text-xs text-[var(--color-text-muted)]">Add your first X post to get started.</p>
        </div>
      )}

      {/* Add / Edit dialog */}
      <PostFormDialog
        open={formOpen}
        mode={formMode}
        form={form}
        saving={saving}
        onClose={closeForm}
        onChange={setField}
        onSubmit={handleSubmit}
      />

      {/* Delete confirmation */}
      <Dialog
        open={confirmDeleteId !== null}
        onOpenChange={(v) => { if (!v) setConfirmDeleteId(null) }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete post?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-[var(--color-text-secondary)]">
            This will permanently delete the post. This action cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="secondary" size="sm" onClick={() => setConfirmDeleteId(null)}>
              Cancel
            </Button>
            <Button variant="danger" size="sm" onClick={handleDelete} disabled={deleting}>
              {deleting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
