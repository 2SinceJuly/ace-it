'use client'

import { useParams } from 'next/navigation'
import { AuthGuard } from '@/features/auth/components/AuthGuard'
import { InterviewReport } from '@/features/interview/components/InterviewReport'
import { InterviewShell } from '@/features/interview/components/InterviewShell'

export default function InterviewReportPage() {
  const params = useParams<{ id: string }>()

  return (
    <AuthGuard redirectTo="/">
      <InterviewShell title="面试评估报告" subtitle="查看单场面试的能力画像、改进建议和练习路径">
        <InterviewReport interviewId={params.id} />
      </InterviewShell>
    </AuthGuard>
  )
}
