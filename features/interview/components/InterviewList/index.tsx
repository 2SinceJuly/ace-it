'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { Briefcase, Loader2, Plus } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useInterviewStore } from '@/features/interview/store/interview.store'

const difficultyLabels: Record<string, string> = {
  easy: 'Easy',
  medium: 'Medium',
  hard: 'Hard',
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

export function InterviewList() {
  const interviews = useInterviewStore((state) => state.interviews)
  const isLoading = useInterviewStore((state) => state.interviewsLoading)
  const hasInitiallyLoaded = useInterviewStore((state) => state.hasInitiallyLoaded)
  const loadInterviews = useInterviewStore((state) => state.loadInterviews)

  useEffect(() => {
    if (!hasInitiallyLoaded) {
      loadInterviews()
    }
  }, [hasInitiallyLoaded, loadInterviews])

  return (
    <div className="min-h-screen bg-background px-4 py-8">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Mock interviews</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Start a focused practice session from your role, resume, project notes, and JD.
            </p>
          </div>
          <Button asChild>
            <Link href="/interviews/new">
              <Plus className="h-4 w-4" />
              New mock interview
            </Link>
          </Button>
        </div>

        {isLoading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading interviews...
          </div>
        )}

        {!isLoading && interviews.length === 0 && (
          <Card className="rounded-md">
            <CardHeader>
              <CardTitle className="text-xl">No mock interviews yet</CardTitle>
              <CardDescription>
                Create one session with the target role, resume, project material, and JD.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild>
                <Link href="/interviews/new">
                  <Plus className="h-4 w-4" />
                  Create first mock interview
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-3">
          {interviews.map((interview) => (
            <Link key={interview.id} href={`/interviews/${interview.id}`}>
              <Card className="rounded-md transition-colors hover:bg-accent/40">
                <CardContent className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex min-w-0 items-start gap-3">
                    <div className="mt-0.5 rounded-md border p-2 text-muted-foreground">
                      <Briefcase className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="truncate font-medium">{interview.position}</div>
                      <div className="mt-1 text-sm text-muted-foreground">
                        Updated {formatDate(interview.updatedAt)}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary">{difficultyLabels[interview.difficulty] || interview.difficulty}</Badge>
                    <Badge variant="outline">{interview.status}</Badge>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
