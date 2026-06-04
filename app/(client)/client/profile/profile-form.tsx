'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { getInitials, platformLabels, formatFollowers } from '@/lib/utils'
import StatusBadge from '@/components/StatusBadge'
import type { ProfileWithLinks } from '@/types'
import toast from 'react-hot-toast'

const TIMEZONES: { value: string; label: string }[] = [
  { value: 'UTC', label: 'UTC' },
  { value: 'America/New_York', label: 'US/Eastern — New York' },
  { value: 'America/Chicago', label: 'US/Central — Chicago' },
  { value: 'America/Denver', label: 'US/Mountain — Denver' },
  { value: 'America/Los_Angeles', label: 'US/Pacific — Los Angeles' },
  { value: 'America/Sao_Paulo', label: 'Brazil — São Paulo' },
  { value: 'Europe/London', label: 'Europe/London' },
  { value: 'Europe/Vilnius', label: 'Europe/Vilnius' },
  { value: 'Europe/Berlin', label: 'Europe/Berlin' },
  { value: 'Europe/Paris', label: 'Europe/Paris' },
  { value: 'Europe/Moscow', label: 'Europe/Moscow' },
  { value: 'Asia/Dubai', label: 'Asia/Dubai' },
  { value: 'Asia/Kolkata', label: 'Asia/Kolkata — India' },
  { value: 'Asia/Bangkok', label: 'Asia/Bangkok' },
  { value: 'Asia/Shanghai', label: 'Asia/Shanghai — China' },
  { value: 'Asia/Tokyo', label: 'Asia/Tokyo' },
  { value: 'Australia/Sydney', label: 'Australia/Sydney' },
  { value: 'Pacific/Auckland', label: 'Pacific/Auckland' },
]

interface Props {
  profile: ProfileWithLinks
}

export function ProfileForm({ profile }: Props) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    full_name: profile.full_name ?? '',
    username: profile.username ?? '',
    bio: profile.bio ?? '',
    discord: profile.discord ?? '',
    timezone: profile.timezone ?? 'UTC',
  })

  function update(field: string, value: string) {
    setFormData((f) => ({ ...f, [field]: value }))
  }

  async function handleSave() {
    setSaving(true)
    const supabase = createClient()

    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: formData.full_name || null,
        username: formData.username || null,
        bio: formData.bio || null,
        discord: formData.discord || null,
        timezone: formData.timezone || 'UTC',
      })
      .eq('id', profile.id)

    if (error) {
      toast.error('Error saving profile')
    } else {
      toast.success('Profile updated')
      router.refresh()
    }
    setSaving(false)
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Identity card — avatar, name, status (all read-only) */}
      <Card className="flex items-center gap-4">
        <Avatar className="w-16 h-16 shrink-0">
          <AvatarImage src={profile.avatar_url ?? undefined} />
          <AvatarFallback className="text-xl font-semibold">
            {getInitials(formData.full_name || profile.full_name)}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-[var(--color-text-primary)] truncate">
              {formData.full_name || profile.full_name || 'Your name'}
            </span>
            <StatusBadge status={profile.status} />
          </div>
          <p className="text-sm text-[var(--color-text-muted)] mt-0.5">
            {formData.username ? `@${formData.username}` : 'No username set'}
          </p>
          {profile.email && (
            <p className="text-xs text-[var(--color-text-muted)] mt-0.5 truncate">
              {profile.email}
            </p>
          )}
        </div>
      </Card>

      {/* Personal information */}
      <Card>
        <CardHeader>
          <CardTitle>Personal information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="full_name">Full name</Label>
                <Input
                  id="full_name"
                  value={formData.full_name}
                  onChange={(e) => update('full_name', e.target.value)}
                  placeholder="First Last"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  value={formData.username}
                  onChange={(e) => update('username', e.target.value)}
                  placeholder="username"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="bio">About me</Label>
              <Textarea
                id="bio"
                value={formData.bio}
                onChange={(e) => update('bio', e.target.value)}
                placeholder="Brief description about yourself..."
                rows={3}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="discord">Discord</Label>
              <Input
                id="discord"
                value={formData.discord}
                onChange={(e) => update('discord', e.target.value)}
                placeholder="username"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>Timezone</Label>
              <Select value={formData.timezone} onValueChange={(v) => update('timezone', v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIMEZONES.map((tz) => (
                    <SelectItem key={tz.value} value={tz.value}>
                      {tz.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Platform links — read-only */}
      {profile.platform_links.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Platforms</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-2">
              {profile.platform_links.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-[var(--color-bg-secondary)] border border-[var(--color-border)]"
                >
                  <span className="text-xs font-semibold text-[var(--color-text-primary)] w-20 shrink-0">
                    {platformLabels[p.platform] ?? p.platform}
                  </span>
                  <span className="flex-1 text-xs text-[var(--color-text-muted)] truncate">
                    {p.url}
                  </span>
                  {p.followers_count != null && (
                    <span className="text-xs font-medium text-[var(--color-text-secondary)] shrink-0">
                      {formatFollowers(p.followers_count)}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save changes'}
        </Button>
      </div>
    </div>
  )
}
