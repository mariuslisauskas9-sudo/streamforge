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
import { Separator } from '@/components/ui/separator'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { getInitials, platformLabels, formatFollowers } from '@/lib/utils'
import StatusBadge from '@/components/StatusBadge'
import type { ProfileWithLinks, Platform } from '@/types'
import toast from 'react-hot-toast'
import { Plus, Trash2 } from 'lucide-react'

const CLIENT_PLATFORMS: Platform[] = ['twitch', 'youtube', 'kick', 'tiktok', 'instagram']

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
  })
  const [platformLinks, setPlatformLinks] = useState(profile.platform_links ?? [])
  const [newPlatform, setNewPlatform] = useState<Platform>('twitch')
  const [newUrl, setNewUrl] = useState('')
  const [newFollowers, setNewFollowers] = useState('')

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

  async function addPlatformLink() {
    if (!newUrl.trim()) return
    const supabase = createClient()

    const { data, error } = await supabase
      .from('platform_links')
      .insert({
        profile_id: profile.id,
        platform: newPlatform,
        url: newUrl.trim(),
        followers_count: newFollowers ? parseInt(newFollowers) : null,
      })
      .select()
      .single()

    if (error) {
      toast.error('Error adding platform')
    } else {
      setPlatformLinks((l) => [...l, data])
      setNewUrl('')
      setNewFollowers('')
      toast.success('Platform added')
    }
  }

  async function removePlatformLink(id: string) {
    const supabase = createClient()
    const { error } = await supabase.from('platform_links').delete().eq('id', id)

    if (error) {
      toast.error('Error removing platform')
    } else {
      setPlatformLinks((l) => l.filter((p) => p.id !== id))
      toast.success('Platform removed')
    }
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
          </div>
        </CardContent>
      </Card>

      {/* Platform links */}
      <Card>
        <CardHeader>
          <CardTitle>Platforms</CardTitle>
        </CardHeader>
        <CardContent>
          {platformLinks.length > 0 && (
            <>
              <div className="flex flex-col gap-2 mb-4">
                {platformLinks.map((p) => (
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
                    <button
                      onClick={() => removePlatformLink(p.id)}
                      className="text-[var(--color-text-muted)] hover:text-[var(--color-coral)] transition-colors shrink-0 ml-1"
                      aria-label="Remove platform"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
              <Separator className="mb-4" />
            </>
          )}

          <p className="text-xs font-medium text-[var(--color-text-muted)] mb-3">
            Add platform
          </p>
          <div className="flex gap-2 flex-wrap">
            <Select
              value={newPlatform}
              onValueChange={(v) => setNewPlatform(v as Platform)}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CLIENT_PLATFORMS.map((val) => (
                  <SelectItem key={val} value={val}>
                    {platformLabels[val]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              className="flex-1 min-w-[160px]"
              placeholder="https://twitch.tv/username"
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
            />
            <Input
              className="w-28"
              type="number"
              placeholder="Followers"
              value={newFollowers}
              onChange={(e) => setNewFollowers(e.target.value)}
            />
            <Button
              size="icon"
              onClick={addPlatformLink}
              disabled={!newUrl.trim()}
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save changes'}
        </Button>
      </div>
    </div>
  )
}
