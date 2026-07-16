import { redirect } from 'next/navigation'
import { getSessionUserId } from '@/lib/auth/session'
import { prisma } from '@/lib/db'
import { AppHeader } from '@/components/app-header'
import { ResumeForm } from '@/components/resume-form'

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ paused?: string }>
}) {
  const userId = await getSessionUserId()
  if (!userId) redirect('/login')

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true },
  })
  if (!user) redirect('/login')

  const { paused } = await searchParams

  return (
    <div className="flex min-h-dvh flex-col">
      <AppHeader userName={user.name} />
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-8 md:px-6">
        {paused === '1' && (
          <div
            role="status"
            className="mb-5 flex items-center gap-2 rounded-md border border-divider bg-accent-soft px-4 py-2.5 text-sm text-ink"
          >
            <span aria-hidden="true" className="size-1.5 shrink-0 rounded-full bg-accent-strong" />
            面试已暂存，可从历史面试中继续。
          </div>
        )}
        <div className="mb-6 flex flex-col gap-1">
          <p className="font-mono text-xs tracking-[0.18em] text-ink-muted">01 / 简历工作台</p>
          <h1 className="font-serif text-2xl font-semibold text-ink text-balance">创建面试</h1>
          <p className="text-sm leading-relaxed text-ink-muted text-pretty">
            粘贴简历纯文本，AI 解析技术栈与项目经历后生成定向面试大纲
          </p>
        </div>
        <ResumeForm />
      </main>
    </div>
  )
}
