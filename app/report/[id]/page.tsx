import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { getSessionUserId } from '@/lib/auth/session'
import { AppHeader } from '@/components/app-header'

interface PerQuestion {
  question: string
  score: number
  comment: string
}

function scoreGrade(score: number): string {
  if (score >= 85) return 'A'
  if (score >= 70) return 'B'
  if (score >= 55) return 'C'
  return 'D'
}

function questionGrade(score: number): string {
  if (score >= 8) return '优'
  if (score >= 6) return '良'
  if (score >= 4) return '中'
  return '弱'
}

export default async function ReportPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const userId = await getSessionUserId()
  if (!userId) redirect('/login')

  const { id } = await params
  const interview = await prisma.interview.findFirst({
    where: { id, userId },
    include: {
      report: true,
      messages: {
        where: { role: 'CANDIDATE' },
        orderBy: { createdAt: 'asc' },
        select: { questionIndex: true, content: true },
      },
    },
  })
  if (!interview) notFound()
  if (!interview.report) redirect(`/interview/${id}`)

  const report = interview.report
  const perQuestion = report.perQuestion as unknown as PerQuestion[]
  const strengths = report.strengths as unknown as string[]
  const weaknesses = report.weaknesses as unknown as string[]
  const suggestions = report.suggestions as unknown as string[]

  // 每题候选人首轮回答（真实问答记录）
  const firstAnswerByQuestion = new Map<number, string>()
  for (const m of interview.messages) {
    if (!firstAnswerByQuestion.has(m.questionIndex)) {
      firstAnswerByQuestion.set(m.questionIndex, m.content)
    }
  }

  const dateStr = interview.finishedAt
    ? new Date(interview.finishedAt).toLocaleDateString('zh-CN')
    : new Date(report.createdAt).toLocaleDateString('zh-CN')

  return (
    <div className="min-h-dvh bg-background">
      <AppHeader />
      <main className="mx-auto w-full max-w-3xl px-4 py-10 md:px-6">
        {/* ——— 档案头 ——— */}
        <header className="border-b border-divider pb-8">
          <p className="font-mono text-xs font-medium tracking-widest text-ink-muted">
            技术评审档案 · {dateStr}
          </p>
          <div className="mt-4 flex flex-wrap items-end justify-between gap-6">
            <div>
              <h1 className="font-serif text-3xl font-semibold text-ink text-balance">
                {interview.candidateName} · {interview.targetRole}
              </h1>
              <p className="mt-2 text-sm text-ink-muted">
                <span className="font-mono">{interview.questionCount} 题</span>
                {interview.techStack.length > 0 &&
                  ` · ${interview.techStack.slice(0, 5).join(' / ')}`}
              </p>
            </div>
            <div className="flex items-baseline gap-3">
              <span className="font-mono text-6xl font-semibold leading-none text-ink">
                {report.overallScore}
              </span>
              <div className="flex flex-col">
                <span className="font-mono text-sm text-ink-muted">/100</span>
                <span className="font-mono text-sm font-semibold text-accent-strong">
                  {scoreGrade(report.overallScore)} 级
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* ——— 总评 ——— */}
        <section className="border-b border-divider py-8">
          <h2 className="font-mono text-xs font-medium tracking-widest text-ink-muted">总评</h2>
          <p className="mt-3 text-sm leading-relaxed text-ink text-pretty">{report.summary}</p>
        </section>

        {/* ——— 优势 / 薄弱点 ——— */}
        <section className="grid gap-8 border-b border-divider py-8 md:grid-cols-2">
          <div>
            <h2 className="font-mono text-xs font-medium tracking-widest text-success">
              亮点优势
            </h2>
            <ul className="mt-3 flex flex-col gap-2.5">
              {strengths.map((s, i) => (
                <li key={i} className="flex gap-2.5 text-sm leading-relaxed text-ink">
                  <span className="mt-2 size-1 shrink-0 rounded-full bg-success" aria-hidden="true" />
                  {s}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="font-mono text-xs font-medium tracking-widest text-error">
              不足与短板
            </h2>
            <ul className="mt-3 flex flex-col gap-2.5">
              {weaknesses.map((s, i) => (
                <li key={i} className="flex gap-2.5 text-sm leading-relaxed text-ink">
                  <span className="mt-2 size-1 shrink-0 rounded-full bg-error" aria-hidden="true" />
                  {s}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ——— 改进建议 ——— */}
        <section className="border-b border-divider py-8">
          <h2 className="font-mono text-xs font-medium tracking-widest text-ink-muted">
            改进建议
          </h2>
          <ol className="mt-3 flex flex-col gap-3">
            {suggestions.map((s, i) => (
              <li key={i} className="flex gap-3 text-sm leading-relaxed text-ink">
                <span className="font-mono text-xs font-semibold text-accent-strong">
                  {String(i + 1).padStart(2, '0')}
                </span>
                {s}
              </li>
            ))}
          </ol>
        </section>

        {/* ——— 逐题复盘（可折叠） ——— */}
        <section className="py-8">
          <h2 className="font-mono text-xs font-medium tracking-widest text-ink-muted">
            逐题复盘
          </h2>
          <div className="mt-4 flex flex-col divide-y divide-divider border-y border-divider">
            {perQuestion.map((q, i) => {
              const answer = firstAnswerByQuestion.get(i)
              return (
                <details key={i} className="group">
                  <summary className="flex cursor-pointer items-center gap-3 py-4 marker:content-none [&::-webkit-details-marker]:hidden">
                    <span className="font-mono text-xs font-semibold text-accent-strong">
                      Q{i + 1}
                    </span>
                    <span className="flex-1 text-sm font-medium leading-snug text-ink">
                      {q.question}
                    </span>
                    <span className="shrink-0 font-mono text-sm text-ink">
                      {q.score}
                      <span className="text-xs text-ink-muted">/10</span>
                    </span>
                    <span className="shrink-0 font-mono text-xs text-ink-muted">
                      {questionGrade(q.score)}
                    </span>
                    <span
                      aria-hidden="true"
                      className="shrink-0 text-ink-muted transition-transform group-open:rotate-90"
                    >
                      ›
                    </span>
                  </summary>
                  <div className="flex flex-col gap-4 pb-5 pl-8">
                    {answer && (
                      <div>
                        <p className="text-xs font-medium text-ink-muted">回答摘要</p>
                        <p className="mt-1 border-l-2 border-divider pl-3 text-sm leading-relaxed text-ink-muted">
                          {answer.length > 200 ? `${answer.slice(0, 200)}…` : answer}
                        </p>
                      </div>
                    )}
                    <div>
                      <p className="text-xs font-medium text-ink-muted">点评与更好的回答方向</p>
                      <p className="mt-1 text-sm leading-relaxed text-ink">{q.comment}</p>
                    </div>
                  </div>
                </details>
              )
            })}
          </div>
        </section>

        {/* ——— 操作 ——— */}
        <div className="flex gap-3 pb-10">
          <Link
            href="/"
            className="rounded-md bg-accent-strong px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-accent-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-strong"
          >
            再来一场面试
          </Link>
          <Link
            href="/history"
            className="rounded-md border border-divider px-5 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-surface-subtle"
          >
            查看历史面试
          </Link>
        </div>
      </main>
    </div>
  )
}
