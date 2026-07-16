import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSessionUserId } from '@/lib/auth/session'
import { callFunction, streamChat } from '@/lib/engine/llm'
import { decideAfterAnswer } from '@/lib/engine/fsm'
import {
  EVALUATION_TOOL,
  closingMessages,
  evaluationMessages,
  followUpMessages,
  questionMessages,
} from '@/lib/engine/prompts'
import { sseResponse } from '@/lib/engine/sse'

export const maxDuration = 180

interface Evaluation {
  score: number
  comment: string
  needsFollowUp: boolean
  followUpFocus: string
  coveredPoints: string[]
}

/**
 * 候选人提交回答：
 * 1. 落库候选人消息；
 * 2. Function Calling 内部评估（score/comment/needsFollowUp/followUpFocus/coveredPoints），
 *    评估结果只入库，绝不通过 SSE 下发给前端；
 * 3. FSM 按 needsFollowUp + 硬约束（每题最多追问 2 次、总题数不超限）决定下一步；
 * 4. SSE 流式输出追问 / 下一题 / 结束语。
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const userId = await getSessionUserId()
  if (!userId) return NextResponse.json({ error: '未登录' }, { status: 401 })

  const { id } = await params
  const body = (await req.json().catch(() => null)) as { answer?: string } | null
  const answer = body?.answer?.trim()
  if (!answer) return NextResponse.json({ error: '回答不能为空' }, { status: 400 })
  if (answer.length > 8000) {
    return NextResponse.json({ error: '回答过长（最多 8000 字）' }, { status: 400 })
  }

  const interview = await prisma.interview.findFirst({
    where: { id, userId },
    include: { outlineItems: { orderBy: { orderIndex: 'asc' } } },
  })
  if (!interview) return NextResponse.json({ error: '面试不存在' }, { status: 404 })
  if (interview.state !== 'QUESTIONING') {
    return NextResponse.json({ error: '当前状态不能提交回答' }, { status: 409 })
  }

  const qIndex = interview.currentQuestionIndex
  const depth = interview.followUpDepth
  const currentItem = interview.outlineItems[qIndex]
  if (!currentItem) return NextResponse.json({ error: '大纲越界' }, { status: 500 })

  // 本题此前的问答轮次（供评估上下文）
  const priorMessages = await prisma.message.findMany({
    where: { interviewId: id, questionIndex: qIndex },
    orderBy: { createdAt: 'asc' },
  })
  // 最后一条面试官发言 = 候选人本轮实际回答的问题
  const lastInterviewerMsg = [...priorMessages]
    .reverse()
    .find((m) => m.role === 'INTERVIEWER')
  const currentQuestionText = lastInterviewerMsg?.content ?? currentItem.question

  const previousRounds: { question: string; answer: string }[] = []
  for (let i = 0; i < priorMessages.length - 1; i++) {
    const q = priorMessages[i]
    const a = priorMessages[i + 1]
    if (q.role === 'INTERVIEWER' && a.role === 'CANDIDATE') {
      previousRounds.push({ question: q.content, answer: a.content })
    }
  }

  // 1. 落库候选人回答
  const answerMsg = await prisma.message.create({
    data: {
      interviewId: id,
      role: 'CANDIDATE',
      kind: 'ANSWER',
      questionIndex: qIndex,
      followUpDepth: depth,
      content: answer,
    },
  })

  return sseResponse(async (emit) => {
    // 2. 内部评估（对候选人不可见）
    emit({ type: 'stage', stage: 'evaluating', questionIndex: qIndex })
    let evaluation: Evaluation
    try {
      evaluation = await callFunction<Evaluation>({
        messages: evaluationMessages({
          question: currentQuestionText,
          answer,
          topic: currentItem.topic,
          relatedResumePoint: currentItem.relatedResumePoint,
          previousRounds,
        }),
        name: EVALUATION_TOOL.name,
        description: EVALUATION_TOOL.description,
        parameters: EVALUATION_TOOL.parameters as unknown as Record<string, unknown>,
      })
    } catch {
      // 评估失败兜底：记 5 分、不追问，保证面试不中断
      evaluation = {
        score: 5,
        comment: '（内部评估调用失败，使用兜底评估）',
        needsFollowUp: false,
        followUpFocus: '',
        coveredPoints: [],
      }
    }

    await prisma.score.create({
      data: {
        interviewId: id,
        messageId: answerMsg.id,
        score: Math.max(0, Math.min(10, Math.round(evaluation.score))),
        comment: evaluation.comment,
        needsFollowUp: evaluation.needsFollowUp,
        followUpFocus: evaluation.followUpFocus ?? '',
        coveredPoints: evaluation.coveredPoints ?? [],
      },
    })

    // 3. FSM 决策（程序掌控流程，含硬约束）
    const decision = decideAfterAnswer({
      needsFollowUp: evaluation.needsFollowUp,
      followUpDepth: depth,
      currentQuestionIndex: qIndex,
      questionCount: Math.min(interview.questionCount, interview.outlineItems.length),
    })

    // 4. 按决策流式输出面试官下一段发言
    if (decision.action === 'follow_up') {
      emit({ type: 'stage', stage: 'follow_up', questionIndex: qIndex })
      let text = ''
      for await (const delta of streamChat(
        followUpMessages({
          question: currentQuestionText,
          answer,
          followUpFocus: evaluation.followUpFocus || '让候选人展开说明关键细节',
          followUpDepth: decision.nextFollowUpDepth,
        }),
      )) {
        text += delta
        emit({ type: 'delta', text: delta })
      }
      const msg = await prisma.message.create({
        data: {
          interviewId: id,
          role: 'INTERVIEWER',
          kind: 'FOLLOW_UP',
          questionIndex: qIndex,
          followUpDepth: decision.nextFollowUpDepth,
          content: text,
        },
      })
      await prisma.interview.update({
        where: { id },
        data: { followUpDepth: decision.nextFollowUpDepth },
      })
      emit({
        type: 'message_done',
        messageId: msg.id,
        kind: 'FOLLOW_UP',
        questionIndex: qIndex,
        content: text,
      })
    } else if (decision.action === 'next_question') {
      const nextItem = interview.outlineItems[decision.nextQuestionIndex]
      emit({ type: 'stage', stage: 'question', questionIndex: decision.nextQuestionIndex })
      let text = ''
      for await (const delta of streamChat(
        questionMessages({
          question: nextItem.question,
          topic: nextItem.topic,
          relatedResumePoint: nextItem.relatedResumePoint,
          questionIndex: decision.nextQuestionIndex,
          questionCount: interview.questionCount,
          isFirst: false,
        }),
      )) {
        text += delta
        emit({ type: 'delta', text: delta })
      }
      const msg = await prisma.message.create({
        data: {
          interviewId: id,
          role: 'INTERVIEWER',
          kind: 'QUESTION',
          questionIndex: decision.nextQuestionIndex,
          content: text,
        },
      })
      await prisma.interview.update({
        where: { id },
        data: {
          currentQuestionIndex: decision.nextQuestionIndex,
          followUpDepth: 0,
        },
      })
      emit({
        type: 'message_done',
        messageId: msg.id,
        kind: 'QUESTION',
        questionIndex: decision.nextQuestionIndex,
        content: text,
      })
    } else {
      // closing
      emit({ type: 'stage', stage: 'closing' })
      let text = ''
      for await (const delta of streamChat(closingMessages(interview.candidateName))) {
        text += delta
        emit({ type: 'delta', text: delta })
      }
      const msg = await prisma.message.create({
        data: {
          interviewId: id,
          role: 'INTERVIEWER',
          kind: 'CLOSING',
          questionIndex: qIndex,
          content: text,
        },
      })
      await prisma.interview.update({ where: { id }, data: { state: 'CLOSING' } })
      emit({
        type: 'message_done',
        messageId: msg.id,
        kind: 'CLOSING',
        questionIndex: qIndex,
        content: text,
      })
    }
  })
}
