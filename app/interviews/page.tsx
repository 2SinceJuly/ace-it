'use client'

import { AuthGuard } from '@/features/auth/components/AuthGuard'
import { InterviewList } from '@/features/interview/components/InterviewList'

export default function InterviewsPage() {
  return (
    <AuthGuard redirectTo="/">
      <InterviewList />
    </AuthGuard>
  )
}
