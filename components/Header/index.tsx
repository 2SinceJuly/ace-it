'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useParams } from 'next/navigation'
import { Info, UserCircle2, LogOut, Palette } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ModelSelector } from '@/features/chat/components/ModelSelector'
import { useChatStore } from '@/features/chat/store/chat.store'
import { useSession, signOut } from 'next-auth/react'
import { useTheme } from 'next-themes'
import { StorageManager } from '@/lib/utils/storage'
import { ShareButton } from '@/features/share/components/ShareButton'
import { ExportButton } from '@/components/ExportButton'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

export function Header() {
  const params = useParams()
  const conversationId = params.conversationId as string | undefined

  const selectedModel = useChatStore((s) => s.selectedModel)
  const setModel = useChatStore((s) => s.setModel)
  const reset = useChatStore((s) => s.reset)
  const { data: session } = useSession()
  const { theme, setTheme } = useTheme()
  const [aboutDialogOpen, setAboutDialogOpen] = useState(false)

  const handleLogout = async () => {
    StorageManager.clearUserData()
    reset()
    await signOut({ callbackUrl: '/' })
  }

  const cycleTheme = () => {
    if (theme === 'light') setTheme('dark')
    else if (theme === 'dark') setTheme('system')
    else setTheme('light')
  }

  const themeLabel = theme === 'light' ? 'Light' : theme === 'dark' ? 'Dark' : 'System'

  return (
    <header className="sticky top-0 z-10 flex h-[60px] items-center justify-between border-none bg-background px-6">
      <div className="flex items-center gap-3">
        <ModelSelector value={selectedModel} onChange={setModel} />
      </div>

      <div className="flex items-center gap-2">
        {conversationId && <ExportButton conversationId={conversationId} className="h-9" />}

        {conversationId && <ShareButton conversationId={conversationId} className="h-9" />}

        <Button
          variant="ghost"
          size="icon"
          onClick={() => setAboutDialogOpen(true)}
          className="h-9 w-9 rounded-lg hover:bg-[hsl(var(--sidebar-hover))]"
          title="About"
        >
          <Info className="h-4 w-4" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 overflow-hidden rounded-full p-0 hover:bg-[hsl(var(--sidebar-hover))]"
            >
              {session?.user?.image ? (
                <Image
                  src={session.user.image}
                  alt={session.user.name || 'User'}
                  width={36}
                  height={36}
                  className="rounded-full object-cover"
                />
              ) : (
                <UserCircle2 className="h-6 w-6 text-gray-600 dark:text-gray-400" />
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{session?.user?.name || 'User'}</p>
                {session?.user?.email && (
                  <p className="text-xs leading-none text-muted-foreground">{session.user.email}</p>
                )}
              </div>
            </DropdownMenuLabel>

            <DropdownMenuSeparator />

            <DropdownMenuItem onClick={cycleTheme} className="cursor-pointer">
              <Palette className="mr-2 h-4 w-4" />
              <span>Theme: {themeLabel}</span>
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuItem
              onClick={handleLogout}
              className="cursor-pointer text-red-600 focus:text-red-600 dark:text-red-400 dark:focus:text-red-400"
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span>Sign out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Dialog open={aboutDialogOpen} onOpenChange={setAboutDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>About Ace It</DialogTitle>
            <DialogDescription>
              Ace It helps candidates practice realistic AI mock interviews with role-specific
              context.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Version</h4>
              <p className="text-sm text-muted-foreground">Version: 1.0.0</p>
            </div>
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Capabilities</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>Multiple AI model support</li>
                <li>Streaming chat foundation</li>
                <li>Voice input and speech output</li>
                <li>Conversation sharing and export</li>
                <li>OAuth login with GitHub and Google</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Stack</h4>
              <p className="text-sm text-muted-foreground">
                Next.js, React, TypeScript, Prisma, PostgreSQL
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </header>
  )
}
