'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  BarChart3,
  Bot,
  ChevronLeft,
  FilePlus2,
  LogOut,
  MessageSquareText,
  Settings,
  Sparkles,
  UserRound,
  UserRoundSearch,
} from 'lucide-react'
import { signOut } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useInterviewStore } from '@/features/interview/store/interview.store'
import { HistoryList } from '../HistoryList'

interface SideNavProps {
  userName: string
  userEmail: string
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

export function SideNav({ userName, userEmail }: SideNavProps) {
  const pathname = usePathname()
  const hasInitiallyLoaded = useInterviewStore((state) => state.hasInitiallyLoaded)
  const loadInterviews = useInterviewStore((state) => state.loadInterviews)

  // 历史列表加载由 InterviewShell 触发，这里只读 state；避免重复加载
  void hasInitiallyLoaded
  void loadInterviews

  return (
    <aside className="hidden w-[316px] shrink-0 flex-col border-r border-[#ded8cf] bg-[#fbfaf8]/95 px-5 py-5 lg:flex">
      <SideNavHeader />
      <SideNavWelcomeCard userName={userName} />
      <SideNavMenu pathname={pathname} />
      <HistoryList />
      <UserPanel userName={userName} userEmail={userEmail} />
    </aside>
  )
}

function SideNavHeader() {
  return (
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
  )
}

function SideNavWelcomeCard({ userName }: { userName: string }) {
  return (
    <div className="mt-8 rounded-[22px] border border-[#111318] bg-[#fff7e8] p-4 shadow-[5px_5px_0_rgba(17,19,24,0.12)]">
      <div className="flex items-center gap-2 text-sm text-[#111318]">
        <Sparkles className="h-4 w-4 text-[#ef745d]" />
        <span>欢迎，{userName}</span>
      </div>
      <p className="mt-2 text-sm leading-6 text-[#6b675f]">先选岗位进入定制页，再按题量、时长和难度生成模拟面试。</p>
    </div>
  )
}

function SideNavMenu({ pathname }: { pathname: string }) {
  return (
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
  )
}

function UserPanel({ userName, userEmail }: { userName: string; userEmail: string }) {
  return (
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
  )
}
