'use client'

import { useParams } from 'next/navigation'
import { AuthGuard } from '@/features/auth/components/AuthGuard'
import { InterviewRoom } from '@/features/interview/components/InterviewRoom'

export default function InterviewRoomPage() {
  const params = useParams()
  const interviewId = params.id as string

  return (
    <AuthGuard redirectTo="/">
      <InterviewRoom interviewId={interviewId} />
    </AuthGuard>
  )
}
