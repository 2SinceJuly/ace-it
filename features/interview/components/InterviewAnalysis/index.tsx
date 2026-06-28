'use client'

import type { ReactNode } from 'react'
import { useEffect, useMemo } from 'react'
import Link from 'next/link'
import {
  ArrowRight,
  BarChart3,
  Brain,
  ChevronDown,
  LineChart as LineChartIcon,
  Sparkles,
  Target,
  TrendingUp,
} from 'lucide-react'
import {
  CartesianGrid,
  Line,
  LineChart,
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useInterviewStore } from '@/features/interview/store/interview.store'
import {
  formatInterviewDate,
  getDimensionData,
  getInterviewDurationMinutes,
  getInterviewScore,
  getQuestionCount,
  getReportInsights,
} from '@/features/interview/utils/report'

function average(values: number[]) {
  if (values.length === 0) return 0
  return Math.round((values.reduce((sum, value) => sum + value, 0) / values.length) * 10) / 10
}

export function InterviewAnalysis() {
  const interviews = useInterviewStore((state) => state.interviews)
  const hasInitiallyLoaded = useInterviewStore((state) => state.hasInitiallyLoaded)
  const loadInterviews = useInterviewStore((state) => state.loadInterviews)

  useEffect(() => {
    if (!hasInitiallyLoaded) {
      loadInterviews()
    }
  }, [hasInitiallyLoaded, loadInterviews])

  const completed = useMemo(
    () => interviews.filter((interview) => interview.messages.length > 0),
    [interviews]
  )
  const recent = completed[0]
  const scores = completed.map((interview, index) => getInterviewScore(interview, index))
  const latestScore = scores[0] || 0
  const previousScore = scores[1] || latestScore
  const topScore = scores.length ? Math.max(...scores) : 0
  const avgScore = average(scores)
  const improvement = latestScore - previousScore
  const selectedPosition = recent?.position || interviews[0]?.position || 'Web 前端开发'
  const reportInsights = recent ? getReportInsights(recent) : null
  const radarData = getDimensionData(latestScore || 68)
  const trendData = [...completed]
    .reverse()
    .slice(-10)
    .map((interview, index) => ({
      label: formatInterviewDate(interview.updatedAt).slice(0, 5),
      score: getInterviewScore(interview, index),
    }))

  return (
    <div className="space-y-6">
      <section className="rounded-[26px] border border-[#e5e9f2] bg-white p-6 shadow-[0_20px_70px_rgba(16,24,40,0.05)] md:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-3xl font-semibold tracking-tight">我的面试</h2>
            <p className="mt-3 max-w-2xl text-[#667085]">
              选择岗位后，查看历史得分变化、能力画像和最近一次报告洞察。
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <button className="flex h-14 min-w-[220px] items-center justify-between rounded-2xl border border-[#e5e9f2] bg-[#fbfcff] px-5 text-left">
              <span>
                <span className="block text-xs font-medium text-[#98a2b3]">岗位</span>
                <span className="block font-semibold">{selectedPosition}（{completed.length} 场）</span>
              </span>
              <ChevronDown className="h-5 w-5 text-[#98a2b3]" />
            </button>
            <Button asChild className="h-14 rounded-2xl bg-[#3f66e8] px-7 text-base hover:bg-[#3457c7]">
              <Link href="/interviews">
                开始新面试
                <ArrowRight className="h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {[
          { label: '完成次数', value: completed.length, suffix: '场', icon: BarChart3 },
          { label: '平均得分', value: avgScore, suffix: '分', icon: Target },
          { label: '最高得分', value: topScore, suffix: '分', icon: TrendingUp },
          { label: '最近得分', value: latestScore, suffix: '分', icon: Sparkles },
          { label: '提升幅度', value: improvement >= 0 ? `+${improvement}` : improvement, suffix: '分', icon: Brain },
        ].map((item) => {
          const Icon = item.icon

          return (
            <div key={item.label} className="rounded-[22px] border border-[#e5e9f2] bg-white p-5">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium text-[#667085]">{item.label}</div>
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#f3f6ff] text-[#3f66e8]">
                  <Icon className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-7 text-3xl font-semibold">
                {item.value}
                <span className="ml-1 text-base text-[#98a2b3]">{item.suffix}</span>
              </div>
            </div>
          )
        })}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-[26px] border border-[#e5e9f2] bg-white p-6">
          <div className="flex items-center justify-between border-b border-[#eef1f6] pb-5">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#eef3ff] text-[#3f66e8]">
                <LineChartIcon className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-xl font-semibold">{selectedPosition} 历史得分趋势</h3>
                <p className="text-sm text-[#667085]">按最近完成的模拟面试生成</p>
              </div>
            </div>
            <Badge className="rounded-full bg-[#eef3ff] text-[#3f66e8] hover:bg-[#eef3ff]">全部历史</Badge>
          </div>
          <div className="h-[330px] pt-6">
            {trendData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData} margin={{ left: 4, right: 18, top: 12, bottom: 4 }}>
                  <CartesianGrid stroke="#e8edf5" vertical={false} />
                  <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: '#667085', fontSize: 12 }} />
                  <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fill: '#667085', fontSize: 12 }} />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="score"
                    stroke="#3f66e8"
                    strokeWidth={3}
                    dot={{ r: 4, strokeWidth: 2, fill: '#fff' }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center rounded-2xl bg-[#f8fafc] text-sm text-[#667085]">
                完成一场面试后，这里会显示得分趋势。
              </div>
            )}
          </div>
        </div>

        <div className="rounded-[26px] border border-[#e5e9f2] bg-white p-6">
          <div className="flex items-center justify-between border-b border-[#eef1f6] pb-5">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#f7efff] text-[#8b5cf6]">
                <Target className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-xl font-semibold">能力雷达图</h3>
                <p className="text-sm text-[#667085]">最近一次面试的维度画像</p>
              </div>
            </div>
            <Badge className="rounded-full bg-[#f3f6ff] text-[#667085] hover:bg-[#f3f6ff]">历史聚合</Badge>
          </div>
          <div className="h-[330px] pt-6">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid stroke="#dbe4f0" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#475467', fontSize: 13 }} />
                <Radar dataKey="value" stroke="#3f66e8" fill="#3f66e8" fillOpacity={0.18} strokeWidth={3} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <InsightPanel
          icon={<Sparkles className="h-5 w-5" />}
          title="亮点与优势"
          subtitle="最近一次面试打捞出的高光时刻"
          tone="warm"
          items={reportInsights?.highlights || ['完成一场模拟面试后，这里会展示可复盘的亮点。']}
        />
        <InsightPanel
          icon={<Brain className="h-5 w-5" />}
          title="短板与建议"
          subtitle="或待提升的能力及具体改进意见"
          tone="cool"
          items={reportInsights?.weaknesses || ['完成一场模拟面试后，这里会展示更具体的薄弱点。']}
        />
      </section>

      <section className="rounded-[26px] border border-[#e5e9f2] bg-white p-6">
        <div className="mb-5 flex items-center justify-between border-b border-[#eef1f6] pb-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#f3f6ff] text-[#3f66e8]">
              <BarChart3 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-xl font-semibold">历史场次</h3>
              <p className="text-sm text-[#667085]">当前岗位下你记录的所有模拟面试</p>
            </div>
          </div>
        </div>
        <div className="overflow-hidden rounded-2xl border border-[#eef1f6]">
          <div className="grid grid-cols-[1fr_1fr_0.8fr_0.8fr_120px] bg-[#f8fafc] px-5 py-4 text-sm font-medium text-[#667085]">
            <div>时间</div>
            <div>岗位</div>
            <div>得分</div>
            <div>题量</div>
            <div>操作</div>
          </div>
          {completed.slice(0, 10).map((item, index) => (
            <div
              key={item.id}
              className="grid grid-cols-[1fr_1fr_0.8fr_0.8fr_120px] border-t border-[#eef1f6] px-5 py-4 text-sm"
            >
              <div className="text-[#667085]">{formatInterviewDate(item.updatedAt)}</div>
              <div className="font-medium">{item.position}</div>
              <div>
                <span className="rounded-full bg-[#eef3ff] px-3 py-1 font-semibold text-[#3f66e8]">
                  {getInterviewScore(item, index)}
                </span>
              </div>
              <div className="text-[#667085]">{getQuestionCount(item)} 题 · {getInterviewDurationMinutes(item)} 分钟</div>
              <Link href={`/interviews/report/${item.id}`} className="font-medium text-[#3f66e8]">
                查看报告
                <ArrowRight className="ml-1 inline h-4 w-4" />
              </Link>
            </div>
          ))}
          {completed.length === 0 && (
            <div className="px-5 py-10 text-center text-sm text-[#667085]">
              还没有完成的面试。先开始一场模拟面试，再回到这里查看报告。
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

function InsightPanel({
  icon,
  title,
  subtitle,
  tone,
  items,
}: {
  icon: ReactNode
  title: string
  subtitle: string
  tone: 'warm' | 'cool'
  items: string[]
}) {
  const isWarm = tone === 'warm'

  return (
    <div className="rounded-[26px] border border-[#e5e9f2] bg-white p-6">
      <div className="flex items-center gap-3 border-b border-[#eef1f6] pb-5">
        <div
          className={
            isWarm
              ? 'flex h-11 w-11 items-center justify-center rounded-2xl bg-[#fff7db] text-[#d89b18]'
              : 'flex h-11 w-11 items-center justify-center rounded-2xl bg-[#fff0f2] text-[#f35f73]'
          }
        >
          {icon}
        </div>
        <div>
          <h3 className="text-xl font-semibold">{title}</h3>
          <p className="text-sm text-[#667085]">{subtitle}</p>
        </div>
      </div>
      <div className="mt-6 space-y-3">
        {items.map((item, index) => (
          <div
            key={item}
            className={
              isWarm
                ? 'rounded-2xl border border-[#f7e7b8] bg-[#fffdf5] px-4 py-4 text-sm leading-6 text-[#475467]'
                : 'rounded-2xl bg-[#f8fafc] px-4 py-4 text-sm leading-6 text-[#475467]'
            }
          >
            <span
              className={
                isWarm
                  ? 'mr-3 inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#fff1bd] text-xs font-semibold text-[#c48610]'
                  : 'mr-3 inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#e9eef5] text-xs font-semibold text-[#667085]'
              }
            >
              {index + 1}
            </span>
            {item}
          </div>
        ))}
      </div>
    </div>
  )
}
