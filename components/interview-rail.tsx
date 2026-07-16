'use client'

import { cn } from '@/lib/utils'

export interface OutlineNode {
  orderIndex: number
  topic: string
  difficulty: string
}

interface RailProps {
  outline: OutlineNode[]
  questionCount: number
  /** 当前主问题下标（来自 FSM currentQuestionIndex） */
  questionIndex: number
  /** 当前追问深度（来自 FSM followUpDepth，上限 2） */
  followUpDepth: number
  /** 开场是否已完成（存在任何消息即视为已开场） */
  greetingDone: boolean
  /** 面试是否已进入结束态 */
  closed: boolean
  /** AI 正在生成或播报时，当前节点呼吸 */
  live: boolean
}

type NodeStatus = 'done' | 'current' | 'pending'

/**
 * Interview Rail — 面试轨道。
 * 节点全部来自有限状态机真实数据：开场 → 各主问题（含追问深度刻度）→ 结束与报告。
 */
export function InterviewRail({
  outline,
  questionCount,
  questionIndex,
  followUpDepth,
  greetingDone,
  closed,
  live,
}: RailProps) {
  const nodes = outline.slice(0, questionCount)

  function questionStatus(i: number): NodeStatus {
    if (closed) return 'done'
    if (i < questionIndex) return 'done'
    if (i === questionIndex && greetingDone) return 'current'
    return 'pending'
  }

  const greetingStatus: NodeStatus = greetingDone ? 'done' : 'current'
  const closingStatus: NodeStatus = closed ? 'current' : 'pending'

  return (
    <nav aria-label="面试进度" className="flex flex-col">
      <p className="mb-4 font-mono text-xs font-medium tracking-widest text-ink-muted">
        INTERVIEW RAIL
      </p>
      <ol className="flex flex-col">
        <RailNode
          status={greetingStatus}
          live={live && !greetingDone}
          marker="—"
          label="开场"
          sublabel={null}
          last={false}
        />
        {nodes.map((node, i) => {
          const status = questionStatus(i)
          return (
            <RailNode
              key={node.orderIndex}
              status={status}
              live={live && status === 'current'}
              marker={`Q${i + 1}`}
              label={node.topic}
              sublabel={
                status === 'current' && followUpDepth > 0
                  ? `追问 ${followUpDepth}/2`
                  : status === 'current'
                    ? node.difficulty
                    : null
              }
              followUpDepth={status === 'current' ? followUpDepth : 0}
              last={false}
            />
          )
        })}
        <RailNode
          status={closingStatus}
          live={live && closed}
          marker="◼"
          label="结束与报告"
          sublabel={null}
          last
        />
      </ol>
      {!closed && greetingDone && (
        <p className="mt-4 font-mono text-xs text-ink-muted">
          剩余 {Math.max(0, nodes.length - questionIndex - 1)} 题
        </p>
      )}
    </nav>
  )
}

function RailNode({
  status,
  live,
  marker,
  label,
  sublabel,
  followUpDepth = 0,
  last,
}: {
  status: NodeStatus
  live: boolean
  marker: string
  label: string
  sublabel: string | null
  followUpDepth?: number
  last: boolean
}) {
  return (
    <li className="relative flex gap-3">
      {/* 轨道竖线 + 节点 */}
      <div className="flex flex-col items-center">
        <span className="relative flex size-5 items-center justify-center">
          {live && (
            <span
              aria-hidden="true"
              className="rail-breathe absolute size-2.5 rounded-full bg-accent-strong/40"
            />
          )}
          <span
            aria-hidden="true"
            className={cn(
              'size-2 rounded-full transition-colors',
              status === 'current' && 'bg-accent-strong',
              status === 'done' && 'bg-ink-muted/50',
              status === 'pending' && 'border border-divider bg-transparent',
            )}
          />
        </span>
        {!last && <span aria-hidden="true" className="w-px flex-1 bg-divider" />}
      </div>

      <div className={cn('flex min-w-0 flex-1 flex-col pb-5', last && 'pb-0')}>
        <div className="flex items-baseline gap-2">
          <span
            className={cn(
              'font-mono text-xs font-semibold',
              status === 'current' ? 'text-accent-strong' : 'text-ink-muted',
            )}
          >
            {marker}
          </span>
          <span
            className={cn(
              'truncate text-sm',
              status === 'current' && 'font-semibold text-ink',
              status === 'done' && 'text-ink-muted line-through decoration-divider',
              status === 'pending' && 'text-ink-muted',
            )}
          >
            {label}
            {status === 'current' && <span className="sr-only">（当前）</span>}
          </span>
        </div>
        {sublabel && (
          <div className="mt-1 flex items-center gap-1.5 pl-7">
            {followUpDepth > 0 && (
              <span aria-hidden="true" className="flex gap-0.5">
                {[1, 2].map((d) => (
                  <span
                    key={d}
                    className={cn(
                      'h-1 w-3 rounded-full',
                      d <= followUpDepth ? 'bg-warning' : 'bg-divider',
                    )}
                  />
                ))}
              </span>
            )}
            <span className="font-mono text-xs text-ink-muted">{sublabel}</span>
          </div>
        )}
      </div>
    </li>
  )
}
