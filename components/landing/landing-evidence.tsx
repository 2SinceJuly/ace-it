'use client'

import Image from 'next/image'
import { useCallback, useEffect, useRef, useState } from 'react'

/** 打字内容片段：accent 为 true 的片段以陶土橙渲染（简历关键词高亮） */
type Segment = { text: string; accent?: boolean }

type Card = {
  id: string
  label: string
  title: string
  image: string
  imagePosition: string
  prompt: string
  segments: Segment[]
}

/**
 * 三张卡片的内容全部来自项目现有演示数据（demo 简历与其派生问题），
 * 不虚构性能数字与项目成绩。
 */
const CARDS: Card[] = [
  {
    id: 'resume',
    label: '简历证据',
    title: '一段真实的项目描述',
    image: '/images/shot-create.webp',
    imagePosition: 'object-[50%_38%]',
    prompt: '悬停查看简历原文',
    segments: [
      { text: '电商后台管理系统：基于 React + TypeScript 重构订单模块，引入' },
      { text: '虚拟列表', accent: true },
      { text: '优化万级数据渲染。' },
    ],
  },
  {
    id: 'question',
    label: '定向问题',
    title: 'AI 根据关键词出题',
    image: '/images/shot-room.webp',
    imagePosition: 'object-[50%_30%]',
    prompt: '悬停查看生成的主问题',
    segments: [
      { text: '我看到你在订单模块中引入了' },
      { text: '虚拟列表', accent: true },
      { text: '来优化万级数据渲染。能具体说说你当时为什么选择虚拟列表，而不是分页或懒加载吗？' },
    ],
  },
  {
    id: 'followup',
    label: '深度追问',
    title: '沿回答继续深入',
    image: '/images/shot-room.webp',
    imagePosition: 'object-[50%_68%]',
    prompt: '悬停查看后续追问',
    segments: [
      { text: '你提到滚动时按可视区域回收节点。当' },
      { text: '行高不固定', accent: true },
      { text: '时，你是怎么估算总高度并保证滚动位置稳定的？' },
    ],
  },
]

/** 逐字输出：24–32ms/字符，标点轻微停顿，表达 SSE 增量语义 */
function charDelay(ch: string) {
  if ('，、；：'.includes(ch)) return 90
  if ('。？！'.includes(ch)) return 150
  return 28
}

function TypewriterCard({
  card,
  active,
  onActivate,
  onDeactivate,
}: {
  card: Card
  active: boolean
  onActivate: () => void
  onDeactivate: () => void
}) {
  const total = card.segments.reduce((n, s) => n + s.text.length, 0)
  const [count, setCount] = useState(0)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const reduced =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches

  // 激活时逐字输出；离开后恢复初始状态
  useEffect(() => {
    if (!active) {
      if (timerRef.current) clearTimeout(timerRef.current)
      setCount(0)
      return
    }
    if (reduced) {
      setCount(total)
      return
    }
    let i = 0
    const flat = card.segments.map((s) => s.text).join('')
    const step = () => {
      i += 1
      setCount(i)
      if (i < total) {
        timerRef.current = setTimeout(step, charDelay(flat[i - 1]))
      }
    }
    timerRef.current = setTimeout(step, 120)
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [active, card.segments, total, reduced])

  const typing = active && count < total

  // 按累计字符数跨片段切片渲染
  let remaining = count
  const rendered = card.segments.map((seg, i) => {
    const take = Math.max(0, Math.min(seg.text.length, remaining))
    remaining -= take
    return (
      <span key={i} className={seg.accent ? 'font-medium text-accent-strong' : undefined}>
        {seg.text.slice(0, take)}
      </span>
    )
  })

  return (
    <article
      tabIndex={0}
      role="button"
      aria-expanded={active}
      aria-label={`${card.label}：${card.title}，${active ? '收起' : '展开'}示例`}
      onMouseEnter={onActivate}
      onMouseLeave={onDeactivate}
      onClick={() => {
        // 桌面端由 hover 驱动，点击不切换（否则悬停激活后点击会立即取消）；
        // 触屏设备（无 hover）用点击切换展开/收起。
        const hasHover = window.matchMedia('(hover: hover)').matches
        if (hasHover) {
          if (!active) onActivate()
          return
        }
        active ? onDeactivate() : onActivate()
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          active ? onDeactivate() : onActivate()
        }
      }}
      className="ld-fade group cursor-pointer overflow-hidden rounded-lg border border-divider bg-surface transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_24px_48px_-28px_rgba(24,24,22,0.25)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent-strong"
    >
      {/* 真实产品界面截图（裁切） */}
      <div className="relative aspect-[4/3] overflow-hidden border-b border-divider bg-surface-subtle">
        <Image
          src={card.image || "/placeholder.svg"}
          alt={`Ace-it 产品界面：${card.title}`}
          fill
          sizes="(max-width: 768px) 100vw, 33vw"
          className={`object-cover ${card.imagePosition} transition-transform duration-1000 group-hover:scale-[1.04]`}
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[linear-gradient(180deg,transparent_55%,rgba(24,24,22,0.14)_100%)]"
        />
      </div>

      <div className="p-6 md:p-7">
        <p className="font-mono text-[10px] font-medium uppercase tracking-[0.24em] text-accent-strong">
          {card.label}
        </p>
        <h3 className="mt-2.5 font-serif text-xl font-bold tracking-tight text-ink">
          {card.title}
        </h3>

        <div className="relative mt-5 min-h-32 border-t border-divider pt-4">
          {/* 初始提示 */}
          <p
            className={`text-sm italic text-ink-muted/80 transition-opacity duration-300 ${active ? 'opacity-0' : 'opacity-100'}`}
            aria-hidden={active}
          >
            <span aria-hidden="true" className="not-italic text-accent-strong">
              ↳{' '}
            </span>
            {card.prompt}
            <span className="md:hidden">（点击展开）</span>
          </p>
          {/* 逐字输出内容 */}
          {active && (
            <p className="absolute inset-x-0 top-4 text-sm leading-relaxed text-ink">
              {rendered}
              {typing && <span className="ld-caret" aria-hidden="true" />}
            </p>
          )}
        </div>
      </div>
    </article>
  )
}

/** “问题从哪里来”互动区：同一时刻只允许一张卡片处于打字状态 */
export function LandingEvidence() {
  const [activeId, setActiveId] = useState<string | null>(null)
  const deactivate = useCallback(() => setActiveId(null), [])

  return (
    <section
      id="evidence"
      aria-label="面试现场"
      className="scroll-mt-16 bg-surface-subtle/50 px-6 py-28 md:py-40"
    >
      <header className="mx-auto max-w-3xl text-center">
        <p className="ld-fade font-mono text-[11px] font-medium uppercase tracking-[0.3em] text-accent-strong">
          02 · 面试现场
        </p>
        <h2 className="ld-fade ld-d1 mt-6 font-serif text-4xl font-bold leading-[1.2] tracking-tight text-ink text-balance md:text-5xl">
          每一次追问
          <br />
          都有它的来处
        </h2>
        <p className="ld-fade ld-d2 mx-auto mt-6 max-w-xl text-[15px] leading-relaxed text-ink-muted text-pretty">
          下面是一条真实的出题链路：从简历中的一句项目描述，到定向主问题，再到沿回答展开的追问。
        </p>
      </header>

      <div className="mx-auto mt-16 grid max-w-6xl gap-6 md:mt-24 md:grid-cols-3 md:gap-8">
        {CARDS.map((card) => (
          <TypewriterCard
            key={card.id}
            card={card}
            active={activeId === card.id}
            onActivate={() => setActiveId(card.id)}
            onDeactivate={deactivate}
          />
        ))}
      </div>
    </section>
  )
}
