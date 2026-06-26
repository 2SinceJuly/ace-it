'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, FileText, Loader2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
              <CardTitle className="text-xl">Interview room</CardTitle>
              <CardDescription>
                This session is ready. The next slice will generate the first AI question here.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex min-h-72 items-center justify-center rounded-md border border-dashed text-center text-sm text-muted-foreground">
                No interview messages yet.
              </div>
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
