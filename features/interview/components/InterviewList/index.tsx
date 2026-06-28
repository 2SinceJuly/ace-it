'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import {
  ArrowRight,
  Bot,
  BriefcaseBusiness,
  Code2,
  Database,
  GitBranch,
  Loader2,
  MessageSquareText,
  Network,
  ShieldCheck,
  ServerCog,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useInterviewStore } from '@/features/interview/store/interview.store'
import { cn } from '@/lib/utils'

const roleCards = [
  {
    title: '前端开发',
    count: 14,
    icon: Code2,
    color: 'bg-[#fff7e8] text-[#d75f4c]',
    context: '岗位：前端开发。重点考察 JavaScript、TypeScript、React 或 Vue、CSS 布局、浏览器原理、性能优化、工程化和接口联调。',
  },
  {
    title: '后端开发',
    count: 12,
    icon: ServerCog,
    color: 'bg-[#e9f7ff] text-[#147aa4]',
    context: '岗位：后端开发。重点考察编程语言基础、接口设计、数据库、缓存、并发、鉴权、日志监控和服务稳定性。',
  },
  {
    title: '算法工程',
    count: 10,
    icon: GitBranch,
    color: 'bg-[#ecfdf3] text-[#26865a]',
    context: '岗位：算法工程。重点考察数据结构、算法复杂度、模型理解、特征工程、实验分析、代码实现和业务落地表达。',
  },
  {
    title: '全栈开发',
    count: 9,
    icon: Database,
    color: 'bg-[#f1ecff] text-[#7251d6]',
    context: '岗位：全栈开发。重点考察前后端协作、Node.js、数据库、认证、API 设计、部署、性能和端到端问题拆解。',
  },
  {
    title: '运维 DevOps',
    count: 8,
    icon: Network,
    color: 'bg-[#f7f4ef] text-[#645b50]',
    context: '岗位：运维 DevOps。重点考察 Linux、网络、CI/CD、容器、云服务、监控告警、故障排查和发布稳定性。',
  },
  {
    title: '测试开发',
    count: 7,
    icon: ShieldCheck,
    color: 'bg-[#ffe9e4] text-[#bf4f3e]',
    context: '岗位：测试开发。重点考察测试策略、自动化测试、接口测试、质量保障、缺陷定位、工程效率和风险意识。',
  },
]

function formatDate(value: string) {
  return new Intl.DateTimeFormat('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

export function InterviewList() {
  const interviews = useInterviewStore((state) => state.interviews)
  const isLoading = useInterviewStore((state) => state.interviewsLoading)
  const hasInitiallyLoaded = useInterviewStore((state) => state.hasInitiallyLoaded)
  const loadInterviews = useInterviewStore((state) => state.loadInterviews)
  const recentInterview = interviews[0]

  useEffect(() => {
    if (!hasInitiallyLoaded) {
      loadInterviews()
    }
  }, [hasInitiallyLoaded, loadInterviews])

  return (
    <div className="space-y-7">
      <section className="overflow-hidden rounded-[30px] border border-[#111318] bg-[#fbfaf8] p-7 shadow-[7px_7px_0_rgba(17,19,24,0.12)] md:p-10">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-end">
          <div>
            <div className="mb-4 inline-flex rounded-full border border-[#ded8cf] bg-[#fff7e8] px-3 py-1 text-sm font-medium text-[#111318]">
              共 {roleCards.reduce((sum, item) => sum + item.count, 0)} 个互联网岗位题库方向
            </div>
            <h2 className="max-w-4xl text-4xl font-semibold leading-[1.05] tracking-tight md:text-6xl">
              从真实互联网岗位开始定制面试
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-7 text-[#6b675f]">
              先选一个岗位族，系统会带着岗位上下文进入定制页。你可以继续补充简历、项目和 JD，再设置题量、时长和难度。
            </p>
          </div>
          <Button asChild className="h-13 rounded-full bg-[#111318] px-6 text-white shadow-[4px_4px_0_rgba(239,116,93,0.55)] hover:bg-[#22252c]">
            <Link href="/interviews/new">
              创建定制面试
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_390px]">
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium uppercase text-[#8c867c]">岗位方向</div>
            <Badge className="rounded-full border border-[#ded8cf] bg-white text-[#111318] hover:bg-white">
              {roleCards.length} 类
            </Badge>
          </div>

          <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
            {roleCards.map((role) => {
              const Icon = role.icon
              return (
                <Link
                  key={role.title}
                  href={`/interviews/new?position=${encodeURIComponent(role.title)}&context=${encodeURIComponent(role.context)}`}
                  className="group rounded-[24px] border border-[#d8d1c7] bg-white p-5 transition hover:-translate-y-0.5 hover:border-[#111318] hover:shadow-[5px_5px_0_rgba(17,19,24,0.12)]"
                >
                  <div className="flex items-start justify-between">
                    <div className={cn('flex h-14 w-14 items-center justify-center rounded-[18px] border border-black/5', role.color)}>
                      <Icon className="h-7 w-7" />
                    </div>
                    <Badge className="rounded-full border border-[#ece6dd] bg-[#fbfaf8] text-[#6b675f] hover:bg-[#fbfaf8]">
                      {role.count} 个问题
                    </Badge>
                  </div>
                  <div className="mt-5 text-lg font-semibold">{role.title}</div>
                  <div className="mt-2 min-h-10 text-sm leading-5 text-[#6b675f]">
                    {role.context.replace(/^岗位：.*?。/, '').slice(0, 38)}...
                  </div>
                  <div className="mt-4 flex items-center gap-2 text-sm font-medium text-[#111318]">
                    进入定制
                    <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                  </div>
                </Link>
              )
            })}
          </div>
        </div>

        <aside className="space-y-4">
          <div className="rounded-[28px] border border-[#111318] bg-white p-5 shadow-[5px_5px_0_rgba(17,19,24,0.1)]">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-[18px] bg-[#ffe9e4] text-[#bf4f3e]">
                <MessageSquareText className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">面试对话框</h3>
                <p className="text-sm text-[#6b675f]">最近一场练习会在这里继续</p>
              </div>
            </div>

            {isLoading ? (
              <div className="mt-8 flex items-center gap-2 text-sm text-[#6b675f]">
                <Loader2 className="h-4 w-4 animate-spin" />
                正在加载面试记录
              </div>
            ) : recentInterview ? (
              <div className="mt-6 rounded-[24px] border border-[#ece6dd] bg-[#fbfaf8] p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-[16px] bg-white text-[#111318]">
                    <Bot className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="truncate font-semibold">{recentInterview.position}</div>
                    <div className="text-xs text-[#6b675f]">更新于 {formatDate(recentInterview.updatedAt)}</div>
                  </div>
                </div>
                <div className="mt-4 rounded-[18px] bg-white p-4 text-sm leading-6 text-[#6b675f]">
                  {recentInterview.messages[0]?.content.slice(0, 110) ||
                    '这场面试还没有开始，进入房间后点击 Start AI interview。'}
                </div>
                <Button asChild className="mt-4 h-12 w-full rounded-full bg-[#111318] hover:bg-[#22252c]">
                  <Link href={`/interviews/${recentInterview.id}`}>
                    继续面试
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="mt-6 rounded-[24px] border border-dashed border-[#d7d0c6] bg-[#fbfaf8] p-8 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white text-[#8c867c]">
                  <BriefcaseBusiness className="h-7 w-7" />
                </div>
                <div className="mt-4 font-semibold">还没有面试记录</div>
                <p className="mt-2 text-sm text-[#6b675f]">从岗位方向或定制面试创建第一场练习。</p>
              </div>
            )}
          </div>

          <div className="rounded-[28px] border border-[#d8d1c7] bg-white p-5">
            <h3 className="font-semibold">最近面试</h3>
            <div className="mt-4 space-y-3">
              {interviews.slice(0, 4).map((interview) => (
                <Link
                  key={interview.id}
                  href={`/interviews/${interview.id}`}
                  className="flex items-center justify-between rounded-[18px] bg-[#fbfaf8] px-4 py-3 text-sm transition hover:bg-[#fff7e8]"
                >
                  <span className="truncate font-medium">{interview.position}</span>
                  <span className="ml-3 shrink-0 text-xs text-[#6b675f]">{interview.status}</span>
                </Link>
              ))}
              {!isLoading && interviews.length === 0 && (
                <div className="text-sm text-[#8c867c]">暂无历史记录</div>
              )}
            </div>
          </div>
        </aside>
      </section>
    </div>
  )
}
