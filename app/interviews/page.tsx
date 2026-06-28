'use client'

import { AuthGuard } from '@/features/auth/components/AuthGuard'
import { InterviewList } from '@/features/interview/components/InterviewList'
import { InterviewShell } from '@/features/interview/components/InterviewShell'

export default function InterviewsPage() {
  return (
    <AuthGuard redirectTo="/">
      <InterviewShell title="岗位练习" subtitle="选择互联网岗位方向，进入定制面试后配置题量、时长和难度">
        <InterviewList />
      </InterviewShell>
    </AuthGuard>
  )
}
