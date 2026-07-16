import type { Metadata } from 'next'
import { BrandMark } from '@/components/brand'
import { InterviewThread } from '@/components/interview-thread'
import { LoginForm } from '@/components/login-form'

export const metadata: Metadata = {
  title: '登录 — Ace-it',
}

export default function LoginPage() {
  return (
    <main className="theme-paper min-h-dvh bg-canvas text-ink">
      <div className="flex min-h-dvh flex-col md:flex-row">
        {/* ——— 左栏 62%：品牌 + Interview Thread 产品视觉 ——— */}
        <section
          className="order-2 flex flex-col justify-center px-6 py-12 md:order-1 md:w-[62%] md:px-12 md:py-0 lg:px-16"
          aria-label="产品介绍"
        >
          <div className="mx-auto w-full max-w-2xl md:mx-0">
            <p className="lp-seq lp-d0 hidden items-baseline gap-3 font-serif text-ink md:flex">
              <span className="text-sm font-semibold tracking-wide">
                <BrandMark />
              </span>
              <span className="text-xs font-normal text-ink-muted">模拟面试平台</span>
            </p>
            <h1 className="lp-seq lp-d0 mt-4 font-serif font-bold tracking-tight text-ink">
              <span className="block text-4xl leading-[1.25] lg:text-[3.25rem] lg:leading-[1.18]">
                你的简历
              </span>
              <span className="block whitespace-nowrap text-[2rem] leading-[1.3] lg:text-[3rem] lg:leading-[1.22]">
                就是这场面试的出题人
              </span>
            </h1>
            <p className="lp-seq lp-d1 mt-5 max-w-lg text-base leading-relaxed text-ink-muted text-pretty">
              粘贴简历，Ace-it 从你的真实项目经历中定向出题，
              以流式问答与逐层追问还原技术面试的节奏，最终生成逐题复盘报告。
            </p>

            <InterviewThread />
          </div>
        </section>

        {/* ——— 右栏 38%：登录面板 ——— */}
        <section
          className="order-1 flex flex-col justify-center bg-[linear-gradient(175deg,var(--surface)_0%,#f6f1e6_100%)] px-6 py-10 shadow-[0_8px_24px_-16px_rgba(24,24,22,0.3)] md:order-2 md:w-[38%] md:px-10 md:py-0 md:shadow-[-12px_0_40px_-32px_rgba(24,24,22,0.35)] lg:px-14"
          aria-label="登录"
        >
          <div className="lp-seq lp-d5 mx-auto w-full max-w-sm md:mx-0">
            {/* 移动端品牌名（桌面端品牌在左栏） */}
            <p className="mb-8 flex items-baseline gap-2.5 font-serif text-ink md:hidden">
              <span className="text-sm font-semibold tracking-wide">
                <BrandMark />
              </span>
              <span className="text-xs font-normal text-ink-muted">模拟面试平台</span>
            </p>

            <h2 className="font-serif text-2xl font-bold text-ink">进入面试工作台</h2>
            <p className="mt-2 text-sm leading-relaxed text-ink-muted">
              体验账号已自动填充，可直接进入模拟面试
            </p>

            <div className="mt-7">
              <LoginForm />
            </div>

            <p className="mt-10 border-t border-divider pt-5 text-xs leading-relaxed text-ink-muted">
              演示环境仅用于体验，简历内容只用于生成面试问题与复盘报告
            </p>
          </div>
        </section>
      </div>
    </main>
  )
}
