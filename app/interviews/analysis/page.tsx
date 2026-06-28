'use client'

import { AuthGuard } from '@/features/auth/components/AuthGuard'
import { InterviewAnalysis } from '@/features/interview/components/InterviewAnalysis'
import { InterviewShell } from '@/features/interview/components/InterviewShell'

export default function InterviewAnalysisPage() {
  return (
    <AuthGuard redirectTo="/">
      <InterviewShell title="我的面试" subtitle="岗位趋势、能力画像和单场报告">
        <InterviewAnalysis />
      </InterviewShell>
    </AuthGuard>
  )
}
