'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { ClockCounterClockwise, PencilSimpleLine, SignOut } from '@phosphor-icons/react'
import { BrandMark } from '@/components/brand'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { href: '/', label: '开始面试', icon: PencilSimpleLine },
  { href: '/history', label: '历史面试', icon: ClockCounterClockwise },
]

export function AppHeader({ userName }: { userName?: string }) {
  const router = useRouter()
  const pathname = usePathname()

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
    router.refresh()
  }

  return (
    <header className="border-b border-divider bg-surface">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-stretch justify-between px-4 md:px-6">
        <div className="flex items-stretch gap-6">
          <Link href="/" className="flex items-center">
            <span className="font-serif text-base font-semibold tracking-tight text-ink">
              <BrandMark />
            </span>
          </Link>
          <nav aria-label="主导航" className="flex items-stretch gap-1">
            {NAV_ITEMS.map((item) => {
              const active = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'relative flex items-center gap-1.5 px-3 text-sm transition-colors',
                    active
                      ? 'font-medium text-ink after:absolute after:inset-x-3 after:bottom-0 after:h-0.5 after:bg-accent-strong'
                      : 'text-ink-muted hover:text-ink',
                  )}
                >
                  <item.icon className="size-4" aria-hidden="true" />
                  <span className="hidden sm:inline">{item.label}</span>
                  <span className="sr-only sm:hidden">{item.label}</span>
                </Link>
              )
            })}
          </nav>
        </div>
        <div className="flex items-center gap-2">
          {userName && (
            <span className="hidden font-mono text-xs text-ink-muted md:inline">{userName}</span>
          )}
          <button
            type="button"
            onClick={handleLogout}
            aria-label="退出登录"
            className="flex size-8 items-center justify-center rounded-md text-ink-muted transition-colors hover:bg-surface-subtle hover:text-ink focus-visible:outline-2 focus-visible:outline-accent-strong"
          >
            <SignOut className="size-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </header>
  )
}
