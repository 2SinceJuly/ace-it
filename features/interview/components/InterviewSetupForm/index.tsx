'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft, FileText, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { useInterviewStore } from '@/features/interview/store/interview.store'

const difficultyOptions = [
  { value: 'easy', label: 'Easy', description: 'Warm-up screening' },
  { value: 'medium', label: 'Medium', description: 'Recommended default' },
  { value: 'hard', label: 'Hard', description: 'More pressure and follow-ups' },
]

function buildMaterialContent(input: {
  resumeContent: string
  projectContent: string
  jobDescription: string
}) {
  return [
    ['Resume', input.resumeContent],
    ['Project and supporting material', input.projectContent],
    ['Target JD / Job description', input.jobDescription],
  ]
    .map(([title, content]) => {
      const trimmed = content.trim()
      return trimmed ? `## ${title}\n${trimmed}` : ''
    })
    .filter(Boolean)
    .join('\n\n')
}

export function InterviewSetupForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const createInterview = useInterviewStore((state) => state.createInterview)
  const [position, setPosition] = useState('')
  const [difficulty, setDifficulty] = useState('medium')
  const [resumeContent, setResumeContent] = useState('')
  const [projectContent, setProjectContent] = useState('')
  const [jobDescription, setJobDescription] = useState(searchParams.get('context') || '')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (isSubmitting) return

    setError(null)
    setIsSubmitting(true)

    try {
      const materialContent = buildMaterialContent({
        resumeContent,
        projectContent,
        jobDescription,
      })

      if (!materialContent) {
        throw new Error('Add at least one source: resume, project material, or JD.')
      }

      const interviewId = await createInterview({
        position,
        difficulty,
        materialContent,
      })
      router.push(`/interviews/${interviewId}`)
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Failed to create interview.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-background px-4 py-8">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
        <Button
          type="button"
          variant="ghost"
          className="w-fit"
          onClick={() => router.push('/interviews')}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to interviews
        </Button>

        <Card className="rounded-md">
          <CardHeader>
            <div className="flex items-start gap-3">
              <div className="rounded-md border p-2 text-muted-foreground">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-2xl">Create mock interview</CardTitle>
                <CardDescription className="mt-2">
                  Add the role, resume, project context, and target JD. The AI will use this as the interview context.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form className="space-y-5" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="position">Position</Label>
                <Input
                  id="position"
                  value={position}
                  onChange={(event) => setPosition(event.target.value)}
                  placeholder="Frontend Engineer Intern"
                  disabled={isSubmitting}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="difficulty">Difficulty</Label>
                <select
                  id="difficulty"
                  value={difficulty}
                  onChange={(event) => setDifficulty(event.target.value)}
                  disabled={isSubmitting}
                  className={cn(
                    'flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors',
                    'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50'
                  )}
                >
                  {difficultyOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label} - {option.description}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="resume">Resume content</Label>
                <textarea
                  id="resume"
                  value={resumeContent}
                  onChange={(event) => setResumeContent(event.target.value)}
                  placeholder="Paste resume text, experience bullets, education, skills, and internships..."
                  disabled={isSubmitting}
                  className={cn(
                    'min-h-40 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm transition-colors',
                    'placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
                    'disabled:cursor-not-allowed disabled:opacity-50'
                  )}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="project">Project / supporting material</Label>
                <textarea
                  id="project"
                  value={projectContent}
                  onChange={(event) => setProjectContent(event.target.value)}
                  placeholder="Paste project notes, portfolio descriptions, architecture notes, or study material..."
                  disabled={isSubmitting}
                  className={cn(
                    'min-h-36 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm transition-colors',
                    'placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
                    'disabled:cursor-not-allowed disabled:opacity-50'
                  )}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="jd">Target JD / Job description</Label>
                <textarea
                  id="jd"
                  value={jobDescription}
                  onChange={(event) => setJobDescription(event.target.value)}
                  placeholder="Paste the target job description, requirements, tech stack, and responsibilities..."
                  disabled={isSubmitting}
                  className={cn(
                    'min-h-36 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm transition-colors',
                    'placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
                    'disabled:cursor-not-allowed disabled:opacity-50'
                  )}
                />
              </div>

              {error && (
                <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {error}
                </div>
              )}

              <div className="flex justify-end">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  Create mock interview
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
