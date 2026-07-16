import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSessionUserId } from '@/lib/auth/session'
import { callFunction } from '@/lib/engine/llm'
import { REPORT_TOOL, reportMessages } from '@/lib/engine/prompts'

export const maxDuration = 180

interface ReportResult {
  overallScore: number
  summary: string
  strengths: string[]
  weaknesses: string[]
  suggestions: string[]
  perQuestion: { question: string; score: number; comment: string }[]
}

/**
 * 生成最终报告：基于完整问答记录 + 面试大纲 + 每轮内部评估，统一生成最终评分。
 * 仅当 state 为 CLOSING 时可触发；已有报告直接幂等返回。
 */
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const userId = await getSessionUserId()
  if (!userId) return NextResponse.json({ error: '未登录' }, { status: 401 })

  const { id } = await params
  const interview = await prisma.interview.findFirst({
    where: { id, userId },
    include: {
      outlineItems: { orderBy: { orderIndex: 'asc' } },
      messages: { orderBy: { createdAt: 'asc' } },
      scores: { orderBy: { createdAt: 'asc' }, include: { message: true } },
      report: true,
    },
  })
  if (!interview) return NextResponse.json({ error: '面试不存在' }, { status: 404 })
  if (interview.report) return NextResponse.json({ ok: true }) // 幂等
  if (interview.state !== 'CLOSING') {
    return NextResponse.json({ error: '面试尚未结束，无法生成报告' }, { status: 409 })
  }

  await prisma.interview.update({ where: { id }, data: { state: 'REPORTING' } })

  let result: ReportResult
  try {
    result = await callFunction<ReportResult>({
      messages: reportMessages({
        candidateName: interview.candidateName,
        targetRole: interview.targetRole,
        outline: interview.outlineItems.map((o) => ({
          topic: o.topic,
          question: o.question,
          difficulty: o.difficulty,
          relatedResumePoint: o.relatedResumePoint,
        })),
        transcript: interview.messages.map((m) => ({
          role: m.role,
          kind: m.kind,
          questionIndex: m.questionIndex,
          content: m.content,
        })),
        evaluations: interview.scores.map((s) => ({
          questionIndex: s.message.questionIndex,
          followUpDepth: s.message.followUpDepth,
          score: s.score,
          comment: s.comment,
          coveredPoints: s.coveredPoints,
        })),
      }),
      name: REPORT_TOOL.name,
      description: REPORT_TOOL.description,
      parameters: REPORT_TOOL.parameters as unknown as Record<string, unknown>,
    })
  } catch (err) {
    console.error('[report] LLM failed:', err)
    // 回滚状态，允许重试
    await prisma.interview.update({ where: { id }, data: { state: 'CLOSING' } })
    return NextResponse.json({ error: '报告生成失败，请重试' }, { status: 502 })
  }

  await prisma.$transaction([
    prisma.report.create({
      data: {
        interviewId: id,
        overallScore: Math.max(0, Math.min(100, Math.round(result.overallScore))),
        summary: result.summary,
        strengths: result.strengths,
        weaknesses: result.weaknesses,
        suggestions: result.suggestions,
        perQuestion: result.perQuestion,
      },
    }),
    prisma.interview.update({
      where: { id },
      data: { state: 'FINISHED', finishedAt: new Date() },
    }),
  ])

  return NextResponse.json({ ok: true })
}
