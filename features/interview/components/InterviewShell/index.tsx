'use client'

import { useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useInterviewStore } from '@/features/interview/store/interview.store'
import { SideNav } from './SideNav'
import { Header } from './Header'

interface InterviewShellProps {
  children: React.ReactNode
  title: string
  subtitle: string
}

export function InterviewShell({ children, title, subtitle }: InterviewShellProps) {
  const { data: session } = useSession()
  const hasInitiallyLoaded = useInterviewStore((state) => state.hasInitiallyLoaded)
  const loadInterviews = useInterviewStore((state) => state.loadInterviews)
  const userName = session?.user?.name || '求职者'
  const userEmail = session?.user?.email || '准备下一场面试'

  useEffect(() => {
    if (!hasInitiallyLoaded) {
      loadInterviews()
    }
  }, [hasInitiallyLoaded, loadInterviews])

  return (
    <div className="flex min-h-[100dvh] bg-[#f4f1ed] text-[#111318]">
      <SideNav userName={userName} userEmail={userEmail} />

      <main className="min-w-0 flex-1">
        <Header title={title} subtitle={subtitle} userName={userName} />
        <div className="mx-auto max-w-[1500px] px-4 py-6 md:px-8 lg:px-10">{children}</div>
      </main>
    </div>
  )
}
