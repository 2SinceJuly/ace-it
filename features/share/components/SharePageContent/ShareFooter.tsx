import { Github, Globe } from 'lucide-react'

export function ShareFooter() {
  return (
    <footer className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto max-w-4xl px-4 py-6">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="text-center sm:text-left">
            <p className="text-sm text-muted-foreground">
              Powered by <span className="font-medium">Ace It</span>
            </p>
            <p className="text-xs text-muted-foreground">
              This is a read-only shared page. The original conversation may have changed.
            </p>
          </div>

          <div className="flex items-center gap-4">
            <a
              href="/"
              className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Globe className="h-4 w-4" />
              <span>Visit Ace It</span>
            </a>

            <a
              href="https://github.com/2SinceJuly/ace-it"
              className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Github className="h-4 w-4" />
              <span>GitHub</span>
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
