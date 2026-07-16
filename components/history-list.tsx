'use client'

import Link from 'next/link'
import { Virtuoso } from 'react-virtuoso'
import { ArrowRight } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'

export interface HistoryItem {
  id: string
  candidateName: string
  targetRole: string
  techStack: string[]
  questionCount: number
  state: string
  createdAt: string
  overallScore: number | null
}

const STATE_LABEL: Record<string, { label: string; tone: 'muted' | 'accent' | 'warning' | 'success' }> = {
  CREATED: { label: '未开始', tone: 'muted' },
  GREETING: { label: '进行中', tone: 'accent' },
  QUESTIONING: { label: '进行中', tone: 'accent' },
  CLOSING: { label: '待生成报告', tone: 'warning' },
  REPORTING: { label: '报告生成中', tone: 'warning' },
  FINISHED: { label: '已完成', tone: 'success' },
}

export function HistoryList({ items }: { items: HistoryItem[] }) {
  if (items.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-divider text-center">
        <p className="text-sm text-ink-muted">还没有面试记录</p>
        <Link
          href="/"
          className="flex items-center gap-1.5 rounded-md bg-accent-strong px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-accent-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-strong"
        >
          创建第一场面试
          <ArrowRight className="size-3.5" aria-hidden="true" />
        </Link>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden rounded-lg border border-divider bg-surface">
      <Virtuoso
        className="flex-1"
        data={items}
        itemContent={(_index, item) => <HistoryRow item={item} />}
        aria-label="历史面试列表"
      />
    </div>
  )
}

function HistoryRow({ item }: { item: HistoryItem }) {
  const finished = item.state === 'FINISHED'
  const href = finished ? `/report/${item.id}` : `/interview/${item.id}`
  const state = STATE_LABEL[item.state] ?? { label: item.state, tone: 'muted' as const }
  const d = new Date(item.createdAt)
  const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  const timeStr = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`

  return (
    <Link
      href={href}
      className="group flex items-center gap-4 border-b border-divider px-4 py-3.5 transition-colors hover:bg-surface-subtle md:px-5"
    >
      {/* 日期时间（等宽数据列） */}
      <div className="hidden w-24 shrink-0 flex-col sm:flex">
        <span className="font-mono text-xs text-ink">{dateStr}</span>
        <span className="font-mono text-xs text-ink-muted">{timeStr}</span>
      </div>

      {/* 面试方向 + 技术栈 */}
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-medium text-ink">
            {item.candidateName} · {item.targetRole}
          </span>
          {/* 状态标签：唯一允许 pill 的地方 */}
          <span
            className={cn(
              'shrink-0 rounded-full px-2 py-0.5 text-xs',
              state.tone === 'muted' && 'bg-surface-subtle text-ink-muted',
              state.tone === 'accent' && 'bg-accent-soft text-accent-strong',
              state.tone === 'warning' && 'bg-warning/10 text-warning',
              state.tone === 'success' && 'bg-success/10 text-success',
            )}
          >
            {state.label}
          </span>
        </div>
        <p className="truncate text-xs text-ink-muted">
          <span className="font-mono">{item.questionCount} 题</span>
          <span className="sm:hidden">
            {' · '}
            <span className="font-mono">{dateStr}</span>
          </span>
          {item.techStack.length > 0 && ` · ${item.techStack.slice(0, 4).join(' / ')}`}
        </p>
      </div>

      {/* 得分（仅已完成） + 入口 */}
      <div className="flex shrink-0 items-center gap-4">
        {finished && item.overallScore !== null && (
          <span className="font-mono text-lg font-semibold text-ink">
            {item.overallScore}
            <span className="text-xs font-normal text-ink-muted">/100</span>
          </span>
        )}
        <span className="flex items-center gap-1 text-xs text-ink-muted transition-colors group-hover:text-accent-strong">
          {finished ? '查看报告' : item.state === 'CREATED' ? '开始面试' : '继续面试'}
          <ArrowRight className="size-3.5" aria-hidden="true" />
        </span>
      </div>
    </Link>
  )
}
