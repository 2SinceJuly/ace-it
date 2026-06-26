'use client'

import { AuthGuard } from '@/features/auth/components/AuthGuard'
import { InterviewSetupForm } from '@/features/interview/components/InterviewSetupForm'

export default function NewInterviewPage() {
  return (
    <AuthGuard redirectTo="/">
      <InterviewSetupForm />
    </AuthGuard>
  )
}
