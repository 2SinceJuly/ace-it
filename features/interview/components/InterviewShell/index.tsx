'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  BarChart3,
  Bot,
  Clock3,
  ChevronLeft,
  FilePlus2,
  LogOut,
  MessageSquareText,
  Settings,
  Sparkles,
  UserRound,
  UserRoundSearch,
} from 'lucide-react'
import { signOut, useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { useInterviewStore } from '@/features/interview/store/interview.store'
import { cn } from '@/lib/utils'

interface InterviewShellProps {
  children: React.ReactNode
  title: string
  subtitle: string
}

const navItems = [
  {
    href: '/interviews',
    label: '岗位练习',
    description: '选择互联网方向',
    icon: UserRoundSearch,
  },
  {
    href: '/interviews/new',
    label: '定制面试',
    description: '题量 / 时长 / 难度',
    icon: FilePlus2,
  },
  {
    href: '/interviews/analysis',
    label: '我的面试',
    description: '趋势与报告',
    icon: BarChart3,
  },
]

function isActive(pathname: string, href: string) {
  if (href === '/interviews') {
    return pathname === '/interviews' || /^\/interviews\/[^/]+$/.test(pathname)
  }

  if (href === '/interviews/analysis') {
    return pathname.startsWith('/interviews/analysis') || pathname.startsWith('/interviews/report')
  }

  return pathname.startsWith(href)
}

function formatHistoryDate(value: string) {
  return new Intl.DateTimeFormat('zh-CN', {
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(value))
}

export function InterviewShell({ children, title, subtitle }: InterviewShellProps) {
  const pathname = usePathname()
  const { data: session } = useSession()
  const interviews = useInterviewStore((state) => state.interviews)
  const isLoading = useInterviewStore((state) => state.interviewsLoading)
  const hasInitiallyLoaded = useInterviewStore((state) => state.hasInitiallyLoaded)
  const loadInterviews = useInterviewStore((state) => state.loadInterviews)
  const userName = session?.user?.name || '求职者'
  const userEmail = session?.user?.email || '准备下一场面试'

  useEffect(() => {
    if (!hasInitiallyLoaded) {
      loadInterviews()
    }
  }, [hasInitiallyLoaded, loadInterviews])

  return (
    <div className="flex min-h-[100dvh] bg-[#f4f1ed] text-[#111318]">
      <aside className="hidden w-[316px] shrink-0 border-r border-[#ded8cf] bg-[#fbfaf8]/95 px-5 py-5 lg:flex lg:flex-col">
        <div className="flex items-center justify-between">
          <Link href="/interviews" className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[#111318] bg-[#111318] text-white shadow-[4px_4px_0_rgba(17,19,24,0.16)]">
              <Bot className="h-6 w-6" />
            </div>
            <div>
              <div className="text-lg font-semibold leading-tight">Ace It</div>
              <div className="text-xs text-[#6b675f]">AI 面试工作台</div>
            </div>
          </Link>
          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl text-[#6b675f]">
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </div>

        <div className="mt-8 rounded-[22px] border border-[#111318] bg-[#fff7e8] p-4 shadow-[5px_5px_0_rgba(17,19,24,0.12)]">
          <div className="flex items-center gap-2 text-sm text-[#111318]">
            <Sparkles className="h-4 w-4 text-[#ef745d]" />
            <span>欢迎，{userName}</span>
          </div>
          <p className="mt-2 text-sm leading-6 text-[#6b675f]">先选岗位进入定制页，再按题量、时长和难度生成模拟面试。</p>
        </div>

        <nav className="mt-8 space-y-2">
          <div className="px-2 text-xs font-medium uppercase text-[#8c867c]">Menu</div>
          {navItems.map((item) => {
            const Icon = item.icon
            const active = isActive(pathname, item.href)

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-[18px] border px-4 py-3 text-sm transition',
                  active
                    ? 'border-[#111318] bg-[#111318] text-white shadow-[4px_4px_0_rgba(239,116,93,0.55)]'
                    : 'border-transparent text-[#6b675f] hover:border-[#ded8cf] hover:bg-white hover:text-[#111318]'
                )}
              >
                <Icon className="h-5 w-5" />
                <span className="flex-1">
                  <span className="block font-medium">{item.label}</span>
                  <span className={cn('block text-xs', active ? 'text-white/70' : 'text-[#8c867c]')}>
                    {item.description}
                  </span>
                </span>
              </Link>
            )
          })}
          <Link
            href="/chat"
            className="flex items-center gap-3 rounded-[18px] border border-transparent px-4 py-3 text-sm text-[#6b675f] transition hover:border-[#ded8cf] hover:bg-white hover:text-[#111318]"
          >
            <MessageSquareText className="h-5 w-5" />
            <span className="flex-1">
              <span className="block font-medium">通用聊天</span>
              <span className="block text-xs text-[#8c867c]">保留原能力</span>
            </span>
          </Link>
        </nav>

        <section className="mt-8 min-h-0 flex-1">
          <div className="flex items-center justify-between px-2">
            <div className="text-xs font-medium uppercase text-[#8c867c]">之前面试</div>
            <Clock3 className="h-4 w-4 text-[#8c867c]" />
          </div>
          <div className="mt-3 max-h-[34dvh] space-y-2 overflow-y-auto pr-1">
            {interviews.slice(0, 8).map((interview) => {
              const active = pathname === `/interviews/${interview.id}`

              return (
                <Link
                  key={interview.id}
                  href={`/interviews/${interview.id}`}
                  className={cn(
                    'block rounded-[18px] border px-3 py-3 text-sm transition',
                    active
                      ? 'border-[#ef745d] bg-white text-[#111318] shadow-[3px_3px_0_rgba(239,116,93,0.28)]'
                      : 'border-[#e4ded5] bg-[#f7f4ef] text-[#6b675f] hover:border-[#111318] hover:bg-white hover:text-[#111318]'
                  )}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="truncate font-medium">{interview.position}</span>
                    <span className="shrink-0 text-xs text-[#8c867c]">{formatHistoryDate(interview.updatedAt)}</span>
                  </div>
                  <div className="mt-1 flex items-center justify-between gap-3 text-xs text-[#8c867c]">
                    <span>{interview.status === 'completed' ? '已完成' : '练习中'}</span>
                    <span>{interview.messages.length} 条消息</span>
                  </div>
                </Link>
              )
            })}
            {isLoading && <div className="px-2 py-3 text-sm text-[#8c867c]">正在加载历史面试...</div>}
            {!isLoading && interviews.length === 0 && (
              <div className="rounded-[18px] border border-dashed border-[#d7d0c6] px-3 py-4 text-sm leading-6 text-[#8c867c]">
                暂无历史面试。创建后会出现在这里。
              </div>
            )}
          </div>
        </section>

        <div className="mt-6 space-y-4 border-t border-[#ded8cf] pt-5">
          <div className="flex items-center gap-3 rounded-[18px] border border-[#e4ded5] bg-white p-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f4f1ed] text-[#6b675f]">
              <UserRound className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium">{userName}</div>
              <div className="truncate text-xs text-[#6b675f]">{userEmail}</div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" className="rounded-[16px] border-[#ded8cf] bg-white">
              <Settings className="h-4 w-4" />
              设置
            </Button>
            <Button
              variant="outline"
              className="rounded-[16px] border-[#ded8cf] bg-white"
              onClick={() => signOut({ callbackUrl: '/' })}
            >
              <LogOut className="h-4 w-4" />
              退出
            </Button>
          </div>
        </div>
      </aside>

      <main className="min-w-0 flex-1">
        <div className="sticky top-0 z-10 border-b border-[#ded8cf] bg-[#f4f1ed]/88 px-4 py-4 backdrop-blur md:px-8 lg:px-10">
          <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">{title}</h1>
              <p className="mt-1 text-sm text-[#6b675f] md:text-base">{subtitle}</p>
            </div>
            <div className="hidden rounded-full border border-[#ded8cf] bg-white px-4 py-2 text-sm text-[#6b675f] md:block">
              {userName}
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-[1500px] px-4 py-6 md:px-8 lg:px-10">{children}</div>
      </main>
    </div>
  )
}
