import { Check } from '@phosphor-icons/react/dist/ssr'

/** 语音波形（纯装饰） */
function Waveform({ className = '' }: { className?: string }) {
  return (
    <span className={`flex h-4 items-center gap-[3px] ${className}`} aria-hidden="true">
      {[10, 16, 12, 16, 8].map((h, i) => (
        <span
          key={i}
          className="lp-wave-bar w-[3px] rounded-full bg-accent-strong/70"
          style={{ height: `${h}px` }}
        />
      ))}
    </span>
  )
}

/** 简历关键词：编辑批注式索引标记 */
function Keyword({ n, children, delay }: { n: number; children: string; delay: string }) {
  return (
    <mark
      className={`lp-pop ${delay} relative inline-block bg-transparent px-0.5 font-medium text-ink transition-colors duration-150 hover:bg-accent-soft`}
    >
      <span className="border-b-2 border-accent-strong/80 pb-px">{children}</span>
      <sup className="ml-0.5 font-mono text-[10px] font-semibold text-accent-strong">{n}</sup>
    </mark>
  )
}

/**
 * Interview Thread — 登录页唯一标志性视觉。
 * 简历中的技术关键词以编辑批注形式连线到面试问题；
 * 当前问题珊瑚橙激活，追问分支逐层展开，旁置语音波形。
 * 纯展示组件，不含业务逻辑。
 */
export function InterviewThread() {
  return (
    <div className="mt-10 lg:mt-12">
      {/* ——— 桌面版：简历节选 → 连接线 → 问题线程 ——— */}
      <div className="hidden md:grid md:grid-cols-[minmax(0,5fr)_3.5rem_minmax(0,6fr)] md:items-center">
        {/* 简历节选卡 */}
        <div className="lp-seq lp-d1 relative -rotate-1 rounded-lg border border-divider bg-surface p-5 shadow-[0_1px_2px_rgba(24,24,22,0.05),0_16px_40px_-20px_rgba(24,24,22,0.25)]">
          <p className="font-mono text-[11px] font-medium tracking-widest text-ink-muted">
            简历 · 节选
          </p>
          <p className="mt-3 text-sm leading-7 text-ink-muted">
            负责电商中台前端，使用 <Keyword n={1} delay="lp-d1">React</Keyword>{' '}
            重构订单模块；为运营日志面板引入 <Keyword n={2} delay="lp-d2">SSE</Keyword>{' '}
            实现流式渲染；主导首屏 <Keyword n={3} delay="lp-d2">性能优化</Keyword>
            ，LCP 由 3.8s 降至 1.6s。
          </p>
          <p className="mt-3 font-mono text-[11px] text-ink-muted/70">
            3 个关键词被选为出题依据 →
          </p>
        </div>

        {/* 连接线 */}
        <div className="relative h-full" aria-hidden="true">
          <svg
            className="absolute inset-0 h-full w-full overflow-visible"
            viewBox="0 0 56 240"
            preserveAspectRatio="none"
            fill="none"
          >
            <path
              className="lp-draw lp-d3"
              d="M0 90 C 28 90, 28 44, 56 44"
              stroke="var(--divider)"
              strokeWidth="1.5"
            />
            <path
              className="lp-draw lp-d3"
              d="M0 120 C 30 120, 26 118, 56 118"
              stroke="var(--accent-strong)"
              strokeWidth="2"
            />
            <path
              className="lp-draw lp-d3"
              d="M0 150 C 28 150, 28 196, 56 196"
              stroke="var(--divider)"
              strokeWidth="1.5"
            />
          </svg>
        </div>

        {/* 问题线程 */}
        <ol className="flex flex-col gap-5">
          {/* Q1：已完成 */}
          <li className="lp-seq lp-d3 flex items-start gap-3 opacity-70">
            <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border border-divider bg-surface">
              <Check className="size-3 text-success" aria-hidden="true" />
            </span>
            <div>
              <p className="font-mono text-[11px] font-medium text-ink-muted">Q1 · React</p>
              <p className="mt-0.5 text-sm text-ink-muted">谈谈订单模块重构中的状态管理取舍</p>
            </div>
          </li>

          {/* Q2：当前问题（珊瑚橙激活） */}
          <li className="lp-seq lp-d4">
            <div className="flex items-start gap-3">
              <span className="relative mt-1 flex size-4 shrink-0">
                <span className="lp-halo absolute inset-0 rounded-full bg-accent-strong" />
                <span className="relative size-4 rounded-full border-2 border-surface bg-accent-strong shadow-sm" />
              </span>
              <div className="min-w-0">
                <p className="font-mono text-[11px] font-semibold text-accent-strong">
                  Q2 · SSE · 进行中
                </p>
                <p className="mt-0.5 text-[15px] font-medium leading-relaxed text-ink">
                  日志面板为什么选 SSE 而不是 WebSocket？
                </p>

                {/* 追问分支 */}
                <div className="mt-3 flex flex-col gap-2 border-l-2 border-accent-strong/30 pl-4">
                  <p className="lp-seq lp-d5 text-sm text-ink-muted">
                    <span className="font-mono text-[11px] font-medium text-accent-strong">
                      追问 1
                    </span>
                    　断线后如何续传丢失的日志？
                  </p>
                  <div className="lp-seq lp-d5 flex items-center gap-2.5 rounded-md bg-accent-soft/60 px-3 py-2">
                    <Waveform />
                    <span className="font-mono text-[11px] text-ink-muted">候选人语音作答中</span>
                  </div>
                </div>
              </div>
            </div>
          </li>

          {/* Q3：待进行 */}
          <li className="lp-seq lp-d5 flex items-start gap-3 opacity-50">
            <span className="mt-0.5 size-5 shrink-0 rounded-full border border-dashed border-ink-muted/50 bg-transparent" />
            <div>
              <p className="font-mono text-[11px] font-medium text-ink-muted">Q3 · 性能优化</p>
              <p className="mt-0.5 text-sm text-ink-muted">LCP 从 3.8s 到 1.6s，先动了哪一层？</p>
            </div>
          </li>
        </ol>
      </div>

      {/* ——— 移动版：横向三节点预览 ——— */}
      <div className="md:hidden">
        <div className="flex items-stretch gap-2">
          <div className="lp-seq lp-d1 flex-1 rounded-lg border border-divider bg-surface p-3">
            <p className="font-mono text-[10px] tracking-wider text-ink-muted">简历</p>
            <p className="mt-1 text-xs font-medium text-ink">
              React · SSE · 性能优化
            </p>
          </div>
          <span className="self-center font-mono text-ink-muted/60" aria-hidden="true">
            →
          </span>
          <div className="lp-seq lp-d2 flex-1 rounded-lg border border-accent-strong/50 bg-accent-soft/50 p-3">
            <p className="font-mono text-[10px] font-semibold tracking-wider text-accent-strong">
              Q2 · 进行中
            </p>
            <p className="mt-1 text-xs font-medium leading-relaxed text-ink">
              为什么选 SSE 而不是 WebSocket？
            </p>
          </div>
          <span className="self-center font-mono text-ink-muted/60" aria-hidden="true">
            →
          </span>
          <div className="lp-seq lp-d3 flex-1 rounded-lg border border-divider bg-surface p-3">
            <p className="font-mono text-[10px] tracking-wider text-ink-muted">追问 ×2</p>
            <div className="mt-1.5 flex items-center gap-1.5">
              <Waveform />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
