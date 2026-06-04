'use client'

import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'

interface Props {
  value: string                   // HH:MM 24-hour; empty string shows 12:00 PM
  onChange: (v: string) => void   // emits HH:MM 24-hour
}

// 12 listed first so the scroll starts at 12 (most common default)
const HOURS = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
const BASE_MINS = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55]

function minuteList(current: number): number[] {
  if (BASE_MINS.includes(current)) return BASE_MINS
  return [...BASE_MINS, current].sort((a, b) => a - b)
}

function parse(value: string): { h12: number; mm: number; ampm: 'AM' | 'PM' } {
  if (!value || !value.includes(':')) return { h12: 12, mm: 0, ampm: 'PM' }
  const h24 = parseInt(value.split(':')[0] ?? '12', 10)
  const mm  = parseInt(value.split(':')[1] ?? '0',  10)
  const ampm = h24 >= 12 ? 'PM' : 'AM'
  const h12  = h24 === 0 ? 12 : h24 > 12 ? h24 - 12 : h24
  return { h12, mm, ampm }
}

function build(h12: number, mm: number, ampm: 'AM' | 'PM'): string {
  let h24 = h12
  if (ampm === 'AM' && h12 === 12) h24 = 0
  else if (ampm === 'PM' && h12 !== 12) h24 = h12 + 12
  return `${String(h24).padStart(2, '0')}:${String(mm).padStart(2, '0')}`
}

export function TimeSelect({ value, onChange }: Props) {
  const { h12, mm, ampm } = parse(value)
  const mins = minuteList(mm)

  return (
    <div className="flex gap-1">
      <Select value={String(h12)} onValueChange={(v) => onChange(build(Number(v), mm, ampm))}>
        <SelectTrigger className="w-16">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {HOURS.map((h) => (
            <SelectItem key={h} value={String(h)}>{h}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={String(mm).padStart(2, '0')}
        onValueChange={(v) => onChange(build(h12, Number(v), ampm))}
      >
        <SelectTrigger className="w-16">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {mins.map((m) => {
            const s = String(m).padStart(2, '0')
            return <SelectItem key={s} value={s}>{s}</SelectItem>
          })}
        </SelectContent>
      </Select>

      <Select value={ampm} onValueChange={(v) => onChange(build(h12, mm, v as 'AM' | 'PM'))}>
        <SelectTrigger className="w-[4.5rem]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="AM">AM</SelectItem>
          <SelectItem value="PM">PM</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}
