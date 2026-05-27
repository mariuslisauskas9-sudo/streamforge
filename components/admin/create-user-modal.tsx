'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createUser } from '@/app/actions/users'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { platformLabels } from '@/lib/utils'
import toast from 'react-hot-toast'
import { UserPlus } from 'lucide-react'

const PLATFORM_OPTIONS = ['twitch', 'youtube', 'kick', 'tiktok', 'instagram']

interface FormState {
  fullName: string
  email: string
  password: string
  role: 'admin' | 'client'
  platform: string
}

const defaultForm: FormState = {
  fullName: '',
  email: '',
  password: '',
  role: 'client',
  platform: 'twitch',
}

export function CreateUserModal() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<FormState>(defaultForm)
  const [loading, setLoading] = useState(false)

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  async function handleSubmit() {
    if (!form.email.trim() || !form.password.trim()) return
    setLoading(true)
    const result = await createUser(form)
    if ('error' in result) {
      toast.error(result.error)
    } else {
      toast.success('User created successfully')
      setOpen(false)
      setForm(defaultForm)
      router.refresh()
    }
    setLoading(false)
  }

  const canSubmit = form.email.trim() && form.password.trim()

  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)}>
        <UserPlus className="w-4 h-4 mr-2" />
        Add User
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add new user</DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="cu-name">Full name</Label>
              <Input
                id="cu-name"
                placeholder="First Last"
                value={form.fullName}
                onChange={(e) => set('fullName', e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="cu-email">Email <span className="text-[var(--color-coral)]">*</span></Label>
              <Input
                id="cu-email"
                type="email"
                placeholder="user@example.com"
                value={form.email}
                onChange={(e) => set('email', e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="cu-pass">Password <span className="text-[var(--color-coral)]">*</span></Label>
              <Input
                id="cu-pass"
                type="password"
                placeholder="Min. 6 characters"
                value={form.password}
                onChange={(e) => set('password', e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label>Role</Label>
                <Select value={form.role} onValueChange={(v) => set('role', v as 'admin' | 'client')}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="client">Client</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
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
          </div>

          <DialogFooter>
            <Button variant="secondary" size="sm" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleSubmit} disabled={loading || !canSubmit}>
              {loading ? 'Creating...' : 'Create user'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
