import { redirect } from 'next/navigation'
import { getSessionUserId } from '@/lib/auth/session'
import { prisma } from '@/lib/db'
import { AppHeader } from '@/components/app-header'
import { HistoryList, type HistoryItem } from '@/components/history-list'

export const metadata = { title: '历史面试 · AI 模拟面试' }

export default async function HistoryPage() {
  const userId = await getSessionUserId()
  if (!userId) redirect('/login')

  const [user, interviews] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { name: true } }),
    prisma.interview.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        candidateName: true,
        targetRole: true,
        techStack: true,
        questionCount: true,
        state: true,
        createdAt: true,
        report: { select: { overallScore: true } },
      },
    }),
  ])

  const items: HistoryItem[] = interviews.map((it) => ({
    id: it.id,
    candidateName: it.candidateName,
    targetRole: it.targetRole,
    techStack: it.techStack,
    questionCount: it.questionCount,
    state: it.state,
    createdAt: it.createdAt.toISOString(),
    overallScore: it.report?.overallScore ?? null,
  }))

  return (
    <div className="flex h-dvh flex-col bg-background">
      <AppHeader userName={user?.name} />
      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col overflow-hidden px-4 py-8 md:px-6">
        <div className="mb-5 flex items-end justify-between gap-4">
          <div className="flex flex-col gap-1">
            <p className="font-mono text-xs tracking-[0.18em] text-ink-muted">02 / 面试档案库</p>
            <h1 className="font-serif text-2xl font-semibold text-ink">历史面试</h1>
          </div>
          <span className="font-mono text-xs text-ink-muted">{items.length} 场</span>
        </div>
        <HistoryList items={items} />
      </main>
    </div>
  )
}
