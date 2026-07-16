import { NextResponse } from 'next/server'
import { getSessionUserId } from '@/lib/auth/session'
import { prisma } from '@/lib/db'
import { callFunction } from '@/lib/engine/llm'
import { OUTLINE_TOOL, outlineMessages } from '@/lib/engine/prompts'

export const maxDuration = 120

const ALLOWED_COUNTS = [5, 8, 10]

interface OutlineResult {
  candidateName: string
  targetRole: string
  techStack: string[]
  questions: {
    topic: string
    question: string
    difficulty: string
    relatedResumePoint: string
  }[]
}

export async function POST(request: Request) {
  const userId = await getSessionUserId()
  if (!userId) return NextResponse.json({ error: '未登录' }, { status: 401 })

  let body: { resumeText?: string; questionCount?: number }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: '请求格式错误' }, { status: 400 })
  }

  const resumeText = (body.resumeText ?? '').trim()
  const questionCount = body.questionCount ?? 5
  if (resumeText.length < 50) {
    return NextResponse.json({ error: '简历内容过短，请粘贴完整简历（至少 50 字）' }, { status: 400 })
  }
  if (resumeText.length > 20000) {
    return NextResponse.json({ error: '简历内容过长（上限 20000 字）' }, { status: 400 })
  }
  if (!ALLOWED_COUNTS.includes(questionCount)) {
    return NextResponse.json({ error: '题目数量仅支持 5 / 8 / 10' }, { status: 400 })
  }

  let outline: OutlineResult
  try {
    outline = await callFunction<OutlineResult>({
      messages: outlineMessages(resumeText, questionCount),
      name: OUTLINE_TOOL.name,
      description: OUTLINE_TOOL.description,
      parameters: OUTLINE_TOOL.parameters as unknown as Record<string, unknown>,
    })
  } catch (err) {
    console.error('[outline] LLM failed:', err)
    return NextResponse.json({ error: '面试大纲生成失败，请稍后重试' }, { status: 502 })
  }

  if (!Array.isArray(outline.questions) || outline.questions.length === 0) {
    return NextResponse.json({ error: '大纲生成结果异常，请重试' }, { status: 502 })
  }
  // 强制主问题数量不超过用户选择的数量
  const questions = outline.questions.slice(0, questionCount)

  const interview = await prisma.$transaction(async (tx) => {
    const created = await tx.interview.create({
      data: {
        userId,
        resumeText,
        candidateName: outline.candidateName || '候选人',
        targetRole: outline.targetRole || '软件工程师',
        techStack: outline.techStack ?? [],
        questionCount: questions.length,
        state: 'CREATED',
      },
    })
    await tx.outlineItem.createMany({
      data: questions.map((q, i) => ({
        interviewId: created.id,
        orderIndex: i,
        topic: q.topic,
        question: q.question,
        difficulty: q.difficulty,
        relatedResumePoint: q.relatedResumePoint,
      })),
    })
    return created
  })

  // 返回解析结果供前端展示"解析成功"状态；主问题文本不下发，避免提前泄题
  return NextResponse.json({
    interviewId: interview.id,
    candidateName: interview.candidateName,
    targetRole: interview.targetRole,
    techStack: interview.techStack,
    questionCount: questions.length,
    outline: questions.map((q, i) => ({
      orderIndex: i,
      topic: q.topic,
      difficulty: q.difficulty,
    })),
  })
}

export async function GET() {
  const userId = await getSessionUserId()
  if (!userId) return NextResponse.json({ error: '未登录' }, { status: 401 })

  const interviews = await prisma.interview.findMany({
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
      finishedAt: true,
      report: { select: { overallScore: true } },
    },
  })
  return NextResponse.json({ interviews })
}
