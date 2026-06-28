'use client'

import { useEffect, useState, type FormEvent } from 'react'
import Link from 'next/link'
import { AlertCircle, ArrowLeft, Bot, FileText, Loader2, Send, User } from 'lucide-react'
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
  const startInterview = useInterviewStore((state) => state.startInterview)
  const submitInterviewAnswer = useInterviewStore((state) => state.submitInterviewAnswer)
  const [answer, setAnswer] = useState('')
  const [isStarting, setIsStarting] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadInterview(interviewId)
  }, [interviewId, loadInterview])

  const handleStartInterview = async () => {
    if (isStarting) return

    setError(null)
    setIsStarting(true)

    try {
      await startInterview(interviewId)
    } catch (startError) {
      setError(startError instanceof Error ? startError.message : 'Failed to start interview.')
    } finally {
      setIsStarting(false)
    }
  }

  const handleSubmitAnswer = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (isSubmitting || !answer.trim()) return

    setError(null)
    setIsSubmitting(true)

    try {
      await submitInterviewAnswer(interviewId, answer)
      setAnswer('')
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Failed to submit answer.')
      await loadInterview(interviewId)
    } finally {
      setIsSubmitting(false)
    }
  }

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
  const isBusy = isStarting || isSubmitting

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
          <Button onClick={handleStartInterview} disabled={isBusy || hasMessages}>
            {isStarting && <Loader2 className="h-4 w-4 animate-spin" />}
            Start AI interview
          </Button>
        </div>

        {error && (
          <div className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
          <Card className="rounded-md">
            <CardHeader>
              <CardTitle className="text-xl">Messages</CardTitle>
              <CardDescription>Saved interview conversation for this session.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!hasMessages ? (
                <div className="flex min-h-72 items-center justify-center rounded-md border border-dashed px-6 text-center text-sm text-muted-foreground">
                  {isStarting ? (
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Generating the first question...
                    </span>
                  ) : (
                    'No interview messages yet.'
                  )}
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

              {hasMessages && (
                <form className="space-y-3 border-t pt-4" onSubmit={handleSubmitAnswer}>
                  <textarea
                    value={answer}
                    onChange={(event) => setAnswer(event.target.value)}
                    placeholder="Type your answer..."
                    disabled={isBusy}
                    className={cn(
                      'min-h-28 w-full resize-y rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm transition-colors',
                      'placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
                      'disabled:cursor-not-allowed disabled:opacity-50'
                    )}
                  />
                  <div className="flex justify-end">
                    <Button type="submit" disabled={isBusy || !answer.trim()}>
                      {isSubmitting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                      Submit answer
                    </Button>
                  </div>
                </form>
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
