'use client'

import { usePathname } from 'next/navigation'
import { Clock3 } from 'lucide-react'
import Link from 'next/link'
import { useInterviewStore } from '@/features/interview/store/interview.store'
import { cn } from '@/lib/utils'

function formatHistoryDate(value: string) {
  return new Intl.DateTimeFormat('zh-CN', {
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(value))
}

export function HistoryList() {
  const pathname = usePathname()
  const interviews = useInterviewStore((state) => state.interviews)
  const isLoading = useInterviewStore((state) => state.interviewsLoading)

  return (
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
  )
}
