'use client'

import { useState } from 'react'

/** 五个流程阶段：输入 / 系统动作 / 结果，全部对应真实实现 */
const STAGES = [
  {
    name: '粘贴简历',
    input: '简历纯文本',
    action: '提取技术栈、项目经历和工作经历',
    result: '结构化候选人画像',
    detail:
      '不需要上传文件或填写表单，直接粘贴简历文本。系统通过 Function Calling 将自由文本解析为结构化字段，后续所有问题都建立在这份画像之上。',
  },
  {
    name: '生成大纲',
    input: '结构化简历',
    action: '通过 Function Calling 生成主题、难度和追问方向',
    result: '本次面试题目规划',
    detail:
      '大纲不是随机题目清单：每个主题都锚定简历中的一段具体经历，并预先规划了追问的展开方向，保证整场面试围绕候选人真实做过的事。',
  },
  {
    name: '开始主问题',
    input: '当前面试状态',
    action: '通过 SSE 流式生成面试官提问',
    result: '候选人可以边看边听',
    detail:
      '面试官的提问以 SSE 增量流式输出，逐字出现在对话中；开启语音后同步播报，还原真实面试里「听题」的节奏。',
  },
  {
    name: '进入逐层追问',
    input: '候选人当前回答',
    action: '判断掌握深度并决定追问或切题',
    result: '控制追问深度与轮次',
    detail:
      '有限状态机根据每轮回答的评估结果决定下一步：继续深入追问、还是切换到下一个主题。追问有轮次上限，不会无限纠缠一个问题。',
  },
  {
    name: '结束并生成报告',
    input: '完整面试记录',
    action: '按题目与整体表现进行复盘',
    result: '逐题评价、薄弱点和改进建议',
    detail:
      '面试结束后生成结构化报告：每道主题单独复盘（回答要点与不足），并给出整体评价与改进建议，历史面试可以随时回看。',
  },
] as const

/**
 * “一场面试如何推进”：可点击展开的流程列表。
 * 展开用 grid-template-rows 过渡实现平滑布局变化；一次仅展开一行。
 */
export function LandingProcess() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  return (
    <section
      id="process"
      aria-label="完整流程"
      className="scroll-mt-16 bg-canvas px-6 py-28 md:py-40"
    >
      <header className="mx-auto max-w-3xl text-center">
        <p className="ld-fade font-mono text-[11px] font-medium uppercase tracking-[0.3em] text-accent-strong">
          03 · 完整流程
        </p>
        <h2 className="ld-fade ld-d1 mt-6 font-serif text-4xl font-bold leading-[1.2] tracking-tight text-ink text-balance md:text-5xl">
          一场面试
          <br />
          如何从简历走到报告
        </h2>
      </header>

      <div className="ld-fade ld-d1 mx-auto mt-16 max-w-5xl border-t border-divider md:mt-24">
        {/* 桌面端表头 */}
        <div className="hidden grid-cols-[2.5rem_9rem_1fr_1fr_2.5rem] gap-6 border-b border-divider/60 px-4 py-3 font-mono text-[10px] uppercase tracking-[0.22em] text-ink-muted/70 md:grid">
          <span aria-hidden="true" />
          <span>阶段</span>
          <span>系统动作</span>
          <span>产生的结果</span>
          <span aria-hidden="true" />
        </div>

        {STAGES.map((stage, i) => {
          const open = openIndex === i
          return (
            <div
              key={stage.name}
              className={`border-b border-divider/60 transition-colors duration-500 ${open ? 'bg-surface' : 'hover:bg-surface/60'}`}
            >
              <button
                type="button"
                aria-expanded={open}
                onClick={() => setOpenIndex(open ? null : i)}
                className="grid w-full grid-cols-[2rem_1fr_2rem] items-center gap-3 px-4 py-6 text-left focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent-strong md:grid-cols-[2.5rem_9rem_1fr_1fr_2.5rem] md:gap-6"
              >
                <span className="font-mono text-xs text-accent-strong">0{i + 1}</span>
                <span className="font-serif text-lg font-bold text-ink md:text-xl">
                  {stage.name}
                </span>
                <span className="hidden text-sm leading-relaxed text-ink-muted md:block">
                  {stage.action}
                </span>
                <span className="hidden text-sm leading-relaxed text-ink-muted md:block">
                  {stage.result}
                </span>
                <span
                  aria-hidden="true"
                  className={`flex size-7 items-center justify-center justify-self-end rounded-full border text-sm transition-all duration-500 ${
                    open
                      ? 'rotate-45 border-accent-strong bg-accent-strong text-[#fff9f5]'
                      : 'border-divider text-ink-muted'
                  }`}
                >
                  +
                </span>
              </button>

              <div className="ld-expand" data-open={open}>
                <div>
                  <dl className="grid gap-x-8 gap-y-3 px-4 pb-7 pt-1 md:grid-cols-[9rem_1fr] md:pl-[5.1rem]">
                    <dt className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink-muted/70 md:pt-1">
                      输入
                    </dt>
                    <dd className="text-sm leading-relaxed text-ink">{stage.input}</dd>
                    <dt className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink-muted/70 md:pt-1">
                      系统动作
                    </dt>
                    <dd className="text-sm leading-relaxed text-ink">{stage.action}</dd>
                    <dt className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink-muted/70 md:pt-1">
                      结果
                    </dt>
                    <dd className="text-sm leading-relaxed text-ink">{stage.result}</dd>
                    <dt className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink-muted/70 md:pt-1">
                      说明
                    </dt>
                    <dd className="max-w-xl text-sm leading-relaxed text-ink-muted">
                      {stage.detail}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
