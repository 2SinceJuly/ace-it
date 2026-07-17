import { BrandMark } from '@/components/brand'
import { LoginForm } from '@/components/login-form'

/**
 * 最终登录区域：直接复用现有 LoginForm（预填体验账号、密码可见性切换、
 * 真实登录接口与跳转逻辑全部保持不变），双栏构图参考 Stillwater 预约区。
 */
export function LandingLogin() {
  return (
    <section
      id="enter"
      aria-label="进入平台"
      className="scroll-mt-16 bg-surface-subtle/60 px-6 py-28 md:py-40"
    >
      <div className="mx-auto grid max-w-5xl items-start gap-12 md:grid-cols-2 md:gap-20">
        <div className="pt-2">
          <p className="ld-fade font-mono text-[11px] font-medium uppercase tracking-[0.3em] text-accent-strong">
            04 · 进入平台
          </p>
          <h2 className="ld-fade ld-d1 mt-6 font-serif text-4xl font-bold leading-[1.2] tracking-tight text-ink text-balance md:text-[2.75rem]">
            准备好接受
            <br />
            下一次追问了吗
          </h2>
          <p className="ld-fade ld-d2 mt-6 max-w-md text-[15px] leading-relaxed text-ink-muted text-pretty">
            使用体验账号进入工作台，粘贴一份简历，开始一场真正针对你的模拟面试。
          </p>
          <ul className="ld-fade ld-d2 mt-8 flex flex-col gap-2.5 border-t border-divider pt-6 text-sm leading-relaxed text-ink-muted">
            {[
              '体验账号已自动填充，无需注册',
              '面试可随时暂存，从历史记录继续',
              '结束后生成逐题复盘与整体报告',
            ].map((item) => (
              <li key={item} className="flex items-baseline gap-2.5">
                <span
                  aria-hidden="true"
                  className="size-1.5 shrink-0 translate-y-[-1px] rounded-full bg-accent-strong"
                />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="ld-fade ld-d1 rounded-lg border border-divider bg-surface p-7 shadow-[0_30px_60px_-45px_rgba(24,24,22,0.35)] md:p-9">
          <h3 className="font-serif text-xl font-bold text-ink">进入面试工作台</h3>
          <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">
            体验账号已自动填充，可直接进入模拟面试
          </p>
          <div className="mt-7">
            <LoginForm />
          </div>
        </div>
      </div>
    </section>
  )
}

/** Footer：与整页编辑风格一致，仅一行技术说明，不生成虚假链接 */
export function LandingFooter() {
  return (
    <footer className="border-t border-divider bg-canvas px-6 pb-10 pt-16">
      <div className="mx-auto flex max-w-5xl flex-col gap-10 md:flex-row md:items-start md:justify-between">
        <div className="max-w-xs">
          <p className="font-serif text-2xl font-bold tracking-tight text-ink">
            <BrandMark />
          </p>
          <p className="mt-3 text-sm leading-relaxed text-ink-muted text-pretty">
            让每一段写进简历的经历，都经得住下一次追问。
          </p>
        </div>
        <nav aria-label="页脚导航" className="flex flex-col gap-2.5 text-sm">
          <a
            href="#enter"
            className="text-ink-muted transition-colors hover:text-accent-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-strong"
          >
            开始面试
          </a>
          <a
            href="/history"
            className="text-ink-muted transition-colors hover:text-accent-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-strong"
          >
            历史面试
          </a>
          <a
            href="#capabilities"
            className="text-ink-muted transition-colors hover:text-accent-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-strong"
          >
            项目说明
          </a>
        </nav>
      </div>
      <div className="mx-auto mt-12 flex max-w-5xl flex-wrap items-center justify-between gap-3 border-t border-divider/60 pt-6">
        <p className="font-mono text-[11px] tracking-[0.14em] text-ink-muted/70">
          Next.js · TypeScript · PostgreSQL · SSE · TTS
        </p>
        <p className="font-mono text-[11px] tracking-[0.14em] text-ink-muted/70">
          Ace-it · AI 模拟面试平台
        </p>
      </div>
    </footer>
  )
}
