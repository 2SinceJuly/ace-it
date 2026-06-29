'use client'

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useSession } from 'next-auth/react'
import { useInterviewStore } from '@/features/interview/store/interview.store'
import { SideNav } from './SideNav'
import { Header } from './Header'

interface HeaderSlots {
  meta?: ReactNode
  actions?: ReactNode
}

interface HeaderSlotsContextValue {
  setHeaderSlots: (slots: HeaderSlots) => void
}

const HeaderSlotsContext = createContext<HeaderSlotsContextValue | null>(null)

export function useInterviewShellHeaderSlots(slots: HeaderSlots) {
  const context = useContext(HeaderSlotsContext)

  useEffect(() => {
    if (!context) return

    context.setHeaderSlots(slots)

    return () => {
      context.setHeaderSlots({})
    }
  }, [context, slots])
}

interface InterviewShellProps {
  children: ReactNode
  title: string
  subtitle: string
}

export function InterviewShell({ children, title, subtitle }: InterviewShellProps) {
  const { data: session } = useSession()
  const hasInitiallyLoaded = useInterviewStore((state) => state.hasInitiallyLoaded)
  const loadInterviews = useInterviewStore((state) => state.loadInterviews)
  const userName = session?.user?.name || '求职者'
  const userEmail = session?.user?.email || '准备下一场面试'
  const [headerSlots, setHeaderSlots] = useState<HeaderSlots>({})
  const headerSlotsContext = useMemo(() => ({ setHeaderSlots }), [])

  useEffect(() => {
    if (!hasInitiallyLoaded) {
      loadInterviews()
    }
  }, [hasInitiallyLoaded, loadInterviews])

  return (
    <div className="flex h-[100dvh] overflow-hidden bg-[#f4f1ed] text-[#111318]">
      <SideNav userName={userName} userEmail={userEmail} />

      <HeaderSlotsContext.Provider value={headerSlotsContext}>
        <main className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <Header
            title={title}
            subtitle={subtitle}
            userName={userName}
            meta={headerSlots.meta}
            actions={headerSlots.actions}
          />
          <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto px-4 py-6 md:px-8 lg:px-10">
            <div className="mx-auto h-full max-w-[1500px]">{children}</div>
          </div>
        </main>
      </HeaderSlotsContext.Provider>
    </div>
  )
}
