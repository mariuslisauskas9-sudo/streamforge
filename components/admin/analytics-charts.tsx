'use client'

import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie,
} from 'recharts'
import { Card } from '@/components/ui/card'

type CreatorBar = { name: string; count: number }
type TypeSlice = { name: string; count: number; color: string }

interface Props {
  creatorData: CreatorBar[]
  typeData: TypeSlice[]
}

function BarTip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: '#16162a', border: '1px solid #2a2a3a',
      borderRadius: 8, padding: '7px 12px', boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
    }}>
      <p style={{ color: '#9898b0', fontSize: 11, marginBottom: 3 }}>{label}</p>
      <p style={{ color: '#f0f0f5', fontSize: 13, fontWeight: 600 }}>{payload[0].value} events</p>
    </div>
  )
}

function PieTip({ active, payload }: any) {
  if (!active || !payload?.length) return null
  const item = payload[0]
  return (
    <div style={{
      background: '#16162a', border: '1px solid #2a2a3a',
      borderRadius: 8, padding: '7px 12px', boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
    }}>
      <p style={{ color: item.payload.color, fontSize: 12, fontWeight: 600, marginBottom: 3 }}>
        {item.name}
      </p>
      <p style={{ color: '#f0f0f5', fontSize: 13, fontWeight: 600 }}>{item.value} events</p>
    </div>
  )
}

export function AnalyticsCharts({ creatorData, typeData }: Props) {
  const total = typeData.reduce((s, t) => s + t.count, 0)

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      {/* Events per creator — horizontal bars */}
      <Card>
        <div className="mb-4">
          <h2 className="text-sm font-heading font-semibold text-[var(--color-text-primary)]">
            Events per creator
          </h2>
          <p className="text-xs text-[var(--color-text-muted)] mt-0.5">Top 5 this month</p>
        </div>
        {creatorData.length === 0 ? (
          <div className="h-40 flex items-center justify-center">
            <p className="text-sm text-[var(--color-text-muted)]">No events this month</p>
          </div>
        ) : (
          <div style={{ height: Math.max(creatorData.length * 38 + 24, 120) }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={creatorData}
                layout="vertical"
                margin={{ top: 0, right: 12, left: 0, bottom: 0 }}
              >
                <XAxis
                  type="number"
                  tick={{ fill: '#9898b0', fontSize: 11 }}
                  axisLine={{ stroke: '#2a2a3a' }}
                  tickLine={false}
                  allowDecimals={false}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fill: '#c8c8d8', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  width={90}
                />
                <Tooltip content={<BarTip />} cursor={{ fill: 'rgba(124,106,255,0.07)' }} />
                <Bar dataKey="count" radius={[0, 3, 3, 0]} maxBarSize={16}>
                  {creatorData.map((_, i) => (
                    <Cell
                      key={i}
                      fill={i === 0
                        ? '#7c6aff'
                        : `rgba(124,106,255,${Math.max(0.28, 0.82 - i * 0.13)})`}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>

      {/* Event type breakdown — donut + legend */}
      <Card>
        <div className="mb-4">
          <h2 className="text-sm font-heading font-semibold text-[var(--color-text-primary)]">
            Event type breakdown
          </h2>
          <p className="text-xs text-[var(--color-text-muted)] mt-0.5">This month</p>
        </div>
        {typeData.length === 0 ? (
          <div className="h-40 flex items-center justify-center">
            <p className="text-sm text-[var(--color-text-muted)]">No events this month</p>
          </div>
        ) : (
          <div className="flex items-center gap-5">
            <div style={{ width: 156, height: 156, flexShrink: 0 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={typeData}
                    cx="50%"
                    cy="50%"
                    innerRadius={42}
                    outerRadius={70}
                    dataKey="count"
                    strokeWidth={0}
                    paddingAngle={typeData.length > 1 ? 2 : 0}
                  >
                    {typeData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<PieTip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="flex flex-col gap-3.5 flex-1 min-w-0">
              {typeData.map((item) => {
                const pct = total ? Math.round((item.count / total) * 100) : 0
                return (
                  <div key={item.name}>
                    <div className="flex items-baseline justify-between mb-1.5">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <div
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="text-xs text-[var(--color-text-secondary)] truncate">
                          {item.name}
                        </span>
                      </div>
                      <span className="text-xs font-semibold text-[var(--color-text-primary)] ml-2 shrink-0">
                        {item.count}
                      </span>
                    </div>
                    <div className="h-1 rounded-full overflow-hidden bg-[var(--color-bg-hover)]">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${pct}%`, backgroundColor: item.color }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
