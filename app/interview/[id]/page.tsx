import { notFound, redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { getSessionUserId } from '@/lib/auth/session'
import { InterviewRoom } from '@/components/interview-room'

export default async function InterviewPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const userId = await getSessionUserId()
  if (!userId) redirect('/login')

  const { id } = await params
  const interview = await prisma.interview.findFirst({
    where: { id, userId },
    include: {
      messages: { orderBy: { createdAt: 'asc' } },
      outlineItems: {
        orderBy: { orderIndex: 'asc' },
        select: { orderIndex: true, topic: true, difficulty: true },
      },
    },
  })
  if (!interview) notFound()

  if (interview.state === 'FINISHED') redirect(`/report/${id}`)

  return (
    <InterviewRoom
      interviewId={interview.id}
      candidateName={interview.candidateName}
      targetRole={interview.targetRole}
      questionCount={interview.questionCount}
      initialState={interview.state}
      initialQuestionIndex={interview.currentQuestionIndex}
      initialFollowUpDepth={interview.followUpDepth}
      outline={interview.outlineItems}
      initialMessages={interview.messages.map((m) => ({
        id: m.id,
        role: m.role,
        kind: m.kind,
        questionIndex: m.questionIndex,
        content: m.content,
      }))}
    />
  )
}
