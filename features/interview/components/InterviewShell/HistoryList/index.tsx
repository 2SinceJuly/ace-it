'use client'

import { usePathname, useRouter } from 'next/navigation'
import { Clock3, Loader2, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
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
  const router = useRouter()
  const interviews = useInterviewStore((state) => state.interviews)
  const isLoading = useInterviewStore((state) => state.interviewsLoading)
  const deleteInterview = useInterviewStore((state) => state.deleteInterview)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleDelete = async (interviewId: string, isActive: boolean) => {
    if (deletingId) return

    setDeletingId(interviewId)
    try {
      await deleteInterview(interviewId)
      if (isActive) {
        router.push('/interviews')
      }
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <section className="mt-8 min-h-0 flex-1">
      <div className="flex items-center justify-between px-2">
        <div className="text-xs font-medium uppercase text-[#8c867c]">之前面试</div>
        <Clock3 className="h-4 w-4 text-[#8c867c]" />
      </div>
      <div className="custom-scrollbar mt-3 max-h-[34dvh] space-y-2 overflow-y-auto pr-1">
        {interviews.slice(0, 8).map((interview) => {
          const active = pathname === `/interviews/${interview.id}`
          const isDeleting = deletingId === interview.id

          return (
            <div
              key={interview.id}
              className={cn(
                'group relative rounded-[18px] border text-sm transition',
                active
                  ? 'border-[#ef745d] bg-white text-[#111318] shadow-[3px_3px_0_rgba(239,116,93,0.28)]'
                  : 'border-[#e4ded5] bg-[#f7f4ef] text-[#6b675f] hover:border-[#111318] hover:bg-white hover:text-[#111318]'
              )}
            >
              <Link href={`/interviews/${interview.id}`} className="block px-3 py-3 pr-10">
                <div className="flex items-center justify-between gap-3">
                  <span className="truncate font-medium">{interview.position}</span>
                  <span className="shrink-0 text-xs text-[#8c867c]">{formatHistoryDate(interview.updatedAt)}</span>
                </div>
                <div className="mt-1 flex items-center justify-between gap-3 text-xs text-[#8c867c]">
                  <span>{interview.status === 'completed' ? '已完成' : '练习中'}</span>
                  <span>{interview.messages.length} 条消息</span>
                </div>
              </Link>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    disabled={isDeleting}
                    className="absolute right-2 top-1/2 h-7 w-7 -translate-y-1/2 rounded-full text-[#8c867c] opacity-0 transition hover:bg-[#fff0eb] hover:text-[#b83f2b] group-hover:opacity-100 focus-visible:opacity-100"
                    aria-label={`删除 ${interview.position}`}
                  >
                    {isDeleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="rounded-[24px] border-2 border-[#111318] bg-[#fffdf8] text-[#111318] shadow-[6px_6px_0_rgba(17,19,24,0.18)]">
                  <AlertDialogHeader>
                    <AlertDialogTitle>删除这场面试？</AlertDialogTitle>
                    <AlertDialogDescription className="text-[#5d574f]">
                      删除后会同时移除这场面试的材料、消息和报告记录，无法撤销。
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="rounded-full border-2 border-[#111318] bg-white text-[#111318] hover:bg-[#f1ebe1]">
                      取消
                    </AlertDialogCancel>
                    <AlertDialogAction
                      className="rounded-full bg-[#111318] text-white hover:bg-[#2a2d33]"
                      onClick={() => handleDelete(interview.id, active)}
                    >
                      删除
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
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
