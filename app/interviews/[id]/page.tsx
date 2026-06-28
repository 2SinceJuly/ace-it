'use client'

import { useParams } from 'next/navigation'
import { AuthGuard } from '@/features/auth/components/AuthGuard'
import { InterviewRoom } from '@/features/interview/components/InterviewRoom'
import { InterviewShell } from '@/features/interview/components/InterviewShell'

export default function InterviewRoomPage() {
  const params = useParams()
  const interviewId = params.id as string

  return (
    <AuthGuard redirectTo="/">
      <InterviewShell title="模拟面试房间" subtitle="流式出题、实时回答、刷新后保留历史记录">
        <InterviewRoom interviewId={interviewId} />
      </InterviewShell>
    </AuthGuard>
  )
}
