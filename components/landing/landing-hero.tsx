'use client'

import Image from 'next/image'
import { useEffect, useRef } from 'react'

/**
 * 全屏电影感 Hero。
 * - 背景 Ken Burns：14s 交替、幅度 ≤1.04（CSS 动画），离开视口暂停；
 * - 文字分层淡入由页面级 IntersectionObserver（.ld-fade）驱动；
 * - 不渲染 Scroll 提示。
 */
export function LandingHero() {
  const sectionRef = useRef<HTMLElement>(null)
  const mediaRef = useRef<HTMLDivElement>(null)

  // Hero 离开视口后暂停背景动画，回到视口恢复
  useEffect(() => {
    const section = sectionRef.current
    const media = mediaRef.current
    if (!section || !media) return
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          media.dataset.paused = e.isIntersecting ? 'false' : 'true'
        }
      },
      { threshold: 0 },
    )
    io.observe(section)
    return () => io.disconnect()
  }, [])

  return (
    <section
      ref={sectionRef}
      id="hero"
      aria-label="Ace-it 产品介绍"
      className="relative flex flex-col items-center justify-center overflow-hidden px-6 py-32 text-center"
      style={{ minHeight: '100dvh' }}
    >
      {/* 背景影像 */}
      <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
        <div ref={mediaRef} className="ld-kenburns absolute -inset-[3%]">
          <Image
            src="/images/hero-interview.png"
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover object-[62%_40%] brightness-[0.72] saturate-[0.9]"
          />
        </div>
        {/* 暗色遮罩，保证文字可读 */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_58%,transparent_0%,rgba(22,20,17,0.38)_68%,rgba(16,14,11,0.72)_100%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(22,20,17,0.5)_0%,transparent_32%,transparent_62%,rgba(16,14,11,0.62)_100%)]" />
      </div>

      {/* 内容 */}
      <div className="relative z-[1] max-w-4xl">
        <p className="ld-fade font-mono text-[11px] font-medium uppercase tracking-[0.34em] text-[#f0e9dc]/75">
          AI Mock Interview
          <span
            aria-hidden="true"
            className="mx-4 inline-block h-px w-7 bg-[#f0e9dc]/45 align-middle"
          />
          For Software Candidates
          <span
            aria-hidden="true"
            className="mx-4 inline-block h-px w-7 bg-[#f0e9dc]/45 align-middle"
          />
          Resume-Driven
        </p>

        <h1 className="ld-fade ld-d1 mt-10 font-serif font-bold leading-none tracking-tight text-[#faf6ee] text-[clamp(4rem,13vw,9.5rem)]">
          Ace<span className="text-accent-strong">-it</span>
        </h1>

        <p className="ld-fade ld-d2 mx-auto mt-7 max-w-md font-serif text-lg font-semibold leading-relaxed text-[#f0e9dc]/95 md:text-xl">
          你的简历，就是这场面试的出题人
        </p>
        <p className="ld-fade ld-d2 mx-auto mt-4 max-w-md text-sm leading-relaxed text-[#f0e9dc]/70 md:text-[15px]">
          从真实项目经历出题，在回答中继续追问，直到问题触及你真正掌握的边界。
        </p>

        <div className="ld-fade ld-d3 mt-12">
          <a
            href="#enter"
            className="group inline-flex h-13 items-center gap-3 rounded-full border border-[#f0e9dc]/40 bg-[#f0e9dc]/5 px-9 text-[13px] font-medium tracking-[0.14em] text-[#faf6ee] transition-colors duration-500 hover:border-accent-strong hover:bg-accent-strong hover:text-[#fff9f5] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent-strong"
          >
            开始一场模拟面试
            <span
              aria-hidden="true"
              className="inline-block transition-transform duration-500 group-hover:translate-x-1.5"
            >
              →
            </span>
          </a>
        </div>
      </div>
    </section>
  )
}
