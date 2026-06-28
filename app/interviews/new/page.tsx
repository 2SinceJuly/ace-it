'use client'

import { AuthGuard } from '@/features/auth/components/AuthGuard'
import { InterviewSetupForm } from '@/features/interview/components/InterviewSetupForm'
import { InterviewShell } from '@/features/interview/components/InterviewShell'

export default function NewInterviewPage() {
  return (
    <AuthGuard redirectTo="/">
      <InterviewShell title="定制面试" subtitle="设置题量、时长和难度，再补充简历、项目文档和目标 JD">
        <InterviewSetupForm />
      </InterviewShell>
    </AuthGuard>
  )
}
