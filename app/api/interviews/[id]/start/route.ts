import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSessionUserId } from '@/lib/auth/session'
import { streamChat } from '@/lib/engine/llm'
import { greetingMessages, questionMessages } from '@/lib/engine/prompts'
import { sseResponse } from '@/lib/engine/sse'

export const maxDuration = 120

/**
 * 开始面试：SSE 流式输出「开场白 + 第一题」，落库并推进状态到 QUESTIONING。
 * 仅当 state 为 CREATED 时可调用（幂等保护）。
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
    include: { outlineItems: { orderBy: { orderIndex: 'asc' } } },
  })
  if (!interview) return NextResponse.json({ error: '面试不存在' }, { status: 404 })
  if (interview.state !== 'CREATED') {
    return NextResponse.json({ error: '面试已开始' }, { status: 409 })
  }
  const firstItem = interview.outlineItems[0]
  if (!firstItem) return NextResponse.json({ error: '面试大纲为空' }, { status: 500 })

  await prisma.interview.update({ where: { id }, data: { state: 'GREETING' } })

  return sseResponse(async (emit) => {
    // 1. 开场白
    emit({ type: 'stage', stage: 'greeting' })
    let greeting = ''
    for await (const delta of streamChat(
      greetingMessages(interview.candidateName, interview.targetRole, interview.questionCount),
    )) {
      greeting += delta
      emit({ type: 'delta', text: delta })
    }
    const greetingMsg = await prisma.message.create({
      data: {
        interviewId: id,
        role: 'INTERVIEWER',
        kind: 'GREETING',
        questionIndex: 0,
        content: greeting,
      },
    })
    emit({
      type: 'message_done',
      messageId: greetingMsg.id,
      kind: 'GREETING',
      questionIndex: 0,
      content: greeting,
    })

    // 2. 第一题
    emit({ type: 'stage', stage: 'question', questionIndex: 0 })
    let question = ''
    for await (const delta of streamChat(
      questionMessages({
        question: firstItem.question,
        topic: firstItem.topic,
        relatedResumePoint: firstItem.relatedResumePoint,
        questionIndex: 0,
        questionCount: interview.questionCount,
        isFirst: true,
      }),
    )) {
      question += delta
      emit({ type: 'delta', text: delta })
    }
    const questionMsg = await prisma.message.create({
      data: {
        interviewId: id,
        role: 'INTERVIEWER',
        kind: 'QUESTION',
        questionIndex: 0,
        content: question,
      },
    })
    await prisma.interview.update({
      where: { id },
      data: { state: 'QUESTIONING', currentQuestionIndex: 0, followUpDepth: 0 },
    })
    emit({
      type: 'message_done',
      messageId: questionMsg.id,
      kind: 'QUESTION',
      questionIndex: 0,
      content: question,
    })
  })
}
