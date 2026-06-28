'use client'

import type { ReactNode } from 'react'
import { useEffect, useMemo } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  BarChart3,
  Brain,
  CheckCircle2,
  Clock3,
  FileText,
  Sparkles,
  Target,
} from 'lucide-react'
import {
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
} from 'recharts'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useInterviewStore } from '@/features/interview/store/interview.store'
import {
  getDimensionData,
  getInterviewDurationMinutes,
  getInterviewScore,
  getLatestAssistantText,
  getMaterialPreview,
  getQuestionCount,
  getReportInsights,
} from '@/features/interview/utils/report'

interface InterviewReportProps {
  interviewId: string
}

export function InterviewReport({ interviewId }: InterviewReportProps) {
  const interview = useInterviewStore((state) => state.currentInterview)
  const loading = useInterviewStore((state) => state.currentInterviewLoading)
  const loadInterview = useInterviewStore((state) => state.loadInterview)

  useEffect(() => {
    loadInterview(interviewId)
  }, [interviewId, loadInterview])

  const report = useMemo(() => {
    if (!interview) return null

    const score = getInterviewScore(interview)
    const dimensions = getDimensionData(score)
    const insights = getReportInsights(interview)
    const latestAssistantText = getLatestAssistantText(interview)

    return {
      score,
      dimensions,
      insights,
      latestAssistantText,
      summary:
        latestAssistantText.length > 0
          ? latestAssistantText.slice(0, 160)
          : `本场面试围绕 ${interview.position} 展开，后续完成更多问答后可以生成更完整的复盘摘要。`,
    }
  }, [interview])

  if (loading || !interview || !report) {
    return (
      <div className="rounded-[26px] border border-[#e5e9f2] bg-white p-10 text-center text-sm text-[#667085]">
        正在加载面试报告...
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button asChild variant="outline" className="h-12 rounded-2xl border-[#e5e9f2] bg-white">
          <Link href="/interviews/analysis">
            <ArrowLeft className="h-4 w-4" />
            返回我的面试
          </Link>
        </Button>
      </div>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-[28px] bg-[#111827] p-7 text-white shadow-[0_24px_70px_rgba(17,24,39,0.18)] md:p-9">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/55">Interview Report</p>
              <h2 className="mt-4 text-2xl font-semibold">{interview.position}</h2>
            </div>
            <Badge className="rounded-full bg-white/12 px-3 py-1 text-white hover:bg-white/12">
              <Clock3 className="mr-1 h-4 w-4" />
              {getQuestionCount(interview)} 题 · {getInterviewDurationMinutes(interview)} 分钟
            </Badge>
          </div>
          <div className="mt-12 flex items-end gap-2">
            <span className="text-7xl font-semibold leading-none">{report.score}</span>
            <span className="mb-2 text-2xl font-semibold text-white/55">/ 100</span>
          </div>
          <div className="mt-8 rounded-3xl border border-white/10 bg-white/8 p-5 text-base leading-8 text-white/82">
            {report.summary}
          </div>
        </div>

        <div className="rounded-[28px] border border-[#e5e9f2] bg-white p-6">
          <div className="flex items-center gap-3 border-b border-[#eef1f6] pb-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#f7efff] text-[#8b5cf6]">
              <Target className="h-5 w-5" />
            </div>
            <h3 className="text-xl font-semibold">维度雷达图</h3>
          </div>
          <div className="h-[340px] pt-6">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={report.dimensions}>
                <PolarGrid stroke="#dbe4f0" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#475467', fontSize: 13 }} />
                <Radar dataKey="value" stroke="#3f66e8" fill="#3f66e8" fillOpacity={0.18} strokeWidth={3} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {report.dimensions.map((item, index) => {
          const icons = [Target, Brain, BarChart3, CheckCircle2, Sparkles]
          const Icon = icons[index] || Target

          return (
            <div key={item.subject} className="rounded-[22px] border border-[#e5e9f2] bg-white p-5">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium text-[#667085]">{item.subject}</div>
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#f8fafc] text-[#475467]">
                  <Icon className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-7 text-3xl font-semibold">
                {item.value}
                <span className="ml-1 text-base text-[#98a2b3]">分</span>
              </div>
            </div>
          )
        })}
      </section>

      <ReportSection icon={<Target className="h-5 w-5" />} title="表达分析" tone="amber">
        <div className="rounded-2xl bg-[#f8fafc] px-5 py-4 leading-8 text-[#475467]">
          表达整体清晰，但建议继续加强“结论先行 + 关键依据 + 项目例子”的回答结构。
        </div>
      </ReportSection>

      <section className="grid gap-6 xl:grid-cols-2">
        <ReportList
          icon={<Sparkles className="h-5 w-5" />}
          title="亮点分析"
          tone="green"
          items={report.insights.highlights}
        />
        <ReportList
          icon={<Brain className="h-5 w-5" />}
          title="不足分析"
          tone="red"
          items={report.insights.weaknesses}
        />
      </section>

      <ReportList
        icon={<CheckCircle2 className="h-5 w-5" />}
        title="改进建议"
        tone="blue"
        items={report.insights.suggestions}
      />

      <ReportSection icon={<Clock3 className="h-5 w-5" />} title="练习路径" tone="orange">
        <div className="grid gap-4 lg:grid-cols-3">
          {report.insights.practicePlan.map((item) => (
            <div key={item.day} className="rounded-2xl border border-[#e5e9f2] bg-white p-5">
              <div className="flex items-center justify-between">
                <Badge className="rounded-full bg-[#fff3e8] text-[#c4662f] hover:bg-[#fff3e8]">{item.day}</Badge>
                <span className="text-sm text-[#98a2b3]">{interview.position}</span>
              </div>
              <h4 className="mt-5 text-lg font-semibold">{item.title}</h4>
              <div className="mt-4 space-y-3">
                {item.tasks.map((task) => (
                  <div key={task} className="rounded-2xl bg-[#f8fafc] px-4 py-3 text-sm leading-6 text-[#475467]">
                    {task}
                  </div>
                ))}
              </div>
              <p className="mt-5 border-t border-[#eef1f6] pt-4 text-sm leading-6 text-[#667085]">
                目标：{item.goal}
              </p>
            </div>
          ))}
        </div>
      </ReportSection>

      <ReportSection icon={<FileText className="h-5 w-5" />} title="推荐练习" tone="blue">
        <div className="grid gap-4 lg:grid-cols-2">
          {report.insights.recommendations.map((item) => (
            <div key={item.title} className="rounded-2xl border border-[#e5e9f2] bg-white p-5">
              <h4 className="text-lg font-semibold">{item.title}</h4>
              <p className="mt-2 text-sm text-[#667085]">{item.meta}</p>
              <p className="mt-4 rounded-2xl bg-[#f8fafc] p-4 text-sm leading-6 text-[#475467]">{item.reason}</p>
            </div>
          ))}
          <div className="rounded-2xl border border-[#e5e9f2] bg-white p-5">
            <h4 className="text-lg font-semibold">当前面试材料片段</h4>
            <p className="mt-2 text-sm text-[#667085]">用于支撑报告与后续追问</p>
            <p className="mt-4 rounded-2xl bg-[#f8fafc] p-4 text-sm leading-6 text-[#475467]">
              {getMaterialPreview(interview)}
            </p>
          </div>
        </div>
      </ReportSection>
    </div>
  )
}

function ReportSection({
  icon,
  title,
  tone,
  children,
}: {
  icon: ReactNode
  title: string
  tone: 'amber' | 'blue' | 'green' | 'orange' | 'red'
  children: ReactNode
}) {
  const toneClass = {
    amber: 'bg-[#fff7db] text-[#d89b18]',
    blue: 'bg-[#eef3ff] text-[#3f66e8]',
    green: 'bg-[#eafaf1] text-[#35a36a]',
    orange: 'bg-[#fff3e8] text-[#d36f35]',
    red: 'bg-[#fff0f2] text-[#f35f73]',
  }[tone]

  return (
    <section className="rounded-[26px] border border-[#e5e9f2] bg-white p-6">
      <div className="mb-6 flex items-center gap-3 border-b border-[#eef1f6] pb-5">
        <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${toneClass}`}>{icon}</div>
        <h3 className="text-xl font-semibold">{title}</h3>
      </div>
      {children}
    </section>
  )
}

function ReportList({
  icon,
  title,
  tone,
  items,
}: {
  icon: ReactNode
  title: string
  tone: 'blue' | 'green' | 'red'
  items: string[]
}) {
  const itemClass = {
    blue: 'border-[#dce8ff] bg-[#f7faff]',
    green: 'border-[#d7f4e3] bg-[#f4fff9]',
    red: 'border-[#eef1f6] bg-[#f8fafc]',
  }[tone]

  return (
    <ReportSection icon={icon} title={title} tone={tone}>
      <div className="space-y-3">
        {items.map((item, index) => (
          <div key={item} className={`rounded-2xl border px-5 py-4 text-sm leading-7 text-[#475467] ${itemClass}`}>
            <span className="mr-3 inline-flex h-6 w-6 items-center justify-center rounded-full bg-white text-xs font-semibold text-[#3f66e8]">
              {index + 1}
            </span>
            {item}
          </div>
        ))}
      </div>
    </ReportSection>
  )
}
