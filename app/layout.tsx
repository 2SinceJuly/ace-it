import type { Metadata } from 'next'
import './globals.css'
import { Providers } from '@/components/Providers'
import { Toaster } from '@/components/ui/toaster'
import { AccountLinkNotification } from '@/features/auth/components/AccountLinkNotification'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { GeoChecker } from '@/components/GeoChecker'

export const metadata: Metadata = {
  title: 'Ace It',
  description: 'AI mock interview assistant for practicing role-specific interviews.',
  icons: {
    icon: '/icon.svg',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className="antialiased">
        <ErrorBoundary>
          <Providers>
            {children}
            <Toaster />
            <AccountLinkNotification />
            <GeoChecker />
          </Providers>
        </ErrorBoundary>
      </body>
    </html>
  )
}
