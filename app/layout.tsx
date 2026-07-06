import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { Providers } from '@/components/providers'
import './globals.css'

const geistSans = Geist({
  subsets: ['latin'],
  variable: '--font-geist-sans',
  display: 'swap',
})

const geistMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-geist-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'AroMsg — AI Sales Agent That Closes Deals While You Sleep',
  description:
    'AroMsg powers Arobi, an AI Sales Agent that automates your sales on WhatsApp with human-like conversations, auto-payments, and smart negotiation. Never lose a customer in your DMs again.',
  keywords: [
    'AI sales agent',
    'WhatsApp automation',
    'AroMsg',
    'Arobi AI',
    'sales automation',
    'conversational AI',
    'payment automation',
  ],
  authors: [{ name: 'AroMsg' }],
  creator: 'AroMsg',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    title: 'AroMsg — AI Sales Agent That Closes Deals While You Sleep',
    description:
      'Automate your sales on WhatsApp with human-like AI conversations and built-in payments.',
    siteName: 'AroMsg',
    images: [
      {
        url: '/aromsg-logo.png',
        width: 1200,
        height: 630,
        alt: 'AroMsg — AI Sales Automation',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AroMsg — AI Sales Agent That Closes Deals While You Sleep',
    description:
      'Automate your sales on WhatsApp with human-like AI conversations and built-in payments.',
    images: ['/aromsg-logo.png'],
  },
  robots: {
    index: true,
    follow: true,
  },
}

export const viewport: Viewport = {
  themeColor: '#0B1410',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable}`}
      data-scroll-behavior="smooth"
    >
      <body className="font-sans antialiased bg-background text-foreground overflow-x-hidden aromsg-loading">
        <Providers>
          {children}
        </Providers>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
