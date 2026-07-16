import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSessionUserId } from '@/lib/auth/session'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const userId = await getSessionUserId()
  if (!userId) return NextResponse.json({ error: '未登录' }, { status: 401 })

  const { id } = await params
  const interview = await prisma.interview.findFirst({
    where: { id, userId },
    include: {
      messages: { orderBy: { createdAt: 'asc' } },
      outlineItems: { orderBy: { orderIndex: 'asc' } },
    },
  })
  if (!interview) return NextResponse.json({ error: '面试不存在' }, { status: 404 })

  return NextResponse.json({
    id: interview.id,
    candidateName: interview.candidateName,
    targetRole: interview.targetRole,
    questionCount: interview.questionCount,
    state: interview.state,
    currentQuestionIndex: interview.currentQuestionIndex,
    followUpDepth: interview.followUpDepth,
    messages: interview.messages.map((m) => ({
      id: m.id,
      role: m.role,
      kind: m.kind,
      questionIndex: m.questionIndex,
      content: m.content,
    })),
  })
}
