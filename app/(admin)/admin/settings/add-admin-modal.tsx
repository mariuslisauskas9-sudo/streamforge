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
import { UserPlus } from 'lucide-react'
import toast from 'react-hot-toast'

interface FormState {
  fullName: string
  email: string
  password: string
}

const defaultForm: FormState = { fullName: '', email: '', password: '' }

export function AddAdminModal() {
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
    const result = await createUser({
      fullName: form.fullName.trim(),
      email: form.email.trim(),
      password: form.password.trim(),
      role: 'admin',
      platform: '',
    })
    setLoading(false)
    if ('error' in result) {
      toast.error(result.error)
    } else {
      toast.success('Admin account created')
      setOpen(false)
      setForm(defaultForm)
      router.refresh()
    }
  }

  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)}>
        <UserPlus className="w-4 h-4" />
        Add admin
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add admin account</DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="aa-name">Full name</Label>
              <Input
                id="aa-name"
                placeholder="First Last"
                value={form.fullName}
                onChange={(e) => set('fullName', e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="aa-email">
                Email <span className="text-[#ff6b6b]">*</span>
              </Label>
              <Input
                id="aa-email"
                type="email"
                placeholder="admin@example.com"
                value={form.email}
                onChange={(e) => set('email', e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="aa-pass">
                Password <span className="text-[#ff6b6b]">*</span>
              </Label>
              <Input
                id="aa-pass"
                type="password"
                placeholder="Min. 6 characters"
                value={form.password}
                onChange={(e) => set('password', e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="secondary" size="sm" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSubmit}
              disabled={loading || !form.email.trim() || !form.password.trim()}
            >
              {loading ? 'Creating...' : 'Create admin'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
