'use client'

interface HeaderProps {
  title: string
  subtitle: string
  userName: string
}

export function Header({ title, subtitle, userName }: HeaderProps) {
  return (
    <div className="sticky top-0 z-10 border-b border-[#ded8cf] bg-[#f4f1ed]/88 px-4 py-4 backdrop-blur md:px-8 lg:px-10">
      <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">{title}</h1>
          <p className="mt-1 text-sm text-[#6b675f] md:text-base">{subtitle}</p>
        </div>
        <div className="hidden rounded-full border border-[#ded8cf] bg-white px-4 py-2 text-sm text-[#6b675f] md:block">
          {userName}
        </div>
      </div>
    </div>
  )
}
