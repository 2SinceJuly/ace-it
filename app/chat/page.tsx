'use client'

import { useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { AuthGuard } from '@/features/auth/components/AuthGuard'
import { useConversationStore } from '@/features/conversation/store/conversation-store'

function ChatRedirect() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const isCreatingRef = useRef(false)

  useEffect(() => {
    if (isCreatingRef.current) return
    isCreatingRef.current = true

    const createAndRedirect = async () => {
      try {
        const newId = await useConversationStore.getState().createConversation()
        const msg = searchParams.get('msg')
        const url = msg ? `/chat/${newId}?msg=${msg}` : `/chat/${newId}`
        router.replace(url)
      } catch (error) {
        console.error('[ChatRedirect] Failed to create conversation:', error)
        isCreatingRef.current = false
        router.push('/')
      }
    }

    createAndRedirect()
  }, [router, searchParams])

  return (
    <div className="flex h-screen items-center justify-center">
      <div className="text-muted-foreground">正在创建新会话...</div>
    </div>
  )
}

export default function ChatPage() {
  return (
    <AuthGuard redirectTo="/">
      <ChatRedirect />
    </AuthGuard>
  )
}
