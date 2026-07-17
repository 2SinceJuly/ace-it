'use client'

import { CircleNotch, List, SpeakerHigh, SpeakerSlash, X } from '@phosphor-icons/react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { BrandMark } from '@/components/brand'
import { LandingCapabilities } from '@/components/landing/landing-capabilities'
import { LandingEvidence } from '@/components/landing/landing-evidence'
import { LandingHero } from '@/components/landing/landing-hero'
import { LandingFooter, LandingLogin } from '@/components/landing/landing-login'
import { LandingProcess } from '@/components/landing/landing-process'

/* ——— 导航锚点 ——— */
const NAV_LINKS = [
  { href: '#capabilities', label: '工作方式' },
  { href: '#evidence', label: '面试现场' },
  { href: '#process', label: '完整流程' },
  { href: '#enter', label: '进入平台' },
] as const

/* ——— 状态指示器：随当前章节变化（IntersectionObserver 驱动） ——— */
const SECTION_STATUS: Record<string, { label: string; phase: string }> = {
  hero: { label: '准备面试', phase: '等待开始' },
  capabilities: { label: '解析简历', phase: '提取技术经历' },
  evidence: { label: '生成问题', phase: '建立追问方向' },
  process: { label: '面试进行', phase: '控制问题轮次' },
  enter: { label: '准备完成', phase: '进入工作台' },
}

type VoiceState = 'idle' | 'loading' | 'playing' | 'unavailable'

/**
 * 面试官语音预览。
 * - 绝对不自动播放：所有播放都由用户点击触发；
 * - 复用产品真实 TTS 链路（/api/tts-preview 调用同一 DashScope 服务）；
 * - 接口不可用（未配置 / 失败）时进入 unavailable 状态，不伪造播放。
 */
function useVoicePreview() {
  const [state, setState] = useState<VoiceState>('idle')
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const urlRef = useRef<string | null>(null)

  const stop = useCallback(() => {
    const audio = audioRef.current
    if (audio) {
      audio.pause()
      audio.currentTime = 0
    }
    setState((s) => (s === 'unavailable' ? s : 'idle'))
  }, [])

  const play = useCallback(async () => {
    if (state === 'loading' || state === 'unavailable') return
    if (state === 'playing') {
      stop()
      return
    }
    try {
      setState('loading')
      if (!urlRef.current) {
        const res = await fetch('/api/tts-preview')
        if (!res.ok) {
          setState('unavailable')
          return
        }
        const blob = await res.blob()
        urlRef.current = URL.createObjectURL(blob)
      }
      if (!audioRef.current) {
        const audio = new Audio()
        audio.onended = () => setState('idle')
        audio.onerror = () => setState('unavailable')
        audioRef.current = audio
      }
      audioRef.current.src = urlRef.current
      await audioRef.current.play()
      setState('playing')
    } catch {
      setState('unavailable')
    }
  }, [state, stop])

  // 卸载时停止播放并释放资源
  useEffect(() => {
    return () => {
      audioRef.current?.pause()
      if (urlRef.current) URL.revokeObjectURL(urlRef.current)
    }
  }, [])

  return { state, play, stop }
}

/** 播放中的小型波形（仅真实播放时渲染） */
function VoiceWave() {
  return (
    <span className="flex h-3.5 items-end gap-[2px]" aria-hidden="true">
      {[8, 13, 10].map((h, i) => (
        <span key={i} className="ld-wave-bar w-[2.5px] rounded-full bg-current" style={{ height: `${h}px` }} />
      ))}
    </span>
  )
}

export function LandingPage() {
  const rootRef = useRef<HTMLDivElement>(null)
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [sectionId, setSectionId] = useState('hero')
  const [statusVisible, setStatusVisible] = useState(false)
  const [toastState, setToastState] = useState<'hidden' | 'shown' | 'dismissed'>('hidden')
  const voice = useVoicePreview()

  /* 进入视口淡入：观察一次后解绑 */
  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    const els = root.querySelectorAll('.ld-fade')
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add('is-in')
            io.unobserve(e.target)
          }
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -6% 0px' },
    )
    els.forEach((el) => io.observe(el))
    // Hero 内容立即入场
    root.querySelectorAll('#hero .ld-fade').forEach((el) => {
      setTimeout(() => el.classList.add('is-in'), 80)
    })
    return () => io.disconnect()
  }, [])

  /* 导航栏滚动状态：仅在跨过阈值时翻转一次布尔值 */
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  /* 章节观察：以视口中线判定当前章节，驱动状态指示器 */
  useEffect(() => {
    const sections = ['hero', 'capabilities', 'evidence', 'process', 'enter']
      .map((id) => document.getElementById(id))
      .filter(Boolean) as HTMLElement[]
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) setSectionId(e.target.id)
        }
      },
      { rootMargin: '-45% 0px -45% 0px', threshold: 0 },
    )
    sections.forEach((s) => io.observe(s))
    const timer = setTimeout(() => setStatusVisible(true), 1200)
    return () => {
      io.disconnect()
      clearTimeout(timer)
    }
  }, [])

  /* 首次用户交互后显示一次语音试听提示（不自动播放任何声音） */
  useEffect(() => {
    if (toastState !== 'hidden') return
    const show = () => setToastState((s) => (s === 'hidden' ? 'shown' : s))
    window.addEventListener('scroll', show, { passive: true, once: true })
    window.addEventListener('pointerdown', show, { once: true })
    return () => {
      window.removeEventListener('scroll', show)
      window.removeEventListener('pointerdown', show)
    }
  }, [toastState])

  /* 锚点平滑滚动（顶部导航留出偏移） */
  const scrollTo = useCallback((hash: string) => {
    const target = document.getElementById(hash.slice(1))
    if (!target) return
    const y = target.getBoundingClientRect().top + window.scrollY - 56
    window.scrollTo({ top: y, behavior: 'smooth' })
    setMenuOpen(false)
  }, [])

  const status = SECTION_STATUS[sectionId] ?? SECTION_STATUS.hero
  const voiceLabel =
    voice.state === 'playing'
      ? '语音预览 · 开启'
      : voice.state === 'loading'
        ? '语音预览 · 加载中'
        : voice.state === 'unavailable'
          ? '语音预览 · 暂不可用'
          : '语音预览 · 关闭'

  return (
    <div ref={rootRef} className="lp-grain min-h-dvh bg-canvas text-ink">
      {/* ——— 固定顶部导航 ——— */}
      <header
        className={`fixed inset-x-0 top-0 z-50 border-b backdrop-blur-md transition-colors duration-500 ${
          scrolled ? 'border-divider/70 bg-canvas/95' : 'border-transparent bg-canvas/75'
        }`}
      >
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 md:px-6">
          <a
            href="#hero"
            onClick={(e) => {
              e.preventDefault()
              window.scrollTo({ top: 0, behavior: 'smooth' })
            }}
            className="flex items-baseline gap-2.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-strong"
          >
            <span className="font-serif text-base font-semibold tracking-tight text-ink">
              <BrandMark />
            </span>
            <span className="hidden font-mono text-[10px] tracking-[0.14em] text-ink-muted sm:inline">
              AI 模拟面试平台
            </span>
          </a>

          <nav aria-label="主导航" className="hidden items-center gap-7 md:flex">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={(e) => {
                  e.preventDefault()
                  scrollTo(link.href)
                }}
                className="group relative whitespace-nowrap text-[13px] font-medium text-ink-muted transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent-strong"
              >
                {link.label}
                <span
                  aria-hidden="true"
                  className="absolute inset-x-0 -bottom-1.5 h-px origin-left scale-x-0 bg-accent-strong transition-transform duration-500 group-hover:scale-x-100"
                />
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={voice.play}
              disabled={voice.state === 'unavailable' || voice.state === 'loading'}
              aria-label={
                voice.state === 'playing' ? '停止面试官语音预览' : '播放面试官语音预览'
              }
              aria-pressed={voice.state === 'playing'}
              className={`flex h-8 items-center gap-2 rounded-full border px-3.5 font-mono text-[10px] tracking-[0.12em] transition-colors duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-strong disabled:cursor-not-allowed disabled:opacity-55 ${
                voice.state === 'playing'
                  ? 'border-accent-strong bg-accent-strong text-[#fff9f5]'
                  : 'border-divider text-ink-muted hover:border-accent-strong hover:text-accent-strong'
              }`}
            >
              {voice.state === 'playing' ? (
                <VoiceWave />
              ) : voice.state === 'loading' ? (
                <CircleNotch className="size-3.5 animate-spin" aria-hidden="true" />
              ) : voice.state === 'unavailable' ? (
                <SpeakerSlash className="size-3.5" aria-hidden="true" />
              ) : (
                <SpeakerHigh className="size-3.5" aria-hidden="true" />
              )}
              <span className="hidden sm:inline">{voiceLabel}</span>
            </button>

            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              aria-expanded={menuOpen}
              aria-label={menuOpen ? '关闭菜单' : '打开菜单'}
              className="flex size-8 items-center justify-center rounded-md border border-divider text-ink-muted transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-strong md:hidden"
            >
              {menuOpen ? (
                <X className="size-4" aria-hidden="true" />
              ) : (
                <List className="size-4" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>

        {/* 移动端菜单 */}
        {menuOpen && (
          <nav
            aria-label="移动端导航"
            className="border-t border-divider bg-canvas/98 px-4 py-3 md:hidden"
          >
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={(e) => {
                  e.preventDefault()
                  scrollTo(link.href)
                }}
                className="block rounded-md px-2 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-accent-soft focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent-strong"
              >
                {link.label}
              </a>
            ))}
          </nav>
        )}
      </header>

      <main>
        <LandingHero />
        <LandingCapabilities />
        <LandingEvidence />
        <LandingProcess />
        <LandingLogin />
      </main>
      <LandingFooter />

      {/* ——— 左下角面试状态指示器（页面唯一持续脉冲） ——— */}
      <aside
        aria-live="polite"
        aria-label="页面叙事状态"
        className={`pointer-events-none fixed bottom-6 left-6 z-40 hidden items-center gap-3 rounded-full border border-divider/60 bg-canvas/85 py-2 pl-3.5 pr-5 backdrop-blur-md transition-all duration-700 md:flex ${
          statusVisible ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'
        }`}
      >
        <span className="ld-status-dot size-2.5 rounded-full bg-accent-strong" aria-hidden="true" />
        <span className="flex flex-col leading-tight">
          <span className="font-mono text-[10px] font-medium uppercase tracking-[0.2em] text-ink">
            {status.label}
          </span>
          <span className="mt-0.5 text-[11px] text-ink-muted">{status.phase}</span>
        </span>
      </aside>

      {/* ——— 语音试听提示（首次交互后出现一次，绝不自动播放） ——— */}
      <div
        role="dialog"
        aria-label="语音试听提示"
        aria-hidden={toastState !== 'shown'}
        className={`fixed bottom-5 left-1/2 z-50 flex w-max max-w-[calc(100%-2rem)] items-center gap-3 rounded-full bg-ink py-2.5 pl-5 pr-2.5 text-[#faf6ee] shadow-[0_18px_40px_-15px_rgba(24,24,22,0.45)] transition-all duration-700 sm:gap-4 ${
          toastState === 'shown'
            ? '-translate-x-1/2 translate-y-0 opacity-100'
            : 'pointer-events-none -translate-x-1/2 translate-y-[150%] opacity-0'
        }`}
      >
        <p className="whitespace-nowrap text-[13px] sm:text-sm">试听一道面试问题？</p>
        <div className="flex gap-1.5">
          <button
            type="button"
            onClick={() => setToastState('dismissed')}
            className="rounded-full border border-[#faf6ee]/25 px-3.5 py-1.5 text-xs text-[#faf6ee]/80 transition-colors hover:bg-[#faf6ee]/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-strong"
          >
            暂不
          </button>
          <button
            type="button"
            onClick={() => {
              setToastState('dismissed')
              voice.play()
            }}
            className="rounded-full bg-accent-strong px-4 py-1.5 text-xs font-medium text-[#fff9f5] transition-colors hover:bg-accent-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#faf6ee]"
          >
            试听
          </button>
        </div>
      </div>
    </div>
  )
}
