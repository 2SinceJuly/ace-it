'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { MessageSquareText, PanelLeft, PanelLeftClose, UserRoundSearch } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { SkyLogoIcon } from '@/components/icons/SkyLogo'
import { useUIStore } from '@/lib/stores/ui.store'
import { cn } from '@/lib/utils'

interface SidebarProps {
  children?: React.ReactNode
  isLeader?: boolean
  className?: string
}

export function Sidebar({ children, isLeader, className }: SidebarProps) {
  const collapsed = useUIStore((s) => s.sidebarCollapsed)
  const toggleSidebar = useUIStore((s) => s.toggleSidebar)
  const pathname = usePathname()

  const navItems = [
    {
      href: '/interviews',
      label: '模拟面试',
      icon: UserRoundSearch,
      active: pathname.startsWith('/interviews'),
      primary: true,
    },
    {
      href: '/chat',
      label: '通用聊天',
      icon: MessageSquareText,
      active: pathname.startsWith('/chat'),
      primary: false,
    },
  ]

  return (
    <aside
      className={cn(
        'relative flex h-screen flex-col overflow-x-hidden bg-[hsl(var(--sidebar-bg))] transition-all duration-300 dark:bg-[hsl(var(--sidebar-bg))]',
        collapsed ? 'w-16' : 'w-64',
        className
      )}
    >
      <div
        className={cn(
          'p-3',
          collapsed ? 'flex flex-col items-center gap-2' : 'flex items-center justify-between px-4'
        )}
      >
        <div className={cn('flex items-center gap-2', collapsed && 'justify-center')}>
          <SkyLogoIcon width={32} height={32} className="shrink-0" />
          {!collapsed && (
            <span className="whitespace-nowrap bg-gradient-to-r from-[#60A5FA] to-[#2563EB] bg-clip-text text-lg font-semibold text-transparent">
              Ace It
            </span>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className="h-8 w-8 shrink-0 hover:bg-[hsl(var(--sidebar-hover))]"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <PanelLeft className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
        </Button>
      </div>

      <nav className={cn('px-3 pb-3', collapsed && 'px-2')}>
        <div className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon

            return (
              <Button
                key={item.href}
                asChild
                variant={item.active || item.primary ? 'secondary' : 'ghost'}
                className={cn(
                  'w-full justify-start gap-3',
                  'hover:bg-[hsl(var(--sidebar-hover))] dark:hover:bg-[hsl(var(--sidebar-hover))]',
                  item.primary && !item.active && 'bg-primary text-primary-foreground hover:bg-primary/90',
                  item.active && 'bg-accent text-accent-foreground',
                  collapsed && 'justify-center px-0'
                )}
                title={collapsed ? item.label : undefined}
              >
                <Link href={item.href}>
                  <Icon className="h-4 w-4" />
                  {!collapsed && <span>{item.label}</span>}
                </Link>
              </Button>
            )
          })}
        </div>
      </nav>

      {!collapsed && <ScrollArea className="min-h-0 flex-1 px-3">{children}</ScrollArea>}

      <div className="mt-auto p-3">
        {isLeader && (
          <Badge
            variant="outline"
            className={cn(
              'w-full justify-center border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-900/20 dark:text-green-400',
              collapsed ? 'px-1' : ''
            )}
          >
            <span className="h-2 w-2 rounded-full bg-green-500" />
            {!collapsed && <span className="ml-2">Main tab</span>}
          </Badge>
        )}
      </div>
    </aside>
  )
}
