import Link from 'next/link'
import { ArrowRight, ClipboardCheck, FileText, History, MessageSquareText } from 'lucide-react'
import { Button } from '@/components/ui/button'

const features = [
  {
    title: 'Resume-driven questions',
    description: 'Create interviews from your target role, resume, JD, and project notes.',
    icon: FileText,
  },
  {
    title: 'Mock interview room',
    description: 'Practice inside a dedicated interview session instead of a generic chat.',
    icon: MessageSquareText,
  },
  {
    title: 'Interview history',
    description: 'Keep sessions organized so each round can be reviewed later.',
    icon: History,
  },
  {
    title: 'Review-ready workflow',
    description: 'The next steps add AI questions, answers, scoring, and report generation.',
    icon: ClipboardCheck,
  },
]

export function LandingHero() {
  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 py-16">
      <div className="max-w-3xl space-y-6">
        <div className="inline-flex rounded-md border px-3 py-1 text-sm text-muted-foreground">
          AI mock interview assistant
        </div>
        <div className="space-y-4">
          <h1 className="text-5xl font-semibold tracking-tight text-[hsl(var(--text-primary))] sm:text-6xl">
            Ace It
          </h1>
          <p className="text-xl leading-8 text-muted-foreground">
            Build realistic interview practice from your resume, target JD, and project notes.
            Start a session, prepare answers, and turn each round into reviewable feedback.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button asChild size="lg">
            <Link href="/interviews/new">
              Start mock interview
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/interviews">View interview history</Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {features.map((feature) => {
          const Icon = feature.icon
          return (
            <div key={feature.title} className="rounded-md border bg-card p-5">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-md bg-muted">
                <Icon className="h-5 w-5 text-[hsl(var(--text-primary))]" />
              </div>
              <h3 className="font-semibold text-[hsl(var(--text-primary))]">{feature.title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{feature.description}</p>
            </div>
          )
        })}
      </div>
    </section>
  )
}
