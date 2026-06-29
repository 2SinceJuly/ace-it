'use client'

import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface HeaderProps {
  title: string
  subtitle: string
  userName: string
  meta?: ReactNode
  actions?: ReactNode
}

export function Header({ title, subtitle, userName, meta, actions }: HeaderProps) {
  const hasExtendedHeader = Boolean(meta || actions)

  return (
    <div className="sticky top-0 z-10 border-b border-[#ded8cf] bg-[#f4f1ed]/88 px-4 py-4 backdrop-blur md:px-8 lg:px-10">
      <div
        className={cn(
          'mx-auto flex max-w-[1500px] gap-4',
          hasExtendedHeader
            ? 'flex-col xl:flex-row xl:items-center xl:justify-between'
            : 'items-center justify-between'
        )}
      >
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">{title}</h1>
            {meta}
          </div>
          <p className="mt-1 text-sm text-[#6b675f] md:text-base">{subtitle}</p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2 xl:justify-end">
          {actions}
          <div className="hidden rounded-full border border-[#ded8cf] bg-white px-4 py-2 text-sm text-[#6b675f] md:block">
            {userName}
          </div>
        </div>
      </div>
    </div>
  )
}
