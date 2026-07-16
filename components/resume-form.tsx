'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import {
  ArrowRight,
  CircleNotch,
  FileText,
  WarningCircle,
} from '@phosphor-icons/react'
import { cn } from '@/lib/utils'

const COUNT_OPTIONS = [
  { value: 5, hint: '约 15 分钟' },
  { value: 8, hint: '约 25 分钟' },
  { value: 10, hint: '约 35 分钟' },
]

interface ParseResult {
  interviewId: string
  candidateName: string
  targetRole: string
  techStack: string[]
  questionCount: number
  outline: { orderIndex: number; topic: string; difficulty: string }[]
}

type ParseState =
  | { status: 'empty' }
  | { status: 'parsing' }
  | { status: 'failed'; message: string }
  | { status: 'success'; result: ParseResult }

export function ResumeForm() {
  const router = useRouter()
  const [resumeText, setResumeText] = useState('')
  const [questionCount, setQuestionCount] = useState(5)
  const [parse, setParse] = useState<ParseState>({ status: 'empty' })

  const parsing = parse.status === 'parsing'
  const succeeded = parse.status === 'success'

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (resumeText.trim().length < 50) {
      setParse({ status: 'failed', message: '简历内容过短，请粘贴完整简历（至少 50 字）' })
      return
    }
    setParse({ status: 'parsing' })
    try {
      const res = await fetch('/api/interviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeText, questionCount }),
      })
      const data = await res.json()
      if (!res.ok) {
        setParse({ status: 'failed', message: data.error ?? '解析失败，请重试' })
        return
      }
      setParse({ status: 'success', result: data as ParseResult })
    } catch {
      setParse({ status: 'failed', message: '网络错误，请重试' })
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="grid flex-1 gap-6 lg:grid-cols-[3fr_2fr] lg:items-start"
    >
      {/* 左：简历文本输入（候选人档案纸面） */}
      <div className="flex flex-col rounded-lg border border-divider bg-surface shadow-sm">
        <div className="flex items-baseline justify-between border-b border-divider px-4 py-3">
          <label htmlFor="resume" className="flex items-baseline gap-2">
            <span className="font-mono text-[11px] tracking-[0.18em] text-accent-strong">
              RESUME
            </span>
            <span className="text-sm font-medium text-ink">简历内容（纯文本）</span>
          </label>
          <span className="font-mono text-xs text-ink-muted">{resumeText.length}/20000</span>
        </div>
        <textarea
          id="resume"
          value={resumeText}
          onChange={(e) => setResumeText(e.target.value)}
          placeholder="将简历内容粘贴到这里，包括技术栈、项目经历、工作经历等……"
          rows={18}
          maxLength={20000}
          className="w-full resize-y rounded-b-lg bg-transparent p-4 text-sm leading-relaxed text-ink outline-none placeholder:text-ink-muted/70 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent-strong/40 disabled:opacity-50"
          disabled={parsing || succeeded}
        />
      </div>

      {/* 右：面试设置 + 解析状态 */}
      <div className="flex flex-col gap-6 rounded-lg border border-divider bg-surface p-5">
        <fieldset disabled={parsing || succeeded}>
          <legend className="text-sm font-medium text-ink">题目数量</legend>
          <div className="mt-3 flex flex-col gap-0 divide-y divide-divider rounded-md border border-divider">
            {COUNT_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setQuestionCount(opt.value)}
                aria-pressed={questionCount === opt.value}
                className={cn(
                  'relative flex items-center justify-between px-4 py-2.5 text-sm transition-colors first:rounded-t-md last:rounded-b-md focus-visible:outline-2 focus-visible:outline-accent-strong disabled:opacity-50',
                  questionCount === opt.value
                    ? 'bg-accent-soft text-accent-strong before:absolute before:inset-y-0 before:left-0 before:w-0.5 before:bg-accent-strong'
                    : 'text-ink-muted hover:bg-surface-subtle',
                )}
              >
                <span
                  className={cn(
                    'font-mono font-semibold',
                    questionCount === opt.value ? 'text-accent-strong' : 'text-ink',
                  )}
                >
                  {opt.value} 题
                </span>
                <span className="text-xs">{opt.hint}</span>
              </button>
            ))}
          </div>
        </fieldset>

        <hr className="border-divider" />

        {/* 解析状态区 */}
        <div aria-live="polite">
          {parse.status === 'empty' && (
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 text-ink-muted">
                <FileText className="size-4" aria-hidden="true" />
                <span className="text-sm font-medium">等待解析</span>
              </div>
              <p className="text-sm leading-relaxed text-ink-muted">
                提交后 AI 将解析简历并生成面试大纲，主问题内容在面试中才会揭示。
              </p>
            </div>
          )}

          {parse.status === 'parsing' && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2 text-accent-strong">
                <CircleNotch className="size-4 animate-spin" aria-hidden="true" />
                <span className="text-sm font-medium">正在解析简历、生成面试大纲…</span>
              </div>
              <div className="flex flex-col gap-2" aria-hidden="true">
                <div className="h-3 w-2/3 animate-pulse rounded bg-surface-subtle" />
                <div className="h-3 w-full animate-pulse rounded bg-surface-subtle" />
                <div className="h-3 w-5/6 animate-pulse rounded bg-surface-subtle" />
                <div className="h-3 w-1/2 animate-pulse rounded bg-surface-subtle" />
              </div>
              <p className="text-sm leading-relaxed text-ink-muted">
                通常需要 10–30 秒，请勿关闭页面。
              </p>
            </div>
          )}

          {parse.status === 'failed' && (
            <div className="flex flex-col gap-3">
              <div className="flex items-start gap-2 text-error">
                <WarningCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                <p role="alert" className="text-sm leading-relaxed">
                  {parse.message}
                </p>
              </div>
              <button
                type="submit"
                className="self-start rounded-md border border-divider px-3 py-1.5 text-sm text-ink transition-colors hover:bg-surface-subtle"
              >
                重试解析
              </button>
            </div>
          )}

          {parse.status === 'success' && (
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2 text-success">
                <span aria-hidden="true" className="size-1.5 rounded-full bg-success" />
                <span className="text-sm font-medium">解析成功</span>
              </div>
              <div>
                <p className="font-mono text-[11px] tracking-[0.14em] text-ink-muted">
                  候选人 · 目标岗位
                </p>
                <p className="mt-1 font-serif text-base font-semibold text-ink">
                  {parse.result.candidateName} · {parse.result.targetRole}
                </p>
              </div>
              {parse.result.techStack.length > 0 && (
                <div className="border-l-2 border-accent-strong/50 pl-3">
                  <p className="font-mono text-[11px] tracking-[0.14em] text-ink-muted">
                    识别到的技术栈
                  </p>
                  <p className="mt-1 font-mono text-xs leading-relaxed text-ink">
                    {parse.result.techStack.join(' · ')}
                  </p>
                </div>
              )}
              <div>
                <p className="font-mono text-[11px] tracking-[0.14em] text-ink-muted">
                  面试大纲 · {parse.result.outline.length} 题
                </p>
                <ol className="mt-2 flex flex-col divide-y divide-divider border-y border-divider">
                  {parse.result.outline.map((item) => (
                    <li key={item.orderIndex} className="flex items-baseline gap-3 py-2">
                      <span className="font-mono text-xs font-semibold text-accent-strong">
                        Q{item.orderIndex + 1}
                      </span>
                      <span className="flex-1 truncate text-sm text-ink">{item.topic}</span>
                      <span className="font-mono text-[11px] text-ink-muted">
                        {item.difficulty}
                      </span>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          )}
        </div>

        {/* 主操作 */}
        {succeeded ? (
          <button
            type="button"
            onClick={() =>
              router.push(`/interview/${(parse as { result: ParseResult }).result.interviewId}`)
            }
            className="flex h-11 items-center justify-center gap-2 rounded-md bg-accent-strong text-sm font-medium text-primary-foreground transition-colors hover:bg-accent-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-strong"
          >
            进入面试间
            <ArrowRight className="size-4" aria-hidden="true" />
          </button>
        ) : (
          <button
            type="submit"
            disabled={parsing || resumeText.trim().length === 0}
            className="flex h-11 items-center justify-center gap-2 rounded-md bg-accent-strong text-sm font-medium text-primary-foreground transition-colors hover:bg-accent-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-strong disabled:pointer-events-none disabled:opacity-50"
          >
            {parsing ? (
              <>
                <CircleNotch className="size-4 animate-spin" aria-hidden="true" />
                解析中…
              </>
            ) : (
              '解析简历并生成大纲'
            )}
          </button>
        )}
      </div>
    </form>
  )
}
