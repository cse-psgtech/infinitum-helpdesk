import './globals.css'
import { Metadata } from 'next'
import { Sidebar } from '@/components/sidebar'
import { ScannerStatusBar } from '@/components/scanner-status-bar'

export const metadata: Metadata = {
  title: 'Infinitum Helpdesk - 2026',
  description: 'Event helpdesk for Infinitum - kit distribution and tracking',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body>
        <Sidebar />
        <div className="main-content">
          {children}
        </div>
        <ScannerStatusBar />
      </body>
    </html>
  )
}
