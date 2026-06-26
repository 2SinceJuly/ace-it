'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { useInterviewStore } from '@/features/interview/store/interview.store'

const difficultyOptions = [
  { value: 'easy', label: 'Easy' },
  { value: 'medium', label: 'Medium' },
  { value: 'hard', label: 'Hard' },
]

export function InterviewSetupForm() {
  const router = useRouter()
  const createInterview = useInterviewStore((state) => state.createInterview)
  const [position, setPosition] = useState('')
  const [difficulty, setDifficulty] = useState('medium')
  const [materialContent, setMaterialContent] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (isSubmitting) return

    setError(null)
    setIsSubmitting(true)

    try {
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
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
        <Button
          type="button"
          variant="ghost"
          className="w-fit"
          onClick={() => router.push('/interviews')}
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>

        <Card className="rounded-md">
          <CardHeader>
            <CardTitle className="text-2xl">Create interview</CardTitle>
            <CardDescription>
              Set the role and paste the material the interviewer should use later.
            </CardDescription>
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
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="material">Resume / JD / project material</Label>
                <textarea
                  id="material"
                  value={materialContent}
                  onChange={(event) => setMaterialContent(event.target.value)}
                  placeholder="Paste resume bullets, target JD, project notes, or review material..."
                  disabled={isSubmitting}
                  className={cn(
                    'min-h-56 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm transition-colors',
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
                  Start interview
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
