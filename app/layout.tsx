import './globals.css'
import { Metadata } from 'next'
import { ScannerProvider } from '@/contexts/ScannerContext'
import { Toaster } from 'react-hot-toast'

export const metadata: Metadata = {
  title: 'Infinitum Helpdesk',
  description: 'Event helpdesk for Infinitum',
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
        <ScannerProvider>
          <Toaster position="top-center" />
          {children}
        </ScannerProvider>
      </body>
    </html>
  )
}
