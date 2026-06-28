'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Bot, FileText, Loader2, User } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { useInterviewStore } from '@/features/interview/store/interview.store'

interface InterviewRoomProps {
  interviewId: string
}

const difficultyLabels: Record<string, string> = {
  easy: 'Easy',
  medium: 'Medium',
  hard: 'Hard',
}

function summarizeMaterial(content: string) {
  const compact = content.replace(/\s+/g, ' ').trim()
  if (compact.length <= 360) return compact
  return `${compact.slice(0, 360)}...`
}

function formatMessageTime(value: string) {
  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

export function InterviewRoom({ interviewId }: InterviewRoomProps) {
  const interview = useInterviewStore((state) => state.currentInterview)
  const isLoading = useInterviewStore((state) => state.currentInterviewLoading)
  const loadInterview = useInterviewStore((state) => state.loadInterview)

  useEffect(() => {
    loadInterview(interviewId)
  }, [interviewId, loadInterview])

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-muted-foreground">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        Loading interview...
      </div>
    )
  }

  if (!interview) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <Card className="w-full max-w-md rounded-md">
          <CardHeader>
            <CardTitle>Interview not found</CardTitle>
            <CardDescription>The session may have been removed or is not available.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/interviews">Back to interviews</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const material = interview.materials[0]?.content || ''
  const hasMessages = interview.messages.length > 0

  return (
    <div className="min-h-screen bg-background px-4 py-8">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <Button asChild variant="ghost" className="w-fit">
          <Link href="/interviews">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
        </Button>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">{interview.position}</h1>
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge variant="secondary">{difficultyLabels[interview.difficulty] || interview.difficulty}</Badge>
              <Badge variant="outline">{interview.status}</Badge>
            </div>
          </div>
          <Button disabled title="AI question generation is planned for the next slice.">
            Start AI interview
          </Button>
        </div>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
          <Card className="rounded-md">
            <CardHeader>
              <CardTitle className="text-xl">Messages</CardTitle>
              <CardDescription>Saved interview conversation for this session.</CardDescription>
            </CardHeader>
            <CardContent>
              {!hasMessages ? (
                <div className="flex min-h-72 items-center justify-center rounded-md border border-dashed px-6 text-center text-sm text-muted-foreground">
                  No interview messages yet.
                </div>
              ) : (
                <div className="flex min-h-72 flex-col gap-4">
                  {interview.messages.map((message) => {
                    const isUser = message.role === 'user'

                    return (
                      <div
                        key={message.id}
                        className={cn('flex gap-3', isUser ? 'justify-end' : 'justify-start')}
                      >
                        {!isUser && (
                          <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                            <Bot className="h-4 w-4" />
                          </div>
                        )}
                        <div
                          className={cn(
                            'max-w-[78%] rounded-md px-4 py-3 text-sm leading-6',
                            isUser
                              ? 'bg-primary/10 text-foreground'
                              : 'border bg-background text-foreground'
                          )}
                        >
                          <div className="mb-1 flex items-center justify-between gap-3 text-xs text-muted-foreground">
                            <span>{isUser ? 'You' : 'Assistant'}</span>
                            <span>{formatMessageTime(message.createdAt)}</span>
                          </div>
                          <p className="whitespace-pre-wrap">{message.content}</p>
                        </div>
                        {isUser && (
                          <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                            <User className="h-4 w-4" />
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <FileText className="h-5 w-5" />
                Material
              </CardTitle>
              <CardDescription>Saved source material for this interview.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
                {summarizeMaterial(material)}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
