/**
 * “不是题库”能力区：非对称 2×2 内容布局（细分隔线拼合，非四张 SaaS 卡片）。
 * 四项内容全部对应产品真实能力，技术注释仅作辅助标注。
 */
const CAPABILITIES = [
  {
    num: '01',
    name: '理解简历',
    tech: 'Function Calling',
    desc: '从技术栈、项目和工作经历中提取结构化信息，生成与候选人经历相关的面试大纲。',
  },
  {
    num: '02',
    name: '控制流程',
    tech: 'Finite State Machine',
    desc: '有限状态机明确控制开场、主问题、追问、切题和结束，避免模型自由发挥导致面试失控。',
  },
  {
    num: '03',
    name: '沿回答追问',
    tech: 'SSE',
    desc: '面试官根据当前回答判断是否继续深入，追问不只复述问题，而是验证方案选择、实现细节和边界。',
  },
  {
    num: '04',
    name: '语音交流',
    tech: 'Web Speech + TTS',
    desc: '支持语音回答与面试官语音播报，让候选人练习真实表达，而不只是输入文字答案。',
  },
] as const

export function LandingCapabilities() {
  return (
    <section
      id="capabilities"
      aria-label="工作方式"
      className="scroll-mt-16 bg-canvas px-6 py-28 md:py-40"
    >
      <header className="mx-auto max-w-3xl text-center">
        <p className="ld-fade font-mono text-[11px] font-medium uppercase tracking-[0.3em] text-accent-strong">
          01 · 工作方式
        </p>
        <h2 className="ld-fade ld-d1 mt-6 font-serif text-4xl font-bold leading-[1.2] tracking-tight text-ink text-balance md:text-5xl">
          不是从题库里抽一道题
          <br />
          而是从你的经历里继续问
        </h2>
        <p className="ld-fade ld-d2 mx-auto mt-6 max-w-xl text-[15px] leading-relaxed text-ink-muted text-pretty">
          Ace-it 先理解你写过什么，再决定应该问什么。每一个主问题和追问都能回到简历中的具体经历。
        </p>
      </header>

      {/* 非对称 2×2：第一列宽、第二列窄，细线拼合 */}
      <div className="mx-auto mt-16 max-w-6xl border-t border-divider md:mt-24 md:grid md:grid-cols-[1.25fr_1fr]">
        {CAPABILITIES.map((c, i) => (
          <article
            key={c.num}
            className={[
              'ld-fade group border-b border-divider px-2 py-10 transition-colors duration-500 hover:bg-surface md:px-10 md:py-14',
              i % 2 === 1 ? 'ld-d1 md:border-l' : '',
              // 奇数行反转宽窄，形成错落
              i >= 2 ? 'md:[grid-column:auto]' : '',
            ].join(' ')}
          >
            <div className="flex items-baseline justify-between gap-4">
              <span className="font-mono text-[11px] font-medium tracking-[0.3em] text-accent-strong">
                — {c.num}
              </span>
              <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-muted/70">
                {c.tech}
              </span>
            </div>
            <h3 className="mt-8 font-serif text-3xl font-bold tracking-tight text-ink md:text-4xl">
              {c.name}
            </h3>
            <p className="mt-5 max-w-md text-[15px] leading-relaxed text-ink-muted">{c.desc}</p>
          </article>
        ))}
      </div>
    </section>
  )
}
